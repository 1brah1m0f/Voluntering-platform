import { useEffect } from 'react';

/**
 * Page-wide pointer effects, attached once via event delegation so they
 * survive re-renders (e.g. switching language remounts the cards):
 *  - 3D tilt on `.tilt-card` (mouse only, not touch)
 *  - `.orb[data-depth]` parallax following the mouse
 *  - expanding ring on `.logo-pill` clicks
 */
export function useInteractions() {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let tilted: HTMLElement | null = null;
    const resetTilt = () => {
      if (tilted) tilted.style.transform = '';
      tilted = null;
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const card = (e.target as Element).closest<HTMLElement>('.tilt-card');
      if (card !== tilted) resetTilt();
      if (card) {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(1000px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateY(-6px)`;
        tilted = card;
      }

      const mx = e.clientX / window.innerWidth - 0.5;
      const my = e.clientY / window.innerHeight - 0.5;
      document.querySelectorAll<HTMLElement>('.orb[data-depth]').forEach((orb) => {
        const d = Number(orb.dataset.depth) || 20;
        orb.style.transform = `translate(${mx * d}px, ${my * d}px)`;
      });
    };

    const onClick = (e: MouseEvent) => {
      const pill = (e.target as Element).closest<HTMLElement>('.logo-pill');
      if (!pill) return;
      const r = pill.getBoundingClientRect();
      const ring = document.createElement('span');
      ring.className = 'click-ring';
      ring.style.left = `${e.clientX - r.left - 17}px`;
      ring.style.top = `${e.clientY - r.top - 17}px`;
      pill.appendChild(ring);
      window.setTimeout(() => ring.remove(), 600);
    };

    if (!reduced) document.addEventListener('pointermove', onMove);
    if (!reduced) document.addEventListener('click', onClick);
    document.addEventListener('mouseleave', resetTilt);
    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('click', onClick);
      document.removeEventListener('mouseleave', resetTilt);
    };
  }, []);
}
