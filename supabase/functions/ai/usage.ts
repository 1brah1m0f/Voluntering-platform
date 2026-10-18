import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.117.3';
import type { Action } from './schema.ts';
import { json } from './http.ts';

export const dailyLimit = (_p: { plan?: string; is_admin?: boolean }) => 10;

export async function reserveRequest(admin: SupabaseClient, userId: string, action: Action): Promise<{ response?: Response; remaining: number }> {
  const { data, error } = await admin.rpc('reserve_ai_request', { target: userId, request_action: action });
  // No fallback to an in-memory counter: missing migrations must fail closed.
  if (error || typeof data?.allowed !== 'boolean') return { response: json({ error: 'server_error' }, 500), remaining: 0 };
  if (!data.allowed) {
    const status = ['premium_required', 'student_required'].includes(data.error) ? 403 : 429;
    const response = json({ error: data.error, limit: data.limit }, status);
    if (data.retry_after) response.headers.set('Retry-After', String(data.retry_after));
    return { response, remaining: 0 };
  }
  if (!Number.isInteger(data.remaining) || data.remaining < 0) return { response: json({ error: 'server_error' }, 500), remaining: 0 };
  return { remaining: data.remaining };
}
