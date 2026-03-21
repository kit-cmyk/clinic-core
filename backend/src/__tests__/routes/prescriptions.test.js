import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { createPrescriptionsRouter } from '../../routes/prescriptions.js';

const MOCK_PRESCRIPTION = {
  id:             'rx1',
  tenantId:       't1',
  patientId:      'p1',
  visitId:        null,
  prescribedById: 'u1',
  medication:     'Amoxicillin',
  dosage:         '500mg',
  frequency:      'Three times daily',
  durationDays:   7,
  notes:          null,
  isActive:       true,
  createdAt:      new Date(),
  updatedAt:      new Date(),
};

function buildPrisma({ rxOverride, patientOverride } = {}) {
  return {
    patient: {
      findFirst: jest.fn().mockResolvedValue(
        patientOverride !== undefined ? patientOverride : { id: 'p1' },
      ),
    },
    prescription: {
      create:    jest.fn().mockResolvedValue(rxOverride ?? MOCK_PRESCRIPTION),
      findMany:  jest.fn().mockResolvedValue([MOCK_PRESCRIPTION]),
      count:     jest.fn().mockResolvedValue(1),
      findFirst: jest.fn().mockResolvedValue(rxOverride !== undefined ? rxOverride : MOCK_PRESCRIPTION),
      update:    jest.fn().mockResolvedValue({ ...MOCK_PRESCRIPTION, isActive: false }),
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

function buildApp({ prisma, role, rxOverride, patientOverride } = {}) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => { req.audit = jest.fn(); next(); });
  const router = createPrescriptionsRouter({
    prismaClient:         prisma ?? buildPrisma({ rxOverride, patientOverride }),
    authMiddlewareFactory: buildAuth({ role }),
  });
  app.use('/prescriptions', router);
  app.use((err, _req, res, _next) => {
    res.status(err.status || 500).json({ error: 'internal_error', message: err.message });
  });
  return app;
}

// ── POST /prescriptions ───────────────────────────────────────────────────────

describe('POST /prescriptions', () => {
  const validBody = {
    patientId: 'p1',
    medication: 'Amoxicillin',
    dosage:     '500mg',
    frequency:  'Three times daily',
    durationDays: 7,
  };

  it('creates a prescription for a valid patient', async () => {
    const res = await request(buildApp())
      .post('/prescriptions')
      .send(validBody);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id', 'rx1');
    expect(res.body).toHaveProperty('medication', 'Amoxicillin');
    expect(res.body).toHaveProperty('isActive', true);
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(buildApp())
      .post('/prescriptions')
      .send({ patientId: 'p1', medication: 'Amoxicillin' }); // missing dosage + frequency
    expect(res.status).toBe(400);
  });

  it('returns 404 when patient not found', async () => {
    const res = await request(buildApp({ patientOverride: null }))
      .post('/prescriptions')
      .send(validBody);
    expect(res.status).toBe(404);
  });

  it('returns 403 for non-DOCTOR role (NURSE cannot prescribe)', async () => {
    const res = await request(buildApp({ role: 'NURSE' }))
      .post('/prescriptions')
      .send(validBody);
    expect(res.status).toBe(403);
  });

  it('returns 403 for PATIENT role', async () => {
    const res = await request(buildApp({ role: 'PATIENT' }))
      .post('/prescriptions')
      .send(validBody);
    expect(res.status).toBe(403);
  });
});

// ── GET /prescriptions ────────────────────────────────────────────────────────

describe('GET /prescriptions', () => {
  it('returns prescriptions for the patient', async () => {
    const res = await request(buildApp()).get('/prescriptions?patientId=p1');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveLength(1);
  });

  it('returns 400 when patientId is missing', async () => {
    const res = await request(buildApp()).get('/prescriptions');
    expect(res.status).toBe(400);
  });

  it('returns 404 when patient not found', async () => {
    const res = await request(buildApp({ patientOverride: null }))
      .get('/prescriptions?patientId=nonexistent');
    expect(res.status).toBe(404);
  });

  it('NURSE can read prescriptions', async () => {
    const res = await request(buildApp({ role: 'NURSE' })).get('/prescriptions?patientId=p1');
    expect(res.status).toBe(200);
  });

  it('returns 403 for SECRETARY role', async () => {
    const res = await request(buildApp({ role: 'SECRETARY' })).get('/prescriptions?patientId=p1');
    expect(res.status).toBe(403);
  });
});

// ── PUT /prescriptions/:id ────────────────────────────────────────────────────

describe('PUT /prescriptions/:id', () => {
  it('marks prescription as inactive (completed)', async () => {
    const res = await request(buildApp())
      .put('/prescriptions/rx1')
      .send({ isActive: false });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('isActive', false);
  });

  it('returns 404 when prescription not found', async () => {
    const res = await request(buildApp({ rxOverride: null }))
      .put('/prescriptions/nonexistent')
      .send({ isActive: false });
    expect(res.status).toBe(404);
  });

  it('returns 400 when no fields provided', async () => {
    const res = await request(buildApp())
      .put('/prescriptions/rx1')
      .send({});
    expect(res.status).toBe(400);
  });

  it('returns 403 for NURSE role (cannot update prescriptions)', async () => {
    const res = await request(buildApp({ role: 'NURSE' }))
      .put('/prescriptions/rx1')
      .send({ isActive: false });
    expect(res.status).toBe(403);
  });
});
