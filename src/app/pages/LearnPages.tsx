import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, Clock, ExternalLink, Info, UsersRound, Wallet } from 'lucide-react';
import { GUIDES, guideBySlug } from '../../content/guides';
import { PROGRAM_PAGES, programPageBySlug } from '../../content/programs';
import { programLogo } from '../../lib/programs';
import { useData } from '../DataContext';
import { useAppText } from '../text';
import { ErrorState, Spinner } from '../ui';
import { daysUntil } from '../util';
import { OpportunityCard } from './OpportunitiesPage';

function BackLink({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-brand-700">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      {label}
    </Link>
  );
}

/** /guides: programme hubs and step-by-step guides. */
export function GuidesPage() {
  const { tx, lang } = useAppText();
  const { opportunities } = useData();
  const openIn = (name: string) => (opportunities ?? []).filter((o) => o.published && o.program === name && daysUntil(o.deadline) >= 0).length;

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{tx.learn.title}</h1>
      <p className="mt-1 max-w-2xl text-slate-600">{tx.learn.sub}</p>

      <h2 className="mt-8 text-lg font-extrabold">{tx.learn.guidesTitle}</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {GUIDES.map((g) => (
          <Link
            key={g.slug}
            to={`/guides/${g.slug}`}
            className="group flex flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <BookOpen className="h-5 w-5" aria-hidden="true" />
            </span>
            <h3 className="mt-3 font-bold leading-snug text-slate-900 group-hover:text-brand-800">{g.text[lang].title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{g.text[lang].summary}</p>
            <p className="mt-auto inline-flex items-center gap-1.5 pt-3 text-xs font-semibold text-slate-500">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {tx.learn.minutes(g.minutes)}
            </p>
          </Link>
        ))}
      </div>

      <h2 className="mt-10 text-lg font-extrabold">{tx.learn.programsTitle}</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {PROGRAM_PAGES.map((p) => {
          const logo = programLogo(p.name);
          return (
            <Link
              key={p.slug}
              to={`/programs/${p.slug}`}
              className="group flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card"
            >
              <span className="flex h-14 w-20 shrink-0 items-center justify-center rounded-2xl border border-slate-100 bg-white p-2">
                {logo ? <img src={logo} alt="" className="max-h-full max-w-full object-contain" /> : <BookOpen className="h-6 w-6 text-slate-400" aria-hidden="true" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold text-slate-900 group-hover:text-brand-800">{p.name}</span>
                <span className="mt-0.5 block text-sm text-slate-600">{p.text[lang].tagline}</span>
                <span className="mt-1.5 block text-xs font-semibold text-brand-700">{tx.program.open(openIn(p.name))}</span>
              </span>
              <ArrowRight className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-brand-600" aria-hidden="true" />
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
        <div className="mt-8 space-y-8">
          {g.sections.map((sec) => (
            <section key={sec.h}>
              <h2 className="text-xl font-bold">{sec.h}</h2>
              {sec.p.map((para) => (
                <p key={para.slice(0, 40)} className="mt-3 leading-8 text-slate-700">
                  {para}
                </p>
              ))}
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
