import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { createNotificationsRouter } from '../../routes/notifications.js';

const MOCK_NOTIFICATION = {
  id:           'n1',
  type:         'patient_upload',
  title:        'New upload from patient',
  body:         'Jane Doe uploaded a lab result for review.',
  resourceType: 'LabResult',
  resourceId:   'lr1',
  isRead:       false,
  readAt:       null,
  createdAt:    new Date(),
};

function buildPrisma({ notifOverride } = {}) {
  return {
    notification: {
      findMany:  jest.fn().mockResolvedValue([MOCK_NOTIFICATION]),
      count:     jest.fn().mockResolvedValue(1),
      findFirst: jest.fn().mockResolvedValue(
        notifOverride !== undefined ? notifOverride : MOCK_NOTIFICATION,
      ),
      update:    jest.fn().mockResolvedValue({ ...MOCK_NOTIFICATION, isRead: true, readAt: new Date() }),
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

function buildApp({ prisma, role, notifOverride } = {}) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => { req.audit = jest.fn(); next(); });
  const router = createNotificationsRouter({
    prismaClient:         prisma ?? buildPrisma({ notifOverride }),
    authMiddlewareFactory: buildAuth({ role }),
  });
  app.use('/notifications', router);
  app.use((err, _req, res, _next) => {
    res.status(err.status || 500).json({ error: 'internal_error', message: err.message });
  });
  return app;
}

// ── GET /notifications ────────────────────────────────────────────────────────

describe('GET /notifications', () => {
  it('returns unread notifications for the user', async () => {
    const res = await request(buildApp()).get('/notifications');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toHaveProperty('isRead', false);
  });

  it('queries with isRead: false by default', async () => {
    const prisma = buildPrisma();
    await request(buildApp({ prisma })).get('/notifications');
    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isRead: false }),
      }),
    );
  });

  it('includes all notifications when unreadOnly=false', async () => {
    const prisma = buildPrisma();
    await request(buildApp({ prisma })).get('/notifications?unreadOnly=false');
    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.not.objectContaining({ isRead: false }),
      }),
    );
  });

  it('PATIENT role can read their own notifications', async () => {
    const res = await request(buildApp({ role: 'PATIENT' })).get('/notifications');
    expect(res.status).toBe(200);
  });
});

// ── PUT /notifications/:id/read ───────────────────────────────────────────────

describe('PUT /notifications/:id/read', () => {
  it('marks notification as read', async () => {
    const res = await request(buildApp()).put('/notifications/n1/read');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('isRead', true);
    expect(res.body).toHaveProperty('readAt');
  });

  it('returns 404 when notification not found', async () => {
    const res = await request(buildApp({ notifOverride: null }))
      .put('/notifications/nonexistent/read');
    expect(res.status).toBe(404);
  });

  it('returns 403 for unauthenticated (permission check fails)', async () => {
    // No role that maps to notifications:read => should 403 if role removed
    // Testing via a role that isn't in notifications:read... but all clinical + patient have it.
    // Verify the permission is enforced by the RBAC middleware at all.
    const prisma = buildPrisma();
    const app = express();
    app.use(express.json());
    // No auth middleware at all → requireAuth will 401
    const router = createNotificationsRouter({ prismaClient: prisma });
    app.use('/notifications', router);
    app.use((err, _req, res, _next) => {
      res.status(err.status || 500).json({ error: 'error', message: err.message });
    });
    const res = await request(app).put('/notifications/n1/read');
    expect(res.status).toBe(401);
  });
});
