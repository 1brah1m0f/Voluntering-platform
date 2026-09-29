import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, ClipboardCheck, Copy, Crown, Info, Loader2, PenLine, RotateCcw, Sparkles, UserRound } from 'lucide-react';
import { backend, BackendError } from '../backend';
import { useAuth } from '../AuthContext';
import { useData } from '../DataContext';
import { useAppText } from '../text';
import type { AiDraft, AiQuestions, AiRequest, AiReview } from '../types';
import { ErrorState, ProgramBadge, Spinner, inputClass } from '../ui';

type Lang = 'az' | 'en';

function useAi() {
  const { tx } = useAppText();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);

  const run = async <T,>(req: AiRequest): Promise<T | null> => {
    setBusy(true);
    setError(null);
    try {
      const { result, remaining } = await backend.ai(req);
      setRemaining(remaining);
      return result as T;
    } catch (err) {
      const code = err instanceof BackendError ? err.code : 'unknown';
      setError((tx.ai.errors as Record<string, string>)[code] ?? tx.ai.errors.unknown);
      return null;
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, remaining, run };
}

function Thinking() {
  const { tx } = useAppText();
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-violet-50 px-4 py-3 text-sm font-medium text-violet-800" role="status">
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
      {tx.ai.thinking}
    </div>
  );
}

function ErrorNote({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-800">
      {text}
    </p>
  );
}

function LetterTab({ opportunityId }: { opportunityId: string }) {
  const { tx, lang } = useAppText();
  const ai = useAi();
  const [questions, setQuestions] = useState<AiQuestions['questions'] | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [letterLang, setLetterLang] = useState<Lang>('en');
  const [draft, setDraft] = useState<AiDraft | null>(null);
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const ask = async () => {
    const r = await ai.run<AiQuestions>({ action: 'questions', opportunityId, lang });
    if (r) {
      setQuestions(r.questions);
      setAnswers(r.questions.map(() => ''));
    }
  };

  const build = async () => {
    if (!questions) return;
    if (!answers.some((a) => a.trim())) return setLocalError(tx.ai.needAnswers);
    setLocalError(null);
    const r = await ai.run<AiDraft>({
      action: 'draft',
      opportunityId,
      lang,
      letterLang,
      answers: questions.map((q, i) => ({ question: q.question, answer: answers[i] ?? '' })),
    });
    if (r) {
      setDraft(r);
      setText(r.draft);
    }
  };

  const reset = () => {
    setQuestions(null);
    setAnswers([]);
    setDraft(null);
    setText('');
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <div className="space-y-5">
      <p className="flex gap-2 rounded-2xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" aria-hidden="true" />
        {tx.ai.letterIntro}
      </p>

      {!questions && !ai.busy && (
        <button type="button" onClick={ask} className="btn-primary">
          <Sparkles className="h-5 w-5" aria-hidden="true" />
          {tx.ai.start}
        </button>
      )}

      {questions && !draft && (
        <ol className="space-y-4">
          {questions.map((q, i) => (
            <li key={i} className="rounded-2xl border border-slate-200 p-4">
              <label htmlFor={`q-${i}`} className="block font-semibold text-slate-900">
                {i + 1}. {q.question}
              </label>
              <p className="mt-1 text-xs text-slate-500">{q.why}</p>
              <textarea
                id={`q-${i}`}
                rows={3}
                maxLength={2000}
                value={answers[i] ?? ''}
                onChange={(e) => setAnswers((cur) => cur.map((a, j) => (j === i ? e.target.value : a)))}
                placeholder={tx.ai.answerPh}
                className={`${inputClass} mt-2 resize-y`}
              />
            </li>
          ))}
        </ol>
      )}

      {questions && !draft && !ai.busy && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            {tx.ai.letterLang}
            <select value={letterLang} onChange={(e) => setLetterLang(e.target.value as Lang)} className={`${inputClass} !w-auto !py-2`}>
              <option value="en">English</option>
              <option value="az">Azərbaycan</option>
            </select>
          </label>
          <button type="button" onClick={build} className="btn-primary sm:ml-auto">
            <PenLine className="h-5 w-5" aria-hidden="true" />
            {tx.ai.makeDraft}
          </button>
        </div>
      )}

      {draft && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-bold">{tx.ai.draftTitle}</h3>
            <button type="button" onClick={copy} className="btn-secondary !px-3 !py-1.5 text-sm">
              {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
              {copied ? tx.ai.copied : tx.ai.copy}
            </button>
          </div>
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">{tx.ai.draftNote}</p>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={16} className={`${inputClass} resize-y font-[inherit] leading-relaxed`} />
          {draft.tips.length > 0 && (
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="font-bold text-slate-900">{tx.ai.tips}</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {draft.tips.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          )}
          {draft.missing_info.length > 0 && (
            <div className="rounded-2xl border border-coral-200 bg-coral-50/50 p-4">
              <p className="font-bold text-coral-800">{tx.ai.missing}</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {draft.missing_info.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          )}
          <button type="button" onClick={reset} className="btn-secondary">
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            {tx.ai.again}
          </button>
        </div>
      )}

      {ai.busy && <Thinking />}
      <ErrorNote text={localError ?? ai.error} />
      {ai.remaining !== null && <p className="text-xs text-slate-400">{tx.ai.remaining(ai.remaining)}</p>}
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const s = Math.max(1, Math.min(10, Math.round(score)));
  const color = s >= 8 ? '#059669' : s >= 6 ? '#d97706' : '#dc2626';
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 80 80" className="h-24 w-24 shrink-0" role="img" aria-label={`${s}/10`}>
      <circle cx="40" cy="40" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
      <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - s / 10)} transform="rotate(-90 40 40)" />
      <text x="40" y="46" textAnchor="middle" fontSize="20" fontWeight="800" fill="#0f172a">
        {s}/10
      </text>
    </svg>
  );
}

function ReviewTab({ opportunityId }: { opportunityId: string }) {
  const { tx, lang } = useAppText();
  const ai = useAi();
  const [docType, setDocType] = useState<'letter' | 'cv'>('letter');
  const [text, setText] = useState('');
  const [review, setReview] = useState<AiReview | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const submit = async () => {
    if (text.trim().length < 50) return setLocalError(tx.ai.tooShort);
    setLocalError(null);
    const r = await ai.run<AiReview>({ action: 'review', opportunityId, lang, docType, text });
    if (r) setReview(r);
  };

  return (
    <div className="space-y-5">
      <p className="flex gap-2 rounded-2xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" aria-hidden="true" />
        {tx.ai.reviewIntro}
      </p>
      <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-700">
        {tx.ai.docType}:
        {(['letter', 'cv'] as const).map((d) => (
          <button
            key={d}
            type="button"
            aria-pressed={docType === d}
            onClick={() => setDocType(d)}
            className={`rounded-full px-3 py-1.5 transition ${docType === d ? 'bg-brand-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {d === 'letter' ? tx.ai.docLetter : tx.ai.docCv}
          </button>
        ))}
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={12} maxLength={12000} placeholder={tx.ai.reviewPh} className={`${inputClass} resize-y`} aria-label={tx.ai.reviewPh} />
      {!ai.busy && (
        <button type="button" onClick={submit} className="btn-primary">
          <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
          {tx.ai.reviewBtn}
        </button>
      )}
      {ai.busy && <Thinking />}
      <ErrorNote text={localError ?? ai.error} />

      {review && !ai.busy && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 p-4">
            <ScoreRing score={review.score} />
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{tx.ai.score}</p>
              <p className="mt-1 text-slate-800">{review.verdict}</p>
            </div>
          </div>
          {review.strengths.length > 0 && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
              <p className="font-bold text-emerald-800">{tx.ai.strengths}</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {review.strengths.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          )}
          {review.issues.length > 0 && (
            <div>
              <p className="font-bold text-slate-900">{tx.ai.issues}</p>
              <ul className="mt-2 space-y-3">
                {review.issues.map((it, i) => (
                  <li key={i} className="rounded-2xl border border-slate-200 p-4 text-sm">
                    {it.quote && <blockquote className="mb-2 border-l-4 border-coral-300 pl-3 italic text-slate-600">“{it.quote}”</blockquote>}
                    <p className="text-slate-800">{it.problem}</p>
                    <p className="mt-2 rounded-xl bg-brand-50 px-3 py-2 text-brand-900">
                      <span className="font-bold">{tx.ai.suggestion}:</span> {it.suggestion}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {review.missing.length > 0 && (
            <div className="rounded-2xl border border-coral-200 bg-coral-50/50 p-4">
              <p className="font-bold text-coral-800">{tx.ai.missingTitle}</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {review.missing.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      {ai.remaining !== null && <p className="text-xs text-slate-400">{tx.ai.remaining(ai.remaining)}</p>}
    </div>
  );
}

export default function AiAssistantPage() {
  const { id = '' } = useParams();
  const { tx } = useAppText();
  const { profile } = useAuth();
  const { opportunities, error, reload } = useData();
  const [tab, setTab] = useState<'letter' | 'review'>('letter');

  if (error) return <ErrorState onRetry={reload} />;
  if (!opportunities || !profile) return <Spinner label={tx.loading} />;
  const o = opportunities.find((x) => x.id === id);
  const premium = profile.plan === 'premium' || profile.is_admin;

  return (
    <div className="mx-auto max-w-3xl">
      <Link to={o ? `/app/o/${o.id}` : '/app'} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-brand-700">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {tx.back}
      </Link>

      <div className="mt-4 rounded-3xl bg-gradient-to-br from-violet-600 via-brand-700 to-brand-900 p-6 text-white shadow-soft">
        <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-violet-100">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          {tx.ai.title}
        </p>
        <p className="mt-1 text-violet-50">{tx.ai.sub}</p>
        {o && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white/10 p-3">
            <ProgramBadge program={o.program} />
            <p className="font-semibold leading-snug">{o.title}</p>
          </div>
        )}
      </div>

      {!o ? (
        <p className="mt-8 rounded-3xl border border-dashed border-slate-300 py-12 text-center text-slate-500">{tx.detail.notFound}</p>
      ) : !premium ? (
        <div className="mt-6 flex flex-col items-center gap-4 rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center">
          <Crown className="h-10 w-10 text-amber-500" aria-hidden="true" />
          <p className="max-w-md text-amber-900">{tx.ai.locked}</p>
          <Link to="/app/premium" className="btn-primary">
            {tx.list.seePremium}
          </Link>
        </div>
      ) : (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          {!profile.about.trim() && (
            <Link to="/app/profile" className="mb-5 flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-2 text-sm font-medium text-brand-800 hover:bg-brand-100">
              <UserRound className="h-4 w-4 shrink-0" aria-hidden="true" />
              {tx.profile.aboutHint}
            </Link>
          )}
          <div role="tablist" className="mb-6 inline-flex rounded-full bg-slate-100 p-1">
            {(['letter', 'review'] as const).map((t) => (
              <button
                key={t}
                role="tab"
                type="button"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${tab === t ? 'bg-white text-violet-700 shadow' : 'text-slate-600'}`}
              >
                {t === 'letter' ? tx.ai.tabLetter : tx.ai.tabReview}
              </button>
            ))}
          </div>
          {/* Both tabs stay mounted so switching doesn't lose work in progress. */}
          <div hidden={tab !== 'letter'}>
            <LetterTab opportunityId={o.id} />
          </div>
          <div hidden={tab !== 'review'}>
            <ReviewTab opportunityId={o.id} />
          </div>
        </div>
      )}
    </div>
  );
}
