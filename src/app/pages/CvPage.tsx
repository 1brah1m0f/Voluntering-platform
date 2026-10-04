import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Cake, Link2, Mail, MapPin, PenLine, Printer } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useData } from '../DataContext';
import { LANG_LEVELS, THEMES } from '../personal';
import { INTERESTS, KINDS, type InterestId } from '../taxonomy';
import { useAppText } from '../text';
import { Avatar, Spinner } from '../ui';

function CvBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="break-inside-avoid">
      <h2 className="border-b border-line pb-1.5 text-xs font-extrabold uppercase tracking-[0.18em] text-brand-700">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/**
 * /app/cv — a one-page volunteer CV built from the profile (studies, languages,
 * skills, experience, accepted programmes). "Save as PDF" uses the browser's
 * print dialog; the app chrome is hidden when printing (print:hidden).
 */
export default function CvPage() {
  const { tx, lang } = useAppText();
  const c = tx.cv;
  const { profile } = useAuth();
  const { opportunities, saved } = useData();
  if (!profile || !opportunities) return <Spinner label={tx.loading} />;

  const p = profile.prefs ?? {};
  const theme = THEMES[p.theme ?? 'teal'] ?? THEMES.teal;
  const accepted = opportunities.filter((o) => saved.get(o.id)?.status === 'accepted');
  const study = [p.occupation ? tx.profile.occupations[p.occupation] : '', p.school, p.field].filter(Boolean);
  const languages = p.languages ?? [];
  const skills = p.skills ?? [];
  const experiences = [...(p.experiences ?? [])].sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
  const thin = !study.length && !languages.length && !skills.length && !experiences.length && !profile.about.trim();
  const levelWidth = (lv: string) => `${((LANG_LEVELS.indexOf(lv as (typeof LANG_LEVELS)[number]) + 1) / LANG_LEVELS.length) * 100}%`;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link to="/app/profile?tab=journey" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-brand-700">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {c.back}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/app/profile" className="btn-secondary !py-2 text-sm">
            <PenLine className="h-4 w-4" aria-hidden="true" />
            {c.edit}
          </Link>
          <button type="button" onClick={() => window.print()} className="btn-primary !py-2 text-sm">
            <Printer className="h-4 w-4" aria-hidden="true" />
            {c.print}
          </button>
        </div>
      </div>
      <p className="mb-4 text-sm text-slate-500 print:hidden">{c.printHint}</p>
      {thin && <p className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 print:hidden">{c.empty}</p>}

      <article className="overflow-hidden rounded-3xl border border-line bg-white shadow-card print:rounded-none print:border-0 print:shadow-none">
        <header className={`flex flex-col gap-5 bg-gradient-to-br p-6 text-white sm:flex-row sm:items-center sm:p-8 print:p-6 ${theme.cover}`}>
          <Avatar profile={profile} className="h-24 w-24 text-3xl ring-4 ring-white/40" />
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-extrabold tracking-tight !text-white">{profile.full_name || profile.email}</h1>
            {(profile.headline || study.length > 0) && <p className="mt-1 text-white/90">{profile.headline || study.join(' · ')}</p>}
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/90">
              <li className="inline-flex items-center gap-1.5">
                <Mail className="h-4 w-4" aria-hidden="true" />
                {profile.email}
              </li>
              {profile.country && (
                <li className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                  {profile.country}
                </li>
              )}
              {p.birth_year && (
                <li className="inline-flex items-center gap-1.5">
                  <Cake className="h-4 w-4" aria-hidden="true" />
                  {c.born(p.birth_year)}
                </li>
              )}
              {p.linkedin && (
                <li className="inline-flex min-w-0 items-center gap-1.5">
                  <Link2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{p.linkedin.replace(/^https?:\/\/(www\.)?/, '')}</span>
                </li>
              )}
            </ul>
          </div>
        </header>

        <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-[1fr_2fr] print:grid-cols-[1fr_2fr] print:p-6">
          <div className="space-y-7">
            {languages.length > 0 && (
              <CvBlock title={c.languages}>
                <ul className="space-y-2.5">
                  {languages.map((l) => (
                    <li key={l.name}>
                      <div className="flex items-baseline justify-between gap-2 text-sm">
                        <span className="font-semibold text-ink">{l.name}</span>
                        <span className="text-xs font-bold text-slate-500">{l.level === 'native' ? tx.profile.levelNative : l.level}</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-paper print:border print:border-line">
                        <div className="h-full rounded-full bg-brand-700" style={{ width: levelWidth(l.level) }} />
                      </div>
                    </li>
                  ))}
                </ul>
              </CvBlock>
            )}
            {skills.length > 0 && (
              <CvBlock title={c.skills}>
                <ul className="flex flex-wrap gap-1.5">
                  {skills.map((s) => (
                    <li key={s} className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-800 print:border print:border-brand-200">
                      {s}
                    </li>
                  ))}
                </ul>
              </CvBlock>
            )}
            {profile.interests.length > 0 && (
              <CvBlock title={c.interests}>
                <p className="text-sm text-slate-700">{profile.interests.map((i) => INTERESTS[i as InterestId]?.[lang] ?? i).join(', ')}</p>
              </CvBlock>
            )}
          </div>

          <div className="space-y-7">
            {profile.about.trim() && (
              <CvBlock title={c.about}>
                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{profile.about.trim()}</p>
              </CvBlock>
            )}
            {study.length > 0 && (
              <CvBlock title={c.education}>
                <p className="font-semibold text-ink">{p.school || (p.occupation ? tx.profile.occupations[p.occupation] : '')}</p>
                {p.field && <p className="text-sm text-slate-600">{p.field}</p>}
              </CvBlock>
            )}
            {experiences.length > 0 && (
              <CvBlock title={c.experience}>
                <ol className="space-y-3 border-l-2 border-brand-100 pl-4">
                  {experiences.map((e, i) => (
                    <li key={`${e.title}-${i}`} className="relative">
                      <span className="absolute -left-[1.4rem] top-1.5 h-2.5 w-2.5 rounded-full bg-brand-600 ring-4 ring-white" aria-hidden="true" />
                      <p className="font-semibold text-ink">{e.title}</p>
                      <p className="text-sm text-slate-500">{[e.org, e.country, e.year].filter(Boolean).join(' · ')}</p>
                    </li>
                  ))}
                </ol>
              </CvBlock>
            )}
            {accepted.length > 0 && (
              <CvBlock title={c.openly}>
                <ul className="space-y-2">
                  {accepted.map((o) => (
                    <li key={o.id}>
                      <p className="font-semibold text-ink">{o.title}</p>
                      <p className="text-sm text-slate-500">{[o.program, KINDS[o.kind][lang], o.is_online ? tx.list.online : o.country, o.start_date?.slice(0, 4)].filter(Boolean).join(' · ')}</p>
                    </li>
                  ))}
                </ul>
              </CvBlock>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}
