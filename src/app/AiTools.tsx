import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { Check, ClipboardCheck, Clock, Copy, Crown, FileText, Info, Loader2, PenLine, RotateCcw, Save, Sparkles, Upload, UserRound, X } from 'lucide-react';
import { backend, BackendError } from './backend';
import { MAX_DOC_BYTES, docKind, docxText, fileToBase64 } from './docText';
import { useAuth } from './AuthContext';
import { useAppText } from './text';
import type { AiDraft, AiQuestions, AiRequest, AiReview, SavedLetter } from './types';
import { inputClass } from './ui';
import { formatDateTime } from './util';

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
      const text = (tx.ai.errors as Record<string, string>)[code] ?? tx.ai.errors.unknown;
      // Admins get the server's technical reason appended (see supabase/functions/ai).
      setError(err instanceof BackendError && err.message !== code ? `${text} — ${err.message}` : text);
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

function LetterTab({ opportunityId, ready }: { opportunityId: string; ready: boolean }) {
  const { tx, lang } = useAppText();
  const ai = useAi();
  const [questions, setQuestions] = useState<AiQuestions['questions'] | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [letterLang, setLetterLang] = useState<Lang>('en');
  const [draft, setDraft] = useState<AiDraft | null>(null);
  // The letter editor: open after an AI draft, for a saved letter, or when writing by hand.
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');
  const [saved, setSaved] = useState<SavedLetter | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Reopen the letter saved earlier for this opportunity.
  useEffect(() => {
    let live = true;
    backend
      .getLetter(opportunityId)
      .then((l) => {
        if (!live || !l) return;
        setSaved(l);
        setText(l.content);
        setEditing(true);
      })
      .catch((err) => console.error('[letter] load failed', err));
    return () => {
      live = false;
    };
  }, [opportunityId]);

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
      setEditing(true);
    }
  };

  // Back to the AI questions; the saved letter stays saved until the new one is saved.
  const restart = () => {
    setQuestions(null);
    setAnswers([]);
    setDraft(null);
    setEditing(false);
    setText('');
  };

  const save = async () => {
    if (!text.trim()) return;
    setSaving(true);
    setLocalError(null);
    try {
      setSaved(await backend.saveLetter(opportunityId, text));
    } catch (err) {
      console.error('[letter] save failed', err);
      setLocalError(tx.saveError);
    } finally {
      setSaving(false);
    }
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

  const dirty = text.trim() !== '' && text !== saved?.content;

  return (
    <div className="space-y-5">
      {!editing && (
        <p className="flex gap-2 rounded-2xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" aria-hidden="true" />
          {tx.ai.letterIntro}
        </p>
      )}

      {!editing && !questions && !ai.busy && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={ask} disabled={!ready} className="btn-primary disabled:cursor-not-allowed disabled:opacity-50">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
            {tx.ai.start}
          </button>
          <button type="button" onClick={() => setEditing(true)} className="btn-secondary">
            <PenLine className="h-5 w-5" aria-hidden="true" />
            {tx.ai.writeMyself}
          </button>
        </div>
      )}

      {!editing && questions && (
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

      {!editing && questions && !ai.busy && (
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

      {editing && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold">{draft ? tx.ai.draftTitle : tx.ai.myLetter}</h3>
              <p className={`text-xs font-medium ${dirty ? 'text-amber-700' : 'text-emerald-700'}`}>
                {dirty ? tx.ai.unsaved : saved ? tx.ai.savedAt(formatDateTime(saved.updated_at, lang)) : ''}
              </p>
            </div>
            <button type="button" onClick={copy} disabled={!text} className="btn-secondary !px-3 !py-1.5 text-sm">
              {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
              {copied ? tx.ai.copied : tx.ai.copy}
            </button>
          </div>
          {draft && <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">{tx.ai.draftNote}</p>}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={16}
            maxLength={12000}
            placeholder={tx.ai.letterPh}
            aria-label={tx.ai.myLetter}
            className={`${inputClass} resize-y font-[inherit] leading-relaxed`}
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={save} disabled={saving || !dirty} className="btn-primary">
              {saving ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Save className="h-5 w-5" aria-hidden="true" />}
              {tx.ai.saveLetter}
            </button>
            <button type="button" onClick={restart} disabled={!ready} className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50">
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              {tx.ai.again}
            </button>
          </div>
          {draft && draft.tips.length > 0 && (
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="font-bold text-slate-900">{tx.ai.tips}</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {draft.tips.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          )}
          {draft && draft.missing_info.length > 0 && (
            <div className="rounded-2xl border border-coral-200 bg-coral-50/50 p-4">
              <p className="font-bold text-coral-800">{tx.ai.missing}</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {draft.missing_info.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {ai.busy && <Thinking />}
      <ErrorNote text={localError ?? ai.error} />
      {ai.remaining !== null && <p className="text-xs text-slate-500">{tx.ai.remaining(ai.remaining)}</p>}
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
      <circle
        cx="40"
        cy="40"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - s / 10)}
        transform="rotate(-90 40 40)"
      />
      <text x="40" y="46" textAnchor="middle" fontSize="20" fontWeight="800" fill="#0f172a">
        {s}/10
      </text>
    </svg>
  );
}

function ReviewTab({ opportunityId, ready }: { opportunityId: string; ready: boolean }) {
  const { tx, lang } = useAppText();
  const ai = useAi();
  const [docType, setDocType] = useState<'letter' | 'cv'>('letter');
  const [text, setText] = useState('');
  const [pdf, setPdf] = useState<{ name: string; size: number; data: string } | null>(null);
  const [fromFile, setFromFile] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [review, setReview] = useState<AiReview | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const pick = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow picking the same file again
    if (!file) return;
    const kind = docKind(file);
    if (!kind) return setLocalError(tx.ai.fileType);
    if (file.size > MAX_DOC_BYTES) return setLocalError(tx.ai.fileTooBig);
    setLocalError(null);
    setReading(true);
    try {
      if (kind === 'pdf') {
        setPdf({ name: file.name, size: file.size, data: await fileToBase64(file) });
      } else {
        const extracted = (kind === 'docx' ? await docxText(file) : await file.text()).trim();
        if (!extracted) throw new Error('empty document');
        setPdf(null);
        setText(extracted.slice(0, 12000));
        setFromFile(file.name);
      }
    } catch (err) {
      console.error('[ai] could not read file', err);
      setLocalError(tx.ai.fileRead);
    } finally {
      setReading(false);
    }
  };

  const submit = async () => {
    if (!pdf && text.trim().length < 50) return setLocalError(tx.ai.tooShort);
    setLocalError(null);
    const r = await ai.run<AiReview>({
      action: 'review',
      opportunityId,
      lang,
      docType,
      text: pdf ? '' : text,
      ...(pdf ? { file: { name: pdf.name, mimeType: 'application/pdf' as const, data: pdf.data } } : {}),
    });
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
      <div className="flex flex-col gap-2 rounded-2xl border-2 border-dashed border-slate-200 p-4 sm:flex-row sm:items-center">
        <button type="button" onClick={() => fileRef.current?.click()} disabled={reading} className="btn-secondary shrink-0 !px-4 !py-2 text-sm">
          {reading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Upload className="h-4 w-4" aria-hidden="true" />}
          {tx.ai.upload}
        </button>
        <p className="text-xs text-slate-500">{tx.ai.uploadHint}</p>
        <input ref={fileRef} type="file" accept=".pdf,.docx,.txt,application/pdf,text/plain" onChange={pick} className="hidden" />
      </div>
      {pdf ? (
        <div className="rounded-2xl border border-violet-200 bg-violet-50/60 p-4">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 shrink-0 text-violet-600" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-slate-900">{pdf.name}</p>
              <p className="text-xs text-slate-500">{Math.max(1, Math.round(pdf.size / 1024))} KB · PDF</p>
            </div>
            <button
              type="button"
              onClick={() => setPdf(null)}
              aria-label={tx.ai.removeFile}
              title={tx.ai.removeFile}
              className="rounded-full p-2 text-slate-500 hover:bg-white hover:text-rose-600"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <p className="mt-2 text-xs text-violet-800">{tx.ai.pdfAttached}</p>
        </div>
      ) : (
        <>
          {fromFile && <p className="text-xs font-medium text-emerald-700">{tx.ai.fromFile(fromFile)}</p>}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={12}
            maxLength={12000}
            placeholder={tx.ai.reviewPh}
            className={`${inputClass} resize-y`}
            aria-label={tx.ai.reviewPh}
          />
        </>
      )}
      {!ai.busy && (
        <button type="button" onClick={submit} disabled={!ready} className="btn-primary disabled:cursor-not-allowed disabled:opacity-50">
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

// Asked once per page load: is the AI function deployed with an API key?
let readyCheck: Promise<boolean> | null = null;
function useAiReady(enabled: boolean): boolean | null {
  const [ready, setReady] = useState<boolean | null>(null);
  useEffect(() => {
    if (!enabled) return;
    readyCheck ??= backend.aiStatus().catch(() => false);
    let live = true;
    readyCheck.then((r) => live && setReady(r));
    return () => {
      live = false;
    };
  }, [enabled]);
  return ready;
}

export type AiTool = 'letter' | 'review';

/**
 * The AI tools for one opportunity, shown as tabs on its detail page. Free users
 * see what they'd get; Premium users see the tools, disabled with a "coming soon"
 * note until the AI backend is configured.
 */
export function AiTools({ opportunityId, tool }: { opportunityId: string; tool: AiTool }) {
  const { tx } = useAppText();
  const { profile } = useAuth();
  const premium = profile?.plan === 'premium' || profile?.is_admin === true;
  const ready = useAiReady(premium);

  if (!premium) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-amber-200 bg-amber-50 px-6 py-10 text-center">
        <Crown className="h-10 w-10 text-amber-500" aria-hidden="true" />
        <p className="max-w-md text-amber-900">{tx.ai.locked}</p>
        <Link to="/app/profile?tab=premium" className="btn-primary">
          {tx.list.seePremium}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {ready === false && (
        <p className="flex gap-2 rounded-2xl border border-violet-200 bg-violet-50 p-4 text-sm font-medium text-violet-900">
          <Clock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {tx.ai.comingSoon}
        </p>
      )}
      {!profile?.about.trim() && (
        <Link to="/app/profile" className="flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-2 text-sm font-medium text-brand-800 hover:bg-brand-100">
          <UserRound className="h-4 w-4 shrink-0" aria-hidden="true" />
          {tx.profile.aboutHint}
        </Link>
      )}
      {/* Both tools stay mounted so switching tabs doesn't lose work in progress. */}
      <div hidden={tool !== 'letter'}>
        <LetterTab opportunityId={opportunityId} ready={ready === true} />
      </div>
      <div hidden={tool !== 'review'}>
        <ReviewTab opportunityId={opportunityId} ready={ready === true} />
      </div>
    </div>
  );
}
