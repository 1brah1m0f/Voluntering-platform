import { GOOGLE_FORM } from '../config';
import { supabase } from './supabase';

export interface SignupData {
  name: string;
  email: string;
  plan: 'basic' | 'premium';
  lang: string;
}

export type SignupResult = 'ok' | 'duplicate';

const MOCK_KEY = 'openly_waitlist_mock';

function readMock(): Array<SignupData & { created_at: string }> {
  try {
    return JSON.parse(localStorage.getItem(MOCK_KEY) || '[]');
  } catch {
    return [];
  }
}

const GF_SENT_KEY = 'openly_gform_sent';

/**
 * Posts to a Google Form. Google doesn't allow reading the response
 * cross-origin (`no-cors`), so we can't see server-side duplicates; we only
 * remember emails already sent from this browser.
 */
async function submitToGoogleForm(form: NonNullable<typeof GOOGLE_FORM>, data: SignupData, email: string): Promise<SignupResult> {
  let sent: string[] = [];
  try {
    sent = JSON.parse(localStorage.getItem(GF_SENT_KEY) || '[]');
  } catch {
    /* storage unavailable */
  }
  if (sent.includes(email)) return 'duplicate';

  const body = new URLSearchParams({
    [form.fields.name]: data.name.trim(),
    [form.fields.email]: email,
    [form.fields.plan]: data.plan === 'premium' ? 'Premium' : 'Sadə',
    [form.fields.lang]: data.lang,
  });
  // Resolves on any HTTP answer (opaque); rejects only on network failure.
  await fetch(`https://docs.google.com/forms/d/e/${form.formId}/formResponse`, { method: 'POST', mode: 'no-cors', body });

  try {
    localStorage.setItem(GF_SENT_KEY, JSON.stringify([...sent, email]));
  } catch {
    /* storage unavailable */
  }
  return 'ok';
}

export async function submitSignup(data: SignupData): Promise<SignupResult> {
  const email = data.email.trim().toLowerCase();

  if (GOOGLE_FORM) return submitToGoogleForm(GOOGLE_FORM, data, email);

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
  if (GOOGLE_FORM) return null; // Google Forms has no public counter.
  if (!supabase) return readMock().length || null;
  const { data, error } = await supabase.rpc('waitlist_count');
  if (error || typeof data !== 'number') return null;
  return data;
}
