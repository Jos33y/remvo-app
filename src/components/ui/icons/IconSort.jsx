/* IconSort | two-way chevron pair. Used in DataTable column headers. */
export function IconSort({ size = 16, className, direction = null }) {
  const upDimmed = direction === 'desc';
  const downDimmed = direction === 'asc';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true" focusable="false">
      <path d="M8 8l4-4 4 4" opacity={upDimmed ? 0.3 : 1} />
      <path d="M8 16l4 4 4-4" opacity={downDimmed ? 0.3 : 1} />
    </svg>
  );
}
