/* IconHome | abstract roof + base. Used for Dashboard nav.
 * Matches IconCheck conventions. */
export function IconHome({ size = 16, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true" focusable="false">
      <path d="M 3 11 L 12 4 L 21 11 V 20 H 3 Z" />
      <path d="M 9 20 V 14 H 15 V 20" />
    </svg>
  );
}
