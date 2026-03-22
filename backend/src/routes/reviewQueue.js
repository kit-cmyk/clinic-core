import express from 'express';
import { createRequireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { prisma as defaultPrisma } from '../models/prisma.js';

/**
 * Review queue API (CC-50, CC-52).
 *
 * GET  /review-queue           — list patient-uploaded LabResults with status PENDING
 * PUT  /review-queue/:id/status — update status: reviewed (AVAILABLE) or rejected (FLAGGED)
 * PUT  /review-queue/:id/verify — verify + tag a record (verifiedCategory, clinicalNotes)
 *
 * Requires: review:read / review:update (DOCTOR, NURSE, ORG_ADMIN, SUPER_ADMIN)
 *
 * Injectable dependencies for full unit testability.
 */
export function createReviewQueueRouter({
  prismaClient = defaultPrisma,
  authMiddlewareFactory,
} = {}) {
  const router = express.Router();
  const requireAuth = authMiddlewareFactory
    ? authMiddlewareFactory({ prismaClient })
    : createRequireAuth({ prismaClient });

  // ── GET /review-queue ──────────────────────────────────────────────────────
  // List pending patient uploads for the tenant, oldest first.
  // Query: patientId, category, dateFrom, dateTo, page, limit
  router.get('/', requireAuth, requirePermission('review:read'), async (req, res, next) => {
    try {
      const page      = Math.max(1, parseInt(req.query.page) || 1);
      const limit     = Math.min(100, parseInt(req.query.limit) || 20);
      const skip      = (page - 1) * limit;
      const { patientId, category, dateFrom, dateTo } = req.query;

      const where = {
        tenantId: req.tenantId,
        status:   'PENDING',
        ...(patientId && { patientId }),
        ...(category  && { testName: category }),
        ...((dateFrom || dateTo) && {
          createdAt: {
            ...(dateFrom && { gte: new Date(dateFrom) }),
            ...(dateTo   && { lte: new Date(dateTo) }),
          },
        }),
      };

      const [items, total] = await Promise.all([
        prismaClient.labResult.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'asc' }, // oldest first — most urgent
          select: {
            id:              true,
            patientId:       true,
            testName:        true,
            result:          true,
            resultFileUrl:   true,
            status:          true,
            verifiedCategory: true,
            clinicalNotes:   true,
            createdAt:       true,
            orderedById:     true,
          },
        }),
        prismaClient.labResult.count({ where }),
      ]);

      return res.json({
        data:       items,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    } catch (err) {
      return next(err);
    }
  });

  // ── PUT /review-queue/:id/status ──────────────────────────────────────────
  // Set status: 'reviewed' → AVAILABLE, 'rejected' → FLAGGED
  router.put('/:id/status', requireAuth, requirePermission('review:update'), async (req, res, next) => {
    const { status } = req.body;

    if (!status || !['reviewed', 'rejected'].includes(status)) {
      return res.status(400).json({
        error:   'bad_request',
        message: "status must be 'reviewed' or 'rejected'",
      });
    }

    try {
      const existing = await prismaClient.labResult.findFirst({
        where: { id: req.params.id, tenantId: req.tenantId },
      });

      if (!existing) {
        return res.status(404).json({ error: 'not_found', message: 'Upload not found' });
      }

      const prismaStatus = status === 'reviewed' ? 'AVAILABLE' : 'FLAGGED';

      const updated = await prismaClient.labResult.update({
        where: { id: req.params.id },
        data:  { status: prismaStatus },
        select: {
          id:        true,
          patientId: true,
          testName:  true,
          status:    true,
          updatedAt: true,
        },
      });

      req.audit({
        action:       'review_queue.status_updated',
        resourceType: 'LabResult',
        resourceId:   updated.id,
        metadata:     { status: prismaStatus },
      });

      return res.json(updated);
    } catch (err) {
      return next(err);
    }
  });

  // ── PUT /review-queue/:id/verify ──────────────────────────────────────────
  // Professional verifies and tags an uploaded record (CC-52).
  // Sets verifiedCategory, clinicalNotes, optional visitId link, status → AVAILABLE.
  router.put('/:id/verify', requireAuth, requirePermission('review:update'), async (req, res, next) => {
    const { verifiedCategory, clinicalNotes, visitId } = req.body;

    try {
      const existing = await prismaClient.labResult.findFirst({
        where: { id: req.params.id, tenantId: req.tenantId },
      });

      if (!existing) {
        return res.status(404).json({ error: 'not_found', message: 'Upload not found' });
      }

      const data = {
        status: 'AVAILABLE',
        ...(verifiedCategory != null && { verifiedCategory }),
        ...(clinicalNotes    != null && { clinicalNotes }),
      };

      const updated = await prismaClient.labResult.update({
        where: { id: req.params.id },
        data,
        select: {
          id:              true,
          patientId:       true,
          testName:        true,
          status:          true,
          verifiedCategory: true,
          clinicalNotes:   true,
          updatedAt:       true,
        },
      });

      req.audit({
        action:       'review_queue.verified',
        resourceType: 'LabResult',
        resourceId:   updated.id,
        metadata:     { verifiedCategory, visitId: visitId ?? null },
      });

      return res.json(updated);
    } catch (err) {
      return next(err);
    }
  });

  return router;
}

export default createReviewQueueRouter();
