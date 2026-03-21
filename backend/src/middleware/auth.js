import { getSupabaseAdmin } from '../lib/supabase.js';
import { prisma as defaultPrisma } from '../models/prisma.js';

/**
 * Factory for requireAuth middleware.
 * Verifies the Bearer token via Supabase admin getUser() — no local JWT secret needed.
 * Supabase validates the signature and expiry; we then load tenant/role context from Prisma.
 */
export function createRequireAuth({ prismaClient = defaultPrisma, supabaseAdmin } = {}) {
  return async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'unauthorized', message: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.slice(7);
    const admin = supabaseAdmin ?? getSupabaseAdmin();

    // Verify token with Supabase — handles signature, expiry, and revocation
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: 'unauthorized', message: 'Invalid or expired token' });
    }

    const supabaseUserId = data.user.id;

    let user;
    try {
      user = await prismaClient.user.findUnique({
        where: { supabaseUserId },
        select: { id: true, tenantId: true, role: true, isActive: true },
      });
    } catch (err) {
      return next(err);
    }

    if (!user || !user.isActive) {
      return res.status(403).json({ error: 'forbidden', message: 'User not found or inactive' });
    }

    req.tenantId = user.tenantId;
    req.user = user;
    next();
  };
}

/** Ready-to-use auth middleware using the default Prisma client. */
export const requireAuth = createRequireAuth();

/**
 * Role-guard middleware factory. Must be placed after requireAuth.
 * @param {...string} roles - Allowed roles (e.g. 'ORG_ADMIN', 'DOCTOR')
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'unauthorized', message: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'forbidden', message: 'Insufficient permissions' });
    }
    next();
  };
}
