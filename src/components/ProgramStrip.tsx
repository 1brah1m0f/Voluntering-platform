import { useEffect, useRef } from 'react';
import { useLang } from '../i18n';
import { PROGRAMS } from '../lib/programs';

const logos = PROGRAMS.filter((p) => p.src);

// How far (px) from the cursor a logo starts to grow, and how big it gets.
const RADIUS = 320;
const MAX_SCALE = 0.35;
// Scroll speed of the marquee. The loop duration is derived from the track
// width, so adding logos or resizing the screen doesn't change the speed.
const SPEED_PX_PER_SECOND = 90;

/** Colourful logo marquee under the hero. Never stops; logos grow as the cursor gets close. */
export default function ProgramStrip() {
  const { t } = useLang();
  const stripRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const update = () => {
      const loopWidth = track.scrollWidth / 2;
      track.style.animationDuration = `${Math.max(loopWidth / SPEED_PX_PER_SECOND, 1)}s`;
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(track);
    return () => ro.disconnect();
  }, []);

  // Dock-style magnification. Logos keep moving, so distances are recomputed
  // every frame while the cursor is over the strip.
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cards = [...strip.querySelectorAll<HTMLElement>('.logo-card')];
    let pointer: { x: number; y: number } | null = null;
    let frame = 0;

    const tick = () => {
      if (!pointer) return;
      for (const card of cards) {
        const r = card.getBoundingClientRect();
        const d = Math.hypot(r.left + r.width / 2 - pointer.x, r.top + r.height / 2 - pointer.y);
        const k = Math.max(0, 1 - d / RADIUS);
        const eased = k * k * (3 - 2 * k); // smoothstep
        card.style.transform = `scale(${1 + MAX_SCALE * eased})`;
        card.style.zIndex = eased > 0.01 ? String(Math.round(eased * 10)) : '';
        card.style.boxShadow = eased > 0.01 ? `0 ${10 + 14 * eased}px ${30 + 20 * eased}px -12px ${card.dataset.glow}` : '';
      }
      frame = requestAnimationFrame(tick);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const start = !pointer;
      pointer = { x: e.clientX, y: e.clientY };
      if (start) frame = requestAnimationFrame(tick);
    };
    const onLeave = () => {
      pointer = null;
      cancelAnimationFrame(frame);
      for (const card of cards) {
        card.style.transform = '';
        card.style.zIndex = '';
        card.style.boxShadow = '';
      }
    };

    strip.addEventListener('pointermove', onMove);
    strip.addEventListener('pointerleave', onLeave);
    return () => {
      strip.removeEventListener('pointermove', onMove);
      strip.removeEventListener('pointerleave', onLeave);
      cancelAnimationFrame(frame);
    };
  }, []);

  // One group is repeated so it is wider than any screen; the track holds two
  // identical halves so the -50% translate loops seamlessly.
  const group = [...logos, ...logos];
  return (
    <section aria-label={t.strip.label} className="relative overflow-hidden border-y border-white bg-gradient-to-r from-brand-50 via-white to-coral-50 py-10">
      <div className="bg-dots pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
      <p className="relative mb-4 px-4 text-center text-xs font-extrabold uppercase tracking-wider sm:tracking-[0.2em]">
        <span className="text-gradient">{t.strip.label}</span>
      </p>
      <div ref={stripRef} className="mask-fade-x relative overflow-hidden py-8">
        <div ref={trackRef} className="logo-track flex w-max">
          {[0, 1].map((half) => (
            <ul key={half} className="flex shrink-0 items-center gap-5 pr-5 sm:gap-10 sm:pr-10" aria-hidden={half === 1 ? true : undefined}>
              {group.map((l, i) => {
                const hidden = half === 1 || i >= logos.length;
                return (
                  <li key={i}>
                    <a
                      href={l.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      tabIndex={hidden ? -1 : undefined}
                      data-glow={l.glow}
                      className="logo-card logo-pill relative flex h-16 w-36 items-center justify-center rounded-2xl bg-white px-4 shadow-card ring-1 ring-slate-100 sm:h-20 sm:w-48 sm:px-5"
                    >
                      <img src={l.src} alt={hidden ? '' : l.name} className={`${l.h} w-auto max-w-full object-contain`} loading="lazy" draggable={false} />
                    </a>
                  </li>
                );
              })}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}
