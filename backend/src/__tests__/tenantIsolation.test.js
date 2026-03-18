/**
 * CC-17 — Tenant Isolation Integration Tests
 *
 * Verifies that the auth middleware correctly binds each request to a single
 * tenant and that route handlers scoped by req.tenantId cannot be tricked into
 * returning or mutating another tenant's data.
 */
import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { createRequireAuth } from '../middleware/auth.js';

const TEST_SECRET = 'test-tenant-isolation-secret';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const TENANT_A = 'tenant-uuid-aaaa';
const TENANT_B = 'tenant-uuid-bbbb';

const userA = { id: 'user-a', tenantId: TENANT_A, role: 'ORG_ADMIN', isActive: true };
const userB = { id: 'user-b', tenantId: TENANT_B, role: 'ORG_ADMIN', isActive: true };

function makeToken(sub, secret = TEST_SECRET) {
  return jwt.sign({ sub }, secret, { expiresIn: '1h' });
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

/** A sample route that responds with req.tenantId — simulates any tenant-scoped handler. */
function buildTenantScopedApp(prisma = buildMultiTenantPrisma()) {
  const requireAuth = createRequireAuth({ prismaClient: prisma, jwtSecret: TEST_SECRET });
  const app = express();
  app.use(express.json());

  // Simulates a data endpoint that scopes its query by tenantId
  app.get('/data', requireAuth, (req, res) => {
    res.json({ tenantId: req.tenantId, userId: req.user.id });
  });

  // Simulates a write endpoint — returns what tenant would be written for
  app.post('/data', requireAuth, (req, res) => {
    res.status(201).json({ createdFor: req.tenantId, body: req.body });
  });

  return app;
}

// ── Tenant binding ─────────────────────────────────────────────────────────

describe('tenant isolation — req.tenantId binding', () => {
  it('binds req.tenantId to tenant A when authenticated as tenant A user', async () => {
    const app = buildTenantScopedApp();
    const token = makeToken('sub-a');
    const res = await request(app).get('/data').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.tenantId).toBe(TENANT_A);
  });

  it('binds req.tenantId to tenant B when authenticated as tenant B user', async () => {
    const app = buildTenantScopedApp();
    const token = makeToken('sub-b');
    const res = await request(app).get('/data').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.tenantId).toBe(TENANT_B);
  });

  it('tenant A and tenant B get different tenantIds from the same endpoint', async () => {
    const app = buildTenantScopedApp();
    const [resA, resB] = await Promise.all([
      request(app).get('/data').set('Authorization', `Bearer ${makeToken('sub-a')}`),
      request(app).get('/data').set('Authorization', `Bearer ${makeToken('sub-b')}`),
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
    const tokenA = makeToken('sub-a');
    const res = await request(app).get('/data').set('Authorization', `Bearer ${tokenA}`);
    expect(res.body.tenantId).not.toBe(TENANT_B);
  });

  it('unauthenticated requests cannot reach tenant-scoped routes', async () => {
    const app = buildTenantScopedApp();
    const res = await request(app).get('/data');
    expect(res.status).toBe(401);
    expect(res.body.tenantId).toBeUndefined();
  });

  it('a token signed with the wrong secret cannot spoof a tenant', async () => {
    const app = buildTenantScopedApp();
    const forgeryToken = makeToken('sub-a', 'wrong-secret');
    const res = await request(app).get('/data').set('Authorization', `Bearer ${forgeryToken}`);
    expect(res.status).toBe(401);
    expect(res.body.tenantId).toBeUndefined();
  });

  it('a token for an unknown user (not in DB) is rejected — no tenantId leakage', async () => {
    const app = buildTenantScopedApp();
    const token = makeToken('sub-unknown');
    const res = await request(app).get('/data').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.tenantId).toBeUndefined();
  });
});

// ── Write isolation ────────────────────────────────────────────────────────

describe('tenant isolation — writes are scoped to the authenticated tenant', () => {
  it('POST request carries tenant A tenantId — never tenant B', async () => {
    const app = buildTenantScopedApp();
    const token = makeToken('sub-a');
    const res = await request(app)
      .post('/data')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Resource' });
    expect(res.status).toBe(201);
    expect(res.body.createdFor).toBe(TENANT_A);
    expect(res.body.createdFor).not.toBe(TENANT_B);
  });

  it('two concurrent writes for different tenants carry their own tenantIds', async () => {
    const app = buildTenantScopedApp();
    const [resA, resB] = await Promise.all([
      request(app).post('/data').set('Authorization', `Bearer ${makeToken('sub-a')}`).send({ x: 1 }),
      request(app).post('/data').set('Authorization', `Bearer ${makeToken('sub-b')}`).send({ x: 2 }),
    ]);
    expect(resA.body.createdFor).toBe(TENANT_A);
    expect(resB.body.createdFor).toBe(TENANT_B);
  });
});

// ── DB lookup scoping ──────────────────────────────────────────────────────

describe('tenant isolation — DB lookup uses supabaseUserId from token', () => {
  it('prisma.user.findUnique is called with the sub claim from the JWT', async () => {
    const prisma = buildMultiTenantPrisma();
    const app = buildTenantScopedApp(prisma);
    const token = makeToken('sub-a');
    await request(app).get('/data').set('Authorization', `Bearer ${token}`);
    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { supabaseUserId: 'sub-a' } }),
    );
  });

  it('the tenantId returned comes from the DB record, not the JWT payload', async () => {
    // Forge a JWT that has sub=sub-a but try to claim tenant B — the tenantId must
    // come from the DB row, not anything in the token itself.
    const prisma = buildMultiTenantPrisma();
    const app = buildTenantScopedApp(prisma);
    // sub-a always resolves to TENANT_A in our mock DB, regardless of what
    // an attacker might embed in the token claims.
    const token = jwt.sign({ sub: 'sub-a', tenantId: TENANT_B }, TEST_SECRET, { expiresIn: '1h' });
    const res = await request(app).get('/data').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.tenantId).toBe(TENANT_A);  // from DB, not from token
    expect(res.body.tenantId).not.toBe(TENANT_B);
  });
});
