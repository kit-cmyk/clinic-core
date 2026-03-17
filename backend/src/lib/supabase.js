import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

/**
 * Factory — creates a Supabase admin client (service role key).
 * Injectable url/key for testability. NEVER expose this to the frontend.
 * Use for: user management, bypassing RLS, server-side auth operations.
 */
export function createSupabaseAdminClient({
  url = env.SUPABASE_URL,
  key = env.SUPABASE_SERVICE_ROLE_KEY,
} = {}) {
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Factory — creates a Supabase anon client.
 * Safe for server-side calls that respect RLS (mirrors what the frontend uses).
 */
export function createSupabaseAnonClient({
  url = env.SUPABASE_URL,
  key = env.SUPABASE_ANON_KEY,
} = {}) {
  return createClient(url, key);
}

// ── Lazy production singletons ────────────────────────────────────────────────
// Instantiated on first use so module import doesn't throw when env vars
// are absent (e.g. in test environments that don't set SUPABASE_URL).

let _admin = null;
let _client = null;

/** Returns the shared Supabase admin singleton. Throws if env vars are missing. */
export function getSupabaseAdmin() {
  _admin ??= createSupabaseAdminClient();
  return _admin;
}

/** Returns the shared Supabase anon client singleton. */
export function getSupabaseClient() {
  _client ??= createSupabaseAnonClient();
  return _client;
}
