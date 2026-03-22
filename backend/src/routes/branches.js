import express from 'express';
import { createRequireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { prisma as defaultPrisma } from '../models/prisma.js';

/**
 * Branch management API (CC-34).
 *
 * POST   /branches       — create a branch under the tenant's organization
 * GET    /branches       — list all active branches for the tenant
 * PUT    /branches/:id   — update branch details
 * DELETE /branches/:id   — soft-delete (set isActive: false)
 *
 * Auth: ORG_ADMIN or SUPER_ADMIN only (branches:* permissions).
 * Branches are tenant-scoped — Org A never sees Org B branches.
 *
 * Injectable dependencies for full unit testability.
 */
export function createBranchesRouter({
  prismaClient = defaultPrisma,
  authMiddlewareFactory,
} = {}) {
  const router = express.Router();
  const requireAuth = authMiddlewareFactory
    ? authMiddlewareFactory({ prismaClient })
    : createRequireAuth({ prismaClient });

  // ── GET /branches ─────────────────────────────────────────────────────────
  router.get('/', requireAuth, requirePermission('branches:read'), async (req, res, next) => {
    try {
      const branches = await prismaClient.branch.findMany({
        where: { tenantId: req.tenantId, isActive: true },
        orderBy: { createdAt: 'asc' },
        select: {
          id:             true,
          organizationId: true,
          name:           true,
          address:        true,
          phone:          true,
          isActive:       true,
          createdAt:      true,
          updatedAt:      true,
        },
      });
      return res.json({ data: branches, total: branches.length });
    } catch (err) {
      return next(err);
    }
  });

  // ── POST /branches ────────────────────────────────────────────────────────
  router.post('/', requireAuth, requirePermission('branches:create'), async (req, res, next) => {
    const { name, address, phone } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'bad_request', message: 'name is required' });
    }

    try {
      // Resolve the tenant's organization (auto-create if missing)
      let org = await prismaClient.organization.findFirst({
        where: { tenantId: req.tenantId },
        select: { id: true },
      });

      if (!org) {
        const tenant = await prismaClient.tenant.findUnique({
          where: { id: req.tenantId },
          select: { name: true },
        });
        org = await prismaClient.organization.create({
          data: { tenantId: req.tenantId, name: tenant?.name ?? 'My Organization' },
          select: { id: true },
        });
      }

      const branch = await prismaClient.branch.create({
        data: {
          tenantId:       req.tenantId,
          organizationId: org.id,
          name,
          address:        address ?? null,
          phone:          phone   ?? null,
        },
      });

      return res.status(201).json(branch);
    } catch (err) {
      return next(err);
    }
  });

  // ── PUT /branches/:id ─────────────────────────────────────────────────────
  router.put('/:id', requireAuth, requirePermission('branches:update'), async (req, res, next) => {
    const { name, address, phone } = req.body;

    const data = {};
    if (name    != null) data.name    = name;
    if (address != null) data.address = address;
    if (phone   != null) data.phone   = phone;

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'bad_request', message: 'No updatable fields provided' });
    }

    try {
      // Verify branch belongs to this tenant before updating
      const existing = await prismaClient.branch.findFirst({
        where: { id: req.params.id, tenantId: req.tenantId },
      });

      if (!existing) {
        return res.status(404).json({ error: 'not_found', message: 'Branch not found' });
      }

      const branch = await prismaClient.branch.update({
        where: { id: req.params.id },
        data,
      });

      return res.json(branch);
    } catch (err) {
      return next(err);
    }
  });

  // ── DELETE /branches/:id ──────────────────────────────────────────────────
  // Soft-delete: sets isActive = false. Historical data (appointments, etc.) retained.
  router.delete('/:id', requireAuth, requirePermission('branches:delete'), async (req, res, next) => {
    try {
      const existing = await prismaClient.branch.findFirst({
        where: { id: req.params.id, tenantId: req.tenantId },
      });

      if (!existing) {
        return res.status(404).json({ error: 'not_found', message: 'Branch not found' });
      }

      await prismaClient.branch.update({
        where: { id: req.params.id },
        data: { isActive: false },
      });

      return res.status(204).send();
    } catch (err) {
      return next(err);
    }
  });

  return router;
}

export default createBranchesRouter();
