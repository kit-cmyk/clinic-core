import { createStorageService } from '../services/storage.js';
import { prisma as defaultPrisma } from '../models/prisma.js';
import { logger } from '../lib/logger.js';

/**
 * Storage limit enforcement middleware (CC-30).
 *
 * Blocks file uploads when the tenant's storage usage would exceed their limit.
 * Returns HTTP 413 with a descriptive error when the limit is exceeded.
 *
 * Super admins bypass the check entirely.
 *
 * Usage — apply before the upload handler on any route that accepts files:
 *   router.post('/upload', requireAuth, enforceStorageLimit(), multerMiddleware, handler)
 *
 * Relies on the Content-Length header to know the incoming file size.
 * If Content-Length is absent the check is skipped (unknown size).
 *
 * @param {object} [options]
 * @param {object} [options.prismaClient]       - Injectable Prisma client
 * @param {object} [options.storageService]     - Injectable storage service
 */
export function enforceStorageLimit({
  prismaClient = defaultPrisma,
  storageService = null,
} = {}) {
  return async (req, res, next) => {
    try {
      // Super admins bypass storage enforcement
      if (req.user?.role === 'SUPER_ADMIN') return next();

      const tenantId = req.tenantId;
      if (!tenantId) return next(); // no tenant context → skip

      // Determine incoming file size from Content-Length header
      const incomingBytes = req.headers['content-length']
        ? parseInt(req.headers['content-length'], 10)
        : 0;

      // Load tenant storage limit
      const tenant = await prismaClient.tenant.findUnique({
        where: { id: tenantId },
        select: { storageLimitBytes: true },
      });

      if (!tenant) return next();

      const limitBytes = tenant.storageLimitBytes;

      // Calculate current usage from Supabase storage
      const svc = storageService ?? createStorageService();
      const usedBytes = await getTenantStorageUsed(svc, tenantId);

      if (usedBytes + incomingBytes > limitBytes) {
        const limitMb = (Number(limitBytes) / (1024 * 1024)).toFixed(0);
        const usedMb  = (usedBytes / (1024 * 1024)).toFixed(1);
        return res.status(413).json({
          error:   'storage_limit_exceeded',
          message: `Storage limit exceeded. Used: ${usedMb} MB / Limit: ${limitMb} MB.`,
          usedBytes:  usedBytes.toString(),
          limitBytes: limitBytes.toString(),
        });
      }

      // Attach usage to req so handlers can log it without re-querying
      req.storageUsedBytes = usedBytes;
      return next();
    } catch (err) {
      // Storage check failure should not block the upload — log and continue
      logger.error({ err }, '[storageLimit] check failed, skipping enforcement');
      return next();
    }
  };
}

/**
 * Sum the sizes of all files stored under a tenant's prefix in Supabase Storage.
 * Recursively walks through all categories (top-level folders).
 *
 * @param {object} svc      - storage service instance
 * @param {string} tenantId
 * @returns {Promise<number>} total bytes used
 */
export async function getTenantStorageUsed(svc, tenantId) {
  try {
    const { data: categories, error } = await svc.list(tenantId, '');
    if (error || !categories) return 0;

    let total = 0;

    for (const item of categories) {
      if (item.id === null) {
        // It's a folder — list its contents
        const { data: files, error: filesErr } = await svc.list(tenantId, item.name);
        if (!filesErr && files) {
          for (const file of files) {
            total += file.metadata?.size ?? 0;
          }
        }
      } else {
        // It's a file directly under the tenant prefix
        total += item.metadata?.size ?? 0;
      }
    }

    return total;
  } catch {
    return 0;
  }
}
