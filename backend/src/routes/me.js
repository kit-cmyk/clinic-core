import express from 'express';
import { createRequireAuth } from '../middleware/auth.js';
import { prisma as defaultPrisma } from '../models/prisma.js';

/**
 * Factory for the /me router.
 * Returns the authenticated user's profile from Prisma.
 * Injectable dependencies for testability.
 */
export function createMeRouter({
  prismaClient = defaultPrisma,
  authMiddlewareFactory,
} = {}) {
  const router = express.Router();
  const requireAuth = authMiddlewareFactory
    ? authMiddlewareFactory({ prismaClient })
    : createRequireAuth({ prismaClient });

  // GET /me — returns the current user's profile
  router.get('/', requireAuth, async (req, res, next) => {
    try {
      const user = await prismaClient.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          tenantId: true,
          isActive: true,
          tenant: {
            select: {
              name: true,
              organizations: {
                select: { address: true },
                take: 1,
              },
            },
          },
          staffAssignments: {
            where: { isPrimary: true },
            select: { branchId: true },
            take: 1,
          },
        },
      });

      if (!user) {
        return res.status(404).json({ error: 'not_found', message: 'User not found' });
      }

      return res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
        orgName: user.tenant?.name ?? null,
        orgAddress: user.tenant?.organizations?.[0]?.address ?? null,
        branchId: user.staffAssignments[0]?.branchId ?? null,
      });
    } catch (err) {
      return next(err);
    }
  });

  return router;
}

export default createMeRouter();
