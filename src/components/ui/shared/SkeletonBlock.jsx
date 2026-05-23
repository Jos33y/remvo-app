import styles from '@styles/ui/shared/skeleton-block.module.css';

/* ──────────────────────────────────────────────────────────────────
 * SkeletonBlock
 *
 * Loading placeholder with 5 variants. Pulse animation respects
 * prefers-reduced-motion (drops to a static muted surface).
 *
 * Variants
 *   text    | single line | default width 80%
 *   lines   | paragraph   | 3 lines at 100% / 92% / 66%
 *   card    | StatCard shape (128px tall, full width)
 *   row     | table row (56px tall, full width)
 *   circle  | avatar (defaults to 32px)
 *
 * Props
 *   variant    | one of the above
 *   width      | override width for `text` and `card` variants
 *   size       | override circle diameter (default 32px)
 *   className  | optional outer class merge
 *   ariaLabel  | screen-reader label, default 'Loading'
 *
 * Register
 *   Both. Uses --neutral-surface-sunk by default; on obsidian
 *   parents the [data-canvas] selector flips to an rgba white
 *   wash matching the register shift in AdminScreenStub.
 * ────────────────────────────────────────────────────────────────── */

export function SkeletonBlock({
  variant = 'text',
  width,
  size = 32,
  className,
  ariaLabel = 'Loading',
}) {
  const cls = [styles.skeleton, styles[variant], className].filter(Boolean).join(' ');

  if (variant === 'lines') {
    return (
      <div className={`${styles.linesGroup} ${className || ''}`.trim()} role="status" aria-label={ariaLabel}>
        <span className={`${styles.skeleton} ${styles.text}`} style={{ width: '100%' }} />
        <span className={`${styles.skeleton} ${styles.text}`} style={{ width: '92%' }} />
        <span className={`${styles.skeleton} ${styles.text}`} style={{ width: '66%' }} />
      </div>
    );
  }

  if (variant === 'circle') {
    return (
      <span
        className={cls}
        role="status"
        aria-label={ariaLabel}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      className={cls}
      role="status"
      aria-label={ariaLabel}
      style={width ? { width } : undefined}
    />
  );
}
