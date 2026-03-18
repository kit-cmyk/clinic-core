/**
 * ClinicCore RBAC — Permission Scopes & Matrix
 *
 * Three access tiers (scopes) map to Prisma Role enum values:
 *
 *   PLATFORM     — cross-tenant platform operations (SUPER_ADMIN only)
 *   ORGANIZATION — tenant-scoped admin operations   (SUPER_ADMIN + ORG_ADMIN)
 *   CLINICAL     — patient-care operations          (all staff; excludes PATIENT)
 *
 * PATIENT role is deliberately excluded from CLINICAL scope and granted access
 * only to specific read actions (appointments:read, prescriptions:read, invoices:read).
 *
 * Design rules:
 *   - SUPER_ADMIN is always in scope (platform-wide access, no exceptions)
 *   - Unknown permission keys are NOT present — fail closed (403) if key missing
 *   - More permissive actions (read) include more roles than write/delete
 */

export const PERMISSION_SCOPES = {
  /** Cross-tenant platform management — SUPER_ADMIN only */
  PLATFORM: ['SUPER_ADMIN'],

  /** Tenant-scoped admin — SUPER_ADMIN + ORG_ADMIN */
  ORGANIZATION: ['SUPER_ADMIN', 'ORG_ADMIN'],

  /** Patient-care operations — all staff roles (not PATIENT) */
  CLINICAL: ['SUPER_ADMIN', 'ORG_ADMIN', 'DOCTOR', 'NURSE', 'SECRETARY'],
};

const { PLATFORM, ORGANIZATION, CLINICAL } = PERMISSION_SCOPES;

/**
 * Permission matrix — maps 'resource:action' → allowed Role enum values[].
 *
 * Usage in routes:
 *   router.get('/plans', requireAuth, requirePermission('plans:read'), handler)
 */
export const PERMISSIONS = {

  // ── Platform scope (SUPER_ADMIN only) ──────────────────────────────────────
  'tenants:read':   PLATFORM,
  'tenants:create': PLATFORM,
  'tenants:update': PLATFORM,
  'tenants:delete': PLATFORM,

  'plans:read':     PLATFORM,
  'plans:create':   PLATFORM,
  'plans:update':   PLATFORM,
  'plans:delete':   PLATFORM,

  // ── Organization scope (SUPER_ADMIN + ORG_ADMIN) ───────────────────────────
  'org:read':           ORGANIZATION,
  'org:update':         ORGANIZATION,

  'branches:read':      ORGANIZATION,
  'branches:create':    ORGANIZATION,
  'branches:update':    ORGANIZATION,
  'branches:delete':    ORGANIZATION,

  'staff:read':         ORGANIZATION,
  'staff:invite':       ORGANIZATION,
  'staff:update':       ORGANIZATION,
  'staff:deactivate':   ORGANIZATION,

  'invitations:create': ORGANIZATION,

  // ── Clinical scope — all staff ─────────────────────────────────────────────

  // Patients — SECRETARY can register patients; PATIENT cannot read other patients
  'patients:read':   CLINICAL,
  'patients:create': [...ORGANIZATION, 'SECRETARY'],   // ['SUPER_ADMIN','ORG_ADMIN','SECRETARY']
  'patients:update': [...ORGANIZATION, 'SECRETARY'],

  // Appointments — PATIENT may view their own; staff create/update/cancel
  'appointments:read':   [...CLINICAL, 'PATIENT'],     // all 6 roles
  'appointments:create': CLINICAL,
  'appointments:update': CLINICAL,
  'appointments:cancel': CLINICAL,

  // Clinical records — clinical staff only (not SECRETARY)
  'records:read':   [...ORGANIZATION, 'DOCTOR', 'NURSE'],
  'records:create': [...ORGANIZATION, 'DOCTOR', 'NURSE'],

  // Prescriptions — only DOCTOR writes; DOCTOR + NURSE + PATIENT read
  'prescriptions:create': [...PLATFORM, 'DOCTOR'],           // ['SUPER_ADMIN','DOCTOR']
  'prescriptions:read':   [...ORGANIZATION, 'DOCTOR', 'NURSE', 'PATIENT'],

  // Lab results — DOCTOR + NURSE manage; ORGANIZATION can view
  'lab:read':    [...ORGANIZATION, 'DOCTOR', 'NURSE'],
  'lab:create':  [...PLATFORM, 'DOCTOR', 'NURSE'],
  'lab:publish': [...PLATFORM, 'DOCTOR'],

  // Invoices — admin + SECRETARY manage; PATIENT views own
  'invoices:read':   [...ORGANIZATION, 'SECRETARY', 'PATIENT'],
  'invoices:create': [...ORGANIZATION, 'SECRETARY'],
  'invoices:update': [...ORGANIZATION, 'SECRETARY'],
};
