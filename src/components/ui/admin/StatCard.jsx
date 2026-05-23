import styles from '@styles/ui/admin/stat-card.module.css';

/* ──────────────────────────────────────────────────────────────────
 * StatCard
 *
 * A single-metric tile. Used on Dashboard cockpit (obsidian, hero
 * treatment), embedded in detail pages (neutral, smaller), and inside
 * table footers for summary rollups.
 *
 * Value rendering is IBM Plex Mono across all sizes. The digits are
 * the hero; label + context are supporting information.
 *
 * Sizes
 *   sm | compact tile
 *   md | default
 *   lg | cockpit hero tile; value becomes iridescent gold on obsidian
 *
 * Registers
 *   Inherits from parent [data-canvas] by default. Pass
 *   `register="obsidian"` or `register="neutral"` to override (used
 *   in the harness for side-by-side comparison).
 *
 * Clickable
 *   Passing onClick wraps content in a <button>. Keyboard + hover
 *   states light up automatically.
 *
 * Loading
 *   Replaces the value with a shimmer bar. Label and context remain
 *   visible so the operator's attention stays oriented.
 * ────────────────────────────────────────────────────────────────── */

const STATUS_CLASS = {
  neutral: '',
  success: 'statusSuccess',
  warning: 'statusWarning',
  error:   'statusError',
  info:    'statusInfo',
};

export function StatCard({
  label,
  value,
  context,
  status = 'neutral',
  icon,
  size = 'md',
  onClick,
  register,
  loading = false,
  className,
  ariaLabel,
}) {
  const statusClassKey = STATUS_CLASS[status] || '';
  const classes = [
    styles.card,
    styles[`size-${size}`],
    onClick && styles.interactive,
    className,
  ].filter(Boolean).join(' ');

  const inner = (
    <>
      <div className={styles.header}>
        <span className={styles.label}>{label}</span>
        {icon && (
          <span className={styles.icon} aria-hidden="true">
            {icon}
          </span>
        )}
      </div>

      <div className={styles.valueRow}>
        {loading ? (
          <span className={styles.valueLoading} aria-label="Loading value" />
        ) : (
          <span className={styles.value}>{value}</span>
        )}
      </div>

      {context && (
        <div className={`${styles.context} ${statusClassKey ? styles[statusClassKey] : ''}`}>
          {context}
        </div>
      )}
    </>
  );

  const canvasAttr = register ? { 'data-canvas': register } : undefined;

  if (onClick) {
    return (
      <button
        type="button"
        className={classes}
        onClick={onClick}
        aria-label={ariaLabel || `${label}: ${value}`}
        {...canvasAttr}
      >
        {inner}
      </button>
    );
  }

  return (
    <div className={classes} {...canvasAttr}>
      {inner}
    </div>
  );
}
