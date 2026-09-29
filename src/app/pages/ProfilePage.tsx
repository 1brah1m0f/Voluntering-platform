import { useEffect, useId, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Crown, KeyRound, Loader2 } from 'lucide-react';
import { NewPasswordForm } from './AuthPages';
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
  const [about, setAbout] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pwMsg, setPwMsg] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setName(profile.full_name);
    setCountry(profile.country);
    setInterests(profile.interests);
    setAbout(profile.about ?? '');
  }, [profile]);

  if (!profile) return <Spinner label={tx.loading} />;

  const toggle = (id: string) => setInterests((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setMsg({ ok: false, text: tx.auth.errors.nameRequired });
    setBusy(true);
    setMsg(null);
    try {
      const updated = await backend.updateProfile({ full_name: name.trim(), country, interests, about: about.trim() });
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

        <Field label={tx.profile.about} htmlFor={`${uid}-about`} hint={tx.profile.aboutHint}>
          <textarea id={`${uid}-about`} rows={4} maxLength={2000} value={about} onChange={(e) => setAbout(e.target.value)} placeholder={tx.profile.aboutPh} className={`${inputClass} resize-y`} />
        </Field>

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

      {!onboarding && (
        <>
          <NotificationSettings />
          <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <KeyRound className="h-5 w-5 text-brand-600" aria-hidden="true" />
              {tx.profile.security}
            </h2>
            <p className="mb-4 mt-1 text-sm text-slate-500">{tx.profile.securityHint}</p>
            <NewPasswordForm submitLabel={tx.auth.savePassword} onDone={() => setPwMsg(true)} />
            {pwMsg && (
              <p role="status" className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
                {tx.auth.passwordChanged}
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}

/** Digest / reminder email toggles. Each switch saves immediately. */
function NotificationSettings() {
  const { tx } = useAppText();
  const { profile, setProfile } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);
  if (!profile) return null;
  const premium = profile.plan === 'premium';

  const toggle = async (key: 'digest_opt_out' | 'reminders_opt_out') => {
    setBusy(key);
    try {
      setProfile(await backend.updateProfile({ [key]: !profile[key] }));
    } catch (err) {
      console.error('[profile] notification toggle failed', err);
      alert(tx.saveError);
    } finally {
      setBusy(null);
    }
  };

  const rows = [
    { key: 'digest_opt_out' as const, title: tx.profile.digest, sub: premium ? tx.profile.digestPremium : tx.profile.digestFree, available: true },
    { key: 'reminders_opt_out' as const, title: tx.profile.reminders, sub: premium ? tx.profile.remindersPremium : tx.profile.remindersFree, available: premium },
  ];

  return (
    <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <Bell className="h-5 w-5 text-brand-600" aria-hidden="true" />
        {tx.profile.notifications}
      </h2>
      <ul className="mt-4 divide-y divide-slate-100">
        {rows.map(({ key, title, sub, available }) => {
          const on = available && !profile[key];
          return (
            <li key={key} className="flex items-center justify-between gap-4 py-3">
              <div>
                <p className="font-semibold text-slate-900">{title}</p>
                <p className="text-sm text-slate-500">{sub}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-label={title}
                disabled={!available || busy === key}
                onClick={() => toggle(key)}
                className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:cursor-not-allowed disabled:opacity-50 ${on ? 'bg-brand-600' : 'bg-slate-300'}`}
              >
                <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-6' : 'left-1'}`} />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
