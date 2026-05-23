/* IconSettlement | vault with outflow arrow per PRIMITIVES section 07.
 * Matches IconCheck conventions. */
export function IconSettlement({ size = 16, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true" focusable="false">
      <rect x="3" y="6" width="14" height="12" rx="1" />
      <circle cx="10" cy="12" r="2" />
      <path d="M 17 12 H 22" />
      <path d="M 19 9 L 22 12 L 19 15" />
    </svg>
  );
}
