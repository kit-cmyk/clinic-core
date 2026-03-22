import express from 'express';
import { createRequireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { prisma as defaultPrisma } from '../models/prisma.js';

/**
 * Clinic Hours API (CC-161).
 *
 * GET  /clinic-hours?branchId=xxx   — list weekly hours for a branch
 * PUT  /clinic-hours                — bulk upsert all 7 days for a branch
 *
 * Requires: clinic-hours:read / clinic-hours:update
 */
export function createClinicHoursRouter({
  prismaClient = defaultPrisma,
  authMiddlewareFactory,
} = {}) {
  const router = express.Router();
  const requireAuth = authMiddlewareFactory
    ? authMiddlewareFactory({ prismaClient })
    : createRequireAuth({ prismaClient });

  // ── GET /clinic-hours?branchId=xxx ─────────────────────────────────────────
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

      const hours = await prismaClient.clinicHours.findMany({
        where: { branchId, tenantId: req.tenantId },
        orderBy: { weekday: 'asc' },
      });

      return res.json({ data: hours, total: hours.length });
    } catch (err) {
      return next(err);
    }
  });

  // ── PUT /clinic-hours — bulk upsert all 7 days ──────────────────────────────
  router.put('/', requireAuth, requirePermission('clinic-hours:update'), async (req, res, next) => {
    try {
      const { branchId, hours } = req.body;
      if (!branchId || !Array.isArray(hours)) {
        return res.status(400).json({ error: 'bad_request', message: 'branchId and hours[] are required' });
      }

      const branch = await prismaClient.branch.findFirst({
        where: { id: branchId, tenantId: req.tenantId },
      });
      if (!branch) {
        return res.status(404).json({ error: 'not_found', message: 'Branch not found' });
      }

      const results = await Promise.all(
        hours.map(h => prismaClient.clinicHours.upsert({
          where: { branchId_weekday: { branchId, weekday: h.weekday } },
          update: { openTime: h.openTime, closeTime: h.closeTime, isClosed: h.isClosed },
          create: {
            tenantId: req.tenantId,
            branchId,
            weekday:   h.weekday,
            openTime:  h.openTime,
            closeTime: h.closeTime,
            isClosed:  h.isClosed,
          },
        }))
      );

      req.audit({ action: 'clinic-hours.updated', resourceType: 'Branch', resourceId: branchId });
      return res.json({ data: results, total: results.length });
    } catch (err) {
      return next(err);
    }
  });

  return router;
}

export default createClinicHoursRouter();
