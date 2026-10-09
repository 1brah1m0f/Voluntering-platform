import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Clock, ExternalLink, Globe2, GraduationCap, HeartHandshake, Info, Smartphone, Users, UsersRound, Wallet } from 'lucide-react';
import { useLang } from '../../i18n';
import { GUIDES, guideBySlug, type Platform } from '../../content/guides';
import { InstallLink, detectPlatform } from '../../components/InstallPrompt';
import { PROGRAM_PAGES, programPageBySlug } from '../../content/programs';
import { programLogo } from '../../lib/programs';
import { useData } from '../DataContext';
import { useAppText } from '../text';
import { ErrorState, Spinner } from '../ui';
import { daysUntil } from '../util';
import { OpportunityCard } from './OpportunitiesPage';

// The four kinds of opportunity (landing page copy): icon and where "learn more" leads.
const KIND_ICONS = [Users, GraduationCap, HeartHandshake, Globe2];
const KIND_TARGETS = ['/guides/youth-exchange', '/programs/salto-youth', '/programs/european-solidarity-corps', '/programs/un-volunteers'];

function BackLink({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-brand-700">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      {label}
    </Link>
  );
}

/** /guides: the guides as a numbered reading path, the kinds of opportunity, and the programme hubs. */
export function GuidesPage() {
  const { tx, lang } = useAppText();
  const { t } = useLang();
  const { opportunities } = useData();
  const openIn = (name: string) => (opportunities ?? []).filter((o) => o.published && o.program === name && daysUntil(o.deadline) >= 0).length;
  // The numbered path is about applying; installing the app is linked under it instead.
  const path = GUIDES.filter((g) => g.slug !== 'install-app');
  const installGuide = guideBySlug('install-app');

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-[2.75rem] sm:leading-[1.1]">{tx.learn.title}</h1>
      <p className="mt-2 max-w-2xl text-slate-600 sm:text-lg">{tx.learn.sub}</p>

      <h2 className="mt-10 text-2xl font-extrabold tracking-tight">{tx.learn.guidesTitle}</h2>
      <div className="relative mt-4">
        <span className="pointer-events-none absolute inset-x-6 top-[1.3rem] hidden border-t-2 border-dashed border-line lg:block" aria-hidden="true" />
        <ol className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {path.map((g, i) => {
            const first = i === 0;
            return (
              <li key={g.slug} className="flex flex-col gap-3">
                <span
                  className={`hidden h-11 w-11 items-center justify-center rounded-full font-display font-extrabold ring-[6px] ring-paper lg:flex ${first ? 'bg-coral-700 text-white' : 'border-2 border-slate-300 bg-white text-slate-600'}`}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <Link
                  to={`/guides/${g.slug}`}
                  className={`group flex flex-1 flex-col gap-2 rounded-[1.375rem] p-5 transition hover:-translate-y-0.5 ${
                    first ? 'bg-brand-900 text-white hover:shadow-soft' : 'border border-line bg-white hover:border-brand-200 hover:shadow-card'
                  }`}
                >
                  <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${first ? 'text-brand-200' : 'text-brand-700'}`}>
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    {tx.learn.minutes(g.minutes)}
                  </span>
                  <span className={`font-display text-xl font-bold leading-snug ${first ? 'text-white' : 'text-ink group-hover:text-brand-800'}`}>{g.text[lang].title}</span>
                  <span className={`text-sm leading-relaxed ${first ? 'text-brand-100' : 'text-slate-600'}`}>{g.text[lang].summary}</span>
                  <ArrowRight
                    className={`mt-auto h-5 w-5 pt-1 transition group-hover:translate-x-1 ${first ? 'text-coral-200' : 'text-brand-700'}`}
                    aria-hidden="true"
                  />
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
      {installGuide && (
        <Link to={`/guides/${installGuide.slug}`} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-brand-700 hover:underline">
          <Smartphone className="h-4 w-4" aria-hidden="true" />
          {installGuide.text[lang].title}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}

      <h2 className="mt-12 text-2xl font-extrabold tracking-tight">{t.explain.title}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {t.explain.items.map((item, i) => {
          const Icon = KIND_ICONS[i];
          return (
            <Link key={item.title} to={KIND_TARGETS[i]} className="group flex flex-col gap-2 rounded-[1.375rem] border border-line bg-white p-5 transition hover:border-brand-200">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="font-display text-lg font-bold text-ink group-hover:text-brand-800">{item.title}</span>
              <span className="text-sm leading-relaxed text-slate-600">{item.text}</span>
            </Link>
          );
        })}
      </div>

      <h2 className="mt-12 text-2xl font-extrabold tracking-tight">{tx.learn.programsTitle}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {PROGRAM_PAGES.map((p) => {
          const logo = programLogo(p.name);
          return (
            <Link
              key={p.slug}
              to={`/programs/${p.slug}`}
              className="group flex items-center gap-4 rounded-[1.375rem] border border-line bg-white p-4 pr-5 transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card"
            >
              {logo ? (
                <span className="flex h-16 w-24 shrink-0 items-center justify-center rounded-2xl border border-line/70 bg-white p-2.5">
                  <img src={logo} alt="" className="max-h-full max-w-full object-contain" />
                </span>
              ) : (
                <span className="flex h-16 w-24 shrink-0 items-center justify-center rounded-2xl bg-brand-900 font-display text-lg font-extrabold text-white" aria-hidden="true">
                  {p.name
                    .split(/\s+/)
                    .map((w) => w[0])
                    .join('')}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block font-display text-lg font-bold text-ink group-hover:text-brand-800">{p.name}</span>
                <span className="mt-0.5 block text-sm text-slate-600">{p.text[lang].tagline}</span>
                <span className="mt-2 inline-block rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-900">{tx.program.open(openIn(p.name))}</span>
              </span>
              <ArrowRight className="h-5 w-5 shrink-0 text-brand-700 transition group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/** /guides/:slug — one guide. */
export function GuidePage() {
  const { slug = '' } = useParams();
  const { tx, lang } = useAppText();
  const guide = guideBySlug(slug);
  const [platform, setPlatform] = useState<Platform>(detectPlatform);

  if (!guide) {
    return (
      <div>
        <BackLink to="/guides" label={tx.learn.allGuides} />
        <p className="mt-10 rounded-3xl border border-dashed border-slate-300 py-14 text-center text-slate-500">{tx.detail.notFound}</p>
      </div>
    );
  }
  const g = guide.text[lang];
  const others = GUIDES.filter((x) => x.slug !== guide.slug).slice(0, 3);
  // A guide for one kind of opportunity links to that kind; general ones to the whole list.
  const browse = guide.kinds.length === 1 ? `/app?kind=${guide.kinds[0]}` : '/app';

  return (
    <div className="mx-auto max-w-3xl">
      <BackLink to="/guides" label={tx.learn.allGuides} />
      <article className="mt-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-card sm:p-10">
        <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700">
          <Clock className="h-4 w-4" aria-hidden="true" />
          {tx.learn.minutes(guide.minutes)}
        </p>
        <h1 className="mt-2 text-balance text-2xl font-extrabold leading-tight tracking-tight sm:text-4xl">{g.title}</h1>
        <p className="mt-3 text-lg leading-8 text-slate-600">{g.summary}</p>
        {/* Device picker: sections tied to a platform show one at a time. */}
        {g.sections.some((sec) => sec.platform) && (
          <div role="tablist" className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {g.sections.map(
              (sec) =>
                sec.platform && (
                  <button
                    key={sec.platform}
                    type="button"
                    role="tab"
                    aria-selected={platform === sec.platform}
                    onClick={() => setPlatform(sec.platform!)}
                    className={`rounded-2xl border px-3 py-2.5 text-sm font-bold transition ${
                      platform === sec.platform ? 'border-brand-700 bg-brand-700 text-white shadow-sm' : 'border-line bg-white text-slate-700 hover:border-brand-300'
                    }`}
                  >
                    {sec.h}
                  </button>
                ),
            )}
          </div>
        )}
        <div className="mt-8 space-y-8">
          {g.sections.filter((sec) => !sec.platform || sec.platform === platform).map((sec) => (
            <section key={sec.h}>
              <h2 className="text-xl font-bold">{sec.h}</h2>
              {sec.p.map((para) => (
                <p key={para.slice(0, 40)} className="mt-3 leading-8 text-slate-700">
                  {para}
                </p>
              ))}
              {sec.install && (
                <div className="mt-5">
                  <InstallLink hint={sec.installHint} />
                </div>
              )}
              {sec.images && (
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {sec.images.map((img) => (
                    <figure key={img.src}>
                      <img src={img.src} alt={img.alt} loading="lazy" width={739} height={900} className="h-auto w-full rounded-2xl border border-line shadow-sm" />
                      <figcaption className="mt-1.5 text-xs leading-snug text-slate-500">{img.alt}</figcaption>
                    </figure>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
        <div className="mt-10 rounded-2xl bg-slate-50 p-5">
          <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Info className="h-4 w-4 text-brand-600" aria-hidden="true" />
            {tx.learn.sources}
          </p>
          <ul className="mt-2 space-y-1.5">
            {guide.links.map((l) => (
              <li key={l.href}>
                <a href={l.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline">
                  {l.label}
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </div>
        <Link to={browse} className="btn-primary mt-8">
          {tx.learn.browse}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </article>

      <h2 className="mt-10 text-lg font-extrabold">{tx.learn.related}</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {others.map((o) => (
          <Link key={o.slug} to={`/guides/${o.slug}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-card">
            <p className="font-semibold leading-snug text-slate-900">{o.text[lang].title}</p>
            <p className="mt-2 text-xs font-semibold text-slate-500">{tx.learn.minutes(o.minutes)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

/** /programs/:slug — what the programme is, plus its open opportunities. */
export function ProgramPage() {
  const { slug = '' } = useParams();
  const { tx, lang } = useAppText();
  const { opportunities, error, reload } = useData();
  const page = programPageBySlug(slug);

  if (!page) {
    return (
      <div>
        <BackLink to="/guides" label={tx.learn.title} />
        <p className="mt-10 rounded-3xl border border-dashed border-slate-300 py-14 text-center text-slate-500">{tx.detail.notFound}</p>
      </div>
    );
  }
  if (error) return <ErrorState onRetry={reload} />;
  if (!opportunities) return <Spinner label={tx.loading} />;

  const t = page.text[lang];
  const logo = programLogo(page.name);
  const open = opportunities.filter((o) => o.published && o.program === page.name && daysUntil(o.deadline) >= 0);
  const facts = [
    { Icon: UsersRound, label: tx.program.who, text: t.who },
    { Icon: Wallet, label: tx.program.costs, text: t.costs },
  ];

  return (
    <div>
      <BackLink to="/guides" label={tx.learn.title} />
      <header className={`relative mt-4 overflow-hidden rounded-3xl bg-gradient-to-br ${page.tone} p-6 text-white shadow-soft sm:p-8`}>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          {logo && (
            <span className="flex h-16 w-24 shrink-0 items-center justify-center rounded-2xl bg-white p-2.5 shadow">
              <img src={logo} alt="" className="max-h-full max-w-full object-contain" />
            </span>
          )}
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold tracking-tight !text-white sm:text-3xl">{page.name}</h1>
            <p className="mt-1 text-white/85">{t.tagline}</p>
          </div>
          <a
            href={page.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full bg-white/15 px-4 py-2 text-sm font-semibold transition hover:bg-white/25 sm:ml-auto sm:self-center"
          >
            {tx.program.official}
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </header>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="font-bold">{tx.program.about}</h2>
          <p className="mt-2 leading-7 text-slate-700">{t.about}</p>
        </section>
        <div className="grid gap-4">
          {facts.map(({ Icon, label, text }) => (
            <section key={label} className="flex gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />
              <div>
                <h2 className="text-sm font-bold">{label}</h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-700">{text}</p>
              </div>
            </section>
          ))}
        </div>
      </div>

      <h2 className="mt-10 text-xl font-extrabold tracking-tight">{tx.program.open(open.length)}</h2>
      {open.length === 0 ? (
        <p className="mt-4 rounded-3xl border border-dashed border-slate-300 px-6 py-10 text-center text-slate-500">{tx.program.none}</p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {open.map((o) => (
            <OpportunityCard key={o.id} o={o} />
          ))}
        </div>
      )}
    </div>
  );
}
