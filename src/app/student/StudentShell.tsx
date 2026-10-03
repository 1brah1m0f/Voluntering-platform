import { useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Calculator, GraduationCap, Landmark, LogOut, Map as MapIcon, School, Sparkles, type LucideIcon } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { backend } from '../backend';
import { BRAND } from '../../config';
import { Logo } from '../../components/Icons';
import { hasStudent } from '../plans';
import { useAppText } from '../text';
import { ErrorState, Spinner } from '../ui';
import { AiTab, type AiMode } from './AiTab';
import { CompareSheet } from './CompareSheet';
import { ScholarshipSheet, UniversitySheet } from './DetailSheet';
import { autoSteps, roadmapDone } from './logic';
import { Paywall } from './Paywall';
import { PlanTab } from './PlanTab';
import { RoadmapTab } from './RoadmapTab';
import { ROADMAP, ROADMAP_STEP_COUNT, type StudentTab } from './roadmap';
import { ScholarshipsTab } from './ScholarshipsTab';
import { MAX_COMPARE, UniversitiesTab } from './UniversitiesTab';
import { useStudentData } from './useStudentData';

const TABS: { id: StudentTab; Icon: LucideIcon }[] = [
  { id: 'roadmap', Icon: MapIcon },
  { id: 'scholarships', Icon: Landmark },
  { id: 'universities', Icon: School },
  { id: 'plan', Icon: Calculator },
  { id: 'ai', Icon: Sparkles },
];

// Filters that belong to one list; switching tabs starts the next list clean.
const LIST_PARAMS = ['q', 'level', 'field', 'country', 'open', 'fit', 'sort', 'mode'];

/**
 * /student — the Student plan (7 ₼). State lives in the URL so links can be
 * shared and the back button works: ?tab=, list filters, ?sch= / ?uni= for an
 * open details panel, ?compare=id,id for the comparison and ?view=compare.
 * The catalogue is protected in the database (RLS); other plans see the paywall.
 */
export default function StudentPage() {
  const { tx, lang } = useAppText();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const allowed = hasStudent(profile);
  const data = useStudentData(allowed);

  const rawTab = params.get('tab');
  // "planner" is the old name of the "My plan" tab.
  const tab: StudentTab = rawTab === 'planner' ? 'plan' : TABS.some((t) => t.id === rawTab) ? (rawTab as StudentTab) : 'roadmap';

  const update = (patch: Record<string, string | null>, push = false) =>
    setParams(
      (cur) => {
        const next = new URLSearchParams(cur);
        for (const [k, v] of Object.entries(patch)) {
          if (v === null) next.delete(k);
          else next.set(k, v);
        }
        return next;
      },
      { replace: !push },
    );

  const goTab = (t: StudentTab, extra: Record<string, string> = {}) => {
    const patch: Record<string, string | null> = { tab: t === 'roadmap' ? null : t, sch: null, uni: null, view: null };
    for (const k of LIST_PARAMS) patch[k] = extra[k] ?? null;
    update(patch);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Panels opened here add a history entry, so the back button closes them and
  // our close button goes back too. A panel opened from a shared link has no
  // entry to go back to, so it just drops its parameter.
  const pushed = useRef(false);
  const sheetParams = ['sch', 'uni', 'view'];
  const anySheet = sheetParams.some((k) => params.get(k));
  useEffect(() => {
    if (!anySheet) pushed.current = false;
  }, [anySheet]);
  const openSheet = (patch: Record<string, string>) => {
    pushed.current = true;
    update(patch, true);
  };
  const closeSheet = (key: string) => {
    if (pushed.current) navigate(-1);
    else update({ [key]: null });
  };

  const compare = (params.get('compare') ?? '').split(',').filter(Boolean).slice(0, MAX_COMPARE);
  const toggleCompare = (id: string) => {
    const next = compare.includes(id) ? compare.filter((x) => x !== id) : compare.length < MAX_COMPARE ? [...compare, id] : compare;
    update({ compare: next.length ? next.join(',') : null, ...(next.length < 2 ? { view: null } : {}) });
  };

  if (!allowed) return <Paywall />;

  const auto = autoSteps({ prefs: data.prefs, shortlist: data.shortlist, saved: data.saved });
  const done = roadmapDone(profile?.roadmap ?? [], auto);
  const steps = ROADMAP[lang].flatMap((p) => p.steps);
  const nextStep = steps.find((st) => !done.includes(st.id));
  const ready = !!data.scholarships && !!data.universities;
  const openSch = data.scholarships?.find((s) => s.id === params.get('sch')) ?? null;
  const openUni = data.universities?.find((u) => u.id === params.get('uni')) ?? null;
  const compareUnis = compare.map((id) => data.universities?.find((u) => u.id === id)).filter((u) => !!u);
  const needPrefs = () => goTab('plan');
  const logout = async () => {
    await backend.signOut();
    navigate('/student/login', { replace: true });
  };

  return (
    <div className="min-h-screen">
      <div className="mb-5 flex items-center justify-between rounded-2xl border border-line bg-white px-4 py-3 shadow-sm sm:px-5">
        <Link to="/student" className="flex items-center gap-2 font-display text-lg font-extrabold tracking-tight text-ink">
          <Logo className="h-7 w-7" />
          {BRAND} <span className="hidden text-sm font-bold text-brand-700 sm:inline">Student</span>
        </Link>
        <button type="button" onClick={logout} className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-rose-50 hover:text-rose-700">
          <LogOut className="h-4 w-4" aria-hidden="true" />
          {tx.nav.logout}
        </button>
      </div>
      {tab === 'roadmap' ? (
        <header className="relative overflow-hidden rounded-[2rem] bg-brand-900 p-6 text-white shadow-soft sm:p-8 lg:flex lg:items-end lg:justify-between lg:gap-8 lg:p-10">
          {/* The sun and ring from the logo. Decorative. */}
          <span className="pointer-events-none absolute -top-32 right-8 hidden h-60 w-60 rounded-full bg-coral-500/90 md:block lg:right-80" aria-hidden="true" />
          <span className="pointer-events-none absolute -bottom-40 -left-24 h-72 w-72 rounded-full border-[22px] border-brand-800" aria-hidden="true" />
          <div className="relative max-w-xl">
            <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-brand-200">
              <GraduationCap className="h-4 w-4" aria-hidden="true" />
              Openly {tx.student.title}
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight !text-white sm:text-5xl">{tx.student.hubTitle}</h1>
            <p className="mt-2 leading-relaxed text-brand-100 sm:text-lg">{tx.student.hubSub}</p>
          </div>
          <button
            type="button"
            onClick={() => goTab('roadmap')}
            className="relative mt-6 block w-full rounded-2xl border border-brand-700 bg-brand-800 p-4 text-left transition hover:border-brand-600 sm:p-5 lg:mt-0 lg:w-96 lg:shrink-0"
          >
            <span className="flex items-baseline justify-between gap-3">
              <span className="font-bold text-white">{tx.student.progress(done.length, ROADMAP_STEP_COUNT)}</span>
              <span className="font-display text-2xl font-extrabold text-coral-200">{Math.round((done.length / ROADMAP_STEP_COUNT) * 100)}%</span>
            </span>
            <span className="mt-3 grid gap-1" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }} aria-hidden="true">
              {steps.map((st) => (
                <span key={st.id} className={`h-2 rounded-full transition-colors ${done.includes(st.id) ? 'bg-coral-200' : 'bg-brand-700'}`} />
              ))}
            </span>
            <span className="mt-3 block text-sm text-brand-100">
              {nextStep ? (
                <>
                  {tx.student.nextUp}: <strong className="text-white">{nextStep.title}</strong>
                </>
              ) : (
                tx.student.allDone
              )}
            </span>
          </button>
        </header>
      ) : (
        // Other tabs keep the page for their content: a one-line title and the progress.
        <header className="rounded-[2rem] border border-line bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-700">
              <GraduationCap className="h-4 w-4" aria-hidden="true" />
              Openly {tx.student.title}
            </p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">{tx.student.tabs[tab]}</h1>
          </div>
          <button
            type="button"
            onClick={() => goTab('roadmap')}
            className="inline-flex items-center gap-3 rounded-full border border-line bg-white py-2 pl-4 pr-3 text-sm font-semibold text-slate-700 transition hover:border-brand-200"
          >
            {tx.student.progress(done.length, ROADMAP_STEP_COUNT)}
            <span className="h-1.5 w-20 overflow-hidden rounded-full bg-paper" aria-hidden="true">
              <span className="block h-full rounded-full bg-brand-700" style={{ width: `${(done.length / ROADMAP_STEP_COUNT) * 100}%` }} />
            </span>
          </button>
          </div>
        </header>
      )}

      <div role="tablist" aria-label={tx.student.hubTitle} className="sticky top-[3.6rem] z-30 -mx-4 mt-5 flex gap-1 overflow-x-auto border-y border-line bg-white/95 p-1 shadow-sm backdrop-blur sm:static sm:mx-0 sm:grid sm:grid-cols-5 sm:rounded-full sm:border sm:shadow-none">
        {TABS.map(({ id, Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => goTab(id)}
            className={`flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2.5 text-sm font-semibold transition sm:min-w-0 sm:px-3 ${
              tab === id ? 'bg-brand-900 text-white' : 'text-slate-600 hover:text-ink'
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span className="sm:truncate">{tx.student.tabs[id]}</span>
          </button>
        ))}
      </div>

      <div className="mt-8">
        {tab === 'roadmap' ? (
          <RoadmapTab auto={auto} done={done} savedCount={data.saved.length} goTab={goTab} />
        ) : data.error ? (
          <ErrorState onRetry={data.load} />
        ) : !ready ? (
          <Spinner label={tx.loading} />
        ) : tab === 'scholarships' ? (
          <ScholarshipsTab data={data} params={params} update={update} onOpen={(id) => openSheet({ sch: id })} onNeedPrefs={needPrefs} />
        ) : tab === 'universities' ? (
          <UniversitiesTab
            data={data}
            params={params}
            update={update}
            compare={compare}
            onToggleCompare={toggleCompare}
            onOpenCompare={() => openSheet({ view: 'compare' })}
            onOpen={(id) => openSheet({ uni: id })}
            onNeedPrefs={needPrefs}
          />
        ) : tab === 'ai' ? (
          <AiTab
            data={data}
            mode={(['plan', 'ask', 'review'] as const).find((m) => m === params.get('mode')) ?? 'plan'}
            setMode={(m: AiMode) => update({ mode: m === 'plan' ? null : m })}
            open={(t) => openSheet(t.kind === 'scholarship' ? { sch: t.id } : { uni: t.id })}
            goTab={goTab}
          />
        ) : (
          <PlanTab data={data} goTab={goTab} openScholarship={(id) => openSheet({ sch: id })} openUniversity={(id) => openSheet({ uni: id })} />
        )}
      </div>

      <CompareSheet
        open={params.get('view') === 'compare' && compareUnis.length >= 2}
        unis={compareUnis}
        data={data}
        onRemove={toggleCompare}
        onOpen={(id) => openSheet({ uni: id })}
        onClose={() => closeSheet('view')}
      />
      <ScholarshipSheet s={openSch} data={data} onClose={() => closeSheet('sch')} />
      <UniversitySheet
        u={openUni}
        data={data}
        comparing={!!openUni && compare.includes(openUni.id)}
        compareFull={compare.length >= MAX_COMPARE}
        onToggleCompare={() => openUni && toggleCompare(openUni.id)}
        onClose={() => closeSheet('uni')}
      />
    </div>
  );
}
