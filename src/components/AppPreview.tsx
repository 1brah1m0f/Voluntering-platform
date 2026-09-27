import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, Bookmark, CheckCircle2, Crown, ExternalLink, Heart, ListChecks, MapPin, MousePointerClick, Search, Send, Sparkles } from 'lucide-react';
import { useLang, type EventStatus, type MockEvent } from '../i18n';
import { Reveal, SectionHeader } from './Section';
import { DeadlineBadge, StatusPill } from './DashboardMockup';

const tabFilters: Array<(s: EventStatus) => boolean> = [
  () => true,
  (s) => s === 'saved',
  (s) => s === 'applied',
  (s) => s === 'accepted' || s === 'rejected',
];

// Clicking a status moves it along the application journey.
const nextStatus: Record<EventStatus, EventStatus> = { saved: 'applied', applied: 'accepted', accepted: 'rejected', rejected: 'saved' };

const navIcons = [Sparkles, ListChecks, Bell, Heart];

type Item = MockEvent & { bookmarked: boolean };

// Browsers often lack Azerbaijani month names (they print "M09"), so spell them out.
const months = {
  az: ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avq', 'sen', 'okt', 'noy', 'dek'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

function formatDate(daysFromNow: number, lang: 'az' | 'en') {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return `${d.getDate()} ${months[lang][d.getMonth()]}`;
}

/** How close the deadline is, as a filled bar (full = due now, empty = 30+ days). */
function DeadlineBar({ days }: { days: number }) {
  const fill = Math.min(1, Math.max(0.08, 1 - days / 30));
  const tone = days <= 3 ? 'from-coral-400 to-coral-600' : days <= 7 ? 'from-amber-300 to-amber-500' : 'from-brand-300 to-brand-500';
  return (
    <span className="mt-1.5 block h-1.5 w-full max-w-[9rem] overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
      <span className={`block h-full rounded-full bg-gradient-to-r ${tone}`} style={{ width: `${fill * 100}%` }} />
    </span>
  );
}

function OrgBadge({ e }: { e: MockEvent }) {
  if (e.logo) {
    return (
      <span className="flex h-12 w-16 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm ring-1 ring-slate-200">
        <img src={e.logo} alt="" className="max-h-full max-w-full object-contain" />
      </span>
    );
  }
  return (
    <span className="flex h-12 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 text-sm font-extrabold text-white">
      {e.org.slice(0, 2).toUpperCase()}
    </span>
  );
}

export default function AppPreview() {
  const { t, lang } = useLang();
  const p = t.preview;
  const [tab, setTab] = useState(0);
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<Item[]>(() => t.events.map((e) => ({ ...e, bookmarked: e.status === 'saved' })));
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef(0);

  // Sample data is per-language; start fresh when the language changes.
  useEffect(() => {
    setItems(t.events.map((e) => ({ ...e, bookmarked: e.status === 'saved' })));
  }, [t]);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  const showToast = (msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2200);
  };

  const counts = useMemo(
    () => ({
      saved: items.filter((e) => e.bookmarked).length,
      applied: items.filter((e) => e.status === 'applied').length,
      accepted: items.filter((e) => e.status === 'accepted').length,
    }),
    [items],
  );

  const q = query.trim().toLowerCase();
  const visible = items
    .map((e, i) => ({ e, i }))
    .filter(({ e }) => tabFilters[tab](e.status))
    .filter(({ e }) => !q || `${e.title} ${e.org} ${e.place} ${e.tag}`.toLowerCase().includes(q));

  const cycleStatus = (i: number) => {
    const status = nextStatus[items[i].status];
    setItems((cur) => cur.map((e, j) => (j === i ? { ...e, status } : e)));
    showToast(p.toast(items[i].title, t.status[status]));
  };

  const toggleBookmark = (i: number) => {
    const on = !items[i].bookmarked;
    setItems((cur) => cur.map((e, j) => (j === i ? { ...e, bookmarked: on } : e)));
    showToast(on ? p.savedToast : p.unsavedToast);
  };

  const stats = [
    { label: t.mock.stats.saved, value: counts.saved, Icon: Bookmark, tone: 'bg-coral-50 text-coral-700' },
    { label: t.mock.stats.applied, value: counts.applied, Icon: Send, tone: 'bg-brand-50 text-brand-700' },
    { label: t.mock.stats.accepted, value: counts.accepted, Icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-700' },
  ];

  return (
    <section aria-labelledby="preview-title" className="relative overflow-hidden bg-brand-950 py-20 sm:py-24">
      <div className="bg-dots-light pointer-events-none absolute inset-0 opacity-20" />
      <div className="animate-blob pointer-events-none absolute -right-20 top-0 h-96 w-96 rounded-full bg-brand-600/30 blur-3xl" />
      <div className="animate-blob pointer-events-none absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-coral-500/20 blur-3xl [animation-delay:-5s]" />
      <div className="animate-blob pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 rounded-full bg-violet-500/15 blur-3xl [animation-delay:-9s]" />
      <div className="container-x relative">
        <SectionHeader id="preview-title" eyebrow={p.eyebrow} title={p.title} subtitle={p.subtitle} light />

        <Reveal className="mt-12" variant="scale">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl ring-1 ring-white/10">
            {/* window chrome */}
            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-rose-300" />
              <span className="h-3 w-3 rounded-full bg-amber-300" />
              <span className="h-3 w-3 rounded-full bg-emerald-300" />
              <div className="ml-3 hidden flex-1 items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-xs text-slate-400 sm:flex">
                <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
                fursat.az/dashboard
              </div>
            </div>

            <div className="flex">
              {/* sidebar */}
              <aside className="hidden w-56 shrink-0 flex-col border-r border-slate-100 bg-slate-50/60 p-4 lg:flex" aria-hidden="true">
                <nav className="space-y-1">
                  {p.nav.map((label, i) => {
                    const Icon = navIcons[i];
                    const active = i === 1;
                    return (
                      <span
                        key={label}
                        className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold ${
                          active ? 'bg-white text-brand-800 shadow-sm ring-1 ring-slate-200' : 'text-slate-600'
                        }`}
                      >
                        <Icon className={`h-4 w-4 ${active ? 'text-brand-600' : 'text-slate-400'}`} />
                        {label}
                        {i === 2 && <span className="ml-auto rounded-full bg-coral-600 px-1.5 text-[10px] font-bold text-white">2</span>}
                      </span>
                    );
                  })}
                </nav>
                <div className="relative mt-auto overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 to-brand-950 p-4 text-white">
                  <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-coral-500/40 blur-2xl" />
                  <Crown className="relative h-5 w-5 text-amber-300" />
                  <p className="relative mt-2 text-sm font-bold leading-snug">{p.upgrade}</p>
                  <p className="relative mt-0.5 text-xs text-brand-100">{p.upgradeSub}</p>
                </div>
              </aside>

              {/* main */}
              <div className="min-w-0 flex-1 p-4 sm:p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-lg font-bold text-slate-900">{p.greeting}</p>
                    <p className="text-sm text-slate-500">{p.greetingSub}</p>
                  </div>
                  <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus-within:border-brand-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-100 md:w-72">
                    <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                    <input
                      type="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={p.search}
                      aria-label={p.search}
                      className="w-full bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none"
                    />
                  </label>
                </div>

                <ul className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
                  {stats.map(({ label, value, Icon, tone }) => (
                    <li key={label} className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-white p-2.5 shadow-sm sm:gap-3 sm:p-3">
                      <span className={`hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:flex ${tone}`}>
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="leading-tight">
                        <span key={value} className="block animate-[row-in_0.35s_ease] text-xl font-extrabold text-slate-900">
                          {value}
                        </span>
                        <span className="block text-xs text-slate-500">{label}</span>
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div role="tablist" aria-label={t.mock.tracking} className="flex gap-1 overflow-x-auto rounded-full bg-slate-100 p-1">
                    {p.tabs.map((label, i) => {
                      const n = items.filter((e) => tabFilters[i](e.status)).length;
                      return (
                        <button
                          key={label}
                          role="tab"
                          type="button"
                          aria-selected={tab === i}
                          onClick={() => setTab(i)}
                          className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
                            tab === i ? 'bg-white text-brand-800 shadow' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {label}
                          <span className={`rounded-full px-1.5 text-[10px] font-bold ${tab === i ? 'bg-brand-100 text-brand-800' : 'bg-slate-200 text-slate-600'}`}>{n}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-coral-700">
                    <MousePointerClick className="h-4 w-4" aria-hidden="true" />
                    {p.hint}
                  </p>
                </div>

                <div className="mt-5 hidden grid-cols-12 gap-4 border-b border-slate-100 pb-2 text-xs font-bold uppercase tracking-wider text-slate-400 md:grid">
                  <span className="col-span-6">{p.colEvent}</span>
                  <span className="col-span-3">{p.colDeadline}</span>
                  <span className="col-span-3">{p.colStatus}</span>
                </div>

                <ul className="mt-3 min-h-[12rem] divide-y divide-slate-100 md:mt-0">
                  {visible.length === 0 && <li className="py-12 text-center text-sm text-slate-500">{p.empty}</li>}
                  {visible.map(({ e, i }, k) => (
                    <li
                      key={`${tab}-${q}-${e.title}`}
                      className="grid animate-[row-in_0.35s_ease_both] gap-3 rounded-xl py-4 transition hover:bg-slate-50 md:grid-cols-12 md:items-center md:gap-4 md:px-2"
                      style={{ animationDelay: `${k * 50}ms` }}
                    >
                      <div className="flex min-w-0 items-start gap-3 md:col-span-6">
                        <OrgBadge e={e} />
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
                      <div className="pl-[4.75rem] md:col-span-3 md:pl-0">
                        <div className="flex items-center gap-2">
                          <DeadlineBadge days={e.daysLeft} />
                          <span className="text-xs text-slate-400">{formatDate(e.daysLeft, lang)}</span>
                        </div>
                        <DeadlineBar days={e.daysLeft} />
                      </div>
                      <div className="flex items-center justify-between gap-2 pl-[4.75rem] md:col-span-3 md:pl-0">
                        <button
                          type="button"
                          onClick={() => cycleStatus(i)}
                          className="rounded-full transition hover:scale-105 hover:ring-2 hover:ring-brand-200 focus-visible:ring-2"
                          aria-label={`${p.colStatus}: ${t.status[e.status]}`}
                        >
                          <StatusPill status={e.status} />
                        </button>
                        <span className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => toggleBookmark(i)}
                            aria-pressed={e.bookmarked}
                            aria-label={t.mock.save}
                            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-coral-50 hover:text-coral-600"
                          >
                            <Bookmark className={`h-4 w-4 transition ${e.bookmarked ? 'scale-110 fill-coral-500 text-coral-500' : ''}`} />
                          </button>
                          <span className="p-1.5 text-slate-400" aria-hidden="true">
                            <ExternalLink className="h-4 w-4" />
                          </span>
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* toast */}
            <div
              role="status"
              aria-live="polite"
              className={`pointer-events-none absolute left-1/2 top-16 z-10 flex max-w-[90%] -translate-x-1/2 items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-xl transition duration-300 ${
                toast ? 'translate-y-0 opacity-100' : '-translate-y-3 opacity-0'
              }`}
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
              <span className="truncate">{toast}</span>
            </div>
          </div>
          <p className="mt-4 text-center text-sm text-brand-200">{p.note}</p>
        </Reveal>
      </div>
    </section>
  );
}
