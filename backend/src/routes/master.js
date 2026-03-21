import express from 'express';
import { createRequireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/auth.js';
import { prisma as defaultPrisma } from '../models/prisma.js';

/**
 * Factory for /api/v1/master — global master data (CC-121).
 * Manages Specialties, AppointmentTypes, ServiceCategories.
 * All write operations require SUPER_ADMIN.
 * Read operations are open to any authenticated user.
 */
export function createMasterRouter({
  prismaClient = defaultPrisma,
  authMiddlewareFactory,
} = {}) {
  const router = express.Router();
  const requireAuth = authMiddlewareFactory
    ? authMiddlewareFactory({ prismaClient })
    : createRequireAuth({ prismaClient });

  // ── Specialties ────────────────────────────────────────────────────────────

  router.get('/specialties', requireAuth, async (_req, res, next) => {
    try {
      const items = await prismaClient.specialty.findMany({
        orderBy: { name: 'asc' },
      });
      return res.json(items);
    } catch (err) {
      return next(err);
    }
  });

  router.post('/specialties', requireAuth, requireRole('SUPER_ADMIN'), async (req, res, next) => {
    try {
      const { name } = req.body;
      if (!name?.trim()) {
        return res.status(400).json({ error: 'validation_error', message: 'name is required' });
      }
      const item = await prismaClient.specialty.create({ data: { name: name.trim() } });
      return res.status(201).json(item);
    } catch (err) {
      if (err.code === 'P2002') {
        return res.status(409).json({ error: 'conflict', message: 'Specialty already exists' });
      }
      return next(err);
    }
  });

  router.patch('/specialties/:id', requireAuth, requireRole('SUPER_ADMIN'), async (req, res, next) => {
    try {
      const { id } = req.params;
      const { name, isActive } = req.body;
      const data = {};
      if (name !== undefined) data.name = name.trim();
      if (isActive !== undefined) data.isActive = isActive;
      const item = await prismaClient.specialty.update({ where: { id }, data });
      return res.json(item);
    } catch (err) {
      if (err.code === 'P2025') {
        return res.status(404).json({ error: 'not_found', message: 'Specialty not found' });
      }
      return next(err);
    }
  });

  // ── Appointment Types ──────────────────────────────────────────────────────

  router.get('/appointment-types', requireAuth, async (_req, res, next) => {
    try {
      const items = await prismaClient.appointmentType.findMany({
        orderBy: { name: 'asc' },
      });
      return res.json(items);
    } catch (err) {
      return next(err);
    }
  });

  router.post('/appointment-types', requireAuth, requireRole('SUPER_ADMIN'), async (req, res, next) => {
    try {
      const { name, defaultMinutes } = req.body;
      if (!name?.trim()) {
        return res.status(400).json({ error: 'validation_error', message: 'name is required' });
      }
      const item = await prismaClient.appointmentType.create({
        data: { name: name.trim(), ...(defaultMinutes !== undefined && { defaultMinutes: Number(defaultMinutes) }) },
      });
      return res.status(201).json(item);
    } catch (err) {
      if (err.code === 'P2002') {
        return res.status(409).json({ error: 'conflict', message: 'AppointmentType already exists' });
      }
      return next(err);
    }
  });

  router.patch('/appointment-types/:id', requireAuth, requireRole('SUPER_ADMIN'), async (req, res, next) => {
    try {
      const { id } = req.params;
      const { name, defaultMinutes, isActive } = req.body;
      const data = {};
      if (name !== undefined) data.name = name.trim();
      if (defaultMinutes !== undefined) data.defaultMinutes = Number(defaultMinutes);
      if (isActive !== undefined) data.isActive = isActive;
      const item = await prismaClient.appointmentType.update({ where: { id }, data });
      return res.json(item);
    } catch (err) {
      if (err.code === 'P2025') {
        return res.status(404).json({ error: 'not_found', message: 'AppointmentType not found' });
      }
      return next(err);
    }
  });

  // ── Service Categories ─────────────────────────────────────────────────────

  router.get('/service-categories', requireAuth, async (_req, res, next) => {
    try {
      const items = await prismaClient.serviceCategory.findMany({
        orderBy: { name: 'asc' },
      });
      return res.json(items);
    } catch (err) {
      return next(err);
    }
  });

  router.post('/service-categories', requireAuth, requireRole('SUPER_ADMIN'), async (req, res, next) => {
    try {
      const { name } = req.body;
      if (!name?.trim()) {
        return res.status(400).json({ error: 'validation_error', message: 'name is required' });
      }
      const item = await prismaClient.serviceCategory.create({ data: { name: name.trim() } });
      return res.status(201).json(item);
    } catch (err) {
      if (err.code === 'P2002') {
        return res.status(409).json({ error: 'conflict', message: 'ServiceCategory already exists' });
      }
      return next(err);
    }
  });

  router.patch('/service-categories/:id', requireAuth, requireRole('SUPER_ADMIN'), async (req, res, next) => {
    try {
      const { id } = req.params;
      const { name, isActive } = req.body;
      const data = {};
      if (name !== undefined) data.name = name.trim();
      if (isActive !== undefined) data.isActive = isActive;
      const item = await prismaClient.serviceCategory.update({ where: { id }, data });
      return res.json(item);
    } catch (err) {
      if (err.code === 'P2025') {
        return res.status(404).json({ error: 'not_found', message: 'ServiceCategory not found' });
      }
      return next(err);
    }
  });

  return router;
}

export default createMasterRouter();
