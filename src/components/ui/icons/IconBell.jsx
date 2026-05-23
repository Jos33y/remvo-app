/* IconBell | bell silhouette with clapper line. Matches IconCheck conventions. */
export function IconBell({ size = 16, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true" focusable="false">
      <path d="M 6 16 V 11 a 6 6 0 0 1 12 0 V 16 L 19.5 17.5 H 4.5 Z" />
      <path d="M 10 20 a 2 2 0 0 0 4 0" />
    </svg>
  );
}
