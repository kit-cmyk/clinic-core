import express from 'express';
import { createRequireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { prisma as defaultPrisma } from '../models/prisma.js';

/**
 * Staff management API (CC-167).
 *
 * GET    /staff                       — list all non-patient users in the tenant
 * PATCH  /staff/:userId/deactivate    — deactivate a staff member (isActive = false)
 * PATCH  /staff/:userId/reactivate    — reactivate a staff member (isActive = true)
 *
 * Invite flow reuses POST /api/v1/invitations (CC-22).
 *
 * Requires: staff:read / staff:update / staff:deactivate (ORG_ADMIN + SUPER_ADMIN).
 */
export function createStaffRouter({
  prismaClient = defaultPrisma,
  authMiddlewareFactory,
} = {}) {
  const router = express.Router();
  const requireAuth = authMiddlewareFactory
    ? authMiddlewareFactory({ prismaClient })
    : createRequireAuth({ prismaClient });

  // ── GET /staff ─────────────────────────────────────────────────────────────
  // List all staff (non-patient) users for this tenant, ordered by name.
  router.get('/', requireAuth, requirePermission('staff:read'), async (req, res, next) => {
    try {
      const users = await prismaClient.user.findMany({
        where: {
          tenantId: req.tenantId,
          role: { not: 'PATIENT' },
        },
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
        select: {
          id:          true,
          firstName:   true,
          lastName:    true,
          email:       true,
          role:        true,
          isActive:    true,
          createdAt:   true,
          staffAssignments: {
            where: { isActive: true },
            take: 1,
            select: {
              branch: { select: { id: true, name: true } },
            },
          },
        },
      });

      const data = users.map(u => ({
        id:        u.id,
        firstName: u.firstName,
        lastName:  u.lastName,
        email:     u.email,
        role:      u.role,
        isActive:  u.isActive,
        createdAt: u.createdAt,
        branch:    u.staffAssignments[0]?.branch ?? null,
      }));

      return res.json({ data, total: data.length });
    } catch (err) {
      return next(err);
    }
  });

  // ── PATCH /staff/:userId/deactivate ───────────────────────────────────────
  router.patch('/:userId/deactivate', requireAuth, requirePermission('staff:deactivate'), async (req, res, next) => {
    try {
      const existing = await prismaClient.user.findFirst({
        where: { id: req.params.userId, tenantId: req.tenantId, role: { not: 'PATIENT' } },
      });

      if (!existing) {
        return res.status(404).json({ error: 'not_found', message: 'Staff member not found' });
      }

      const user = await prismaClient.user.update({
        where: { id: req.params.userId },
        data: { isActive: false },
        select: { id: true, isActive: true },
      });

      req.audit({ action: 'staff.deactivated', resourceType: 'User', resourceId: user.id });
      return res.json(user);
    } catch (err) {
      return next(err);
    }
  });

  // ── PATCH /staff/:userId/reactivate ───────────────────────────────────────
  router.patch('/:userId/reactivate', requireAuth, requirePermission('staff:update'), async (req, res, next) => {
    try {
      const existing = await prismaClient.user.findFirst({
        where: { id: req.params.userId, tenantId: req.tenantId, role: { not: 'PATIENT' } },
      });

      if (!existing) {
        return res.status(404).json({ error: 'not_found', message: 'Staff member not found' });
      }

      const user = await prismaClient.user.update({
        where: { id: req.params.userId },
        data: { isActive: true },
        select: { id: true, isActive: true },
      });

      req.audit({ action: 'staff.reactivated', resourceType: 'User', resourceId: user.id });
      return res.json(user);
    } catch (err) {
      return next(err);
    }
  });

  return router;
}

export default createStaffRouter();
