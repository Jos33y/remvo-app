import { useId } from 'react';
import styles from '@styles/ui/gold-ring.module.css';

/* ──────────────────────────────────────────────────────────────────
 * GoldRing — single source of truth for iridescent gold borders
 *
 * Renders an SVG <rect> or <circle> with a real <linearGradient>
 * stroke. Vector-precise curves at 1px, GPU antialiasing, no mask
 * arithmetic. Parent must be position: relative.
 *
 * Shapes:
 *   rect   — rounded rectangle with `radius` prop (default 14px).
 *            Used for CTAs, cards, denomination pills, link pills.
 *   circle — perfect circle. Rarely used directly; icon circles
 *            use a CSS solid hairline border instead.
 *
 * Design note: there is deliberately no "pill" shape. True pill
 * geometry (border-radius: 999px) can't be rendered sharply by
 * any single technique at small aspect ratios — SVG rx/ry clamps
 * independently to width/2 and height/2, CSS border-image doesn't
 * respect border-radius, and mask-composite aliases on small curves.
 * Across the codebase, elements that previously used pill shape
 * (denomination pills, link pills) are rendered as rounded
 * rectangles with 14px radius. Visually coherent with every CTA,
 * technically sharp at every zoom level.
 *
 * @param {{
 *   shape?: 'rect' | 'circle',
 *   radius?: number,       // CSS px for rect corners (default 14)
 *   strokeWidth?: number,  // default 1
 *   className?: string,
 * }} props
 * ────────────────────────────────────────────────────────────────── */

export function GoldRing({
  shape = 'rect',
  radius = 14,
  strokeWidth = 1,
  className = '',
}) {
  const uid = useId().replace(/[:]/g, '');
  const gradId = `goldRingGrad-${uid}`;
  const isCircle = shape === 'circle';

  return (
    <svg
      className={`${styles.ring} ${className}`}
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#B89438" />
          <stop offset="35%" stopColor="#C9A84C" />
          <stop offset="50%" stopColor="#D4B85C" />
          <stop offset="65%" stopColor="#C9A84C" />
          <stop offset="100%" stopColor="#A88838" />
        </linearGradient>
      </defs>

      {isCircle ? (
        <circle
          cx="50%"
          cy="50%"
          r={`calc(50% - ${strokeWidth / 2}px)`}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={strokeWidth}
          vectorEffect="non-scaling-stroke"
        />
      ) : (
        <rect
          x={strokeWidth / 2}
          y={strokeWidth / 2}
          width={`calc(100% - ${strokeWidth}px)`}
          height={`calc(100% - ${strokeWidth}px)`}
          rx={radius}
          ry={radius}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={strokeWidth}
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  );
}
