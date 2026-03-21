/**
 * Provisioning pipeline service (CC-122).
 * Orchestrates the 4-step tenant provisioning workflow:
 *   1. DB_RECORD    — create the Tenant row
 *   2. ROLES_SEED   — placeholder (roles derived from Role enum, no seeding needed yet)
 *   3. STORAGE_SETUP — placeholder (Supabase storage prefix)
 *   4. WELCOME_EMAIL — placeholder (email service)
 *
 * Each step updates the corresponding ProvisioningLog row.
 * If a step fails, it records the error and stops the pipeline so the caller
 * can surface it and allow a retry.
 */
export function createProvisioningService({ prismaClient }) {
  const STEPS = ['DB_RECORD', 'ROLES_SEED', 'STORAGE_SETUP', 'WELCOME_EMAIL'];

  /**
   * Initialise ProvisioningLog rows for a TenantRequest.
   * Safe to call multiple times — uses upsert.
   */
  async function initLogs(tenantRequestId) {
    for (const step of STEPS) {
      await prismaClient.provisioningLog.upsert({
        where: { tenantRequestId_step: { tenantRequestId, step } },
        create: { tenantRequestId, step, status: 'PENDING' },
        update: {},
      });
    }
  }

  /** Mark a step as RUNNING. */
  async function markRunning(tenantRequestId, step) {
    return prismaClient.provisioningLog.update({
      where: { tenantRequestId_step: { tenantRequestId, step } },
      data: { status: 'RUNNING', errorMessage: null },
    });
  }

  /** Mark a step as DONE. */
  async function markDone(tenantRequestId, step, extra = {}) {
    return prismaClient.provisioningLog.update({
      where: { tenantRequestId_step: { tenantRequestId, step } },
      data: { status: 'DONE', completedAt: new Date(), ...extra },
    });
  }

  /** Mark a step as FAILED and store error. */
  async function markFailed(tenantRequestId, step, errorMessage) {
    return prismaClient.provisioningLog.update({
      where: { tenantRequestId_step: { tenantRequestId, step } },
      data: { status: 'FAILED', errorMessage },
    });
  }

  /**
   * Run the full pipeline for an approved TenantRequest.
   * Skips steps that are already DONE (idempotent — supports retry).
   * Returns the final list of ProvisioningLog rows.
   */
  async function run(tenantRequestId) {
    const request = await prismaClient.tenantRequest.findUnique({
      where: { id: tenantRequestId },
      include: { provisioningLogs: true },
    });
    if (!request) throw new Error('TenantRequest not found');

    await initLogs(tenantRequestId);

    const logMap = Object.fromEntries(
      request.provisioningLogs.map((l) => [l.step, l])
    );

    // Reload after upsert
    const freshLogs = await prismaClient.provisioningLog.findMany({
      where: { tenantRequestId },
    });
    const logs = Object.fromEntries(freshLogs.map((l) => [l.step, l]));

    let tenantId = logs['DB_RECORD']?.provisionedTenantId ?? null;

    // ── Step 1: DB_RECORD ────────────────────────────────────────────────────
    if (logs['DB_RECORD']?.status !== 'DONE') {
      try {
        await markRunning(tenantRequestId, 'DB_RECORD');
        const slug = request.orgName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
          .substring(0, 50);
        const uniqueSlug = `${slug}-${tenantRequestId.substring(0, 8)}`;
        const tenant = await prismaClient.tenant.create({
          data: {
            name: request.orgName,
            slug: uniqueSlug,
            plan: request.planRequested,
          },
        });
        tenantId = tenant.id;
        await markDone(tenantRequestId, 'DB_RECORD', { provisionedTenantId: tenantId });
      } catch (err) {
        await markFailed(tenantRequestId, 'DB_RECORD', err.message);
        return prismaClient.provisioningLog.findMany({ where: { tenantRequestId } });
      }
    }

    // ── Step 2: ROLES_SEED ───────────────────────────────────────────────────
    if (logs['ROLES_SEED']?.status !== 'DONE') {
      try {
        await markRunning(tenantRequestId, 'ROLES_SEED');
        // Role values come from the Role enum — no DB seeding required
        await markDone(tenantRequestId, 'ROLES_SEED');
      } catch (err) {
        await markFailed(tenantRequestId, 'ROLES_SEED', err.message);
        return prismaClient.provisioningLog.findMany({ where: { tenantRequestId } });
      }
    }

    // ── Step 3: STORAGE_SETUP ────────────────────────────────────────────────
    if (logs['STORAGE_SETUP']?.status !== 'DONE') {
      try {
        await markRunning(tenantRequestId, 'STORAGE_SETUP');
        // TODO: register Supabase storage prefix for tenantId
        await markDone(tenantRequestId, 'STORAGE_SETUP');
      } catch (err) {
        await markFailed(tenantRequestId, 'STORAGE_SETUP', err.message);
        return prismaClient.provisioningLog.findMany({ where: { tenantRequestId } });
      }
    }

    // ── Step 4: WELCOME_EMAIL ────────────────────────────────────────────────
    if (logs['WELCOME_EMAIL']?.status !== 'DONE') {
      try {
        await markRunning(tenantRequestId, 'WELCOME_EMAIL');
        // TODO: send onboarding email to request.contactEmail
        await markDone(tenantRequestId, 'WELCOME_EMAIL');
      } catch (err) {
        await markFailed(tenantRequestId, 'WELCOME_EMAIL', err.message);
        return prismaClient.provisioningLog.findMany({ where: { tenantRequestId } });
      }
    }

    return prismaClient.provisioningLog.findMany({ where: { tenantRequestId } });
  }

  return { run, initLogs };
}
