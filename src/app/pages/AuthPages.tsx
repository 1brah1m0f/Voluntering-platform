import { useId, useState, type FormEvent, type ReactNode } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, MailCheck, Shield, UserRound } from 'lucide-react';
import { BRAND } from '../../config';
import { Logo } from '../../components/Icons';
import { useLang } from '../../i18n';
import { backend, BackendError } from '../backend';
import { DEMO_ACCOUNTS } from '../backend/demoBackend';
import { useAuth } from '../AuthContext';
import { useAppText } from '../text';
import { Field, inputClass } from '../ui';
import { EMAIL_RE } from '../util';

function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <div className="flex rounded-full border border-slate-200 bg-white p-0.5 text-xs font-bold">
      {(['az', 'en'] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`rounded-full px-2.5 py-1 uppercase transition ${lang === l ? 'bg-brand-700 text-white' : 'text-slate-600 hover:text-brand-700'}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

function AuthLayout({ title, sub, children }: { title: string; sub: string; children: ReactNode }) {
  const { t } = useLang();
  const { tx } = useAppText();
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 p-12 text-white lg:flex lg:flex-col">
        <div className="bg-dots-light pointer-events-none absolute inset-0 opacity-30" />
        <div className="animate-blob pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-coral-500/30 blur-3xl" />
        <div className="animate-blob pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-brand-400/30 blur-3xl [animation-delay:-6s]" />
        <Link to="/" className="relative inline-flex items-center gap-2 text-xl font-extrabold">
          <Logo className="h-9 w-9" />
          {BRAND}
        </Link>
        <div className="relative mt-auto max-w-md">
          <p className="text-4xl font-extrabold leading-tight">
            {t.hero.title1} <span className="text-coral-300">{t.hero.title2}</span>
          </p>
          <ul className="mt-8 space-y-3">
            {t.signup.perks.map((p) => (
              <li key={p} className="flex items-center gap-3 text-brand-50">
                <span className="h-2 w-2 rounded-full bg-coral-400" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </aside>
      <main className="flex flex-col px-4 py-6 sm:px-8">
        <div className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-brand-700">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {tx.nav.home}
          </Link>
          <LangToggle />
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <Link to="/" className="mb-8 inline-flex items-center gap-2 text-lg font-extrabold text-slate-900 lg:hidden">
            <Logo className="h-8 w-8" />
            {BRAND}
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
          <p className="mt-2 text-slate-600">{sub}</p>
          <div className="mt-8">{children}</div>
          {backend.mode === 'demo' && <p className="mt-8 rounded-xl bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">{tx.demoBanner}</p>}
        </div>
      </main>
    </div>
  );
}

function errorText(err: unknown, errors: Record<string, string>) {
  return err instanceof BackendError ? errors[err.code] : errors.unknown;
}

export function LoginPage() {
  const { tx } = useAppText();
  const { userId, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const uid = useId();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const from = (location.state as { from?: string } | null)?.from ?? '/app';

  if (!loading && userId) return <Navigate to={from} replace />;

  async function signIn(mail: string, pw: string) {
    setBusy(true);
    try {
      await backend.signIn(mail, pw);
      navigate(from, { replace: true });
    } catch (err) {
      setError(errorText(err, tx.auth.errors));
    } finally {
      setBusy(false);
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!EMAIL_RE.test(email.trim())) return setError(tx.auth.errors.emailInvalid);
    void signIn(email.trim(), password);
  }

  return (
    <AuthLayout title={tx.auth.loginTitle} sub={tx.auth.loginSub}>
      {backend.mode === 'demo' && (
        <div className="mb-6 rounded-2xl border border-brand-100 bg-brand-50 p-4">
          <p className="text-sm font-bold text-brand-900">{tx.demoLogin}</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {(
              [
                ['admin', tx.demoAdmin, Shield],
                ['user', tx.demoUser, UserRound],
              ] as const
            ).map(([key, label, Icon]) => (
              <button
                key={key}
                type="button"
                disabled={busy}
                onClick={() => signIn(DEMO_ACCOUNTS[key].email, DEMO_ACCOUNTS[key].password)}
                className="flex items-center justify-center gap-2 rounded-xl bg-white px-3 py-2.5 text-sm font-bold text-brand-800 shadow-sm ring-1 ring-brand-200 transition hover:ring-brand-400 disabled:opacity-60"
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field label={tx.auth.email} htmlFor={`${uid}-email`}>
          <input id={`${uid}-email`} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={tx.auth.emailPh} className={inputClass} />
        </Field>
        <Field label={tx.auth.password} htmlFor={`${uid}-pw`}>
          <input id={`${uid}-pw`} type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
        </Field>
        {error && (
          <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-800">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
          {tx.auth.login}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        {tx.auth.noAccount}{' '}
        <Link to="/register" className="font-semibold text-brand-700 hover:underline">
          {tx.auth.register}
        </Link>
      </p>
    </AuthLayout>
  );
}

export function RegisterPage() {
  const { tx } = useAppText();
  const { userId, loading } = useAuth();
  const navigate = useNavigate();
  const uid = useId();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmFor, setConfirmFor] = useState<string | null>(null);

  if (!loading && userId && !confirmFor) return <Navigate to="/app/welcome" replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError(tx.auth.errors.nameRequired);
    if (!EMAIL_RE.test(email.trim())) return setError(tx.auth.errors.emailInvalid);
    if (password.length < 6) return setError(tx.auth.errors.passwordShort);
    setBusy(true);
    try {
      const result = await backend.signUp(email.trim(), password, name.trim());
      if (result === 'confirm_email') setConfirmFor(email.trim());
      else navigate('/app/welcome', { replace: true });
    } catch (err) {
      setError(errorText(err, tx.auth.errors));
    } finally {
      setBusy(false);
    }
  }

  if (confirmFor) {
    return (
      <AuthLayout title={tx.auth.confirmTitle} sub={tx.auth.confirmText(confirmFor)}>
        <div className="flex flex-col items-center gap-6 rounded-3xl bg-brand-50 p-8 text-center">
          <MailCheck className="h-12 w-12 text-brand-600" aria-hidden="true" />
          <Link to="/login" className="btn-primary w-full">
            {tx.auth.login}
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={tx.auth.registerTitle} sub={tx.auth.registerSub}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field label={tx.auth.name} htmlFor={`${uid}-name`}>
          <input id={`${uid}-name`} type="text" autoComplete="name" maxLength={80} required value={name} onChange={(e) => setName(e.target.value)} placeholder={tx.auth.namePh} className={inputClass} />
        </Field>
        <Field label={tx.auth.email} htmlFor={`${uid}-email`}>
          <input id={`${uid}-email`} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={tx.auth.emailPh} className={inputClass} />
        </Field>
        <Field label={tx.auth.password} htmlFor={`${uid}-pw`}>
          <input id={`${uid}-pw`} type="password" autoComplete="new-password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder={tx.auth.passwordPh} className={inputClass} />
        </Field>
        {error && (
          <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-800">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
          {tx.auth.register}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        {tx.auth.haveAccount}{' '}
        <Link to="/login" className="font-semibold text-brand-700 hover:underline">
          {tx.auth.login}
        </Link>
      </p>
    </AuthLayout>
  );
}
