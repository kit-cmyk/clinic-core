import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { createOrganizationRouter } from '../../routes/organization.js';

const MOCK_ORG = {
  id: 'org1',
  tenantId: 't1',
  name: 'Test Clinic',
  address: '123 Main St',
  phone: '+1555000000',
  email: 'clinic@example.com',
  logoUrl: null,
  patientSelfUploadEnabled: true,
  brandColor: '#2563eb',
  createdAt: new Date(),
  updatedAt: new Date(),
};

function buildPrisma({ orgOverride } = {}) {
  const org = orgOverride !== undefined ? orgOverride : MOCK_ORG;
  return {
    organization: {
      findFirst: jest.fn().mockResolvedValue(org),
      create:    jest.fn().mockResolvedValue(MOCK_ORG),
      update:    jest.fn().mockResolvedValue({ ...MOCK_ORG, name: 'Updated Clinic' }),
    },
    tenant: {
      findUnique: jest.fn().mockResolvedValue({ id: 't1', name: 'Test Clinic' }),
    },
  };
}

function buildAuth({ role = 'ORG_ADMIN', tenantId = 't1' } = {}) {
  return () => (_req, _res, next) => {
    _req.user = { id: 'u1', role };
    _req.tenantId = tenantId;
    _req.audit = jest.fn();
    return next();
  };
}

function buildApp({ prisma, role, orgOverride } = {}) {
  const app = express();
  app.use(express.json());
  // Attach audit stub for routes that use req.audit
  app.use((req, _res, next) => { req.audit = req.audit ?? jest.fn(); next(); });
  const router = createOrganizationRouter({
    prismaClient: prisma ?? buildPrisma({ orgOverride }),
    authMiddlewareFactory: buildAuth({ role }),
  });
  app.use('/organization', router);
  app.use((err, _req, res, _next) => {
    res.status(err.status || 500).json({ error: 'internal_error', message: err.message });
  });
  return app;
}

// ── GET /organization ──────────────────────────────────────────────────────

describe('GET /organization', () => {
  it('returns org for authenticated ORG_ADMIN', async () => {
    const res = await request(buildApp()).get('/organization');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', 'org1');
    expect(res.body).toHaveProperty('name', 'Test Clinic');
  });

  it('auto-creates org if none exists for tenant', async () => {
    const prisma = buildPrisma({ orgOverride: null });
    const res = await request(buildApp({ prisma })).get('/organization');
    expect(res.status).toBe(200);
    expect(prisma.organization.create).toHaveBeenCalled();
  });

  it('returns 403 for PATIENT role', async () => {
    const res = await request(buildApp({ role: 'PATIENT' })).get('/organization');
    expect(res.status).toBe(403);
  });
});

// ── PUT /organization ──────────────────────────────────────────────────────

describe('PUT /organization', () => {
  it('updates org fields', async () => {
    const prisma = buildPrisma();
    const res = await request(buildApp({ prisma }))
      .put('/organization')
      .send({ name: 'Updated Clinic', address: '456 New St' });
    expect(res.status).toBe(200);
    expect(prisma.organization.update).toHaveBeenCalled();
  });

  it('returns 400 when no updatable fields provided', async () => {
    const res = await request(buildApp()).put('/organization').send({});
    expect(res.status).toBe(400);
  });

  it('auto-creates org if none exists before updating', async () => {
    const prisma = buildPrisma({ orgOverride: null });
    const res = await request(buildApp({ prisma }))
      .put('/organization')
      .send({ name: 'New Org' });
    expect(res.status).toBe(200);
    expect(prisma.organization.create).toHaveBeenCalled();
  });

  it('returns 403 for non-admin role', async () => {
    const res = await request(buildApp({ role: 'SECRETARY' }))
      .put('/organization')
      .send({ name: 'X' });
    expect(res.status).toBe(403);
  });
});

// ── GET /organization/settings ─────────────────────────────────────────────

describe('GET /organization/settings', () => {
  it('returns settings for authenticated ORG_ADMIN', async () => {
    const res = await request(buildApp()).get('/organization/settings');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('patientSelfUploadEnabled');
    expect(res.body).toHaveProperty('brandColor');
  });
});

// ── PUT /organization/settings ─────────────────────────────────────────────

describe('PUT /organization/settings', () => {
  it('disables patient uploads', async () => {
    const prisma = buildPrisma();
    const res = await request(buildApp({ prisma }))
      .put('/organization/settings')
      .send({ patientSelfUploadEnabled: false });
    expect(res.status).toBe(200);
    expect(prisma.organization.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { patientSelfUploadEnabled: false } }),
    );
  });

  it('updates brand color', async () => {
    const prisma = buildPrisma();
    const res = await request(buildApp({ prisma }))
      .put('/organization/settings')
      .send({ brandColor: '#ff0000' });
    expect(res.status).toBe(200);
  });

  it('returns 400 when no settings provided', async () => {
    const res = await request(buildApp()).put('/organization/settings').send({});
    expect(res.status).toBe(400);
  });
});

// ── Tenant isolation ───────────────────────────────────────────────────────

describe('Org tenant isolation', () => {
  it('always scopes findFirst to req.tenantId', async () => {
    const prisma = buildPrisma();
    await request(buildApp({ prisma })).get('/organization');
    expect(prisma.organization.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ tenantId: 't1' }) }),
    );
  });
});
