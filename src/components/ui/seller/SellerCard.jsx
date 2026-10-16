import { useEffect, useRef } from 'react';
import { Logo } from '@components/ui/shared/Logo';
import { useReducedMotion } from '@hooks/useReducedMotion';
import s from '@styles/ui/seller/seller-card.module.css';

/* ──────────────────────────────────────────────────────────────────
 * SellerCard
 *
 * The Remvo seller card (brand direction 3.3 and 5): dark card stock,
 * a hairline gold edge, and a gold guilloché rosette engraved into one
 * corner, the way banknotes and old share certificates are engraved,
 * so it cannot be mistaken for a template card. Gold lives here and
 * nowhere else on the screen.
 *
 * The rosette is drawn from maths, not an image: rings of a circle
 * whose radius waves with the angle, each ring turned a little from
 * the last. It draws itself in once when the card first appears (the
 * screen's one moment of motion), and on a mouse the card tilts a few
 * degrees towards the pointer and the light moves across it.
 *
 * Reduced motion: the rosette is simply there, and nothing tilts.
 *
 *   holder      what is engraved along the bottom (the email being typed)
 *   holderHint  shown faintly while holder is empty
 *   label       the small word above it
 *   aside       { label, value } for the bottom right, or null
 * ────────────────────────────────────────────────────────────────── */

const SIZE = 260;
const C = SIZE / 2;
const STEPS = 240;

/* One engraved line: a circle whose radius waves `petals` times round,
 * turned by `phase`. Two families of these, turned opposite ways ring by
 * ring, cross each other and weave, which is what makes guilloché read
 * as engraving rather than a pattern fill. */
function wave(base, amp, petals, phase) {
  let d = '';
  for (let k = 0; k <= STEPS; k += 1) {
    const t = (k / STEPS) * Math.PI * 2;
    const r = base + amp * Math.sin(petals * t + phase);
    d += `${k ? 'L' : 'M'}${(C + r * Math.cos(t)).toFixed(2)} ${(C + r * Math.sin(t)).toFixed(2)}`;
  }
  return `${d}Z`;
}

/* The rose at the centre: r = R cos(k t), drawn as fine petals. */
function rose(R, k) {
  let d = '';
  for (let i = 0; i <= 720; i += 1) {
    const t = (i / 720) * Math.PI * 2;
    const r = R * Math.cos(k * t);
    d += `${i ? 'L' : 'M'}${(C + r * Math.cos(t)).toFixed(2)} ${(C + r * Math.sin(t)).toFixed(2)}`;
  }
  return d;
}

const PETALS = 18;
// Computed once for the whole app (about 60 KB of path data in memory, none shipped).
const RINGS = [
  ...Array.from({ length: 26 }, (_, i) => ({ d: wave(40 + i * 3.1, 7, PETALS, (i * Math.PI) / 26), w: 'a' })),
  ...Array.from({ length: 26 }, (_, i) => ({ d: wave(40 + i * 3.1, 7, PETALS, Math.PI - (i * Math.PI) / 26), w: 'b' })),
  { d: wave(124, 2.5, PETALS * 2, 0), w: 'edge' },
  { d: wave(127, 2.5, PETALS * 2, Math.PI), w: 'edge' },
];
const ROSE = rose(30, 9);

export function SellerCard({ holder = '', holderHint = '', label = 'Seller', aside = null, className = '' }) {
  const ref = useRef(null);
  const reduced = useReducedMotion();

  // Tilt towards a mouse pointer. Written straight to the element's
  // style in a frame callback: no React render per move.
  useEffect(() => {
    const el = ref.current;
    if (!el || reduced || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return undefined;
    let frame = 0;
    const onMove = (e) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const x = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width * 1.4)));
        const y = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height * 2.4)));
        el.style.setProperty('--tilt-x', `${(-y * 5).toFixed(2)}deg`);
        el.style.setProperty('--tilt-y', `${(x * 7).toFixed(2)}deg`);
        el.style.setProperty('--light', `${(50 + x * 40).toFixed(1)}%`);
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => { cancelAnimationFrame(frame); window.removeEventListener('pointermove', onMove); };
  }, [reduced]);

  return (
    <div className={`${s.stage} ${className}`}>
      <div ref={ref} className={s.card} role="img" aria-label={holder ? `Remvo seller card for ${holder}` : 'Remvo seller card'}>
        <svg className={s.rosette} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true" focusable="false">
          {RINGS.map((r, i) => (
            <path key={i} d={r.d} pathLength="1" className={`${s.ring} ${s[r.w]}`} style={{ '--i': i % 26 }} />
          ))}
          <path d={ROSE} pathLength="1" className={`${s.ring} ${s.rose}`} style={{ '--i': 30 }} />
          <circle cx={C} cy={C} r="33" className={s.hub} />
        </svg>
        <span className={s.sheen} aria-hidden="true" />
        <span className={s.frame} aria-hidden="true" />

        <div className={s.top}>
          <Logo variant="gold" size="small" showWordmark={false} href={null} />
          <span className={s.issuer}>Remvo seller</span>
        </div>

        <div className={s.bottom}>
          <span className={s.holder}>
            <span className={s.label}>{label}</span>
            <span className={`${s.value} ${holder ? '' : s.hint}`}>{holder || holderHint}</span>
          </span>
          {aside && (
            <span className={s.aside}>
              <span className={s.label}>{aside.label}</span>
              <span className={s.asideValue}>{aside.value}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
