import express from 'express';
import { createSupabaseAdminClient, createSupabaseAnonClient } from '../lib/supabase.js';
import { prisma as defaultPrisma } from '../models/prisma.js';

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
  router.post('/signup', async (req, res, next) => {
    const { email, password, tenantId, role = 'SECRETARY', firstName, lastName } = req.body;

    if (!email || !password || !tenantId || !firstName || !lastName) {
      return res.status(400).json({
        error: 'bad_request',
        message: 'email, password, tenantId, firstName, and lastName are required',
      });
    }

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
  router.post('/login', async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'bad_request',
        message: 'email and password are required',
      });
    }

    const anonClient = anonClientFactory();
    const { data, error } = await anonClient.auth.signInWithPassword({ email, password });

    if (error) {
      // Supabase returns 400 for invalid credentials
      if (error.status === 400 || error.message?.toLowerCase().includes('invalid')) {
        return res.status(401).json({ error: 'unauthorized', message: 'Invalid email or password' });
      }
      return next(error);
    }

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

  // ── POST /auth/refresh ───────────────────────────────────────────────────────
  router.post('/refresh', async (req, res, next) => {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({
        error: 'bad_request',
        message: 'refresh_token is required',
      });
    }

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
