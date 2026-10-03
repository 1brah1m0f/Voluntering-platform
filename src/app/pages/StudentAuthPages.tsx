import { useId, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, Check, GraduationCap, Loader2, MailCheck } from 'lucide-react';
import { BRAND } from '../../config';
import { Logo } from '../../components/Icons';
import { useLang } from '../../i18n';
import { backend, BackendError } from '../backend';
import { useAuth } from '../AuthContext';
import { EMAIL_RE } from '../util';

const copy = {
  az: {
    eyebrow: 'Tələbə mərkəzi',
    loginTitle: 'Gələcəyini planlamağa başla',
    loginSub: 'Təqaüdlər, universitetlər və xaricdə təhsil yol xəritən bir yerdə.',
    registerTitle: 'Tələbə hesabını yarat',
    registerSub: 'Təhsil hədəflərini qur, fürsətləri müqayisə et və növbəti addımı bil.',
    name: 'Ad Soyad',
    email: 'E-poçt',
    password: 'Şifrə',
    namePh: 'Aysel Məmmədova',
    emailPh: 'sen@example.com',
    passwordPh: 'Ən azı 6 simvol',
    login: 'Tələbə kimi daxil ol',
    register: 'Tələbə hesabı yarat',
    switchLogin: 'Artıq hesabın var?',
    switchRegister: 'Tələbə hesabın yoxdur?',
    switchLoginCta: 'Daxil ol',
    switchRegisterCta: 'Qeydiyyatdan keç',
    confirm: 'E-poçtunu təsdiqlə',
    confirmSub: (email: string) => `${email} ünvanına təsdiq linki göndərdik.`,
    back: 'Openly əsas səhifəsinə qayıt',
    invalid: 'E-poçt və ya şifrə yanlışdır.',
    taken: 'Bu e-poçt artıq qeydiyyatdadır.',
    unknown: 'Xəta baş verdi. Yenidən cəhd et.',
    perks: ['16 addımlı təhsil yol xəritəsi', 'Təqaüd və universitet müqayisəsi', 'Sənə uyğun fərdi plan'],
  },
  en: {
    eyebrow: 'Student hub',
    loginTitle: 'Plan your next chapter',
    loginSub: 'Scholarships, universities and your study-abroad roadmap in one place.',
    registerTitle: 'Create your student account',
    registerSub: 'Set your goals, compare opportunities and always know your next step.',
    name: 'Full name',
    email: 'Email',
    password: 'Password',
    namePh: 'Aysel Mammadova',
    emailPh: 'you@example.com',
    passwordPh: 'At least 6 characters',
    login: 'Log in as a student',
    register: 'Create student account',
    switchLogin: 'Already have an account?',
    switchRegister: 'New to the student hub?',
    switchLoginCta: 'Log in',
    switchRegisterCta: 'Create account',
    confirm: 'Check your email',
    confirmSub: (email: string) => `We sent a confirmation link to ${email}.`,
    back: 'Back to the main Openly experience',
    invalid: 'The email or password is incorrect.',
    taken: 'This email is already registered.',
    unknown: 'Something went wrong. Please try again.',
    perks: ['A 16-step study roadmap', 'Scholarship and university comparisons', 'A plan tailored to your goals'],
  },
} as const;

function StudentAuthShell({ children }: { children: React.ReactNode }) {
  const { lang, setLang } = useLang();
  const tx = copy[lang];
  return (
    <div className="min-h-screen bg-[#f7fbfa] lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(460px,1.1fr)]">
      <aside className="relative hidden overflow-hidden bg-brand-950 p-10 text-white lg:flex lg:flex-col xl:p-16">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand-500/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-coral-500/20 blur-3xl" />
        <Link to="/" className="relative flex items-center gap-2 text-xl font-extrabold">
          <Logo className="h-9 w-9" />
          {BRAND}
        </Link>
        <div className="relative mt-auto max-w-lg">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-bold text-brand-100">
            <GraduationCap className="h-4 w-4" /> {tx.eyebrow}
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight xl:text-5xl">{lang === 'az' ? 'Təhsil planın üçün daha aydın yol.' : 'A clearer path for your study plans.'}</h1>
          <ul className="mt-8 space-y-4 text-brand-100">
            {tx.perks.map((perk) => (
              <li key={perk} className="flex items-center gap-3"><Check className="h-5 w-5 text-coral-300" />{perk}</li>
            ))}
          </ul>
        </div>
      </aside>
      <main className="flex min-h-screen flex-col px-5 py-6 sm:px-10 lg:px-16">
        <header className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-extrabold text-ink lg:hidden"><Logo className="h-8 w-8" />{BRAND}</Link>
          <Link to="/" className="hidden text-sm font-semibold text-slate-600 hover:text-brand-700 lg:inline-flex">{tx.back}</Link>
          <div className="ml-auto flex rounded-full border border-line bg-white p-0.5 text-xs font-bold">
            {(['az', 'en'] as const).map((l) => <button key={l} type="button" onClick={() => setLang(l)} className={`rounded-full px-3 py-1 uppercase ${lang === l ? 'bg-brand-900 text-white' : 'text-slate-500'}`}>{l}</button>)}
          </div>
        </header>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">{children}</div>
      </main>
    </div>
  );
}

function errorMessage(error: unknown, tx: typeof copy.az) {
  if (!(error instanceof BackendError)) return tx.unknown;
  if (error.code === 'invalid_credentials' || error.code === 'email_not_confirmed') return tx.invalid;
  if (error.code === 'email_taken') return tx.taken;
  return tx.unknown;
}

export function StudentLoginPage() {
  const { lang } = useLang();
  const tx = copy[lang];
  const { userId, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (!loading && userId) return <Navigate to="/student" replace />;
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (!EMAIL_RE.test(email.trim())) return setError(tx.invalid);
    setBusy(true);
    try { await backend.signIn(email.trim(), password); navigate('/student', { replace: true }); }
    catch (err) { setError(errorMessage(err, tx)); }
    finally { setBusy(false); }
  };
  return <StudentAuthShell><AuthCard title={tx.loginTitle} sub={tx.loginSub} linkText={tx.switchRegister} linkCta={tx.switchRegisterCta} linkTo="/student/register">
    <form onSubmit={submit} className="space-y-4">
      <AuthField label={tx.email} value={email} onChange={setEmail} type="email" placeholder={tx.emailPh} />
      <AuthField label={tx.password} value={password} onChange={setPassword} type="password" placeholder={tx.passwordPh} />
      {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700" role="alert">{error}</p>}
      <button disabled={busy} className="btn-primary w-full !rounded-2xl !py-3.5">{busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <>{tx.login}<ArrowRight className="h-4 w-4" /></>}</button>
      <Link to="/forgot-password" className="block text-center text-sm font-semibold text-brand-700 hover:underline">Şifrəni unutmusan?</Link>
    </form>
  </AuthCard></StudentAuthShell>;
}

export function StudentRegisterPage() {
  const { lang } = useLang();
  const tx = copy[lang];
  const { userId, loading } = useAuth();
  const navigate = useNavigate();
  const id = useId();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState('');
  const [busy, setBusy] = useState(false);
  if (!loading && userId && !confirmed) return <Navigate to="/student" replace />;
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (!name.trim() || !EMAIL_RE.test(email.trim()) || password.length < 6) return setError(tx.invalid);
    setBusy(true);
    try {
      const result = await backend.signUp(email.trim(), password, name.trim());
      if (result === 'confirm_email') setConfirmed(email.trim()); else navigate('/student', { replace: true });
    } catch (err) { setError(errorMessage(err, tx)); }
    finally { setBusy(false); }
  };
  return <StudentAuthShell>{confirmed ? <AuthCard title={tx.confirm} sub={tx.confirmSub(confirmed)} linkText="" linkCta=""><div className="flex justify-center py-4 text-brand-700"><MailCheck className="h-14 w-14" /></div><Link to="/student/login" className="btn-primary w-full !rounded-2xl">{tx.switchLoginCta}</Link></AuthCard> : <AuthCard title={tx.registerTitle} sub={tx.registerSub} linkText={tx.switchLogin} linkCta={tx.switchLoginCta} linkTo="/student/login">
    <form onSubmit={submit} className="space-y-4">
      <AuthField label={tx.name} value={name} onChange={setName} type="text" placeholder={tx.namePh} id={`${id}-name`} />
      <AuthField label={tx.email} value={email} onChange={setEmail} type="email" placeholder={tx.emailPh} id={`${id}-email`} />
      <AuthField label={tx.password} value={password} onChange={setPassword} type="password" placeholder={tx.passwordPh} id={`${id}-password`} />
      {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700" role="alert">{error}</p>}
      <button disabled={busy} className="btn-primary w-full !rounded-2xl !py-3.5">{busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <>{tx.register}<ArrowRight className="h-4 w-4" /></>}</button>
    </form>
  </AuthCard>}</StudentAuthShell>;
}

function AuthCard({ title, sub, linkText, linkCta, linkTo, children }: { title: string; sub: string; linkText: string; linkCta: string; linkTo?: string; children: React.ReactNode }) {
  return <div><div className="mb-8 flex items-center gap-3 text-sm font-bold uppercase tracking-wider text-brand-700"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-100"><BookOpen className="h-5 w-5" /></span>Openly Student</div><h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{title}</h1><p className="mt-3 text-slate-600">{sub}</p><div className="mt-8">{children}</div>{linkTo && <p className="mt-7 text-center text-sm text-slate-600">{linkText} <Link to={linkTo} className="font-bold text-brand-700 hover:underline">{linkCta}</Link></p>}</div>;
}

function AuthField({ label, value, onChange, type, placeholder, id }: { label: string; value: string; onChange: (value: string) => void; type: string; placeholder: string; id?: string }) {
  return <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-800">{label}</span><input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="field-surface" required /></label>;
}
