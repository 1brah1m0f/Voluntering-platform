import { Link } from 'react-router-dom';
import { UserRound, Building2 } from 'lucide-react';
import type { SocialProfile } from '../types';
import type { CommunityText } from './text';

export function SocialAvatar({ person }: { person: SocialProfile }) {
  return person.avatar_url ? <img src={person.avatar_url} alt="" referrerPolicy="no-referrer" className="h-14 w-14 shrink-0 rounded-full object-cover" />
    : <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700"><UserRound aria-hidden="true" /></span>;
}

export default function ProfileCard({ person, base, ownId, canFollow, busy, onFollow, t }: {
  person: SocialProfile; base: string; ownId: string; canFollow: boolean; busy: boolean;
  onFollow: (person: SocialProfile) => void; t: CommunityText;
}) {
  return <article className="flex flex-wrap items-center gap-4 border-b border-line py-5">
    <SocialAvatar person={person} />
    <div className="min-w-0 flex-1 basis-36">
      <Link to={`${base}/${person.id}`} className="break-words font-bold text-ink hover:underline">{person.display_name}</Link>
      <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">{person.kind === 'organization' && <Building2 className="h-3 w-3" aria-hidden="true" />}{t[person.kind]}</p>
      <p className="mt-1 break-words text-sm text-slate-600">{person.bio}</p>
      <p className="mt-2 text-xs text-slate-500">{person.followers_count} {t.followers.toLowerCase()} · {person.following_count} {t.following.toLowerCase()}</p>
    </div>
    {person.id === ownId ? <span className="text-xs text-slate-500">{t.self}</span> :
      <button type="button" disabled={busy || !canFollow} title={!canFollow ? t.optIn : undefined} aria-pressed={person.is_following}
        onClick={() => onFollow(person)} className={`${person.is_following ? 'btn-secondary' : 'btn-primary'} text-sm disabled:opacity-50`}>
        {busy ? t.loading : person.is_following ? t.unfollow : t.follow}
      </button>}
  </article>;
}
