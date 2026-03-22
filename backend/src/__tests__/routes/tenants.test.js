import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { createTenantsRouter } from '../../routes/tenants.js';

// ── Mock data ──────────────────────────────────────────────────────────────────

const MOCK_TENANTS = [
  {
    id: 't1',
    name: 'City Medical Clinic',
    slug: 'city-medical',
    plan: 'PRO',
    isActive: true,
    storageLimitBytes: BigInt('53687091200'), // 50 GB
    createdAt: new Date('2025-11-12'),
    updatedAt: new Date(),
    _count: { users: 4, branches: 3 },
  },
  {
    id: 't2',
    name: 'Green Valley Health',
    slug: 'green-valley',
    plan: 'BASIC',
    isActive: true,
    storageLimitBytes: BigInt('10737418240'), // 10 GB
    createdAt: new Date('2026-01-05'),
    updatedAt: new Date(),
    _count: { users: 2, branches: 1 },
  },
  {
    id: 't3',
    name: 'Apex Diagnostics',
    slug: 'apex-diagnostics',
    plan: 'ENTERPRISE',
    isActive: false,
    storageLimitBytes: BigInt('214748364800'), // 200 GB
    createdAt: new Date('2025-08-20'),
    updatedAt: new Date(),
    _count: { users: 2, branches: 8 },
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function buildPrisma(overrides = {}) {
  return {
    tenant: {
      findMany:   jest.fn().mockResolvedValue(MOCK_TENANTS),
      count:      jest.fn().mockResolvedValue(MOCK_TENANTS.length),
      findUnique: jest.fn().mockResolvedValue(MOCK_TENANTS[0]),
      create:     jest.fn().mockResolvedValue({
        ...MOCK_TENANTS[0],
        id:   't-new',
        name: 'New Clinic',
        slug: 'new-clinic',
        plan: 'FREE',
        _count: { users: 0, branches: 0 },
      }),
      update: jest.fn().mockImplementation(({ where, data }) =>
        Promise.resolve({ ...MOCK_TENANTS.find(t => t.id === where.id) ?? MOCK_TENANTS[0], ...data })
      ),
    },
    ...overrides,
  };
}

function buildAuth({ role = 'SUPER_ADMIN' } = {}) {
  return () => (_req, _res, next) => {
    _req.user = { id: 'u1', role };
    return next();
  };
}

function buildStorageService({ usedBytes = 0 } = {}) {
  return {
    list: jest.fn().mockResolvedValue({ data: [], error: null }),
  };
}

function buildApp({ prisma, role, storageService } = {}) {
  const app = express();
  app.use(express.json());
  app.use((_req, _res, next) => { _req.audit = jest.fn(); next(); });
  const router = createTenantsRouter({
    prismaClient:          prisma ?? buildPrisma(),
    authMiddlewareFactory: buildAuth({ role }),
    storageServiceInstance: storageService ?? buildStorageService(),
  });
  app.use('/tenants', router);
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    res.status(err.status || 500).json({ error: 'internal_error', message: err.message });
  });
  return app;
}

// ── GET /tenants ───────────────────────────────────────────────────────────────

describe('GET /tenants', () => {
  it('returns paginated tenant list for SUPER_ADMIN', async () => {
    const res = await request(buildApp()).get('/tenants');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toMatchObject({ page: 1, total: 3 });
  });

  it('serialises BigInt storageLimitBytes to string', async () => {
    const res = await request(buildApp()).get('/tenants');
    expect(res.status).toBe(200);
    expect(typeof res.body.data[0].storageLimitBytes).toBe('string');
  });

  it('returns 403 for non-SUPER_ADMIN', async () => {
    const res = await request(buildApp({ role: 'ORG_ADMIN' })).get('/tenants');
    expect(res.status).toBe(403);
  });
});

// ── GET /tenants/:id ───────────────────────────────────────────────────────────

describe('GET /tenants/:id', () => {
  it('returns a single tenant', async () => {
    const res = await request(buildApp()).get('/tenants/t1');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', 't1');
    expect(res.body).toHaveProperty('name', 'City Medical Clinic');
    expect(typeof res.body.storageLimitBytes).toBe('string');
  });

  it('returns 404 when tenant not found', async () => {
    const prisma = buildPrisma();
    prisma.tenant.findUnique = jest.fn().mockResolvedValue(null);
    const res = await request(buildApp({ prisma })).get('/tenants/nonexistent');
    expect(res.status).toBe(404);
  });

  it('returns 403 for non-SUPER_ADMIN', async () => {
    const res = await request(buildApp({ role: 'DOCTOR' })).get('/tenants/t1');
    expect(res.status).toBe(403);
  });
});

// ── POST /tenants ──────────────────────────────────────────────────────────────

describe('POST /tenants', () => {
  it('creates a tenant as SUPER_ADMIN', async () => {
    const res = await request(buildApp()).post('/tenants').send({
      name: 'New Clinic',
      slug: 'new-clinic',
      plan: 'FREE',
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('name', 'New Clinic');
    expect(res.body).toHaveProperty('slug', 'new-clinic');
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(buildApp()).post('/tenants').send({ slug: 'no-name' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when slug is missing', async () => {
    const res = await request(buildApp()).post('/tenants').send({ name: 'No Slug' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid slug format', async () => {
    const res = await request(buildApp()).post('/tenants').send({ name: 'Bad Slug', slug: 'Has Spaces!' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/slug/i);
  });

  it('returns 409 on duplicate slug', async () => {
    const prisma = buildPrisma();
    prisma.tenant.create = jest.fn().mockRejectedValue({ code: 'P2002' });
    const res = await request(buildApp({ prisma })).post('/tenants').send({ name: 'City Medical', slug: 'city-medical' });
    expect(res.status).toBe(409);
  });

  it('returns 403 for non-SUPER_ADMIN', async () => {
    const res = await request(buildApp({ role: 'BRANCH_MANAGER' })).post('/tenants').send({ name: 'Test', slug: 'test' });
    expect(res.status).toBe(403);
  });
});

// ── PUT /tenants/:id — plan change ─────────────────────────────────────────────

describe('PUT /tenants/:id — plan change', () => {
  it('updates the plan as SUPER_ADMIN', async () => {
    const prisma = buildPrisma();
    prisma.tenant.update = jest.fn().mockResolvedValue({ ...MOCK_TENANTS[0], plan: 'ENTERPRISE' });
    const res = await request(buildApp({ prisma })).put('/tenants/t1').send({ plan: 'ENTERPRISE' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('plan', 'ENTERPRISE');
  });

  it('returns 400 when no updatable fields provided', async () => {
    const res = await request(buildApp()).put('/tenants/t1').send({});
    expect(res.status).toBe(400);
  });

  it('returns 404 when tenant not found', async () => {
    const prisma = buildPrisma();
    prisma.tenant.update = jest.fn().mockRejectedValue({ code: 'P2025' });
    const res = await request(buildApp({ prisma })).put('/tenants/nonexistent').send({ plan: 'FREE' });
    expect(res.status).toBe(404);
  });
});

// ── PUT /tenants/:id — tenant suspension ──────────────────────────────────────

describe('PUT /tenants/:id — suspension', () => {
  it('suspends an active tenant (sets isActive=false)', async () => {
    const prisma = buildPrisma();
    prisma.tenant.update = jest.fn().mockResolvedValue({ ...MOCK_TENANTS[0], isActive: false });
    const res = await request(buildApp({ prisma })).put('/tenants/t1').send({ isActive: false });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('isActive', false);
  });

  it('reactivates a suspended tenant (sets isActive=true)', async () => {
    const prisma = buildPrisma();
    prisma.tenant.update = jest.fn().mockResolvedValue({ ...MOCK_TENANTS[2], isActive: true });
    const res = await request(buildApp({ prisma })).put('/tenants/t3').send({ isActive: true });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('isActive', true);
  });

  it('returns 403 for non-SUPER_ADMIN', async () => {
    const res = await request(buildApp({ role: 'ORG_ADMIN' })).put('/tenants/t1').send({ isActive: false });
    expect(res.status).toBe(403);
  });
});

// ── GET /tenants/:id/storage-usage ────────────────────────────────────────────

describe('GET /tenants/:id/storage-usage', () => {
  it('returns storage usage with usedPercent', async () => {
    const svc = { list: jest.fn().mockResolvedValue({ data: [], error: null }) };
    const res = await request(buildApp({ storageService: svc })).get('/tenants/t1/storage-usage');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('tenantId', 't1');
    expect(res.body).toHaveProperty('usedPercent');
    expect(typeof res.body.usedBytes).toBe('string');
    expect(typeof res.body.limitBytes).toBe('string');
    expect(typeof res.body.isOverLimit).toBe('boolean');
  });

  it('returns 404 when tenant not found', async () => {
    const prisma = buildPrisma();
    prisma.tenant.findUnique = jest.fn().mockResolvedValue(null);
    const res = await request(buildApp({ prisma })).get('/tenants/nonexistent/storage-usage');
    expect(res.status).toBe(404);
  });

  it('returns 403 for non-SUPER_ADMIN', async () => {
    const res = await request(buildApp({ role: 'ORG_ADMIN' })).get('/tenants/t1/storage-usage');
    expect(res.status).toBe(403);
  });
});
