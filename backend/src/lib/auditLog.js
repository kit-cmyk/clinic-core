import { prisma } from '../models/prisma.js';
import { logger } from './logger.js';

/**
 * Write an audit log entry. Fire-and-forget — never throws, so a logging
 * failure never blocks the actual request.
 *
 * @param {object} params
 * @param {string|null}  params.tenantId    - null for platform-level actions
 * @param {string|null}  params.actorId     - User.id; null for unauthenticated events
 * @param {string|null}  params.actorRole   - Role enum value at time of action
 * @param {string}       params.action      - Dot-namespaced action, e.g. "auth.login"
 * @param {string|null}  [params.resourceType] - Model name, e.g. "Patient"
 * @param {string|null}  [params.resourceId]   - Record ID
 * @param {object|null}  [params.metadata]     - Any extra structured context
 * @param {string|null}  [params.ip]           - Client IP address
 * @param {object}       [params.prismaClient] - Injectable for tests
 */
export async function writeAuditLog({
  tenantId = null,
  actorId = null,
  actorRole = null,
  action,
  resourceType = null,
  resourceId = null,
  metadata = null,
  ip = null,
  prismaClient = prisma,
}) {
  try {
    await prismaClient.auditLog.create({
      data: { tenantId, actorId, actorRole, action, resourceType, resourceId, metadata, ip },
    });
  } catch (err) {
    // Never let audit logging crash the request
    logger.error({ err, action }, '[audit] failed to write audit log');
  }
}

/**
 * Express middleware that injects a pre-bound audit helper onto req.
 * Usage: req.audit({ action: 'patient.viewed', resourceId: id })
 */
export function auditMiddleware(req, _res, next) {
  const actor = req.user ?? null;
  req.audit = (params) =>
    writeAuditLog({
      tenantId:  actor?.tenantId ?? null,
      actorId:   actor?.id       ?? null,
      actorRole: actor?.role     ?? null,
      ip:        req.ip,
      ...params,
    });
  next();
}
