/* IconMinus | remove affordance. */
export function IconMinus({ size = 16, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true" focusable="false">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
