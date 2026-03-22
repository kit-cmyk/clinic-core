import express from 'express';
import { createRequireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { prisma as defaultPrisma } from '../models/prisma.js';

/**
 * Special Closures API (CC-161).
 *
 * GET    /special-closures?branchId=xxx  — list closures for a branch
 * POST   /special-closures               — add a closure
 * DELETE /special-closures/:id           — remove a closure
 *
 * date is stored as DateTime in DB; returned as 'YYYY-MM-DD' string.
 * Requires: clinic-hours:read / clinic-hours:update
 */
export function createSpecialClosuresRouter({
  prismaClient = defaultPrisma,
  authMiddlewareFactory,
} = {}) {
  const router = express.Router();
  const requireAuth = authMiddlewareFactory
    ? authMiddlewareFactory({ prismaClient })
    : createRequireAuth({ prismaClient });

  const formatClosure = (c) => ({
    id:       c.id,
    tenantId: c.tenantId,
    branchId: c.branchId,
    date:     c.date instanceof Date ? c.date.toISOString().substring(0, 10) : c.date,
    reason:   c.reason ?? '',
  });

  // ── GET /special-closures?branchId=xxx ─────────────────────────────────────
  router.get('/', requireAuth, requirePermission('clinic-hours:read'), async (req, res, next) => {
    try {
      const { branchId } = req.query;
      if (!branchId) {
        return res.status(400).json({ error: 'bad_request', message: 'branchId is required' });
      }

      const branch = await prismaClient.branch.findFirst({
        where: { id: branchId, tenantId: req.tenantId },
      });
      if (!branch) {
        return res.status(404).json({ error: 'not_found', message: 'Branch not found' });
      }

      const closures = await prismaClient.specialClosure.findMany({
        where: { branchId, tenantId: req.tenantId },
        orderBy: { date: 'asc' },
      });

      return res.json({ data: closures.map(formatClosure), total: closures.length });
    } catch (err) {
      return next(err);
    }
  });

  // ── POST /special-closures ──────────────────────────────────────────────────
  router.post('/', requireAuth, requirePermission('clinic-hours:update'), async (req, res, next) => {
    try {
      const { branchId, date, reason } = req.body;
      if (!branchId || !date) {
        return res.status(400).json({ error: 'bad_request', message: 'branchId and date are required' });
      }

      const branch = await prismaClient.branch.findFirst({
        where: { id: branchId, tenantId: req.tenantId },
      });
      if (!branch) {
        return res.status(404).json({ error: 'not_found', message: 'Branch not found' });
      }

      const closure = await prismaClient.specialClosure.create({
        data: {
          tenantId: req.tenantId,
          branchId,
          date:   new Date(date),
          reason: reason ?? null,
        },
      });

      req.audit({ action: 'special-closure.created', resourceType: 'SpecialClosure', resourceId: closure.id });
      return res.status(201).json({ data: formatClosure(closure) });
    } catch (err) {
      return next(err);
    }
  });

  // ── DELETE /special-closures/:id ───────────────────────────────────────────
  router.delete('/:id', requireAuth, requirePermission('clinic-hours:update'), async (req, res, next) => {
    try {
      const existing = await prismaClient.specialClosure.findFirst({
        where: { id: req.params.id, tenantId: req.tenantId },
      });
      if (!existing) {
        return res.status(404).json({ error: 'not_found', message: 'Special closure not found' });
      }

      await prismaClient.specialClosure.delete({ where: { id: req.params.id } });

      req.audit({ action: 'special-closure.deleted', resourceType: 'SpecialClosure', resourceId: req.params.id });
      return res.status(204).send();
    } catch (err) {
      return next(err);
    }
  });

  return router;
}

export default createSpecialClosuresRouter();
