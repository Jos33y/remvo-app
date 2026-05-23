/* IconCog | gear with eight teeth + central pivot. Used for Settings nav.
 * Matches IconCheck conventions. */
export function IconCog({ size = 16, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="3" />
      <path d="M 12 2 V 5 M 12 19 V 22 M 22 12 H 19 M 5 12 H 2
               M 19.07 4.93 L 16.95 7.05 M 7.05 16.95 L 4.93 19.07
               M 19.07 19.07 L 16.95 16.95 M 7.05 7.05 L 4.93 4.93" />
    </svg>
  );
}
