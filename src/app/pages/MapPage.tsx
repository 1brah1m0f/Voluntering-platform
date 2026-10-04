import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Globe2, MapPin, Wallet } from 'lucide-react';
import { COUNTRY_COORDS, hasMapsKey, loadGoogleMaps, type GoogleMaps } from '../geo';
import { useData } from '../DataContext';
import { KINDS } from '../taxonomy';
import { useAppText } from '../text';
import type { Opportunity } from '../types';
import { DeadlineChip, ErrorState, ProgramBadge, SaveButton, Spinner } from '../ui';
import { daysUntil } from '../util';

const ONLINE = 'online';

// Calm map: no points of interest or transit, softer roads and water.
const MAP_STYLES = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ lightness: 60 }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#d5f3f3' }] },
  { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#78d2d5' }, { weight: 1 }] },
];

function Row({ o }: { o: Opportunity }) {
  const { tx, lang } = useAppText();
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3 shadow-sm transition hover:border-brand-200">
      <ProgramBadge program={o.program} />
      <div className="min-w-0 flex-1">
        <Link to={`/o/${o.id}`} className="line-clamp-2 text-sm font-bold leading-snug text-ink hover:text-brand-700">
          {o.title}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-500">{KINDS[o.kind][lang]}</span>
          {o.costs === 'full' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-800">
              <Wallet className="h-3 w-3" aria-hidden="true" />
              {tx.list.fullyFunded}
            </span>
          )}
          <DeadlineChip deadline={o.deadline} />
        </div>
      </div>
      <SaveButton id={o.id} />
    </li>
  );
}

/**
 * /app/map — open opportunities on a Google map, one bubble per country with the
 * count; tapping a country (on the map or in the chips) lists what's open there.
 * Works without the map too (no key / load error): the chips and list remain.
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
  const markersRef = useRef<GoogleMaps[]>([]);
  const [mapState, setMapState] = useState<'loading' | 'ready' | 'failed'>(hasMapsKey ? 'loading' : 'failed');

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
        mapRef.current = new maps.Map(mapEl.current, {
          center: { lat: 48, lng: 20 },
          zoom: window.innerWidth < 640 ? 3 : 4,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'cooperative',
          styles: MAP_STYLES,
        });
        setMapState('ready');
      })
      .catch((err) => {
        console.error('[map] load failed', err);
        if (live) setMapState('failed');
      });
    return () => {
      live = false;
    };
  }, [dataReady]);

  // One bubble per country with open opportunities; redrawn when the data or selection changes.
  useEffect(() => {
    const map = mapRef.current;
    const maps = (window as unknown as { google?: { maps?: GoogleMaps } }).google?.maps;
    if (mapState !== 'ready' || !map || !maps) return;
    markersRef.current.forEach((mk) => mk.setMap(null));
    markersRef.current = Object.entries(counts)
      .filter(([c]) => COUNTRY_COORDS[c])
      .map(([c, n]) => {
        const on = c === selected;
        const marker = new maps.Marker({
          map,
          position: COUNTRY_COORDS[c],
          title: `${c} · ${m.count(n)}`,
          label: { text: String(n), color: '#ffffff', fontWeight: '700', fontSize: '12px' },
          icon: {
            path: maps.SymbolPath.CIRCLE,
            scale: 13 + Math.min(n, 10),
            fillColor: on ? '#e8431f' : '#1b626c',
            fillOpacity: 0.95,
            strokeColor: '#ffffff',
            strokeWeight: 3,
          },
          zIndex: on ? 10 : 1,
        });
        marker.addListener('click', () => select(c === selected ? '' : c));
        return marker;
      });
    if (selected && COUNTRY_COORDS[selected]) map.panTo(COUNTRY_COORDS[selected]);
  }, [mapState, counts, selected]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return <ErrorState onRetry={reload} />;
  if (!opportunities) return <Spinner label={tx.loading} />;

  const list = (selected === ONLINE ? open.filter((o) => o.is_online) : selected ? open.filter((o) => !o.is_online && o.country === selected) : open).sort((a, b) =>
    a.deadline.localeCompare(b.deadline),
  );
  const chips = [
    { id: '', label: m.allCountries, n: open.length },
    ...Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([c, n]) => ({ id: c, label: c, n })),
    ...(onlineCount ? [{ id: ONLINE, label: m.online, n: onlineCount }] : []),
  ];
  const listHref = selected === ONLINE ? '/app?country=__online__&mine=0' : selected ? `/app?country=${encodeURIComponent(selected)}&mine=0` : '/app?mine=0';

  return (
    <div>
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
          <MapPin className="h-6 w-6 text-coral-600" aria-hidden="true" />
          {m.title}
        </h1>
        <p className="mt-1 text-sm text-slate-600 sm:text-base">{m.sub}</p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0">
          <div className="relative overflow-hidden rounded-3xl border border-line bg-brand-50 shadow-sm">
            <div ref={mapEl} className={`h-72 w-full sm:h-[26rem] lg:h-[32rem] ${mapState === 'failed' ? 'hidden' : ''}`} />
            {mapState === 'loading' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Spinner />
              </div>
            )}
            {mapState === 'failed' && (
              <div className="flex items-center gap-3 p-5 text-sm text-brand-900">
                <Globe2 className="h-6 w-6 shrink-0 text-brand-600" aria-hidden="true" />
                {hasMapsKey ? m.loadError : m.noKey}
              </div>
            )}
          </div>
          {/* Countries as chips: the same choice without the map (and on small screens). */}
          <div className="-mx-3.5 mt-3 flex gap-2 overflow-x-auto px-3.5 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" role="radiogroup" aria-label={m.pick}>
            {chips.map((c) => (
              <button
                key={c.id || 'all'}
                type="button"
                role="radio"
                aria-checked={selected === c.id}
                onClick={() => select(c.id)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                  selected === c.id ? 'border-brand-800 bg-brand-800 text-white' : 'border-line bg-white text-slate-700 hover:border-brand-300'
                }`}
              >
                {c.label}
                <span className={`rounded-full px-1.5 text-xs font-bold ${selected === c.id ? 'bg-white/20' : 'bg-paper text-slate-500'}`}>{c.n}</span>
              </button>
            ))}
          </div>
        </div>

        <aside className="min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="font-bold">
              {selected === ONLINE ? m.online : selected || m.allCountries} <span className="text-sm font-semibold text-slate-400">· {m.count(list.length)}</span>
            </h2>
            <Link to={listHref} className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:underline">
              {m.openList}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
          {list.length === 0 ? (
            <p className="mt-3 rounded-2xl border border-dashed border-line py-10 text-center text-sm text-slate-500">{m.empty}</p>
          ) : (
            <ul className="mt-3 space-y-2 lg:max-h-[32rem] lg:overflow-y-auto lg:pr-1">
              {list.slice(0, 30).map((o) => (
                <Row key={o.id} o={o} />
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
