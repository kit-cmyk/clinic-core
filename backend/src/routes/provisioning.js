import express from 'express';
import { createRequireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/auth.js';
import { prisma as defaultPrisma } from '../models/prisma.js';
import { createProvisioningService } from '../services/provisioning.js';

/**
 * Factory for /api/v1/provisioning — tenant provisioning pipeline (CC-122).
 * Kicks off and tracks the 4-step pipeline for approved TenantRequests.
 */
export function createProvisioningRouter({
  prismaClient = defaultPrisma,
  authMiddlewareFactory,
  provisioningServiceFactory,
} = {}) {
  const router = express.Router();
  const requireAuth = authMiddlewareFactory
    ? authMiddlewareFactory({ prismaClient })
    : createRequireAuth({ prismaClient });

  const provisioningService = provisioningServiceFactory
    ? provisioningServiceFactory({ prismaClient })
    : createProvisioningService({ prismaClient });

  // GET /provisioning/:tenantRequestId — get pipeline status
  router.get('/:tenantRequestId', requireAuth, requireRole('SUPER_ADMIN'), async (req, res, next) => {
    try {
      const { tenantRequestId } = req.params;
      const request = await prismaClient.tenantRequest.findUnique({
        where: { id: tenantRequestId },
        include: { provisioningLogs: { orderBy: { step: 'asc' } } },
      });
      if (!request) {
        return res.status(404).json({ error: 'not_found', message: 'TenantRequest not found' });
      }
      return res.json({ request, logs: request.provisioningLogs });
    } catch (err) {
      return next(err);
    }
  });

  // POST /provisioning/:tenantRequestId/start — kick off provisioning pipeline
  router.post('/:tenantRequestId/start', requireAuth, requireRole('SUPER_ADMIN'), async (req, res, next) => {
    try {
      const { tenantRequestId } = req.params;
      const request = await prismaClient.tenantRequest.findUnique({
        where: { id: tenantRequestId },
      });
      if (!request) {
        return res.status(404).json({ error: 'not_found', message: 'TenantRequest not found' });
      }
      if (request.status !== 'APPROVED') {
        return res.status(409).json({
          error: 'conflict',
          message: 'Provisioning can only be started for APPROVED requests',
        });
      }

      // Run pipeline (async — responds with final log state)
      const logs = await provisioningService.run(tenantRequestId);
      return res.json({ logs });
    } catch (err) {
      return next(err);
    }
  });

  // POST /provisioning/:tenantRequestId/retry/:step — retry a failed step
  router.post('/:tenantRequestId/retry/:step', requireAuth, requireRole('SUPER_ADMIN'), async (req, res, next) => {
    try {
      const { tenantRequestId, step } = req.params;

      const log = await prismaClient.provisioningLog.findUnique({
        where: { tenantRequestId_step: { tenantRequestId, step } },
      });
      if (!log) {
        return res.status(404).json({ error: 'not_found', message: 'Provisioning step not found' });
      }
      if (log.status !== 'FAILED') {
        return res.status(409).json({ error: 'conflict', message: 'Only FAILED steps can be retried' });
      }

      // Reset step to PENDING so the pipeline re-runs it
      await prismaClient.provisioningLog.update({
        where: { tenantRequestId_step: { tenantRequestId, step } },
        data: { status: 'PENDING', errorMessage: null },
      });

      const logs = await provisioningService.run(tenantRequestId);
      return res.json({ logs });
    } catch (err) {
      return next(err);
    }
  });

  return router;
}

export default createProvisioningRouter();
