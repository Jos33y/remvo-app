import { useEffect, useState } from 'react';

/* ──────────────────────────────────────────────────────────────────
 * Motion for the seller app, from the Apple design reference:
 * springs, not fixed durations, so anything can be interrupted and
 * reversed mid-flight and carries the finger's speed when let go.
 *
 *   move      bounce 0,    0.4s   content changes
 *   small     bounce 0,    0.2s   toasts (motion spec: 180 to 220 ms)
 *   sheet     bounce 0.18, 0.28s  sheets opening (motion spec: 280 ms;
 *                                 they close faster, see Sheet.jsx)
 *   press     scale 0.97 on pointer-down, back on release
 *
 * Reduced motion: no movement at all, opacity only.
 * ────────────────────────────────────────────────────────────────── */

export const move = { type: 'spring', bounce: 0, visualDuration: 0.4 };
export const small = { type: 'spring', bounce: 0, visualDuration: 0.2 };
export const sheet = { type: 'spring', bounce: 0.18, visualDuration: 0.28 };
export const fade = { duration: 0.2, ease: [0.23, 1, 0.32, 1] }; // --ease-out

/** Momentum projection: where a flick would come to rest (d = 0.998). */
export const project = (velocity, decel = 0.998) => (velocity / 1000) * decel / (1 - decel);

export function useMediaQuery(query) {
  const get = () => (typeof window !== 'undefined' ? window.matchMedia(query).matches : false);
  const [matches, setMatches] = useState(get);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const on = (e) => setMatches(e.matches);
    mql.addEventListener('change', on);
    setMatches(mql.matches);
    return () => mql.removeEventListener('change', on);
  }, [query]);
  return matches;
}

export const useReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)');
export const useWide = () => useMediaQuery('(min-width: 900px)');
