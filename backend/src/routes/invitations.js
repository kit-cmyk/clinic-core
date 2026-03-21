import express from 'express';
import { createSupabaseAdminClient } from '../lib/supabase.js';
import { prisma as defaultPrisma } from '../models/prisma.js';
import { createRequireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { env } from '../config/env.js';

/** Staff roles that can be invited by an org admin. */
const INVITABLE_ROLES = ['DOCTOR', 'NURSE', 'SECRETARY'];

/** Invitation validity window in hours. */
const EXPIRY_HOURS = 24;

/**
 * Factory for the /invitations router.
 * Injectable dependencies for testability (same pattern as auth.js).
 */
export function createInvitationsRouter({
  adminClientFactory = createSupabaseAdminClient,
  prismaClient = defaultPrisma,
  authMiddlewareFactory,
} = {}) {
  const router = express.Router();
  const requireAuth = authMiddlewareFactory
    ? authMiddlewareFactory({ prismaClient })
    : createRequireAuth({ prismaClient });

  // ── POST /invitations ─────────────────────────────────────────────────────
  // Send a staff invitation email via Supabase. Creates a Prisma User row
  // (inactive until first login) and a DB Invitation record for tracking.
  //
  // Auth: org_admin or super_admin (invitations:create permission).
  router.post('/', requireAuth, requirePermission('invitations:create'), async (req, res, next) => {
    const { email, role, branchId } = req.body;
    const tenantId = req.tenantId;

    if (!email || !role) {
      return res.status(400).json({
        error: 'bad_request',
        message: 'email and role are required',
      });
    }

    const normalizedRole = role.toUpperCase();
    if (!INVITABLE_ROLES.includes(normalizedRole)) {
      return res.status(400).json({
        error: 'bad_request',
        message: `role must be one of: ${INVITABLE_ROLES.join(', ')}`,
      });
    }

    const lowerEmail = email.toLowerCase();

    // Reject if a non-expired, unaccepted invitation already exists
    const existingInvite = await prismaClient.invitation.findFirst({
      where: {
        tenantId,
        email: lowerEmail,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    if (existingInvite) {
      return res.status(409).json({
        error: 'conflict',
        message: 'A pending invitation already exists for this email',
      });
    }

    // Reject if a user with this email already belongs to this tenant
    const existingUser = await prismaClient.user.findFirst({
      where: { tenantId, email: lowerEmail },
    });
    if (existingUser) {
      return res.status(409).json({
        error: 'conflict',
        message: 'A user with this email already exists in this organization',
      });
    }

    // Validate branchId belongs to this tenant (if provided)
    if (branchId) {
      const branch = await prismaClient.branch.findFirst({
        where: { id: branchId, tenantId },
      });
      if (!branch) {
        return res.status(400).json({
          error: 'bad_request',
          message: 'branchId does not belong to this organization',
        });
      }
    }

    const adminClient = adminClientFactory();
    const redirectTo = `${env.FRONTEND_URL}/invite/accept`;
    const expiresAt = new Date(Date.now() + EXPIRY_HOURS * 60 * 60 * 1000);

    // Trigger Supabase invite email — creates the Supabase auth user in
    // "invited" state, sends the setup-password link.
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin
      .inviteUserByEmail(lowerEmail, {
        redirectTo,
        data: { tenantId, role: normalizedRole },
      });

    if (inviteError) return next(inviteError);

    const supabaseUserId = inviteData.user.id;

    let invitation;
    try {
      invitation = await prismaClient.$transaction(async (tx) => {
        // Create Prisma User row (isActive: true so /me works immediately after
        // the user sets their password and fetchProfile is called).
        await tx.user.upsert({
          where: { supabaseUserId },
          create: {
            supabaseUserId,
            email: lowerEmail,
            tenantId,
            role: normalizedRole,
            firstName: '',
            lastName: '',
            isActive: true,
          },
          update: {
            // Re-invitation: refresh role/tenant if changed
            tenantId,
            role: normalizedRole,
            isActive: true,
          },
        });

        return tx.invitation.create({
          data: {
            tenantId,
            email: lowerEmail,
            role: normalizedRole,
            branchId: branchId ?? null,
            invitedById: req.user.id,
            expiresAt,
          },
        });
      });
    } catch (err) {
      return next(err);
    }

    return res.status(201).json({
      id:        invitation.id,
      email:     invitation.email,
      role:      invitation.role,
      branchId:  invitation.branchId,
      expiresAt: invitation.expiresAt,
      token:     invitation.token,
    });
  });

  // ── GET /invitations/:token ───────────────────────────────────────────────
  // Public endpoint — validates a DB invitation token and returns the invite
  // details so the frontend accept page can display org/role context.
  router.get('/:token', async (req, res, next) => {
    const { token } = req.params;

    let invitation;
    try {
      invitation = await prismaClient.invitation.findUnique({
        where: { token },
        include: {
          tenant: { select: { name: true } },
          branch: { select: { name: true } },
        },
      });
    } catch (err) {
      return next(err);
    }

    if (!invitation) {
      return res.status(404).json({ error: 'not_found', message: 'Invitation not found' });
    }

    if (invitation.acceptedAt) {
      return res.status(410).json({ error: 'gone', message: 'Invitation has already been accepted' });
    }

    if (invitation.expiresAt < new Date()) {
      return res.status(410).json({ error: 'gone', message: 'Invitation has expired' });
    }

    return res.json({
      email:      invitation.email,
      role:       invitation.role,
      tenantId:   invitation.tenantId,
      orgName:    invitation.tenant.name,
      branchId:   invitation.branchId,
      branchName: invitation.branch?.name ?? null,
      expiresAt:  invitation.expiresAt,
    });
  });

  return router;
}

export default createInvitationsRouter();
