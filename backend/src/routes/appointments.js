import express from 'express';
import { createRequireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { prisma as defaultPrisma } from '../models/prisma.js';

/**
 * Appointment scheduling API (CC-60, CC-62).
 *
 * POST   /appointments                — create appointment with conflict check
 * GET    /appointments                — list by professionalId + date
 * PUT    /appointments/:id            — update appointment (status, notes, etc.)
 * DELETE /appointments/:id            — cancel appointment
 * POST   /appointments/:id/check-in  — check patient in (CC-62)
 *
 * Conflict detection: two appointments for the same professional cannot overlap.
 * Conflict window: [scheduledAt, scheduledAt + durationMins).
 *
 * Injectable dependencies for full unit testability.
 */
export function createAppointmentsRouter({
  prismaClient = defaultPrisma,
  authMiddlewareFactory,
} = {}) {
  const router = express.Router();
  const requireAuth = authMiddlewareFactory
    ? authMiddlewareFactory({ prismaClient })
    : createRequireAuth({ prismaClient });

  // ── POST /appointments ────────────────────────────────────────────────────
  router.post('/', requireAuth, requirePermission('appointments:create'), async (req, res, next) => {
    try {
      const { patientId, professionalId, branchId, scheduledAt, durationMins, type, notes } = req.body;

      if (!patientId || !professionalId || !branchId || !scheduledAt || !type) {
        return res.status(400).json({
          error:   'bad_request',
          message: 'patientId, professionalId, branchId, scheduledAt, and type are required',
        });
      }

      // Verify patient + branch belong to this tenant
      const [patient, branch] = await Promise.all([
        prismaClient.patient.findFirst({
          where: { id: patientId, tenantId: req.tenantId },
          select: { id: true },
        }),
        prismaClient.branch.findFirst({
          where: { id: branchId, tenantId: req.tenantId, isActive: true },
          select: { id: true },
        }),
      ]);

      if (!patient) {
        return res.status(404).json({ error: 'not_found', message: 'Patient not found' });
      }
      if (!branch) {
        return res.status(404).json({ error: 'not_found', message: 'Branch not found' });
      }

      const start    = new Date(scheduledAt);
      const duration = durationMins ? parseInt(durationMins) : 30;
      const end      = new Date(start.getTime() + duration * 60_000);

      // Conflict detection: any non-cancelled appointment for same professional that overlaps
      const conflict = await prismaClient.appointment.findFirst({
        where: {
          tenantId:      req.tenantId,
          professionalId,
          status:        { notIn: ['CANCELLED', 'NO_SHOW'] },
          scheduledAt:   { lt: end },
          AND: [{
            scheduledAt: {
              gte: new Date(start.getTime() - duration * 60_000 * 2), // look back 2x to catch straddlers
            },
          }],
        },
        select: { id: true, scheduledAt: true, durationMins: true },
      });

      // More precise overlap check in memory (covers variable durations)
      if (conflict) {
        const conflictEnd = new Date(
          new Date(conflict.scheduledAt).getTime() + conflict.durationMins * 60_000,
        );
        if (new Date(conflict.scheduledAt) < end && conflictEnd > start) {
          return res.status(409).json({
            error:   'conflict',
            message: 'This time slot is already booked for the selected professional',
          });
        }
      }

      const appointment = await prismaClient.appointment.create({
        data: {
          tenantId:      req.tenantId,
          patientId,
          professionalId,
          branchId,
          scheduledAt:   start,
          durationMins:  duration,
          type,
          notes:         notes ?? null,
        },
        select: {
          id:            true,
          patientId:     true,
          professionalId: true,
          branchId:      true,
          scheduledAt:   true,
          durationMins:  true,
          type:          true,
          status:        true,
          notes:         true,
          createdAt:     true,
          updatedAt:     true,
        },
      });

      req.audit({
        action:       'appointment.created',
        resourceType: 'Appointment',
        resourceId:   appointment.id,
        metadata:     { patientId, professionalId, scheduledAt },
      });

      return res.status(201).json(appointment);
    } catch (err) {
      return next(err);
    }
  });

  // ── GET /appointments ─────────────────────────────────────────────────────
  // Filter by professionalId, date (YYYY-MM-DD), patientId, status.
  router.get('/', requireAuth, requirePermission('appointments:read'), async (req, res, next) => {
    try {
      const page  = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(100, parseInt(req.query.limit) || 20);
      const skip  = (page - 1) * limit;

      const { professionalId, patientId, date, status } = req.query;

      const where = {
        tenantId: req.tenantId,
        ...(professionalId && { professionalId }),
        ...(patientId      && { patientId }),
        ...(status         && { status }),
        ...(date && {
          scheduledAt: {
            gte: new Date(`${date}T00:00:00.000Z`),
            lt:  new Date(`${date}T23:59:59.999Z`),
          },
        }),
      };

      const [appointments, total] = await Promise.all([
        prismaClient.appointment.findMany({
          where,
          skip,
          take:    limit,
          orderBy: { scheduledAt: 'asc' },
          select: {
            id:            true,
            patientId:     true,
            professionalId: true,
            branchId:      true,
            scheduledAt:   true,
            durationMins:  true,
            type:          true,
            status:        true,
            notes:         true,
            checkInAt:     true,
            createdAt:     true,
            updatedAt:     true,
          },
        }),
        prismaClient.appointment.count({ where }),
      ]);

      return res.json({
        data:       appointments,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    } catch (err) {
      return next(err);
    }
  });

  // ── PUT /appointments/:id ─────────────────────────────────────────────────
  router.put('/:id', requireAuth, requirePermission('appointments:update'), async (req, res, next) => {
    const { status, notes, scheduledAt, durationMins, type } = req.body;

    const ALLOWED_STATUSES = ['BOOKED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];

    const data = {};
    if (status      != null) {
      if (!ALLOWED_STATUSES.includes(status)) {
        return res.status(400).json({
          error:   'bad_request',
          message: `status must be one of: ${ALLOWED_STATUSES.join(', ')}`,
        });
      }
      data.status = status;
    }
    if (notes       != null) data.notes       = notes;
    if (type        != null) data.type        = type;
    if (durationMins != null) data.durationMins = parseInt(durationMins);
    if (scheduledAt != null) data.scheduledAt = new Date(scheduledAt);

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'bad_request', message: 'No updatable fields provided' });
    }

    try {
      const existing = await prismaClient.appointment.findFirst({
        where: { id: req.params.id, tenantId: req.tenantId },
      });

      if (!existing) {
        return res.status(404).json({ error: 'not_found', message: 'Appointment not found' });
      }

      const updated = await prismaClient.appointment.update({
        where: { id: req.params.id },
        data,
        select: {
          id:            true,
          patientId:     true,
          professionalId: true,
          branchId:      true,
          scheduledAt:   true,
          durationMins:  true,
          type:          true,
          status:        true,
          notes:         true,
          checkInAt:     true,
          createdAt:     true,
          updatedAt:     true,
        },
      });

      req.audit({
        action:       'appointment.updated',
        resourceType: 'Appointment',
        resourceId:   updated.id,
        metadata:     { fields: Object.keys(data) },
      });

      return res.json(updated);
    } catch (err) {
      return next(err);
    }
  });

  // ── DELETE /appointments/:id ──────────────────────────────────────────────
  // Cancel the appointment (status → CANCELLED, not hard delete).
  router.delete('/:id', requireAuth, requirePermission('appointments:cancel'), async (req, res, next) => {
    try {
      const existing = await prismaClient.appointment.findFirst({
        where: { id: req.params.id, tenantId: req.tenantId },
      });

      if (!existing) {
        return res.status(404).json({ error: 'not_found', message: 'Appointment not found' });
      }

      if (existing.status === 'CANCELLED') {
        return res.status(409).json({ error: 'conflict', message: 'Appointment is already cancelled' });
      }

      await prismaClient.appointment.update({
        where: { id: req.params.id },
        data:  { status: 'CANCELLED' },
      });

      req.audit({
        action:       'appointment.cancelled',
        resourceType: 'Appointment',
        resourceId:   req.params.id,
      });

      return res.status(204).send();
    } catch (err) {
      return next(err);
    }
  });

  // ── POST /appointments/:id/check-in ───────────────────────────────────────
  // Secretary checks patient in. Updates status → CHECKED_IN, records checkInAt.
  // Auto-creates an EMR visit record linked to this appointment (CC-62).
  router.post('/:id/check-in', requireAuth, requirePermission('appointments:update'), async (req, res, next) => {
    try {
      const appointment = await prismaClient.appointment.findFirst({
        where: { id: req.params.id, tenantId: req.tenantId },
      });

      if (!appointment) {
        return res.status(404).json({ error: 'not_found', message: 'Appointment not found' });
      }

      if (appointment.status === 'CHECKED_IN') {
        return res.status(409).json({ error: 'conflict', message: 'Patient is already checked in' });
      }

      if (!['BOOKED', 'CONFIRMED'].includes(appointment.status)) {
        return res.status(409).json({
          error:   'conflict',
          message: `Cannot check in an appointment with status: ${appointment.status}`,
        });
      }

      const now = new Date();

      // Update appointment status + checkInAt, create EMR visit — in a transaction
      const [updated] = await prismaClient.$transaction([
        prismaClient.appointment.update({
          where: { id: req.params.id },
          data:  { status: 'CHECKED_IN', checkInAt: now },
          select: {
            id:            true,
            patientId:     true,
            professionalId: true,
            branchId:      true,
            scheduledAt:   true,
            durationMins:  true,
            type:          true,
            status:        true,
            checkInAt:     true,
            updatedAt:     true,
          },
        }),
        prismaClient.emrVisit.create({
          data: {
            tenantId:      req.tenantId,
            patientId:     appointment.patientId,
            appointmentId: appointment.id,
            recordedById:  req.user.id,
            visitDate:     now,
          },
        }),
      ]);

      req.audit({
        action:       'appointment.checked_in',
        resourceType: 'Appointment',
        resourceId:   appointment.id,
        metadata:     { patientId: appointment.patientId, checkInAt: now.toISOString() },
      });

      return res.json(updated);
    } catch (err) {
      return next(err);
    }
  });

  return router;
}

export default createAppointmentsRouter();
