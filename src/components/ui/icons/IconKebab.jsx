/* IconKebab | vertical ellipsis for row overflow menus. */
export function IconKebab({ size = 16, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"
      className={className} aria-hidden="true" focusable="false">
      <circle cx="12" cy="6"  r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="12" cy="18" r="1.5" />
    </svg>
  );
}
