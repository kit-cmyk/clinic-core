import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { createRequireAuth, requireRole } from '../../middleware/auth.js';

const TEST_SECRET = 'test-secret-for-cliniccore-auth-tests';

const mockUser = {
  id: 'user-uuid-1',
  tenantId: 'tenant-uuid-1',
  role: 'ORG_ADMIN',
  isActive: true,
};

function buildMockPrisma(user = mockUser) {
  return { user: { findUnique: jest.fn().mockResolvedValue(user) } };
}

function buildApp(middleware) {
  const app = express();
  app.use(express.json());
  app.get('/protected', middleware, (req, res) => {
    res.json({ tenantId: req.tenantId, role: req.user.role });
  });
  return app;
}

function makeToken(sub = 'supabase-uid-1', secret = TEST_SECRET, opts = {}) {
  return jwt.sign({ sub, ...opts }, secret, { expiresIn: '1h' });
}

// ── requireAuth ───────────────────────────────────────────────────────────────

describe('requireAuth — missing / malformed token', () => {
  let app;

  beforeEach(() => {
    const requireAuth = createRequireAuth({ prismaClient: buildMockPrisma(), jwtSecret: TEST_SECRET });
    app = buildApp(requireAuth);
  });

  it('returns 401 when Authorization header is absent', async () => {
    const res = await request(app).get('/protected');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('unauthorized');
  });

  it('returns 401 when Authorization scheme is not Bearer', async () => {
    const res = await request(app).get('/protected').set('Authorization', 'Basic abc123');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('unauthorized');
  });

  it('returns 401 when token is not a valid JWT', async () => {
    const res = await request(app).get('/protected').set('Authorization', 'Bearer not.a.real.token');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('unauthorized');
  });

  it('returns 401 when token is signed with wrong secret', async () => {
    const token = makeToken('uid-1', 'wrong-secret');
    const res = await request(app).get('/protected').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('unauthorized');
  });

  it('returns 401 when token has no sub claim', async () => {
    const token = jwt.sign({ role: 'user' }, TEST_SECRET, { expiresIn: '1h' });
    const res = await request(app).get('/protected').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('unauthorized');
  });

  it('returns 401 when token is expired', async () => {
    const token = jwt.sign({ sub: 'uid-1' }, TEST_SECRET, { expiresIn: '-1s' });
    const res = await request(app).get('/protected').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('unauthorized');
  });
});

describe('requireAuth — user DB lookup', () => {
  it('returns 403 when user is not found in DB', async () => {
    const mockPrisma = buildMockPrisma(null);
    const requireAuth = createRequireAuth({ prismaClient: mockPrisma, jwtSecret: TEST_SECRET });
    const app = buildApp(requireAuth);

    const token = makeToken('unknown-uid');
    const res = await request(app).get('/protected').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('forbidden');
  });

  it('returns 403 when user.isActive is false', async () => {
    const mockPrisma = buildMockPrisma({ ...mockUser, isActive: false });
    const requireAuth = createRequireAuth({ prismaClient: mockPrisma, jwtSecret: TEST_SECRET });
    const app = buildApp(requireAuth);

    const token = makeToken();
    const res = await request(app).get('/protected').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('forbidden');
  });

  it('queries prisma with supabaseUserId extracted from token sub', async () => {
    const mockPrisma = buildMockPrisma();
    const requireAuth = createRequireAuth({ prismaClient: mockPrisma, jwtSecret: TEST_SECRET });
    const app = buildApp(requireAuth);

    const token = makeToken('supabase-uid-abc');
    await request(app).get('/protected').set('Authorization', `Bearer ${token}`);

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { supabaseUserId: 'supabase-uid-abc' },
      select: { id: true, tenantId: true, role: true, isActive: true },
    });
  });

  it('forwards DB errors to Express error handler', async () => {
    const mockPrisma = { user: { findUnique: jest.fn().mockRejectedValue(new Error('DB down')) } };
    const requireAuth = createRequireAuth({ prismaClient: mockPrisma, jwtSecret: TEST_SECRET });
    const app = express();
    app.use(express.json());
    app.get('/protected', requireAuth, (_req, res) => res.json({ ok: true }));
    // eslint-disable-next-line no-unused-vars
    app.use((err, _req, res, _next) => res.status(500).json({ error: 'internal_error', message: err.message }));

    const token = makeToken();
    const res = await request(app).get('/protected').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('internal_error');
  });
});

describe('requireAuth — successful authentication', () => {
  let mockPrisma;
  let app;

  beforeEach(() => {
    mockPrisma = buildMockPrisma();
    const requireAuth = createRequireAuth({ prismaClient: mockPrisma, jwtSecret: TEST_SECRET });
    app = buildApp(requireAuth);
  });

  it('returns 200 and attaches tenantId to response', async () => {
    const token = makeToken();
    const res = await request(app).get('/protected').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.tenantId).toBe(mockUser.tenantId);
  });

  it('attaches req.user with role', async () => {
    const token = makeToken();
    const res = await request(app).get('/protected').set('Authorization', `Bearer ${token}`);
    expect(res.body.role).toBe(mockUser.role);
  });
});

// ── requireRole ───────────────────────────────────────────────────────────────

describe('requireRole middleware', () => {
  function buildRoleApp(userRole, allowedRoles) {
    const mockPrisma = buildMockPrisma({ ...mockUser, role: userRole });
    const requireAuth = createRequireAuth({ prismaClient: mockPrisma, jwtSecret: TEST_SECRET });
    const app = express();
    app.use(express.json());
    app.get('/admin', requireAuth, requireRole(...allowedRoles), (_req, res) => res.json({ ok: true }));
    return app;
  }

  it('allows request when user role is in the allowed list', async () => {
    const app = buildRoleApp('ORG_ADMIN', ['ORG_ADMIN']);
    const token = makeToken();
    const res = await request(app).get('/admin').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('returns 403 when user role is not in the allowed list', async () => {
    const app = buildRoleApp('PATIENT', ['ORG_ADMIN', 'DOCTOR']);
    const token = makeToken();
    const res = await request(app).get('/admin').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('forbidden');
  });

  it('allows any role in a multi-role list', async () => {
    const app = buildRoleApp('NURSE', ['ORG_ADMIN', 'DOCTOR', 'NURSE']);
    const token = makeToken();
    const res = await request(app).get('/admin').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('returns 401 when requireRole is used without prior requireAuth', async () => {
    const app = express();
    app.use(express.json());
    app.get('/admin', requireRole('ORG_ADMIN'), (_req, res) => res.json({ ok: true }));
    const res = await request(app).get('/admin');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('unauthorized');
  });
});
