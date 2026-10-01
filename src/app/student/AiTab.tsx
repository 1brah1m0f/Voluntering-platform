import { useState, type ReactNode } from 'react';
import { ArrowRight, CircleAlert, CircleCheck, CircleHelp, FileText, Info, ListChecks, MessageCircleQuestion, Route, Send, Sparkles } from 'lucide-react';
import { ErrorNote, Thinking, useAi, useAiReady } from '../AiTools';
import { useAuth } from '../AuthContext';
import { useAppText } from '../text';
import type { AiReview, AiStudentAnswer, AiStudentFit, AiStudentPlan, StudentTarget } from '../types';
import { inputClass } from '../ui';
import { formatDateTime } from '../util';
import { deadlineInfo, hasPrefs, yearlyCostRange } from './logic';
import type { StudentTab } from './roadmap';
import { DeadlineBadge, useCostText } from './ui';
import type { StudentData } from './useStudentData';

export type AiMode = 'plan' | 'ask' | 'review';
const MODES: { id: AiMode; Icon: typeof Route }[] = [
  { id: 'plan', Icon: Route },
  { id: 'ask', Icon: MessageCircleQuestion },
  { id: 'review', Icon: FileText },
];

type Open = (t: StudentTarget) => void;

/**
 * The AI advisor tab: a personal plan built from "My plan" and the catalogue,
 * questions and answers, and essay review. Runs on the shared AI edge function.
 */
export function AiTab({ data, mode, setMode, open, goTab }: { data: StudentData; mode: AiMode; setMode: (m: AiMode) => void; open: Open; goTab: (t: StudentTab) => void }) {
  const { tx } = useAppText();
  const ready = useAiReady(true);
  const ai = useAi();

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
      <div className="space-y-3 lg:sticky lg:top-6">
        <nav aria-label={tx.student.tabs.ai} className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
          {MODES.map(({ id, Icon }) => (
            <button
              key={id}
              type="button"
              aria-pressed={mode === id}
              onClick={() => setMode(id)}
              className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${mode === id ? 'border-brand-900 bg-brand-900 text-white' : 'border-line bg-white hover:border-brand-200'}`}
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${mode === id ? 'bg-brand-800 text-coral-200' : 'bg-brand-50 text-brand-700'}`}>
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block font-bold">{tx.student.aiModes[id]}</span>
                <span className={`mt-0.5 block text-sm leading-snug ${mode === id ? 'text-brand-100' : 'text-slate-600'}`}>{tx.student.aiModeDesc[id]}</span>
              </span>
            </button>
          ))}
        </nav>
        <p className="flex items-start gap-2 px-1 text-xs leading-relaxed text-slate-500">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-700" aria-hidden="true" />
          <span>
            {tx.student.aiSub}
            {ai.remaining !== null && <span className="mt-1 block font-semibold text-slate-600">{tx.ai.remaining(ai.remaining)}</span>}
          </span>
        </p>
      </div>

      <section className="min-w-0 rounded-3xl border border-line bg-white p-5 sm:p-7">
        {ready === false && (
          <p className="mb-5 flex items-start gap-2.5 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {tx.ai.comingSoon}
          </p>
        )}
        {mode === 'plan' ? (
          <PlanMode data={data} ai={ai} ready={ready !== false} open={open} goTab={goTab} />
        ) : mode === 'ask' ? (
          <AskMode data={data} ai={ai} ready={ready !== false} open={open} />
        ) : (
          <ReviewMode data={data} ai={ai} ready={ready !== false} />
        )}
      </section>
    </div>
  );
}

type Ai = ReturnType<typeof useAi>;

// ---------------------------------------------------------------------------
// Personal plan
// ---------------------------------------------------------------------------

/** The last plan is kept in this browser so reopening the tab doesn't spend a request. */
function useLastPlan() {
  const { userId } = useAuth();
  const key = `openly_ai_plan:${userId ?? 'guest'}`;
  const read = (): { at: string; plan: AiStudentPlan } | null => {
    try {
      return JSON.parse(localStorage.getItem(key) ?? 'null');
    } catch {
      return null;
    }
  };
  const [last, setLast] = useState(read);
  const save = (plan: AiStudentPlan) => {
    const next = { at: new Date().toISOString(), plan };
    setLast(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      /* storage blocked: kept for this visit only */
    }
  };
  return [last, save] as const;
}

function PlanMode({ data, ai, ready, open, goTab }: { data: StudentData; ai: Ai; ready: boolean; open: Open; goTab: (t: StudentTab) => void }) {
  const { tx, lang } = useAppText();
  const costText = useCostText();
  const [last, save] = useLastPlan();
  const build = async () => {
    const plan = await ai.run<AiStudentPlan>({ action: 'student_plan', lang });
    if (plan) save(plan);
  };
  const plan = last?.plan;
  // Only ids that exist in the catalogue are shown, whatever the model returned.
  const sch = (plan?.scholarships ?? []).flatMap((r) => {
    const s = data.scholarships?.find((x) => x.id === r.id);
    return s ? [{ s, why: r.why }] : [];
  });
  const uni = (plan?.universities ?? []).flatMap((r) => {
    const u = data.universities?.find((x) => x.id === r.id);
    return u ? [{ u, why: r.why }] : [];
  });

  return (
    <div className="space-y-6">
      <Intro title={tx.student.aiModes.plan} text={tx.student.aiPlanIntro} />
      {!hasPrefs(data.prefs) && (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border border-brand-100 bg-brand-50/70 px-4 py-3 text-sm font-medium text-brand-950">
          {tx.student.aiNeedPrefs}
          <button type="button" onClick={() => goTab('plan')} className="inline-flex items-center gap-1 font-bold text-brand-700 hover:underline">
            {tx.student.tabs.plan}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={build} disabled={!ready || ai.busy} className="btn-primary !py-2.5 text-sm">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          {plan ? tx.student.aiAgain : tx.student.aiPlanBtn}
        </button>
        {last && <span className="text-sm text-slate-500">{tx.student.aiLastPlan(formatDateTime(last.at, lang))}</span>}
      </div>
      {ai.busy && <Thinking />}
      <ErrorNote text={ai.error} />

      {plan && !ai.busy && (
        <div className="space-y-6">
          <p className="rounded-2xl bg-paper px-4 py-3 leading-relaxed text-ink">{plan.summary}</p>
          <div className="grid gap-4 xl:grid-cols-2">
            <Picks title={tx.student.aiRecSch}>
              {sch.map(({ s, why }) => (
                <Pick key={s.id} name={s.name} sub={s.country} why={why} onOpen={() => open({ kind: 'scholarship', id: s.id })}>
                  <DeadlineBadge info={deadlineInfo(s)} />
                </Pick>
              ))}
            </Picks>
            <Picks title={tx.student.aiRecUni}>
              {uni.map(({ u, why }) => (
                <Pick key={u.id} name={u.name} sub={[u.city, u.country].filter(Boolean).join(', ')} why={why} onOpen={() => open({ kind: 'university', id: u.id })}>
                  <span className="rounded-full bg-paper px-2.5 py-1 text-xs font-bold text-slate-700">
                    {tx.student.yearCost}: {costText(yearlyCostRange(u))}
                  </span>
                </Pick>
              ))}
            </Picks>
          </div>
          {plan.next_steps.length > 0 && (
            <div>
              <h3 className="text-lg font-bold">{tx.student.aiSteps}</h3>
              <ol className="mt-3 space-y-2 border-l-2 border-line pl-5">
                {plan.next_steps.map((st, i) => (
                  <li key={i} className="relative">
                    <span className="absolute -left-[1.6rem] top-1.5 h-3 w-3 rounded-full bg-brand-700 ring-[3px] ring-white" aria-hidden="true" />
                    <span className="text-xs font-bold uppercase tracking-wide text-brand-700">{st.when}</span>
                    <p className="leading-relaxed text-ink">{st.action}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}
          {plan.risks.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
              <h3 className="flex items-center gap-2 font-bold text-amber-900">
                <CircleAlert className="h-4 w-4" aria-hidden="true" />
                {tx.student.aiRisks}
              </h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-amber-950">
                {plan.risks.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Picks({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-line p-4">
      <h3 className="font-bold">{title}</h3>
      <ul className="mt-2 divide-y divide-line/70">{children}</ul>
    </div>
  );
}

function Pick({ name, sub, why, onOpen, children }: { name: string; sub: string; why: string; onOpen: () => void; children: ReactNode }) {
  return (
    <li className="py-3 first:pt-1 last:pb-0">
      <button type="button" onClick={onOpen} className="text-left font-bold text-ink hover:text-brand-700">
        {name}
      </button>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{sub}</p>
      <p className="mt-1 text-sm leading-relaxed text-slate-700">{why}</p>
      <div className="mt-2">{children}</div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Questions
// ---------------------------------------------------------------------------

function AskMode({ data, ai, ready, open }: { data: StudentData; ai: Ai; ready: boolean; open: Open }) {
  const { tx, lang } = useAppText();
  const [question, setQuestion] = useState('');
  const [thread, setThread] = useState<{ q: string; a: AiStudentAnswer }[]>([]);
  const ask = async (q: string) => {
    const text = q.trim();
    if (!text || ai.busy) return;
    setQuestion(text);
    const a = await ai.run<AiStudentAnswer>({ action: 'student_ask', lang, question: text });
    if (a) {
      setThread((cur) => [...cur, { q: text, a }]);
      setQuestion('');
    }
  };
  const nameOf = (t: StudentTarget) => (t.kind === 'scholarship' ? data.scholarships?.find((s) => s.id === t.id)?.name : data.universities?.find((u) => u.id === t.id)?.name);

  return (
    <div className="space-y-5">
      <Intro title={tx.student.aiModes.ask} text={tx.student.aiAskIntro} />
      {thread.length > 0 && (
        <ol className="space-y-5">
          {thread.map((t, i) => (
            <li key={i} className="space-y-3">
              <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-brand-900 px-4 py-2.5 text-white">
                <span className="sr-only">{tx.student.aiYou}: </span>
                {t.q}
              </p>
              <div className="max-w-[95%] rounded-2xl rounded-bl-md bg-paper px-4 py-3">
                <p className="whitespace-pre-line leading-relaxed text-ink">{t.a.answer}</p>
                {t.a.related.some((r) => nameOf(r)) && (
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{tx.student.aiRelated}:</span>
                    {t.a.related.map((r) => {
                      const name = nameOf(r);
                      return (
                        name && (
                          <button key={r.id} type="button" onClick={() => open(r)} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-brand-800 ring-1 ring-line hover:ring-brand-300">
                            {name}
                          </button>
                        )
                      );
                    })}
                  </div>
                )}
              </div>
              {i === thread.length - 1 && t.a.follow_up.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{tx.student.aiFollowUp}:</span>
                  {t.a.follow_up.map((f) => (
                    <button key={f} type="button" onClick={() => ask(f)} disabled={!ready || ai.busy} className="rounded-full border border-line px-3 py-1 text-sm font-semibold text-slate-700 hover:border-brand-300 hover:text-brand-800">
                      {f}
                    </button>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
      {ai.busy && <Thinking />}
      <ErrorNote text={ai.error} />
      {thread.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {tx.student.aiExamples.map((ex) => (
            <button key={ex} type="button" onClick={() => setQuestion(ex)} className="rounded-full border border-line px-3.5 py-1.5 text-left text-sm font-semibold text-slate-700 hover:border-brand-300 hover:text-brand-800">
              {ex}
            </button>
          ))}
        </div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void ask(question);
        }}
        className="flex items-end gap-2"
      >
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void ask(question);
            }
          }}
          rows={2}
          maxLength={600}
          placeholder={tx.student.aiAskPh}
          aria-label={tx.student.aiAskPh}
          className={`${inputClass} resize-none`}
        />
        <button type="submit" disabled={!ready || ai.busy || !question.trim()} className="btn-primary shrink-0 !px-4 !py-3" aria-label={tx.student.aiAskBtn}>
          <Send className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">{tx.student.aiAskBtn}</span>
        </button>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Essay review
// ---------------------------------------------------------------------------

function ReviewMode({ data, ai, ready }: { data: StudentData; ai: Ai; ready: boolean }) {
  const { tx, lang } = useAppText();
  const [target, setTarget] = useState('');
  const [text, setText] = useState('');
  const [review, setReview] = useState<AiReview | null>(null);
  const [short, setShort] = useState(false);
  const run = async () => {
    if (text.trim().length < 50) return setShort(true);
    setShort(false);
    const [kind, id] = target.split(':') as [StudentTarget['kind'], string];
    const r = await ai.run<AiReview>({ action: 'student_review', lang, text, ...(target ? { target: { kind, id } } : {}) });
    if (r) setReview(r);
  };
  const tone = review ? (review.score >= 7 ? 'bg-emerald-50 text-emerald-800' : review.score >= 5 ? 'bg-amber-50 text-amber-900' : 'bg-rose-50 text-rose-800') : '';

  return (
    <div className="space-y-5">
      <Intro title={tx.student.aiModes.review} text={tx.student.aiReviewIntro} />
      <label className="block text-sm font-semibold text-slate-800">
        {tx.student.aiReviewFor}
        <select value={target} onChange={(e) => setTarget(e.target.value)} className={`${inputClass} mt-1.5`}>
          <option value="">{tx.student.aiReviewGeneral}</option>
          <optgroup label={tx.student.tabs.scholarships}>
            {(data.scholarships ?? []).map((s) => (
              <option key={s.id} value={`scholarship:${s.id}`}>
                {s.name}
              </option>
            ))}
          </optgroup>
          <optgroup label={tx.student.tabs.universities}>
            {(data.universities ?? []).map((u) => (
              <option key={u.id} value={`university:${u.id}`}>
                {u.name}
              </option>
            ))}
          </optgroup>
        </select>
      </label>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={10} maxLength={12000} placeholder={tx.ai.reviewPh} aria-label={tx.ai.reviewPh} className={inputClass} />
      {short && <ErrorNote text={tx.ai.tooShort} />}
      <button type="button" onClick={run} disabled={!ready || ai.busy} className="btn-primary !py-2.5 text-sm">
        <ListChecks className="h-4 w-4" aria-hidden="true" />
        {tx.ai.reviewBtn}
      </button>
      {ai.busy && <Thinking />}
      <ErrorNote text={ai.error} />
      {review && !ai.busy && (
        <div className="space-y-5 border-t border-line pt-5">
          <div className="flex items-start gap-4">
            <span className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl ${tone}`}>
              <span className="font-display text-2xl font-extrabold leading-none">{review.score}</span>
              <span className="text-xs font-bold">/10</span>
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{tx.ai.score}</p>
              <p className="mt-1 leading-relaxed text-ink">{review.verdict}</p>
            </div>
          </div>
          <List title={tx.ai.strengths} items={review.strengths} Icon={CircleCheck} tone="text-emerald-700" />
          {review.issues.length > 0 && (
            <div>
              <h3 className="font-bold">{tx.ai.issues}</h3>
              <ul className="mt-2 space-y-3">
                {review.issues.map((it, i) => (
                  <li key={i} className="rounded-2xl border border-line p-4 text-sm leading-relaxed">
                    {it.quote && <p className="border-l-2 border-coral-300 pl-3 italic text-slate-600">“{it.quote}”</p>}
                    <p className="mt-2 text-ink">{it.problem}</p>
                    <p className="mt-1 text-brand-800">
                      <strong>{tx.ai.suggestion}:</strong> {it.suggestion}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <List title={tx.ai.missingTitle} items={review.missing} Icon={CircleHelp} tone="text-amber-700" />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared pieces
// ---------------------------------------------------------------------------

function Intro({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <h2 className="text-2xl font-extrabold">{title}</h2>
      <p className="mt-1.5 max-w-2xl leading-relaxed text-slate-600">{text}</p>
    </div>
  );
}

function List({ title, items, Icon, tone }: { title: string; items: string[]; Icon: typeof CircleCheck; tone: string }) {
  if (items.length === 0) return null;
  return (
    <div>
      {title && <h3 className="mb-2 font-bold">{title}</h3>}
      <ul className="space-y-1.5">
        {items.map((x) => (
          <li key={x} className="flex gap-2 text-sm leading-relaxed text-slate-700">
            <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${tone}`} aria-hidden="true" />
            {x}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** "AI: do I fit?" inside a scholarship or university panel. */
export function AiFit({ target }: { target: StudentTarget }) {
  const { tx, lang } = useAppText();
  const ready = useAiReady(true);
  const ai = useAi();
  const [fit, setFit] = useState<{ id: string; r: AiStudentFit } | null>(null);
  const result = fit?.id === target.id ? fit.r : null;
  const check = async () => {
    const r = await ai.run<AiStudentFit>({ action: 'student_fit', lang, target });
    if (r) setFit({ id: target.id, r });
  };
  const tone = { likely: 'bg-emerald-50 text-emerald-800 border-emerald-200', maybe: 'bg-amber-50 text-amber-900 border-amber-200', unlikely: 'bg-rose-50 text-rose-800 border-rose-200' };

  return (
    <div className="rounded-2xl border border-brand-100 bg-brand-50/50 p-4">
      {!result && (
        <button type="button" onClick={check} disabled={ready === false || ai.busy} className="btn-secondary w-full !py-2.5 text-sm disabled:opacity-60" title={ready === false ? tx.ai.comingSoon : undefined}>
          <Sparkles className="h-4 w-4 text-brand-700" aria-hidden="true" />
          {tx.student.aiFitBtn}
        </button>
      )}
      {ready === false && !result && <p className="mt-2 text-xs text-slate-500">{tx.ai.comingSoon}</p>}
      {ai.busy && (
        <div className="mt-3">
          <Thinking />
        </div>
      )}
      <ErrorNote text={ai.error} />
      {result && (
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wide text-brand-700">{tx.student.aiFitTitle}</p>
          <p className={`rounded-xl border px-3 py-2 font-bold ${tone[result.verdict]}`}>{tx.student.aiVerdicts[result.verdict]}</p>
          <p className="text-sm leading-relaxed text-ink">{result.summary}</p>
          <List title="" items={result.reasons} Icon={CircleCheck} tone="text-brand-700" />
          <List title={tx.student.aiPrepare} items={result.prepare} Icon={ListChecks} tone="text-brand-700" />
          <List title={tx.student.aiCheck} items={result.check} Icon={CircleHelp} tone="text-amber-700" />
        </div>
      )}
    </div>
  );
}
