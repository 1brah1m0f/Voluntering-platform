import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import {
  Calculator,
  Check,
  ChevronDown,
  Coins,
  Crown,
  ExternalLink,
  GraduationCap,
  Landmark,
  ListChecks,
  Lock,
  Map as MapIcon,
  Plus,
  School,
  Trash2,
} from 'lucide-react';
import { backend } from '../backend';
import { useAuth } from '../AuthContext';
import { hasStudent } from '../plans';
import { FIELDS, LEVELS, ROADMAP, ROADMAP_STEP_COUNT } from '../student/roadmap';
import { useAppText } from '../text';
import type { Scholarship, ShortlistItem, ShortlistStatus, StudyLevel, University } from '../types';
import { Chip, DeadlineChip, ErrorState, Spinner, inputClass } from '../ui';

type Tab = 'roadmap' | 'scholarships' | 'universities' | 'planner';
const TABS: { id: Tab; Icon: typeof MapIcon }[] = [
  { id: 'roadmap', Icon: MapIcon },
  { id: 'scholarships', Icon: Landmark },
  { id: 'universities', Icon: School },
  { id: 'planner', Icon: Calculator },
];

const eur = (n: number) => `${Math.round(n).toLocaleString('en-US').replace(/,/g, ' ')} €`;

/** Estimated yearly cost (tuition + 12 months of living), or null when tuition isn't known. */
function yearlyCost(u: University): number | null {
  const tuition = u.tuition_min_eur ?? u.tuition_max_eur;
  if (tuition === null) return null;
  return tuition + (u.living_eur_month ?? 0) * 12;
}

/**
 * /student — the Student plan (7 ₼): study-abroad roadmap, scholarships,
 * universities and a planner. The catalogue itself is protected in the
 * database (RLS): other plans see a preview and an upgrade card.
 */
export default function StudentPage() {
  const { tx } = useAppText();
  const { profile } = useAuth();
  const [params, setParams] = useSearchParams();
  const tabParam = params.get('tab') as Tab | null;
  const tab: Tab = tabParam && TABS.some((t) => t.id === tabParam) ? tabParam : 'roadmap';
  const allowed = hasStudent(profile);

  const [scholarships, setScholarships] = useState<Scholarship[] | null>(null);
  const [universities, setUniversities] = useState<University[] | null>(null);
  const [shortlist, setShortlist] = useState<ShortlistItem[]>([]);
  const [error, setError] = useState(false);

  const load = () => {
    setError(false);
    Promise.all([backend.listScholarships(), backend.listUniversities(), backend.listShortlist()]).then(
      ([s, u, l]) => {
        setScholarships(s);
        setUniversities(u);
        setShortlist(l);
      },
      (err) => {
        console.error('[student] load failed', err);
        setError(true);
      },
    );
  };
  useEffect(() => {
    if (allowed) load();
  }, [allowed]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!allowed) return <StudentPaywall />;

  const shortlistOps = {
    add: async (id: string) => {
      setShortlist((cur) => (cur.some((x) => x.university_id === id) ? cur : [...cur, { university_id: id, status: 'planning' }]));
      await backend.addToShortlist(id).catch((err) => console.error('[shortlist] add failed', err));
    },
    remove: async (id: string) => {
      setShortlist((cur) => cur.filter((x) => x.university_id !== id));
      await backend.removeFromShortlist(id).catch((err) => console.error('[shortlist] remove failed', err));
    },
    status: async (id: string, status: ShortlistStatus) => {
      setShortlist((cur) => cur.map((x) => (x.university_id === id ? { ...x, status } : x)));
      await backend.setShortlistStatus(id, status).catch((err) => console.error('[shortlist] status failed', err));
    },
  };

  return (
    <div>
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-violet-700 to-brand-800 p-6 text-white shadow-soft sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-coral-400/25 blur-3xl" aria-hidden="true" />
        <p className="relative inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-violet-100">
          <GraduationCap className="h-4 w-4" aria-hidden="true" />
          Openly {tx.student.title}
        </p>
        <h1 className="relative mt-2 text-2xl font-extrabold tracking-tight !text-white sm:text-3xl">{tx.student.hubTitle}</h1>
        <p className="relative mt-1 max-w-2xl text-violet-100">{tx.student.hubSub}</p>
      </header>

      <div role="tablist" className="mt-5 flex gap-1 overflow-x-auto rounded-full bg-white p-1 shadow-sm ring-1 ring-slate-200">
        {TABS.map(({ id, Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setParams(id === 'roadmap' ? {} : { tab: id }, { replace: true })}
            className={`flex flex-1 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold transition ${
              tab === id ? 'bg-violet-700 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {tx.student.tabs[id]}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'roadmap' ? (
          <RoadmapTab />
        ) : error ? (
          <ErrorState onRetry={load} />
        ) : !scholarships || !universities ? (
          <Spinner label={tx.loading} />
        ) : tab === 'scholarships' ? (
          <ScholarshipsTab items={scholarships} />
        ) : tab === 'universities' ? (
          <UniversitiesTab items={universities} shortlist={shortlist} onAdd={shortlistOps.add} />
        ) : (
          <PlannerTab universities={universities} scholarships={scholarships} shortlist={shortlist} ops={shortlistOps} />
        )}
      </div>
    </div>
  );
}

/** What non-Student users see: what's inside, a blurred preview and the upgrade card. */
function StudentPaywall() {
  const { tx, lang } = useAppText();
  const { userId } = useAuth();
  const location = useLocation();
  const [counts, setCounts] = useState({ scholarships: 0, universities: 0 });
  useEffect(() => {
    backend.studentCounts().then(setCounts, () => undefined);
  }, []);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-violet-700 to-brand-800 p-6 text-white shadow-soft sm:p-10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-coral-400/25 blur-3xl" aria-hidden="true" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-bold">
            <GraduationCap className="h-4 w-4" aria-hidden="true" />
            {tx.student.badge}
          </span>
          <h1 className="mt-4 text-balance text-2xl font-extrabold leading-tight tracking-tight !text-white sm:text-4xl">{tx.student.lockTitle}</h1>
          <p className="mt-3 max-w-xl leading-relaxed text-violet-100">{tx.student.lockSub}</p>
          <ul className="mt-6 space-y-2.5">
            {tx.student.lockItems(counts.scholarships, counts.universities).map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-col items-start gap-2">
            {userId ? (
              <>
                <button type="button" disabled className="inline-flex cursor-not-allowed items-center gap-2 rounded-full bg-white px-6 py-3 font-bold text-violet-800 opacity-90">
                  <Crown className="h-5 w-5 text-amber-500" aria-hidden="true" />
                  {tx.student.lockCta}
                </button>
                <p className="text-sm text-violet-100">{tx.student.lockNote}</p>
              </>
            ) : (
              <Link to="/register" state={{ from: location.pathname }} className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-bold text-violet-800">
                {tx.student.lockGuest}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Preview: the roadmap's shape, without the content. */}
      <div className="relative mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm" aria-hidden="true">
        <div className="space-y-4 blur-[3px]">
          {ROADMAP[lang].map((phase) => (
            <div key={phase.when} className="flex items-center gap-4">
              <span className="w-32 shrink-0 text-sm font-bold text-violet-700">{phase.when}</span>
              <span className="h-3 flex-1 rounded-full bg-slate-200" />
              <span className="h-3 w-16 rounded-full bg-slate-100" />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-white/40">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-card">
            <Lock className="h-5 w-5 text-violet-700" />
          </span>
        </div>
      </div>
    </div>
  );
}

function RoadmapTab() {
  const { tx, lang } = useAppText();
  const { profile, setProfile } = useAuth();
  const done = profile?.roadmap ?? [];
  const count = done.length;

  const toggle = async (id: string) => {
    if (!profile) return;
    const next = done.includes(id) ? done.filter((x) => x !== id) : [...done, id];
    setProfile({ ...profile, roadmap: next }); // optimistic
    try {
      setProfile(await backend.updateProfile({ roadmap: next }));
    } catch (err) {
      console.error('[roadmap] save failed', err);
      setProfile(profile);
      alert(tx.saveError);
    }
  };

  return (
    <div>
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 font-bold text-slate-900">
            <ListChecks className="h-5 w-5 text-violet-600" aria-hidden="true" />
            {tx.student.progress(count, ROADMAP_STEP_COUNT)}
          </p>
          <span className="text-sm font-bold text-violet-700">{Math.round((count / ROADMAP_STEP_COUNT) * 100)}%</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-brand-600 transition-all" style={{ width: `${(count / ROADMAP_STEP_COUNT) * 100}%` }} />
        </div>
      </div>

      <ol className="relative mt-6 space-y-6 border-l-2 border-violet-100 pl-6 sm:pl-8">
        {ROADMAP[lang].map((phase, pi) => (
          <li key={phase.when} className="relative">
            <span className="absolute -left-[2.1rem] top-0 flex h-8 w-8 items-center justify-center rounded-full bg-violet-700 text-sm font-bold text-white ring-4 ring-slate-50 sm:-left-[2.6rem]">
              {pi + 1}
            </span>
            <p className="text-sm font-bold uppercase tracking-wide text-violet-700">{phase.when}</p>
            <h2 className="text-xl font-extrabold">{phase.title}</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {phase.steps.map((step) => {
                const on = done.includes(step.id);
                return (
                  <label
                    key={step.id}
                    className={`flex cursor-pointer gap-3 rounded-2xl border bg-white p-4 shadow-sm transition ${on ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200 hover:border-violet-200'}`}
                  >
                    <input type="checkbox" checked={on} onChange={() => toggle(step.id)} className="mt-1 h-5 w-5 shrink-0 accent-violet-600" />
                    <span>
                      <span className={`block font-bold ${on ? 'text-slate-500 line-through' : 'text-slate-900'}`}>{step.title}</span>
                      <span className="mt-1 block text-sm leading-relaxed text-slate-600">{step.text}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function LevelChips({ value, onChange }: { value: StudyLevel | ''; onChange: (v: StudyLevel | '') => void }) {
  const { tx, lang } = useAppText();
  return (
    <div className="flex flex-wrap gap-2">
      <Chip on={value === ''} onClick={() => onChange('')}>
        {tx.student.allLevels}
      </Chip>
      {(Object.keys(LEVELS) as StudyLevel[]).map((l) => (
        <Chip key={l} on={value === l} onClick={() => onChange(l)}>
          {LEVELS[l][lang]}
        </Chip>
      ))}
    </div>
  );
}

function FieldSelect({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const { lang } = useAppText();
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={`${inputClass} sm:w-64`} aria-label={label}>
      <option value="">{label}</option>
      {Object.entries(FIELDS).map(([id, name]) => (
        <option key={id} value={id}>
          {name[lang]}
        </option>
      ))}
    </select>
  );
}

function Expandable({ children }: { children: ReactNode }) {
  const { tx } = useAppText();
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3">
      {open && <div className="space-y-3 border-t border-slate-100 pt-3 text-sm leading-relaxed text-slate-700">{children}</div>}
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-violet-700 hover:underline">
        {open ? tx.student.less : tx.student.more}
        <ChevronDown className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
    </div>
  );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5">{children}</p>
    </div>
  );
}

function ScholarshipCard({ s }: { s: Scholarship }) {
  const { tx, lang } = useAppText();
  return (
    <article className="flex flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-violet-700">{s.country}</p>
          <h3 className="mt-0.5 font-bold leading-snug text-slate-900">{s.name}</h3>
          <p className="text-sm text-slate-500">{s.provider}</p>
        </div>
        {s.deadline && <DeadlineChip deadline={s.deadline} />}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {s.levels.map((l) => (
          <span key={l} className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-800">
            {LEVELS[l]?.[lang] ?? l}
          </span>
        ))}
      </div>
      <p className="mt-3 text-sm leading-relaxed text-slate-700">{s.coverage}</p>
      <p className="mt-2 text-sm font-semibold text-slate-800">
        {tx.student.deadline}: <span className="font-normal text-slate-600">{s.deadline_note}</span>
      </p>
      <Expandable>
        <Detail label={tx.student.eligibility}>{s.eligibility}</Detail>
        <Detail label={tx.student.howToApply}>{s.how_to_apply}</Detail>
        <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-bold text-brand-700 hover:underline">
          {tx.student.officialPage}
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </a>
      </Expandable>
    </article>
  );
}

function ScholarshipsTab({ items }: { items: Scholarship[] }) {
  const { tx } = useAppText();
  const [level, setLevel] = useState<StudyLevel | ''>('');
  const [field, setField] = useState('');
  const shown = items.filter((s) => (!level || s.levels.includes(level)) && (!field || s.fields.length === 0 || s.fields.includes(field)));
  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <LevelChips value={level} onChange={setLevel} />
        <FieldSelect value={field} onChange={setField} label={tx.student.allFields} />
      </div>
      {shown.length === 0 ? (
        <p className="mt-6 rounded-3xl border border-dashed border-slate-300 py-12 text-center text-slate-500">{tx.student.noResults}</p>
      ) : (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {shown.map((s) => (
            <ScholarshipCard key={s.id} s={s} />
          ))}
        </div>
      )}
      <p className="mt-6 text-center text-xs text-slate-500">{tx.student.disclaimer}</p>
    </div>
  );
}

function UniversityCard({ u, onList, onAdd, extra }: { u: University; onList: boolean; onAdd: () => void; extra?: ReactNode }) {
  const { tx, lang } = useAppText();
  const tuition =
    u.tuition_min_eur !== null && u.tuition_max_eur !== null && u.tuition_min_eur !== u.tuition_max_eur
      ? `${eur(u.tuition_min_eur)} – ${eur(u.tuition_max_eur)}`
      : u.tuition_min_eur !== null || u.tuition_max_eur !== null
        ? eur((u.tuition_min_eur ?? u.tuition_max_eur)!)
        : tx.student.unknown;
  const fee = u.app_fee_eur === null ? tx.student.unknown : u.app_fee_eur === 0 ? tx.student.free : `~${eur(u.app_fee_eur)}`;
  return (
    <article className="flex flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-brand-700">
            {u.city ? `${u.city}, ` : ''}
            {u.country}
          </p>
          <h3 className="mt-0.5 font-bold leading-snug text-slate-900">{u.name}</h3>
          <p className="text-sm text-slate-500">{u.language}</p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          disabled={onList}
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition ${
            onList ? 'bg-emerald-50 text-emerald-700' : 'bg-violet-50 text-violet-800 hover:bg-violet-100'
          }`}
        >
          {onList ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Plus className="h-3.5 w-3.5" aria-hidden="true" />}
          {onList ? tx.student.inShortlist : tx.student.addShortlist}
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {u.fields.map((f) => (
          <span key={f} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
            {FIELDS[f]?.[lang] ?? f}
          </span>
        ))}
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
        <div className="rounded-xl bg-slate-50 p-2.5">
          <dt className="text-xs font-semibold text-slate-500">{tx.student.tuition}</dt>
          <dd className="font-bold text-slate-900">
            {tuition}
            {(u.tuition_min_eur ?? u.tuition_max_eur) !== null && <span className="font-medium text-slate-500">{tx.student.perYear}</span>}
          </dd>
        </div>
        <div className="rounded-xl bg-slate-50 p-2.5">
          <dt className="text-xs font-semibold text-slate-500">{tx.student.appFee}</dt>
          <dd className="font-bold text-slate-900">{fee}</dd>
        </div>
        <div className="rounded-xl bg-slate-50 p-2.5">
          <dt className="text-xs font-semibold text-slate-500">{tx.student.living}</dt>
          <dd className="font-bold text-slate-900">
            {u.living_eur_month ? (
              <>
                ~{eur(u.living_eur_month)}
                <span className="font-medium text-slate-500">{tx.student.perMonth}</span>
              </>
            ) : (
              '—'
            )}
          </dd>
        </div>
      </dl>
      {extra}
      <Expandable>
        <Detail label={tx.student.tuition}>{u.tuition_note}</Detail>
        <Detail label={tx.student.appFee}>{u.app_fee_note}</Detail>
        {u.exams && <Detail label={tx.student.exams}>{u.exams}</Detail>}
        <Detail label={tx.student.requirements}>
          {u.min_ielts !== null && <strong>{tx.student.minIelts(u.min_ielts)}. </strong>}
          {u.requirements}
        </Detail>
        <Detail label={tx.student.deadline}>{u.deadline_note}</Detail>
        {u.scholarships_note && <Detail label={tx.student.scholarshipsNote}>{u.scholarships_note}</Detail>}
        <a href={u.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-bold text-brand-700 hover:underline">
          {tx.student.officialPage}
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </a>
      </Expandable>
    </article>
  );
}

function UniversitiesTab({ items, shortlist, onAdd }: { items: University[]; shortlist: ShortlistItem[]; onAdd: (id: string) => void }) {
  const { tx } = useAppText();
  const [level, setLevel] = useState<StudyLevel | ''>('');
  const [field, setField] = useState('');
  const [country, setCountry] = useState('');
  const countries = useMemo(() => [...new Set(items.map((u) => u.country))].sort((a, b) => a.localeCompare(b, 'az')), [items]);
  const shown = items.filter((u) => (!level || u.levels.includes(level)) && (!field || u.fields.includes(field)) && (!country || u.country === country));
  return (
    <div>
      <div className="flex flex-col gap-3">
        <LevelChips value={level} onChange={setLevel} />
        <div className="flex flex-col gap-2 sm:flex-row">
          <FieldSelect value={field} onChange={setField} label={tx.student.allFields} />
          <select value={country} onChange={(e) => setCountry(e.target.value)} className={`${inputClass} sm:w-56`} aria-label={tx.student.allCountries}>
            <option value="">{tx.student.allCountries}</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>
      {shown.length === 0 ? (
        <p className="mt-6 rounded-3xl border border-dashed border-slate-300 py-12 text-center text-slate-500">{tx.student.noResults}</p>
      ) : (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {shown.map((u) => (
            <UniversityCard key={u.id} u={u} onList={shortlist.some((x) => x.university_id === u.id)} onAdd={() => onAdd(u.id)} />
          ))}
        </div>
      )}
      <p className="mt-6 text-center text-xs text-slate-500">{tx.student.disclaimer}</p>
    </div>
  );
}

const IELTS_STEPS = [0, 5, 5.5, 6, 6.5, 7, 7.5, 8];

function PlannerTab({
  universities,
  scholarships,
  shortlist,
  ops,
}: {
  universities: University[];
  scholarships: Scholarship[];
  shortlist: ShortlistItem[];
  ops: { add: (id: string) => void; remove: (id: string) => void; status: (id: string, s: ShortlistStatus) => void };
}) {
  const { tx, lang } = useAppText();
  const [level, setLevel] = useState<StudyLevel>('master');
  const [field, setField] = useState('');
  const [ielts, setIelts] = useState(0);
  const [budget, setBudget] = useState(12000);

  const matches = universities
    .filter((u) => u.levels.includes(level) && (!field || u.fields.includes(field)))
    .map((u) => ({ u, cost: yearlyCost(u) }))
    .sort((a, b) => (a.cost ?? Infinity) - (b.cost ?? Infinity));
  const scholarshipMatches = scholarships.filter((s) => s.levels.includes(level) && (!field || s.fields.length === 0 || s.fields.includes(field)));
  const listed = shortlist.map((item) => ({ item, u: universities.find((u) => u.id === item.university_id) })).filter((x): x is { item: ShortlistItem; u: University } => !!x.u);
  const feesTotal = listed.reduce((sum, { u }) => sum + (u.app_fee_eur ?? 0), 0);
  const costs = listed.map(({ u }) => yearlyCost(u)).filter((c): c is number => c !== null);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-extrabold">
            <Calculator className="h-5 w-5 text-violet-600" aria-hidden="true" />
            {tx.student.plannerTitle}
          </h2>
          <p className="mt-1 text-sm text-slate-600">{tx.student.plannerSub}</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-800">
              {tx.student.level}
              <select value={level} onChange={(e) => setLevel(e.target.value as StudyLevel)} className={`${inputClass} mt-1.5`}>
                {(['bachelor', 'master'] as const).map((l) => (
                  <option key={l} value={l}>
                    {LEVELS[l][lang]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold text-slate-800">
              {tx.student.field}
              <div className="mt-1.5">
                <FieldSelect value={field} onChange={setField} label={tx.student.anyField} />
              </div>
            </label>
            <label className="block text-sm font-semibold text-slate-800">
              {tx.student.ielts}
              <select value={ielts} onChange={(e) => setIelts(Number(e.target.value))} className={`${inputClass} mt-1.5`}>
                {IELTS_STEPS.map((n) => (
                  <option key={n} value={n}>
                    {n === 0 ? tx.student.noIelts : n.toFixed(1)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold text-slate-800">
              {tx.student.budget}: <span className="text-violet-700">{eur(budget)}</span>
              <input type="range" min={2000} max={45000} step={1000} value={budget} onChange={(e) => setBudget(Number(e.target.value))} className="mt-3 w-full accent-violet-600" />
            </label>
          </div>
        </section>

        <h3 className="mt-6 text-lg font-extrabold">{tx.student.matchesTitle(matches.length)}</h3>
        {matches.length === 0 ? (
          <p className="mt-3 rounded-3xl border border-dashed border-slate-300 py-10 text-center text-slate-500">{tx.student.noResults}</p>
        ) : (
          <div className="mt-3 grid gap-4">
            {matches.map(({ u, cost }) => {
              const ieltsShort = u.min_ielts !== null && ielts > 0 && ielts < u.min_ielts;
              const fits = cost !== null && cost <= budget;
              return (
                <UniversityCard
                  key={u.id}
                  u={u}
                  onList={shortlist.some((x) => x.university_id === u.id)}
                  onAdd={() => ops.add(u.id)}
                  extra={
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-semibold text-slate-700">
                        {tx.student.yearCost}: {cost === null ? tx.student.unknown : `~${eur(cost)}`}
                      </span>
                      {cost !== null && (
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${fits ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>
                          {fits ? tx.student.fitsBudget : tx.student.overBudget}
                        </span>
                      )}
                      {ieltsShort && <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700">{tx.student.needIelts(u.min_ielts!)}</span>}
                    </div>
                  }
                />
              );
            })}
          </div>
        )}
      </div>

      <aside className="space-y-6">
        <section className="rounded-3xl border border-violet-200 bg-violet-50/50 p-5">
          <h3 className="flex items-center gap-2 font-extrabold text-violet-950">
            <ListChecks className="h-5 w-5" aria-hidden="true" />
            {tx.student.shortlistTitle}
          </h3>
          {listed.length === 0 ? (
            <p className="mt-2 text-sm text-violet-900/80">{tx.student.shortlistEmpty}</p>
          ) : (
            <>
              <ul className="mt-3 space-y-2">
                {listed.map(({ item, u }) => (
                  <li key={u.id} className="rounded-2xl bg-white p-3 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold leading-snug text-slate-900">{u.name}</p>
                      <button type="button" onClick={() => ops.remove(u.id)} aria-label={tx.student.remove} title={tx.student.remove} className="shrink-0 rounded-full p-1 text-slate-400 hover:text-rose-600">
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                    <select
                      value={item.status}
                      onChange={(e) => ops.status(u.id, e.target.value as ShortlistStatus)}
                      className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
                      aria-label={tx.detail.status}
                    >
                      {(Object.keys(tx.student.statuses) as ShortlistStatus[]).map((s) => (
                        <option key={s} value={s}>
                          {tx.student.statuses[s]}
                        </option>
                      ))}
                    </select>
                  </li>
                ))}
              </ul>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-violet-900/80">{tx.student.feesTotal}</dt>
                  <dd className="font-bold text-violet-950">~{eur(feesTotal)}</dd>
                </div>
                {costs.length > 0 && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-violet-900/80">{tx.student.firstYear}</dt>
                    <dd className="font-bold text-violet-950">
                      {Math.min(...costs) === Math.max(...costs) ? `~${eur(costs[0])}` : `~${eur(Math.min(...costs))} – ${eur(Math.max(...costs))}`}
                    </dd>
                  </div>
                )}
              </dl>
            </>
          )}
        </section>

        <section>
          <h3 className="flex items-center gap-2 font-extrabold">
            <Coins className="h-5 w-5 text-violet-600" aria-hidden="true" />
            {tx.student.scholarshipsFor}
          </h3>
          <ul className="mt-3 space-y-2">
            {scholarshipMatches.map((s) => (
              <li key={s.id} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-bold text-slate-900 hover:text-brand-700">
                  {s.name}
                </a>
                <p className="text-xs text-slate-500">{s.country}</p>
                <p className="mt-1 text-xs text-slate-600">{s.deadline_note}</p>
              </li>
            ))}
          </ul>
        </section>
      </aside>
    </div>
  );
}
