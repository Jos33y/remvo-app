/* ──────────────────────────────────────────────────────────────────
 * IconCopy
 *
 * Two overlapping rounded rectangles. The foreground card is fully
 * outlined; the back card is suggested by an L-shaped path that
 * traces only its visible top and left edges. This keeps the icon
 * crisp at 16-18px where two complete overlapping rectangles would
 * look cluttered.
 *
 * Geometry: 24x24 viewBox, 1.5px stroke, 2px corner radii.
 *
 * @param {{ size?: number, className?: string }} props
 * ────────────────────────────────────────────────────────────────── */

export function IconCopy({ size = 16, className }) {
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
      {/* Back card: L-shaped outline tracing only the visible top + left edges */}
      <path d="M 16 8 L 16 6 Q 16 4 14 4 L 6 4 Q 4 4 4 6 L 4 14 Q 4 16 6 16 L 8 16" />
      {/* Front card: full rounded rectangle */}
      <rect x="8" y="8" width="12" height="12" rx="2" />
    </svg>
  );
}
