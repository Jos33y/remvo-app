/* IconExport | down arrow into a tray per PRIMITIVES section 07.
 * Repurposed for Withdrawals nav (money leaving the system).
 * Matches IconCheck conventions. */
export function IconExport({ size = 16, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true" focusable="false">
      <path d="M 12 4 V 14" />
      <path d="M 8 11 L 12 15 L 16 11" />
      <path d="M 4 18 H 20 V 21 H 4 Z" />
    </svg>
  );
}
