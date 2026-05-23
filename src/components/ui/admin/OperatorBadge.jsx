import styles from '@styles/ui/admin/operator-badge.module.css';

/* ──────────────────────────────────────────────────────────────────
 * OperatorBadge
 *
 * Avatar + name used in audit log rows, operator lists, and any
 * attribution surface. Clickable by default (triggers filter or
 * navigation); pass `as="span"` or `onClick={undefined}` to render
 * non-interactively.
 *
 * Props
 *   operator       | { id, displayName, avatarInitials, email? }
 *   size           | 'sm' (24px) | 'md' (32px) default | 'lg' (40px)
 *   showEmail      | default false | shows email under name
 *   onClick        | optional | enables button behaviour when set
 *   ariaLabel      | optional aria-label override
 *   className      | optional class merge
 *
 * Register
 *   Both. Avatar background uses a gold tint on obsidian to preserve
 *   the iridescent accent without shouting.
 * ────────────────────────────────────────────────────────────────── */

export function OperatorBadge({
  operator,
  size = 'md',
  showEmail = false,
  onClick,
  ariaLabel,
  className,
}) {
  const initials = operator?.avatarInitials || operator?.displayName?.slice(0, 2).toUpperCase() || '?';
  const displayName = operator?.displayName || 'Unknown operator';

  const classes = [
    styles.badge,
    styles[`size-${size}`],
    onClick && styles.interactive,
    className,
  ].filter(Boolean).join(' ');

  const content = (
    <>
      <span className={styles.avatar} aria-hidden="true">
        {initials}
      </span>
      <span className={styles.meta}>
        <span className={styles.name}>{displayName}</span>
        {showEmail && operator?.email && (
          <span className={styles.email}>{operator.email}</span>
        )}
      </span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={classes}
        onClick={onClick}
        aria-label={ariaLabel || `${displayName}`}
      >
        {content}
      </button>
    );
  }

  return (
    <span className={classes}>
      {content}
    </span>
  );
}
