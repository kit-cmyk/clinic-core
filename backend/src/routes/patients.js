import express from 'express';
import multer from 'multer';
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
import { createStorageService } from '../services/storage.js';
import { createMalwareScanService } from '../services/malwareScan.js';

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

/** Allowed MIME types for patient uploads (CC-44). */
const ALLOWED_UPLOAD_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

/** Multer instance — memory storage so we can scan before writing to Supabase. */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter(_req, file, cb) {
    if (ALLOWED_UPLOAD_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(Object.assign(new Error('Unsupported file type'), { status: 415 }));
    }
  },
});

/**
 * Patient router (CC-24, CC-40, CC-42, CC-44).
 *
 * POST /patients/invite                  — send SMS invite (staff)
 * POST /patients/register/:token         — redeem token, create patient account (public)
 * GET  /patients/me/appointments         — patient's own appointments (PATIENT role)
 * GET  /patients/me/prescriptions        — patient's own prescriptions (PATIENT role)
 * GET  /patients/me/results              — patient's own published lab results (PATIENT role)
 * POST /patients/me/uploads              — patient uploads external file (PATIENT role)
 *
 * Injectable dependencies for full unit testability.
 */
export function createPatientsRouter({
  prismaClient = defaultPrisma,
  authMiddlewareFactory,
  smsServiceFactory = createSmsService,
  adminClientFactory = createSupabaseAdminClient,
  storageServiceFactory = createStorageService,
  malwareScanServiceFactory = createMalwareScanService,
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

  // ── GET /patients/me/appointments ─────────────────────────────────────────
  // Patient views their own appointments. Paginated, sorted by scheduledAt desc.
  router.get('/me/appointments', requireAuth, requirePermission('appointments:read'), async (req, res, next) => {
    try {
      // Resolve patient record from the authenticated user
      const patient = await prismaClient.patient.findFirst({
        where: { userId: req.user.id, tenantId: req.tenantId },
        select: { id: true },
      });

      if (!patient) {
        return res.status(404).json({ error: 'not_found', message: 'Patient profile not found' });
      }

      const page  = Math.max(1, parseInt(req.query.page)  || 1);
      const limit = Math.min(100, parseInt(req.query.limit) || 20);
      const skip  = (page - 1) * limit;

      const [appointments, total] = await Promise.all([
        prismaClient.appointment.findMany({
          where: { patientId: patient.id, tenantId: req.tenantId },
          skip,
          take: limit,
          orderBy: { scheduledAt: 'desc' },
          select: {
            id:           true,
            scheduledAt:  true,
            durationMins: true,
            type:         true,
            status:       true,
            notes:        true,
            createdAt:    true,
            professional: {
              select: { firstName: true, lastName: true },
            },
            branch: {
              select: { name: true, address: true },
            },
          },
        }),
        prismaClient.appointment.count({
          where: { patientId: patient.id, tenantId: req.tenantId },
        }),
      ]);

      return res.json({
        data: appointments,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    } catch (err) {
      return next(err);
    }
  });

  // ── GET /patients/me/prescriptions ────────────────────────────────────────
  // Patient views their own prescriptions (via lab results or future prescriptions model).
  // For now returns lab results with result data as a proxy for prescriptions.
  router.get('/me/prescriptions', requireAuth, requirePermission('prescriptions:read'), async (req, res, next) => {
    try {
      const patient = await prismaClient.patient.findFirst({
        where: { userId: req.user.id, tenantId: req.tenantId },
        select: { id: true },
      });

      if (!patient) {
        return res.status(404).json({ error: 'not_found', message: 'Patient profile not found' });
      }

      // Prescriptions are lab results with result data populated (published)
      const prescriptions = await prismaClient.labResult.findMany({
        where: {
          patientId: patient.id,
          tenantId:  req.tenantId,
          status:    'AVAILABLE',
          result:    { not: null },
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id:           true,
          testName:     true,
          result:       true,
          resultFileUrl: true,
          status:       true,
          publishedAt:  true,
          createdAt:    true,
        },
      });

      return res.json({ data: prescriptions, total: prescriptions.length });
    } catch (err) {
      return next(err);
    }
  });

  // ── GET /patients/me/results ──────────────────────────────────────────────
  // Patient views their own published lab results.
  router.get('/me/results', requireAuth, requirePermission('appointments:read'), async (req, res, next) => {
    try {
      const patient = await prismaClient.patient.findFirst({
        where: { userId: req.user.id, tenantId: req.tenantId },
        select: { id: true },
      });

      if (!patient) {
        return res.status(404).json({ error: 'not_found', message: 'Patient profile not found' });
      }

      const results = await prismaClient.labResult.findMany({
        where: {
          patientId: patient.id,
          tenantId:  req.tenantId,
          status:    'AVAILABLE',
        },
        orderBy: { publishedAt: 'desc' },
        select: {
          id:            true,
          testName:      true,
          result:        true,
          resultFileUrl: true,
          status:        true,
          publishedAt:   true,
          createdAt:     true,
        },
      });

      return res.json({ data: results, total: results.length });
    } catch (err) {
      return next(err);
    }
  });

  // ── POST /patients/me/uploads ─────────────────────────────────────────────
  // Patient uploads an external medical record (PDF or image).
  // File is scanned for malware before being stored in Supabase Storage.
  // Org setting patientSelfUploadEnabled must be true.
  router.post(
    '/me/uploads',
    requireAuth,
    requirePermission('appointments:read'), // PATIENT role allowed by this permission
    upload.single('file'),
    async (req, res, next) => {
      try {
        // ── Multer 413 ─────────────────────────────────────────────────────
        // multer emits a MulterError with code LIMIT_FILE_SIZE when size exceeded
        // (handled by the error middleware below); just guard against missing file
        if (!req.file) {
          return res.status(400).json({ error: 'bad_request', message: 'file is required' });
        }

        const { category, description } = req.body;
        const validCategories = ['lab_result', 'prescription', 'referral', 'other'];
        if (!category || !validCategories.includes(category)) {
          return res.status(400).json({
            error: 'bad_request',
            message: `category must be one of: ${validCategories.join(', ')}`,
          });
        }

        // ── Check org upload setting ───────────────────────────────────────
        const org = await prismaClient.organization.findFirst({
          where: { tenantId: req.tenantId },
          select: { patientSelfUploadEnabled: true },
        });

        if (org && org.patientSelfUploadEnabled === false) {
          return res.status(403).json({
            error: 'forbidden',
            message: 'Patient uploads are disabled for this organization',
          });
        }

        // ── Resolve patient ────────────────────────────────────────────────
        const patient = await prismaClient.patient.findFirst({
          where: { userId: req.user.id, tenantId: req.tenantId },
          select: { id: true },
        });

        if (!patient) {
          return res.status(404).json({ error: 'not_found', message: 'Patient profile not found' });
        }

        // ── Malware scan ───────────────────────────────────────────────────
        const scanner = malwareScanServiceFactory();
        const scanResult = await scanner.scan(req.file.buffer, req.file.originalname);

        if (!scanResult.clean) {
          if (scanResult.result === 'infected') {
            return res.status(422).json({
              error: 'malware_detected',
              message: 'The uploaded file failed security scanning and was not stored',
            });
          }
          // Scan service error — fail closed with 503
          return res.status(503).json({
            error: 'scan_unavailable',
            message: 'File security scanning is temporarily unavailable. Please try again later.',
          });
        }

        // ── Upload to Supabase Storage ─────────────────────────────────────
        const filename = `${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const storagePath = `patient-uploads/${patient.id}/${filename}`;

        const storageSvc = storageServiceFactory();
        const { error: uploadError } = await storageSvc.upload(
          req.tenantId,
          `patient-uploads/${patient.id}`,
          filename,
          req.file.buffer,
          { contentType: req.file.mimetype },
        );

        if (uploadError) {
          return next(Object.assign(new Error(uploadError.message), { status: 502 }));
        }

        // ── Create DB record ───────────────────────────────────────────────
        // We reuse LabResult model for patient-uploaded external records
        const record = await prismaClient.labResult.create({
          data: {
            tenantId:      req.tenantId,
            patientId:     patient.id,
            testName:      `${category}: ${description ?? req.file.originalname}`,
            resultFileUrl: storagePath,
            status:        'PENDING',
          },
          select: {
            id:            true,
            testName:      true,
            resultFileUrl: true,
            status:        true,
            createdAt:     true,
          },
        });

        req.audit({ action: 'patient.file_uploaded', resourceType: 'LabResult', resourceId: record.id, metadata: { category, filename } });
        return res.status(201).json({
          message: 'File uploaded successfully and is pending review',
          upload: record,
        });
      } catch (err) {
        // multer LIMIT_FILE_SIZE → 413
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ error: 'file_too_large', message: 'File must be 10 MB or smaller' });
        }
        return next(err);
      }
    },
  );

  return router;
}

export default createPatientsRouter();
