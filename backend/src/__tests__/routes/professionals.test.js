import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { createProfessionalsRouter } from '../../routes/professionals.js';

const MOCK_PROFESSIONAL = {
  id:               'prof1',
  tenantId:         't1',
  userId:           'u1',
  specialization:   'General Practice',
  bio:              'Experienced GP',
  slotDurationMins: 30,
  isActive:         true,
  createdAt:        new Date('2026-01-01'),
  updatedAt:        new Date('2026-01-01'),
  user: { firstName: 'Sarah', lastName: 'Kim', email: 'sarah@clinic.com', role: 'DOCTOR' },
  schedules: [
    { id: 'sch1', branchId: 'b1', weekday: 1, startTime: '08:00', endTime: '17:00' },
  ],
};

const MOCK_TIMEOFF = {
  id:        'to1',
  startDate: new Date('2026-04-10'),
  endDate:   new Date('2026-04-12'),
  reason:    'Conference',
};

function buildPrisma({ profOverride } = {}) {
  return {
    professional: {
      findMany:  jest.fn().mockResolvedValue([MOCK_PROFESSIONAL]),
      findFirst: jest.fn().mockResolvedValue(
        profOverride !== undefined ? profOverride : { ...MOCK_PROFESSIONAL, timeOffs: [MOCK_TIMEOFF] }
      ),
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

function buildApp({ prisma, role } = {}) {
  const app = express();
  app.use(express.json());
  const router = createProfessionalsRouter({
    prismaClient:         prisma ?? buildPrisma(),
    authMiddlewareFactory: buildAuth({ role }),
  });
  app.use('/professionals', router);
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    res.status(err.status || 500).json({ error: 'internal_error', message: err.message });
  });
  return app;
}

// ── GET /professionals ────────────────────────────────────────────────────────

describe('GET /professionals', () => {
  it('returns active professionals for the tenant', async () => {
    const app = buildApp();
    const res = await request(app).get('/professionals');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].id).toBe('prof1');
    expect(res.body.data[0].user.firstName).toBe('Sarah');
    expect(res.body.data[0].schedules).toHaveLength(1);
  });

  it('passes isActive filter to prisma', async () => {
    const prisma = buildPrisma();
    const app    = buildApp({ prisma });
    await request(app).get('/professionals?isActive=false');
    const call = prisma.professional.findMany.mock.calls[0][0];
    expect(call.where.isActive).toBe(false);
  });

  it('defaults to isActive=true when not provided', async () => {
    const prisma = buildPrisma();
    const app    = buildApp({ prisma });
    await request(app).get('/professionals');
    const call = prisma.professional.findMany.mock.calls[0][0];
    expect(call.where.isActive).toBe(true);
  });

  it('filters by tenantId', async () => {
    const prisma = buildPrisma();
    const app    = buildApp({ prisma });
    await request(app).get('/professionals');
    const call = prisma.professional.findMany.mock.calls[0][0];
    expect(call.where.tenantId).toBe('t1');
  });

  it('returns 401 when not authenticated', async () => {
    const app = express();
    app.use(express.json());
    const router = createProfessionalsRouter({
      prismaClient:         buildPrisma(),
      authMiddlewareFactory: () => (_req, res) => res.status(401).json({ error: 'unauthorized' }),
    });
    app.use('/professionals', router);
    const res = await request(app).get('/professionals');
    expect(res.status).toBe(401);
  });
});

// ── GET /professionals/:id ─────────────────────────────────────────────────────

describe('GET /professionals/:id', () => {
  it('returns professional with schedules and upcoming time-offs', async () => {
    const app = buildApp();
    const res = await request(app).get('/professionals/prof1');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('prof1');
    expect(res.body.timeOffs).toHaveLength(1);
    expect(res.body.schedules).toHaveLength(1);
  });

  it('returns 404 when professional not found', async () => {
    const prisma = buildPrisma({ profOverride: null });
    const app    = buildApp({ prisma });
    const res    = await request(app).get('/professionals/missing');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('not_found');
  });

  it('filters by tenantId (tenant isolation)', async () => {
    const prisma = buildPrisma();
    const app    = buildApp({ prisma });
    await request(app).get('/professionals/prof1');
    const call = prisma.professional.findFirst.mock.calls[0][0];
    expect(call.where.tenantId).toBe('t1');
    expect(call.where.id).toBe('prof1');
  });
});
