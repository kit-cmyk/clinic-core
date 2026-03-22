import express from 'express';
import multer from 'multer';
import { createRequireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { prisma as defaultPrisma } from '../models/prisma.js';
import { createStorageService } from '../services/storage.js';
import { createMalwareScanService } from '../services/malwareScan.js';

/** Allowed MIME types for result files. */
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES },
  fileFilter(_req, file, cb) {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(Object.assign(new Error('Unsupported file type'), { status: 415 }));
    }
  },
});

/**
 * Lab result publishing API (CC-48).
 *
 * POST /results — professional publishes a lab result to a patient's portal.
 *   - File goes through malware scan, then stored in Supabase Storage.
 *   - LabResult record created with status: AVAILABLE (published).
 *   - Only DOCTOR, NURSE, ORG_ADMIN, SUPER_ADMIN can publish (lab:publish permission).
 *
 * GET /results  — list published results for the tenant (staff view).
 *
 * Injectable dependencies for full unit testability.
 */
export function createResultsRouter({
  prismaClient = defaultPrisma,
  authMiddlewareFactory,
  storageServiceFactory = createStorageService,
  malwareScanServiceFactory = createMalwareScanService,
} = {}) {
  const router = express.Router();
  const requireAuth = authMiddlewareFactory
    ? authMiddlewareFactory({ prismaClient })
    : createRequireAuth({ prismaClient });

  // ── POST /results ─────────────────────────────────────────────────────────
  router.post(
    '/',
    requireAuth,
    requirePermission('lab:publish'),
    upload.single('file'),
    async (req, res, next) => {
      try {
        const { patientId, testName, notes, appointmentId } = req.body;

        if (!patientId || !testName) {
          return res.status(400).json({ error: 'bad_request', message: 'patientId and testName are required' });
        }

        // Verify patient belongs to this tenant
        const patient = await prismaClient.patient.findFirst({
          where: { id: patientId, tenantId: req.tenantId },
          select: { id: true },
        });

        if (!patient) {
          return res.status(404).json({ error: 'not_found', message: 'Patient not found' });
        }

        let resultFileUrl = null;

        if (req.file) {
          // ── Malware scan ─────────────────────────────────────────────────
          const scanner = malwareScanServiceFactory();
          const scanResult = await scanner.scan(req.file.buffer, req.file.originalname);

          if (!scanResult.clean) {
            if (scanResult.result === 'infected') {
              return res.status(422).json({
                error: 'malware_detected',
                message: 'The uploaded file failed security scanning and was not stored',
              });
            }
            return res.status(503).json({
              error: 'scan_unavailable',
              message: 'File security scanning is temporarily unavailable. Please try again later.',
            });
          }

          // ── Upload to Supabase Storage ───────────────────────────────────
          const filename = `${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
          const storageSvc = storageServiceFactory();
          const { error: uploadError } = await storageSvc.upload(
            req.tenantId,
            `results/${patientId}`,
            filename,
            req.file.buffer,
            { contentType: req.file.mimetype },
          );

          if (uploadError) {
            return next(Object.assign(new Error(uploadError.message), { status: 502 }));
          }

          resultFileUrl = `results/${patientId}/${filename}`;
        }

        // ── Create LabResult record ─────────────────────────────────────────
        const result = await prismaClient.labResult.create({
          data: {
            tenantId:      req.tenantId,
            patientId:     patient.id,
            orderedById:   req.user.id,
            appointmentId: appointmentId ?? null,
            testName,
            result:        notes ?? null,
            resultFileUrl,
            status:        'AVAILABLE',
            publishedAt:   new Date(),
          },
          select: {
            id:            true,
            patientId:     true,
            testName:      true,
            result:        true,
            resultFileUrl: true,
            status:        true,
            publishedAt:   true,
            createdAt:     true,
          },
        });

        req.audit({
          action: 'lab_result.published',
          resourceType: 'LabResult',
          resourceId: result.id,
          metadata: { patientId, testName },
        });

        return res.status(201).json(result);
      } catch (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ error: 'file_too_large', message: 'File must be 10 MB or smaller' });
        }
        return next(err);
      }
    },
  );

  // ── GET /results ──────────────────────────────────────────────────────────
  // Staff view — list published results for the tenant, optionally filtered by patient.
  router.get('/', requireAuth, requirePermission('lab:read'), async (req, res, next) => {
    try {
      const page      = Math.max(1, parseInt(req.query.page) || 1);
      const limit     = Math.min(100, parseInt(req.query.limit) || 20);
      const skip      = (page - 1) * limit;
      const patientId = req.query.patientId;

      const where = {
        tenantId: req.tenantId,
        status:   'AVAILABLE',
        ...(patientId && { patientId }),
      };

      const [results, total] = await Promise.all([
        prismaClient.labResult.findMany({
          where,
          skip,
          take: limit,
          orderBy: { publishedAt: 'desc' },
          select: {
            id:            true,
            patientId:     true,
            testName:      true,
            result:        true,
            resultFileUrl: true,
            status:        true,
            publishedAt:   true,
            createdAt:     true,
          },
        }),
        prismaClient.labResult.count({ where }),
      ]);

      return res.json({
        data: results,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    } catch (err) {
      return next(err);
    }
  });

  return router;
}

export default createResultsRouter();
