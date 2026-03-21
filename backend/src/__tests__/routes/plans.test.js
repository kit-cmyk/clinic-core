import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { createPlansRouter } from '../../routes/plans.js';

const MOCK_PLANS = [
  {
    id: 'p1',
    plan: 'FREE',
    name: 'Free',
    maxBranches: 1,
    maxStaff: 3,
    storageLimitBytes: BigInt('536870912'),
    monthlyPriceUsd: '0.00',
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: 'p2',
    plan: 'PRO',
    name: 'Pro',
    maxBranches: 5,
    maxStaff: 20,
    storageLimitBytes: BigInt('1073741824'),
    monthlyPriceUsd: '149.00',
    isActive: true,
    createdAt: new Date(),
  },
];

function buildPrisma() {
  return {
    subscriptionTier: {
      findMany: jest.fn().mockResolvedValue(MOCK_PLANS),
      create: jest.fn().mockResolvedValue(MOCK_PLANS[1]),
      update: jest.fn().mockResolvedValue(MOCK_PLANS[1]),
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

function buildApp({ prisma, role } = {}) {
  const app = express();
  app.use(express.json());
  const router = createPlansRouter({
    prismaClient: prisma ?? buildPrisma(),
    authMiddlewareFactory: buildAuth({ role }),
  });
  app.use('/plans', router);
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    res.status(err.status || 500).json({ error: 'internal_error', message: err.message });
  });
  return app;
}

describe('GET /plans', () => {
  it('returns active plans for any authenticated user', async () => {
    const app = buildApp({ role: 'ORG_ADMIN' });
    const res = await request(app).get('/plans');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);
    expect(res.body[0]).toHaveProperty('plan', 'FREE');
    expect(res.body[0]).toHaveProperty('storageLimitBytes', '536870912');
    expect(res.body[0]).toHaveProperty('monthlyPriceUsd', '0.00');
  });
});

describe('POST /plans', () => {
  it('creates a plan as SUPER_ADMIN', async () => {
    const app = buildApp();
    const res = await request(app).post('/plans').send({
      plan: 'PRO',
      name: 'Pro',
      maxBranches: 5,
      maxStaff: 20,
      storageLimitBytes: '1073741824',
      monthlyPriceUsd: '149.00',
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('plan', 'PRO');
    expect(res.body).toHaveProperty('storageLimitBytes', '1073741824');
  });

  it('returns 400 when required fields are missing', async () => {
    const app = buildApp();
    const res = await request(app).post('/plans').send({ plan: 'PRO' });
    expect(res.status).toBe(400);
  });

  it('returns 403 for non-SUPER_ADMIN', async () => {
    const app = buildApp({ role: 'ORG_ADMIN' });
    const res = await request(app).post('/plans').send({
      plan: 'PRO',
      name: 'Pro',
      maxBranches: 5,
      maxStaff: 20,
      storageLimitBytes: '1073741824',
      monthlyPriceUsd: '149.00',
    });
    expect(res.status).toBe(403);
  });
});

describe('PUT /plans/:id', () => {
  it('updates a plan as SUPER_ADMIN', async () => {
    const app = buildApp();
    const res = await request(app).put('/plans/p2').send({ name: 'Pro Plus', monthlyPriceUsd: '179.00' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('storageLimitBytes', '1073741824');
  });

  it('returns 403 for non-SUPER_ADMIN', async () => {
    const app = buildApp({ role: 'BRANCH_MANAGER' });
    const res = await request(app).put('/plans/p2').send({ name: 'Pro Plus' });
    expect(res.status).toBe(403);
  });
});

describe('DELETE /plans/:id', () => {
  it('soft-deletes a plan as SUPER_ADMIN', async () => {
    const app = buildApp();
    const res = await request(app).delete('/plans/p2');
    expect(res.status).toBe(204);
  });

  it('returns 403 for non-SUPER_ADMIN', async () => {
    const app = buildApp({ role: 'ORG_ADMIN' });
    const res = await request(app).delete('/plans/p2');
    expect(res.status).toBe(403);
  });
});
