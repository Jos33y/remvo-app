import { IconDot } from '@components/ui/icons/IconDot';
import { IconCheck } from '@components/ui/icons/IconCheck';
import { IconAlert } from '@components/ui/icons/IconAlert';
import { IconClock } from '@components/ui/icons/IconClock';
import { IconX } from '@components/ui/icons/IconX';
import styles from '@styles/ui/admin/status-badge.module.css';

/* ──────────────────────────────────────────────────────────────────
 * StatusBadge
 *
 * Pill with dot or icon + label, used in tables, drawers, detail
 * headers. Status tokens map to VOCABULARY section 03 status palette.
 * Register-aware via [data-canvas] selectors.
 *
 * Statuses
 *   active        | green   | dot
 *   paused        | warning | clock
 *   maintenance   | warning | alert
 *   coming_soon   | info    | dot
 *   confirmed     | success | check
 *   pending       | warning | clock
 *   failed        | error   | x
 *   settled       | success | check
 *
 * Size
 *   sm | 20px tall, 11px text, 12px icon
 *   md | 24px tall, 12px text, 14px icon  (default)
 * ────────────────────────────────────────────────────────────────── */

const STATUS_META = {
  active:      { label: 'Active',      tone: 'success', icon: 'dot'   },
  paused:      { label: 'Paused',      tone: 'warning', icon: 'clock' },
  maintenance: { label: 'Maintenance', tone: 'warning', icon: 'alert' },
  coming_soon: { label: 'Coming soon', tone: 'info',    icon: 'dot'   },
  confirmed:   { label: 'Confirmed',   tone: 'success', icon: 'check' },
  pending:     { label: 'Pending',     tone: 'warning', icon: 'clock' },
  failed:      { label: 'Failed',      tone: 'error',   icon: 'x'     },
  settled:     { label: 'Settled',     tone: 'success', icon: 'check' },
};

function renderGlyph(iconKey, size) {
  switch (iconKey) {
    case 'check': return <IconCheck size={size} />;
    case 'alert': return <IconAlert size={size} />;
    case 'clock': return <IconClock size={size} />;
    case 'x':     return <IconX size={size} />;
    case 'dot':
    default:      return <IconDot size={size} />;
  }
}

export function StatusBadge({ status, size = 'md', label, className }) {
  const meta = STATUS_META[status] || STATUS_META.active;
  const iconSize = size === 'sm' ? 12 : 14;
  const resolvedLabel = label || meta.label;

  const classes = [
    styles.badge,
    styles[`size-${size}`],
    styles[`tone-${meta.tone}`],
    className,
  ].filter(Boolean).join(' ');

  return (
    <span className={classes} role="status">
      <span className={styles.glyph} aria-hidden="true">
        {renderGlyph(meta.icon, iconSize)}
      </span>
      <span className={styles.label}>{resolvedLabel}</span>
    </span>
  );
}
