/**
 * CC-17 / CC-25 — Tenant Isolation Integration Tests
 *
 * Verifies that the auth middleware correctly binds each request to a single
 * tenant and that route handlers scoped by req.tenantId cannot be tricked into
 * returning or mutating another tenant's data.
 *
 * Uses injectable supabaseAdmin mocks — no real Supabase JWT required.
 */
import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { createRequireAuth } from '../middleware/auth.js';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const TENANT_A = 'tenant-uuid-aaaa';
const TENANT_B = 'tenant-uuid-bbbb';

const userA = { id: 'user-a', tenantId: TENANT_A, role: 'ORG_ADMIN', isActive: true };
const userB = { id: 'user-b', tenantId: TENANT_B, role: 'ORG_ADMIN', isActive: true };

/**
 * Mock Supabase admin that routes tokens to user IDs by a lookup map.
 * Tokens not in the map are treated as invalid (simulates wrong-secret / expired).
 */
function buildMultiTenantSupabase() {
  const validTokens = {
    'token-a': 'sub-a',
    'token-b': 'sub-b',
    'token-unknown': 'sub-unknown', // valid Supabase token but user not in DB
  };
  return {
    auth: {
      getUser: jest.fn((token) => {
        const userId = validTokens[token];
        if (userId) return Promise.resolve({ data: { user: { id: userId } }, error: null });
        return Promise.resolve({ data: null, error: { message: 'Invalid or expired token' } });
      }),
    },
  };
}

/** Mock Prisma that returns different users based on supabaseUserId. */
function buildMultiTenantPrisma() {
  return {
    user: {
      findUnique: jest.fn(({ where }) => {
        if (where.supabaseUserId === 'sub-a') return Promise.resolve(userA);
        if (where.supabaseUserId === 'sub-b') return Promise.resolve(userB);
        return Promise.resolve(null);
      }),
    },
  };
}

/** A sample app with a tenant-scoped read and write route. */
function buildTenantScopedApp(prisma = buildMultiTenantPrisma(), supabase = buildMultiTenantSupabase()) {
  const requireAuth = createRequireAuth({ prismaClient: prisma, supabaseAdmin: supabase });
  const app = express();
  app.use(express.json());

  app.get('/data', requireAuth, (req, res) => {
    res.json({ tenantId: req.tenantId, userId: req.user.id });
  });

  app.post('/data', requireAuth, (req, res) => {
    res.status(201).json({ createdFor: req.tenantId, body: req.body });
  });

  return app;
}

// ── Tenant binding ─────────────────────────────────────────────────────────

describe('tenant isolation — req.tenantId binding', () => {
  it('binds req.tenantId to tenant A when authenticated as tenant A user', async () => {
    const app = buildTenantScopedApp();
    const res = await request(app).get('/data').set('Authorization', 'Bearer token-a');
    expect(res.status).toBe(200);
    expect(res.body.tenantId).toBe(TENANT_A);
  });

  it('binds req.tenantId to tenant B when authenticated as tenant B user', async () => {
    const app = buildTenantScopedApp();
    const res = await request(app).get('/data').set('Authorization', 'Bearer token-b');
    expect(res.status).toBe(200);
    expect(res.body.tenantId).toBe(TENANT_B);
  });

  it('tenant A and tenant B get different tenantIds from the same endpoint', async () => {
    const app = buildTenantScopedApp();
    const [resA, resB] = await Promise.all([
      request(app).get('/data').set('Authorization', 'Bearer token-a'),
      request(app).get('/data').set('Authorization', 'Bearer token-b'),
    ]);
    expect(resA.body.tenantId).not.toBe(resB.body.tenantId);
    expect(resA.body.tenantId).toBe(TENANT_A);
    expect(resB.body.tenantId).toBe(TENANT_B);
  });
});

// ── Cross-tenant access prevention ────────────────────────────────────────

describe('tenant isolation — cross-tenant access is blocked', () => {
  it("user A's tenantId is never set to tenant B's value", async () => {
    const app = buildTenantScopedApp();
    const res = await request(app).get('/data').set('Authorization', 'Bearer token-a');
    expect(res.body.tenantId).not.toBe(TENANT_B);
  });

  it('unauthenticated requests cannot reach tenant-scoped routes', async () => {
    const app = buildTenantScopedApp();
    const res = await request(app).get('/data');
    expect(res.status).toBe(401);
    expect(res.body.tenantId).toBeUndefined();
  });

  it('a forged or tampered token is rejected by Supabase — no tenantId leakage', async () => {
    const app = buildTenantScopedApp();
    // 'forgery-token' is not in the mock's valid-token map → Supabase rejects it
    const res = await request(app).get('/data').set('Authorization', 'Bearer forgery-token');
    expect(res.status).toBe(401);
    expect(res.body.tenantId).toBeUndefined();
  });

  it('a token for an unknown user (not in DB) is rejected — no tenantId leakage', async () => {
    const app = buildTenantScopedApp();
    // token-unknown passes Supabase but maps to a supabaseUserId not in Prisma mock
    const res = await request(app).get('/data').set('Authorization', 'Bearer token-unknown');
    expect(res.status).toBe(403);
    expect(res.body.tenantId).toBeUndefined();
  });
});

// ── Write isolation ────────────────────────────────────────────────────────

describe('tenant isolation — writes are scoped to the authenticated tenant', () => {
  it('POST request carries tenant A tenantId — never tenant B', async () => {
    const app = buildTenantScopedApp();
    const res = await request(app)
      .post('/data')
      .set('Authorization', 'Bearer token-a')
      .send({ name: 'Test Resource' });
    expect(res.status).toBe(201);
    expect(res.body.createdFor).toBe(TENANT_A);
    expect(res.body.createdFor).not.toBe(TENANT_B);
  });

  it('two concurrent writes for different tenants carry their own tenantIds', async () => {
    const app = buildTenantScopedApp();
    const [resA, resB] = await Promise.all([
      request(app).post('/data').set('Authorization', 'Bearer token-a').send({ x: 1 }),
      request(app).post('/data').set('Authorization', 'Bearer token-b').send({ x: 2 }),
    ]);
    expect(resA.body.createdFor).toBe(TENANT_A);
    expect(resB.body.createdFor).toBe(TENANT_B);
  });
});

// ── DB lookup scoping ──────────────────────────────────────────────────────

describe('tenant isolation — DB lookup uses supabaseUserId from Supabase response', () => {
  it('prisma.user.findUnique is called with the supabaseUserId from Supabase', async () => {
    const prisma = buildMultiTenantPrisma();
    const app = buildTenantScopedApp(prisma);
    await request(app).get('/data').set('Authorization', 'Bearer token-a');
    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { supabaseUserId: 'sub-a' } }),
    );
  });

  it('the tenantId returned comes from the DB record, not anything in the token', async () => {
    // token-a always resolves to TENANT_A via the DB — the token itself carries no tenant claim.
    const prisma = buildMultiTenantPrisma();
    const app = buildTenantScopedApp(prisma);
    const res = await request(app).get('/data').set('Authorization', 'Bearer token-a');
    expect(res.status).toBe(200);
    expect(res.body.tenantId).toBe(TENANT_A);   // from DB
    expect(res.body.tenantId).not.toBe(TENANT_B);
  });
});
