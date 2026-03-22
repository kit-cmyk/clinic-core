import express from 'express';
import { createRequireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { prisma as defaultPrisma } from '../models/prisma.js';

/**
 * EMR (Electronic Medical Records) API (CC-56).
 *
 * GET  /patients/:id/emr            — list EMR visits for a patient (newest first)
 * POST /patients/:id/emr            — create a visit record
 * PUT  /patients/:id/emr/:visitId   — update a visit record
 *
 * Auth: records:read / records:create (DOCTOR, NURSE, ORG_ADMIN, SUPER_ADMIN)
 * All records scoped to tenant_id. Patient from another tenant → 404.
 *
 * Injectable dependencies for full unit testability.
 */
export function createEmrRouter({
  prismaClient = defaultPrisma,
  authMiddlewareFactory,
} = {}) {
  const router = express.Router({ mergeParams: true });
  const requireAuth = authMiddlewareFactory
    ? authMiddlewareFactory({ prismaClient })
    : createRequireAuth({ prismaClient });

  // ── GET /patients/:id/emr ─────────────────────────────────────────────────
  router.get('/', requireAuth, requirePermission('records:read'), async (req, res, next) => {
    try {
      const patient = await prismaClient.patient.findFirst({
        where: { id: req.params.id, tenantId: req.tenantId },
        select: { id: true },
      });

      if (!patient) {
        return res.status(404).json({ error: 'not_found', message: 'Patient not found' });
      }

      const page  = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(100, parseInt(req.query.limit) || 20);
      const skip  = (page - 1) * limit;

      const [visits, total] = await Promise.all([
        prismaClient.emrVisit.findMany({
          where:   { patientId: req.params.id, tenantId: req.tenantId },
          skip,
          take:    limit,
          orderBy: { visitDate: 'desc' },
          select: {
            id:            true,
            patientId:     true,
            appointmentId: true,
            recordedById:  true,
            visitDate:     true,
            chiefComplaint: true,
            vitals:        true,
            clinicalNotes: true,
            diagnoses:     true,
            treatmentPlan: true,
            followUpDays:  true,
            createdAt:     true,
            updatedAt:     true,
          },
        }),
        prismaClient.emrVisit.count({
          where: { patientId: req.params.id, tenantId: req.tenantId },
        }),
      ]);

      req.audit({
        action:       'emr.viewed',
        resourceType: 'Patient',
        resourceId:   req.params.id,
      });

      return res.json({
        data:       visits,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    } catch (err) {
      return next(err);
    }
  });

  // ── POST /patients/:id/emr ────────────────────────────────────────────────
  router.post('/', requireAuth, requirePermission('records:create'), async (req, res, next) => {
    try {
      const patient = await prismaClient.patient.findFirst({
        where: { id: req.params.id, tenantId: req.tenantId },
        select: { id: true },
      });

      if (!patient) {
        return res.status(404).json({ error: 'not_found', message: 'Patient not found' });
      }

      const {
        appointmentId,
        visitDate,
        chiefComplaint,
        vitals,
        clinicalNotes,
        diagnoses,
        treatmentPlan,
        followUpDays,
      } = req.body;

      const visit = await prismaClient.emrVisit.create({
        data: {
          tenantId:      req.tenantId,
          patientId:     req.params.id,
          recordedById:  req.user.id,
          appointmentId: appointmentId ?? null,
          visitDate:     visitDate ? new Date(visitDate) : new Date(),
          chiefComplaint: chiefComplaint ?? null,
          vitals:        vitals ?? null,
          clinicalNotes: clinicalNotes ?? null,
          diagnoses:     diagnoses ?? [],
          treatmentPlan: treatmentPlan ?? null,
          followUpDays:  followUpDays ?? null,
        },
        select: {
          id:            true,
          patientId:     true,
          appointmentId: true,
          recordedById:  true,
          visitDate:     true,
          chiefComplaint: true,
          vitals:        true,
          clinicalNotes: true,
          diagnoses:     true,
          treatmentPlan: true,
          followUpDays:  true,
          createdAt:     true,
          updatedAt:     true,
        },
      });

      req.audit({
        action:       'emr.created',
        resourceType: 'EmrVisit',
        resourceId:   visit.id,
        metadata:     { patientId: req.params.id },
      });

      return res.status(201).json(visit);
    } catch (err) {
      return next(err);
    }
  });

  // ── PUT /patients/:id/emr/:visitId ────────────────────────────────────────
  router.put('/:visitId', requireAuth, requirePermission('records:create'), async (req, res, next) => {
    try {
      const existing = await prismaClient.emrVisit.findFirst({
        where: {
          id:        req.params.visitId,
          patientId: req.params.id,
          tenantId:  req.tenantId,
        },
      });

      if (!existing) {
        return res.status(404).json({ error: 'not_found', message: 'EMR visit not found' });
      }

      const {
        chiefComplaint,
        vitals,
        clinicalNotes,
        diagnoses,
        treatmentPlan,
        followUpDays,
      } = req.body;

      const data = {};
      if (chiefComplaint != null) data.chiefComplaint = chiefComplaint;
      if (vitals         != null) data.vitals         = vitals;
      if (clinicalNotes  != null) data.clinicalNotes  = clinicalNotes;
      if (diagnoses      != null) data.diagnoses      = diagnoses;
      if (treatmentPlan  != null) data.treatmentPlan  = treatmentPlan;
      if (followUpDays   != null) data.followUpDays   = followUpDays;

      if (Object.keys(data).length === 0) {
        return res.status(400).json({ error: 'bad_request', message: 'No updatable fields provided' });
      }

      const updated = await prismaClient.emrVisit.update({
        where: { id: req.params.visitId },
        data,
        select: {
          id:            true,
          patientId:     true,
          appointmentId: true,
          recordedById:  true,
          visitDate:     true,
          chiefComplaint: true,
          vitals:        true,
          clinicalNotes: true,
          diagnoses:     true,
          treatmentPlan: true,
          followUpDays:  true,
          createdAt:     true,
          updatedAt:     true,
        },
      });

      req.audit({
        action:       'emr.updated',
        resourceType: 'EmrVisit',
        resourceId:   updated.id,
        metadata:     { patientId: req.params.id, fields: Object.keys(data) },
      });

      return res.json(updated);
    } catch (err) {
      return next(err);
    }
  });

  return router;
}

export default createEmrRouter();
