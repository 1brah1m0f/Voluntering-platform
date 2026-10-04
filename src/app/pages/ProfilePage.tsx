import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Bell, Briefcase, Camera, Crown, Globe, Heart, IdCard, KeyRound, Languages, Loader2, LogOut, Plus, Route, Settings, SlidersHorizontal, Sparkles, UserRound, Wrench } from 'lucide-react';
import { NewPasswordForm } from './AuthPages';
import PremiumPlan from './PremiumPage';
import { ExperienceEditor, JourneyTab, LanguagesEditor, PrefsTab, Section, SkillsEditor, ThemeButton, cleanPrefs } from './ProfileParts';
import { backend } from '../backend';
import { useAuth } from '../AuthContext';
import { useData } from '../DataContext';
import { useLang } from '../../i18n';
import { THEMES } from '../personal';
import { completeness } from '../profileProgress';
import { COUNTRIES, INTERESTS, INTEREST_IDS } from '../taxonomy';
import { useAppText } from '../text';
import type { Occupation, UserPrefs } from '../types';
import { Avatar, Chip, Field, Spinner, inputClass } from '../ui';
import { squareImage } from '../util';
import { isPaidPlan } from '../plans';

type Tab = 'profile' | 'journey' | 'match' | 'premium' | 'settings';
const TABS: Tab[] = ['profile', 'journey', 'match', 'premium', 'settings'];
const OCCUPATIONS: Occupation[] = ['school', 'student', 'graduate', 'working', 'other'];
// Prefs edited on the profile tab (the rest are saved from the Preferences tab or the cover).
const sameJson = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Account page: profile, plan and settings as tabs (?tab=premium / ?tab=settings).
 * With `onboarding`, it's just the post-sign-up "pick your interests" step.
 */
export default function ProfilePage({ onboarding = false }: { onboarding?: boolean }) {
  const { tx, lang } = useAppText();
  const { profile, setProfile } = useAuth();
  const { saved } = useData();
  const navigate = useNavigate();
  const uid = useId();
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [about, setAbout] = useState('');
  const [headline, setHeadline] = useState('');
  const [prefs, setPrefs] = useState<UserPrefs>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pwMsg, setPwMsg] = useState(false);
  const [params, setParams] = useSearchParams();
  const tabParam = params.get('tab') as Tab | null;
  const tab: Tab = !onboarding && tabParam && TABS.includes(tabParam) ? tabParam : 'profile';

  useEffect(() => {
    if (!profile) return;
    setName(profile.full_name);
    setCountry(profile.country);
    setInterests(profile.interests);
    setAbout(profile.about ?? '');
    setHeadline(profile.headline ?? '');
    setPrefs(profile.prefs ?? {});
  }, [profile]);

  if (!profile) return <Spinner label={tx.loading} />;

  const toggle = (id: string) => setInterests((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const patchPrefs = (patch: Partial<UserPrefs>) => setPrefs((cur) => ({ ...cur, ...patch }));
  const dirty =
    name !== profile.full_name ||
    country !== profile.country ||
    headline !== (profile.headline ?? '') ||
    about !== (profile.about ?? '') ||
    interests.length !== profile.interests.length ||
    interests.some((i) => !profile.interests.includes(i)) ||
    !sameJson(prefs, profile.prefs ?? {});
  const thisYear = new Date().getFullYear();
  // "Add: Studies" etc. start a new line in "About me" that the user then completes.
  const addTip = (text: string) => setAbout((cur) => (cur.trim() ? `${cur.trimEnd()}\n${text}` : text).slice(0, 2000));
  const items = [...saved.values()];
  const stats = {
    saved: items.filter((i) => i.status === 'saved').length,
    applied: items.filter((i) => i.status === 'applied').length,
    accepted: items.filter((i) => i.status === 'accepted').length,
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setMsg({ ok: false, text: tx.auth.errors.nameRequired });
    setBusy(true);
    setMsg(null);
    try {
      // This form owns these prefs; the colour and the Preferences tab save theirs on their own.
      const { birth_year, occupation, school, field, linkedin, languages, skills, experiences } = prefs;
      const nextPrefs = cleanPrefs({ ...(profile?.prefs ?? {}), birth_year, occupation, school, field, linkedin, languages, skills, experiences });
      const updated = await backend.updateProfile({ full_name: name.trim(), headline: headline.trim(), country, interests, about: about.trim(), prefs: nextPrefs });
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
        <ProfileHeader progress={completeness(profile).percent} stats={stats} />
      )}

      {!onboarding && (
        <div role="tablist" className="mt-5 flex gap-1 overflow-x-auto rounded-full bg-white p-1 shadow-sm ring-1 ring-slate-200">
          {(
            [
              { id: 'profile', label: tx.profile.tabProfile, Icon: UserRound },
              { id: 'journey', label: tx.profile.tabJourney, Icon: Route },
              { id: 'match', label: tx.profile.tabMatch, Icon: SlidersHorizontal },
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
      {tab === 'journey' && <JourneyTab />}
      {tab === 'match' && <PrefsTab />}

      {tab === 'profile' && (
        <form onSubmit={submit} className="mt-6 space-y-5">
          <Section Icon={Heart} title={tx.profile.sectionInterests} sub={tx.profile.sectionInterestsSub(interests.length)}>
            <div className="flex flex-wrap gap-2">
              {INTEREST_IDS.map((id) => (
                <Chip key={id} on={interests.includes(id)} onClick={() => toggle(id)}>
                  {INTERESTS[id][lang]}
                </Chip>
              ))}
            </div>
          </Section>

          <Section Icon={IdCard} title={tx.profile.sectionBasics} sub={tx.profile.sectionBasicsSub}>
            <div className="space-y-4">
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
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={tx.profile.birthYear} htmlFor={`${uid}-birth`} hint={tx.profile.birthYearHint}>
                  <select
                    id={`${uid}-birth`}
                    value={prefs.birth_year ?? ''}
                    onChange={(e) => patchPrefs({ birth_year: Number(e.target.value) || undefined })}
                    className={inputClass}
                  >
                    <option value="">{tx.profile.birthYearPh}</option>
                    {Array.from({ length: 50 }, (_, k) => thisYear - 12 - k).map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={tx.profile.occupation} htmlFor={`${uid}-occ`}>
                  <select
                    id={`${uid}-occ`}
                    value={prefs.occupation ?? ''}
                    onChange={(e) => patchPrefs({ occupation: (e.target.value || undefined) as Occupation | undefined })}
                    className={inputClass}
                  >
                    <option value="">{tx.profile.countryPh}</option>
                    {OCCUPATIONS.map((o) => (
                      <option key={o} value={o}>
                        {tx.profile.occupations[o]}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              {!onboarding && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={tx.profile.school} htmlFor={`${uid}-school`}>
                      <input id={`${uid}-school`} value={prefs.school ?? ''} maxLength={100} onChange={(e) => patchPrefs({ school: e.target.value })} placeholder={tx.profile.schoolPh} className={inputClass} />
                    </Field>
                    <Field label={tx.profile.field} htmlFor={`${uid}-field`}>
                      <input id={`${uid}-field`} value={prefs.field ?? ''} maxLength={100} onChange={(e) => patchPrefs({ field: e.target.value })} placeholder={tx.profile.fieldPh} className={inputClass} />
                    </Field>
                  </div>
                  <Field label={tx.profile.linkedin} htmlFor={`${uid}-linkedin`}>
                    <input
                      id={`${uid}-linkedin`}
                      type="url"
                      value={prefs.linkedin ?? ''}
                      maxLength={200}
                      onChange={(e) => patchPrefs({ linkedin: e.target.value })}
                      placeholder="https://linkedin.com/in/…"
                      className={inputClass}
                    />
                  </Field>
                </>
              )}
            </div>
          </Section>

          {!onboarding && (
            <>
              <Section Icon={Languages} title={tx.profile.sectionLanguages} sub={tx.profile.sectionLanguagesSub}>
                <LanguagesEditor value={prefs.languages ?? []} onChange={(languages) => patchPrefs({ languages })} />
              </Section>
              <Section Icon={Wrench} title={tx.profile.sectionSkills} sub={tx.profile.sectionSkillsSub}>
                <SkillsEditor value={prefs.skills ?? []} onChange={(skills) => patchPrefs({ skills })} />
              </Section>
              <Section Icon={Briefcase} title={tx.profile.sectionExperience} sub={tx.profile.sectionExperienceSub}>
                <ExperienceEditor value={prefs.experiences ?? []} onChange={(experiences) => patchPrefs({ experiences })} />
              </Section>
            </>
          )}

          <Section Icon={Sparkles} title={tx.profile.sectionAbout} sub={tx.profile.sectionAboutSub}>
            <label htmlFor={`${uid}-about`} className="sr-only">
              {tx.profile.about}
            </label>
            <textarea
              id={`${uid}-about`}
              rows={6}
              maxLength={2000}
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              placeholder={tx.profile.aboutPh}
              className={`${inputClass} resize-y`}
            />
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500">{tx.profile.aboutTipsLabel}</span>
              {tx.profile.aboutTips.map((tip) => (
                <button
                  key={tip.label}
                  type="button"
                  onClick={() => addTip(tip.text)}
                  className="inline-flex items-center gap-1 rounded-full border border-line bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:border-violet-300 hover:text-violet-700"
                >
                  <Plus className="h-3 w-3" aria-hidden="true" />
                  {tip.label}
                </button>
              ))}
              <span className={`ml-auto text-xs font-medium ${about.length > 1800 ? 'text-amber-700' : 'text-slate-400'}`}>{tx.profile.aboutCount(about.length)}</span>
            </div>
          </Section>

          {/* Save bar: stays in view on long forms and says when there's something to save. */}
          <div className="sticky bottom-20 z-30 flex flex-col gap-3 rounded-3xl border border-line bg-white/95 p-4 shadow-soft backdrop-blur sm:flex-row sm:items-center lg:bottom-4">
            <div className="min-w-0 flex-1">
              {/* A "saved" message gives way to "unsaved changes" as soon as the user edits again. */}
              {msg && (!msg.ok || !dirty) ? (
                <p role={msg.ok ? 'status' : 'alert'} className={`text-sm font-semibold ${msg.ok ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {msg.text}
                </p>
              ) : (
                dirty && <p className="text-sm font-semibold text-amber-700">{tx.profile.unsaved}</p>
              )}
            </div>
            <button type="submit" disabled={busy || (!dirty && !onboarding)} className="btn-primary w-full disabled:opacity-60 sm:w-auto">
              {busy && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
              {onboarding ? tx.profile.continue : tx.profile.save}
            </button>
          </div>
        </form>
      )}

      {tab === 'settings' && (
        <div className="mt-6 space-y-5">
          <AccountSettings />
          <NotificationSettings />
          <Section Icon={KeyRound} title={tx.profile.security} sub={tx.profile.securityHint}>
            <NewPasswordForm submitLabel={tx.auth.savePassword} onDone={() => setPwMsg(true)} />
            {pwMsg && (
              <p role="status" className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
                {tx.auth.passwordChanged}
              </p>
            )}
          </Section>
        </div>
      )}
    </div>
  );
}

/**
 * Photo, name, headline and plan at the top of the account page. The photo saves immediately.
 * The regular profile also passes how complete it is and the application counts; /student/profile doesn't.
 */
export function ProfileHeader({ progress, stats }: { progress?: number; stats?: { saved: number; applied: number; accepted: number } }) {
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

  const theme = THEMES[profile.prefs?.theme ?? 'teal'] ?? THEMES.teal;
  const p = profile.prefs ?? {};
  // A line about what they do, from the structured profile, when there's no headline.
  const studyLine = [p.occupation ? tx.profile.occupations[p.occupation] : '', p.school, p.field].filter(Boolean).join(' · ');

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      {/* Cover in the colour the user picked. */}
      <div className={`relative h-24 bg-gradient-to-br sm:h-28 ${theme.cover}`}>
        <span className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-white/15" aria-hidden="true" />
        <span className="pointer-events-none absolute -bottom-20 left-1/3 h-40 w-40 rounded-full border-[16px] border-white/10" aria-hidden="true" />
        <ThemeButton />
      </div>
    <div className="flex items-start gap-4 px-5 pb-5 sm:gap-5 sm:px-6 sm:pb-6">
      <div className="relative -mt-10 shrink-0 sm:-mt-12">
        <Avatar profile={profile} className="h-20 w-20 text-2xl ring-4 ring-white sm:h-24 sm:w-24" />
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
      <div className="min-w-0 flex-1 pt-3">
        <h1 className="truncate text-xl font-extrabold tracking-tight sm:text-2xl">{profile.full_name || profile.email}</h1>
        {(profile.headline || studyLine) && <p className="mt-0.5 text-sm font-medium text-slate-600">{profile.headline || studyLine}</p>}
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
        {progress !== undefined && progress < 100 && (
          <div className="mt-3 max-w-xs">
            <p className="text-xs font-semibold text-slate-600">{tx.profile.completeness(progress)}</p>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-paper" aria-hidden="true">
              <div className="h-full rounded-full bg-brand-700 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
        {error && (
          <p role="alert" className="mt-2 text-xs font-medium text-rose-700">
            {tx.profile.photoError}
          </p>
        )}
      </div>
      {stats && (
        <dl className="mt-3 hidden shrink-0 grid-cols-3 gap-2 text-center md:grid">
          {(
            [
              [stats.saved, tx.profile.statSaved, 'text-coral-700'],
              [stats.applied, tx.profile.statApplied, 'text-brand-700'],
              [stats.accepted, tx.profile.statAccepted, 'text-emerald-700'],
            ] as const
          ).map(([n, label, tone]) => (
            <div key={label} className="min-w-[4.5rem] rounded-2xl bg-paper px-3 py-2.5">
              <dt className="sr-only">{label}</dt>
              <dd className={`font-display text-2xl font-extrabold leading-none ${tone}`}>{n}</dd>
              <dd className="mt-1 text-xs font-medium text-slate-500">{label}</dd>
            </div>
          ))}
        </dl>
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
    <Section Icon={Bell} title={tx.profile.notifications}>
      <ul className="-mt-2 divide-y divide-slate-100">
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
    </Section>
  );
}

/** Email, account type and plan; site language; log out. */
function AccountSettings() {
  const { tx } = useAppText();
  const { lang, setLang } = useLang();
  const { profile } = useAuth();
  const navigate = useNavigate();
  if (!profile) return null;
  const planName = profile.plan === 'student' ? tx.profile.student : profile.plan === 'premium' ? tx.profile.premium : tx.profile.basic;

  const logout = async () => {
    await backend.signOut();
    navigate('/login', { replace: true });
  };

  const rows: [string, string][] = [
    [tx.profile.accountEmail, profile.email],
    [tx.profile.accountType, profile.account_type === 'student' ? tx.profile.accountStudent : tx.profile.accountRegular],
    [tx.profile.plan, planName],
  ];

  return (
    <Section Icon={UserRound} title={tx.profile.account}>
      <dl className="-mt-2 divide-y divide-slate-100">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4 py-3">
            <dt className="text-sm text-slate-500">{label}</dt>
            <dd className="min-w-0 truncate text-right font-semibold text-slate-900">{value}</dd>
          </div>
        ))}
        <div className="flex items-center justify-between gap-4 py-3">
          <dt>
            <span className="flex items-center gap-1.5 text-sm text-slate-500">
              <Globe className="h-4 w-4" aria-hidden="true" />
              {tx.profile.language}
            </span>
            <span className="block text-xs text-slate-400">{tx.profile.languageSub}</span>
          </dt>
          <dd className="flex rounded-full border border-line p-0.5 text-xs font-bold">
            {(['az', 'en'] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                aria-pressed={lang === l}
                className={`rounded-full px-3 py-1 uppercase transition ${lang === l ? 'bg-brand-900 text-white' : 'text-slate-600'}`}
              >
                {l}
              </button>
            ))}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4 pt-3">
          <dt className="text-sm text-slate-500">{tx.profile.logoutSub}</dt>
          <dd>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-4 py-2 text-sm font-bold text-rose-700 transition hover:bg-rose-50"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              {tx.profile.logout}
            </button>
          </dd>
        </div>
      </dl>
    </Section>
  );
}
