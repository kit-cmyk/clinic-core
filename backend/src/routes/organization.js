import express from 'express';
import { createRequireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { prisma as defaultPrisma } from '../models/prisma.js';

/**
 * Organization management API (CC-32, CC-37).
 *
 * GET  /organization          — get current tenant's org profile
 * PUT  /organization          — update org profile (name, address, phone, email, logoUrl)
 * GET  /organization/settings — get org settings (patientSelfUploadEnabled, brandColor)
 * PUT  /organization/settings — update org settings
 *
 * All routes require ORG_ADMIN or SUPER_ADMIN (org:read / org:update).
 * Org is auto-created on first GET if none exists for the tenant.
 *
 * Injectable dependencies for full unit testability.
 */
export function createOrganizationRouter({
  prismaClient = defaultPrisma,
  authMiddlewareFactory,
} = {}) {
  const router = express.Router();
  const requireAuth = authMiddlewareFactory
    ? authMiddlewareFactory({ prismaClient })
    : createRequireAuth({ prismaClient });

  // ── GET /organization ─────────────────────────────────────────────────────
  router.get('/', requireAuth, requirePermission('org:read'), async (req, res, next) => {
    try {
      let org = await prismaClient.organization.findFirst({
        where: { tenantId: req.tenantId },
      });

      // Auto-provision org record if tenant has none yet
      if (!org) {
        const tenant = await prismaClient.tenant.findUnique({
          where: { id: req.tenantId },
          select: { name: true },
        });
        org = await prismaClient.organization.create({
          data: {
            tenantId: req.tenantId,
            name: tenant?.name ?? 'My Organization',
          },
        });
      }

      req.audit({ action: 'org.viewed', resourceType: 'Organization', resourceId: org.id });
      return res.json(org);
    } catch (err) {
      return next(err);
    }
  });

  // ── PUT /organization ─────────────────────────────────────────────────────
  router.put('/', requireAuth, requirePermission('org:update'), async (req, res, next) => {
    const { name, address, phone, email, logoUrl } = req.body;

    const data = {};
    if (name    != null) data.name    = name;
    if (address != null) data.address = address;
    if (phone   != null) data.phone   = phone;
    if (email   != null) data.email   = email;
    if (logoUrl != null) data.logoUrl = logoUrl;

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'bad_request', message: 'No updatable fields provided' });
    }

    try {
      let org = await prismaClient.organization.findFirst({
        where: { tenantId: req.tenantId },
      });

      if (!org) {
        // Auto-create if not yet provisioned
        org = await prismaClient.organization.create({
          data: { tenantId: req.tenantId, name: data.name ?? 'My Organization', ...data },
        });
      } else {
        org = await prismaClient.organization.update({
          where: { id: org.id },
          data,
        });
      }

      req.audit({ action: 'org.updated', resourceType: 'Organization', resourceId: org.id, metadata: Object.keys(data) });
      return res.json(org);
    } catch (err) {
      return next(err);
    }
  });

  // ── GET /organization/settings ────────────────────────────────────────────
  router.get('/settings', requireAuth, requirePermission('org:read'), async (req, res, next) => {
    try {
      let org = await prismaClient.organization.findFirst({
        where: { tenantId: req.tenantId },
        select: { id: true, patientSelfUploadEnabled: true, brandColor: true, logoUrl: true },
      });

      if (!org) {
        const tenant = await prismaClient.tenant.findUnique({
          where: { id: req.tenantId },
          select: { name: true },
        });
        org = await prismaClient.organization.create({
          data: { tenantId: req.tenantId, name: tenant?.name ?? 'My Organization' },
        });
      }

      req.audit({ action: 'org.settings.viewed', resourceType: 'Organization', resourceId: org.id });
      return res.json({
        patientSelfUploadEnabled: org.patientSelfUploadEnabled,
        brandColor: org.brandColor,
        logoUrl: org.logoUrl,
      });
    } catch (err) {
      return next(err);
    }
  });

  // ── PUT /organization/settings ────────────────────────────────────────────
  router.put('/settings', requireAuth, requirePermission('org:update'), async (req, res, next) => {
    const { patientSelfUploadEnabled, brandColor, logoUrl } = req.body;

    const data = {};
    if (patientSelfUploadEnabled != null) data.patientSelfUploadEnabled = Boolean(patientSelfUploadEnabled);
    if (brandColor               != null) data.brandColor               = brandColor;
    if (logoUrl                  != null) data.logoUrl                  = logoUrl;

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'bad_request', message: 'No updatable settings provided' });
    }

    try {
      let org = await prismaClient.organization.findFirst({
        where: { tenantId: req.tenantId },
      });

      if (!org) {
        const tenant = await prismaClient.tenant.findUnique({
          where: { id: req.tenantId },
          select: { name: true },
        });
        org = await prismaClient.organization.create({
          data: { tenantId: req.tenantId, name: tenant?.name ?? 'My Organization', ...data },
        });
      } else {
        org = await prismaClient.organization.update({
          where: { id: org.id },
          data,
        });
      }

      req.audit({ action: 'org.settings.updated', resourceType: 'Organization', resourceId: org.id, metadata: Object.keys(data) });
      return res.json({
        patientSelfUploadEnabled: org.patientSelfUploadEnabled,
        brandColor: org.brandColor,
        logoUrl: org.logoUrl,
      });
    } catch (err) {
      return next(err);
    }
  });

  return router;
}

export default createOrganizationRouter();
