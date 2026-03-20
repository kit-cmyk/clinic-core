import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { createRequireAuth, requireRole } from '../../middleware/auth.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

const MOCK_USER = {
  id: 'user-uuid-1',
  tenantId: 'tenant-uuid-1',
  role: 'ORG_ADMIN',
  isActive: true,
};

/** Build a mock Supabase admin client. */
function mockSupabase({ supabaseUserId = 'supabase-uid-1', fail = false } = {}) {
  return {
    auth: {
      getUser: jest.fn().mockResolvedValue(
        fail
          ? { data: null, error: { message: 'Token is expired or invalid' } }
          : { data: { user: { id: supabaseUserId } }, error: null }
      ),
    },
  };
}

function buildMockPrisma(user = MOCK_USER) {
  return { user: { findUnique: jest.fn().mockResolvedValue(user) } };
}

function buildApp(middleware) {
  const app = express();
  app.use(express.json());
  app.get('/protected', middleware, (req, res) => {
    res.json({ tenantId: req.tenantId, role: req.user.role });
  });
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => res.status(500).json({ error: 'internal_error', message: err.message }));
  return app;
}

// ── requireAuth — missing / malformed header ──────────────────────────────────

describe('requireAuth — missing / malformed Authorization header', () => {
  let app;

  beforeEach(() => {
    const supabaseAdmin = mockSupabase();
    const requireAuth = createRequireAuth({ prismaClient: buildMockPrisma(), supabaseAdmin });
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
});

// ── requireAuth — Supabase token validation ───────────────────────────────────

describe('requireAuth — Supabase token validation', () => {
  it('returns 401 when Supabase rejects the token (invalid)', async () => {
    const requireAuth = createRequireAuth({
      prismaClient: buildMockPrisma(),
      supabaseAdmin: mockSupabase({ fail: true }),
    });
    const res = await request(buildApp(requireAuth))
      .get('/protected')
      .set('Authorization', 'Bearer invalid-token');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('unauthorized');
  });

  it('returns 401 when Supabase rejects the token (expired)', async () => {
    const requireAuth = createRequireAuth({
      prismaClient: buildMockPrisma(),
      supabaseAdmin: mockSupabase({ fail: true }),
    });
    const res = await request(buildApp(requireAuth))
      .get('/protected')
      .set('Authorization', 'Bearer expired-token');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('unauthorized');
  });

  it('does not call Prisma when Supabase rejects the token', async () => {
    const mockPrisma = buildMockPrisma();
    const requireAuth = createRequireAuth({
      prismaClient: mockPrisma,
      supabaseAdmin: mockSupabase({ fail: true }),
    });
    await request(buildApp(requireAuth))
      .get('/protected')
      .set('Authorization', 'Bearer bad-token');
    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
  });
});

// ── requireAuth — user DB lookup ──────────────────────────────────────────────

describe('requireAuth — user DB lookup', () => {
  it('returns 403 when user is not found in DB', async () => {
    const requireAuth = createRequireAuth({
      prismaClient: buildMockPrisma(null),
      supabaseAdmin: mockSupabase(),
    });
    const res = await request(buildApp(requireAuth))
      .get('/protected')
      .set('Authorization', 'Bearer valid-token');
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('forbidden');
  });

  it('returns 403 when user.isActive is false', async () => {
    const requireAuth = createRequireAuth({
      prismaClient: buildMockPrisma({ ...MOCK_USER, isActive: false }),
      supabaseAdmin: mockSupabase(),
    });
    const res = await request(buildApp(requireAuth))
      .get('/protected')
      .set('Authorization', 'Bearer valid-token');
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('forbidden');
  });

  it('queries Prisma with supabaseUserId extracted from Supabase response', async () => {
    const mockPrisma = buildMockPrisma();
    const requireAuth = createRequireAuth({
      prismaClient: mockPrisma,
      supabaseAdmin: mockSupabase({ supabaseUserId: 'supabase-uid-abc' }),
    });
    await request(buildApp(requireAuth))
      .get('/protected')
      .set('Authorization', 'Bearer valid-token');
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { supabaseUserId: 'supabase-uid-abc' },
      select: { id: true, tenantId: true, role: true, isActive: true },
    });
  });

  it('forwards DB errors to Express error handler', async () => {
    const mockPrisma = { user: { findUnique: jest.fn().mockRejectedValue(new Error('DB down')) } };
    const requireAuth = createRequireAuth({
      prismaClient: mockPrisma,
      supabaseAdmin: mockSupabase(),
    });
    const app = express();
    app.use(express.json());
    app.get('/protected', requireAuth, (_req, res) => res.json({ ok: true }));
    // eslint-disable-next-line no-unused-vars
    app.use((err, _req, res, _next) => res.status(500).json({ error: 'internal_error', message: err.message }));
    const res = await request(app).get('/protected').set('Authorization', 'Bearer valid-token');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('internal_error');
  });
});

// ── requireAuth — successful authentication ───────────────────────────────────

describe('requireAuth — successful authentication', () => {
  it('returns 200 and attaches tenantId to the request', async () => {
    const requireAuth = createRequireAuth({
      prismaClient: buildMockPrisma(),
      supabaseAdmin: mockSupabase(),
    });
    const res = await request(buildApp(requireAuth))
      .get('/protected')
      .set('Authorization', 'Bearer valid-token');
    expect(res.status).toBe(200);
    expect(res.body.tenantId).toBe(MOCK_USER.tenantId);
  });

  it('attaches req.user with the correct role', async () => {
    const requireAuth = createRequireAuth({
      prismaClient: buildMockPrisma(),
      supabaseAdmin: mockSupabase(),
    });
    const res = await request(buildApp(requireAuth))
      .get('/protected')
      .set('Authorization', 'Bearer valid-token');
    expect(res.body.role).toBe(MOCK_USER.role);
  });
});

// ── requireRole ───────────────────────────────────────────────────────────────

describe('requireRole middleware', () => {
  const ALL_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'DOCTOR', 'NURSE', 'SECRETARY', 'PATIENT'];

  function buildRoleApp(userRole, allowedRoles) {
    const requireAuth = createRequireAuth({
      prismaClient: buildMockPrisma({ ...MOCK_USER, role: userRole }),
      supabaseAdmin: mockSupabase(),
    });
    const app = express();
    app.use(express.json());
    app.get('/admin', requireAuth, requireRole(...allowedRoles), (_req, res) => res.json({ ok: true }));
    // eslint-disable-next-line no-unused-vars
    app.use((err, _req, res, _next) => res.status(500).json({ error: 'internal_error' }));
    return app;
  }

  it('allows request when user role is in the allowed list', async () => {
    const res = await request(buildRoleApp('ORG_ADMIN', ['ORG_ADMIN']))
      .get('/admin')
      .set('Authorization', 'Bearer valid-token');
    expect(res.status).toBe(200);
  });

  it('returns 403 when user role is not in the allowed list', async () => {
    const res = await request(buildRoleApp('PATIENT', ['ORG_ADMIN', 'DOCTOR']))
      .get('/admin')
      .set('Authorization', 'Bearer valid-token');
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('forbidden');
  });

  it('allows any role in a multi-role list', async () => {
    const res = await request(buildRoleApp('NURSE', ['ORG_ADMIN', 'DOCTOR', 'NURSE']))
      .get('/admin')
      .set('Authorization', 'Bearer valid-token');
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

  // Verify each of the 6 roles resolves correctly when allowed
  for (const role of ALL_ROLES) {
    it(`allows ${role} when ${role} is in the allowed list`, async () => {
      const res = await request(buildRoleApp(role, [role]))
        .get('/admin')
        .set('Authorization', 'Bearer valid-token');
      expect(res.status).toBe(200);
    });
  }

  // Verify each role is blocked when not in the list
  for (const role of ALL_ROLES) {
    it(`blocks ${role} when ${role} is NOT in the allowed list`, async () => {
      const otherRoles = ALL_ROLES.filter((r) => r !== role);
      const res = await request(buildRoleApp(role, otherRoles))
        .get('/admin')
        .set('Authorization', 'Bearer valid-token');
      expect(res.status).toBe(403);
    });
  }
});
