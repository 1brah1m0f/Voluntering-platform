import { useEffect, useId, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, GraduationCap, KeyRound, Loader2, Lock, MessageCircle } from 'lucide-react';
import { instagramLink } from '../../config';
import { useAuth } from '../AuthContext';
import { backend } from '../backend';
import { NewPasswordForm } from '../pages/AuthPages';
import { ProfileHeader } from '../pages/ProfilePage';
import { hasStudent } from '../plans';
import { useAppText } from '../text';
import { Field, Spinner, inputClass } from '../ui';

/** /student/profile — the student account's own page: details, plan and password. */
export default function StudentProfilePage() {
  const { tx } = useAppText();
  const s = tx.student;
  const { profile, setProfile } = useAuth();
  const uid = useId();
  const [name, setName] = useState('');
  const [headline, setHeadline] = useState('');
  const [about, setAbout] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pwMsg, setPwMsg] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setName(profile.full_name);
    setHeadline(profile.headline ?? '');
    setAbout(profile.about ?? '');
  }, [profile]);

  if (!profile) return <Spinner label={tx.loading} />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setMsg({ ok: false, text: tx.auth.errors.nameRequired });
    setBusy(true);
    setMsg(null);
    try {
      setProfile(await backend.updateProfile({ full_name: name.trim(), headline: headline.trim(), about: about.trim() }));
      setMsg({ ok: true, text: tx.profile.saved });
    } catch (err) {
      console.error('[student profile] save failed', err);
      setMsg({ ok: false, text: tx.saveError });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/student" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-brand-700">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {s.backToHub}
      </Link>
      <ProfileHeader />

      <form onSubmit={submit} className="mt-6 space-y-5 rounded-3xl border border-line bg-white p-5 shadow-card sm:p-7">
        <div>
          <h2 className="text-lg font-bold">{s.profileTitle}</h2>
          <p className="mt-1 text-sm text-slate-500">{s.profileSub}</p>
        </div>
        <Field label={tx.profile.name} htmlFor={`${uid}-name`}>
          <input id={`${uid}-name`} value={name} maxLength={80} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </Field>
        <Field label={tx.profile.headline} htmlFor={`${uid}-headline`}>
          <input id={`${uid}-headline`} value={headline} maxLength={80} onChange={(e) => setHeadline(e.target.value)} placeholder={tx.profile.headlinePh} className={inputClass} />
        </Field>
        <Field label={tx.profile.about} htmlFor={`${uid}-about`} hint={s.aboutHint}>
          <textarea
            id={`${uid}-about`}
            rows={5}
            maxLength={2000}
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            placeholder={s.aboutPh}
            className={`${inputClass} resize-y`}
          />
        </Field>
        {msg && (
          <p role={msg.ok ? 'status' : 'alert'} className={`rounded-xl px-3 py-2 text-sm font-medium ${msg.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
            {msg.text}
          </p>
        )}
        <button type="submit" disabled={busy} className="btn-primary w-full sm:w-auto">
          {busy && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
          {tx.profile.save}
        </button>
      </form>

      <StudentPlanCard />

      <section className="mt-6 rounded-3xl border border-line bg-white p-5 shadow-card sm:p-7">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <KeyRound className="h-5 w-5 text-brand-600" aria-hidden="true" />
          {tx.profile.security}
        </h2>
        <p className="mb-4 mt-1 text-sm text-slate-500">{tx.profile.securityHint}</p>
        <NewPasswordForm submitLabel={tx.auth.savePassword} onDone={() => setPwMsg(true)} />
        {pwMsg && (
          <p role="status" className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
            {tx.auth.passwordChanged}
          </p>
        )}
      </section>
    </div>
  );
}

/** Whether the Student plan is on; active plans can be cancelled, locked ones point to what's inside. */
function StudentPlanCard() {
  const { tx } = useAppText();
  const s = tx.student;
  const { profile, setProfile } = useAuth();
  const [busy, setBusy] = useState(false);
  if (!profile) return null;
  const active = hasStudent(profile);
  // Admins have access without the plan; only a real plan can be cancelled.
  const cancellable = profile.plan === 'student';

  const cancel = async () => {
    if (!confirm(s.cancelPlanConfirm)) return;
    setBusy(true);
    try {
      setProfile(await backend.cancelPremium()); // back to the free plan
      alert(s.planCancelled);
    } catch (err) {
      console.error('[student profile] cancel failed', err);
      alert(tx.saveError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-6 overflow-hidden rounded-3xl border border-line bg-white shadow-card">
      <div className={`relative p-5 text-white sm:p-7 ${active ? 'bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950' : 'bg-brand-900'}`}>
        <span className="pointer-events-none absolute -right-14 -top-20 h-48 w-48 rounded-full bg-coral-500/80" aria-hidden="true" />
        <p className="relative inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-brand-100">
          {active ? <GraduationCap className="h-4 w-4" aria-hidden="true" /> : <Lock className="h-4 w-4" aria-hidden="true" />}
          {s.planTitle} · {s.badge}
        </p>
        <h2 className="relative mt-2 text-2xl font-extrabold !text-white">{active ? s.planActive : s.planLocked}</h2>
        <p className="relative mt-2 max-w-lg text-brand-100">{active ? s.planActiveSub : s.planLockedSub}</p>
        {!active && (
          <>
            <div className="relative mt-4 flex flex-wrap gap-2">
              <a
                href={instagramLink(s.waMessage(profile.email))}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-bold text-brand-800"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                {s.lockCta}
              </a>
              <Link to="/student" className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-2 text-sm font-bold text-white">
                {s.planSeeInside}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <p className="relative mt-3 text-sm text-brand-100">{s.lockNote}</p>
          </>
        )}
      </div>
      {cancellable && (
        <div className="p-5 sm:p-7">
          <h3 className="font-bold">{s.cancelPlan}</h3>
          <p className="mt-1 text-sm text-slate-500">{s.cancelPlanSub}</p>
          <button
            type="button"
            onClick={cancel}
            disabled={busy}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-rose-200 px-5 py-2.5 text-sm font-bold text-rose-700 transition hover:bg-rose-50 disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {s.cancelPlan}
          </button>
        </div>
      )}
    </section>
  );
}
