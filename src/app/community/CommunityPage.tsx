import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { UsersRound } from 'lucide-react';
import { useLang } from '../../i18n';
import { useAuth } from '../AuthContext';
import { backend } from '../backend';
import type { CommunityQuery, SocialProfile } from '../types';
import ProfileCard, { SocialAvatar } from './ProfileCard';
import ProfileEditor from './ProfileEditor';
import { communityText } from './text';

export default function CommunityPage() {
  const { id } = useParams();
  const { pathname } = useLocation();
  const [params, setParams] = useSearchParams();
  const { lang } = useLang();
  const { userId, profile } = useAuth();
  const t = communityText[lang];
  const base = pathname.startsWith('/student') ? '/student/community' : '/app/community';
  const [people, setPeople] = useState<SocialProfile[]>([]);
  const [own, setOwn] = useState<SocialProfile | null>(null);
  const [person, setPerson] = useState<SocialProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [more, setMore] = useState(false);
  const [pageBusy, setPageBusy] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [revision, setRevision] = useState(0);
  const generation = useRef(0);
  const search = params.get('q') ?? '';
  const filter = params.get('kind');
  const tab = params.get('tab') ?? (id ? 'followers' : 'discover');
  const relation = tab === 'following' || tab === 'followers' ? tab : undefined;
  const kind = filter === 'volunteer' || filter === 'organization' ? filter : undefined;
  const query: CommunityQuery = { search, kind, relation, personId: id ?? userId ?? undefined };
  const latestQuery = useRef(query);
  latestQuery.current = query;

  useEffect(() => {
    const current = ++generation.current;
    setLoading(true); setError(false); setPageBusy(false); setEditing(false);
    const timer = window.setTimeout(() => {
      Promise.all([backend.listCommunity(latestQuery.current), backend.getSocialProfile(userId!),
        id ? backend.getSocialProfile(id) : Promise.resolve(null)])
        .then(([rows, mine, target]) => {
          if (generation.current !== current) return;
          setPeople(rows); setMore(rows.length === 24); setOwn(mine); setPerson(target);
        }).catch(() => { if (generation.current === current) setError(true); })
        .finally(() => { if (generation.current === current) setLoading(false); });
    }, 200);
    return () => { window.clearTimeout(timer); generation.current++; };
  }, [id, userId, search, kind, relation, revision]);

  async function loadMore() {
    const current = generation.current;
    setPageBusy(true); setError(false);
    try {
      const rows = await backend.listCommunity({ ...query, offset: people.length });
      if (current !== generation.current) return;
      setPeople(previous => [...previous, ...rows.filter(row => !previous.some(p => p.id === row.id))]);
      setMore(rows.length === 24);
    } catch { if (current === generation.current) setError(true); }
    finally { if (current === generation.current) setPageBusy(false); }
  }
  async function follow(target: SocialProfile) {
    const current = generation.current;
    setBusy(target.id); setError(false);
    try {
      await backend.setFollowing(target.id, !target.is_following);
      if (current === generation.current) setRevision(v => v + 1);
    } catch { if (current === generation.current) setError(true); } finally { setBusy(null); }
  }
  function change(key: string, value: string) {
    setParams(previous => { const next = new URLSearchParams(previous); if (value) next.set(key, value); else next.delete(key); return next; }, { replace: key === 'q' });
  }
  const card = (row: SocialProfile) => <ProfileCard key={row.id} person={row} base={base} ownId={userId!}
    canFollow={!!own} busy={busy !== null} onFollow={follow} t={t} />;

  return <section className="mx-auto max-w-3xl">
    <header className="mb-6">
      {id && <Link to={base} className="text-sm font-semibold text-brand-700">← {t.back}</Link>}
      <h1 className="mt-2 flex items-center gap-3 font-display text-3xl font-extrabold text-ink"><UsersRound aria-hidden="true" />{t.title}</h1>
      <p className="mt-2 text-slate-600">{t.intro}</p>
    </header>
    {!loading && !error && !own && <p className="mb-3 text-sm text-slate-600">{t.optIn}</p>}
    {!loading && <div className="mb-5 flex flex-wrap gap-3">
      <button type="button" onClick={() => setEditing(v => !v)} className="btn-secondary text-sm">{own ? t.edit : t.publish}</button>
      {own && id !== own.id && <Link to={`${base}/${own.id}`} className="btn-secondary text-sm">{t.own}</Link>}
    </div>}
    {editing && profile && <ProfileEditor key={own?.id ?? 'new'} person={own} account={profile} t={t}
      onCancel={() => setEditing(false)} onDone={() => { setEditing(false); setRevision(v => v + 1); }} />}
      <div className="mb-2 flex flex-wrap gap-3">
        <input type="search" maxLength={100} aria-label={t.search} placeholder={t.search} value={search} onChange={e => change('q', e.target.value)} className="min-w-0 flex-1 rounded-xl border border-line bg-white p-3 text-sm" />
        <select aria-label={t.kind} value={kind ?? ''} onChange={e => change('kind', e.target.value)} className="max-w-full rounded-xl border border-line bg-white p-3 text-sm">
          <option value="">{t.all}</option><option value="volunteer">{t.volunteer}</option><option value="organization">{t.organization}</option>
        </select>
      </div>
    {error && <div role="alert" className="my-4 rounded-xl border border-rose-200 p-4 text-rose-700">{t.error} <button className="ml-2 underline" onClick={() => setRevision(v => v + 1)}>{t.retry}</button></div>}
    {loading ? <p role="status" className="py-10 text-center text-slate-500">{t.loading}</p> : id && !person ?
      (!error && <p role="status">{t.missing}</p>) : <>
      {person && <div className="mb-6 rounded-2xl border border-line bg-white p-5">
        <div className="flex items-center gap-4"><SocialAvatar person={person} /><h2 className="break-words text-xl font-bold text-ink">{person.display_name}</h2></div>
        <p className="mt-3 text-sm text-slate-500">{t[person.kind]}</p>
        <p className="mt-2 whitespace-pre-wrap break-words text-slate-600">{person.bio}</p>
        {person.kind === 'organization' && <p className="mt-2 text-xs text-slate-500">{t.orgNote}</p>}
        {person.id !== userId && <button type="button" disabled={!own || busy !== null} aria-pressed={person.is_following}
          onClick={() => follow(person)} className="btn-primary mt-4 disabled:opacity-50">{person.is_following ? t.unfollow : t.follow}</button>}
      </div>}
      <nav aria-label={t.title} className="mb-5 flex flex-wrap gap-2 border-b border-line pb-4">
        {(id ? ['followers', 'following'] as const : ['discover', 'following', 'followers'] as const).map(value =>
          <button key={value} type="button" onClick={() => change('tab', value)} aria-pressed={tab === value}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === value ? 'bg-brand-900 text-white' : 'bg-white text-slate-600'}`}>
            {t[value]} {person && value !== 'discover' ? (value === 'followers' ? person.followers_count : person.following_count) : ''}
          </button>)}
      </nav>
      {people.map(card)}
      {!people.length && !error && <p role="status" className="py-12 text-center text-slate-500">{t.empty}</p>}
      {more && <button type="button" disabled={pageBusy} onClick={loadMore} className="btn-secondary my-5">{pageBusy ? t.loading : t.more}</button>}
    </>}
  </section>;
}
