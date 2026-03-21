import express from 'express';
import { createRequireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/auth.js';
import { prisma as defaultPrisma } from '../models/prisma.js';

// In-memory cache — 5-minute TTL
let _cache = null;
let _cacheTs = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Factory for /api/v1/metrics — platform monitoring metrics (CC-124).
 * Returns aggregated KPIs across all tenants for the Super Admin dashboard.
 * Results are cached for 5 minutes to avoid hammering the DB.
 */
export function createMetricsRouter({
  prismaClient = defaultPrisma,
  authMiddlewareFactory,
  cacheOverride,   // { get, set } — injectable for tests
} = {}) {
  const router = express.Router();
  const requireAuth = authMiddlewareFactory
    ? authMiddlewareFactory({ prismaClient })
    : createRequireAuth({ prismaClient });

  const cache = cacheOverride ?? {
    get: () => (Date.now() - _cacheTs < CACHE_TTL_MS ? _cache : null),
    set: (data) => { _cache = data; _cacheTs = Date.now(); },
    bust: () => { _cache = null; _cacheTs = 0; },
  };

  // GET /metrics — platform-wide KPIs
  router.get('/', requireAuth, requireRole('SUPER_ADMIN'), async (_req, res, next) => {
    try {
      const cached = cache.get();
      if (cached) {
        return res.json({ ...cached, cached: true });
      }

      const [
        activeTenants,
        totalTenants,
        tiers,
        storageResult,
        tenantList,
      ] = await Promise.all([
        prismaClient.tenant.count({ where: { isActive: true } }),
        prismaClient.tenant.count(),
        prismaClient.subscriptionTier.findMany({ select: { plan: true, monthlyPriceUsd: true } }),
        // Sum storage across all tenants (placeholder — real storage from Supabase)
        prismaClient.tenant.aggregate({ _sum: { storageLimitBytes: true } }),
        prismaClient.tenant.findMany({
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            plan: true,
            isActive: true,
            storageLimitBytes: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        }),
      ]);

      // Build price lookup
      const priceByPlan = {};
      for (const t of tiers) {
        priceByPlan[t.plan] = Number(t.monthlyPriceUsd);
      }

      // MRR = sum of active tenant monthly prices
      const mrr = tenantList.reduce((sum, t) => sum + (priceByPlan[t.plan] ?? 0), 0);

      // Plans breakdown
      const planCounts = tenantList.reduce((acc, t) => {
        acc[t.plan] = (acc[t.plan] ?? 0) + 1;
        return acc;
      }, {});

      const rawStorage = storageResult._sum.storageLimitBytes ?? BigInt(0);
      const payload = {
        activeTenants,
        totalTenants,
        mrrUsd: mrr,
        storageSumBytes: rawStorage.toString(),
        planBreakdown: planCounts,
        // Convert BigInt fields in each tenant row to strings for JSON serialisation
        tenants: tenantList.map((t) => ({
          ...t,
          storageLimitBytes: t.storageLimitBytes.toString(),
        })),
        cached: false,
        generatedAt: new Date().toISOString(),
      };

      cache.set(payload);
      return res.json(payload);
    } catch (err) {
      return next(err);
    }
  });

  // POST /metrics/cache/bust — force cache invalidation (super admin only)
  router.post('/cache/bust', requireAuth, requireRole('SUPER_ADMIN'), (_req, res) => {
    cache.bust();
    return res.json({ message: 'Cache cleared' });
  });

  return router;
}

export default createMetricsRouter();
