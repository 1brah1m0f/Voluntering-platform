import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Code2, HeartHandshake, Layers3 } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { backend } from '../backend';
import { useAppText } from '../text';
import type { DiscoveryMode } from './types';
import { hackathonText } from './text';

export default function DiscoveryPage() {
  const { profile, setProfile } = useAuth();
  const { lang } = useAppText();
  const t = hackathonText[lang];
  const navigate = useNavigate();
  const [choice, setChoice] = useState<DiscoveryMode | undefined>(profile?.prefs?.discovery_mode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const options = [
    { id: 'volunteering' as const, title: t.volunteering, sub: t.volunteeringSub, Icon: HeartHandshake, number: '01' },
    { id: 'hackathons' as const, title: t.hackathons, sub: t.hackathonsSub, Icon: Code2, number: '02' },
    { id: 'both' as const, title: t.both, sub: t.bothSub, Icon: Layers3, number: '03' },
  ];
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!choice || !profile?.is_admin || busy) return;
    setBusy(true); setError(false);
    try {
      setProfile(await backend.updateProfile({ prefs: { ...profile.prefs, discovery_mode: choice } }));
      navigate(choice === 'hackathons' ? '/app/hackathons' : '/app/home', { replace: true });
    } catch { setError(true); setBusy(false); }
  };
  return <div className="mx-auto max-w-4xl py-6 sm:py-12">
    <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-700"><Code2 className="h-4 w-4" aria-hidden="true" />{t.preview}</span>
    <h1 className="mt-5 max-w-xl font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{t.chooseTitle}</h1>
    <p className="mt-3 max-w-xl text-slate-600">{t.chooseSub}</p>
    <form onSubmit={submit} className="mt-8">
      <fieldset disabled={busy}>
        <legend className="sr-only">{t.chooseTitle}</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {options.map(({ id, title, sub, Icon, number }) => <label key={id} className={`relative flex cursor-pointer flex-col rounded-2xl border p-5 transition focus-within:ring-2 focus-within:ring-brand-600 ${choice === id ? 'border-brand-600 bg-brand-50' : 'border-line bg-white hover:border-brand-300'}`}>
            <input className="sr-only" type="radio" name="discovery" value={id} checked={choice === id} onChange={() => setChoice(id)} />
            <div className="flex items-center justify-between"><Icon className="h-7 w-7 text-brand-700" aria-hidden="true" /><span className="text-xs font-semibold text-slate-400">{number}</span></div>
            <span className="mt-8 flex items-center justify-between gap-2 text-lg font-bold text-ink">{title}{choice === id && <Check className="h-5 w-5 text-brand-700" aria-hidden="true" />}</span>
            <span className="mt-2 text-sm leading-relaxed text-slate-600">{sub}</span>
          </label>)}
        </div>
      </fieldset>
      {error && <p role="alert" className="mt-4 text-sm text-rose-700">{t.error}</p>}
      <button disabled={!choice || busy} className="btn-primary mt-6 disabled:opacity-50" type="submit">{t.continue}<ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
    </form>
  </div>;
}
