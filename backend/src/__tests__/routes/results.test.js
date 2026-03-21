import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { createResultsRouter } from '../../routes/results.js';

const MOCK_PATIENT = { id: 'pat1', tenantId: 't1' };
const MOCK_RESULT = {
  id: 'res1',
  patientId: 'pat1',
  testName: 'Blood Panel',
  result: 'All normal',
  resultFileUrl: null,
  status: 'AVAILABLE',
  publishedAt: new Date(),
  createdAt: new Date(),
};

function buildPrisma({ patientOverride } = {}) {
  return {
    patient: {
      findFirst: jest.fn().mockResolvedValue(patientOverride !== undefined ? patientOverride : MOCK_PATIENT),
    },
    labResult: {
      create:  jest.fn().mockResolvedValue(MOCK_RESULT),
      findMany: jest.fn().mockResolvedValue([MOCK_RESULT]),
      count:   jest.fn().mockResolvedValue(1),
    },
  };
}

function buildAuth({ role = 'DOCTOR', tenantId = 't1' } = {}) {
  return () => (_req, _res, next) => {
    _req.user = { id: 'u1', role };
    _req.tenantId = tenantId;
    _req.audit = jest.fn();
    return next();
  };
}

function buildStorageSvc() {
  return () => ({
    upload: jest.fn().mockResolvedValue({ data: { path: 'results/pat1/file.pdf' }, error: null }),
  });
}

function buildCleanScanner() {
  return () => ({
    scan: jest.fn().mockResolvedValue({ clean: true, result: 'clean', fileHash: 'abc123' }),
  });
}

function buildInfectedScanner() {
  return () => ({
    scan: jest.fn().mockResolvedValue({ clean: false, result: 'infected', fileHash: 'abc123', reason: 'Malware' }),
  });
}

function buildErrorScanner() {
  return () => ({
    scan: jest.fn().mockResolvedValue({ clean: false, result: 'error', fileHash: 'abc123', reason: 'Unavailable' }),
  });
}

function buildApp({ prisma, role, scanner } = {}) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => { req.audit = req.audit ?? jest.fn(); next(); });
  const router = createResultsRouter({
    prismaClient: prisma ?? buildPrisma(),
    authMiddlewareFactory: buildAuth({ role }),
    storageServiceFactory: buildStorageSvc(),
    malwareScanServiceFactory: scanner ?? buildCleanScanner(),
  });
  app.use('/results', router);
  app.use((err, _req, res, _next) => {
    res.status(err.status || 500).json({ error: 'internal_error', message: err.message });
  });
  return app;
}

// ── POST /results ─────────────────────────────────────────────────────────

describe('POST /results', () => {
  it('creates a result record without file', async () => {
    const res = await request(buildApp())
      .post('/results')
      .send({ patientId: 'pat1', testName: 'Blood Panel', notes: 'All normal' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id', 'res1');
    expect(res.body.status).toBe('AVAILABLE');
  });

  it('returns 400 when patientId is missing', async () => {
    const res = await request(buildApp())
      .post('/results')
      .send({ testName: 'Blood Panel' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when testName is missing', async () => {
    const res = await request(buildApp())
      .post('/results')
      .send({ patientId: 'pat1' });
    expect(res.status).toBe(400);
  });

  it('returns 404 when patient not found for tenant', async () => {
    const prisma = buildPrisma({ patientOverride: null });
    const res = await request(buildApp({ prisma }))
      .post('/results')
      .send({ patientId: 'pat999', testName: 'X' });
    expect(res.status).toBe(404);
  });

  it('returns 403 for SECRETARY role (not allowed to publish)', async () => {
    const res = await request(buildApp({ role: 'SECRETARY' }))
      .post('/results')
      .send({ patientId: 'pat1', testName: 'X' });
    expect(res.status).toBe(403);
  });

  it('blocks infected file upload with 422', async () => {
    const app = buildApp({ scanner: buildInfectedScanner() });
    const res = await request(app)
      .post('/results')
      .field('patientId', 'pat1')
      .field('testName', 'Blood Panel')
      .attach('file', Buffer.from('fake pdf'), { filename: 'report.pdf', contentType: 'application/pdf' });
    expect(res.status).toBe(422);
    expect(res.body.error).toBe('malware_detected');
  });

  it('returns 503 when scan service errors', async () => {
    const app = buildApp({ scanner: buildErrorScanner() });
    const res = await request(app)
      .post('/results')
      .field('patientId', 'pat1')
      .field('testName', 'Blood Panel')
      .attach('file', Buffer.from('fake pdf'), { filename: 'report.pdf', contentType: 'application/pdf' });
    expect(res.status).toBe(503);
  });
});

// ── GET /results ──────────────────────────────────────────────────────────

describe('GET /results', () => {
  it('returns published results for tenant', async () => {
    const res = await request(buildApp()).get('/results');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it('returns 403 for PATIENT role (use /patients/me/results instead)', async () => {
    const res = await request(buildApp({ role: 'PATIENT' })).get('/results');
    expect(res.status).toBe(403);
  });
});
