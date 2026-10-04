import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Bell, Camera, Crown, KeyRound, Loader2, Settings, Sparkles, UserRound } from 'lucide-react';
import { NewPasswordForm } from './AuthPages';
import PremiumPlan from './PremiumPage';
import { backend } from '../backend';
import { useAuth } from '../AuthContext';
import { COUNTRIES, INTERESTS, INTEREST_IDS } from '../taxonomy';
import { useAppText } from '../text';
import { Avatar, Chip, Field, Spinner, inputClass } from '../ui';
import { squareImage } from '../util';
import { isPaidPlan } from '../plans';

type Tab = 'profile' | 'premium' | 'settings';

/**
 * Account page: profile, plan and settings as tabs (?tab=premium / ?tab=settings).
 * With `onboarding`, it's just the post-sign-up "pick your interests" step.
 */
export default function ProfilePage({ onboarding = false }: { onboarding?: boolean }) {
  const { tx, lang } = useAppText();
  const { profile, setProfile } = useAuth();
  const navigate = useNavigate();
  const uid = useId();
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [about, setAbout] = useState('');
  const [headline, setHeadline] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pwMsg, setPwMsg] = useState(false);
  const [params, setParams] = useSearchParams();
  const tabParam = params.get('tab');
  const tab: Tab = !onboarding && (tabParam === 'premium' || tabParam === 'settings') ? tabParam : 'profile';

  useEffect(() => {
    if (!profile) return;
    setName(profile.full_name);
    setCountry(profile.country);
    setInterests(profile.interests);
    setAbout(profile.about ?? '');
    setHeadline(profile.headline ?? '');
  }, [profile]);

  if (!profile) return <Spinner label={tx.loading} />;

  const toggle = (id: string) => setInterests((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setMsg({ ok: false, text: tx.auth.errors.nameRequired });
    setBusy(true);
    setMsg(null);
    try {
      const updated = await backend.updateProfile({ full_name: name.trim(), headline: headline.trim(), country, interests, about: about.trim() });
      setProfile(updated);
      if (onboarding) {
        const next = params.get('next') ?? '';
        navigate(next.startsWith('/') && !next.startsWith('//') ? next : '/app/home', { replace: true }); // same-site paths only
      } else setMsg({ ok: true, text: tx.profile.saved });
    } catch (err) {
      console.error('[profile] save failed', err);
      setMsg({ ok: false, text: tx.saveError });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      {onboarding ? (
        <>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{tx.profile.onboardingTitle}</h1>
          <p className="mt-1 text-slate-600">{tx.profile.onboardingSub}</p>
        </>
      ) : (
        <ProfileHeader />
      )}

      {!onboarding && (
        <div role="tablist" className="mt-5 flex gap-1 overflow-x-auto rounded-full bg-white p-1 shadow-sm ring-1 ring-slate-200">
          {(
            [
              { id: 'profile', label: tx.profile.tabProfile, Icon: UserRound },
              { id: 'premium', label: tx.profile.tabPremium, Icon: Sparkles },
              { id: 'settings', label: tx.profile.tabSettings, Icon: Settings },
            ] as const
          ).map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setParams(id === 'profile' ? {} : { tab: id }, { replace: true })}
              className={`flex flex-1 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold transition ${
                tab === id ? 'bg-brand-700 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      )}

      {tab === 'premium' && (
        <div className="mt-6">
          <PremiumPlan />
        </div>
      )}

      {tab === 'profile' && (
        <form onSubmit={submit} className="mt-6 space-y-6 rounded-3xl border border-line bg-white p-5 shadow-card sm:p-7">
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
            <Field label={tx.profile.headline} htmlFor={`${uid}-headline`}>
              <input
                id={`${uid}-headline`}
                value={headline}
                maxLength={80}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder={tx.profile.headlinePh}
                className={inputClass}
              />
            </Field>
          )}

          <Field label={tx.profile.about} htmlFor={`${uid}-about`} hint={tx.profile.aboutHint}>
            <textarea
              id={`${uid}-about`}
              rows={4}
              maxLength={2000}
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              placeholder={tx.profile.aboutPh}
              className={`${inputClass} resize-y`}
            />
          </Field>

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
      )}

      {tab === 'settings' && (
        <>
          <NotificationSettings />
          <section className="mt-6 rounded-3xl border border-line bg-white p-5 shadow-card sm:p-7">
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

/** Photo, name, headline and plan at the top of the account page. The photo saves immediately. Also used on /student/profile. */
export function ProfileHeader() {
  const { tx } = useAppText();
  const { profile, setProfile } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  if (!profile) return null;
  const premium = isPaidPlan(profile.plan);

  const change = async (image: Blob | null) => {
    setBusy(true);
    setError(false);
    try {
      setProfile(await backend.setAvatar(image));
    } catch (err) {
      console.error('[profile] photo failed', err);
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  const pick = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow picking the same file again
    if (!file) return;
    try {
      await change(await squareImage(file));
    } catch (err) {
      console.error('[profile] could not read image', err);
      setError(true);
    }
  };

  return (
    <div className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:gap-5 sm:p-6">
      <div className="relative shrink-0">
        <Avatar profile={profile} className="h-20 w-20 text-2xl sm:h-24 sm:w-24" />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          title={tx.profile.changePhoto}
          aria-label={tx.profile.changePhoto}
          className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-brand-700 text-white shadow transition hover:bg-brand-800 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Camera className="h-4 w-4" aria-hidden="true" />}
        </button>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={pick} className="hidden" />
      </div>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-xl font-extrabold tracking-tight sm:text-2xl">{profile.full_name || profile.email}</h1>
        {profile.headline && <p className="mt-0.5 text-sm font-medium text-slate-600">{profile.headline}</p>}
        <p className="mt-0.5 truncate text-sm text-slate-500">{profile.email}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${premium ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}
          >
            {premium && <Crown className="h-3.5 w-3.5" aria-hidden="true" />}
            {profile.plan === 'student' ? tx.profile.student : premium ? tx.profile.premium : tx.profile.basic}
          </span>
          {profile.avatar_url && (
            <button type="button" onClick={() => change(null)} disabled={busy} className="text-xs font-semibold text-slate-500 hover:text-rose-600">
              {tx.profile.removePhoto}
            </button>
          )}
        </div>
        {error && (
          <p role="alert" className="mt-2 text-xs font-medium text-rose-700">
            {tx.profile.photoError}
          </p>
        )}
      </div>
    </div>
  );
}

/** Digest / reminder email toggles. Each switch saves immediately. */
function NotificationSettings() {
  const { tx } = useAppText();
  const { profile, setProfile } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);
  if (!profile) return null;
  const premium = isPaidPlan(profile.plan);

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
