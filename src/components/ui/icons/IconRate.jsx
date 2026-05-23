/* IconRate | two opposing arrows (exchange glyph) per PRIMITIVES section 07.
 * Matches IconCheck conventions. */
export function IconRate({ size = 16, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true" focusable="false">
      <path d="M 4 8 H 18" />
      <path d="M 15 5 L 18 8 L 15 11" />
      <path d="M 20 16 H 6" />
      <path d="M 9 13 L 6 16 L 9 19" />
    </svg>
  );
}
