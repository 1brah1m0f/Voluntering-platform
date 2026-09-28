import { Check, Crown, Minus, Sparkles } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useAppText } from '../text';

function Cell({ value, strong = false }: { value: boolean | string; strong?: boolean }) {
  if (value === true) return <Check className={`mx-auto h-5 w-5 ${strong ? 'text-coral-600' : 'text-brand-600'}`} aria-label="✓" />;
  if (value === false) return <Minus className="mx-auto h-5 w-5 text-slate-300" aria-label="—" />;
  return <span className={`font-semibold ${strong ? 'text-coral-700' : 'text-slate-700'}`}>{value}</span>;
}

export default function PremiumPage() {
  const { tx } = useAppText();
  const p = tx.premium;
  const { profile } = useAuth();
  const isPremium = profile?.plan === 'premium';

  return (
    <div className="mx-auto max-w-3xl">
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
            <p className="mt-0.5 text-lg font-bold">{isPremium ? p.active : p.free}</p>
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

      {!isPremium && (
        <div className="mt-6 flex flex-col items-center gap-2 text-center">
          <button type="button" disabled className="btn-primary w-full cursor-not-allowed opacity-70 sm:w-auto">
            <Crown className="h-5 w-5" aria-hidden="true" />
            {p.cta}
          </button>
          <p className="max-w-md text-sm text-slate-500">{p.ctaNote}</p>
        </div>
      )}
    </div>
  );
}
