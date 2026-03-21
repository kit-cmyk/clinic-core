import express from 'express';
import { createRequireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { prisma as defaultPrisma } from '../models/prisma.js';

/**
 * Notifications API (CC-54).
 *
 * GET  /notifications           — list unread (or all) notifications for the authenticated user
 * PUT  /notifications/:id/read  — mark a notification as read
 *
 * Auth: notifications:read (all authenticated staff + PATIENT)
 *
 * Notifications are user-scoped: a user only ever sees their own notifications.
 * Created internally when a patient uploads a document (patients.js upload route).
 *
 * Injectable dependencies for full unit testability.
 */
export function createNotificationsRouter({
  prismaClient = defaultPrisma,
  authMiddlewareFactory,
} = {}) {
  const router = express.Router();
  const requireAuth = authMiddlewareFactory
    ? authMiddlewareFactory({ prismaClient })
    : createRequireAuth({ prismaClient });

  // ── GET /notifications ────────────────────────────────────────────────────
  // Returns notifications for the authenticated user.
  // ?unreadOnly=true  → only unread (default)
  // ?unreadOnly=false → all
  router.get('/', requireAuth, requirePermission('notifications:read'), async (req, res, next) => {
    try {
      const page      = Math.max(1, parseInt(req.query.page) || 1);
      const limit     = Math.min(100, parseInt(req.query.limit) || 20);
      const skip      = (page - 1) * limit;
      const unreadOnly = req.query.unreadOnly !== 'false';

      const where = {
        userId:   req.user.id,
        tenantId: req.tenantId,
        ...(unreadOnly && { isRead: false }),
      };

      const [notifications, total] = await Promise.all([
        prismaClient.notification.findMany({
          where,
          skip,
          take:    limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id:           true,
            type:         true,
            title:        true,
            body:         true,
            resourceType: true,
            resourceId:   true,
            isRead:       true,
            readAt:       true,
            createdAt:    true,
          },
        }),
        prismaClient.notification.count({ where }),
      ]);

      return res.json({
        data:       notifications,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    } catch (err) {
      return next(err);
    }
  });

  // ── PUT /notifications/:id/read ───────────────────────────────────────────
  router.put('/:id/read', requireAuth, requirePermission('notifications:read'), async (req, res, next) => {
    try {
      const existing = await prismaClient.notification.findFirst({
        where: { id: req.params.id, userId: req.user.id, tenantId: req.tenantId },
      });

      if (!existing) {
        return res.status(404).json({ error: 'not_found', message: 'Notification not found' });
      }

      const updated = await prismaClient.notification.update({
        where: { id: req.params.id },
        data:  { isRead: true, readAt: new Date() },
        select: {
          id:           true,
          type:         true,
          title:        true,
          body:         true,
          isRead:       true,
          readAt:       true,
          createdAt:    true,
        },
      });

      return res.json(updated);
    } catch (err) {
      return next(err);
    }
  });

  return router;
}

export default createNotificationsRouter();
