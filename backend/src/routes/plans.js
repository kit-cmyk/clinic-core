import express from 'express';
import { createRequireAuth, requireRole } from '../middleware/auth.js';
import { prisma as defaultPrisma } from '../models/prisma.js';

/**
 * Subscription plan CRUD router (CC-26).
 *
 * GET  /plans          — list active plans (any authenticated user)
 * POST /plans          — create new plan (SUPER_ADMIN only)
 * PUT  /plans/:id      — update plan details (SUPER_ADMIN only)
 * DELETE /plans/:id    — soft-delete a plan (SUPER_ADMIN only)
 *
 * BigInt and Decimal fields are serialised to strings in every response.
 * Injectable dependencies for full unit testability.
 */
export function createPlansRouter({
  prismaClient = defaultPrisma,
  authMiddlewareFactory,
} = {}) {
  const router = express.Router();
  const requireAuth = authMiddlewareFactory
    ? authMiddlewareFactory({ prismaClient })
    : createRequireAuth({ prismaClient });

  // ── GET /plans ────────────────────────────────────────────────────────────
  router.get('/', requireAuth, async (_req, res, next) => {
    try {
      const plans = await prismaClient.subscriptionTier.findMany({
        where: { isActive: true },
        orderBy: { monthlyPriceUsd: 'asc' },
      });
      return res.json(plans.map(serialise));
    } catch (err) {
      return next(err);
    }
  });

  // ── POST /plans ───────────────────────────────────────────────────────────
  router.post('/', requireAuth, requireRole('SUPER_ADMIN'), async (req, res, next) => {
    const { plan, name, maxBranches, maxStaff, storageLimitBytes, monthlyPriceUsd } = req.body;

    if (!plan || !name || maxBranches == null || maxStaff == null || !storageLimitBytes || !monthlyPriceUsd) {
      return res.status(400).json({ error: 'bad_request', message: 'plan, name, maxBranches, maxStaff, storageLimitBytes, and monthlyPriceUsd are required' });
    }

    try {
      const tier = await prismaClient.subscriptionTier.create({
        data: {
          plan,
          name,
          maxBranches: Number(maxBranches),
          maxStaff: Number(maxStaff),
          storageLimitBytes: BigInt(storageLimitBytes),
          monthlyPriceUsd,
        },
      });
      return res.status(201).json(serialise(tier));
    } catch (err) {
      if (err.code === 'P2002') {
        return res.status(409).json({ error: 'conflict', message: 'A plan for that subscription tier already exists' });
      }
      return next(err);
    }
  });

  // ── PUT /plans/:id ────────────────────────────────────────────────────────
  router.put('/:id', requireAuth, requireRole('SUPER_ADMIN'), async (req, res, next) => {
    const { name, maxBranches, maxStaff, storageLimitBytes, monthlyPriceUsd } = req.body;

    const data = {};
    if (name != null) data.name = name;
    if (maxBranches != null) data.maxBranches = Number(maxBranches);
    if (maxStaff != null) data.maxStaff = Number(maxStaff);
    if (storageLimitBytes != null) data.storageLimitBytes = BigInt(storageLimitBytes);
    if (monthlyPriceUsd != null) data.monthlyPriceUsd = monthlyPriceUsd;

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'bad_request', message: 'No updatable fields provided' });
    }

    try {
      const tier = await prismaClient.subscriptionTier.update({
        where: { id: req.params.id },
        data,
      });
      return res.json(serialise(tier));
    } catch (err) {
      if (err.code === 'P2025') {
        return res.status(404).json({ error: 'not_found', message: 'Plan not found' });
      }
      return next(err);
    }
  });

  // ── DELETE /plans/:id (soft delete) ──────────────────────────────────────
  router.delete('/:id', requireAuth, requireRole('SUPER_ADMIN'), async (req, res, next) => {
    try {
      await prismaClient.subscriptionTier.update({
        where: { id: req.params.id },
        data: { isActive: false },
      });
      return res.status(204).send();
    } catch (err) {
      if (err.code === 'P2025') {
        return res.status(404).json({ error: 'not_found', message: 'Plan not found' });
      }
      return next(err);
    }
  });

  return router;
}

/** Serialise BigInt/Decimal fields to strings for JSON safety. */
function serialise(tier) {
  return {
    ...tier,
    storageLimitBytes: tier.storageLimitBytes.toString(),
    monthlyPriceUsd: tier.monthlyPriceUsd.toString(),
  };
}

export default createPlansRouter();
