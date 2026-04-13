/* ──────────────────────────────────────────────────────────────────
 * IconCheck
 *
 * Two-segment polyline. Sharp pivot at the apex, no curve, no
 * flourish. Reads as a confident tick at any size from 12 to 32px.
 *
 * Geometry: 24x24 viewBox, 1.5px stroke. Pivot at (10, 17).
 *
 * @param {{ size?: number, className?: string }} props
 * ────────────────────────────────────────────────────────────────── */

export function IconCheck({ size = 16, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M 5 12 L 10 17 L 19 7" />
    </svg>
  );
}
