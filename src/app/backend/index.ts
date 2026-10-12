import { supabase } from '../../lib/supabase';
import { createSupabaseBackend } from './supabaseBackend';
import type { Backend } from './types';

export * from './types';

// Demo code and seed catalogues load only when the validated configuration selects it.
export const backend: Backend = supabase
  ? createSupabaseBackend(supabase)
  : (await import('./demoBackend')).createDemoBackend();
