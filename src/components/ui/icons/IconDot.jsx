/* ──────────────────────────────────────────────────────────────────
 * IconDot
 *
 * Solid filled circle. Used as the live status indicator dot. Inherits
 * its hue from the parent's `color` so the StatusIndicator can drive
 * the colour through CSS rather than props.
 *
 * Geometry: 24x24 viewBox, circle r=4 centred at (12, 12). The small
 * radius means even at size=8 the dot reads cleanly without aliasing.
 *
 * @param {{ size?: number, className?: string }} props
 * ────────────────────────────────────────────────────────────────── */

export function IconDot({ size = 8, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}
