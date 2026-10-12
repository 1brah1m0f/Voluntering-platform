import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, ChevronRight, Compass, Crosshair, Globe2, Hand, Layers, Map as MapIcon, MapPin, Minus, Mountain, Plus, Satellite, Sparkles, Wallet, X } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapPage.css';
import { COUNTRY_COORDS, TILE_LAYERS } from '../geo';
import { useData } from '../DataContext';
import { countryCode } from '../personal';
import { KINDS } from '../taxonomy';
import { useAppText } from '../text';
import type { Opportunity } from '../types';
import { DeadlineChip, ErrorState, ProgramBadge, Spinner } from '../ui';
import { daysUntil } from '../util';
import { useTheme } from '../../ThemeProvider';

const ONLINE = 'online';
const HOME: L.LatLngTuple = [48, 16];
const KIND_KEY = 'openly_map_kind';
type MapKind = 'standard' | 'terrain' | 'satellite' | 'clean';
const MAP_KINDS: MapKind[] = ['clean', 'standard', 'terrain', 'satellite'];
const STYLE_ICONS = { clean: Layers, standard: MapIcon, terrain: Mountain, satellite: Satellite };
const COPY = {
  az: { subtitle: 'Növbəti macəran bir pin uzaqdadır.', explore: 'Dünyanı kəşf et', reset: 'Xəritəni mərkəzlə', zoomIn: 'Yaxınlaşdır', zoomOut: 'Uzaqlaşdır', destination: 'Növbəti dayanacaq', tilesError: 'Xəritə fonu yüklənmədi. İmkanlar ölkə düymələrində əlçatandır.' },
  en: { subtitle: 'Your next adventure is one pin away.', explore: 'Explore the world', reset: 'Reset view', zoomIn: 'Zoom in', zoomOut: 'Zoom out', destination: 'Your next stop', tilesError: 'The map background could not load. Opportunities are still available through the country buttons.' },
};
const isPhone = () => window.matchMedia('(max-width: 639px)').matches;
const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function readKind(): MapKind {
  try {
    const k = localStorage.getItem(KIND_KEY) as MapKind | null;
    return k && MAP_KINDS.includes(k) ? k : 'clean';
  } catch { return 'clean'; }
}

function flagFor(country: string) {
  const code = countryCode(country);
  return /^[A-Z]{2}$/.test(code) ? String.fromCodePoint(...Array.from(code, (c) => 127397 + c.charCodeAt(0))) : '◉';
}

function pinIcon(country: string, count: number, order: number) {
  // Only an ISO flag and a numeric count enter the HTML; country names use textContent.
  return L.divIcon({
    className: 'openly-map-marker',
    html: `<span class="map-pin" style="--pin-delay:${Math.min(order, 9) * 35}ms"><span class="map-pin-body"><span class="map-pin-flag" aria-hidden="true">${flagFor(country)}</span><span class="map-pin-count">${count}</span></span><span class="map-pin-tip"></span><span class="map-pin-ground"></span></span>`,
    iconSize: [68, 58],
    iconAnchor: [34, 55],
    tooltipAnchor: [0, -50],
  });
}

function EventCard({ o, index }: { o: Opportunity; index: number }) {
  const { tx, lang } = useAppText();
  return (
    <li className="map-event" style={{ '--card-delay': `${Math.min(index, 7) * 40}ms` } as CSSProperties}>
      <Link to={`/o/${o.id}`} className="map-event-link group flex items-center gap-3 rounded-2xl border p-3.5">
        <ProgramBadge program={o.program} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-brand-700">{o.program} · {KINDS[o.kind][lang]}</p>
          <p className="mt-0.5 line-clamp-2 text-sm font-bold leading-snug text-ink group-hover:text-brand-800">{o.title}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
            {!o.is_online && o.city && <span className="inline-flex items-center gap-1 text-slate-500"><MapPin className="h-3 w-3" aria-hidden="true" />{o.city}</span>}
            {o.costs === 'full' && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-800"><Wallet className="h-3 w-3" aria-hidden="true" />{tx.list.fullyFunded}</span>}
            <DeadlineChip deadline={o.deadline} />
          </div>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-brand-400 transition-transform group-hover:translate-x-1" aria-hidden="true" />
      </Link>
    </li>
  );
}

export default function MapPage() {
  const { tx, lang } = useAppText();
  const { theme } = useTheme();
  const m = tx.map;
  const copy = COPY[lang];
  const { opportunities, error, reload } = useData();
  const [params, setParams] = useSearchParams();
  const selected = params.get('country') ?? '';
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const returnFocus = useRef<HTMLElement | null>(null);
  const select = useCallback((country: string) => {
    if (country && document.activeElement instanceof HTMLElement) returnFocus.current = document.activeElement;
    setParams(country ? { country } : {}, { replace: true });
    if (!country) requestAnimationFrame(() => returnFocus.current?.isConnected && returnFocus.current.focus({ preventScroll: true }));
  }, [setParams]);
  const selectRef = useRef(select);
  selectRef.current = select;

  const mapEl = useRef<HTMLDivElement>(null);
  const frameEl = useRef<HTMLDivElement>(null);
  const headerEl = useRef<HTMLElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const fittedPhone = useRef(false);
  const visibleTiles = useRef<L.TileLayer | null>(null);
  const markersRef = useRef(new Map<string, { marker: L.Marker; count: number }>());
  const [mapState, setMapState] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [tilesFailed, setTilesFailed] = useState(false);
  const [kind, setKind] = useState<MapKind>(readKind);
  const tileKind = kind === 'clean' && theme === 'dark' ? 'cleanDark' : kind;

  const changeKind = (next: MapKind) => {
    setKind(next);
    try { localStorage.setItem(KIND_KEY, next); } catch { /* Storage unavailable. */ }
  };
  const open = useMemo(() => (opportunities ?? []).filter((o) => o.published && daysUntil(o.deadline) >= 0), [opportunities]);
  const counts = useMemo(() => {
    const result = Object.create(null) as Record<string, number>;
    for (const o of open) if (!o.is_online && o.country) result[o.country] = (result[o.country] ?? 0) + 1;
    return result;
  }, [open]);
  const onlineCount = open.filter((o) => o.is_online).length;

  useEffect(() => {
    const container = mapEl.current;
    if (!container) return;
    let map: L.Map | undefined;
    let resize: ResizeObserver | undefined;
    let frame = 0;
    try {
      const animate = !prefersReducedMotion();
      map = L.map(container, { center: HOME, zoom: isPhone() ? 3 : 4, zoomSnap: 0.5, minZoom: 2, maxZoom: 10, zoomControl: false, inertia: animate, zoomAnimation: animate, fadeAnimation: animate, markerZoomAnimation: animate });
      mapRef.current = map;
      map.on('click', () => selectRef.current(''));
      setMapState('ready');
      resize = new ResizeObserver(() => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => map?.invalidateSize({ pan: false }));
      });
      resize.observe(container);
    } catch (err) {
      console.error('[map] Leaflet init failed', err);
      setMapState('failed');
    }
    return () => {
      resize?.disconnect();
      cancelAnimationFrame(frame);
      markersRef.current.clear();
      map?.remove();
      mapRef.current = null;
      visibleTiles.current = null;
      fittedPhone.current = false;
    };
  }, []);

  // Leave room for the phone navigation even when the heading wraps or the screen rotates.
  useEffect(() => {
    const frame = frameEl.current;
    const header = headerEl.current;
    if (!frame || !header) return;
    let pending = 0;
    const update = () => {
      cancelAnimationFrame(pending);
      pending = requestAnimationFrame(() => {
        const top = Math.ceil(frame.getBoundingClientRect().top + window.scrollY);
        frame.style.setProperty('--map-top', `${top}px`);
      });
    };
    const observer = new ResizeObserver(update);
    observer.observe(header);
    window.addEventListener('resize', update, { passive: true });
    update();
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
      cancelAnimationFrame(pending);
    };
  }, [lang]);

  // Keep the old tiles underneath until the new style has loaded.
  useEffect(() => {
    const map = mapRef.current;
    if (mapState !== 'ready' || !map) return;
    const config = TILE_LAYERS[tileKind];
    const previous = visibleTiles.current;
    const layer = L.tileLayer(config.url, { attribution: config.attribution, subdomains: config.subdomains || 'abc', maxZoom: config.maxZoom, className: 'map-tile-layer', opacity: previous ? 0 : 1 });
    let disposed = false;
    let settled = false;
    let loadedTiles = 0;
    let failedTiles = 0;
    setTilesFailed(false);
    let removeOld: ReturnType<typeof setTimeout> | undefined;
    const reveal = () => {
      if (disposed || settled) return;
      // A failed new provider must not replace a working map underneath it.
      if (!loadedTiles && failedTiles) { setTilesFailed(true); return; }
      settled = true;
      visibleTiles.current = layer;
      layer.setOpacity(1);
      removeOld = setTimeout(() => previous?.remove(), prefersReducedMotion() ? 0 : 220);
    };
    const loaded = () => { if (!disposed) { loadedTiles += 1; setTilesFailed(false); } };
    const failed = () => { if (!disposed) failedTiles += 1; };
    layer.on('tileload', loaded);
    layer.on('tileerror', failed);
    layer.on('load', reveal);
    layer.addTo(map);
    // Keep controls usable if a provider is slow; the previous map stays underneath.
    const fallback = setTimeout(() => {
      if (loadedTiles) reveal();
      else if (failedTiles && !disposed) setTilesFailed(true);
    }, 2500);
    return () => {
      disposed = true;
      clearTimeout(fallback);
      clearTimeout(removeOld);
      layer.off('load', reveal);
      layer.off('tileload', loaded);
      layer.off('tileerror', failed);
      if (visibleTiles.current !== layer) layer.remove();
      else previous?.remove();
    };
  }, [mapState, tileKind]);

  // Reconcile countries without recreating pins when the selection changes.
  useEffect(() => {
    const map = mapRef.current;
    if (mapState !== 'ready' || !map) return;
    const markers = markersRef.current;
    for (const [country, entry] of markers) {
      if (!counts[country] || !Object.prototype.hasOwnProperty.call(COUNTRY_COORDS, country)) { entry.marker.remove(); markers.delete(country); }
    }
    Object.entries(counts).filter(([country]) => Object.prototype.hasOwnProperty.call(COUNTRY_COORDS, country)).forEach(([country, count], order) => {
      const coords = COUNTRY_COORDS[country];
      let entry = markers.get(country);
      if (!entry) {
        const marker = L.marker([coords.lat, coords.lng], { icon: pinIcon(country, count, order), bubblingMouseEvents: false, autoPanOnFocus: false });
        marker.on('click', () => selectRef.current(selectedRef.current === country ? '' : country));
        marker.addTo(map);
        marker.getElement()?.addEventListener('keydown', (event) => {
          if (event.key === ' ') { event.preventDefault(); marker.fire('click'); }
        });
        entry = { marker, count };
        markers.set(country, entry);
      } else if (entry.count !== count) {
        entry.marker.setIcon(pinIcon(country, count, order));
        entry.count = count;
      }
      const label = `${country} · ${m.count(count)}`;
      const tooltip = document.createElement('span');
      tooltip.textContent = label;
      if (entry.marker.getTooltip()) entry.marker.setTooltipContent(tooltip);
      else entry.marker.bindTooltip(tooltip, { direction: 'top', className: 'map-country-tooltip' });
      const element = entry.marker.getElement();
      element?.setAttribute('aria-label', label);
      element?.setAttribute('title', label);
      element?.setAttribute('aria-pressed', String(country === selectedRef.current));
      element?.classList.toggle('is-selected', country === selectedRef.current);
    });
    if (isPhone() && !fittedPhone.current && markers.size > 0 && !selectedRef.current) {
      fittedPhone.current = true;
      map.fitBounds(L.latLngBounds(Array.from(markers.values(), ({ marker }) => marker.getLatLng())), {
        paddingTopLeft: [50, 130], paddingBottomRight: [50, 110], maxZoom: 4, animate: false,
      });
    }
  }, [mapState, counts, m]);

  useEffect(() => {
    const map = mapRef.current;
    if (mapState !== 'ready' || !map) return;
    for (const [country, { marker }] of markersRef.current) {
      marker.getElement()?.classList.toggle('is-selected', country === selected);
      marker.getElement()?.setAttribute('aria-pressed', String(country === selected));
      marker.setZIndexOffset(country === selected ? 1000 : 0);
    }
    const coords = Object.prototype.hasOwnProperty.call(COUNTRY_COORDS, selected) ? COUNTRY_COORDS[selected] : undefined;
    if (!coords) return;
    const zoom = Math.min(Math.max(map.getZoom(), 5), 6);
    const desktop = window.matchMedia('(min-width: 1024px)').matches;
    const offset = desktop ? L.point(Math.min(170, map.getSize().x * 0.2), 0) : L.point(0, map.getSize().y * 0.22);
    const center = map.unproject(map.project([coords.lat, coords.lng], zoom).add(offset), zoom);
    map.stop().flyTo(center, zoom, { duration: 0.85, animate: !prefersReducedMotion() });
  }, [mapState, selected]);

  useEffect(() => {
    if (!selected) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') select(''); };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [selected, select]);

  const resetView = () => {
    select('');
    const map = mapRef.current;
    if (!map) return;
    map.stop();
    if (isPhone() && markersRef.current.size > 0) {
      map.fitBounds(L.latLngBounds(Array.from(markersRef.current.values(), ({ marker }) => marker.getLatLng())), {
        paddingTopLeft: [50, 130], paddingBottomRight: [50, 110], maxZoom: 4, animate: !prefersReducedMotion(), duration: 0.85,
      });
    } else map.flyTo(HOME, 4, { duration: 0.85, animate: !prefersReducedMotion() });
  };
  const list = (selected === ONLINE ? open.filter((o) => o.is_online) : selected ? open.filter((o) => !o.is_online && o.country === selected) : []).sort((a, b) => a.deadline.localeCompare(b.deadline));
  const chips = [
    ...Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([country, n]) => ({ id: country, label: country, n })),
    ...(onlineCount ? [{ id: ONLINE, label: m.online, n: onlineCount }] : []),
  ];
  const listHref = selected === ONLINE ? '/app?country=__online__&mine=0' : `/app?country=${encodeURIComponent(selected)}&mine=0`;

  return (
    <div className="openly-map">
      <header ref={headerEl} className="map-page-header">
        <div className="flex items-center gap-3.5">
          <span className="map-heading-icon"><Compass className="h-6 w-6" aria-hidden="true" /></span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{m.title}</h1>
            <p className="mt-1 text-sm text-slate-500">{copy.subtitle}</p>
          </div>
        </div>
        <div className="map-stats" aria-live="polite">
          <span className="map-stat"><span className="map-live-dot" /><span>{m.count(open.length)}</span></span>
          <span className="map-stat"><Globe2 className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" />{m.countries(Object.keys(counts).length)}</span>
        </div>
      </header>

      <div ref={frameEl} className={`map-frame ${selected ? 'has-selection' : ''}`}>
        <div ref={mapEl} className="map-canvas" aria-label={m.title} />
        <div className="map-vignette" aria-hidden="true" />

        {(!opportunities || mapState === 'loading') && !error && (
          <div className="map-loading">
            <span className="map-loading-compass"><Compass className="h-8 w-8" aria-hidden="true" /></span>
            <Spinner label={tx.loading} />
          </div>
        )}
        {error && <div className="map-loading"><ErrorState onRetry={reload} /></div>}
        {mapState === 'failed' && !error && (
          <div className="map-loading text-center"><Globe2 className="h-12 w-12 text-brand-300" aria-hidden="true" /><p className="max-w-xs text-sm font-medium text-brand-900">{m.loadError}</p></div>
        )}
        {tilesFailed && mapState === 'ready' && <p className="map-tile-notice" role="status">{copy.tilesError}</p>}

        {chips.length > 0 && <div className="map-country-bar">
          <span className="map-country-bar-icon"><Compass className="h-4 w-4" aria-hidden="true" /></span>
          <div className="map-country-chips" role="group" aria-label={m.pick}>
            {chips.map((chip) => (
              <button key={chip.id} type="button" aria-pressed={selected === chip.id} onClick={() => select(selected === chip.id ? '' : chip.id)} className={`map-country-chip ${selected === chip.id ? 'is-active' : ''}`}>
                {chip.id === ONLINE ? <Globe2 className="h-4 w-4" aria-hidden="true" /> : <span className="map-chip-flag" aria-hidden="true">{flagFor(chip.id)}</span>}
                {chip.label}<span className="map-chip-count">{chip.n}</span>
              </button>
            ))}
          </div>
        </div>}

        {opportunities && !error && !selected && open.length === 0 && <div className="map-empty-state" role="status"><span className="map-empty-icon"><Compass className="h-6 w-6" aria-hidden="true" /></span><p>{m.empty}</p></div>}

        {mapState === 'ready' && (
          <>
            <div className="map-controls" role="group" aria-label={m.title}>
              <button type="button" onClick={() => mapRef.current?.zoomIn(undefined, { animate: !prefersReducedMotion() })} aria-label={copy.zoomIn} title={copy.zoomIn}><Plus className="h-4.5 w-4.5" aria-hidden="true" /></button>
              <button type="button" onClick={() => mapRef.current?.zoomOut(undefined, { animate: !prefersReducedMotion() })} aria-label={copy.zoomOut} title={copy.zoomOut}><Minus className="h-4.5 w-4.5" aria-hidden="true" /></button>
              <button type="button" onClick={resetView} aria-label={copy.reset} title={copy.reset}><Crosshair className="h-4.5 w-4.5" aria-hidden="true" /></button>
            </div>
            {!selected && open.length > 0 && !tilesFailed && <div className="map-explore-hint"><span className="map-hint-icon"><Hand className="h-4 w-4" aria-hidden="true" /></span><div><p className="text-xs font-extrabold text-brand-800">{copy.explore}</p><p className="mt-0.5 text-xs text-slate-500">{m.hint}</p></div><Sparkles className="ml-2 h-4 w-4 text-coral-500" aria-hidden="true" /></div>}
            <div role="group" aria-label={m.kindLabel} className="map-style-picker">
              {MAP_KINDS.map((style) => {
                const Icon = STYLE_ICONS[style];
                return <button key={style} type="button" aria-pressed={kind === style} onClick={() => changeKind(style)} className={`map-style-option ${kind === style ? 'is-active' : ''}`}><span className={`map-style-swatch map-style-swatch-${style}`}><Icon className="h-4 w-4" aria-hidden="true" /></span><span>{m.kinds[style]}</span></button>;
              })}
            </div>
          </>
        )}

        {selected && (
          <section key={selected} aria-label={selected === ONLINE ? m.online : selected} className="map-opportunity-panel">
            <div className="map-sheet-handle" aria-hidden="true" />
            <header className="map-panel-header">
              <span className="map-destination-badge">{selected === ONLINE ? <Globe2 className="h-6 w-6" aria-hidden="true" /> : <span aria-hidden="true">{flagFor(selected)}</span>}</span>
              <div className="min-w-0 flex-1"><p className="map-destination-label">{copy.destination}</p><h2 className="mt-0.5 truncate text-xl font-extrabold">{selected === ONLINE ? m.online : selected}</h2><p className="mt-1 text-xs font-semibold text-brand-700">{m.count(list.length)}</p></div>
              <button type="button" onClick={() => select('')} aria-label={tx.close} className="map-panel-close"><X className="h-4 w-4" aria-hidden="true" /></button>
            </header>
            {list.length === 0 ? <p className="map-panel-empty" role="status">{m.empty}</p> : <ul className="map-event-list">{list.map((o, index) => <EventCard key={o.id} o={o} index={index} />)}</ul>}
            <Link to={listHref} className="map-panel-link">{m.openList}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          </section>
        )}
      </div>
    </div>
  );
}
