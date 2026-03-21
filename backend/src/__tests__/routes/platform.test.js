import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { createPlatformRouter } from '../../routes/platform.js';

const MOCK_ANNOUNCEMENT = {
  id: 'ann-1',
  title: 'System update',
  body: 'We will be upgrading DB on Friday.',
  severity: 'INFO',
  isArchived: false,
  publishedAt: new Date().toISOString(),
};

const MOCK_FLAG = {
  id: 'ff-1',
  key: 'enhanced_lab_encryption',
  label: 'Enhanced Lab Encryption',
  enabledFor: ['PRO', 'ENTERPRISE'],
};

const MOCK_WINDOW = {
  id: 'mw-1',
  title: 'Scheduled maintenance',
  startsAt: new Date(Date.now() + 3600000).toISOString(),
  endsAt: new Date(Date.now() + 7200000).toISOString(),
  isCancelled: false,
};

function buildPrisma() {
  return {
    announcement: {
      findMany: jest.fn().mockResolvedValue([MOCK_ANNOUNCEMENT]),
      create: jest.fn().mockResolvedValue(MOCK_ANNOUNCEMENT),
      update: jest.fn().mockResolvedValue({ ...MOCK_ANNOUNCEMENT, isArchived: true }),
    },
    featureFlag: {
      findMany: jest.fn().mockResolvedValue([MOCK_FLAG]),
      create: jest.fn().mockResolvedValue(MOCK_FLAG),
      update: jest.fn().mockResolvedValue({ ...MOCK_FLAG, enabledFor: ['PRO'] }),
    },
    maintenanceWindow: {
      findMany: jest.fn().mockResolvedValue([MOCK_WINDOW]),
      create: jest.fn().mockResolvedValue(MOCK_WINDOW),
      update: jest.fn().mockResolvedValue({ ...MOCK_WINDOW, isCancelled: true }),
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
  const router = createPlatformRouter({
    prismaClient: prisma ?? buildPrisma(),
    authMiddlewareFactory: buildAuth({ role }),
  });
  app.use('/platform', router);
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    res.status(err.status || 500).json({ error: 'internal_error', message: err.message });
  });
  return app;
}

describe('GET /platform/announcements', () => {
  it('returns active announcements', async () => {
    const app = buildApp();
    const res = await request(app).get('/platform/announcements');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe('System update');
  });
});

describe('POST /platform/announcements', () => {
  it('creates an announcement as SUPER_ADMIN', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/platform/announcements')
      .send({ title: 'System update', body: 'DB upgrade Friday.', severity: 'INFO' });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('System update');
  });

  it('returns 400 when title or body is missing', async () => {
    const app = buildApp();
    const res = await request(app).post('/platform/announcements').send({ title: 'Only title' });
    expect(res.status).toBe(400);
  });

  it('returns 403 for non-super-admin', async () => {
    const app = buildApp({ role: 'ORG_ADMIN' });
    const res = await request(app)
      .post('/platform/announcements')
      .send({ title: 'X', body: 'Y' });
    expect(res.status).toBe(403);
  });
});

describe('PATCH /platform/announcements/:id/archive', () => {
  it('archives an announcement', async () => {
    const app = buildApp();
    const res = await request(app).patch('/platform/announcements/ann-1/archive');
    expect(res.status).toBe(200);
    expect(res.body.isArchived).toBe(true);
  });
});

describe('GET /platform/feature-flags', () => {
  it('returns list of feature flags', async () => {
    const app = buildApp();
    const res = await request(app).get('/platform/feature-flags');
    expect(res.status).toBe(200);
    expect(res.body[0].key).toBe('enhanced_lab_encryption');
  });
});

describe('PATCH /platform/feature-flags/:id', () => {
  it('updates enabledFor plans', async () => {
    const app = buildApp();
    const res = await request(app)
      .patch('/platform/feature-flags/ff-1')
      .send({ enabledFor: ['PRO'] });
    expect(res.status).toBe(200);
    expect(res.body.enabledFor).toEqual(['PRO']);
  });
});

describe('POST /platform/maintenance', () => {
  it('creates a maintenance window', async () => {
    const app = buildApp();
    const res = await request(app).post('/platform/maintenance').send({
      title: 'Scheduled maintenance',
      startsAt: new Date(Date.now() + 3600000).toISOString(),
      endsAt: new Date(Date.now() + 7200000).toISOString(),
    });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Scheduled maintenance');
  });

  it('returns 400 when required fields are missing', async () => {
    const app = buildApp();
    const res = await request(app).post('/platform/maintenance').send({ title: 'Only title' });
    expect(res.status).toBe(400);
  });
});
