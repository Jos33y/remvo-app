/* ──────────────────────────────────────────────────────────────────
 * IconLock
 *
 * Geometric padlock. Square body with rounded corners, semicircular
 * shackle. 1.5px stroke matching the rest of the icon set. Used in
 * the checkout footer's "Secured by Remvo" trust signal.
 *
 * @param {{ size?: number, className?: string }} props
 * ────────────────────────────────────────────────────────────────── */

export function IconLock({ size = 14, className }) {
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
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M 8 11 V 8 a 4 4 0 0 1 8 0 v 3" />
    </svg>
  );
}
