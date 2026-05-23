/* IconAudit | document with checkmark stripe per PRIMITIVES section 07.
 * Matches IconCheck conventions. */
export function IconAudit({ size = 16, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true" focusable="false">
      <path d="M 5 3 H 14 L 19 8 V 21 H 5 Z" />
      <path d="M 14 3 V 8 H 19" />
      <path d="M 8 14 L 11 17 L 16 12" />
    </svg>
  );
}
