import express from 'express';
import { createRequireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { prisma as defaultPrisma } from '../models/prisma.js';

/**
 * Professionals API (CC-137).
 *
 * GET /professionals           — list active professionals for tenant
 * GET /professionals/:id       — single professional + schedules + time-offs
 *
 * All routes require authentication. Clinical staff can read; ORG_ADMIN manages.
 * Injectable dependencies for full unit testability.
 */
export function createProfessionalsRouter({
  prismaClient = defaultPrisma,
  authMiddlewareFactory,
} = {}) {
  const router = express.Router();
  const requireAuth = authMiddlewareFactory
    ? authMiddlewareFactory({ prismaClient })
    : createRequireAuth({ prismaClient });

  // ── GET /professionals ────────────────────────────────────────────────────
  router.get('/', requireAuth, requirePermission('professionals:read'), async (req, res, next) => {
    try {
      const isActive = req.query.isActive !== undefined
        ? req.query.isActive === 'true'
        : true; // default: only active

      const professionals = await prismaClient.professional.findMany({
        where: { tenantId: req.tenantId, isActive },
        orderBy: [
          { user: { lastName: 'asc' } },
          { user: { firstName: 'asc' } },
        ],
        select: {
          id:               true,
          tenantId:         true,
          userId:           true,
          specialization:   true,
          bio:              true,
          slotDurationMins: true,
          isActive:         true,
          createdAt:        true,
          updatedAt:        true,
          user: {
            select: {
              firstName: true,
              lastName:  true,
              email:     true,
              role:      true,
            },
          },
          schedules: {
            select: {
              id:        true,
              branchId:  true,
              weekday:   true,
              startTime: true,
              endTime:   true,
            },
          },
        },
      });

      return res.json({ data: professionals });
    } catch (err) {
      return next(err);
    }
  });

  // ── GET /professionals/:id ────────────────────────────────────────────────
  router.get('/:id', requireAuth, requirePermission('professionals:read'), async (req, res, next) => {
    try {
      const professional = await prismaClient.professional.findFirst({
        where: { id: req.params.id, tenantId: req.tenantId },
        select: {
          id:               true,
          tenantId:         true,
          userId:           true,
          specialization:   true,
          bio:              true,
          slotDurationMins: true,
          isActive:         true,
          createdAt:        true,
          updatedAt:        true,
          user: {
            select: {
              firstName: true,
              lastName:  true,
              email:     true,
              role:      true,
            },
          },
          schedules: {
            select: {
              id:        true,
              branchId:  true,
              weekday:   true,
              startTime: true,
              endTime:   true,
            },
          },
          timeOffs: {
            where: {
              endDate: { gte: new Date() }, // only upcoming / ongoing time-offs
            },
            select: {
              id:        true,
              startDate: true,
              endDate:   true,
              reason:    true,
            },
            orderBy: { startDate: 'asc' },
          },
        },
      });

      if (!professional) {
        return res.status(404).json({ error: 'not_found', message: 'Professional not found' });
      }

      return res.json(professional);
    } catch (err) {
      return next(err);
    }
  });

  return router;
}

export default createProfessionalsRouter();
