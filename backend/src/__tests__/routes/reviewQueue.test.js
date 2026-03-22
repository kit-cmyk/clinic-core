import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { createReviewQueueRouter } from '../../routes/reviewQueue.js';

const MOCK_LAB_RESULT = {
  id:              'lr1',
  tenantId:        't1',
  patientId:       'p1',
  testName:        'lab_result',
  result:          'some notes',
  resultFileUrl:   'results/p1/file.pdf',
  status:          'PENDING',
  verifiedCategory: null,
  clinicalNotes:   null,
  createdAt:       new Date(),
  orderedById:     'u1',
};

function buildPrisma({ overrides = {} } = {}) {
  return {
    labResult: {
      findMany:  jest.fn().mockResolvedValue('findMany'  in overrides ? overrides.findMany  : [MOCK_LAB_RESULT]),
      count:     jest.fn().mockResolvedValue('count'     in overrides ? overrides.count     : 1),
      findFirst: jest.fn().mockResolvedValue('findFirst' in overrides ? overrides.findFirst : MOCK_LAB_RESULT),
      update:    jest.fn().mockResolvedValue('update'    in overrides ? overrides.update    : { ...MOCK_LAB_RESULT, status: 'AVAILABLE' }),
    },
  };
}

function buildAuth({ role = 'DOCTOR', tenantId = 't1' } = {}) {
  return () => (_req, _res, next) => {
    _req.user     = { id: 'u1', role };
    _req.tenantId = tenantId;
    return next();
  };
}

function buildApp({ prisma, role, overrides } = {}) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => { req.audit = jest.fn(); next(); });
  const router = createReviewQueueRouter({
    prismaClient:         prisma ?? buildPrisma({ overrides }),
    authMiddlewareFactory: buildAuth({ role }),
  });
  app.use('/review-queue', router);
  app.use((err, _req, res, _next) => {
    res.status(err.status || 500).json({ error: 'internal_error', message: err.message });
  });
  return app;
}

// ── CC-50: GET /review-queue ──────────────────────────────────────────────────

describe('GET /review-queue', () => {
  it('returns pending uploads for the tenant', async () => {
    const res = await request(buildApp()).get('/review-queue');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toHaveProperty('status', 'PENDING');
  });

  it('returns 403 for PATIENT role', async () => {
    const res = await request(buildApp({ role: 'PATIENT' })).get('/review-queue');
    expect(res.status).toBe(403);
  });

  it('returns 403 for SECRETARY role', async () => {
    const res = await request(buildApp({ role: 'SECRETARY' })).get('/review-queue');
    expect(res.status).toBe(403);
  });

  it('passes pagination params to query', async () => {
    const prisma = buildPrisma();
    await request(buildApp({ prisma })).get('/review-queue?page=2&limit=5');
    expect(prisma.labResult.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 5, take: 5 }),
    );
  });

  it('filters by patientId when provided', async () => {
    const prisma = buildPrisma();
    await request(buildApp({ prisma })).get('/review-queue?patientId=p99');
    expect(prisma.labResult.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ patientId: 'p99' }) }),
    );
  });
});

// ── CC-50: PUT /review-queue/:id/status ──────────────────────────────────────

describe('PUT /review-queue/:id/status', () => {
  it('sets status to AVAILABLE when reviewed', async () => {
    const prisma = buildPrisma({
      overrides: { update: { ...MOCK_LAB_RESULT, status: 'AVAILABLE' } },
    });
    const res = await request(buildApp({ prisma }))
      .put('/review-queue/lr1/status')
      .send({ status: 'reviewed' });
    expect(res.status).toBe(200);
    expect(prisma.labResult.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'AVAILABLE' } }),
    );
  });

  it('sets status to FLAGGED when rejected', async () => {
    const prisma = buildPrisma({
      overrides: { update: { ...MOCK_LAB_RESULT, status: 'FLAGGED' } },
    });
    const res = await request(buildApp({ prisma }))
      .put('/review-queue/lr1/status')
      .send({ status: 'rejected' });
    expect(res.status).toBe(200);
    expect(prisma.labResult.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'FLAGGED' } }),
    );
  });

  it('returns 400 for invalid status value', async () => {
    const res = await request(buildApp())
      .put('/review-queue/lr1/status')
      .send({ status: 'pending' });
    expect(res.status).toBe(400);
  });

  it('returns 404 when upload not found', async () => {
    const prisma = buildPrisma({ overrides: { findFirst: null } });
    const res = await request(buildApp({ prisma }))
      .put('/review-queue/nonexistent/status')
      .send({ status: 'reviewed' });
    expect(res.status).toBe(404);
  });

  it('returns 403 for PATIENT role', async () => {
    const res = await request(buildApp({ role: 'PATIENT' }))
      .put('/review-queue/lr1/status')
      .send({ status: 'reviewed' });
    expect(res.status).toBe(403);
  });
});

// ── CC-52: PUT /review-queue/:id/verify ──────────────────────────────────────

describe('PUT /review-queue/:id/verify', () => {
  it('updates verifiedCategory and clinicalNotes, sets status AVAILABLE', async () => {
    const verified = {
      ...MOCK_LAB_RESULT,
      status:          'AVAILABLE',
      verifiedCategory: 'lab_result',
      clinicalNotes:   'Normal range',
    };
    const prisma = buildPrisma({ overrides: { update: verified } });
    const res = await request(buildApp({ prisma }))
      .put('/review-queue/lr1/verify')
      .send({ verifiedCategory: 'lab_result', clinicalNotes: 'Normal range' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'AVAILABLE');
    expect(prisma.labResult.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status:          'AVAILABLE',
          verifiedCategory: 'lab_result',
          clinicalNotes:   'Normal range',
        }),
      }),
    );
  });

  it('returns 404 when upload not found', async () => {
    const prisma = buildPrisma({ overrides: { findFirst: null } });
    const res = await request(buildApp({ prisma }))
      .put('/review-queue/nonexistent/verify')
      .send({ verifiedCategory: 'lab_result' });
    expect(res.status).toBe(404);
  });

  it('returns 403 for non-authorized role', async () => {
    const res = await request(buildApp({ role: 'SECRETARY' }))
      .put('/review-queue/lr1/verify')
      .send({ verifiedCategory: 'lab_result' });
    expect(res.status).toBe(403);
  });
});
