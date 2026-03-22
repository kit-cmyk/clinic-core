import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { createAppointmentsRouter } from '../../routes/appointments.js';

const NOW = new Date('2026-04-01T09:00:00.000Z');
const MOCK_APPT = {
  id:             'appt1',
  tenantId:       't1',
  patientId:      'p1',
  professionalId: 'prof1',
  branchId:       'b1',
  scheduledAt:    NOW,
  durationMins:   30,
  type:           'general',
  status:         'BOOKED',
  notes:          null,
  checkInAt:      null,
  createdAt:      NOW,
  updatedAt:      NOW,
};

function buildPrisma({ apptOverride, conflictAppt = null } = {}) {
  return {
    patient: {
      findFirst: jest.fn().mockResolvedValue({ id: 'p1' }),
    },
    branch: {
      findFirst: jest.fn().mockResolvedValue({ id: 'b1' }),
    },
    appointment: {
      create:    jest.fn().mockResolvedValue(apptOverride ?? MOCK_APPT),
      findMany:  jest.fn().mockResolvedValue([MOCK_APPT]),
      count:     jest.fn().mockResolvedValue(1),
      findFirst: jest.fn().mockImplementation(({ where }) => {
        // Return conflictAppt for conflict check, MOCK_APPT for tenant ownership check
        if (where?.status?.notIn) return Promise.resolve(conflictAppt);
        return Promise.resolve(apptOverride ?? MOCK_APPT);
      }),
      update:    jest.fn().mockResolvedValue({ ...MOCK_APPT, status: 'CONFIRMED' }),
    },
    emrVisit: {
      create: jest.fn().mockResolvedValue({ id: 'emr1' }),
    },
    $transaction: jest.fn().mockImplementation((ops) => Promise.all(ops)),
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
  const router = createAppointmentsRouter({
    prismaClient:         prisma ?? buildPrisma(),
    authMiddlewareFactory: buildAuth({ role }),
  });
  app.use('/appointments', router);
  app.use((err, _req, res, _next) => {
    res.status(err.status || 500).json({ error: 'internal_error', message: err.message });
  });
  return app;
}

// ── POST /appointments ────────────────────────────────────────────────────────

describe('POST /appointments', () => {
  const validBody = {
    patientId:      'p1',
    professionalId: 'prof1',
    branchId:       'b1',
    scheduledAt:    '2026-04-01T09:00:00.000Z',
    type:           'general',
  };

  it('creates an appointment successfully', async () => {
    const res = await request(buildApp())
      .post('/appointments')
      .send(validBody);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id', 'appt1');
    expect(res.body).toHaveProperty('status', 'BOOKED');
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(buildApp())
      .post('/appointments')
      .send({ patientId: 'p1' }); // missing professionalId, branchId, scheduledAt, type
    expect(res.status).toBe(400);
  });

  it('returns 404 when patient not found', async () => {
    const prisma = buildPrisma();
    prisma.patient.findFirst.mockResolvedValue(null);
    const res = await request(buildApp({ prisma }))
      .post('/appointments')
      .send(validBody);
    expect(res.status).toBe(404);
  });

  it('returns 409 on double-booking same professional', async () => {
    // conflictAppt overlaps with the requested time
    const conflictAppt = {
      id:          'appt-conflict',
      scheduledAt: new Date('2026-04-01T08:45:00.000Z'),
      durationMins: 30,
    };
    const prisma = buildPrisma({ conflictAppt });
    const res = await request(buildApp({ prisma }))
      .post('/appointments')
      .send(validBody);
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('conflict');
  });

  it('returns 403 for PATIENT role', async () => {
    const res = await request(buildApp({ role: 'PATIENT' }))
      .post('/appointments')
      .send(validBody);
    expect(res.status).toBe(403);
  });
});

// ── GET /appointments ─────────────────────────────────────────────────────────

describe('GET /appointments', () => {
  it('returns appointment list for the tenant', async () => {
    const res = await request(buildApp()).get('/appointments');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveLength(1);
  });

  it('PATIENT can also read appointments', async () => {
    const res = await request(buildApp({ role: 'PATIENT' })).get('/appointments');
    expect(res.status).toBe(200);
  });

  it('passes professionalId filter to query', async () => {
    const prisma = buildPrisma();
    await request(buildApp({ prisma })).get('/appointments?professionalId=prof99');
    expect(prisma.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ professionalId: 'prof99' }) }),
    );
  });
});

// ── PUT /appointments/:id ─────────────────────────────────────────────────────

describe('PUT /appointments/:id', () => {
  it('updates appointment status', async () => {
    const res = await request(buildApp())
      .put('/appointments/appt1')
      .send({ status: 'CONFIRMED' });
    expect(res.status).toBe(200);
  });

  it('returns 400 for invalid status', async () => {
    const res = await request(buildApp())
      .put('/appointments/appt1')
      .send({ status: 'CHECKED_IN' }); // CHECKED_IN is only set via check-in endpoint
    expect(res.status).toBe(400);
  });

  it('returns 404 when appointment not found', async () => {
    const prisma = buildPrisma();
    prisma.appointment.findFirst.mockResolvedValue(null);
    const res = await request(buildApp({ prisma }))
      .put('/appointments/nonexistent')
      .send({ status: 'CONFIRMED' });
    expect(res.status).toBe(404);
  });

  it('returns 400 when no fields provided', async () => {
    const res = await request(buildApp())
      .put('/appointments/appt1')
      .send({});
    expect(res.status).toBe(400);
  });
});

// ── DELETE /appointments/:id ──────────────────────────────────────────────────

describe('DELETE /appointments/:id', () => {
  it('cancels an appointment (204)', async () => {
    const res = await request(buildApp()).delete('/appointments/appt1');
    expect(res.status).toBe(204);
  });

  it('returns 404 when appointment not found', async () => {
    const prisma = buildPrisma();
    prisma.appointment.findFirst.mockResolvedValue(null);
    const res = await request(buildApp({ prisma })).delete('/appointments/nonexistent');
    expect(res.status).toBe(404);
  });

  it('returns 409 when appointment already cancelled', async () => {
    const prisma = buildPrisma({ apptOverride: { ...MOCK_APPT, status: 'CANCELLED' } });
    prisma.appointment.findFirst.mockResolvedValue({ ...MOCK_APPT, status: 'CANCELLED' });
    const res = await request(buildApp({ prisma })).delete('/appointments/appt1');
    expect(res.status).toBe(409);
  });
});

// ── POST /appointments/:id/check-in ───────────────────────────────────────────

describe('POST /appointments/:id/check-in (CC-62)', () => {
  it('checks patient in — status becomes CHECKED_IN', async () => {
    const checkedIn = { ...MOCK_APPT, status: 'CHECKED_IN', checkInAt: new Date() };
    const prisma = buildPrisma();
    prisma.appointment.findFirst.mockResolvedValue(MOCK_APPT);
    prisma.$transaction.mockResolvedValue([checkedIn, { id: 'emr1' }]);

    const res = await request(buildApp({ prisma })).post('/appointments/appt1/check-in');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'CHECKED_IN');
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('creates an EMR visit record on check-in', async () => {
    const checkedIn = { ...MOCK_APPT, status: 'CHECKED_IN', checkInAt: new Date() };
    const prisma = buildPrisma();
    prisma.appointment.findFirst.mockResolvedValue(MOCK_APPT);
    prisma.$transaction.mockResolvedValue([checkedIn, { id: 'emr1' }]);

    await request(buildApp({ prisma })).post('/appointments/appt1/check-in');
    expect(prisma.$transaction).toHaveBeenCalledWith(
      expect.arrayContaining([expect.anything(), expect.anything()]),
    );
  });

  it('returns 409 when already checked in', async () => {
    const prisma = buildPrisma();
    prisma.appointment.findFirst.mockResolvedValue({ ...MOCK_APPT, status: 'CHECKED_IN' });
    const res = await request(buildApp({ prisma })).post('/appointments/appt1/check-in');
    expect(res.status).toBe(409);
  });

  it('returns 409 when appointment is COMPLETED', async () => {
    const prisma = buildPrisma();
    prisma.appointment.findFirst.mockResolvedValue({ ...MOCK_APPT, status: 'COMPLETED' });
    const res = await request(buildApp({ prisma })).post('/appointments/appt1/check-in');
    expect(res.status).toBe(409);
  });

  it('returns 404 when appointment not found', async () => {
    const prisma = buildPrisma();
    prisma.appointment.findFirst.mockResolvedValue(null);
    const res = await request(buildApp({ prisma })).post('/appointments/nonexistent/check-in');
    expect(res.status).toBe(404);
  });
});
