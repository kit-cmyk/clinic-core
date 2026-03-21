import express from 'express';
import { z } from 'zod';
import { createRequireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { prisma as defaultPrisma } from '../models/prisma.js';
import { createSmsService } from '../lib/sms.js';
import { createSupabaseAdminClient } from '../lib/supabase.js';
import { env } from '../config/env.js';
import { inviteLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { writeAuditLog } from '../lib/auditLog.js';

const inviteSchema = z.object({
  phone: z.string().regex(/^\+[1-9]\d{6,14}$/, 'phone must be a valid E.164 number (e.g. +14155550123)'),
});

const registerPatientSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

/** Token validity in hours. */
const TOKEN_EXPIRY_HOURS = 48;

/**
 * Patient registration router (CC-24).
 *
 * POST /patients/invite          — send SMS invite to phone number (secretary / org_admin / SUPER_ADMIN)
 * POST /patients/register/:token — patient redeems token, sets name+password, creates account
 *
 * Injectable dependencies for full unit testability.
 */
export function createPatientsRouter({
  prismaClient = defaultPrisma,
  authMiddlewareFactory,
  smsServiceFactory = createSmsService,
  adminClientFactory = createSupabaseAdminClient,
} = {}) {
  const router = express.Router();
  const requireAuth = authMiddlewareFactory
    ? authMiddlewareFactory({ prismaClient })
    : createRequireAuth({ prismaClient });

  // ── POST /patients/invite ─────────────────────────────────────────────────
  // Sends an SMS registration link to the given phone number.
  // Auth: staff who can manage patients (secretary, nurse, doctor, org_admin, super_admin).
  router.post('/invite', inviteLimiter, requireAuth, requirePermission('patients:create'), validate(inviteSchema), async (req, res, next) => {
    const { phone } = req.body;
    const tenantId = req.tenantId;
    const invitedById = req.user.id;

    if (!phone) {
      return res.status(400).json({ error: 'bad_request', message: 'phone is required' });
    }

    // E.164 validation (basic — must start with +)
    if (!/^\+\d{7,15}$/.test(phone)) {
      return res.status(400).json({ error: 'bad_request', message: 'phone must be in E.164 format (e.g. +14155550123)' });
    }

    try {
      const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

      const invite = await prismaClient.patientInvite.create({
        data: { tenantId, phone, invitedById, expiresAt },
      });

      const registrationUrl = `${env.FRONTEND_URL}/patient-register/${invite.token}`;
      const sms = smsServiceFactory();
      await sms.send(phone, `You've been invited to register at ClinicAlly. Complete your registration here (expires in 48h): ${registrationUrl}`);

      req.audit({ action: 'patient.invite_sent', resourceType: 'PatientInvite', resourceId: invite.id, metadata: { phone } });
      return res.status(201).json({ message: 'Invitation sent', token: invite.token, expiresAt });
    } catch (err) {
      return next(err);
    }
  });

  // ── POST /patients/register/:token ────────────────────────────────────────
  // Public endpoint. Patient redeems the SMS token and creates their account.
  router.post('/register/:token', validate(registerPatientSchema), async (req, res, next) => {
    const { token } = req.params;
    const { firstName, lastName, password } = req.body;

    try {
      const invite = await prismaClient.patientInvite.findUnique({
        where: { token },
        include: { tenant: { select: { id: true } } },
      });

      if (!invite) {
        return res.status(404).json({ error: 'not_found', message: 'Invitation not found' });
      }
      if (invite.usedAt) {
        return res.status(410).json({ error: 'gone', message: 'This invitation has already been used' });
      }
      if (new Date() > invite.expiresAt) {
        return res.status(410).json({ error: 'gone', message: 'This invitation has expired' });
      }

      const tenantId = invite.tenant.id;
      const supabaseAdmin = adminClientFactory();

      // Create Supabase auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        phone: invite.phone,
        password,
        phone_confirm: true,
        user_metadata: { role: 'PATIENT', tenantId },
      });

      if (authError) {
        return next(Object.assign(new Error(authError.message), { status: 422 }));
      }

      const supabaseUserId = authData.user.id;

      // Create Prisma User + Patient records
      const user = await prismaClient.user.create({
        data: {
          tenantId,
          supabaseUserId,
          phone: invite.phone,
          firstName,
          lastName,
          role: 'PATIENT',
          patient: {
            create: {
              tenantId,
              firstName,
              lastName,
              phone: invite.phone,
            },
          },
        },
        select: { id: true, role: true, tenantId: true },
      });

      // Mark invite as used
      await prismaClient.patientInvite.update({
        where: { token },
        data: { usedAt: new Date() },
      });

      writeAuditLog({ action: 'patient.registered', tenantId, actorId: user.id, actorRole: 'PATIENT', resourceType: 'Patient', ip: req.ip });
      return res.status(201).json({
        message: 'Registration successful',
        userId: user.id,
        role: user.role,
        tenantId: user.tenantId,
      });
    } catch (err) {
      return next(err);
    }
  });

  return router;
}

export default createPatientsRouter();
