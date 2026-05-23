import styles from '@styles/ui/admin/empty-state.module.css';

/* ──────────────────────────────────────────────────────────────────
 * EmptyState
 *
 * Empty-state pattern for tables and sections. Composes a centred
 * icon slot, a heading, helper body copy, and an optional CTA.
 *
 * Props
 *   icon           | optional React node (icon component or element)
 *   heading        | required | short sentence
 *   body           | optional | helper copy
 *   action         | optional React node (typically a button)
 *   density        | 'section' (32px vertical padding) | 'table' (48px)
 *   className      | class merge
 *
 * Register
 *   Both. Text and icon colour adapt via [data-canvas].
 *
 * Accessibility
 *   The outer container has role="status" so screen readers announce
 *   the emptiness. Heading is a semantic h3 so document outline is
 *   preserved when this sits inside a labelled section.
 * ────────────────────────────────────────────────────────────────── */

export function EmptyState({
  icon,
  heading,
  body,
  action,
  density = 'section',
  className,
}) {
  const classes = [
    styles.wrap,
    styles[`density-${density}`],
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} role="status">
      {icon && (
        <div className={styles.icon} aria-hidden="true">
          {icon}
        </div>
      )}
      <h3 className={styles.heading}>{heading}</h3>
      {body && <p className={styles.body}>{body}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
