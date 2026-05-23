/* IconBuilding | platform silhouette. Used for Platforms nav.
 * Matches IconCheck conventions. */
export function IconBuilding({ size = 16, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true" focusable="false">
      <path d="M 4 20 V 5 H 14 V 20" />
      <path d="M 14 11 H 20 V 20" />
      <path d="M 4 20 H 20" />
      <line x1="7" y1="9" x2="9" y2="9" />
      <line x1="11" y1="9" x2="13" y2="9" />
      <line x1="7" y1="13" x2="9" y2="13" />
      <line x1="11" y1="13" x2="13" y2="13" />
      <line x1="17" y1="15" x2="17" y2="15.5" />
    </svg>
  );
}
