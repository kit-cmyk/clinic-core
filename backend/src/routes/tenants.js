import express from 'express';
import { createRequireAuth, requireRole } from '../middleware/auth.js';
import { prisma as defaultPrisma } from '../models/prisma.js';
import { getTenantStorageUsed, enforceStorageLimit } from '../middleware/storageLimit.js';
import { createStorageService } from '../services/storage.js';
import { writeAuditLog } from '../lib/auditLog.js';

/**
 * Tenant management API (CC-28).
 *
 * All routes require SUPER_ADMIN.
 *
 * GET  /tenants              — list tenants (paginated, filterable by status/plan)
 * GET  /tenants/:id          — get single tenant with stats
 * POST /tenants              — create tenant (manual provisioning)
 * PUT  /tenants/:id          — update plan or active status
 *
 * Injectable dependencies for full unit testability.
 */
export function createTenantsRouter({
  prismaClient = defaultPrisma,
  authMiddlewareFactory,
  storageServiceInstance = null,
} = {}) {
  const router = express.Router();
  const requireAuth = authMiddlewareFactory
    ? authMiddlewareFactory({ prismaClient })
    : createRequireAuth({ prismaClient });

  const superAdminOnly = [requireAuth, requireRole('SUPER_ADMIN')];

  // ── GET /tenants ──────────────────────────────────────────────────────────
  router.get('/', ...superAdminOnly, async (req, res, next) => {
    try {
      const page   = Math.max(1, parseInt(req.query.page)  || 1);
      const limit  = Math.min(100, parseInt(req.query.limit) || 20);
      const skip   = (page - 1) * limit;
      const search = req.query.search?.trim() || undefined;
      const active = req.query.active !== undefined
        ? req.query.active === 'true'
        : undefined;

      const where = {
        ...(search && {
          OR: [
            { name:  { contains: search, mode: 'insensitive' } },
            { slug:  { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(active !== undefined && { isActive: active }),
      };

      const [tenants, total] = await Promise.all([
        prismaClient.tenant.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id:                true,
            name:              true,
            slug:              true,
            plan:              true,
            isActive:          true,
            storageLimitBytes: true,
            createdAt:         true,
            _count: {
              select: { users: true, branches: true },
            },
          },
        }),
        prismaClient.tenant.count({ where }),
      ]);

      req.audit({ action: 'tenant.listed', metadata: { search, page, limit } });
      return res.json({
        data: tenants.map(serialiseTenant),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    } catch (err) {
      return next(err);
    }
  });

  // ── GET /tenants/:id ──────────────────────────────────────────────────────
  router.get('/:id', ...superAdminOnly, async (req, res, next) => {
    try {
      const tenant = await prismaClient.tenant.findUnique({
        where: { id: req.params.id },
        include: {
          _count: { select: { users: true, branches: true } },
        },
      });

      if (!tenant) {
        return res.status(404).json({ error: 'not_found', message: 'Tenant not found' });
      }

      req.audit({ action: 'tenant.viewed', resourceType: 'Tenant', resourceId: req.params.id });
      return res.json(serialiseTenant(tenant));
    } catch (err) {
      return next(err);
    }
  });

  // ── POST /tenants ─────────────────────────────────────────────────────────
  router.post('/', ...superAdminOnly, async (req, res, next) => {
    const { name, slug, plan, storageLimitBytes } = req.body;

    if (!name || !slug) {
      return res.status(400).json({
        error: 'bad_request',
        message: 'name and slug are required',
      });
    }

    // slug must be URL-safe
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return res.status(400).json({
        error: 'bad_request',
        message: 'slug must contain only lowercase letters, numbers, and hyphens',
      });
    }

    try {
      const tenant = await prismaClient.tenant.create({
        data: {
          name,
          slug,
          plan:              plan              ?? 'FREE',
          storageLimitBytes: storageLimitBytes != null ? BigInt(storageLimitBytes) : undefined,
        },
      });
      return res.status(201).json(serialiseTenant(tenant));
    } catch (err) {
      if (err.code === 'P2002') {
        return res.status(409).json({ error: 'conflict', message: 'A tenant with that slug already exists' });
      }
      return next(err);
    }
  });

  // ── GET /tenants/:id/storage-usage ────────────────────────────────────────
  router.get('/:id/storage-usage', ...superAdminOnly, async (req, res, next) => {
    try {
      const tenant = await prismaClient.tenant.findUnique({
        where: { id: req.params.id },
        select: { id: true, name: true, storageLimitBytes: true },
      });

      if (!tenant) {
        return res.status(404).json({ error: 'not_found', message: 'Tenant not found' });
      }

      const svc = storageServiceInstance ?? createStorageService();
      const usedBytes = await getTenantStorageUsed(svc, tenant.id);
      const limitBytes = Number(tenant.storageLimitBytes);
      const pct = limitBytes > 0 ? Math.round((usedBytes / limitBytes) * 100) : 0;

      return res.json({
        tenantId:         tenant.id,
        tenantName:       tenant.name,
        usedBytes:        usedBytes.toString(),
        limitBytes:       tenant.storageLimitBytes.toString(),
        usedPercent:      pct,
        isOverLimit:      usedBytes > limitBytes,
      });
    } catch (err) {
      return next(err);
    }
  });

  // ── PUT /tenants/:id ──────────────────────────────────────────────────────
  router.put('/:id', ...superAdminOnly, async (req, res, next) => {
    const { plan, isActive, storageLimitBytes, name } = req.body;

    const data = {};
    if (name              != null) data.name              = name;
    if (plan              != null) data.plan              = plan;
    if (isActive          != null) data.isActive          = Boolean(isActive);
    if (storageLimitBytes != null) data.storageLimitBytes = BigInt(storageLimitBytes);

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'bad_request', message: 'No updatable fields provided' });
    }

    try {
      const tenant = await prismaClient.tenant.update({
        where: { id: req.params.id },
        data,
      });
      return res.json(serialiseTenant(tenant));
    } catch (err) {
      if (err.code === 'P2025') {
        return res.status(404).json({ error: 'not_found', message: 'Tenant not found' });
      }
      return next(err);
    }
  });

  return router;
}

/** Serialise BigInt fields to strings for JSON safety. */
function serialiseTenant(tenant) {
  return {
    ...tenant,
    storageLimitBytes: tenant.storageLimitBytes?.toString() ?? null,
  };
}

export default createTenantsRouter();
