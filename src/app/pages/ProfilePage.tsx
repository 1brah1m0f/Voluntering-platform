import { useEffect, useId, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Loader2 } from 'lucide-react';
import { backend } from '../backend';
import { useAuth } from '../AuthContext';
import { COUNTRIES, INTERESTS, INTEREST_IDS } from '../taxonomy';
import { useAppText } from '../text';
import { Chip, Field, Spinner, inputClass } from '../ui';

/** Profile editor. With `onboarding`, it's the post-sign-up "pick your interests" step. */
export default function ProfilePage({ onboarding = false }: { onboarding?: boolean }) {
  const { tx, lang } = useAppText();
  const { profile, setProfile } = useAuth();
  const navigate = useNavigate();
  const uid = useId();
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!profile) return;
    setName(profile.full_name);
    setCountry(profile.country);
    setInterests(profile.interests);
  }, [profile]);

  if (!profile) return <Spinner label={tx.loading} />;

  const toggle = (id: string) => setInterests((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setMsg({ ok: false, text: tx.auth.errors.nameRequired });
    setBusy(true);
    setMsg(null);
    try {
      const updated = await backend.updateProfile({ full_name: name.trim(), country, interests });
      setProfile(updated);
      if (onboarding) navigate('/app', { replace: true });
      else setMsg({ ok: true, text: tx.profile.saved });
    } catch (err) {
      console.error('[profile] save failed', err);
      setMsg({ ok: false, text: tx.saveError });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{onboarding ? tx.profile.onboardingTitle : tx.profile.title}</h1>
      {onboarding && <p className="mt-1 text-slate-600">{tx.profile.onboardingSub}</p>}

      <form onSubmit={submit} className="mt-6 space-y-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-slate-800">
            {tx.profile.interests} <span className="font-normal text-slate-500">— {tx.profile.interestsHint}</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {INTEREST_IDS.map((id) => (
              <Chip key={id} on={interests.includes(id)} onClick={() => toggle(id)}>
                {INTERESTS[id][lang]}
              </Chip>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={tx.profile.name} htmlFor={`${uid}-name`}>
            <input id={`${uid}-name`} value={name} maxLength={80} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </Field>
          <Field label={tx.profile.country} htmlFor={`${uid}-country`}>
            <select id={`${uid}-country`} value={country} onChange={(e) => setCountry(e.target.value)} className={inputClass}>
              <option value="">{tx.profile.countryPh}</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {!onboarding && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={tx.profile.email}>
              <p className="rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm text-slate-600">{profile.email}</p>
            </Field>
            <Field label={tx.profile.plan}>
              <p className="inline-flex w-full items-center gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-slate-800">
                {profile.plan === 'premium' && <Crown className="h-4 w-4 text-amber-500" aria-hidden="true" />}
                {profile.plan === 'premium' ? tx.profile.premium : tx.profile.basic}
              </p>
            </Field>
          </div>
        )}

        {msg && (
          <p role={msg.ok ? 'status' : 'alert'} className={`rounded-xl px-3 py-2 text-sm font-medium ${msg.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
            {msg.text}
          </p>
        )}

        <button type="submit" disabled={busy} className="btn-primary w-full sm:w-auto">
          {busy && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
          {onboarding ? tx.profile.continue : tx.profile.save}
        </button>
      </form>
    </div>
  );
}
