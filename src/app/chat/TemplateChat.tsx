import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, RotateCcw, Send } from 'lucide-react';
import { useLang } from '../../i18n';
import { answerById, answers, findAnswer } from './answers';

type Turn = { id: number; question: string; answerId?: string };
const copy = {
  az: {
    title: 'Sualını ver', badge: 'Hazır cavablar · limitsiz',
    sub: 'Müraciət və platforma barədə qısa cavablar. Bu çat gündəlik AI limitini azaltmır.',
    greeting: 'Salam! Müraciət, CV, motivasiya məktubu və fürsət axtarışı barədə kömək edə bilərəm. Mövzu seç və ya sualını yaz.',
    fallback: 'Bu sual üçün hazır cavab tapmadım. CV, motivasiya məktubu, müraciət, xərclər və ya fürsət axtarışı barədə daha konkret sual yaz, yaxud aşağıdakı mövzulardan birini seç. Konkret layihənin şərtlərini onun rəsmi elanından yoxla.',
    input: 'Sualın', placeholder: 'Məsələn: motivasiya məktubunu necə yazım?', send: 'Göndər', reset: 'Söhbəti təmizlə',
    topics: 'Sürətli suallar', you: 'Sən', bot: 'Openly köməkçi', transcript: 'Söhbət',
  },
  en: {
    title: 'Ask a question', badge: 'Prepared answers · unlimited',
    sub: 'Quick help with applications and the platform. This chat does not use your daily AI allowance.',
    greeting: 'Hi! I can help with applications, CVs, motivation letters and finding opportunities. Choose a topic or type your question.',
    fallback: 'I couldn’t find a prepared answer for that question. Ask more specifically about CVs, motivation letters, applications, costs or finding opportunities, or choose a topic below. Check the official listing for a particular project’s conditions.',
    input: 'Your question', placeholder: 'For example: how do I write a motivation letter?', send: 'Send', reset: 'Clear conversation',
    topics: 'Quick questions', you: 'You', bot: 'Openly assistant', transcript: 'Conversation',
  },
};

export default function TemplateChat() {
  const { lang } = useLang();
  const t = copy[lang];
  const uid = useId();
  const [draft, setDraft] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const nextId = useRef(0);
  const transcript = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const box = transcript.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [turns]);

  const ask = (question: string, answerId?: string) => {
    const trimmed = question.trim().slice(0, 500);
    if (!trimmed) return;
    const id = ++nextId.current;
    const match = answerId ? answerById(answerId) : findAnswer(trimmed);
    setTurns(previous => [...previous.slice(-19), { id, question: trimmed, answerId: match?.id }]);
    setDraft('');
    input.current?.focus();
  };
  const submit = (event: FormEvent) => { event.preventDefault(); ask(draft); };

  return (
    <section className="overflow-hidden rounded-3xl border border-line bg-white shadow-xs" aria-labelledby={`${uid}-title`}>
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line p-5 sm:p-6">
        <div className="min-w-0 flex-1">
          <h2 id={`${uid}-title`} className="flex items-center gap-2 text-xl font-bold"><MessageCircle className="h-5 w-5 text-brand-700" aria-hidden="true" />{t.title}</h2>
          <p className="mt-1 text-sm text-slate-600">{t.sub}</p>
          <span className="mt-3 inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800">{t.badge}</span>
        </div>
        <button type="button" disabled={!turns.length} onClick={() => { setTurns([]); setDraft(''); input.current?.focus(); }} aria-label={t.reset} title={t.reset} className="rounded-full p-2.5 text-slate-500 hover:bg-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-700 disabled:opacity-40">
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
        </button>
      </header>
      <div ref={transcript} role="log" aria-label={t.transcript} aria-live="polite" aria-relevant="additions" tabIndex={0} className="max-h-96 space-y-5 overflow-y-auto overscroll-contain bg-paper/50 p-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-700 sm:p-6">
        <div className="max-w-2xl rounded-2xl rounded-tl-sm border border-line bg-white p-4 text-sm leading-relaxed text-slate-700">
          <p className="mb-1 text-xs font-bold text-brand-700">{t.bot}</p>{t.greeting}
        </div>
        {turns.map(turn => {
          const answer = turn.answerId ? answerById(turn.answerId) : undefined;
          return <div key={turn.id} className="space-y-3">
            <div className="ml-auto max-w-xl break-words rounded-2xl rounded-tr-sm bg-brand-700 p-4 text-sm leading-relaxed text-white">
              <p className="mb-1 text-xs font-bold text-white/80">{t.you}</p>{turn.question}
            </div>
            <div className="max-w-2xl break-words rounded-2xl rounded-tl-sm border border-line bg-white p-4 text-sm leading-relaxed text-slate-700">
              <p className="mb-1 text-xs font-bold text-brand-700">{t.bot}</p>
              <p>{answer?.answer[lang] ?? t.fallback}</p>
              {answer?.link && <Link to={answer.link.to} className="mt-3 inline-block font-bold text-brand-700 underline underline-offset-4">{answer.link.label[lang]}</Link>}
            </div>
          </div>;
        })}
      </div>
      <div className="border-t border-line p-4 sm:p-6">
        <p className="mb-2 text-xs font-bold text-slate-500">{t.topics}</p>
        <div className="mb-4 flex flex-wrap gap-2">
          {answers.map(answer => <button key={answer.id} type="button" onClick={() => ask(answer.question[lang], answer.id)} className="rounded-full border border-line bg-white px-3 py-2 text-left text-xs font-semibold text-slate-700 transition hover:border-brand-400 hover:bg-brand-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-700">{answer.question[lang]}</button>)}
        </div>
        <form onSubmit={submit} className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <label htmlFor={`${uid}-input`} className="sr-only">{t.input}</label>
            <input ref={input} id={`${uid}-input`} value={draft} onChange={event => setDraft(event.target.value)} maxLength={500} autoComplete="off" placeholder={t.placeholder} className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
          </div>
          <button type="submit" disabled={!draft.trim()} aria-label={t.send} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-brand-700 p-3 text-sm font-bold text-white hover:bg-brand-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 disabled:opacity-40">
            <Send className="h-5 w-5" aria-hidden="true" /><span className="hidden sm:inline">{t.send}</span>
          </button>
        </form>
      </div>
    </section>
  );
}
