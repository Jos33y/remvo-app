/* IconLogout | door frame with arrow exiting. Matches IconCheck conventions. */
export function IconLogout({ size = 16, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true" focusable="false">
      <path d="M 14 4 H 5 V 20 H 14" />
      <path d="M 14 8 L 18 12 L 14 16" />
      <line x1="18" y1="12" x2="9" y2="12" />
    </svg>
  );
}
