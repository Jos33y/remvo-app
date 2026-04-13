/* IconClock — circle + two hands at 10:10. Matches IconCheck conventions. */
export function IconClock({ size = 16, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" />
      <path d="M 12 7 L 12 12 L 15.5 14" />
    </svg>
  );
}
