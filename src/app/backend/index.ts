import { supabase } from '../../lib/supabase';
import { createDemoBackend } from './demoBackend';
import { createSupabaseBackend } from './supabaseBackend';

export * from './types';

/** Supabase when VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are set, otherwise the in-browser demo. */
export const backend = supabase ? createSupabaseBackend(supabase) : createDemoBackend();
