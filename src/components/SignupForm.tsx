import { useEffect, useId, useState, type FormEvent } from 'react';
import { ArrowRight, Check, CheckCircle2, Crown, Leaf, Loader2, Users } from 'lucide-react';
import { useLang } from '../i18n';
import { submitSignup, type SignupData } from '../lib/waitlist';
import { Reveal } from './Section';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Status = 'idle' | 'submitting' | 'ok' | 'duplicate' | 'error';
type Plan = SignupData['plan'];

/** Other sections (e.g. pricing cards) can preselect a plan before scrolling here. */
export const PLAN_EVENT = 'openly:plan';
export function selectPlan(plan: Plan) {
  window.dispatchEvent(new CustomEvent<Plan>(PLAN_EVENT, { detail: plan }));
}

const planIcons = { basic: Leaf, premium: Crown } as const;

const inputBase =
  'w-full rounded-xl border bg-slate-50/60 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:bg-white focus:outline-none focus:ring-2';

export default function SignupForm({ count, onJoined }: { count: number | null; onJoined: () => void }) {
  const { t, lang } = useLang();
  const s = t.signup;
  const uid = useId();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [plan, setPlan] = useState<Plan>('basic');
  const [touched, setTouched] = useState({ name: false, email: false });
  const [honeypot, setHoneypot] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  useEffect(() => {
    const onPlan = (e: Event) => setPlan((e as CustomEvent<Plan>).detail);
    window.addEventListener(PLAN_EVENT, onPlan);
    return () => window.removeEventListener(PLAN_EVENT, onPlan);
  }, []);

  const nameError = name.trim() ? null : s.nameRequired;
  const emailError = !email.trim() ? s.emailRequired : !EMAIL_RE.test(email.trim()) ? s.emailInvalid : null;
  const showNameError = touched.name && nameError;
  const showEmailError = touched.email && emailError;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTouched({ name: true, email: true });
    if (nameError || emailError) {
      document.getElementById(`${uid}-${nameError ? 'name' : 'email'}`)?.focus();
      return;
    }
    if (honeypot) {
      // Bot filled the hidden field — pretend success, store nothing.
      setStatus('ok');
      return;
    }
    setStatus('submitting');
    try {
      const result = await submitSignup({ name, email, plan, lang });
      setStatus(result);
      if (result === 'ok') onJoined();
    } catch (err) {
      console.error('[waitlist] submit failed', err);
      setStatus('error');
    }
  }

  function reset() {
    setName('');
    setEmail('');
    setPlan('basic');
    setTouched({ name: false, email: false });
    setStatus('idle');
  }

  const done = status === 'ok' || status === 'duplicate';

  return (
    <section id="signup" aria-labelledby="signup-title" className="relative overflow-hidden py-20 sm:py-24">
      <div className="container-x">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 px-5 py-10 shadow-soft sm:px-10 lg:px-14 lg:py-14">
          <div className="bg-dots-light pointer-events-none absolute inset-0 opacity-40" />
          <div className="animate-blob pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-coral-500/25 blur-3xl" />
          <div className="animate-blob pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-brand-400/25 blur-3xl [animation-delay:-6s]" />

          <div className="relative grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <Reveal variant="left">
              <span className="mb-3 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-100">{s.eyebrow}</span>
              <h2 id="signup-title" className="text-3xl font-extrabold tracking-tight !text-white sm:text-4xl">
                {s.title}
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-brand-100">{s.subtitle}</p>
              <ul className="mt-6 space-y-3">
                {s.perks.map((p) => (
                  <li key={p} className="flex items-center gap-3 font-medium text-white">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-coral-700">
                      <Check className="h-4 w-4" aria-hidden="true" />
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
              {count ? (
                <p className="mt-8 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white">
                  <Users className="h-4 w-4" aria-hidden="true" />
                  {t.hero.counter(count)}
                </p>
              ) : null}
            </Reveal>

            <Reveal delay={120} variant="right" className="mx-auto w-full max-w-md lg:mr-0">
              <div className="rounded-3xl bg-white p-5 shadow-2xl ring-1 ring-white/20 sm:p-6" aria-live="polite">
                {done ? (
                  <div className="py-6 text-center">
                    <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" aria-hidden="true" />
                    <h3 className="mt-4 text-xl font-extrabold">{status === 'ok' ? s.successTitle : s.duplicateTitle}</h3>
                    <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-600">{status === 'ok' ? s.successText : s.duplicateText}</p>
                    <button type="button" onClick={reset} className="btn-secondary mt-6 py-2.5 text-sm">
                      {s.again}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} noValidate className="space-y-4">
                    <div>
                      <label htmlFor={`${uid}-name`} className="mb-1 block text-sm font-semibold text-slate-800">
                        {s.name}
                      </label>
                      <input
                        id={`${uid}-name`}
                        type="text"
                        autoComplete="name"
                        required
                        maxLength={80}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={() => setTouched((x) => ({ ...x, name: true }))}
                        placeholder={s.namePh}
                        aria-invalid={showNameError ? true : undefined}
                        aria-describedby={showNameError ? `${uid}-name-err` : undefined}
                        className={`${inputBase} ${showNameError ? 'border-rose-500 focus:ring-rose-200' : 'border-slate-200 focus:border-brand-600 focus:ring-brand-200'}`}
                      />
                      {showNameError && (
                        <p id={`${uid}-name-err`} className="mt-1 text-xs font-medium text-rose-700">
                          {nameError}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor={`${uid}-email`} className="mb-1 block text-sm font-semibold text-slate-800">
                        {s.email}
                      </label>
                      <input
                        id={`${uid}-email`}
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        required
                        maxLength={254}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={() => setTouched((x) => ({ ...x, email: true }))}
                        placeholder={s.emailPh}
                        aria-invalid={showEmailError ? true : undefined}
                        aria-describedby={showEmailError ? `${uid}-email-err` : undefined}
                        className={`${inputBase} ${showEmailError ? 'border-rose-500 focus:ring-rose-200' : 'border-slate-200 focus:border-brand-600 focus:ring-brand-200'}`}
                      />
                      {showEmailError && (
                        <p id={`${uid}-email-err`} className="mt-1 text-xs font-medium text-rose-700">
                          {emailError}
                        </p>
                      )}
                    </div>

                    <fieldset>
                      <legend className="mb-1.5 text-sm font-semibold text-slate-800">{s.plan}</legend>
                      <div className="grid grid-cols-2 gap-2">
                        {s.planOptions.map((o) => {
                          const on = plan === o.id;
                          const Icon = planIcons[o.id as Plan];
                          const premium = o.id === 'premium';
                          return (
                            <label
                              key={o.id}
                              className={`relative flex cursor-pointer items-center gap-2.5 rounded-xl border-2 px-3 py-2.5 transition focus-within:ring-2 focus-within:ring-coral-500 ${
                                on
                                  ? premium
                                    ? 'border-coral-600 bg-coral-50'
                                    : 'border-brand-600 bg-brand-50'
                                  : 'border-slate-200 bg-white hover:border-slate-300'
                              }`}
                            >
                              <input type="radio" name={`${uid}-plan`} value={o.id} checked={on} onChange={() => setPlan(o.id as Plan)} className="sr-only" />
                              <span
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                  premium ? 'bg-gradient-to-br from-coral-500 to-coral-700 text-white' : 'bg-brand-100 text-brand-700'
                                }`}
                              >
                                <Icon className="h-4 w-4" aria-hidden="true" />
                              </span>
                              <span className="leading-tight">
                                <span className="block text-sm font-bold text-slate-900">{o.label}</span>
                                <span className="block text-xs text-slate-500">{o.price}</span>
                              </span>
                              {on && (
                                <span
                                  className={`absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full text-white ${premium ? 'bg-coral-600' : 'bg-brand-600'}`}
                                >
                                  <Check className="h-3 w-3" aria-hidden="true" />
                                </span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </fieldset>

                    {/* Honeypot: hidden from people, bots tend to fill it. */}
                    <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
                      <label>
                        Website
                        <input type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
                      </label>
                    </div>

                    {status === 'error' && (
                      <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-800">
                        {s.error}
                      </p>
                    )}

                    <button type="submit" disabled={status === 'submitting'} className="btn-primary w-full">
                      {status === 'submitting' ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                          {s.submitting}
                        </>
                      ) : (
                        <>
                          {s.submit}
                          <ArrowRight className="h-5 w-5" aria-hidden="true" />
                        </>
                      )}
                    </button>
                    <p className="text-center text-xs text-slate-600">{s.privacy}</p>
                  </form>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
