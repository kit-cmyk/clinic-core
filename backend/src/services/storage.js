import { getSupabaseAdmin } from '../lib/supabase.js';
import { env } from '../config/env.js';

/**
 * Factory — creates a Supabase Storage service with per-tenant prefix isolation.
 *
 * All file paths are namespaced under {tenantId}/{category}/{filename} so that
 * one tenant can never read, write, or delete another tenant's files.
 *
 * @param {object} [options]
 * @param {object} [options.supabaseAdmin] - Injectable admin client (for testing)
 * @param {string} [options.bucket]        - Storage bucket name (for testing)
 */
export function createStorageService({
  supabaseAdmin = getSupabaseAdmin(),
  bucket = env.SUPABASE_STORAGE_BUCKET,
} = {}) {
  /** Build the full tenant-scoped path: {tenantId}/{relativePath} */
  function tenantPath(tenantId, relativePath) {
    return `${tenantId}/${relativePath}`;
  }

  return {
    /**
     * Upload a file under the tenant's namespace.
     * @param {string} tenantId
     * @param {string} category  - e.g. 'lab-results', 'prescriptions', 'avatars'
     * @param {string} filename
     * @param {Buffer|Blob|ArrayBuffer} data
     * @param {object} [options]  - Supabase upload options (contentType, upsert, etc.)
     */
    upload(tenantId, category, filename, data, options = {}) {
      const path = tenantPath(tenantId, `${category}/${filename}`);
      return supabaseAdmin.storage.from(bucket).upload(path, data, options);
    },

    /**
     * Generate a short-lived signed URL for a tenant-scoped file.
     * @param {string} tenantId
     * @param {string} relativePath - path relative to tenantId, e.g. 'lab-results/report.pdf'
     * @param {number} [expiresIn=3600] - seconds until URL expires
     */
    getSignedUrl(tenantId, relativePath, expiresIn = 3600) {
      const path = tenantPath(tenantId, relativePath);
      return supabaseAdmin.storage.from(bucket).createSignedUrl(path, expiresIn);
    },

    /**
     * Delete a tenant-scoped file.
     * @param {string} tenantId
     * @param {string} relativePath - path relative to tenantId
     */
    deleteFile(tenantId, relativePath) {
      const path = tenantPath(tenantId, relativePath);
      return supabaseAdmin.storage.from(bucket).remove([path]);
    },

    /**
     * List files under a tenant's namespace (optionally scoped to a category).
     * @param {string} tenantId
     * @param {string} [category] - if omitted, lists all files for the tenant
     */
    list(tenantId, category = '') {
      const prefix = category ? `${tenantId}/${category}` : tenantId;
      return supabaseAdmin.storage.from(bucket).list(prefix);
    },
  };
}

/** Lazy singleton — instantiated on first use so env vars aren't required at import time. */
let _storageService = null;
export function getStorageService() {
  _storageService ??= createStorageService();
  return _storageService;
}
