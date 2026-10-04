import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Check, Crown, GraduationCap, Lock } from 'lucide-react';
import { whatsappLink } from '../../config';
import { backend } from '../backend';
import { useAuth } from '../AuthContext';
import { useAppText } from '../text';
import { ROADMAP } from './roadmap';

/** What non-Student users see: what's inside, a blurred preview and the upgrade card. */
export function Paywall() {
  const { tx, lang } = useAppText();
  const { userId, profile } = useAuth();
  const location = useLocation();
  const [counts, setCounts] = useState({ scholarships: 0, universities: 0 });
  useEffect(() => {
    backend.studentCounts().then(setCounts, () => undefined);
  }, []);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="relative overflow-hidden rounded-[1.75rem] bg-brand-900 p-6 text-white sm:p-10">
        <span className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-coral-500/90" aria-hidden="true" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-bold">
            <GraduationCap className="h-4 w-4" aria-hidden="true" />
            {tx.student.badge}
          </span>
          <h1 className="mt-4 text-balance text-2xl font-extrabold leading-tight tracking-tight !text-white sm:text-4xl">{tx.student.lockTitle}</h1>
          <p className="mt-3 max-w-xl leading-relaxed text-brand-100">{tx.student.lockSub}</p>
          <ul className="mt-6 space-y-2.5">
            {tx.student.lockItems(counts.scholarships, counts.universities).map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-col items-start gap-2">
            {userId ? (
              <>
                {/* Purchases go through WhatsApp for now; the message names the account to upgrade. */}
                <a
                  href={whatsappLink(tx.student.waMessage(profile?.email ?? ''))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-bold text-brand-800 transition hover:-translate-y-0.5"
                >
                  <Crown className="h-5 w-5 text-amber-500" aria-hidden="true" />
                  {tx.student.lockCta}
                </a>
                <p className="text-sm text-brand-100">{tx.student.lockNote}</p>
              </>
            ) : (
              <Link to="/register?as=student" state={{ from: location.pathname }} className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-bold text-brand-800">
                {tx.student.lockGuest}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Preview: the roadmap's shape, without the content. */}
      <div className="relative mt-6 overflow-hidden rounded-3xl border border-line bg-white p-6" aria-hidden="true">
        <div className="space-y-4 blur-[3px]">
          {ROADMAP[lang].map((phase) => (
            <div key={phase.when} className="flex items-center gap-4">
              <span className="w-32 shrink-0 text-sm font-bold text-brand-700">{phase.when}</span>
              <span className="h-3 flex-1 rounded-full bg-slate-200" />
              <span className="h-3 w-16 rounded-full bg-slate-100" />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-white/40">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-card">
            <Lock className="h-5 w-5 text-brand-700" />
          </span>
        </div>
      </div>
    </div>
  );
}
