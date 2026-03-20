import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { createTenantRequestsRouter } from '../../routes/tenantRequests.js';

const MOCK_REQUEST = {
  id: 'req-1',
  orgName: 'City Medical',
  contactName: 'Jane Doe',
  contactEmail: 'jane@citymedical.com',
  contactPhone: null,
  planRequested: 'PRO',
  notes: null,
  status: 'PENDING',
  reviewedAt: null,
  rejectionReason: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function buildPrisma({ findUniqueResult = MOCK_REQUEST, findManyResult = [MOCK_REQUEST] } = {}) {
  return {
    tenantRequest: {
      findMany: jest.fn().mockResolvedValue(findManyResult),
      findUnique: jest.fn().mockResolvedValue(findUniqueResult),
      create: jest.fn().mockResolvedValue(MOCK_REQUEST),
      update: jest.fn().mockImplementation(({ data }) =>
        Promise.resolve({ ...MOCK_REQUEST, ...data })
      ),
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
  const router = createTenantRequestsRouter({
    prismaClient: prisma ?? buildPrisma(),
    authMiddlewareFactory: buildAuth({ role }),
  });
  app.use('/tenant-requests', router);
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    res.status(err.status || 500).json({ error: 'internal_error', message: err.message });
  });
  return app;
}

describe('POST /tenant-requests (public sign-up submission)', () => {
  it('creates a request with valid body', async () => {
    const app = buildApp();
    const res = await request(app).post('/tenant-requests').send({
      orgName: 'City Medical',
      contactName: 'Jane Doe',
      contactEmail: 'jane@citymedical.com',
    });
    expect(res.status).toBe(201);
    expect(res.body.orgName).toBe('City Medical');
  });

  it('returns 400 when required fields are missing', async () => {
    const app = buildApp();
    const res = await request(app).post('/tenant-requests').send({ orgName: 'City Medical' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('validation_error');
  });
});

describe('GET /tenant-requests', () => {
  it('returns all requests for SUPER_ADMIN', async () => {
    const app = buildApp();
    const res = await request(app).get('/tenant-requests');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('returns 403 for non-super-admin', async () => {
    const app = buildApp({ role: 'ORG_ADMIN' });
    const res = await request(app).get('/tenant-requests');
    expect(res.status).toBe(403);
  });
});

describe('POST /tenant-requests/:id/approve', () => {
  it('approves a PENDING request', async () => {
    const app = buildApp();
    const res = await request(app).post('/tenant-requests/req-1/approve');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('APPROVED');
  });

  it('returns 409 when request is not PENDING', async () => {
    const prisma = buildPrisma({ findUniqueResult: { ...MOCK_REQUEST, status: 'APPROVED' } });
    const app = buildApp({ prisma });
    const res = await request(app).post('/tenant-requests/req-1/approve');
    expect(res.status).toBe(409);
  });

  it('returns 404 when request does not exist', async () => {
    const prisma = buildPrisma({ findUniqueResult: null });
    const app = buildApp({ prisma });
    const res = await request(app).post('/tenant-requests/bad-id/approve');
    expect(res.status).toBe(404);
  });
});

describe('POST /tenant-requests/:id/reject', () => {
  it('rejects a PENDING request with a reason', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/tenant-requests/req-1/reject')
      .send({ rejectionReason: 'Incomplete application' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('REJECTED');
  });

  it('returns 400 when rejectionReason is missing', async () => {
    const app = buildApp();
    const res = await request(app).post('/tenant-requests/req-1/reject').send({});
    expect(res.status).toBe(400);
  });
});
