import { supabase } from './supabase';

export interface SignupData {
  name: string;
  email: string;
  plan: 'basic' | 'premium';
  lang: string;
}

export type SignupResult = 'ok' | 'duplicate';

const MOCK_KEY = 'fursat_waitlist_mock';

function readMock(): Array<SignupData & { created_at: string }> {
  try {
    return JSON.parse(localStorage.getItem(MOCK_KEY) || '[]');
  } catch {
    return [];
  }
}

export async function submitSignup(data: SignupData): Promise<SignupResult> {
  const email = data.email.trim().toLowerCase();

  if (!supabase) {
    // ------------------------------------------------------------------
    // PLACEHOLDER HANDLER — used only when VITE_SUPABASE_URL /
    // VITE_SUPABASE_ANON_KEY are not set. Submissions are kept in this
    // browser's localStorage so the page can be demoed without a backend.
    // ------------------------------------------------------------------
    console.info('[waitlist:mock] submission', { ...data, email });
    await new Promise((r) => setTimeout(r, 600));
    const rows = readMock();
    if (rows.some((r) => r.email === email)) return 'duplicate';
    try {
      localStorage.setItem(MOCK_KEY, JSON.stringify([...rows, { ...data, email, created_at: new Date().toISOString() }]));
    } catch {
      /* storage unavailable — ignore in mock mode */
    }
    return 'ok';
  }

  const { error } = await supabase.from('waitlist').insert({
    name: data.name.trim(),
    email,
    plan: data.plan,
    lang: data.lang,
    user_agent: navigator.userAgent.slice(0, 300),
  });

  if (error) {
    if (error.code === '23505') return 'duplicate'; // unique violation on email
    throw error;
  }
  return 'ok';
}

/** Returns the number of signups, or null if unavailable. */
export async function getSignupCount(): Promise<number | null> {
  if (!supabase) return readMock().length || null;
  const { data, error } = await supabase.rpc('waitlist_count');
  if (error || typeof data !== 'number') return null;
  return data;
}
