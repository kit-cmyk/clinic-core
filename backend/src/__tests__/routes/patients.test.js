import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { createPatientsRouter } from '../../routes/patients.js';

const MOCK_INVITE = {
  id: 'inv1',
  tenantId: 't1',
  phone: '+14155550123',
  token: 'abc-token',
  invitedById: 'u1',
  expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
  usedAt: null,
  createdAt: new Date(),
  tenant: { id: 't1' },
};

function buildPrisma({ inviteOverride } = {}) {
  return {
    patientInvite: {
      create: jest.fn().mockResolvedValue(MOCK_INVITE),
      findUnique: jest.fn().mockResolvedValue(inviteOverride !== undefined ? inviteOverride : MOCK_INVITE),
      update: jest.fn().mockResolvedValue({ ...MOCK_INVITE, usedAt: new Date() }),
    },
    user: {
      findUnique: jest.fn().mockResolvedValue({ id: 'u1', role: 'SECRETARY', isActive: true, tenantId: 't1' }),
      create: jest.fn().mockResolvedValue({ id: 'u2', role: 'PATIENT', tenantId: 't1' }),
    },
  };
}

function buildAuth({ role = 'SECRETARY', tenantId = 't1' } = {}) {
  return () => (_req, _res, next) => {
    _req.user = { id: 'u1', role };
    _req.tenantId = tenantId;
    return next();
  };
}

function buildSmsService() {
  return () => ({ send: jest.fn().mockResolvedValue({ sid: 'SM123' }) });
}

function buildAdminClient() {
  return () => ({
    auth: {
      admin: {
        createUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'supabase-uid-123' } },
          error: null,
        }),
      },
    },
  });
}

function buildApp({ prisma, role, inviteOverride } = {}) {
  const app = express();
  app.use(express.json());
  const router = createPatientsRouter({
    prismaClient: prisma ?? buildPrisma({ inviteOverride }),
    authMiddlewareFactory: buildAuth({ role }),
    smsServiceFactory: buildSmsService(),
    adminClientFactory: buildAdminClient(),
  });
  app.use('/patients', router);
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    res.status(err.status || 500).json({ error: 'internal_error', message: err.message });
  });
  return app;
}

describe('POST /patients/invite', () => {
  it('sends an SMS invite for a valid phone number', async () => {
    const app = buildApp();
    const res = await request(app).post('/patients/invite').send({ phone: '+14155550123' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('expiresAt');
  });

  it('returns 400 when phone is missing', async () => {
    const app = buildApp();
    const res = await request(app).post('/patients/invite').send({});
    expect(res.status).toBe(400);
  });

  it('returns 400 when phone is not E.164 format', async () => {
    const app = buildApp();
    const res = await request(app).post('/patients/invite').send({ phone: '555-1234' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/E\.164/);
  });

  it('returns 403 for a patient role (no patients:create permission)', async () => {
    const app = buildApp({ role: 'PATIENT' });
    const res = await request(app).post('/patients/invite').send({ phone: '+14155550123' });
    expect(res.status).toBe(403);
  });
});

describe('POST /patients/register/:token', () => {
  it('registers a patient with a valid token', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/patients/register/abc-token')
      .send({ firstName: 'Jane', lastName: 'Doe', password: 'securePass123' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('userId');
    expect(res.body).toHaveProperty('role', 'PATIENT');
  });

  it('returns 400 when required fields are missing', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/patients/register/abc-token')
      .send({ firstName: 'Jane' });
    expect(res.status).toBe(400);
  });

  it('returns 410 when token has already been used', async () => {
    const usedInvite = { ...MOCK_INVITE, usedAt: new Date(Date.now() - 1000) };
    const app = buildApp({ inviteOverride: usedInvite });
    const res = await request(app)
      .post('/patients/register/abc-token')
      .send({ firstName: 'Jane', lastName: 'Doe', password: 'securePass123' });
    expect(res.status).toBe(410);
    expect(res.body.error).toBe('gone');
  });

  it('returns 410 when token has expired', async () => {
    const expiredInvite = { ...MOCK_INVITE, expiresAt: new Date(Date.now() - 1000), usedAt: null };
    const app = buildApp({ inviteOverride: expiredInvite });
    const res = await request(app)
      .post('/patients/register/abc-token')
      .send({ firstName: 'Jane', lastName: 'Doe', password: 'securePass123' });
    expect(res.status).toBe(410);
    expect(res.body.error).toBe('gone');
  });

  it('returns 404 when token does not exist', async () => {
    const app = buildApp({ inviteOverride: null });
    const res = await request(app)
      .post('/patients/register/nonexistent')
      .send({ firstName: 'Jane', lastName: 'Doe', password: 'securePass123' });
    expect(res.status).toBe(404);
  });
});
