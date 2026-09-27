import { useId, useState, type FormEvent } from 'react';
import { Check, CheckCircle2, Loader2, Users } from 'lucide-react';
import { useLang } from '../i18n';
import { submitSignup, type SignupData } from '../lib/waitlist';
import { Reveal } from './Section';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Status = 'idle' | 'submitting' | 'ok' | 'duplicate' | 'error';

function RadioGroup<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
}: {
  legend: string;
  name: string;
  options: Array<{ id: string; label: string }>;
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-slate-800">{legend}</legend>
      <div className="grid grid-cols-3 gap-2">
        {options.map((o) => (
          <label
            key={o.id}
            className={`flex cursor-pointer items-center justify-center rounded-xl border px-2 py-2.5 text-center text-sm font-semibold transition focus-within:ring-2 focus-within:ring-coral-500 ${
              value === o.id ? 'border-brand-700 bg-brand-700 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-brand-300'
            }`}
          >
            <input type="radio" name={name} value={o.id} checked={value === o.id} onChange={() => onChange(o.id as T)} className="sr-only" />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default function SignupForm({ count, onJoined }: { count: number | null; onJoined: () => void }) {
  const { t, lang } = useLang();
  const s = t.signup;
  const uid = useId();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [interests, setInterests] = useState<string[]>([]);
  const [country, setCountry] = useState('AZ');
  const [appliedBefore, setAppliedBefore] = useState<SignupData['appliedBefore']>(null);
  const [wouldPay, setWouldPay] = useState<SignupData['wouldPay']>(null);
  const [honeypot, setHoneypot] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  const emailError = !email.trim() ? s.emailRequired : !EMAIL_RE.test(email.trim()) ? s.emailInvalid : null;
  const showEmailError = emailTouched && emailError;

  const toggleInterest = (id: string) => setInterests((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEmailTouched(true);
    if (emailError) {
      document.getElementById(`${uid}-email`)?.focus();
      return;
    }
    if (honeypot) {
      // Bot filled the hidden field — pretend success, store nothing.
      setStatus('ok');
      return;
    }
    setStatus('submitting');
    try {
      const result = await submitSignup({ name, email, interests, country, appliedBefore, wouldPay, lang });
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
    setEmailTouched(false);
    setInterests([]);
    setAppliedBefore(null);
    setWouldPay(null);
    setStatus('idle');
  }

  const done = status === 'ok' || status === 'duplicate';

  return (
    <section id="signup" aria-labelledby="signup-title" className="relative overflow-hidden py-20 sm:py-24">
      <div className="container-x">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 px-5 py-12 shadow-soft sm:px-10 lg:px-14 lg:py-16">
          <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-coral-500/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-brand-400/25 blur-3xl" />

          <div className="relative grid gap-10 lg:grid-cols-5 lg:gap-14">
            <Reveal className="lg:col-span-2">
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

            <Reveal className="lg:col-span-3" delay={120}>
              <div className="rounded-3xl bg-white p-6 shadow-2xl sm:p-8" aria-live="polite">
                {done ? (
                  <div className="py-10 text-center">
                    <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" aria-hidden="true" />
                    <h3 className="mt-5 text-2xl font-extrabold">{status === 'ok' ? s.successTitle : s.duplicateTitle}</h3>
                    <p className="mx-auto mt-3 max-w-md leading-relaxed text-slate-600">{status === 'ok' ? s.successText : s.duplicateText}</p>
                    <button type="button" onClick={reset} className="btn-secondary mt-8">
                      {s.again}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} noValidate className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor={`${uid}-name`} className="mb-1.5 block text-sm font-semibold text-slate-800">
                          {s.name} <span className="font-normal text-slate-500">{s.optional}</span>
                        </label>
                        <input
                          id={`${uid}-name`}
                          type="text"
                          autoComplete="given-name"
                          maxLength={80}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder={s.namePh}
                          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-200"
                        />
                      </div>
                      <div>
                        <label htmlFor={`${uid}-email`} className="mb-1.5 block text-sm font-semibold text-slate-800">
                          {s.email} <span className="text-coral-700" aria-hidden="true">*</span>
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
                          onBlur={() => setEmailTouched(true)}
                          placeholder={s.emailPh}
                          aria-invalid={showEmailError ? true : undefined}
                          aria-describedby={showEmailError ? `${uid}-email-err` : undefined}
                          className={`w-full rounded-xl border px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                            showEmailError ? 'border-rose-500 focus:ring-rose-200' : 'border-slate-300 focus:border-brand-600 focus:ring-brand-200'
                          }`}
                        />
                        {showEmailError && (
                          <p id={`${uid}-email-err`} className="mt-1.5 text-sm font-medium text-rose-700">
                            {emailError}
                          </p>
                        )}
                      </div>
                    </div>

                    <fieldset>
                      <legend className="text-sm font-semibold text-slate-800">
                        {s.interests} <span className="font-normal text-slate-500">— {s.interestsHint}</span>
                      </legend>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {s.interestOptions.map((o) => {
                          const on = interests.includes(o.id);
                          return (
                            <button
                              key={o.id}
                              type="button"
                              aria-pressed={on}
                              onClick={() => toggleInterest(o.id)}
                              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition ${
                                on ? 'border-brand-700 bg-brand-700 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:text-brand-700'
                              }`}
                            >
                              {on && <Check className="h-4 w-4" aria-hidden="true" />}
                              {o.label}
                            </button>
                          );
                        })}
                      </div>
                    </fieldset>

                    <div>
                      <label htmlFor={`${uid}-country`} className="mb-1.5 block text-sm font-semibold text-slate-800">
                        {s.country}
                      </label>
                      <select
                        id={`${uid}-country`}
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-200"
                      >
                        {s.countries.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <RadioGroup legend={s.applied} name={`${uid}-applied`} options={s.appliedOptions} value={appliedBefore} onChange={setAppliedBefore} />
                    <RadioGroup legend={s.pay} name={`${uid}-pay`} options={s.payOptions} value={wouldPay} onChange={setWouldPay} />

                    {/* Honeypot: hidden from people, bots tend to fill it. */}
                    <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
                      <label>
                        Website
                        <input type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
                      </label>
                    </div>

                    {status === 'error' && (
                      <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
                        {s.error}
                      </p>
                    )}

                    <button type="submit" disabled={status === 'submitting'} className="btn-primary w-full py-4 text-base">
                      {status === 'submitting' ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                          {s.submitting}
                        </>
                      ) : (
                        s.submit
                      )}
                    </button>
                    <p className="text-center text-xs leading-relaxed text-slate-500">{s.privacy}</p>
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
