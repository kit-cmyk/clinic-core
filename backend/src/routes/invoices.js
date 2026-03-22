import express from 'express';
import { createRequireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { prisma as defaultPrisma } from '../models/prisma.js';

/**
 * Invoices API (CC-137).
 *
 * GET /invoices        — list invoices for tenant (filter by patientId, status)
 * GET /invoices/:id    — single invoice + line items
 *
 * PATIENT role may only read their own invoices (enforced by invoices:read permission
 * + patient-scoped filter when role === PATIENT).
 * Injectable dependencies for full unit testability.
 */
export function createInvoicesRouter({
  prismaClient = defaultPrisma,
  authMiddlewareFactory,
} = {}) {
  const router = express.Router();
  const requireAuth = authMiddlewareFactory
    ? authMiddlewareFactory({ prismaClient })
    : createRequireAuth({ prismaClient });

  // ── GET /invoices ─────────────────────────────────────────────────────────
  router.get('/', requireAuth, requirePermission('invoices:read'), async (req, res, next) => {
    try {
      const page   = Math.max(1, parseInt(req.query.page) || 1);
      const limit  = Math.min(100, parseInt(req.query.limit) || 20);
      const skip   = (page - 1) * limit;
      const { patientId, status } = req.query;

      // PATIENT role may only see their own invoices
      let patientFilter = patientId || undefined;
      if (req.user.role === 'PATIENT') {
        const patient = await prismaClient.patient.findFirst({
          where: { userId: req.user.id, tenantId: req.tenantId },
          select: { id: true },
        });
        if (!patient) return res.json({ data: [], pagination: { page, limit, total: 0, pages: 0 } });
        patientFilter = patient.id;
      }

      const where = {
        tenantId:  req.tenantId,
        ...(patientFilter && { patientId: patientFilter }),
        ...(status        && { status }),
      };

      const [invoices, total] = await Promise.all([
        prismaClient.invoice.findMany({
          where,
          skip,
          take:    limit,
          orderBy: { issuedAt: 'desc' },
          select: {
            id:               true,
            invoiceNumber:    true,
            patientId:        true,
            appointmentId:    true,
            status:           true,
            totalAmountCents: true,
            issuedAt:         true,
            dueAt:            true,
            paidAt:           true,
            createdAt:        true,
            patient: {
              select: { firstName: true, lastName: true },
            },
            lineItems: {
              select: {
                id:            true,
                description:   true,
                quantity:      true,
                unitPriceCents: true,
                totalCents:    true,
              },
            },
          },
        }),
        prismaClient.invoice.count({ where }),
      ]);

      return res.json({
        data:       invoices,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    } catch (err) {
      return next(err);
    }
  });

  // ── GET /invoices/:id ─────────────────────────────────────────────────────
  router.get('/:id', requireAuth, requirePermission('invoices:read'), async (req, res, next) => {
    try {
      const invoice = await prismaClient.invoice.findFirst({
        where: { id: req.params.id, tenantId: req.tenantId },
        select: {
          id:               true,
          invoiceNumber:    true,
          patientId:        true,
          appointmentId:    true,
          status:           true,
          totalAmountCents: true,
          issuedAt:         true,
          dueAt:            true,
          paidAt:           true,
          createdAt:        true,
          updatedAt:        true,
          patient: {
            select: { firstName: true, lastName: true },
          },
          lineItems: {
            select: {
              id:             true,
              description:    true,
              quantity:       true,
              unitPriceCents: true,
              totalCents:     true,
            },
            orderBy: { id: 'asc' },
          },
        },
      });

      if (!invoice) {
        return res.status(404).json({ error: 'not_found', message: 'Invoice not found' });
      }

      // PATIENT may only view their own invoice
      if (req.user.role === 'PATIENT') {
        const patient = await prismaClient.patient.findFirst({
          where: { userId: req.user.id, tenantId: req.tenantId },
          select: { id: true },
        });
        if (!patient || patient.id !== invoice.patientId) {
          return res.status(403).json({ error: 'forbidden', message: 'Access denied' });
        }
      }

      return res.json(invoice);
    } catch (err) {
      return next(err);
    }
  });

  return router;
}

export default createInvoicesRouter();
