/* IconAlert — rounded triangle with exclamation. Matches IconCheck conventions. */
export function IconAlert({ size = 16, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true" focusable="false">
      <path d="M 12 3 L 21.5 19.5 Q 22 20.5 21 20.5 L 3 20.5 Q 2 20.5 2.5 19.5 Z" />
      <line x1="12" y1="10" x2="12" y2="14" />
      <circle cx="12" cy="17" r="0.5" fill="currentColor" />
    </svg>
  );
}
