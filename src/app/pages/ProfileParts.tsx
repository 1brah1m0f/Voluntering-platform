import { useState, type KeyboardEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Award, Check, FileText, Loader2, Palette, Plus, Stamp, Trash2, TrendingUp, X, type LucideIcon } from 'lucide-react';
import { backend } from '../backend';
import { useAuth } from '../AuthContext';
import { useData } from '../DataContext';
import { THEMES, THEME_IDS, LANG_LEVELS, badges, countryCode, visitedCountries } from '../personal';
import { COUNTRIES, KINDS } from '../taxonomy';
import { useAppText } from '../text';
import type { Experience, Kind, LangLevel, UserPrefs } from '../types';
import { Chip, inputClass } from '../ui';

/** A titled card that groups related fields or settings. */
export function Section({ Icon, title, sub, children, action }: { Icon: LucideIcon; title: string; sub?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-7">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold">{title}</h2>
          {sub && <p className="mt-0.5 text-sm text-slate-500">{sub}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Drops empty rows and trims text before prefs are saved. */
export function cleanPrefs(p: UserPrefs): UserPrefs {
  const text = (s?: string) => s?.trim() || undefined;
  return {
    ...p,
    school: text(p.school),
    field: text(p.field),
    linkedin: text(p.linkedin),
    languages: (p.languages ?? []).map((l) => ({ ...l, name: l.name.trim() })).filter((l) => l.name),
    skills: [...new Set((p.skills ?? []).map((s) => s.trim()).filter(Boolean))],
    experiences: (p.experiences ?? [])
      .map((e) => ({ title: e.title.trim(), org: text(e.org), country: text(e.country), year: e.year || undefined }))
      .filter((e) => e.title),
  };
}

/** Saves a change to profile.prefs right away, merged into what's stored. */
export function useSavePrefs() {
  const { tx } = useAppText();
  const { profile, setProfile } = useAuth();
  const [busy, setBusy] = useState(false);
  const [savedAt, setSavedAt] = useState(0);
  const save = async (patch: Partial<UserPrefs>) => {
    if (!profile) return;
    setBusy(true);
    try {
      setProfile(await backend.updateProfile({ prefs: { ...(profile.prefs ?? {}), ...patch } }));
      setSavedAt(Date.now());
    } catch (err) {
      console.error('[prefs] save failed', err);
      alert(tx.saveError);
    } finally {
      setBusy(false);
    }
  };
  return { save, busy, savedAt };
}

/** Row of colour swatches for the profile cover; saves on click. */
export function ThemePicker({ onDone }: { onDone: () => void }) {
  const { tx } = useAppText();
  const { profile } = useAuth();
  const { save, busy } = useSavePrefs();
  const current = profile?.prefs?.theme ?? 'teal';
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-white/95 p-1.5 shadow-soft" role="radiogroup" aria-label={tx.profile.theme}>
      {THEME_IDS.map((t) => (
        <button
          key={t}
          type="button"
          role="radio"
          aria-checked={current === t}
          aria-label={t}
          disabled={busy}
          onClick={async () => {
            await save({ theme: t });
            onDone();
          }}
          className={`flex h-7 w-7 items-center justify-center rounded-full ${THEMES[t].swatch} ring-offset-2 transition hover:scale-110 ${current === t ? 'ring-2 ring-ink' : ''}`}
        >
          {current === t && <Check className="h-3.5 w-3.5 text-white" aria-hidden="true" />}
        </button>
      ))}
    </div>
  );
}

/** The palette button on the cover, opening the swatches. */
export function ThemeButton() {
  const { tx } = useAppText();
  const [open, setOpen] = useState(false);
  return (
    <div className="absolute right-3 top-3 flex items-center gap-2">
      {open && <ThemePicker onDone={() => setOpen(false)} />}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        title={tx.profile.theme}
        aria-label={tx.profile.theme}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition hover:bg-white/35"
      >
        {open ? <X className="h-4 w-4" aria-hidden="true" /> : <Palette className="h-4 w-4" aria-hidden="true" />}
      </button>
    </div>
  );
}

export function LanguagesEditor({ value, onChange }: { value: { name: string; level: LangLevel }[]; onChange: (v: { name: string; level: LangLevel }[]) => void }) {
  const { tx } = useAppText();
  const set = (i: number, patch: Partial<{ name: string; level: LangLevel }>) => onChange(value.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const unused = tx.profile.languageSuggestions.filter((s) => !value.some((l) => l.name.toLowerCase() === s.toLowerCase()));
  return (
    <div className="space-y-2">
      {value.map((l, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            value={l.name}
            maxLength={30}
            onChange={(e) => set(i, { name: e.target.value })}
            placeholder={tx.profile.languagePh}
            aria-label={tx.profile.languageName}
            className={`${inputClass} min-w-0 flex-1`}
          />
          <select value={l.level} onChange={(e) => set(i, { level: e.target.value as LangLevel })} aria-label={tx.profile.languageLevel} className={`${inputClass} !w-32 shrink-0`}>
            {LANG_LEVELS.map((lv) => (
              <option key={lv} value={lv}>
                {lv === 'native' ? tx.profile.levelNative : lv}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => onChange(value.filter((_, j) => j !== i))}
            aria-label={tx.profile.remove}
            title={tx.profile.remove}
            className="shrink-0 rounded-full p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ))}
      {value.length < 8 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <button type="button" onClick={() => onChange([...value, { name: '', level: 'B1' }])} className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1.5 text-sm font-bold text-brand-800 hover:bg-brand-100">
            <Plus className="h-4 w-4" aria-hidden="true" />
            {tx.profile.addLanguage}
          </button>
          {unused.slice(0, 5).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChange([...value, { name: s, level: 'B1' }])}
              className="rounded-full border border-line bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 hover:border-brand-300 hover:text-brand-700"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function SkillsEditor({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const { tx } = useAppText();
  const [draft, setDraft] = useState('');
  const add = (s: string) => {
    const skill = s.trim().slice(0, 40);
    if (skill && value.length < 20 && !value.some((v) => v.toLowerCase() === skill.toLowerCase())) onChange([...value, skill]);
    setDraft('');
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault(); // Enter would submit the profile form
      add(draft);
    } else if (e.key === 'Backspace' && !draft && value.length) onChange(value.slice(0, -1));
  };
  return (
    <div>
      <div className="field-surface flex min-h-[3rem] flex-wrap items-center gap-1.5 !py-2">
        {value.map((s) => (
          <span key={s} className="inline-flex items-center gap-1 rounded-full bg-brand-700 py-1 pl-3 pr-1.5 text-sm font-semibold text-white">
            {s}
            <button type="button" onClick={() => onChange(value.filter((v) => v !== s))} aria-label={`${tx.profile.remove}: ${s}`} className="rounded-full p-0.5 hover:bg-white/20">
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          onBlur={() => draft.trim() && add(draft)}
          placeholder={value.length ? '' : tx.profile.skillPh}
          aria-label={tx.profile.sectionSkills}
          className="min-w-[8rem] flex-1 border-0 bg-transparent p-1 text-sm outline-none focus:ring-0"
        />
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {tx.profile.skillSuggestions
          .filter((s) => !value.includes(s))
          .slice(0, 8)
          .map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="rounded-full border border-line bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 hover:border-brand-300 hover:text-brand-700"
            >
              + {s}
            </button>
          ))}
      </div>
    </div>
  );
}

export function ExperienceEditor({ value, onChange }: { value: Experience[]; onChange: (v: Experience[]) => void }) {
  const { tx } = useAppText();
  const set = (i: number, patch: Partial<Experience>) => onChange(value.map((e, j) => (j === i ? { ...e, ...patch } : e)));
  const thisYear = new Date().getFullYear();
  return (
    <div className="space-y-3">
      {value.map((e, i) => (
        <div key={i} className="relative rounded-2xl border border-line bg-paper/50 p-3 sm:p-4">
          <button
            type="button"
            onClick={() => onChange(value.filter((_, j) => j !== i))}
            aria-label={tx.profile.remove}
            title={tx.profile.remove}
            className="absolute right-2 top-2 rounded-full p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
          <div className="grid gap-2 pr-8 sm:grid-cols-2">
            <input
              value={e.title}
              maxLength={100}
              onChange={(ev) => set(i, { title: ev.target.value })}
              placeholder={tx.profile.expTitlePh}
              aria-label={tx.profile.expTitle}
              className={`${inputClass} sm:col-span-2`}
            />
            <input value={e.org ?? ''} maxLength={80} onChange={(ev) => set(i, { org: ev.target.value })} placeholder={tx.profile.expOrg} aria-label={tx.profile.expOrg} className={inputClass} />
            <div className="flex gap-2">
              <select value={e.country ?? ''} onChange={(ev) => set(i, { country: ev.target.value })} aria-label={tx.profile.expCountry} className={`${inputClass} min-w-0 flex-1`}>
                <option value="">{tx.profile.expCountry}</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select value={e.year ?? ''} onChange={(ev) => set(i, { year: Number(ev.target.value) || undefined })} aria-label={tx.profile.expYear} className={`${inputClass} !w-28 shrink-0`}>
                <option value="">{tx.profile.expYear}</option>
                {Array.from({ length: 15 }, (_, k) => thisYear - k).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      ))}
      {value.length < 10 && (
        <button type="button" onClick={() => onChange([...value, { title: '' }])} className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1.5 text-sm font-bold text-brand-800 hover:bg-brand-100">
          <Plus className="h-4 w-4" aria-hidden="true" />
          {tx.profile.addExperience}
        </button>
      )}
    </div>
  );
}

/** One on/off row that saves straight away. */
function SwitchRow({ title, sub, on, disabled, onToggle }: { title: string; sub: string; on: boolean; disabled: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="font-semibold text-slate-900">{title}</p>
        <p className="text-sm text-slate-500">{sub}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={title}
        disabled={disabled}
        onClick={onToggle}
        className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-60 ${on ? 'bg-brand-600' : 'bg-slate-300'}`}
      >
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-6' : 'left-1'}`} />
      </button>
    </div>
  );
}

/** ?tab=match — what the user is looking for; every change is saved immediately. */
export function PrefsTab() {
  const { tx, lang } = useAppText();
  const t = tx.prefsTab;
  const { profile } = useAuth();
  const { save, busy, savedAt } = useSavePrefs();
  if (!profile) return null;
  const prefs = profile.prefs ?? {};
  const kinds = prefs.kinds ?? [];
  const destinations = prefs.destinations ?? [];
  const toggleKind = (k: Kind) => save({ kinds: kinds.includes(k) ? kinds.filter((x) => x !== k) : [...kinds, k] });
  const toggleDest = (c: string) => save({ destinations: destinations.includes(c) ? destinations.filter((x) => x !== c) : [...destinations, c].slice(0, 15) });
  const duration = prefs.duration ?? 'any';

  return (
    <div className="mt-6 space-y-5">
      <div className="flex items-start justify-between gap-3 rounded-3xl border border-brand-100 bg-brand-50/70 p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-bold text-brand-950">{t.title}</h2>
          <p className="mt-1 text-sm text-brand-900/80">{t.sub}</p>
        </div>
        <span className="shrink-0 text-sm font-semibold text-emerald-700" role="status">
          {busy ? <Loader2 className="h-4 w-4 animate-spin text-brand-600" aria-hidden="true" /> : savedAt ? t.saved : null}
        </span>
      </div>

      <Section Icon={TrendingUp} title={t.kinds} sub={t.kindsHint}>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(KINDS) as Kind[]).map((k) => (
            <Chip key={k} on={kinds.includes(k)} onClick={() => toggleKind(k)}>
              {KINDS[k][lang]}
            </Chip>
          ))}
        </div>
        <p className="mb-2 mt-6 text-sm font-semibold text-slate-800">{t.duration}</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {(['short', 'long', 'any'] as const).map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={duration === d}
              disabled={busy}
              onClick={() => save({ duration: d })}
              className={`rounded-2xl border p-3 text-left transition ${duration === d ? 'border-brand-700 bg-brand-50 ring-1 ring-brand-700' : 'border-line bg-white hover:border-brand-300'}`}
            >
              <span className="block font-bold text-ink">{t.durations[d]}</span>
              <span className="block text-xs text-slate-500">{t.durationsSub[d]}</span>
            </button>
          ))}
        </div>
        <div className="mt-4 divide-y divide-slate-100">
          <SwitchRow title={t.funded} sub={t.fundedSub} on={!!prefs.funded_only} disabled={busy} onToggle={() => save({ funded_only: !prefs.funded_only })} />
          <SwitchRow title={t.passport} sub={t.passportSub} on={!!prefs.passport} disabled={busy} onToggle={() => save({ passport: !prefs.passport })} />
        </div>
      </Section>

      <Section Icon={Stamp} title={t.destinations} sub={t.destinationsHint}>
        <div className="flex flex-wrap gap-2">
          {COUNTRIES.filter((c) => c !== 'Azərbaycan').map((c) => (
            <Chip key={c} on={destinations.includes(c)} onClick={() => toggleDest(c)}>
              {c}
            </Chip>
          ))}
        </div>
      </Section>
    </div>
  );
}

/** ?tab=journey — achievements, travel passport, application numbers and the CV. */
export function JourneyTab() {
  const { tx } = useAppText();
  const j = tx.journey;
  const { profile } = useAuth();
  const { opportunities, saved } = useData();
  if (!profile) return null;
  const items = [...saved.values()];
  const accepted = (opportunities ?? []).filter((o) => saved.get(o.id)?.status === 'accepted');
  const countries = visitedCountries(profile.prefs, accepted);
  const list = badges(profile, items, countries);
  const earned = list.filter((b) => b.earned).length;
  const sent = items.filter((i) => i.status !== 'saved').length;
  const acceptedCount = items.filter((i) => i.status === 'accepted').length;
  const decided = items.filter((i) => i.status === 'accepted' || i.status === 'rejected').length;
  const stamps = ['border-coral-500 text-coral-700 -rotate-6', 'border-brand-600 text-brand-700 rotate-3', 'border-violet-500 text-violet-700 -rotate-2', 'border-amber-500 text-amber-700 rotate-6'];

  return (
    <div className="mt-6 space-y-5">
      <Section Icon={TrendingUp} title={j.statsTitle}>
        <dl className="grid grid-cols-3 gap-3 text-center">
          {(
            [
              [String(sent), j.total],
              [String(acceptedCount), j.accepted],
              [decided ? `${Math.round((acceptedCount / decided) * 100)}%` : '—', j.rate],
            ] as const
          ).map(([v, label]) => (
            <div key={label} className="flex flex-col-reverse rounded-2xl bg-paper px-3 py-4">
              <dt className="mt-1 text-xs font-medium text-slate-500">{label}</dt>
              <dd className="font-display text-3xl font-extrabold text-ink">{v}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section Icon={Award} title={j.badgesTitle} sub={j.badgesSub(earned, list.length)}>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {list.map((b) => (
            <li
              key={b.id}
              className={`flex flex-col items-center rounded-2xl border p-3 text-center transition ${b.earned ? 'border-amber-200 bg-gradient-to-b from-amber-50 to-white' : 'border-line bg-paper/60'}`}
            >
              <span className={`text-3xl ${b.earned ? '' : 'opacity-30 grayscale'}`} aria-hidden="true">
                {b.emoji}
              </span>
              <span className={`mt-1.5 text-sm font-bold ${b.earned ? 'text-ink' : 'text-slate-500'}`}>{j.badges[b.id].name}</span>
              <span className="mt-0.5 text-xs text-slate-500">{j.badges[b.id].how}</span>
              {b.earned && <Check className="mt-1 h-4 w-4 text-emerald-600" aria-label="✓" />}
            </li>
          ))}
        </ul>
      </Section>

      <Section Icon={Stamp} title={j.passportTitle} sub={j.passportSub}>
        {countries.length === 0 ? (
          <p className="rounded-2xl bg-paper px-4 py-3 text-sm text-slate-600">{j.passportEmpty}</p>
        ) : (
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {countries.map((c, i) => (
              <li key={c} className="flex flex-col items-center">
                <span className={`flex h-16 w-16 flex-col items-center justify-center rounded-full border-[3px] border-double bg-white font-display ${stamps[i % stamps.length]}`}>
                  <span className="text-lg font-extrabold leading-none">{countryCode(c)}</span>
                  <span className="mt-0.5 text-[0.5rem] font-bold uppercase tracking-widest">Openly</span>
                </span>
                <span className="mt-1.5 text-xs font-semibold text-slate-600">{c}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Link to="/app/cv" className="group flex items-center gap-4 rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 to-brand-50 p-5 transition hover:-translate-y-0.5 hover:shadow-card sm:p-6">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-700 text-white shadow">
          <FileText className="h-6 w-6" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-extrabold text-violet-950">{j.cvTitle}</span>
          <span className="mt-1 block text-sm text-violet-900/80">{j.cvSub}</span>
        </span>
        <span className="hidden shrink-0 items-center gap-1 text-sm font-bold text-violet-700 sm:inline-flex">
          {j.cvCta}
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" />
        </span>
      </Link>
    </div>
  );
}
