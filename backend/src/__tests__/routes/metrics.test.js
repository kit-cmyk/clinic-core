import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { createMetricsRouter } from '../../routes/metrics.js';

const MOCK_TENANTS = [
  { id: 't1', name: 'City Medical', plan: 'PRO', isActive: true, storageLimitBytes: BigInt('1073741824'), createdAt: new Date() },
  { id: 't2', name: 'Green Valley', plan: 'ENTERPRISE', isActive: true, storageLimitBytes: BigInt('5368709120'), createdAt: new Date() },
];

const MOCK_TIERS = [
  { plan: 'PRO', monthlyPriceUsd: '149.00' },
  { plan: 'ENTERPRISE', monthlyPriceUsd: '349.00' },
];

function buildPrisma() {
  return {
    tenant: {
      count: jest.fn().mockResolvedValue(2),
      findMany: jest.fn().mockResolvedValue(MOCK_TENANTS),
      aggregate: jest.fn().mockResolvedValue({ _sum: { storageLimitBytes: BigInt(6442450944) } }),
    },
    subscriptionTier: {
      findMany: jest.fn().mockResolvedValue(MOCK_TIERS),
    },
    user: {
      findUnique: jest.fn().mockResolvedValue({ id: 'u1', role: 'SUPER_ADMIN', isActive: true }),
    },
  };
}

function buildAuth({ role = 'SUPER_ADMIN' } = {}) {
  return () => (_req, _res, next) => {
    _req.user = { id: 'u1', role };
    return next();
  };
}

// Bypass cache for all tests
function noopCache() {
  return { get: () => null, set: jest.fn(), bust: jest.fn() };
}

function buildApp({ prisma, role } = {}) {
  const app = express();
  app.use(express.json());
  const router = createMetricsRouter({
    prismaClient: prisma ?? buildPrisma(),
    authMiddlewareFactory: buildAuth({ role }),
    cacheOverride: noopCache(),
  });
  app.use('/metrics', router);
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    res.status(err.status || 500).json({ error: 'internal_error', message: err.message });
  });
  return app;
}

describe('GET /metrics', () => {
  it('returns platform KPI data for SUPER_ADMIN', async () => {
    const app = buildApp();
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('activeTenants');
    expect(res.body).toHaveProperty('mrrUsd');
    expect(res.body).toHaveProperty('planBreakdown');
    expect(res.body).toHaveProperty('tenants');
  });

  it('calculates MRR correctly from tenant plans', async () => {
    const app = buildApp();
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
    // PRO ($149) + ENTERPRISE ($349) = $498
    expect(res.body.mrrUsd).toBe(498);
  });

  it('returns 403 for non-super-admin', async () => {
    const app = buildApp({ role: 'ORG_ADMIN' });
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(403);
  });

  it('includes tenants array in response', async () => {
    const app = buildApp();
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.tenants)).toBe(true);
    expect(res.body.tenants).toHaveLength(2);
  });
});

describe('POST /metrics/cache/bust', () => {
  it('clears the cache as SUPER_ADMIN', async () => {
    const app = buildApp();
    const res = await request(app).post('/metrics/cache/bust');
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/cache cleared/i);
  });

  it('returns 403 for non-super-admin', async () => {
    const app = buildApp({ role: 'ORG_ADMIN' });
    const res = await request(app).post('/metrics/cache/bust');
    expect(res.status).toBe(403);
  });
});
