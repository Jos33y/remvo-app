/* IconChevron | single chevron pointing right. Rotate via CSS transform
 * for up/down/left orientations. Matches IconCheck conventions. */
export function IconChevron({ size = 16, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true" focusable="false">
      <path d="M 9 6 L 15 12 L 9 18" />
    </svg>
  );
}
