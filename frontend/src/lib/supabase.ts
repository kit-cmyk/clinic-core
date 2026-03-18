import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — check your .env.local');
}

/**
 * Shared Supabase client for the frontend.
 * Uses the anon key — all operations respect Row Level Security.
 * Server-side operations (bypassing RLS) use the backend admin client.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
