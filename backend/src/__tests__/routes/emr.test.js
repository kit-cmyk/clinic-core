import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { createEmrRouter } from '../../routes/emr.js';

const MOCK_VISIT = {
  id:             'emr1',
  patientId:      'p1',
  appointmentId:  null,
  recordedById:   'u1',
  visitDate:      new Date(),
  chiefComplaint: 'Headache',
  vitals:         { bp: '120/80', hr: 72 },
  clinicalNotes:  'Mild tension headache',
  diagnoses:      ['G44.2'],
  treatmentPlan:  'Rest and hydration',
  followUpDays:   7,
  createdAt:      new Date(),
  updatedAt:      new Date(),
};

function buildPrisma({ visitOverride, patientOverride } = {}) {
  return {
    patient: {
      findFirst: jest.fn().mockResolvedValue(patientOverride !== undefined ? patientOverride : { id: 'p1' }),
    },
    emrVisit: {
      findMany:  jest.fn().mockResolvedValue([MOCK_VISIT]),
      count:     jest.fn().mockResolvedValue(1),
      findFirst: jest.fn().mockResolvedValue(visitOverride !== undefined ? visitOverride : MOCK_VISIT),
      create:    jest.fn().mockResolvedValue(MOCK_VISIT),
      update:    jest.fn().mockResolvedValue({ ...MOCK_VISIT, clinicalNotes: 'Updated' }),
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

function buildApp({ prisma, role, patientOverride, visitOverride } = {}) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => { req.audit = jest.fn(); next(); });
  const router = createEmrRouter({
    prismaClient:         prisma ?? buildPrisma({ patientOverride, visitOverride }),
    authMiddlewareFactory: buildAuth({ role }),
  });
  // EMR is mounted under /patients/:id/emr — use mergeParams
  const parent = express.Router();
  parent.use('/:id/emr', router);
  app.use('/patients', parent);
  app.use((err, _req, res, _next) => {
    res.status(err.status || 500).json({ error: 'internal_error', message: err.message });
  });
  return app;
}

// ── GET /patients/:id/emr ─────────────────────────────────────────────────────

describe('GET /patients/:id/emr', () => {
  it('returns EMR visits for the patient', async () => {
    const res = await request(buildApp()).get('/patients/p1/emr');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toHaveProperty('chiefComplaint', 'Headache');
  });

  it('returns 404 when patient not found (tenant isolation)', async () => {
    const res = await request(buildApp({ patientOverride: null }))
      .get('/patients/p-other-tenant/emr');
    expect(res.status).toBe(404);
  });

  it('returns 403 for PATIENT role', async () => {
    const res = await request(buildApp({ role: 'PATIENT' })).get('/patients/p1/emr');
    expect(res.status).toBe(403);
  });

  it('returns 403 for SECRETARY role', async () => {
    const res = await request(buildApp({ role: 'SECRETARY' })).get('/patients/p1/emr');
    expect(res.status).toBe(403);
  });
});

// ── POST /patients/:id/emr ────────────────────────────────────────────────────

describe('POST /patients/:id/emr', () => {
  it('creates a visit record', async () => {
    const res = await request(buildApp())
      .post('/patients/p1/emr')
      .send({ chiefComplaint: 'Headache', diagnoses: ['G44.2'] });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id', 'emr1');
  });

  it('returns 404 when patient not found', async () => {
    const res = await request(buildApp({ patientOverride: null }))
      .post('/patients/nonexistent/emr')
      .send({ chiefComplaint: 'Headache' });
    expect(res.status).toBe(404);
  });

  it('returns 403 for PATIENT role', async () => {
    const res = await request(buildApp({ role: 'PATIENT' }))
      .post('/patients/p1/emr')
      .send({ chiefComplaint: 'Headache' });
    expect(res.status).toBe(403);
  });
});

// ── PUT /patients/:id/emr/:visitId ────────────────────────────────────────────

describe('PUT /patients/:id/emr/:visitId', () => {
  it('updates an EMR visit', async () => {
    const res = await request(buildApp())
      .put('/patients/p1/emr/emr1')
      .send({ clinicalNotes: 'Updated notes' });
    expect(res.status).toBe(200);
  });

  it('returns 404 when visit not found', async () => {
    const res = await request(buildApp({ visitOverride: null }))
      .put('/patients/p1/emr/nonexistent')
      .send({ clinicalNotes: 'Notes' });
    expect(res.status).toBe(404);
  });

  it('returns 400 when no fields provided', async () => {
    const res = await request(buildApp())
      .put('/patients/p1/emr/emr1')
      .send({});
    expect(res.status).toBe(400);
  });

  it('returns 403 for PATIENT role', async () => {
    const res = await request(buildApp({ role: 'PATIENT' }))
      .put('/patients/p1/emr/emr1')
      .send({ clinicalNotes: 'Notes' });
    expect(res.status).toBe(403);
  });
});
