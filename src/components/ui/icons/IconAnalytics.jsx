/* ──────────────────────────────────────────────────────────────────
 * IconAnalytics
 *
 * Three ascending bars. Reads as "analytics" at any admin scale
 * (16/18/20). Matches the geometry conventions of the existing
 * admin icons: 24x24 viewBox, 1.5px stroke equivalent on fills.
 *
 * @param {{ size?: number, className?: string }} props
 * ────────────────────────────────────────────────────────────────── */

export function IconAnalytics({ size = 16, className }) {
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
      <line x1="6"  y1="19" x2="6"  y2="13" />
      <line x1="12" y1="19" x2="12" y2="9" />
      <line x1="18" y1="19" x2="18" y2="5" />
      <line x1="3"  y1="20" x2="21" y2="20" />
    </svg>
  );
}
