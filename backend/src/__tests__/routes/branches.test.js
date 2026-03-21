import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { createBranchesRouter } from '../../routes/branches.js';

const MOCK_BRANCH = {
  id: 'br1',
  tenantId: 't1',
  organizationId: 'org1',
  name: 'Main Branch',
  address: '123 Main St',
  phone: '+1555000001',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function buildPrisma({ branchOverride, findFirstOverride } = {}) {
  return {
    branch: {
      findMany:  jest.fn().mockResolvedValue([MOCK_BRANCH]),
      create:    jest.fn().mockResolvedValue(MOCK_BRANCH),
      findFirst: jest.fn().mockResolvedValue(findFirstOverride !== undefined ? findFirstOverride : (branchOverride !== undefined ? branchOverride : MOCK_BRANCH)),
      update:    jest.fn().mockResolvedValue({ ...MOCK_BRANCH, name: 'Updated Branch' }),
    },
    organization: {
      findFirst: jest.fn().mockResolvedValue({ id: 'org1' }),
      create:    jest.fn().mockResolvedValue({ id: 'org1' }),
    },
    tenant: {
      findUnique: jest.fn().mockResolvedValue({ id: 't1', name: 'Test Tenant' }),
    },
  };
}

function buildAuth({ role = 'ORG_ADMIN', tenantId = 't1' } = {}) {
  return () => (_req, _res, next) => {
    _req.user = { id: 'u1', role };
    _req.tenantId = tenantId;
    return next();
  };
}

function buildApp({ prisma, role } = {}) {
  const app = express();
  app.use(express.json());
  const router = createBranchesRouter({
    prismaClient: prisma ?? buildPrisma(),
    authMiddlewareFactory: buildAuth({ role }),
  });
  app.use('/branches', router);
  app.use((err, _req, res, _next) => {
    res.status(err.status || 500).json({ error: 'internal_error', message: err.message });
  });
  return app;
}

// ── GET /branches ──────────────────────────────────────────────────────────

describe('GET /branches', () => {
  it('returns active branches for tenant', async () => {
    const res = await request(buildApp()).get('/branches');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toHaveProperty('id', 'br1');
  });

  it('scopes query to tenant', async () => {
    const prisma = buildPrisma();
    await request(buildApp({ prisma })).get('/branches');
    expect(prisma.branch.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ tenantId: 't1', isActive: true }) }),
    );
  });

  it('returns 403 for PATIENT role', async () => {
    const res = await request(buildApp({ role: 'PATIENT' })).get('/branches');
    expect(res.status).toBe(403);
  });
});

// ── POST /branches ─────────────────────────────────────────────────────────

describe('POST /branches', () => {
  it('creates a branch', async () => {
    const res = await request(buildApp())
      .post('/branches')
      .send({ name: 'North Branch', address: '456 North Ave' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id', 'br1');
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(buildApp()).post('/branches').send({ address: '456 North Ave' });
    expect(res.status).toBe(400);
  });

  it('returns 403 for non-admin role', async () => {
    const res = await request(buildApp({ role: 'SECRETARY' }))
      .post('/branches')
      .send({ name: 'X' });
    expect(res.status).toBe(403);
  });

  it('auto-creates org if missing', async () => {
    const prisma = buildPrisma();
    prisma.organization.findFirst.mockResolvedValue(null);
    const res = await request(buildApp({ prisma }))
      .post('/branches')
      .send({ name: 'Branch A' });
    expect(res.status).toBe(201);
    expect(prisma.organization.create).toHaveBeenCalled();
  });
});

// ── PUT /branches/:id ──────────────────────────────────────────────────────

describe('PUT /branches/:id', () => {
  it('updates branch details', async () => {
    const prisma = buildPrisma();
    const res = await request(buildApp({ prisma }))
      .put('/branches/br1')
      .send({ name: 'Updated Branch' });
    expect(res.status).toBe(200);
    expect(prisma.branch.update).toHaveBeenCalled();
  });

  it('returns 404 when branch not found for tenant', async () => {
    const prisma = buildPrisma({ findFirstOverride: null });
    const res = await request(buildApp({ prisma }))
      .put('/branches/br999')
      .send({ name: 'X' });
    expect(res.status).toBe(404);
  });

  it('returns 400 when no fields provided', async () => {
    const res = await request(buildApp()).put('/branches/br1').send({});
    expect(res.status).toBe(400);
  });
});

// ── DELETE /branches/:id ───────────────────────────────────────────────────

describe('DELETE /branches/:id', () => {
  it('soft-deletes branch (sets isActive: false)', async () => {
    const prisma = buildPrisma();
    const res = await request(buildApp({ prisma })).delete('/branches/br1');
    expect(res.status).toBe(204);
    expect(prisma.branch.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isActive: false } }),
    );
  });

  it('returns 404 when branch not found for tenant', async () => {
    const prisma = buildPrisma({ findFirstOverride: null });
    const res = await request(buildApp({ prisma })).delete('/branches/br999');
    expect(res.status).toBe(404);
  });

  it('returns 403 for non-admin role', async () => {
    const res = await request(buildApp({ role: 'NURSE' })).delete('/branches/br1');
    expect(res.status).toBe(403);
  });
});

// ── Tenant isolation ───────────────────────────────────────────────────────

describe('Branch tenant isolation', () => {
  it('Tenant A cannot see Tenant B branches — findMany always scoped to req.tenantId', async () => {
    const prismaA = buildPrisma();
    const appA = buildApp({ prisma: prismaA });
    await request(appA).get('/branches');
    // Tenant A's query must include tenantId: 't1' (from buildAuth default)
    expect(prismaA.branch.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ tenantId: 't1' }) }),
    );
  });
});
