/* IconFilter | funnel shape. Used in FilterBar and table toolbars. */
export function IconFilter({ size = 16, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true" focusable="false">
      <path d="M4 4h16l-6 9v6l-4-2v-4L4 4z" />
    </svg>
  );
}
