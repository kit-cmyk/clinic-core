import express from 'express';
import { createRequireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { prisma as defaultPrisma } from '../models/prisma.js';

/**
 * Digital Prescriptions API (CC-58).
 *
 * POST /prescriptions               — create prescription (DOCTOR only)
 * GET  /prescriptions?patientId=X   — list prescriptions for a patient
 * PUT  /prescriptions/:id           — update status/notes (DOCTOR only)
 *
 * Auth: prescriptions:create (SUPER_ADMIN, DOCTOR)
 *       prescriptions:read   (SUPER_ADMIN, ORG_ADMIN, DOCTOR, NURSE, PATIENT)
 *
 * PATIENT role can only read prescriptions via GET /patients/me/prescriptions
 * (implemented in patients.js). This route scopes to tenant staff views.
 *
 * Injectable dependencies for full unit testability.
 */
export function createPrescriptionsRouter({
  prismaClient = defaultPrisma,
  authMiddlewareFactory,
} = {}) {
  const router = express.Router();
  const requireAuth = authMiddlewareFactory
    ? authMiddlewareFactory({ prismaClient })
    : createRequireAuth({ prismaClient });

  // ── POST /prescriptions ───────────────────────────────────────────────────
  router.post('/', requireAuth, requirePermission('prescriptions:create'), async (req, res, next) => {
    try {
      const { patientId, visitId, medication, dosage, frequency, durationDays, notes } = req.body;

      if (!patientId || !medication || !dosage || !frequency) {
        return res.status(400).json({
          error:   'bad_request',
          message: 'patientId, medication, dosage, and frequency are required',
        });
      }

      // Verify patient belongs to this tenant
      const patient = await prismaClient.patient.findFirst({
        where: { id: patientId, tenantId: req.tenantId },
        select: { id: true },
      });

      if (!patient) {
        return res.status(404).json({ error: 'not_found', message: 'Patient not found' });
      }

      const prescription = await prismaClient.prescription.create({
        data: {
          tenantId:      req.tenantId,
          patientId,
          visitId:       visitId ?? null,
          prescribedById: req.user.id,
          medication,
          dosage,
          frequency,
          durationDays:  durationDays ?? null,
          notes:         notes ?? null,
        },
        select: {
          id:            true,
          patientId:     true,
          visitId:       true,
          prescribedById: true,
          medication:    true,
          dosage:        true,
          frequency:     true,
          durationDays:  true,
          notes:         true,
          isActive:      true,
          createdAt:     true,
          updatedAt:     true,
        },
      });

      req.audit({
        action:       'prescription.created',
        resourceType: 'Prescription',
        resourceId:   prescription.id,
        metadata:     { patientId, medication },
      });

      return res.status(201).json(prescription);
    } catch (err) {
      return next(err);
    }
  });

  // ── GET /prescriptions ────────────────────────────────────────────────────
  // Staff view — list prescriptions for a patient (patientId required).
  router.get('/', requireAuth, requirePermission('prescriptions:read'), async (req, res, next) => {
    try {
      const { patientId } = req.query;

      if (!patientId) {
        return res.status(400).json({ error: 'bad_request', message: 'patientId query param is required' });
      }

      // Verify patient belongs to this tenant
      const patient = await prismaClient.patient.findFirst({
        where: { id: patientId, tenantId: req.tenantId },
        select: { id: true },
      });

      if (!patient) {
        return res.status(404).json({ error: 'not_found', message: 'Patient not found' });
      }

      const page  = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(100, parseInt(req.query.limit) || 20);
      const skip  = (page - 1) * limit;

      const where = {
        patientId,
        tenantId: req.tenantId,
        ...(req.query.activeOnly === 'true' && { isActive: true }),
      };

      const [prescriptions, total] = await Promise.all([
        prismaClient.prescription.findMany({
          where,
          skip,
          take:    limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id:            true,
            patientId:     true,
            visitId:       true,
            prescribedById: true,
            medication:    true,
            dosage:        true,
            frequency:     true,
            durationDays:  true,
            notes:         true,
            isActive:      true,
            createdAt:     true,
            updatedAt:     true,
          },
        }),
        prismaClient.prescription.count({ where }),
      ]);

      return res.json({
        data:       prescriptions,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    } catch (err) {
      return next(err);
    }
  });

  // ── PUT /prescriptions/:id ────────────────────────────────────────────────
  // Update isActive (mark completed) or notes.
  router.put('/:id', requireAuth, requirePermission('prescriptions:create'), async (req, res, next) => {
    const { isActive, notes, dosage, frequency, durationDays } = req.body;

    const data = {};
    if (isActive     != null) data.isActive     = Boolean(isActive);
    if (notes        != null) data.notes        = notes;
    if (dosage       != null) data.dosage       = dosage;
    if (frequency    != null) data.frequency    = frequency;
    if (durationDays != null) data.durationDays = durationDays;

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'bad_request', message: 'No updatable fields provided' });
    }

    try {
      const existing = await prismaClient.prescription.findFirst({
        where: { id: req.params.id, tenantId: req.tenantId },
      });

      if (!existing) {
        return res.status(404).json({ error: 'not_found', message: 'Prescription not found' });
      }

      const updated = await prismaClient.prescription.update({
        where: { id: req.params.id },
        data,
        select: {
          id:            true,
          patientId:     true,
          visitId:       true,
          prescribedById: true,
          medication:    true,
          dosage:        true,
          frequency:     true,
          durationDays:  true,
          notes:         true,
          isActive:      true,
          createdAt:     true,
          updatedAt:     true,
        },
      });

      req.audit({
        action:       'prescription.updated',
        resourceType: 'Prescription',
        resourceId:   updated.id,
        metadata:     { fields: Object.keys(data) },
      });

      return res.json(updated);
    } catch (err) {
      return next(err);
    }
  });

  return router;
}

export default createPrescriptionsRouter();
