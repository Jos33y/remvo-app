import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useReducedMotion } from '@hooks/useReducedMotion';
import styles from '@styles/ui/marketing/reveal.module.css';

/* Reveal
 *
 * A marketing section that rises into view the first time it is
 * scrolled to. The pages are pre-rendered, so everything starts
 * visible: in the HTML, to Google, and on the first screen. On first
 * render, only what sits below the fold is hidden (before the browser
 * paints), to rise when it is reached. Nothing on the first screen
 * waits for script, so the page's main text is never held back.
 *
 * Reduced motion: nothing is hidden and nothing moves.
 */

const useBeforePaint = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export function Reveal({ children, className, delay = 0 }) {
  const ref = useRef(null);
  // shown: as in the HTML. waiting: below the fold, hidden. in: risen.
  const [state, setState] = useState('shown');
  const reduced = useReducedMotion();

  useBeforePaint(() => {
    const el = ref.current;
    if (reduced || !el || typeof IntersectionObserver === 'undefined') return undefined;
    if (el.getBoundingClientRect().top < window.innerHeight) return undefined;

    setState('waiting');
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState('in');
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -30px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reduced]);

  const motion = state === 'waiting' ? styles.reveal : state === 'in' ? `${styles.reveal} ${styles.visible}` : '';

  return (
    <div
      ref={ref}
      className={[motion, className].filter(Boolean).join(' ') || undefined}
      style={delay && state !== 'shown' ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
