import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { resolveBackendConfig } from './backendConfig';

const config = resolveBackendConfig({
  url: import.meta.env.VITE_SUPABASE_URL,
  key: import.meta.env.VITE_SUPABASE_ANON_KEY,
  enableDemo: import.meta.env.VITE_ENABLE_DEMO,
  production: import.meta.env.PROD,
});

export const supabase: SupabaseClient | null = config.mode === 'supabase'
  ? createClient(config.url, config.key)
  : null;
