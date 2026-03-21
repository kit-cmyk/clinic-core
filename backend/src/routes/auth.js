import express from 'express';
import { z } from 'zod';
import { createSupabaseAdminClient, createSupabaseAnonClient } from '../lib/supabase.js';
import { prisma as defaultPrisma } from '../models/prisma.js';
import { authLimiter, superAdminAuthLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { writeAuditLog } from '../lib/auditLog.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  tenantId: z.string().uuid(),
  role: z.enum(['SUPER_ADMIN', 'ORG_ADMIN', 'DOCTOR', 'NURSE', 'SECRETARY']).optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

const registerOrgSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  clinicName: z.string().min(1),
  clinicAddress: z.string().optional(),
});

const refreshSchema = z.object({
  refresh_token: z.string().min(1),
});

/**
 * Factory for the auth router.
 * Injectable Supabase client factories and Prisma client allow full unit
 * testing without real network calls (same pattern as middleware/auth.js).
 *
 * @param {object} deps
 * @param {Function} deps.adminClientFactory - Returns a Supabase admin client
 * @param {Function} deps.anonClientFactory  - Returns a Supabase anon client
 * @param {object}   deps.prismaClient       - Prisma client instance
 */
export function createAuthRouter({
  adminClientFactory = createSupabaseAdminClient,
  anonClientFactory = createSupabaseAnonClient,
  prismaClient = defaultPrisma,
} = {}) {
  const router = express.Router();

  // ── POST /auth/signup ────────────────────────────────────────────────────────
  // Creates a Supabase user (email auto-confirmed — staff-only flow),
  // inserts a User row in Prisma, then signs in to return JWT tokens.
  router.post('/signup', authLimiter, validate(signupSchema), async (req, res, next) => {
    const { email, password, tenantId, role = 'SECRETARY', firstName, lastName } = req.body;

    const adminClient = adminClientFactory();
    const anonClient = anonClientFactory();

    // 1. Create the Supabase auth user
    const { data: authData, error: signUpError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // staff are invited, no email verification step needed
    });

    if (signUpError) {
      if (
        signUpError.message?.toLowerCase().includes('already been registered') ||
        signUpError.status === 422
      ) {
        return res.status(409).json({ error: 'conflict', message: 'Email already in use' });
      }
      return next(signUpError);
    }

    // 2. Insert User row in Prisma linked to the Supabase UID
    try {
      await prismaClient.user.create({
        data: {
          supabaseUserId: authData.user.id,
          email,
          tenantId,
          role,
          firstName,
          lastName,
          isActive: true,
        },
      });
    } catch (err) {
      // Rollback: remove the orphaned Supabase user so the email stays available
      await adminClient.auth.admin.deleteUser(authData.user.id).catch(() => {});
      return next(err);
    }

    // 3. Sign in immediately to obtain JWT tokens for the new user
    const { data: session, error: signInError } = await anonClient.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) return next(signInError);

    return res.status(201).json({
      access_token: session.session.access_token,
      refresh_token: session.session.refresh_token,
      user: { id: authData.user.id, email },
    });
  });

  // ── POST /auth/login ─────────────────────────────────────────────────────────
  router.post('/login', authLimiter, validate(loginSchema), async (req, res, next) => {
    const { email, password } = req.body;

    const anonClient = anonClientFactory();
    const { data, error } = await anonClient.auth.signInWithPassword({ email, password });

    if (error) {
      if (error.status === 400 || error.message?.toLowerCase().includes('invalid')) {
        writeAuditLog({ action: 'auth.login_failed', metadata: { email }, ip: req.ip });
        return res.status(401).json({ error: 'unauthorized', message: 'Invalid email or password' });
      }
      return next(error);
    }

    writeAuditLog({ action: 'auth.login', actorId: data.user.id, ip: req.ip, metadata: { email } });
    return res.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: { id: data.user.id, email: data.user.email },
    });
  });

  // ── POST /auth/super-admin/login ─────────────────────────────────────────────
  // Like /auth/login but verifies the user has SUPER_ADMIN role before returning
  // tokens — non-super-admins get a 403 and their session is immediately revoked.
  router.post('/super-admin/login', superAdminAuthLimiter, validate(loginSchema), async (req, res, next) => {
    const { email, password } = req.body;

    const anonClient = anonClientFactory();
    const { data, error } = await anonClient.auth.signInWithPassword({ email, password });

    if (error) {
      if (error.status === 400 || error.message?.toLowerCase().includes('invalid')) {
        return res.status(401).json({ error: 'unauthorized', message: 'Invalid email or password' });
      }
      return next(error);
    }

    // Verify SUPER_ADMIN role before granting access
    let dbUser;
    try {
      dbUser = await prismaClient.user.findUnique({
        where: { supabaseUserId: data.user.id },
        select: { role: true, isActive: true },
      });
    } catch (err) {
      return next(err);
    }

    if (!dbUser || dbUser.role !== 'SUPER_ADMIN' || !dbUser.isActive) {
      const adminClient = adminClientFactory();
      await adminClient.auth.admin.signOut(data.session.access_token).catch(() => {});
      writeAuditLog({ action: 'auth.super_admin_login_denied', metadata: { email }, ip: req.ip });
      return res.status(403).json({
        error: 'forbidden',
        message: 'Access denied. This login is for platform administrators only.',
      });
    }

    writeAuditLog({ action: 'auth.super_admin_login', actorId: data.user.id, actorRole: 'SUPER_ADMIN', ip: req.ip });
    return res.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: { id: data.user.id, email: data.user.email },
    });
  });

  // ── POST /auth/logout ────────────────────────────────────────────────────────
  // Requires Bearer token. Calls Supabase admin signOut to revoke the JWT
  // globally — invalidates all sessions, not just the current one.
  router.post('/logout', async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Missing or invalid Authorization header',
      });
    }

    const jwt = authHeader.slice(7);
    const adminClient = adminClientFactory();
    const { error } = await adminClient.auth.admin.signOut(jwt);

    if (error) return next(error);

    return res.status(204).send();
  });

  // ── POST /auth/register-org ──────────────────────────────────────────────────
  // Creates a new organization account: Supabase user + Tenant + Organization +
  // ORG_ADMIN User row in one transaction. Returns JWT tokens on success.
  router.post('/register-org', authLimiter, validate(registerOrgSchema), async (req, res, next) => {
    const { email, password, firstName, lastName, clinicName, clinicAddress } = req.body;

    const adminClient = adminClientFactory();
    const anonClient = anonClientFactory();

    // 1. Create Supabase auth user (email auto-confirmed for org sign-up)
    const { data: authData, error: signUpError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (signUpError) {
      if (
        signUpError.message?.toLowerCase().includes('already been registered') ||
        signUpError.status === 422
      ) {
        return res.status(409).json({ error: 'conflict', message: 'Email already in use' });
      }
      return next(signUpError);
    }

    // 2. Create Tenant + Organization + ORG_ADMIN User in a single transaction
    try {
      const slug =
        clinicName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') +
        '-' +
        Date.now();

      await prismaClient.$transaction(async (tx) => {
        const tenant = await tx.tenant.create({
          data: { name: clinicName, slug },
        });

        await tx.organization.create({
          data: {
            tenantId: tenant.id,
            name: clinicName,
            address: clinicAddress ?? null,
          },
        });

        await tx.user.create({
          data: {
            supabaseUserId: authData.user.id,
            email,
            tenantId: tenant.id,
            role: 'ORG_ADMIN',
            firstName,
            lastName,
            isActive: true,
          },
        });
      });
    } catch (err) {
      // Rollback: remove orphaned Supabase user so the email stays available
      await adminClient.auth.admin.deleteUser(authData.user.id).catch(() => {});
      return next(err);
    }

    // 3. Sign in to return JWT tokens for the newly created account
    const { data: session, error: signInError } = await anonClient.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) return next(signInError);

    return res.status(201).json({
      access_token: session.session.access_token,
      refresh_token: session.session.refresh_token,
      user: { id: authData.user.id, email },
    });
  });

  // ── POST /auth/refresh ───────────────────────────────────────────────────────
  router.post('/refresh', authLimiter, validate(refreshSchema), async (req, res, next) => {
    const { refresh_token } = req.body;

    const anonClient = anonClientFactory();
    const { data, error } = await anonClient.auth.refreshSession({ refresh_token });

    if (error) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Invalid or expired refresh token',
      });
    }

    return res.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
  });

  return router;
}

export default createAuthRouter();
