import { useState } from 'react';
import { Bookmark, ExternalLink, MapPin, Search } from 'lucide-react';
import { useLang, type EventStatus } from '../i18n';
import { Reveal, SectionHeader } from './Section';
import { DeadlineBadge, StatusPill } from './DashboardMockup';

const tabFilters: Array<(s: EventStatus) => boolean> = [
  () => true,
  (s) => s === 'saved',
  (s) => s === 'applied',
  (s) => s === 'accepted' || s === 'rejected',
];

function formatDate(daysFromNow: number, lang: string) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toLocaleDateString(lang === 'az' ? 'az-Latn-AZ' : 'en-GB', { day: 'numeric', month: 'short' });
}

export default function AppPreview() {
  const { t, lang } = useLang();
  const [tab, setTab] = useState(0);
  const events = t.events.filter((e) => tabFilters[tab](e.status));

  return (
    <section aria-labelledby="preview-title" className="relative overflow-hidden bg-brand-950 py-20 sm:py-24">
      <div className="pointer-events-none absolute -right-20 top-0 h-96 w-96 rounded-full bg-brand-600/30 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-coral-500/20 blur-3xl" />
      <div className="container-x relative">
        <SectionHeader id="preview-title" eyebrow={t.preview.eyebrow} title={t.preview.title} subtitle={t.preview.subtitle} light />

        <Reveal className="mt-12">
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl">
            {/* window chrome */}
            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-rose-300" />
              <span className="h-3 w-3 rounded-full bg-amber-300" />
              <span className="h-3 w-3 rounded-full bg-emerald-300" />
              <div className="ml-3 hidden flex-1 items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-xs text-slate-400 sm:flex">
                <Search className="h-3.5 w-3.5" aria-hidden="true" />
                fursat.az/dashboard
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-lg font-bold text-slate-900">{t.mock.tracking}</p>
                <div role="tablist" aria-label={t.mock.tracking} className="flex gap-1 overflow-x-auto rounded-full bg-slate-100 p-1">
                  {t.preview.tabs.map((label, i) => (
                    <button
                      key={label}
                      role="tab"
                      type="button"
                      aria-selected={tab === i}
                      onClick={() => setTab(i)}
                      className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${tab === i ? 'bg-white text-brand-800 shadow' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 hidden grid-cols-12 gap-4 border-b border-slate-100 pb-2 text-xs font-bold uppercase tracking-wider text-slate-400 md:grid">
                <span className="col-span-6">{t.preview.colEvent}</span>
                <span className="col-span-3">{t.preview.colDeadline}</span>
                <span className="col-span-3">{t.preview.colStatus}</span>
              </div>

              <ul className="mt-3 divide-y divide-slate-100 md:mt-0">
                {events.map((e) => (
                  <li key={e.title} className="grid gap-3 py-4 md:grid-cols-12 md:items-center md:gap-4">
                    <div className="flex min-w-0 items-start gap-3 md:col-span-6">
                      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-xs font-extrabold text-brand-700">
                        {e.org.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900">{e.title}</p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                          <span className="font-semibold text-brand-700">{e.org}</span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" aria-hidden="true" />
                            {e.place}
                          </span>
                          <span className="rounded bg-slate-100 px-1.5 py-0.5">{e.tag}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pl-[3.25rem] md:col-span-3 md:pl-0">
                      <DeadlineBadge days={e.daysLeft} />
                      <span className="text-xs text-slate-400">{formatDate(e.daysLeft, lang)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 pl-[3.25rem] md:col-span-3 md:pl-0">
                      <StatusPill status={e.status} />
                      <span className="flex gap-1 text-slate-400" aria-hidden="true">
                        <Bookmark className={`h-4 w-4 ${e.status === 'saved' ? 'fill-coral-500 text-coral-500' : ''}`} />
                        <ExternalLink className="h-4 w-4" />
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mt-4 text-center text-sm text-brand-200">{t.preview.note}</p>
        </Reveal>
      </div>
    </section>
  );
}
