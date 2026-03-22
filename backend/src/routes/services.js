import express from 'express';
import { createRequireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { prisma as defaultPrisma } from '../models/prisma.js';

/**
 * Services catalog API (CC-162).
 *
 * GET    /services                — list all services for the tenant
 * POST   /services                — create a service
 * PUT    /services/:id            — update a service
 * PATCH  /services/:id/deactivate — deactivate
 * PATCH  /services/:id/reactivate — reactivate
 *
 * Price is stored as priceCents (minor units); API accepts/returns price (whole units).
 * Requires: services:read / services:create / services:update / services:delete
 */
export function createServicesRouter({
  prismaClient = defaultPrisma,
  authMiddlewareFactory,
} = {}) {
  const router = express.Router();
  const requireAuth = authMiddlewareFactory
    ? authMiddlewareFactory({ prismaClient })
    : createRequireAuth({ prismaClient });

  const formatService = (s) => ({
    id:          s.id,
    name:        s.name,
    category:    s.category,
    price:       s.priceCents / 100,
    description: s.description ?? '',
    isActive:    s.isActive,
  });

  // ── GET /services ───────────────────────────────────────────────────────────
  router.get('/', requireAuth, requirePermission('services:read'), async (req, res, next) => {
    try {
      const services = await prismaClient.service.findMany({
        where: { tenantId: req.tenantId },
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
      });
      return res.json({ data: services.map(formatService), total: services.length });
    } catch (err) {
      return next(err);
    }
  });

  // ── POST /services ──────────────────────────────────────────────────────────
  router.post('/', requireAuth, requirePermission('services:create'), async (req, res, next) => {
    try {
      const { name, category, price, description } = req.body;
      if (!name?.trim() || category === undefined || price === undefined) {
        return res.status(400).json({ error: 'bad_request', message: 'name, category, and price are required' });
      }
      const priceCents = Math.round(Number(price) * 100);
      if (isNaN(priceCents) || priceCents < 0) {
        return res.status(400).json({ error: 'bad_request', message: 'price must be a non-negative number' });
      }

      const service = await prismaClient.service.create({
        data: {
          tenantId:    req.tenantId,
          name:        name.trim(),
          category,
          priceCents,
          description: description?.trim() ?? null,
        },
      });

      req.audit({ action: 'service.created', resourceType: 'Service', resourceId: service.id });
      return res.status(201).json({ data: formatService(service) });
    } catch (err) {
      return next(err);
    }
  });

  // ── PUT /services/:id ───────────────────────────────────────────────────────
  router.put('/:id', requireAuth, requirePermission('services:update'), async (req, res, next) => {
    try {
      const existing = await prismaClient.service.findFirst({
        where: { id: req.params.id, tenantId: req.tenantId },
      });
      if (!existing) {
        return res.status(404).json({ error: 'not_found', message: 'Service not found' });
      }

      const { name, category, price, description } = req.body;
      const priceCents = Math.round(Number(price) * 100);
      if (isNaN(priceCents) || priceCents < 0) {
        return res.status(400).json({ error: 'bad_request', message: 'price must be a non-negative number' });
      }

      const service = await prismaClient.service.update({
        where: { id: req.params.id },
        data: {
          name:        name?.trim() ?? existing.name,
          category:    category ?? existing.category,
          priceCents,
          description: description?.trim() ?? existing.description,
        },
      });

      req.audit({ action: 'service.updated', resourceType: 'Service', resourceId: service.id });
      return res.json({ data: formatService(service) });
    } catch (err) {
      return next(err);
    }
  });

  // ── PATCH /services/:id/deactivate ─────────────────────────────────────────
  router.patch('/:id/deactivate', requireAuth, requirePermission('services:update'), async (req, res, next) => {
    try {
      const existing = await prismaClient.service.findFirst({
        where: { id: req.params.id, tenantId: req.tenantId },
      });
      if (!existing) {
        return res.status(404).json({ error: 'not_found', message: 'Service not found' });
      }
      const service = await prismaClient.service.update({
        where: { id: req.params.id },
        data: { isActive: false },
      });
      return res.json({ data: formatService(service) });
    } catch (err) {
      return next(err);
    }
  });

  // ── PATCH /services/:id/reactivate ─────────────────────────────────────────
  router.patch('/:id/reactivate', requireAuth, requirePermission('services:update'), async (req, res, next) => {
    try {
      const existing = await prismaClient.service.findFirst({
        where: { id: req.params.id, tenantId: req.tenantId },
      });
      if (!existing) {
        return res.status(404).json({ error: 'not_found', message: 'Service not found' });
      }
      const service = await prismaClient.service.update({
        where: { id: req.params.id },
        data: { isActive: true },
      });
      return res.json({ data: formatService(service) });
    } catch (err) {
      return next(err);
    }
  });

  return router;
}

export default createServicesRouter();
