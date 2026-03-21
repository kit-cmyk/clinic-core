/**
 * CC-22 — Staff Invitation Flow Tests
 *
 * Tests the POST /invitations and GET /invitations/:token endpoints
 * using injectable mocks — no real Supabase or DB calls.
 */
import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { createInvitationsRouter } from '../routes/invitations.js';
import { createRequireAuth } from '../middleware/auth.js';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const TENANT_ID  = 'tenant-uuid-1111';
const INVITER_ID = 'user-uuid-admin-1';
const BRANCH_ID  = 'branch-uuid-1111';

const orgAdmin = {
  id:       INVITER_ID,
  tenantId: TENANT_ID,
  role:     'ORG_ADMIN',
  isActive: true,
};

const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

/** Build a mock Supabase admin client factory. */
function buildAdminClientFactory({ inviteError = null } = {}) {
  return () => ({
    auth: {
      admin: {
        getUser: jest.fn(() =>
          Promise.resolve({ data: { user: { id: 'supa-uid-1' } }, error: null })
        ),
        inviteUserByEmail: jest.fn(() =>
          inviteError
            ? Promise.resolve({ data: null, error: inviteError })
            : Promise.resolve({ data: { user: { id: 'supa-uid-invited' } }, error: null })
        ),
      },
    },
  });
}

/** Build a mock Prisma client. */
function buildPrismaClient({
  existingInvite  = null,
  existingUser    = null,
  branchExists    = true,
  createdInvitation = null,
} = {}) {
  const defaultInvitation = {
    id:        'invite-uuid-1',
    email:     'newstaff@clinic.com',
    role:      'DOCTOR',
    branchId:  null,
    expiresAt: futureDate,
    token:     'test-token-abc',
  };

  return {
    user: {
      findUnique: jest.fn(({ where }) => {
        if (where.supabaseUserId === 'supa-uid-1') return Promise.resolve(orgAdmin);
        return Promise.resolve(null);
      }),
      findFirst: jest.fn(() => Promise.resolve(existingUser)),
      upsert:    jest.fn(() => Promise.resolve({ id: 'new-user-uuid' })),
    },
    invitation: {
      findFirst:  jest.fn(() => Promise.resolve(existingInvite)),
      findUnique: jest.fn(({ where }) => {
        if (where.token === 'test-token-abc') {
          return Promise.resolve({
            id:         'invite-uuid-1',
            email:      'newstaff@clinic.com',
            role:       'DOCTOR',
            tenantId:   TENANT_ID,
            branchId:   null,
            expiresAt:  futureDate,
            acceptedAt: null,
            tenant:     { name: 'Demo Clinic' },
            branch:     null,
          });
        }
        if (where.token === 'accepted-token') {
          return Promise.resolve({
            id: 'invite-uuid-2', email: 'x@y.com', role: 'NURSE',
            tenantId: TENANT_ID, branchId: null, expiresAt: futureDate,
            acceptedAt: new Date('2026-01-01'),
            tenant: { name: 'Demo Clinic' }, branch: null,
          });
        }
        if (where.token === 'expired-token') {
          return Promise.resolve({
            id: 'invite-uuid-3', email: 'x@y.com', role: 'NURSE',
            tenantId: TENANT_ID, branchId: null,
            expiresAt: new Date('2020-01-01'), acceptedAt: null,
            tenant: { name: 'Demo Clinic' }, branch: null,
          });
        }
        return Promise.resolve(null);
      }),
      create: jest.fn(() => Promise.resolve(createdInvitation ?? defaultInvitation)),
    },
    branch: {
      findFirst: jest.fn(() =>
        branchExists ? Promise.resolve({ id: BRANCH_ID, tenantId: TENANT_ID }) : Promise.resolve(null)
      ),
    },
    $transaction: jest.fn(async (fn) => {
      const txClient = {
        user:       { upsert: jest.fn(() => Promise.resolve({ id: 'new-user-uuid' })) },
        invitation: { create: jest.fn(() => Promise.resolve(createdInvitation ?? defaultInvitation)) },
      };
      return fn(txClient);
    }),
  };
}

/** Build a test Express app with injectable deps. */
function buildApp(prismaOverrides = {}, adminOverrides = {}) {
  const prisma = buildPrismaClient(prismaOverrides);
  const adminClientFactory = buildAdminClientFactory(adminOverrides);

  // Auth middleware that trusts the mock Prisma (no real Supabase token check)
  const authMiddlewareFactory = ({ prismaClient }) =>
    createRequireAuth({
      prismaClient,
      supabaseAdmin: {
        auth: {
          getUser: jest.fn(() =>
            Promise.resolve({ data: { user: { id: 'supa-uid-1' } }, error: null })
          ),
        },
      },
    });

  const router = createInvitationsRouter({ adminClientFactory, prismaClient: prisma, authMiddlewareFactory });

  const app = express();
  app.use(express.json());
  app.use('/api/v1/invitations', router);
  return app;
}

// ── POST /invitations ─────────────────────────────────────────────────────────

describe('POST /api/v1/invitations', () => {
  it('returns 401 with no auth token', async () => {
    const app = buildApp();
    const res = await request(app).post('/api/v1/invitations').send({ email: 'a@b.com', role: 'DOCTOR' });
    expect(res.status).toBe(401);
  });

  it('returns 400 when email is missing', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/api/v1/invitations')
      .set('Authorization', 'Bearer mock-token')
      .send({ role: 'DOCTOR' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('bad_request');
  });

  it('returns 400 when role is missing', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/api/v1/invitations')
      .set('Authorization', 'Bearer mock-token')
      .send({ email: 'staff@clinic.com' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for an invalid role', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/api/v1/invitations')
      .set('Authorization', 'Bearer mock-token')
      .send({ email: 'staff@clinic.com', role: 'SUPER_ADMIN' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('bad_request');
  });

  it('returns 409 when a pending invitation already exists', async () => {
    const app = buildApp({ existingInvite: { id: 'old-invite' } });
    const res = await request(app)
      .post('/api/v1/invitations')
      .set('Authorization', 'Bearer mock-token')
      .send({ email: 'staff@clinic.com', role: 'DOCTOR' });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('conflict');
  });

  it('returns 409 when user already exists in org', async () => {
    const app = buildApp({ existingUser: { id: 'existing-user' } });
    const res = await request(app)
      .post('/api/v1/invitations')
      .set('Authorization', 'Bearer mock-token')
      .send({ email: 'staff@clinic.com', role: 'NURSE' });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('conflict');
  });

  it('returns 201 with invitation details on success', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/api/v1/invitations')
      .set('Authorization', 'Bearer mock-token')
      .send({ email: 'newstaff@clinic.com', role: 'DOCTOR' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      email: 'newstaff@clinic.com',
      role:  'DOCTOR',
    });
    expect(res.body.token).toBeDefined();
    expect(res.body.expiresAt).toBeDefined();
  });

  it('returns 201 with a branchId when provided and branch is valid', async () => {
    const app = buildApp({ branchExists: true });
    const res = await request(app)
      .post('/api/v1/invitations')
      .set('Authorization', 'Bearer mock-token')
      .send({ email: 'newstaff@clinic.com', role: 'NURSE', branchId: BRANCH_ID });
    expect(res.status).toBe(201);
  });

  it('returns 400 when branchId does not belong to the tenant', async () => {
    const app = buildApp({ branchExists: false });
    const res = await request(app)
      .post('/api/v1/invitations')
      .set('Authorization', 'Bearer mock-token')
      .send({ email: 'newstaff@clinic.com', role: 'NURSE', branchId: 'wrong-branch' });
    expect(res.status).toBe(400);
  });
});

// ── GET /invitations/:token ───────────────────────────────────────────────────

describe('GET /api/v1/invitations/:token', () => {
  it('returns invitation details for a valid token', async () => {
    const app = buildApp();
    const res = await request(app).get('/api/v1/invitations/test-token-abc');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      email:   'newstaff@clinic.com',
      role:    'DOCTOR',
      orgName: 'Demo Clinic',
    });
    expect(res.body.expiresAt).toBeDefined();
  });

  it('returns 404 for an unknown token', async () => {
    const app = buildApp();
    const res = await request(app).get('/api/v1/invitations/no-such-token');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('not_found');
  });

  it('returns 410 for an already-accepted invitation', async () => {
    const app = buildApp();
    const res = await request(app).get('/api/v1/invitations/accepted-token');
    expect(res.status).toBe(410);
    expect(res.body.error).toBe('gone');
  });

  it('returns 410 for an expired invitation', async () => {
    const app = buildApp();
    const res = await request(app).get('/api/v1/invitations/expired-token');
    expect(res.status).toBe(410);
    expect(res.body.error).toBe('gone');
  });
});
