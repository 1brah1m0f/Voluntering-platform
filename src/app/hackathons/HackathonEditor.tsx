import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { backend } from '../backend';
import { useAppText } from '../text';
import { ErrorState, Field, Spinner, inputClass } from '../ui';
import { validHackathon } from './logic';
import { hackathonText } from './text';
import type { HackathonInput } from './types';

const EMPTY: HackathonInput = { title: '', organizer: '', format: 'online', location: '', deadline: '', start_date: '', end_date: '', team_min: 1, team_max: 5, prize: '', technologies: [], themes: [], level: 'all', eligibility: '', description: '', url: '', published: false };
const tags = (s: string) => [...new Set(s.split(',').map(t => t.trim()).filter(Boolean))];

export default function HackathonEditor() {
  const { id } = useParams();
  const { lang } = useAppText();
  const t = hackathonText[lang];
  const navigate = useNavigate();
  const [form, setForm] = useState<HackathonInput>(EMPTY);
  const [tech, setTech] = useState('');
  const [themes, setThemes] = useState('');
  const [loaded, setLoaded] = useState<string | null>(id ? null : 'new');
  const [loadError, setLoadError] = useState(false);
  const [missing, setMissing] = useState(false);
  const [version, setVersion] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true; setLoadError(false); setMissing(false);
    if (!id) { setForm(EMPTY); setTech(''); setThemes(''); setLoaded('new'); return; }
    backend.getHackathon(id).then(h => {
      if (!active) return;
      if (!h) { setMissing(true); return; }
      setForm(h); setTech(h.technologies.join(', ')); setThemes(h.themes.join(', ')); setLoaded(id);
    }, () => { if (active) setLoadError(true); });
    return () => { active = false; };
  }, [id, version]);
  const update = <K extends keyof HackathonInput>(key: K, value: HackathonInput[K]) => setForm(old => ({ ...old, [key]: value }));
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const input: HackathonInput = { ...form, title: form.title.trim(), organizer: form.organizer.trim(), technologies: tags(tech), themes: tags(themes), url: form.url.trim(), description: form.description.trim(), location: form.location.trim() };
    // getHackathon includes server-managed fields; send only editable columns.
    const { title, organizer, format, location, deadline, start_date, end_date, team_min, team_max, prize, technologies, themes: topics, level, eligibility, description, url, published } = input;
    const payload = { title, organizer, format, location, deadline, start_date, end_date, team_min, team_max, prize, technologies, themes: topics, level, eligibility, description, url, published };
    if (!validHackathon(payload) || technologies.length > 30 || topics.length > 20) { setError(t.validation); return; }
    setBusy(true); setError('');
    try {
      const result = id ? await backend.updateHackathon(id, payload) : await backend.createHackathon(payload);
      navigate(`/app/hackathons/${result.id}`, { replace: true });
    } catch { setError(t.error); setBusy(false); }
  };
  if (loadError) return <ErrorState onRetry={() => setVersion(v => v + 1)} />;
  if (missing) return <p role="status">{t.notFound}</p>;
  if (loaded !== (id ?? 'new')) return <Spinner />;
  return <div className="mx-auto max-w-3xl">
    <Link to={id ? `/app/hackathons/${id}` : '/app/hackathons'} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500"><ArrowLeft className="h-4 w-4" aria-hidden="true" />{t.back}</Link>
    <h1 className="font-display text-2xl font-extrabold">{id ? t.edit : t.new}</h1>
    <form onSubmit={submit} className="mt-5 space-y-5">
      <fieldset disabled={busy} className="grid gap-4 rounded-2xl border border-line bg-white p-5 sm:grid-cols-2">
        <legend className="sr-only">{t.new}</legend>
        <div className="sm:col-span-2"><Field label={t.name} htmlFor="hack-title"><input id="hack-title" className={inputClass} required maxLength={160} value={form.title} onChange={e => update('title', e.target.value)} /></Field></div>
        <Field label={t.organizer} htmlFor="hack-organizer"><input id="hack-organizer" className={inputClass} required maxLength={160} value={form.organizer} onChange={e => update('organizer', e.target.value)} /></Field>
        <Field label={t.format} htmlFor="hack-format"><select id="hack-format" className={inputClass} value={form.format} onChange={e => update('format', e.target.value as HackathonInput['format'])}>{(['online', 'onsite', 'hybrid'] as const).map(v => <option key={v} value={v}>{t[v]}</option>)}</select></Field>
        <Field label={t.location} htmlFor="hack-location"><input id="hack-location" className={inputClass} maxLength={200} required={form.format !== 'online'} value={form.location} onChange={e => update('location', e.target.value)} /></Field>
        <Field label={t.level} htmlFor="hack-level"><select id="hack-level" className={inputClass} value={form.level} onChange={e => update('level', e.target.value as HackathonInput['level'])}>{(['all', 'beginner', 'experienced'] as const).map(v => <option key={v} value={v}>{t[v]}</option>)}</select></Field>
        <Field label={t.deadline} htmlFor="hack-deadline"><input id="hack-deadline" type="date" className={inputClass} required max={form.start_date || undefined} value={form.deadline} onChange={e => update('deadline', e.target.value)} /></Field>
        <Field label={t.start} htmlFor="hack-start"><input id="hack-start" type="date" className={inputClass} required min={form.deadline || undefined} max={form.end_date || undefined} value={form.start_date} onChange={e => update('start_date', e.target.value)} /></Field>
        <Field label={t.end} htmlFor="hack-end"><input id="hack-end" type="date" className={inputClass} required min={form.start_date || undefined} value={form.end_date} onChange={e => update('end_date', e.target.value)} /></Field>
        <Field label={t.prize} htmlFor="hack-prize"><input id="hack-prize" className={inputClass} maxLength={200} value={form.prize} onChange={e => update('prize', e.target.value)} /></Field>
        <Field label={t.teamMin} htmlFor="hack-min"><input id="hack-min" className={inputClass} type="number" required min={1} max={100} value={form.team_min} onChange={e => update('team_min', Number(e.target.value))} /></Field>
        <Field label={t.teamMax} htmlFor="hack-max"><input id="hack-max" className={inputClass} type="number" required min={form.team_min} max={100} value={form.team_max} onChange={e => update('team_max', Number(e.target.value))} /></Field>
        <Field label={t.technologies} hint={t.comma} htmlFor="hack-tech"><input id="hack-tech" className={inputClass} maxLength={1000} placeholder="React, Python, AI" value={tech} onChange={e => setTech(e.target.value)} /></Field>
        <Field label={t.themes} hint={t.comma} htmlFor="hack-themes"><input id="hack-themes" className={inputClass} maxLength={1000} value={themes} onChange={e => setThemes(e.target.value)} /></Field>
        <div className="sm:col-span-2"><Field label={t.url} htmlFor="hack-url"><input id="hack-url" type="url" required pattern="https?://.*" maxLength={2000} className={inputClass} value={form.url} onChange={e => update('url', e.target.value)} /></Field></div>
        <div className="sm:col-span-2"><Field label={t.eligibility} htmlFor="hack-eligibility"><textarea id="hack-eligibility" rows={3} maxLength={3000} className={inputClass} value={form.eligibility} onChange={e => update('eligibility', e.target.value)} /></Field></div>
        <div className="sm:col-span-2"><Field label={t.description} htmlFor="hack-description"><textarea id="hack-description" rows={7} required maxLength={12000} className={inputClass} value={form.description} onChange={e => update('description', e.target.value)} /></Field></div>
        <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2"><input type="checkbox" checked={form.published} onChange={e => update('published', e.target.checked)} />{t.published}</label>
      </fieldset>
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      <div className="flex flex-wrap gap-3"><button type="submit" disabled={busy} className="btn-primary disabled:opacity-50"><Save className="h-4 w-4" aria-hidden="true" />{t.save}</button><Link to={id ? `/app/hackathons/${id}` : '/app/hackathons'} className="btn-secondary">{t.cancel}</Link></div>
    </form>
  </div>;
}
