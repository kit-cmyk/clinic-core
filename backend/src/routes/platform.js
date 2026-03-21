import express from 'express';
import { createRequireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/auth.js';
import { prisma as defaultPrisma } from '../models/prisma.js';

/**
 * Factory for /api/v1/platform — platform-wide announcements, feature flags,
 * and maintenance windows (CC-126).
 * All writes require SUPER_ADMIN. Reads require any authenticated user.
 */
export function createPlatformRouter({
  prismaClient = defaultPrisma,
  authMiddlewareFactory,
} = {}) {
  const router = express.Router();
  const requireAuth = authMiddlewareFactory
    ? authMiddlewareFactory({ prismaClient })
    : createRequireAuth({ prismaClient });

  // ── Announcements ──────────────────────────────────────────────────────────

  router.get('/announcements', requireAuth, async (req, res, next) => {
    try {
      const showArchived = req.query.archived === 'true';
      const items = await prismaClient.announcement.findMany({
        where: showArchived ? {} : { isArchived: false },
        orderBy: { publishedAt: 'desc' },
      });
      return res.json(items);
    } catch (err) {
      return next(err);
    }
  });

  router.post('/announcements', requireAuth, requireRole('SUPER_ADMIN'), async (req, res, next) => {
    try {
      const { title, body, severity } = req.body;
      if (!title?.trim() || !body?.trim()) {
        return res.status(400).json({ error: 'validation_error', message: 'title and body are required' });
      }
      const item = await prismaClient.announcement.create({
        data: {
          title: title.trim(),
          body: body.trim(),
          ...(severity && { severity }),
        },
      });
      return res.status(201).json(item);
    } catch (err) {
      return next(err);
    }
  });

  router.patch('/announcements/:id/archive', requireAuth, requireRole('SUPER_ADMIN'), async (req, res, next) => {
    try {
      const item = await prismaClient.announcement.update({
        where: { id: req.params.id },
        data: { isArchived: true },
      });
      return res.json(item);
    } catch (err) {
      if (err.code === 'P2025') {
        return res.status(404).json({ error: 'not_found', message: 'Announcement not found' });
      }
      return next(err);
    }
  });

  // ── Feature Flags ──────────────────────────────────────────────────────────

  router.get('/feature-flags', requireAuth, async (_req, res, next) => {
    try {
      const items = await prismaClient.featureFlag.findMany({ orderBy: { key: 'asc' } });
      return res.json(items);
    } catch (err) {
      return next(err);
    }
  });

  router.post('/feature-flags', requireAuth, requireRole('SUPER_ADMIN'), async (req, res, next) => {
    try {
      const { key, label, enabledFor } = req.body;
      if (!key?.trim() || !label?.trim()) {
        return res.status(400).json({ error: 'validation_error', message: 'key and label are required' });
      }
      const item = await prismaClient.featureFlag.create({
        data: {
          key: key.trim(),
          label: label.trim(),
          enabledFor: enabledFor ?? [],
        },
      });
      return res.status(201).json(item);
    } catch (err) {
      if (err.code === 'P2002') {
        return res.status(409).json({ error: 'conflict', message: 'Feature flag key already exists' });
      }
      return next(err);
    }
  });

  router.patch('/feature-flags/:id', requireAuth, requireRole('SUPER_ADMIN'), async (req, res, next) => {
    try {
      const { enabledFor, label } = req.body;
      const data = {};
      if (enabledFor !== undefined) data.enabledFor = enabledFor;
      if (label !== undefined) data.label = label.trim();
      const item = await prismaClient.featureFlag.update({ where: { id: req.params.id }, data });
      return res.json(item);
    } catch (err) {
      if (err.code === 'P2025') {
        return res.status(404).json({ error: 'not_found', message: 'FeatureFlag not found' });
      }
      return next(err);
    }
  });

  // ── Maintenance Windows ────────────────────────────────────────────────────

  router.get('/maintenance', requireAuth, async (_req, res, next) => {
    try {
      const items = await prismaClient.maintenanceWindow.findMany({
        where: { isCancelled: false },
        orderBy: { startsAt: 'asc' },
      });
      return res.json(items);
    } catch (err) {
      return next(err);
    }
  });

  router.post('/maintenance', requireAuth, requireRole('SUPER_ADMIN'), async (req, res, next) => {
    try {
      const { title, startsAt, endsAt } = req.body;
      if (!title?.trim() || !startsAt || !endsAt) {
        return res.status(400).json({ error: 'validation_error', message: 'title, startsAt, and endsAt are required' });
      }
      const item = await prismaClient.maintenanceWindow.create({
        data: { title: title.trim(), startsAt: new Date(startsAt), endsAt: new Date(endsAt) },
      });
      return res.status(201).json(item);
    } catch (err) {
      return next(err);
    }
  });

  router.patch('/maintenance/:id/cancel', requireAuth, requireRole('SUPER_ADMIN'), async (req, res, next) => {
    try {
      const item = await prismaClient.maintenanceWindow.update({
        where: { id: req.params.id },
        data: { isCancelled: true },
      });
      return res.json(item);
    } catch (err) {
      if (err.code === 'P2025') {
        return res.status(404).json({ error: 'not_found', message: 'MaintenanceWindow not found' });
      }
      return next(err);
    }
  });

  return router;
}

export default createPlatformRouter();
