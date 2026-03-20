import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { createMasterRouter } from '../../routes/master.js';

function buildPrisma({
  specialties = [],
  appointmentTypes = [],
  serviceCategories = [],
} = {}) {
  return {
    specialty: {
      findMany: jest.fn().mockResolvedValue(specialties),
      create: jest.fn().mockResolvedValue({ id: 's1', name: 'Cardiology', isActive: true }),
      update: jest.fn().mockResolvedValue({ id: 's1', name: 'Cardiology', isActive: false }),
    },
    appointmentType: {
      findMany: jest.fn().mockResolvedValue(appointmentTypes),
      create: jest.fn().mockResolvedValue({ id: 'at1', name: 'Consultation', defaultMinutes: 30, isActive: true }),
      update: jest.fn().mockResolvedValue({ id: 'at1', name: 'Consultation', defaultMinutes: 30, isActive: false }),
    },
    serviceCategory: {
      findMany: jest.fn().mockResolvedValue(serviceCategories),
      create: jest.fn().mockResolvedValue({ id: 'sc1', name: 'Radiology', isActive: true }),
      update: jest.fn().mockResolvedValue({ id: 'sc1', name: 'Radiology', isActive: false }),
    },
    user: {
      findUnique: jest.fn().mockResolvedValue({ id: 'u1', role: 'SUPER_ADMIN', isActive: true, tenantId: 't1' }),
    },
  };
}

function buildAuth({ role = 'SUPER_ADMIN' } = {}) {
  return ({ prismaClient: _p }) =>
    (_req, _res, next) => {
      _req.user = { id: 'u1', role };
      return next();
    };
}

function buildApp({ prisma, role } = {}) {
  const app = express();
  app.use(express.json());
  const router = createMasterRouter({
    prismaClient: prisma ?? buildPrisma(),
    authMiddlewareFactory: buildAuth({ role }),
  });
  app.use('/master', router);
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    res.status(err.status || 500).json({ error: 'internal_error', message: err.message });
  });
  return app;
}

describe('GET /master/specialties', () => {
  it('returns empty array when no specialties exist', async () => {
    const app = buildApp();
    const res = await request(app).get('/master/specialties');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns list of specialties', async () => {
    const specialties = [{ id: 's1', name: 'Cardiology', isActive: true }];
    const app = buildApp({ prisma: buildPrisma({ specialties }) });
    const res = await request(app).get('/master/specialties');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Cardiology');
  });
});

describe('POST /master/specialties', () => {
  it('creates a specialty as SUPER_ADMIN', async () => {
    const app = buildApp();
    const res = await request(app).post('/master/specialties').send({ name: 'Cardiology' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Cardiology');
  });

  it('returns 400 when name is missing', async () => {
    const app = buildApp();
    const res = await request(app).post('/master/specialties').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('validation_error');
  });

  it('returns 403 when caller is not SUPER_ADMIN', async () => {
    const app = buildApp({ role: 'ORG_ADMIN' });
    const res = await request(app).post('/master/specialties').send({ name: 'Cardiology' });
    expect(res.status).toBe(403);
  });
});

describe('POST /master/appointment-types', () => {
  it('creates an appointment type', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/master/appointment-types')
      .send({ name: 'Consultation', defaultMinutes: 30 });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Consultation');
  });

  it('returns 400 when name is missing', async () => {
    const app = buildApp();
    const res = await request(app).post('/master/appointment-types').send({ defaultMinutes: 30 });
    expect(res.status).toBe(400);
  });
});

describe('POST /master/service-categories', () => {
  it('creates a service category', async () => {
    const app = buildApp();
    const res = await request(app).post('/master/service-categories').send({ name: 'Radiology' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Radiology');
  });
});

describe('PATCH /master/specialties/:id', () => {
  it('deactivates a specialty', async () => {
    const app = buildApp();
    const res = await request(app).patch('/master/specialties/s1').send({ isActive: false });
    expect(res.status).toBe(200);
  });
});
