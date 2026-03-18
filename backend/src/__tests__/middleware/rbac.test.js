import request from 'supertest';
import express from 'express';
import { requirePermission, PERMISSION_SCOPES } from '../../middleware/rbac.js';

const ALL_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'DOCTOR', 'NURSE', 'SECRETARY', 'PATIENT'];

/**
 * Build a minimal Express app that:
 *   1. Sets req.user from the x-role header (simulates requireAuth)
 *   2. Applies requirePermission(action)
 *   3. Returns 200 { ok: true } on success
 */
function buildApp(action) {
  const app = express();
  app.use(express.json());
  app.get('/test', (req, _res, next) => {
    const role = req.headers['x-role'];
    if (role) req.user = { id: 'user-1', tenantId: 'tenant-1', role };
    next();
  }, requirePermission(action), (_req, res) => res.json({ ok: true }));
  return app;
}

async function check(action, role) {
  return (await request(buildApp(action)).get('/test').set('x-role', role)).status;
}

// ── PERMISSION_SCOPES export ──────────────────────────────────────────────────

describe('PERMISSION_SCOPES', () => {
  it('PLATFORM contains only SUPER_ADMIN', () => {
    expect(PERMISSION_SCOPES.PLATFORM).toEqual(['SUPER_ADMIN']);
  });

  it('ORGANIZATION contains SUPER_ADMIN and ORG_ADMIN', () => {
    expect(PERMISSION_SCOPES.ORGANIZATION).toContain('SUPER_ADMIN');
    expect(PERMISSION_SCOPES.ORGANIZATION).toContain('ORG_ADMIN');
    expect(PERMISSION_SCOPES.ORGANIZATION).toHaveLength(2);
  });

  it('CLINICAL contains all staff roles but not PATIENT', () => {
    const { CLINICAL } = PERMISSION_SCOPES;
    expect(CLINICAL).toContain('SUPER_ADMIN');
    expect(CLINICAL).toContain('ORG_ADMIN');
    expect(CLINICAL).toContain('DOCTOR');
    expect(CLINICAL).toContain('NURSE');
    expect(CLINICAL).toContain('SECRETARY');
    expect(CLINICAL).not.toContain('PATIENT');
  });
});

// ── PLATFORM scope — plans:create (SUPER_ADMIN only) ─────────────────────────

describe('plans:create — PLATFORM scope', () => {
  it('allows SUPER_ADMIN', async () => expect(await check('plans:create', 'SUPER_ADMIN')).toBe(200));
  it('blocks ORG_ADMIN',   async () => expect(await check('plans:create', 'ORG_ADMIN')).toBe(403));
  it('blocks DOCTOR',      async () => expect(await check('plans:create', 'DOCTOR')).toBe(403));
  it('blocks NURSE',       async () => expect(await check('plans:create', 'NURSE')).toBe(403));
  it('blocks SECRETARY',   async () => expect(await check('plans:create', 'SECRETARY')).toBe(403));
  it('blocks PATIENT',     async () => expect(await check('plans:create', 'PATIENT')).toBe(403));
});

describe('tenants:delete — PLATFORM scope', () => {
  it('allows SUPER_ADMIN', async () => expect(await check('tenants:delete', 'SUPER_ADMIN')).toBe(200));
  it('blocks ORG_ADMIN',   async () => expect(await check('tenants:delete', 'ORG_ADMIN')).toBe(403));
  it('blocks PATIENT',     async () => expect(await check('tenants:delete', 'PATIENT')).toBe(403));
});

// ── ORGANIZATION scope — branches:create ─────────────────────────────────────

describe('branches:create — ORGANIZATION scope', () => {
  it('allows SUPER_ADMIN', async () => expect(await check('branches:create', 'SUPER_ADMIN')).toBe(200));
  it('allows ORG_ADMIN',   async () => expect(await check('branches:create', 'ORG_ADMIN')).toBe(200));
  it('blocks DOCTOR',      async () => expect(await check('branches:create', 'DOCTOR')).toBe(403));
  it('blocks NURSE',       async () => expect(await check('branches:create', 'NURSE')).toBe(403));
  it('blocks SECRETARY',   async () => expect(await check('branches:create', 'SECRETARY')).toBe(403));
  it('blocks PATIENT',     async () => expect(await check('branches:create', 'PATIENT')).toBe(403));
});

describe('staff:invite — ORGANIZATION scope', () => {
  it('allows SUPER_ADMIN', async () => expect(await check('staff:invite', 'SUPER_ADMIN')).toBe(200));
  it('allows ORG_ADMIN',   async () => expect(await check('staff:invite', 'ORG_ADMIN')).toBe(200));
  it('blocks DOCTOR',      async () => expect(await check('staff:invite', 'DOCTOR')).toBe(403));
  it('blocks PATIENT',     async () => expect(await check('staff:invite', 'PATIENT')).toBe(403));
});

// ── CLINICAL scope — patients:read ────────────────────────────────────────────

describe('patients:read — CLINICAL scope (excludes PATIENT)', () => {
  it('allows SUPER_ADMIN', async () => expect(await check('patients:read', 'SUPER_ADMIN')).toBe(200));
  it('allows ORG_ADMIN',   async () => expect(await check('patients:read', 'ORG_ADMIN')).toBe(200));
  it('allows DOCTOR',      async () => expect(await check('patients:read', 'DOCTOR')).toBe(200));
  it('allows NURSE',       async () => expect(await check('patients:read', 'NURSE')).toBe(200));
  it('allows SECRETARY',   async () => expect(await check('patients:read', 'SECRETARY')).toBe(200));
  it('blocks PATIENT',     async () => expect(await check('patients:read', 'PATIENT')).toBe(403));
});

// ── appointments:read — all 6 roles ──────────────────────────────────────────

describe('appointments:read — all roles including PATIENT', () => {
  for (const role of ALL_ROLES) {
    it(`allows ${role}`, async () => expect(await check('appointments:read', role)).toBe(200));
  }
});

// ── records:create — DOCTOR + NURSE + ORGANIZATION only ──────────────────────

describe('records:create', () => {
  it('allows SUPER_ADMIN', async () => expect(await check('records:create', 'SUPER_ADMIN')).toBe(200));
  it('allows ORG_ADMIN',   async () => expect(await check('records:create', 'ORG_ADMIN')).toBe(200));
  it('allows DOCTOR',      async () => expect(await check('records:create', 'DOCTOR')).toBe(200));
  it('allows NURSE',       async () => expect(await check('records:create', 'NURSE')).toBe(200));
  it('blocks SECRETARY',   async () => expect(await check('records:create', 'SECRETARY')).toBe(403));
  it('blocks PATIENT',     async () => expect(await check('records:create', 'PATIENT')).toBe(403));
});

// ── prescriptions:create — DOCTOR + SUPER_ADMIN only ─────────────────────────

describe('prescriptions:create — DOCTOR only (+ SUPER_ADMIN)', () => {
  it('allows SUPER_ADMIN', async () => expect(await check('prescriptions:create', 'SUPER_ADMIN')).toBe(200));
  it('allows DOCTOR',      async () => expect(await check('prescriptions:create', 'DOCTOR')).toBe(200));
  it('blocks ORG_ADMIN',   async () => expect(await check('prescriptions:create', 'ORG_ADMIN')).toBe(403));
  it('blocks NURSE',       async () => expect(await check('prescriptions:create', 'NURSE')).toBe(403));
  it('blocks SECRETARY',   async () => expect(await check('prescriptions:create', 'SECRETARY')).toBe(403));
  it('blocks PATIENT',     async () => expect(await check('prescriptions:create', 'PATIENT')).toBe(403));
});

// ── prescriptions:read — PATIENT can view their own ──────────────────────────

describe('prescriptions:read', () => {
  it('allows DOCTOR',      async () => expect(await check('prescriptions:read', 'DOCTOR')).toBe(200));
  it('allows NURSE',       async () => expect(await check('prescriptions:read', 'NURSE')).toBe(200));
  it('allows PATIENT',     async () => expect(await check('prescriptions:read', 'PATIENT')).toBe(200));
  it('blocks SECRETARY',   async () => expect(await check('prescriptions:read', 'SECRETARY')).toBe(403));
});

// ── Edge cases ────────────────────────────────────────────────────────────────

describe('requirePermission — edge cases', () => {
  it('returns 403 for unknown permission key (fail closed)', async () => {
    expect(await check('unknown:action', 'SUPER_ADMIN')).toBe(403);
  });

  it('returns 403 for partial key match (no prefix guessing)', async () => {
    expect(await check('plans', 'SUPER_ADMIN')).toBe(403);
  });

  it('returns 401 when req.user is absent (used without requireAuth)', async () => {
    const app = express();
    app.use(express.json());
    app.get('/test', requirePermission('plans:create'), (_req, res) => res.json({ ok: true }));
    const res = await request(app).get('/test');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('unauthorized');
  });
});
