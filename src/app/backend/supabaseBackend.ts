import { FunctionsHttpError, type AuthError, type PostgrestError, type SupabaseClient } from '@supabase/supabase-js';
import { FreeLimitError, type Opportunity, type Peer, type Profile, type SavedItem, type SavedLetter, type UserRow } from '../types';
import { BackendError, type Backend } from './types';

const PROFILE_COLS = 'id, email, full_name, interests, country, plan, is_admin, digest_opt_out, reminders_opt_out, about, avatar_url, headline';
// Used if supabase/app.sql hasn't been re-run yet and the newer columns are missing.
const PROFILE_COLS_BASE = 'id, email, full_name, interests, country, plan, is_admin';
const UNDEFINED_COLUMN = '42703';

function authError(e: AuthError): BackendError {
  const code = (e as AuthError & { code?: string }).code ?? '';
  const msg = e.message.toLowerCase();
  if (code === 'invalid_credentials' || msg.includes('invalid login')) return new BackendError('invalid_credentials', e.message);
  if (code === 'user_already_exists' || msg.includes('already registered')) return new BackendError('email_taken', e.message);
  if (code === 'weak_password' || msg.includes('password should')) return new BackendError('weak_password', e.message);
  if (code === 'email_not_confirmed' || msg.includes('not confirmed')) return new BackendError('email_not_confirmed', e.message);
  return new BackendError('unknown', e.message);
}

function dbError(e: PostgrestError): Error {
  if (e.message.includes('FREE_LIMIT_REACHED')) return new FreeLimitError();
  if (e.code === '42501') return new BackendError('not_allowed', e.message); // RLS / privilege
  return new BackendError('unknown', e.message);
}

export function createSupabaseBackend(sb: SupabaseClient): Backend {
  const uid = async () => (await sb.auth.getSession()).data.session?.user.id ?? null;

  return {
    mode: 'supabase',
    supportsGoogle: true,

    getUserId: uid,

    onAuthChange(cb) {
      const { data } = sb.auth.onAuthStateChange((_event, session) => cb(session?.user.id ?? null));
      return () => data.subscription.unsubscribe();
    },

    async signUp(email, password, fullName) {
      const { data, error } = await sb.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName }, emailRedirectTo: `${window.location.origin}/app` },
      });
      if (error) throw authError(error);
      // Supabase returns a user with no identities when the email is already registered.
      if (data.user && data.user.identities?.length === 0) throw new BackendError('email_taken');
      return data.session ? 'signed_in' : 'confirm_email';
    },

    async signIn(email, password) {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw authError(error);
    },

    async signInWithGoogle(nextPath) {
      const { error } = await sb.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}${nextPath}` },
      });
      if (error) throw authError(error);
    },

    async requestPasswordReset(email) {
      const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
      if (error) throw authError(error);
    },

    async updatePassword(password) {
      const { error } = await sb.auth.updateUser({ password });
      if (error) throw authError(error);
    },

    async signOut() {
      await sb.auth.signOut();
    },

    async getProfile() {
      const id = await uid();
      if (!id) return null;
      const { data, error } = await sb.from('profiles').select(PROFILE_COLS).eq('id', id).maybeSingle();
      if (error?.code === UNDEFINED_COLUMN) {
        console.warn('[profile] profile columns missing — re-run supabase/app.sql');
        const base = await sb.from('profiles').select(PROFILE_COLS_BASE).eq('id', id).maybeSingle();
        if (base.error) throw dbError(base.error);
        return base.data ? ({ ...base.data, digest_opt_out: false, reminders_opt_out: false, about: '', avatar_url: '', headline: '' } as Profile) : null;
      }
      if (error) throw dbError(error);
      return data as Profile | null;
    },

    async updateProfile(patch) {
      const id = await uid();
      if (!id) throw new BackendError('not_allowed');
      const { data, error } = await sb.from('profiles').update(patch).eq('id', id).select(PROFILE_COLS).single();
      if (error) throw dbError(error);
      return data as Profile;
    },

    async setAvatar(image) {
      const id = await uid();
      if (!id) throw new BackendError('not_allowed');
      const bucket = sb.storage.from('avatars');
      const { data: old } = await sb.from('profiles').select('avatar_url').eq('id', id).single();
      let avatar_url = '';
      if (image) {
        // A new file name each time, so browsers and the CDN never show a cached old photo.
        const path = `${id}/${Date.now()}.jpg`;
        const { error } = await bucket.upload(path, image, { contentType: 'image/jpeg' });
        if (error) throw new BackendError('unknown', error.message);
        avatar_url = bucket.getPublicUrl(path).data.publicUrl;
      }
      const { data, error } = await sb.from('profiles').update({ avatar_url }).eq('id', id).select(PROFILE_COLS).single();
      if (error) throw dbError(error);
      // Clean up the previous upload (a Google picture URL isn't ours to delete).
      const marker = '/storage/v1/object/public/avatars/';
      const oldUrl = (old?.avatar_url as string | undefined) ?? '';
      if (oldUrl.includes(marker)) await bucket.remove([oldUrl.split(marker)[1]]);
      return data as Profile;
    },

    async cancelPremium() {
      const id = await uid();
      if (!id) throw new BackendError('not_allowed');
      const { error } = await sb.rpc('cancel_premium');
      if (error) throw dbError(error);
      const { data, error: readError } = await sb.from('profiles').select(PROFILE_COLS).eq('id', id).single();
      if (readError) throw dbError(readError);
      return data as Profile;
    },

    async listOpportunities() {
      const { data, error } = await sb.from('opportunities').select('*').order('deadline', { ascending: true });
      if (error) throw dbError(error);
      return data as Opportunity[];
    },

    async getOpportunity(id) {
      const { data, error } = await sb.from('opportunities').select('*').eq('id', id).maybeSingle();
      if (error) throw dbError(error);
      return data as Opportunity | null;
    },

    async createOpportunity(input) {
      const { data, error } = await sb.from('opportunities').insert(input).select('*').single();
      if (error) throw dbError(error);
      return data as Opportunity;
    },

    async updateOpportunity(id, input) {
      const { data, error } = await sb.from('opportunities').update(input).eq('id', id).select('*').single();
      if (error) throw dbError(error);
      return data as Opportunity;
    },

    async deleteOpportunity(id) {
      const { error } = await sb.from('opportunities').delete().eq('id', id);
      if (error) throw dbError(error);
    },

    async premiumEarlyCount() {
      const { data, error } = await sb.rpc('premium_early_count');
      if (error) return 0; // function missing until app.sql is re-run — just hide the teaser
      return typeof data === 'number' ? data : 0;
    },

    async listUsers() {
      const { data, error } = await sb.from('profiles').select(`${PROFILE_COLS}, created_at`).order('created_at', { ascending: false });
      if (error) throw dbError(error);
      return data as UserRow[];
    },

    async setUserPlan(userId, plan) {
      const { error } = await sb.rpc('set_user_plan', { target: userId, new_plan: plan });
      if (error) throw dbError(error);
    },

    async ai(request) {
      const { data, error } = await sb.functions.invoke('ai', { body: request });
      if (error) {
        let code = '';
        let detail: string | undefined; // only sent to admins, for debugging setup problems
        if (error instanceof FunctionsHttpError) {
          try {
            ({ error: code = '', detail } = (await error.context.json()) as { error?: string; detail?: string });
          } catch {
            /* non-JSON error body */
          }
        }
        if (code === 'premium_required' || code === 'daily_limit' || code === 'refused' || code === 'not_configured') throw new BackendError(code, detail);
        throw new BackendError('ai_unavailable', detail);
      }
      return data as { result: unknown; remaining: number };
    },

    async aiStatus() {
      // Fails (and so reports "not ready") while the function isn't deployed yet.
      const { data, error } = await sb.functions.invoke('ai', { body: { action: 'status' } });
      return !error && (data as { configured?: boolean } | null)?.configured === true;
    },

    async listSaved() {
      const { data, error } = await sb.from('saved_opportunities').select('opportunity_id, status, created_at, updated_at, share_contact');
      if (error?.code === UNDEFINED_COLUMN) {
        // supabase/app.sql not re-run yet: no contact sharing column.
        const base = await sb.from('saved_opportunities').select('opportunity_id, status, created_at, updated_at');
        if (base.error) throw dbError(base.error);
        return base.data as SavedItem[];
      }
      if (error) throw dbError(error);
      return data as SavedItem[];
    },

    async save(opportunityId) {
      const { data, error } = await sb.from('saved_opportunities').insert({ opportunity_id: opportunityId }).select('opportunity_id, status, created_at, updated_at').single();
      if (error) throw dbError(error);
      return data as SavedItem;
    },

    async setStatus(opportunityId, status) {
      const { error } = await sb.from('saved_opportunities').update({ status }).eq('opportunity_id', opportunityId);
      if (error) throw dbError(error);
    },

    async unsave(opportunityId) {
      const { error } = await sb.from('saved_opportunities').delete().eq('opportunity_id', opportunityId);
      if (error) throw dbError(error);
    },

    async setShareContact(opportunityId, share) {
      const { error } = await sb.from('saved_opportunities').update({ share_contact: share }).eq('opportunity_id', opportunityId);
      if (error) throw dbError(error);
    },

    async acceptedPeers(opportunityId) {
      const { data, error } = await sb.rpc('accepted_peers', { opp: opportunityId });
      if (error) throw dbError(error);
      return (data ?? []) as Peer[];
    },

    async getLetter(opportunityId) {
      const { data, error } = await sb.from('letters').select('content, updated_at').eq('opportunity_id', opportunityId).maybeSingle();
      if (error) throw dbError(error);
      return data as SavedLetter | null;
    },

    async saveLetter(opportunityId, content) {
      const id = await uid();
      if (!id) throw new BackendError('not_allowed');
      const { data, error } = await sb
        .from('letters')
        .upsert({ user_id: id, opportunity_id: opportunityId, content, updated_at: new Date().toISOString() })
        .select('content, updated_at')
        .single();
      if (error) throw dbError(error);
      return data as SavedLetter;
    },
  };
}
