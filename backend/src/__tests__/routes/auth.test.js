import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { createAuthRouter } from '../../routes/auth.js';

// ── Mock builder helpers ──────────────────────────────────────────────────────

function buildAdminClient({
  createUserResult = { data: { user: { id: 'supabase-uid-1' } }, error: null },
  deleteUserResult = { error: null },
  signOutResult = { error: null },
} = {}) {
  return {
    auth: {
      admin: {
        createUser: jest.fn().mockResolvedValue(createUserResult),
        deleteUser: jest.fn().mockResolvedValue(deleteUserResult),
        signOut: jest.fn().mockResolvedValue(signOutResult),
      },
    },
  };
}

function buildAnonClient({
  signInResult = {
    data: {
      session: { access_token: 'access-tok', refresh_token: 'refresh-tok' },
      user: { id: 'supabase-uid-1', email: 'doc@clinic.com' },
    },
    error: null,
  },
  refreshResult = {
    data: { session: { access_token: 'new-access', refresh_token: 'new-refresh' } },
    error: null,
  },
} = {}) {
  return {
    auth: {
      signInWithPassword: jest.fn().mockResolvedValue(signInResult),
      refreshSession: jest.fn().mockResolvedValue(refreshResult),
    },
  };
}

function buildPrisma({ createResult = { id: 'user-uuid-1' } } = {}) {
  return {
    user: {
      create: jest.fn().mockResolvedValue(createResult),
    },
  };
}

function buildApp({ adminClient, anonClient, prismaClient } = {}) {
  const app = express();
  app.use(express.json());

  const router = createAuthRouter({
    adminClientFactory: () => adminClient ?? buildAdminClient(),
    anonClientFactory: () => anonClient ?? buildAnonClient(),
    prismaClient: prismaClient ?? buildPrisma(),
  });

  app.use('/auth', router);

  // Minimal error handler so 500s are testable
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    res.status(err.status || 500).json({ error: 'internal_error', message: err.message });
  });

  return app;
}

const VALID_SIGNUP = {
  email: 'doc@clinic.com',
  password: 'SecurePass123!',
  tenantId: 'tenant-uuid-1',
  role: 'DOCTOR',
  firstName: 'Jane',
  lastName: 'Smith',
};

// ── POST /auth/signup ─────────────────────────────────────────────────────────

describe('POST /auth/signup', () => {
  it('returns 201 with tokens on success', async () => {
    const res = await request(buildApp()).post('/auth/signup').send(VALID_SIGNUP);
    expect(res.status).toBe(201);
    expect(res.body.access_token).toBe('access-tok');
    expect(res.body.refresh_token).toBe('refresh-tok');
    expect(res.body.user.email).toBe('doc@clinic.com');
  });

  it('returns 400 when email is missing', async () => {
    const { email: _e, ...body } = VALID_SIGNUP;
    const res = await request(buildApp()).post('/auth/signup').send(body);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('bad_request');
  });

  it('returns 400 when tenantId is missing', async () => {
    const { tenantId: _t, ...body } = VALID_SIGNUP;
    const res = await request(buildApp()).post('/auth/signup').send(body);
    expect(res.status).toBe(400);
  });

  it('returns 400 when firstName is missing', async () => {
    const { firstName: _f, ...body } = VALID_SIGNUP;
    const res = await request(buildApp()).post('/auth/signup').send(body);
    expect(res.status).toBe(400);
  });

  it('returns 409 when email is already registered', async () => {
    const adminClient = buildAdminClient({
      createUserResult: {
        data: null,
        error: { message: 'User already been registered', status: 422 },
      },
    });
    const res = await request(buildApp({ adminClient })).post('/auth/signup').send(VALID_SIGNUP);
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('conflict');
  });

  it('calls prisma.user.create with correct fields', async () => {
    const prismaClient = buildPrisma();
    await request(buildApp({ prismaClient })).post('/auth/signup').send(VALID_SIGNUP);
    expect(prismaClient.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        supabaseUserId: 'supabase-uid-1',
        tenantId: 'tenant-uuid-1',
        role: 'DOCTOR',
        firstName: 'Jane',
        lastName: 'Smith',
      }),
    });
  });

  it('rolls back Supabase user and returns 500 when Prisma create fails', async () => {
    const adminClient = buildAdminClient();
    const prismaClient = { user: { create: jest.fn().mockRejectedValue(new Error('DB error')) } };
    const res = await request(buildApp({ adminClient, prismaClient }))
      .post('/auth/signup')
      .send(VALID_SIGNUP);
    expect(res.status).toBe(500);
    expect(adminClient.auth.admin.deleteUser).toHaveBeenCalledWith('supabase-uid-1');
  });
});

// ── POST /auth/login ──────────────────────────────────────────────────────────

describe('POST /auth/login', () => {
  it('returns 200 with tokens on valid credentials', async () => {
    const res = await request(buildApp())
      .post('/auth/login')
      .send({ email: 'doc@clinic.com', password: 'pass' });
    expect(res.status).toBe(200);
    expect(res.body.access_token).toBe('access-tok');
    expect(res.body.refresh_token).toBe('refresh-tok');
    expect(res.body.user.id).toBe('supabase-uid-1');
  });

  it('returns 400 when email is missing', async () => {
    const res = await request(buildApp()).post('/auth/login').send({ password: 'pass' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('bad_request');
  });

  it('returns 400 when password is missing', async () => {
    const res = await request(buildApp()).post('/auth/login').send({ email: 'doc@clinic.com' });
    expect(res.status).toBe(400);
  });

  it('returns 401 on invalid credentials', async () => {
    const anonClient = buildAnonClient({
      signInResult: { data: null, error: { status: 400, message: 'Invalid login credentials' } },
    });
    const res = await request(buildApp({ anonClient }))
      .post('/auth/login')
      .send({ email: 'doc@clinic.com', password: 'wrong' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('unauthorized');
  });
});

// ── POST /auth/logout ─────────────────────────────────────────────────────────

describe('POST /auth/logout', () => {
  it('returns 204 on valid Bearer token', async () => {
    const res = await request(buildApp())
      .post('/auth/logout')
      .set('Authorization', 'Bearer valid-jwt-token');
    expect(res.status).toBe(204);
  });

  it('returns 401 when Authorization header is absent', async () => {
    const res = await request(buildApp()).post('/auth/logout');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('unauthorized');
  });

  it('returns 401 when scheme is not Bearer', async () => {
    const res = await request(buildApp())
      .post('/auth/logout')
      .set('Authorization', 'Basic abc123');
    expect(res.status).toBe(401);
  });

  it('passes the raw JWT to adminClient.auth.admin.signOut', async () => {
    const adminClient = buildAdminClient();
    await request(buildApp({ adminClient }))
      .post('/auth/logout')
      .set('Authorization', 'Bearer my-raw-jwt');
    expect(adminClient.auth.admin.signOut).toHaveBeenCalledWith('my-raw-jwt');
  });
});

// ── POST /auth/refresh ────────────────────────────────────────────────────────

describe('POST /auth/refresh', () => {
  it('returns 200 with new tokens on valid refresh_token', async () => {
    const res = await request(buildApp())
      .post('/auth/refresh')
      .send({ refresh_token: 'valid-refresh' });
    expect(res.status).toBe(200);
    expect(res.body.access_token).toBe('new-access');
    expect(res.body.refresh_token).toBe('new-refresh');
  });

  it('returns 400 when refresh_token is missing', async () => {
    const res = await request(buildApp()).post('/auth/refresh').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('bad_request');
  });

  it('returns 401 on expired or invalid refresh token', async () => {
    const anonClient = buildAnonClient({
      refreshResult: { data: null, error: { message: 'Invalid Refresh Token' } },
    });
    const res = await request(buildApp({ anonClient }))
      .post('/auth/refresh')
      .send({ refresh_token: 'expired-token' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('unauthorized');
  });
});
