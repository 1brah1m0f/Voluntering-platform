import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

/**
 * Null when env vars are missing — the app then runs on the in-browser demo backend.
 */
export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null;
