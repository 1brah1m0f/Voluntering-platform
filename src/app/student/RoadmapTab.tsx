import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import { backend } from '../backend';
import { useAuth } from '../AuthContext';
import { useAppText } from '../text';
import type { AutoStep } from './logic';
import { ROADMAP, STEP_LINKS, type StudentTab } from './roadmap';

/**
 * The 16 steps in four phases. One phase is shown at a time (the current one
 * first). Most steps tick themselves from what the student does in the app;
 * only the rest (documents, letters, visa…) are ticked by hand.
 */
export function RoadmapTab({ auto, done, savedCount, goTab }: { auto: Record<string, AutoStep>; done: string[]; savedCount: number; goTab: (tab: StudentTab) => void }) {
  const { tx, lang } = useAppText();
  const { profile, setProfile } = useAuth();
  const phases = ROADMAP[lang];
  // The first phase with open steps is where the student is now.
  const current = Math.max(0, phases.findIndex((p) => p.steps.some((st) => !done.includes(st.id))));
  const [picked, setPicked] = useState<number | null>(null);
  const shown = picked ?? current;
  const phase = phases[shown];

  const toggle = async (id: string) => {
    if (!profile) return;
    const manual = profile.roadmap ?? [];
    const next = manual.includes(id) ? manual.filter((x) => x !== id) : [...manual, id];
    setProfile({ ...profile, roadmap: next }); // optimistic
    try {
      setProfile(await backend.updateProfile({ roadmap: next }));
    } catch (err) {
      console.error('[roadmap] save failed', err);
      setProfile(profile);
      alert(tx.saveError);
    }
  };

  // Open steps first, finished ones after them.
  const steps = [...phase.steps].sort((a, b) => Number(done.includes(a.id)) - Number(done.includes(b.id)));

  return (
    <div className="space-y-6">
      {/* Phase picker: a short timeline with each phase's progress. */}
      <ol className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {phases.map((p, i) => {
          const n = p.steps.filter((st) => done.includes(st.id)).length;
          const complete = n === p.steps.length;
          return (
            <li key={p.when}>
              <button
                type="button"
                onClick={() => setPicked(i)}
                aria-pressed={shown === i}
                className={`flex h-full w-full flex-col gap-2 rounded-2xl border p-4 text-left transition ${shown === i ? 'border-brand-900 bg-brand-900 text-white' : 'border-line bg-white hover:border-brand-200'}`}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${
                      complete ? 'bg-brand-700 text-white' : i === current ? 'bg-coral-700 text-white' : shown === i ? 'bg-brand-800 text-white' : 'bg-paper text-slate-600'
                    }`}
                  >
                    {complete ? <Check className="h-4 w-4" strokeWidth={2.6} aria-hidden="true" /> : i + 1}
                  </span>
                  <span className={`truncate text-xs font-bold uppercase tracking-wide ${shown === i ? 'text-brand-100' : 'text-brand-700'}`}>{p.when}</span>
                </span>
                <span className="font-display text-lg font-bold leading-tight">{p.title}</span>
                <span className="mt-auto flex items-center gap-2">
                  <span className={`h-1.5 flex-1 overflow-hidden rounded-full ${shown === i ? 'bg-brand-800' : 'bg-paper'}`} aria-hidden="true">
                    <span className={`block h-full rounded-full ${shown === i ? 'bg-coral-200' : 'bg-brand-700'}`} style={{ width: `${(n / p.steps.length) * 100}%` }} />
                  </span>
                  <span className={`text-xs font-semibold ${shown === i ? 'text-brand-100' : 'text-slate-500'}`}>
                    {n}/{p.steps.length}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <section className="rounded-3xl border border-line bg-white p-5 sm:p-7" aria-labelledby="phase-title">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="phase-title" className="text-2xl font-extrabold">
            {phase.title}
          </h2>
          {shown === current && <span className="rounded-full bg-coral-50 px-2.5 py-1 text-xs font-bold text-coral-800">{tx.student.youAreHere}</span>}
        </div>
        <ul className="mt-4 divide-y divide-line/70">
          {steps.map((step) => {
            const isDone = done.includes(step.id);
            const a = auto[step.id];
            const link = STEP_LINKS[step.id];
            return (
              <li key={step.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                {a ? (
                  // Ticked by the app, not by hand.
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${isDone ? 'bg-brand-700 text-white' : 'border-2 border-dashed border-slate-300'}`}
                    aria-hidden="true"
                  >
                    {isDone && <Check className="h-4 w-4" strokeWidth={2.6} aria-hidden="true" />}
                  </span>
                ) : (
                  <input type="checkbox" checked={isDone} onChange={() => toggle(step.id)} aria-label={step.title} className="mt-0.5 h-6 w-6 shrink-0 cursor-pointer accent-brand-700" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className={`text-base font-bold ${isDone ? 'text-slate-500 line-through decoration-slate-400' : 'text-ink'}`}>
                      {isDone && a && <span className="sr-only">✓ </span>}
                      {step.title}
                    </h3>
                    {a && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-800">
                        <Sparkles className="h-3 w-3" aria-hidden="true" />
                        {tx.student.auto}
                        {a.progress && !isDone && ` · ${a.progress[0]}/${a.progress[1]}`}
                      </span>
                    )}
                  </div>
                  {!isDone && (
                    <>
                      <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-600">{step.text}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                        {link &&
                          ('tab' in link ? (
                            <button type="button" onClick={() => goTab(link.tab)} className="inline-flex items-center gap-1 text-sm font-bold text-brand-700 hover:text-brand-900">
                              {tx.student.tabs[link.tab]}
                              <ArrowRight className="h-4 w-4" aria-hidden="true" />
                            </button>
                          ) : (
                            <Link to={link.to} className="inline-flex items-center gap-1 text-sm font-bold text-brand-700 hover:text-brand-900">
                              {tx.student.open}
                              <ArrowRight className="h-4 w-4" aria-hidden="true" />
                            </Link>
                          ))}
                        <span className="text-xs text-slate-500">{a ? tx.student.autoHint[step.id] : tx.student.manualHint}</span>
                        {step.id === 'scholarships' && savedCount > 0 && <span className="text-xs font-semibold text-slate-500">{tx.student.savedCount(savedCount)}</span>}
                      </div>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        {shown < phases.length - 1 && (
          <button type="button" onClick={() => setPicked(shown + 1)} className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-brand-700 hover:text-brand-900">
            {phases[shown + 1].title}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </section>
    </div>
  );
}
