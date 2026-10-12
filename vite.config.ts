import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolveBackendConfig } from './src/lib/backendConfig';

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  resolveBackendConfig({
    url: env.VITE_SUPABASE_URL,
    key: env.VITE_SUPABASE_ANON_KEY,
    enableDemo: env.VITE_ENABLE_DEMO,
    production: command === 'build',
  });
  return { plugins: [react()], build: { target: 'es2022' } };
});
