import { jest } from '@jest/globals';
import { createStorageService } from '../../services/storage.js';

const TEST_BUCKET = 'test-cliniccore-files';
const TENANT_A = 'tenant-uuid-a';
const TENANT_B = 'tenant-uuid-b';

function buildMockStorageOps(overrides = {}) {
  return {
    upload: jest.fn().mockResolvedValue({ data: { path: 'uploaded/path' }, error: null }),
    createSignedUrl: jest.fn().mockResolvedValue({ data: { signedUrl: 'https://signed.url/file' }, error: null }),
    remove: jest.fn().mockResolvedValue({ data: [{ name: 'file.pdf' }], error: null }),
    list: jest.fn().mockResolvedValue({ data: [{ name: 'report.pdf' }], error: null }),
    ...overrides,
  };
}

function buildMockAdmin(ops = buildMockStorageOps()) {
  const fromFn = jest.fn().mockReturnValue(ops);
  return { storage: { from: fromFn }, _ops: ops, _fromFn: fromFn };
}

// ── upload ─────────────────────────────────────────────────────────────────

describe('storageService.upload', () => {
  it('calls storage.from with the configured bucket', async () => {
    const { _fromFn, ...admin } = buildMockAdmin();
    const svc = createStorageService({ supabaseAdmin: admin, bucket: TEST_BUCKET });
    await svc.upload(TENANT_A, 'lab-results', 'report.pdf', Buffer.from('data'));
    expect(_fromFn).toHaveBeenCalledWith(TEST_BUCKET);
  });

  it('scopes path under tenantId prefix', async () => {
    const ops = buildMockStorageOps();
    const svc = createStorageService({ supabaseAdmin: { storage: { from: () => ops } }, bucket: TEST_BUCKET });
    await svc.upload(TENANT_A, 'lab-results', 'report.pdf', Buffer.from('data'));
    expect(ops.upload).toHaveBeenCalledWith(
      `${TENANT_A}/lab-results/report.pdf`,
      expect.anything(),
      expect.anything(),
    );
  });

  it('tenant A path never matches tenant B prefix', async () => {
    const ops = buildMockStorageOps();
    const svc = createStorageService({ supabaseAdmin: { storage: { from: () => ops } }, bucket: TEST_BUCKET });
    await svc.upload(TENANT_B, 'lab-results', 'secret.pdf', Buffer.from('data'));
    const [calledPath] = ops.upload.mock.calls[0];
    expect(calledPath.startsWith(TENANT_A)).toBe(false);
    expect(calledPath.startsWith(TENANT_B)).toBe(true);
  });

  it('passes options to the underlying upload call', async () => {
    const ops = buildMockStorageOps();
    const svc = createStorageService({ supabaseAdmin: { storage: { from: () => ops } }, bucket: TEST_BUCKET });
    const options = { contentType: 'application/pdf', upsert: false };
    await svc.upload(TENANT_A, 'prescriptions', 'rx.pdf', Buffer.from('rx'), options);
    expect(ops.upload).toHaveBeenCalledWith(expect.any(String), expect.anything(), options);
  });
});

// ── getSignedUrl ───────────────────────────────────────────────────────────

describe('storageService.getSignedUrl', () => {
  it('scopes signed URL request under tenantId prefix', async () => {
    const ops = buildMockStorageOps();
    const svc = createStorageService({ supabaseAdmin: { storage: { from: () => ops } }, bucket: TEST_BUCKET });
    await svc.getSignedUrl(TENANT_A, 'lab-results/report.pdf');
    expect(ops.createSignedUrl).toHaveBeenCalledWith(`${TENANT_A}/lab-results/report.pdf`, 3600);
  });

  it('uses custom expiry when provided', async () => {
    const ops = buildMockStorageOps();
    const svc = createStorageService({ supabaseAdmin: { storage: { from: () => ops } }, bucket: TEST_BUCKET });
    await svc.getSignedUrl(TENANT_A, 'avatars/photo.jpg', 300);
    expect(ops.createSignedUrl).toHaveBeenCalledWith(`${TENANT_A}/avatars/photo.jpg`, 300);
  });

  it('tenant A cannot request a signed URL scoped to tenant B', async () => {
    const ops = buildMockStorageOps();
    const svc = createStorageService({ supabaseAdmin: { storage: { from: () => ops } }, bucket: TEST_BUCKET });
    await svc.getSignedUrl(TENANT_B, 'lab-results/secret.pdf');
    const [calledPath] = ops.createSignedUrl.mock.calls[0];
    expect(calledPath.startsWith(TENANT_A)).toBe(false);
  });
});

// ── deleteFile ─────────────────────────────────────────────────────────────

describe('storageService.deleteFile', () => {
  it('scopes delete under tenantId prefix', async () => {
    const ops = buildMockStorageOps();
    const svc = createStorageService({ supabaseAdmin: { storage: { from: () => ops } }, bucket: TEST_BUCKET });
    await svc.deleteFile(TENANT_A, 'lab-results/report.pdf');
    expect(ops.remove).toHaveBeenCalledWith([`${TENANT_A}/lab-results/report.pdf`]);
  });

  it('deletes as an array (Supabase bulk-delete format)', async () => {
    const ops = buildMockStorageOps();
    const svc = createStorageService({ supabaseAdmin: { storage: { from: () => ops } }, bucket: TEST_BUCKET });
    await svc.deleteFile(TENANT_A, 'prescriptions/rx.pdf');
    const [paths] = ops.remove.mock.calls[0];
    expect(Array.isArray(paths)).toBe(true);
    expect(paths).toHaveLength(1);
  });
});

// ── list ───────────────────────────────────────────────────────────────────

describe('storageService.list', () => {
  it('lists with tenantId/category prefix when category is provided', async () => {
    const ops = buildMockStorageOps();
    const svc = createStorageService({ supabaseAdmin: { storage: { from: () => ops } }, bucket: TEST_BUCKET });
    await svc.list(TENANT_A, 'lab-results');
    expect(ops.list).toHaveBeenCalledWith(`${TENANT_A}/lab-results`);
  });

  it('lists with tenantId-only prefix when no category is provided', async () => {
    const ops = buildMockStorageOps();
    const svc = createStorageService({ supabaseAdmin: { storage: { from: () => ops } }, bucket: TEST_BUCKET });
    await svc.list(TENANT_A);
    expect(ops.list).toHaveBeenCalledWith(TENANT_A);
  });

  it('tenant A list prefix never starts with tenant B id', async () => {
    const ops = buildMockStorageOps();
    const svc = createStorageService({ supabaseAdmin: { storage: { from: () => ops } }, bucket: TEST_BUCKET });
    await svc.list(TENANT_A, 'lab-results');
    const [prefix] = ops.list.mock.calls[0];
    expect(prefix.startsWith(TENANT_B)).toBe(false);
  });
});
