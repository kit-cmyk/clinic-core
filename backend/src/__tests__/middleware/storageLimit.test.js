import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { enforceStorageLimit } from '../../middleware/storageLimit.js';

// ── Helpers ────────────────────────────────────────────────────────────────────

const ONE_GB     = BigInt(1073741824);
const ONE_GB_NUM = Number(ONE_GB); // file metadata sizes are plain Numbers

/**
 * Build a minimal Express app with the storage limit middleware applied
 * before a stub upload endpoint.
 */
function buildApp({
  role        = 'ORG_ADMIN',
  tenantId    = 'tenant-1',
  usedBytes   = 0,
  limitBytes  = ONE_GB,
  contentLength,
} = {}) {
  // Mock Prisma client
  const prismaClient = {
    tenant: {
      findUnique: jest.fn().mockResolvedValue({ storageLimitBytes: limitBytes }),
    },
  };

  // Mock storage service — returns files summing to `usedBytes`
  const storageService = {
    list: jest.fn().mockResolvedValue({ data: [], error: null }),
    _usedBytes: usedBytes,
  };

  // Override getTenantStorageUsed by injecting a pre-calculated value via the svc.list mock
  // Since the service returns empty data, usedBytes from our mock is 0 unless we simulate files
  // For tests needing non-zero usage, we mock at the middleware level by injecting storageService
  // with a `list` that returns fake file metadata.
  if (usedBytes > 0) {
    // metadata.size must be a plain Number (not BigInt) to avoid type errors in the service
    storageService.list = jest.fn().mockResolvedValue({
      data: [{ id: 'f1', name: 'report.pdf', metadata: { size: Number(usedBytes) } }],
      error: null,
    });
  }

  const middleware = enforceStorageLimit({ prismaClient, storageService });

  const app = express();
  app.use(express.json());

  // Simulate an authenticated request
  app.use((req, _res, next) => {
    req.user     = { id: 'u1', role };
    req.tenantId = tenantId;
    if (contentLength != null) {
      req.headers['content-length'] = String(contentLength);
    }
    next();
  });

  app.post('/upload', middleware, (_req, res) => {
    res.status(200).json({ ok: true });
  });

  return app;
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('enforceStorageLimit middleware', () => {
  describe('under the limit', () => {
    it('allows upload when tenant is within storage limit', async () => {
      const res = await request(buildApp({
        usedBytes:     500 * 1024 * 1024,  // 500 MB used
        limitBytes:    ONE_GB,              // 1 GB limit
        contentLength: 10 * 1024 * 1024,   // 10 MB incoming
      })).post('/upload').send({});
      expect(res.status).toBe(200);
    });

    it('allows upload when no Content-Length is provided (unknown size)', async () => {
      const res = await request(buildApp({
        usedBytes:  900 * 1024 * 1024,
        limitBytes: ONE_GB,
        // no contentLength
      })).post('/upload').send({});
      expect(res.status).toBe(200);
    });
  });

  describe('over the limit', () => {
    it('returns 413 when upload would exceed storage limit', async () => {
      const res = await request(buildApp({
        usedBytes:     1000 * 1024 * 1024,  // 1000 MB used (just under 1 GB)
        limitBytes:    ONE_GB,              // 1 GB limit
        contentLength: 100 * 1024 * 1024,  // 100 MB incoming → would exceed
      })).post('/upload').send({});
      expect(res.status).toBe(413);
      expect(res.body).toHaveProperty('error', 'storage_limit_exceeded');
      expect(res.body).toHaveProperty('usedBytes');
      expect(res.body).toHaveProperty('limitBytes');
    });

    it('includes human-readable message in 413 response', async () => {
      const res = await request(buildApp({
        usedBytes:     ONE_GB_NUM,         // at limit (as Number for metadata.size)
        limitBytes:    ONE_GB,
        contentLength: 1024,               // any size would exceed
      })).post('/upload').send({});
      expect(res.status).toBe(413);
      expect(res.body.message).toMatch(/Storage limit exceeded/i);
      expect(res.body.message).toMatch(/MB/);
    });
  });

  describe('super admin bypass', () => {
    it('allows SUPER_ADMIN to upload even when over limit', async () => {
      const res = await request(buildApp({
        role:          'SUPER_ADMIN',
        usedBytes:     ONE_GB_NUM,          // at limit (Number for metadata.size)
        limitBytes:    ONE_GB,
        contentLength: 500 * 1024 * 1024,  // would exceed for regular users
      })).post('/upload').send({});
      expect(res.status).toBe(200);
    });
  });

  describe('no tenant context', () => {
    it('skips enforcement when tenantId is missing', async () => {
      const middleware = enforceStorageLimit({
        prismaClient: { tenant: { findUnique: jest.fn() } },
        storageService: { list: jest.fn() },
      });

      const app = express();
      app.use(express.json());
      app.use((req, _res, next) => {
        req.user = { id: 'u1', role: 'ORG_ADMIN' };
        // No tenantId set
        next();
      });
      app.post('/upload', middleware, (_req, res) => res.status(200).json({ ok: true }));

      const res = await request(app).post('/upload').send({});
      expect(res.status).toBe(200);
    });
  });

  describe('storage service failure', () => {
    it('allows upload when storage service throws (fail open)', async () => {
      const brokenStorage = { list: jest.fn().mockRejectedValue(new Error('Supabase unavailable')) };
      const prismaClient = {
        tenant: { findUnique: jest.fn().mockResolvedValue({ storageLimitBytes: ONE_GB }) },
      };
      const middleware = enforceStorageLimit({ prismaClient, storageService: brokenStorage });

      const app = express();
      app.use(express.json());
      app.use((req, _res, next) => {
        req.user = { id: 'u1', role: 'ORG_ADMIN' };
        req.tenantId = 'tenant-1';
        req.headers['content-length'] = String(500 * 1024 * 1024);
        next();
      });
      app.post('/upload', middleware, (_req, res) => res.status(200).json({ ok: true }));

      const res = await request(app).post('/upload').send({});
      // Should pass through — enforcement failure must not block users
      expect(res.status).toBe(200);
    });
  });
});
