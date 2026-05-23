/* IconLayers | three stacked diamonds, echoes the vault mark.
 * Used for Transactions nav. Matches IconCheck conventions. */
export function IconLayers({ size = 16, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true" focusable="false">
      <path d="M 12 4 L 21 9 L 12 14 L 3 9 Z" />
      <path d="M 3 14 L 12 19 L 21 14" />
    </svg>
  );
}
