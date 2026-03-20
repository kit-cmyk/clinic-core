import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { createProvisioningRouter } from '../../routes/provisioning.js';

const MOCK_LOGS = [
  { id: 'l1', tenantRequestId: 'req-1', step: 'DB_RECORD', status: 'DONE', completedAt: new Date(), errorMessage: null },
  { id: 'l2', tenantRequestId: 'req-1', step: 'ROLES_SEED', status: 'DONE', completedAt: new Date(), errorMessage: null },
  { id: 'l3', tenantRequestId: 'req-1', step: 'STORAGE_SETUP', status: 'FAILED', completedAt: null, errorMessage: 'Timeout' },
  { id: 'l4', tenantRequestId: 'req-1', step: 'WELCOME_EMAIL', status: 'PENDING', completedAt: null, errorMessage: null },
];

const MOCK_REQUEST = {
  id: 'req-1',
  orgName: 'City Medical',
  status: 'APPROVED',
  planRequested: 'PRO',
  provisioningLogs: MOCK_LOGS,
};

function buildPrisma({ findUniqueResult = MOCK_REQUEST } = {}) {
  return {
    tenantRequest: {
      findUnique: jest.fn().mockResolvedValue(findUniqueResult),
    },
    provisioningLog: {
      findUnique: jest.fn().mockResolvedValue(MOCK_LOGS[2]), // STORAGE_SETUP (FAILED)
      update: jest.fn().mockImplementation(({ data }) =>
        Promise.resolve({ ...MOCK_LOGS[2], ...data })
      ),
    },
    user: {
      findUnique: jest.fn().mockResolvedValue({ id: 'u1', role: 'SUPER_ADMIN', isActive: true }),
    },
  };
}

function buildProvisioningService({ runResult = MOCK_LOGS } = {}) {
  return () => ({
    run: jest.fn().mockResolvedValue(runResult),
    initLogs: jest.fn().mockResolvedValue(undefined),
  });
}

function buildAuth({ role = 'SUPER_ADMIN' } = {}) {
  return () => (_req, _res, next) => {
    _req.user = { id: 'u1', role };
    return next();
  };
}

function buildApp({ prisma, role, provisioningServiceFactory } = {}) {
  const app = express();
  app.use(express.json());
  const router = createProvisioningRouter({
    prismaClient: prisma ?? buildPrisma(),
    authMiddlewareFactory: buildAuth({ role }),
    provisioningServiceFactory: provisioningServiceFactory ?? buildProvisioningService(),
  });
  app.use('/provisioning', router);
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    res.status(err.status || 500).json({ error: 'internal_error', message: err.message });
  });
  return app;
}

describe('GET /provisioning/:tenantRequestId', () => {
  it('returns pipeline status for SUPER_ADMIN', async () => {
    const app = buildApp();
    const res = await request(app).get('/provisioning/req-1');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('request');
    expect(res.body).toHaveProperty('logs');
    expect(res.body.logs).toHaveLength(4);
  });

  it('returns 404 when request does not exist', async () => {
    const app = buildApp({ prisma: buildPrisma({ findUniqueResult: null }) });
    const res = await request(app).get('/provisioning/bad-id');
    expect(res.status).toBe(404);
  });

  it('returns 403 for non-super-admin', async () => {
    const app = buildApp({ role: 'ORG_ADMIN' });
    const res = await request(app).get('/provisioning/req-1');
    expect(res.status).toBe(403);
  });
});

describe('POST /provisioning/:tenantRequestId/start', () => {
  it('starts the pipeline for an APPROVED request', async () => {
    const app = buildApp();
    const res = await request(app).post('/provisioning/req-1/start');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('logs');
  });

  it('returns 409 when request is not APPROVED', async () => {
    const prisma = buildPrisma({
      findUniqueResult: { ...MOCK_REQUEST, status: 'PENDING', provisioningLogs: [] },
    });
    const app = buildApp({ prisma });
    const res = await request(app).post('/provisioning/req-1/start');
    expect(res.status).toBe(409);
  });

  it('returns 404 when request does not exist', async () => {
    const app = buildApp({ prisma: buildPrisma({ findUniqueResult: null }) });
    const res = await request(app).post('/provisioning/bad-id/start');
    expect(res.status).toBe(404);
  });
});

describe('POST /provisioning/:tenantRequestId/retry/:step', () => {
  it('resets a FAILED step and re-runs the pipeline', async () => {
    const app = buildApp();
    const res = await request(app).post('/provisioning/req-1/retry/STORAGE_SETUP');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('logs');
  });

  it('returns 409 when step is not FAILED', async () => {
    const prisma = buildPrisma();
    prisma.provisioningLog.findUnique = jest.fn().mockResolvedValue({ ...MOCK_LOGS[0], status: 'DONE' });
    const app = buildApp({ prisma });
    const res = await request(app).post('/provisioning/req-1/retry/DB_RECORD');
    expect(res.status).toBe(409);
  });
});
