import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, ChevronRight, Globe2, Hand, MapPin, Wallet, X } from 'lucide-react';
import { COUNTRY_COORDS, hasMapsKey, loadGoogleMaps, type GoogleMaps } from '../geo';
import { useData } from '../DataContext';
import { countryCode } from '../personal';
import { KINDS } from '../taxonomy';
import { useAppText } from '../text';
import type { Opportunity } from '../types';
import { DeadlineChip, ErrorState, ProgramBadge, Spinner } from '../ui';
import { daysUntil } from '../util';

const ONLINE = 'online';

// A calm, warm map in the site's colours: no roads, transit or points of interest.
const MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#f5f2ea' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#66767b' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f2ea' }, { weight: 3 }] },
  { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#8fcbcf' }, { weight: 1.2 }] },
  { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#1c515a' }] },
  { featureType: 'administrative.province', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#97a3a6' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#efebe1' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#cdeeee' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#6aa9ad' }] },
];

// Google's own colourful map, just without the clutter of shops and stations.
const STANDARD_STYLES = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

type MapKind = 'standard' | 'terrain' | 'satellite' | 'clean';
const MAP_KINDS: MapKind[] = ['standard', 'terrain', 'satellite', 'clean'];
const KIND_KEY = 'openly_map_kind';

/** Map type id and styles for each choice in the switcher. */
function mapLook(kind: MapKind) {
  if (kind === 'satellite') return { mapTypeId: 'hybrid', styles: [] };
  if (kind === 'terrain') return { mapTypeId: 'terrain', styles: STANDARD_STYLES };
  if (kind === 'clean') return { mapTypeId: 'roadmap', styles: MAP_STYLES };
  return { mapTypeId: 'roadmap', styles: STANDARD_STYLES };
}

function readKind(): MapKind {
  try {
    const k = localStorage.getItem(KIND_KEY) as MapKind | null;
    return k && MAP_KINDS.includes(k) ? k : 'standard';
  } catch {
    return 'standard';
  }
}

/**
 * A clickable HTML pin on the map (country code + count). Built on OverlayView so
 * it can be styled with CSS and works without a map ID.
 */
function createPin(maps: GoogleMaps, map: GoogleMaps, position: { lat: number; lng: number }, html: string, onClick: () => void) {
  const Base = maps.OverlayView as new () => GoogleMaps;
  class Pin extends Base {
    el: HTMLButtonElement | null = null;
    onAdd() {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'absolute -translate-x-1/2 -translate-y-full cursor-pointer border-0 bg-transparent p-0 outline-none';
      el.innerHTML = html;
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onClick();
      });
      // Keep the map's own click (which closes the panel) from firing under the pin.
      maps.OverlayView.preventMapHitsAndGesturesFrom?.(el);
      this.el = el;
      this.getPanes().overlayMouseTarget.appendChild(el);
    }
    draw() {
      const p = this.getProjection()?.fromLatLngToDivPixel(new maps.LatLng(position.lat, position.lng));
      if (p && this.el) {
        this.el.style.left = `${p.x}px`;
        this.el.style.top = `${p.y}px`;
      }
    }
    onRemove() {
      this.el?.remove();
      this.el = null;
    }
  }
  const pin = new Pin();
  pin.setMap(map);
  return pin;
}

/** The pin's markup; the selected one is coral and a little bigger. */
function pinHtml(code: string, n: number, on: boolean) {
  return `<span class="flex flex-col items-center transition-transform duration-200 ${on ? 'scale-110' : 'hover:scale-110'}">
    <span class="flex items-center gap-1.5 rounded-full bg-white py-1 pl-1 pr-3 shadow-lg ring-1 ${on ? 'ring-2 ring-coral-500' : 'ring-black/5'}">
      <span class="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-extrabold text-white ${on ? 'bg-coral-700' : 'bg-brand-700'}">${code}</span>
      <span class="font-display text-sm font-extrabold text-ink">${n}</span>
    </span>
    <span class="-mt-1.5 h-3 w-3 rotate-45 bg-white shadow-md ${on ? 'ring-2 ring-coral-500' : ''}"></span>
  </span>`;
}

/** One opportunity in the panel; the whole card opens its page. */
function EventCard({ o }: { o: Opportunity }) {
  const { tx, lang } = useAppText();
  return (
    <li>
      <Link to={`/o/${o.id}`} className="group flex items-center gap-3 rounded-2xl border border-line bg-white p-3 transition hover:border-brand-300 hover:shadow-card">
        <ProgramBadge program={o.program} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-brand-700">
            {o.program} · {KINDS[o.kind][lang]}
          </p>
          <p className="mt-0.5 line-clamp-2 text-sm font-bold leading-snug text-ink group-hover:text-brand-800">{o.title}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
            {!o.is_online && o.city && (
              <span className="inline-flex items-center gap-1 text-slate-500">
                <MapPin className="h-3 w-3" aria-hidden="true" />
                {o.city}
              </span>
            )}
            {o.costs === 'full' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-800">
                <Wallet className="h-3 w-3" aria-hidden="true" />
                {tx.list.fullyFunded}
              </span>
            )}
            <DeadlineChip deadline={o.deadline} />
          </div>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600" aria-hidden="true" />
      </Link>
    </li>
  );
}

/**
 * /app/map — a full-size map with a pin per country (code + number of open
 * opportunities). Tapping a pin or a country chip opens a panel (a bottom sheet on
 * phones) with that country's opportunities; each card opens the opportunity page.
 * Without the map (no key / load error) the chips and the panel still work.
 */
export default function MapPage() {
  const { tx } = useAppText();
  const m = tx.map;
  const { opportunities, error, reload } = useData();
  const [params, setParams] = useSearchParams();
  const selected = params.get('country') ?? '';
  const select = (c: string) => setParams(c ? { country: c } : {}, { replace: true });

  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<GoogleMaps>(null);
  const pinsRef = useRef<GoogleMaps[]>([]);
  const [mapState, setMapState] = useState<'loading' | 'ready' | 'failed'>(hasMapsKey ? 'loading' : 'failed');
  const [kind, setKind] = useState<MapKind>(readKind);
  const changeKind = (k: MapKind) => {
    setKind(k);
    try {
      localStorage.setItem(KIND_KEY, k);
    } catch {
      /* storage blocked: the choice lasts for this visit */
    }
  };

  const open = useMemo(() => (opportunities ?? []).filter((o) => o.published && daysUntil(o.deadline) >= 0), [opportunities]);
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const o of open) if (!o.is_online && o.country) c[o.country] = (c[o.country] ?? 0) + 1;
    return c;
  }, [open]);
  const onlineCount = open.filter((o) => o.is_online).length;

  // Create the map once its container is on the page (after the data has loaded).
  const dataReady = opportunities !== null;
  useEffect(() => {
    if (!hasMapsKey || !mapEl.current || mapRef.current) return;
    let live = true;
    // Google calls this when the key is rejected (wrong key, domain not allowed…).
    (window as unknown as { gm_authFailure?: () => void }).gm_authFailure = () => live && setMapState('failed');
    loadGoogleMaps()
      .then((maps) => {
        if (!live || !mapEl.current) return;
        const map = new maps.Map(mapEl.current, {
          center: { lat: 47, lng: 22 },
          zoom: window.innerWidth < 640 ? 3 : 4,
          minZoom: 3,
          disableDefaultUI: true,
          zoomControl: true,
          zoomControlOptions: { position: maps.ControlPosition.RIGHT_TOP },
          gestureHandling: 'greedy',
          clickableIcons: false,
          backgroundColor: '#cdeeee',
          ...mapLook(readKind()),
        });
        map.addListener('click', () => select('')); // tapping the sea / land closes the panel
        mapRef.current = map;
        setMapState('ready');
      })
      .catch((err) => {
        console.error('[map] load failed', err);
        if (live) setMapState('failed');
      });
    return () => {
      live = false;
    };
  }, [dataReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // Switching the map type.
  useEffect(() => {
    if (mapState !== 'ready' || !mapRef.current) return;
    mapRef.current.setOptions(mapLook(kind));
  }, [mapState, kind]);

  // Pins, redrawn when the data or the selection changes; the selected country comes into view.
  useEffect(() => {
    const map = mapRef.current;
    const maps = (window as unknown as { google?: { maps?: GoogleMaps } }).google?.maps;
    if (mapState !== 'ready' || !map || !maps) return;
    pinsRef.current.forEach((p) => p.setMap(null));
    pinsRef.current = Object.entries(counts)
      .filter(([c]) => COUNTRY_COORDS[c])
      .map(([c, n]) => createPin(maps, map, COUNTRY_COORDS[c], pinHtml(countryCode(c), n, c === selected), () => select(c === selected ? '' : c)));
    if (selected && COUNTRY_COORDS[selected]) {
      map.panTo(COUNTRY_COORDS[selected]);
      // On phones the bottom sheet covers the lower half; keep the pin above it.
      if (window.innerWidth < 1024) map.panBy(0, Math.round((mapEl.current?.clientHeight ?? 0) * 0.22));
    }
  }, [mapState, counts, selected]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return <ErrorState onRetry={reload} />;
  if (!opportunities) return <Spinner label={tx.loading} />;

  const list = (selected === ONLINE ? open.filter((o) => o.is_online) : selected ? open.filter((o) => !o.is_online && o.country === selected) : []).sort((a, b) =>
    a.deadline.localeCompare(b.deadline),
  );
  const chips = [
    ...Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([c, n]) => ({ id: c, label: c, n })),
    ...(onlineCount ? [{ id: ONLINE, label: m.online, n: onlineCount }] : []),
  ];
  const listHref = selected === ONLINE ? '/app?country=__online__&mine=0' : `/app?country=${encodeURIComponent(selected)}&mine=0`;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{m.title}</h1>
        <p className="text-sm text-slate-500">
          {m.count(open.length)} · {m.countries(Object.keys(counts).length)}
        </p>
      </div>

      <div className="relative -mx-3.5 h-[calc(100dvh-13rem)] min-h-[26rem] overflow-hidden border-y border-line bg-[#cdeeee] sm:mx-0 sm:rounded-[2rem] sm:border sm:shadow-card lg:h-[calc(100vh-11rem)]">
        <div ref={mapEl} className="absolute inset-0" />

        {mapState === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#f5f2ea]">
            <Spinner />
          </div>
        )}
        {mapState === 'failed' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-brand-50 via-[#f5f2ea] to-coral-50 p-6 text-center">
            <Globe2 className="h-12 w-12 text-brand-300" aria-hidden="true" />
            <p className="max-w-xs text-sm font-medium text-brand-900">{hasMapsKey ? m.loadError : m.noKey}</p>
          </div>
        )}

        {/* Country chips over the top of the map. */}
        <div className="absolute inset-x-0 top-0 p-3 sm:right-16">
          <div className="flex gap-2 overflow-x-auto pb-1" role="radiogroup" aria-label={m.pick}>
            {chips.map((c) => (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={selected === c.id}
                onClick={() => select(selected === c.id ? '' : c.id)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold shadow-md backdrop-blur transition ${
                  selected === c.id ? 'bg-coral-700 text-white' : 'bg-white/95 text-slate-700 hover:bg-white'
                }`}
              >
                {c.id === ONLINE ? <Globe2 className="h-3.5 w-3.5" aria-hidden="true" /> : <span className="text-[0.6875rem] font-extrabold opacity-70">{countryCode(c.id)}</span>}
                {c.label}
                <span className={`rounded-full px-1.5 text-xs font-bold ${selected === c.id ? 'bg-white/25' : 'bg-paper text-slate-500'}`}>{c.n}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Hint until something is picked. */}
        {!selected && mapState === 'ready' && (
          <p className="pointer-events-none absolute bottom-4 left-1/2 hidden -translate-x-1/2 items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-ink shadow-lg sm:flex">
            <Hand className="h-4 w-4 text-coral-600" aria-hidden="true" />
            {m.hint}
          </p>
        )}

        {/* Map type switcher (hidden under the bottom sheet on phones). */}
        {mapState === 'ready' && (
          <div
            role="radiogroup"
            aria-label={m.kindLabel}
            className={`absolute bottom-3 left-3 gap-0.5 rounded-full bg-white/95 p-1 shadow-lg ${selected ? 'hidden lg:flex' : 'flex'}`}
          >
            {MAP_KINDS.map((k) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={kind === k}
                onClick={() => changeKind(k)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${kind === k ? 'bg-brand-800 text-white' : 'text-slate-600 hover:text-ink'}`}
              >
                {m.kinds[k]}
              </button>
            ))}
          </div>
        )}

        {/* The country's opportunities: a side panel on large screens, a bottom sheet on phones. */}
        {selected && (
          <section
            key={selected}
            aria-label={selected === ONLINE ? m.online : selected}
            className="absolute inset-x-0 bottom-0 flex max-h-[62%] animate-[sheet-up_0.25s_ease] flex-col rounded-t-[1.75rem] bg-paper/95 shadow-[0_-12px_40px_-12px_rgba(15,58,66,0.35)] backdrop-blur lg:inset-x-auto lg:bottom-4 lg:right-4 lg:top-16 lg:max-h-none lg:w-[24rem] lg:rounded-[1.75rem]"
          >
            <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-slate-300 lg:hidden" aria-hidden="true" />
            <header className="flex items-start gap-3 px-4 pb-3 pt-3 sm:px-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-coral-700 font-display text-sm font-extrabold text-white">
                {selected === ONLINE ? <Globe2 className="h-5 w-5" aria-hidden="true" /> : countryCode(selected)}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-lg font-extrabold">{selected === ONLINE ? m.online : selected}</h2>
                <Link to={listHref} className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:underline">
                  {m.count(list.length)} · {m.openList}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
              <button type="button" onClick={() => select('')} aria-label={tx.close} className="rounded-full bg-white p-2 text-slate-500 shadow-sm hover:text-ink">
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </header>
            {list.length === 0 ? (
              <p className="mx-4 mb-4 rounded-2xl border border-dashed border-line bg-white py-8 text-center text-sm text-slate-500">{m.empty}</p>
            ) : (
              <ul className="space-y-2 overflow-y-auto overscroll-contain px-4 pb-4 sm:px-5">
                {list.map((o) => (
                  <EventCard key={o.id} o={o} />
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
