import { communityText } from '../community/text';
import { useLang } from '../../i18n';
import { useEffect, useId, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, KeyRound, Loader2 } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { backend } from '../backend';
import { NewPasswordForm } from '../pages/AuthPages';
import { ProfileHeader } from '../pages/ProfilePage';
import { useAppText } from '../text';
import { Field, Spinner, inputClass } from '../ui';

/** /student/profile — the student account's own page: details, plan and password. */
export default function StudentProfilePage() {
  const { tx, lang } = useAppText();
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
      <Link to="/student/community" className="btn-secondary mt-4 text-sm">{communityText[lang].title} →</Link>

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
  const { lang } = useLang();
  return <section className="mt-6 rounded-3xl border border-line bg-white p-6">
    <h2 className="text-xl font-bold">{lang === 'az' ? 'Tamamilə pulsuz' : 'Completely free'}</h2>
    <p className="mt-2 text-slate-600">{lang === 'az' ? 'Bütün tələbə imkanları açıqdır. AI məsləhətçi: gündə 10 istifadə.' : 'All student features are available. AI advisor: 10 uses per day.'}</p>
  </section>;
}
