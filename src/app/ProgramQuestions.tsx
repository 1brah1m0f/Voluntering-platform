import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageCircle, Star } from 'lucide-react';
import { backend, type DiscussionQuestion } from './backend';
import { useAuth } from './AuthContext';
import { useAppText } from './text';
import { inputClass } from './ui';

const copy = {
  az: { heading: 'Sual-cavab', hint: 'Sualını ver, təcrübəni paylaş. Faydalı sualları ulduzla.', title: 'Sualın başlığı', body: 'Sualını ətraflı yaz', ask: 'Sual ver', answer: 'Cavab yaz', send: 'Cavabı göndər', empty: 'Hələ sual yoxdur. İlk sualı sən ver!', login: 'Sual vermək, cavab yazmaq və ulduzlamaq üçün daxil ol', star: 'Sualı ulduzla', unstar: 'Ulduzu götür', replies: 'cavab', refresh: 'Yenilə' },
  en: { heading: 'Questions & answers', hint: 'Ask a question, share your experience. Star helpful questions.', title: 'Question title', body: 'Describe your question', ask: 'Ask a question', answer: 'Write an answer', send: 'Post answer', empty: 'No questions yet. Ask the first one!', login: 'Sign in to ask, answer, and star questions', star: 'Star question', unstar: 'Remove star', replies: 'answers', refresh: 'Refresh' },
};

export function ProgramQuestions({ scope }: { scope: string }) {
  const { lang, tx } = useAppText();
  const location = useLocation();
  const c = copy[lang];
  const { userId } = useAuth();
  const [questions, setQuestions] = useState<DiscussionQuestion[] | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const version = useRef(0);
  const reload = useCallback(async () => {
    const request = ++version.current;
    try {
      const rows = await backend.listQuestions(scope);
      if (request === version.current) { setQuestions(rows); setError(''); }
    } catch {
      if (request === version.current) setError(tx.loadError);
    }
  }, [scope, userId, tx.loadError]);
  useEffect(() => {
    setQuestions(null); setTitle(''); setBody(''); setError('');
    void reload();
    return () => { version.current++; };
  }, [reload]);
  async function mutate(action: () => Promise<void>, done?: () => void) {
    setBusy(true); setError('');
    try { await action(); done?.(); await reload(); return true; }
    catch { setError(tx.saveError); return false; }
    finally { setBusy(false); }
  }
  function ask(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    void mutate(() => backend.askQuestion(scope, title, body), () => { setTitle(''); setBody(''); });
  }
  return (
    <section className="mt-8 rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6" aria-label={c.heading}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-xl font-extrabold"><MessageCircle className="h-5 w-5 text-brand-700" aria-hidden="true" />{c.heading}</h2>
        <button type="button" className="text-sm font-semibold text-brand-700" disabled={busy} onClick={() => void reload()}>{c.refresh}</button>
      </div>
      <p className="mt-2 text-sm text-slate-600">{c.hint}</p>
      {userId ? (
        <form onSubmit={ask} className="mt-4 space-y-3">
          <label className="block text-sm font-semibold">{c.title}<input className={`${inputClass} mt-1 w-full`} required maxLength={160} value={title} onChange={e => setTitle(e.target.value)} /></label>
          <label className="block text-sm font-semibold">{c.body}<textarea className={`${inputClass} mt-1 w-full`} required maxLength={3000} rows={3} value={body} onChange={e => setBody(e.target.value)} /></label>
          <button className="btn-primary text-sm" disabled={busy || !title.trim() || !body.trim()}>{c.ask}</button>
        </form>
      ) : <Link to="/login" state={{ from: location.pathname }} className="mt-4 block text-sm font-semibold text-brand-700 hover:underline">{c.login}</Link>}
      {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
      {!questions && !error && <p role="status" className="mt-4 text-sm text-slate-500">{tx.loading}</p>}
      {questions?.length === 0 && <p className="mt-5 text-sm text-slate-500">{c.empty}</p>}
      <div className="mt-5 space-y-3">
        {questions?.map(q => (
          <div key={q.id} className="rounded-2xl border border-line p-4">
            <div className="flex items-start gap-3">
              <details className="min-w-0 flex-1">
                <summary className="cursor-pointer break-words font-bold text-slate-900">{q.title}<span className="mt-1 block text-xs font-normal text-slate-500">{q.author_name} · {new Date(q.created_at).toLocaleDateString(lang === 'az' ? 'az-AZ' : 'en-GB')} · {q.answers.length} {c.replies}</span></summary>
                <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{q.body}</p>
                <div className="mt-4 space-y-3">
                  {q.answers.map(a => <div key={a.id} className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-semibold text-brand-800">{a.author_name}</p><p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{a.body}</p></div>)}
                </div>
                {userId && <AnswerForm key={`${q.id}:${userId}`} busy={busy} c={c} submit={body => mutate(() => backend.answerQuestion(q.id, body))} />}
              </details>
              <button type="button" disabled={!userId || busy} aria-pressed={q.starred} aria-label={q.starred ? c.unstar : c.star} title={q.starred ? c.unstar : c.star} onClick={() => void mutate(() => backend.starQuestion(q.id, !q.starred))} className={`flex shrink-0 items-center gap-1 rounded-xl px-2.5 py-2 text-sm font-semibold disabled:opacity-50 ${q.starred ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-500'}`}><Star className="h-4 w-4" fill={q.starred ? 'currentColor' : 'none'} aria-hidden="true" />{q.stars}</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AnswerForm({ busy, c, submit }: { busy: boolean; c: typeof copy.az; submit: (body: string) => Promise<boolean> }) {
  const [body, setBody] = useState('');
  return <form className="mt-4 space-y-2" onSubmit={async e => { e.preventDefault(); if (!body.trim()) return; if (await submit(body)) setBody(''); }}>
    <label className="block text-sm font-semibold">{c.answer}<textarea className={`${inputClass} mt-1 w-full`} required maxLength={3000} rows={2} value={body} onChange={e => setBody(e.target.value)} /></label>
    <button className="btn-secondary text-sm" disabled={busy || !body.trim()}>{c.send}</button>
  </form>;
}
