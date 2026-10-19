import { useState } from 'react';
import type { Profile, SocialProfile } from '../types';
import { backend } from '../backend';
import type { CommunityText } from './text';

export default function ProfileEditor({ person, account, t, onDone, onCancel }: {
  person: SocialProfile | null; account: Profile; t: CommunityText; onDone: () => void; onCancel: () => void;
}) {
  const [name, setName] = useState(person?.display_name ?? account.full_name);
  const [bio, setBio] = useState(person?.bio ?? '');
  const [kind, setKind] = useState<'volunteer' | 'organization'>(person?.kind ?? 'volunteer');
  const [sharePhoto, setSharePhoto] = useState(!!person?.avatar_url);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(false);
    try {
      const photo = sharePhoto ? (account.avatar_url || person?.avatar_url || '') : '';
      await backend.publishSocialProfile({ display_name: name.trim(), bio, kind, avatar_url: photo.startsWith('https://') ? photo : '' });
      onDone();
    } catch { setError(true); } finally { setBusy(false); }
  }
  async function remove() {
    if (!window.confirm(t.confirm)) return;
    setBusy(true); setError(false);
    try { await backend.deleteSocialProfile(); onDone(); } catch { setError(true); } finally { setBusy(false); }
  }
  return <form onSubmit={save} className="my-6 space-y-4 rounded-2xl border border-line bg-white p-5">
    <h2 className="text-lg font-bold text-ink">{person ? t.edit : t.publish}</h2>
    <p className="text-sm text-slate-600">{t.privacy}</p>
    <label className="block text-sm font-semibold">{t.name}<input required maxLength={80} value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full rounded-xl border border-line bg-white p-3" /></label>
    <label className="block text-sm font-semibold">{t.bio}<textarea maxLength={500} rows={3} value={bio} onChange={e => setBio(e.target.value)} className="mt-1 block w-full rounded-xl border border-line bg-white p-3" /></label>
    <label className="block text-sm font-semibold">{t.kind}<select value={kind} onChange={e => setKind(e.target.value as typeof kind)} className="mt-1 block w-full rounded-xl border border-line bg-white p-3"><option value="volunteer">{t.volunteer}</option><option value="organization">{t.organization}</option></select></label>
    <p className="text-xs text-slate-500">{t.orgNote}</p>
    {(account.avatar_url.startsWith('https://') || person?.avatar_url) && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={sharePhoto} onChange={e => setSharePhoto(e.target.checked)} />{t.photo}</label>}
    {error && <p role="alert" className="text-sm text-rose-700">{t.error}</p>}
    <div className="flex flex-wrap gap-3">
      <button disabled={busy || !name.trim()} className="btn-primary disabled:opacity-50">{busy ? t.loading : t.save}</button>
      <button disabled={busy} type="button" onClick={onCancel} className="btn-secondary">{t.cancel}</button>
      {person && <button disabled={busy} type="button" onClick={remove} className="px-3 text-sm font-semibold text-rose-700">{t.remove}</button>}
    </div>
  </form>;
}
