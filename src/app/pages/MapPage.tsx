import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, ChevronRight, Globe2, Hand, MapPin, Wallet, X } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { COUNTRY_COORDS, TILE_LAYERS } from '../geo';
import { useData } from '../DataContext';
import { countryCode } from '../personal';
import { KINDS } from '../taxonomy';
import { useAppText } from '../text';
import type { Opportunity } from '../types';
import { DeadlineChip, ErrorState, ProgramBadge, Spinner } from '../ui';
import { daysUntil } from '../util';

const ONLINE = 'online';

type MapKind = 'standard' | 'terrain' | 'satellite' | 'clean';
const MAP_KINDS: MapKind[] = ['clean', 'standard', 'terrain', 'satellite'];
const KIND_KEY = 'openly_map_kind';

function readKind(): MapKind {
  try {
    const k = localStorage.getItem(KIND_KEY) as MapKind | null;
    return k && MAP_KINDS.includes(k) ? k : 'clean';
  } catch {
    return 'clean';
  }
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
 * /app/map — a full-size map with a pin per country using Leaflet (CartoDB / OpenStreetMap).
 * Zero API keys or billing accounts needed, completely free and lightweight.
 */
export default function MapPage() {
  const { tx } = useAppText();
  const m = tx.map;
  const { opportunities, error, reload } = useData();
  const [params, setParams] = useSearchParams();
  const selected = params.get('country') ?? '';
  const select = (c: string) => setParams(c ? { country: c } : {}, { replace: true });

  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [mapState, setMapState] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [kind, setKind] = useState<MapKind>(readKind);

  const changeKind = (k: MapKind) => {
    setKind(k);
    try {
      localStorage.setItem(KIND_KEY, k);
    } catch {
      /* storage blocked */
    }
  };

  const open = useMemo(() => (opportunities ?? []).filter((o) => o.published && daysUntil(o.deadline) >= 0), [opportunities]);
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const o of open) if (!o.is_online && o.country) c[o.country] = (c[o.country] ?? 0) + 1;
    return c;
  }, [open]);
  const onlineCount = open.filter((o) => o.is_online).length;

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;
    try {
      if ((mapEl.current as any)?._leaflet_id) {
        (mapEl.current as any)._leaflet_id = null;
      }

      const tileConfig = TILE_LAYERS[kind] || TILE_LAYERS.clean;
      const map = L.map(mapEl.current, {
        center: [48.0, 16.0],
        zoom: 4,
        minZoom: 3,
        maxZoom: 10,
        zoomControl: false,
      });

      // Zoom control in top-right
      L.control.zoom({ position: 'topright' }).addTo(map);

      const tileLayer = L.tileLayer(tileConfig.url, {
        attribution: tileConfig.attribution,
        subdomains: tileConfig.subdomains || 'abc',
        maxZoom: tileConfig.maxZoom,
      }).addTo(map);
      tileLayerRef.current = tileLayer;

      map.on('click', () => select(''));
      mapRef.current = map;

      map.whenReady(() => {
        setMapState('ready');
        setTimeout(() => {
          map.invalidateSize();
        }, 150);
      });

      const onResize = () => map.invalidateSize();
      window.addEventListener('resize', onResize);

      return () => {
        window.removeEventListener('resize', onResize);
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
      };
    } catch (err) {
      console.error('[map] Leaflet init failed', err);
      setMapState('failed');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Tile layer switching
  useEffect(() => {
    const map = mapRef.current;
    if (mapState !== 'ready' || !map) return;
    const tileConfig = TILE_LAYERS[kind] || TILE_LAYERS.clean;
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }
    const newLayer = L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      subdomains: tileConfig.subdomains || 'abc',
      maxZoom: tileConfig.maxZoom,
    }).addTo(map);
    tileLayerRef.current = newLayer;
  }, [mapState, kind]);

  // Render country pins
  useEffect(() => {
    const map = mapRef.current;
    if (mapState !== 'ready' || !map) return;

    markersRef.current.forEach((mk) => mk.remove());
    markersRef.current = [];

    Object.entries(counts)
      .filter(([c]) => COUNTRY_COORDS[c])
      .forEach(([c, n]) => {
        const coords = COUNTRY_COORDS[c];
        const isSelected = c === selected;
        const icon = L.divIcon({
          className: 'leaflet-div-icon',
          html: pinHtml(countryCode(c), n, isSelected),
          iconSize: [60, 42],
          iconAnchor: [30, 42],
        });
        const marker = L.marker([coords.lat, coords.lng], { icon });
        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          select(isSelected ? '' : c);
        });
        marker.addTo(map);
        markersRef.current.push(marker);
      });

    if (selected && COUNTRY_COORDS[selected]) {
      const coords = COUNTRY_COORDS[selected];
      map.panTo([coords.lat, coords.lng], { animate: true });
    }
  }, [mapState, counts, selected]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return <ErrorState onRetry={reload} />;

  const isDataLoading = !opportunities;
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

      <div className="relative -mx-3.5 h-[calc(100dvh-13rem)] min-h-104 overflow-hidden border-y border-line bg-[#cdeeee] sm:mx-0 sm:rounded-4xl sm:border sm:shadow-card lg:h-[calc(100vh-11rem)]">
        <div ref={mapEl} className="absolute inset-0 z-0 h-full w-full" />

        {(isDataLoading || mapState === 'loading') && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-paper/80 backdrop-blur-xs">
            <Spinner label={tx.loading} />
          </div>
        )}
        {mapState === 'failed' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-linear-to-br from-brand-50 via-paper to-coral-50 p-6 text-center">
            <Globe2 className="h-12 w-12 text-brand-300" aria-hidden="true" />
            <p className="max-w-xs text-sm font-medium text-brand-900">{m.loadError}</p>
          </div>
        )}

        {/* Country chips over the top of the map. */}
        <div className="absolute inset-x-0 top-0 z-10 p-3 sm:right-16">
          <div className="flex gap-2 overflow-x-auto pb-1" role="radiogroup" aria-label={m.pick}>
            {chips.map((c) => (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={selected === c.id}
                onClick={() => select(selected === c.id ? '' : c.id)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold shadow-md backdrop-blur-sm transition ${
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
          <p className="pointer-events-none absolute bottom-4 left-1/2 z-10 hidden -translate-x-1/2 items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-ink shadow-lg sm:flex">
            <Hand className="h-4 w-4 text-coral-600" aria-hidden="true" />
            {m.hint}
          </p>
        )}

        {/* Map type switcher */}
        {mapState === 'ready' && (
          <div
            role="radiogroup"
            aria-label={m.kindLabel}
            className={`absolute bottom-3 left-3 z-10 gap-0.5 rounded-full bg-white/95 p-1 shadow-lg ${selected ? 'hidden lg:flex' : 'flex'}`}
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
            className="absolute inset-x-0 bottom-0 z-20 flex max-h-[62%] animate-[sheet-up_0.25s_ease] flex-col rounded-t-[1.75rem] bg-paper/95 shadow-[0_-12px_40px_-12px_rgba(15,58,66,0.35)] backdrop-blur-sm lg:inset-x-auto lg:bottom-4 lg:right-4 lg:top-16 lg:max-h-none lg:w-[24rem] lg:rounded-[1.75rem]"
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
              <button type="button" onClick={() => select('')} aria-label={tx.close} className="rounded-full bg-white p-2 text-slate-500 shadow-xs hover:text-ink">
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
