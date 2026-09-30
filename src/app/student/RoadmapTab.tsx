import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import { backend } from '../backend';
import { useAuth } from '../AuthContext';
import { useAppText } from '../text';
import { ROADMAP, STEP_LINKS, type StudentTab } from './roadmap';

/** The 16 steps in four phases, left to right on desktop. Open steps link to the tool that helps with them. */
export function RoadmapTab({ savedCount, goTab }: { savedCount: number; goTab: (tab: StudentTab) => void }) {
  const { tx, lang } = useAppText();
  const { profile, setProfile } = useAuth();
  const done = profile?.roadmap ?? [];
  const phases = ROADMAP[lang];
  // The first phase with unticked steps is where the user is now.
  const current = phases.findIndex((p) => p.steps.some((st) => !done.includes(st.id)));

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

  const linkClass = 'inline-flex min-h-[2.25rem] items-center gap-1 text-sm font-bold text-brand-700 hover:text-brand-900';

  return (
    <div className="relative">
      {/* Desktop: the four phases read left to right along a dashed timeline. */}
      <span className="pointer-events-none absolute inset-x-6 top-[1.3rem] hidden border-t-2 border-dashed border-line lg:block" aria-hidden="true" />
      <ol className="relative grid gap-10 lg:grid-cols-4 lg:gap-5">
        {phases.map((phase, pi) => {
          const n = phase.steps.filter((st) => done.includes(st.id)).length;
          const state = n === phase.steps.length ? 'done' : pi === current ? 'current' : 'future';
          return (
            <li key={phase.when} className="flex flex-col gap-4">
              <div className="flex h-11 items-center gap-2.5">
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-display text-lg font-extrabold ring-[6px] ring-paper ${
                    state === 'done' ? 'bg-brand-700 text-white' : state === 'current' ? 'bg-coral-700 text-white' : 'border-2 border-slate-300 bg-white text-slate-600'
                  }`}
                >
                  {state === 'done' ? <Check className="h-5 w-5" strokeWidth={2.6} aria-hidden="true" /> : pi + 1}
                </span>
                {state === 'current' && <span className="rounded-full bg-coral-50 px-2.5 py-1 text-xs font-bold text-coral-800">{tx.student.youAreHere}</span>}
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-brand-700">{phase.when}</p>
                <h2 className="mt-1 text-2xl font-extrabold leading-tight">{phase.title}</h2>
                <p className="mt-1 text-sm text-slate-500">{tx.student.phaseDone(n, phase.steps.length)}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {phase.steps.map((step) => {
                  const on = done.includes(step.id);
                  const link = STEP_LINKS[step.id];
                  return (
                    <div key={step.id} className={`rounded-2xl border p-4 transition ${on ? 'border-brand-100 bg-brand-50/60' : 'border-line bg-white hover:border-brand-200'}`}>
                      <label className="flex cursor-pointer gap-3">
                        <input type="checkbox" checked={on} onChange={() => toggle(step.id)} className="mt-0.5 h-5 w-5 shrink-0 accent-brand-700" />
                        <span>
                          <span className={`block font-bold leading-snug ${on ? 'text-slate-500 line-through decoration-slate-400' : 'text-ink'}`}>{step.title}</span>
                          {/* Ticked steps fold down to their title. */}
                          {!on && <span className="mt-1.5 block text-sm leading-relaxed text-slate-600">{step.text}</span>}
                        </span>
                      </label>
                      {!on && link && (
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 pl-8">
                          {'tab' in link ? (
                            <button type="button" onClick={() => goTab(link.tab)} className={linkClass}>
                              {tx.student.tabs[link.tab]}
                              <ArrowRight className="h-4 w-4" aria-hidden="true" />
                            </button>
                          ) : (
                            <Link to={link.to} className={linkClass}>
                              {tx.student.open}
                              <ArrowRight className="h-4 w-4" aria-hidden="true" />
                            </Link>
                          )}
                          {step.id === 'scholarships' && savedCount > 0 && <span className="text-xs font-semibold text-slate-500">{tx.student.savedCount(savedCount)}</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
