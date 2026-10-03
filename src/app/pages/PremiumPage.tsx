import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Crown, GraduationCap, Loader2, Minus, Sparkles } from 'lucide-react';
import { backend } from '../backend';
import { useAuth } from '../AuthContext';
import { useAppText } from '../text';

function Cell({ value, strong = false }: { value: boolean | string; strong?: boolean }) {
  if (value === true) return <Check className={`mx-auto h-5 w-5 ${strong ? 'text-coral-600' : 'text-brand-600'}`} aria-label="✓" />;
  if (value === false) return <Minus className="mx-auto h-5 w-5 text-slate-300" aria-label="—" />;
  return <span className={`font-semibold ${strong ? 'text-coral-700' : 'text-slate-700'}`}>{value}</span>;
}

/** Card offering the Student plan (shown to Free and Premium users). */
function StudentUpsell() {
  const { tx } = useAppText();
  const p = tx.premium;
  return (
    <Link
      to="/student/register"
      className="group mt-6 flex items-start gap-4 rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 to-brand-50 p-5 transition hover:-translate-y-0.5 hover:shadow-card sm:p-6"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-700 text-white shadow">
        <GraduationCap className="h-6 w-6" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block font-extrabold text-violet-950">{p.studentUpsellTitle}</span>
        <span className="mt-1 block text-sm leading-relaxed text-violet-900/80">{p.studentUpsellText}</span>
        <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-violet-700">
          {p.studentUpsellCta}
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" />
        </span>
      </span>
    </Link>
  );
}

/** Paid users see their plan and a cancel option — no sales pitch (Premium users also see the Student offer). */
function ActivePremium() {
  const { tx } = useAppText();
  const p = tx.premium;
  const { profile, setProfile } = useAuth();
  const student = profile?.plan === 'student';
  const [busy, setBusy] = useState(false);

  const cancel = async () => {
    if (!confirm(p.cancelConfirm)) return;
    setBusy(true);
    try {
      setProfile(await backend.cancelPremium());
      alert(p.cancelled);
    } catch (err) {
      console.error('[premium] cancel failed', err);
      alert(tx.saveError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 p-6 text-white shadow-soft sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-amber-400/25 blur-3xl" aria-hidden="true" />
        <p className="relative inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-brand-100">
          <Crown className="h-4 w-4 text-amber-300" aria-hidden="true" />
          {p.current}
        </p>
        <h2 className="relative mt-2 text-2xl font-extrabold !text-white">{student ? p.studentActive : p.active}</h2>
        <p className="relative mt-2 max-w-lg text-brand-100">{student ? p.studentActiveSub : p.activeSub}</p>
        {student && (
          <Link to="/student" className="relative mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold transition hover:bg-white/25">
            {p.openStudent}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}
      </div>

      {!student && <StudentUpsell />}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-lg font-bold">{p.cancelTitle}</h2>
        <p className="mt-1 text-sm text-slate-500">{p.cancelSub}</p>
        <button
          type="button"
          onClick={cancel}
          disabled={busy}
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-rose-200 px-5 py-2.5 text-sm font-bold text-rose-700 transition hover:bg-rose-50 disabled:opacity-60"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {p.cancelBtn}
        </button>
      </section>
    </div>
  );
}

/** The "Plan" tab of the profile page: Free users see what Premium adds; Premium users can cancel. */
export default function PremiumPlan() {
  const { tx } = useAppText();
  const p = tx.premium;
  const { profile } = useAuth();
  if (profile?.plan === 'premium' || profile?.plan === 'student') return <ActivePremium />;

  return (
    <div>
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 p-6 text-white shadow-soft sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-coral-500/30 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-brand-100">
              <Crown className="h-4 w-4 text-amber-300" aria-hidden="true" />
              {p.title}
            </p>
            <h1 className="mt-2 text-3xl font-extrabold !text-white">{p.price}</h1>
            <p className="mt-1 text-brand-100">{p.sub}</p>
          </div>
          <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm backdrop-blur">
            <p className="text-brand-100">{p.current}</p>
            <p className="mt-0.5 text-lg font-bold">{p.free}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left">
              <th className="px-4 py-3 font-semibold text-slate-600 sm:px-6">{p.feature}</th>
              <th className="w-20 px-2 py-3 text-center font-semibold text-slate-600 sm:w-28">{p.free}</th>
              <th className="w-24 px-2 py-3 text-center font-bold text-coral-700 sm:w-28">
                <span className="inline-flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  Premium
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {p.rows.map((r) => (
              <tr key={r.name}>
                <td className="px-4 py-3 text-slate-800 sm:px-6">{r.name}</td>
                <td className="px-2 py-3 text-center">
                  <Cell value={r.free} />
                </td>
                <td className="bg-coral-50/40 px-2 py-3 text-center">
                  <Cell value={r.premium} strong />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex flex-col items-center gap-2 text-center">
        <button type="button" disabled className="btn-primary w-full cursor-not-allowed opacity-70 sm:w-auto">
          <Crown className="h-5 w-5" aria-hidden="true" />
          {p.cta}
        </button>
        <p className="max-w-md text-sm text-slate-500">{p.ctaNote}</p>
      </div>
      <StudentUpsell />
    </div>
  );
}
