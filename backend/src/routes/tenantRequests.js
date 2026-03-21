import express from 'express';
import { createRequireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/auth.js';
import { prisma as defaultPrisma } from '../models/prisma.js';
import { parsePagination, paginatedResponse } from '../lib/pagination.js';

/**
 * Factory for /api/v1/tenant-requests — sign-up review workflow (CC-119).
 * Super Admin reviews, approves, or rejects incoming tenant sign-up requests.
 */
export function createTenantRequestsRouter({
  prismaClient = defaultPrisma,
  authMiddlewareFactory,
} = {}) {
  const router = express.Router();
  const requireAuth = authMiddlewareFactory
    ? authMiddlewareFactory({ prismaClient })
    : createRequireAuth({ prismaClient });

  // GET /tenant-requests — list all (filterable by status, paginated)
  router.get('/', requireAuth, requireRole('SUPER_ADMIN'), async (req, res, next) => {
    try {
      const { status } = req.query;
      const { page, limit, skip } = parsePagination(req.query);
      const where = status ? { status } : {};
      const [requests, total] = await Promise.all([
        prismaClient.tenantRequest.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
        prismaClient.tenantRequest.count({ where }),
      ]);
      return res.json(paginatedResponse(requests, total, page, limit));
    } catch (err) {
      return next(err);
    }
  });

  // GET /tenant-requests/:id — single request
  router.get('/:id', requireAuth, requireRole('SUPER_ADMIN'), async (req, res, next) => {
    try {
      const request = await prismaClient.tenantRequest.findUnique({
        where: { id: req.params.id },
        include: { provisioningLogs: { orderBy: { step: 'asc' } } },
      });
      if (!request) {
        return res.status(404).json({ error: 'not_found', message: 'TenantRequest not found' });
      }
      return res.json(request);
    } catch (err) {
      return next(err);
    }
  });

  // POST /tenant-requests — submit a new sign-up (public — no auth required)
  router.post('/', async (req, res, next) => {
    try {
      const { orgName, contactName, contactEmail, contactPhone, planRequested, notes } = req.body;
      if (!orgName?.trim() || !contactName?.trim() || !contactEmail?.trim()) {
        return res.status(400).json({
          error: 'validation_error',
          message: 'orgName, contactName, and contactEmail are required',
        });
      }
      const request = await prismaClient.tenantRequest.create({
        data: {
          orgName: orgName.trim(),
          contactName: contactName.trim(),
          contactEmail: contactEmail.trim(),
          contactPhone: contactPhone?.trim() ?? null,
          planRequested: planRequested ?? 'PRO',
          notes: notes?.trim() ?? null,
        },
      });
      return res.status(201).json(request);
    } catch (err) {
      return next(err);
    }
  });

  // POST /tenant-requests/:id/approve — approve a pending request
  router.post('/:id/approve', requireAuth, requireRole('SUPER_ADMIN'), async (req, res, next) => {
    try {
      const existing = await prismaClient.tenantRequest.findUnique({
        where: { id: req.params.id },
      });
      if (!existing) {
        return res.status(404).json({ error: 'not_found', message: 'TenantRequest not found' });
      }
      if (existing.status !== 'PENDING') {
        return res.status(409).json({ error: 'conflict', message: 'Only PENDING requests can be approved' });
      }
      const updated = await prismaClient.tenantRequest.update({
        where: { id: req.params.id },
        data: { status: 'APPROVED', reviewedAt: new Date() },
      });
      return res.json(updated);
    } catch (err) {
      return next(err);
    }
  });

  // POST /tenant-requests/:id/reject — reject a pending request
  router.post('/:id/reject', requireAuth, requireRole('SUPER_ADMIN'), async (req, res, next) => {
    try {
      const { rejectionReason } = req.body;
      if (!rejectionReason?.trim()) {
        return res.status(400).json({ error: 'validation_error', message: 'rejectionReason is required' });
      }
      const existing = await prismaClient.tenantRequest.findUnique({
        where: { id: req.params.id },
      });
      if (!existing) {
        return res.status(404).json({ error: 'not_found', message: 'TenantRequest not found' });
      }
      if (existing.status !== 'PENDING') {
        return res.status(409).json({ error: 'conflict', message: 'Only PENDING requests can be rejected' });
      }
      const updated = await prismaClient.tenantRequest.update({
        where: { id: req.params.id },
        data: { status: 'REJECTED', reviewedAt: new Date(), rejectionReason: rejectionReason.trim() },
      });
      return res.json(updated);
    } catch (err) {
      return next(err);
    }
  });

  return router;
}

export default createTenantRequestsRouter();
