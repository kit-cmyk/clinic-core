import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { createPatientsRouter } from '../../routes/patients.js';

const MOCK_PATIENT = {
  id:         'pt1',
  tenantId:   't1',
  firstName:  'John',
  lastName:   'Doe',
  dob:        new Date('1990-05-15'),
  gender:     'MALE',
  bloodType:  'O+',
  phone:      '+14155550101',
  email:      'john@example.com',
  address:    '123 Main St',
  allergies:  [],
  medicalHistory:           null,
  knownConditions:          null,
  previousPrescriptions:    null,
  isActive:   true,
  createdAt:  new Date('2026-01-01'),
};

function buildPrisma({ patients = [MOCK_PATIENT], total = 1 } = {}) {
  return {
    patient: {
      findMany:  jest.fn().mockResolvedValue(patients),
      count:     jest.fn().mockResolvedValue(total),
    },
    patientInvite: {
      create:     jest.fn(),
      findUnique: jest.fn(),
      update:     jest.fn(),
    },
    user: { findUnique: jest.fn(), create: jest.fn() },
  };
}

function buildAuth({ role = 'SECRETARY', tenantId = 't1' } = {}) {
  return () => (_req, _res, next) => {
    _req.user     = { id: 'u1', role };
    _req.tenantId = tenantId;
    return next();
  };
}

function buildApp({ prisma, role } = {}) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => { req.audit = jest.fn(); next(); });
  const router = createPatientsRouter({
    prismaClient:              prisma ?? buildPrisma(),
    authMiddlewareFactory:     buildAuth({ role }),
    smsServiceFactory:         () => ({ send: jest.fn() }),
    adminClientFactory:        () => ({ auth: { admin: { createUser: jest.fn() } } }),
    storageServiceFactory:     () => ({ upload: jest.fn() }),
    malwareScanServiceFactory: () => ({ scan: jest.fn().mockResolvedValue({ clean: true, result: 'clean', fileHash: 'abc' }) }),
  });
  app.use('/patients', router);
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    res.status(err.status || 500).json({ error: 'internal_error', message: err.message });
  });
  return app;
}

// ── GET /patients ──────────────────────────────────────────────────────────────

describe('GET /patients', () => {
  it('returns paginated patient list for the tenant', async () => {
    const app = buildApp();
    const res = await request(app).get('/patients');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].id).toBe('pt1');
    expect(res.body.pagination.total).toBe(1);
    expect(res.body.pagination.page).toBe(1);
  });

  it('filters by tenantId (tenant isolation)', async () => {
    const prisma = buildPrisma();
    const app    = buildApp({ prisma });
    await request(app).get('/patients');
    const call = prisma.patient.findMany.mock.calls[0][0];
    expect(call.where.tenantId).toBe('t1');
  });

  it('applies search query to firstName, lastName, phone, email', async () => {
    const prisma = buildPrisma();
    const app    = buildApp({ prisma });
    await request(app).get('/patients?search=John');
    const call = prisma.patient.findMany.mock.calls[0][0];
    const orClauses = call.where.OR;
    expect(orClauses).toBeDefined();
    expect(orClauses.some(c => c.firstName)).toBe(true);
    expect(orClauses.some(c => c.lastName)).toBe(true);
    expect(orClauses.some(c => c.phone)).toBe(true);
    expect(orClauses.some(c => c.email)).toBe(true);
  });

  it('does not add OR clause when search is empty', async () => {
    const prisma = buildPrisma();
    const app    = buildApp({ prisma });
    await request(app).get('/patients');
    const call = prisma.patient.findMany.mock.calls[0][0];
    expect(call.where.OR).toBeUndefined();
  });

  it('filters by isActive when provided', async () => {
    const prisma = buildPrisma();
    const app    = buildApp({ prisma });
    await request(app).get('/patients?isActive=false');
    const call = prisma.patient.findMany.mock.calls[0][0];
    expect(call.where.isActive).toBe(false);
  });

  it('does not filter by isActive when not provided', async () => {
    const prisma = buildPrisma();
    const app    = buildApp({ prisma });
    await request(app).get('/patients');
    const call = prisma.patient.findMany.mock.calls[0][0];
    expect(call.where.isActive).toBeUndefined();
  });

  it('respects pagination params', async () => {
    const prisma = buildPrisma({ patients: [], total: 50 });
    const app    = buildApp({ prisma });
    const res    = await request(app).get('/patients?page=2&limit=10');
    expect(res.status).toBe(200);
    const call = prisma.patient.findMany.mock.calls[0][0];
    expect(call.skip).toBe(10); // (2-1) * 10
    expect(call.take).toBe(10);
    expect(res.body.pagination.pages).toBe(5); // ceil(50/10)
  });

  it('returns 403 for PATIENT role (no patients:read permission)', async () => {
    const app = buildApp({ role: 'PATIENT' });
    const res = await request(app).get('/patients');
    expect(res.status).toBe(403);
  });

  it('returns 401 when not authenticated', async () => {
    const app = express();
    app.use(express.json());
    const router = createPatientsRouter({
      prismaClient:              buildPrisma(),
      authMiddlewareFactory:     () => (_req, res) => res.status(401).json({ error: 'unauthorized' }),
      smsServiceFactory:         () => ({ send: jest.fn() }),
      adminClientFactory:        () => ({ auth: { admin: { createUser: jest.fn() } } }),
      storageServiceFactory:     () => ({ upload: jest.fn() }),
      malwareScanServiceFactory: () => ({ scan: jest.fn() }),
    });
    app.use('/patients', router);
    const res = await request(app).get('/patients');
    expect(res.status).toBe(401);
  });
});
