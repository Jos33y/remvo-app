import { useAdminData } from '@context/AdminContext';
import styles from '@styles/ui/admin/merchant-badge.module.css';

/* ──────────────────────────────────────────────────────────────────
 * MerchantBadge
 *
 * Pill showing a merchant's display name with its current operational
 * status dot. Optionally suffixes "(preferred)" when rendered in a
 * corridor context.
 *
 * Props
 *   merchantId      | merchant id lookup into merchants table
 *   showStatus      | default true | shows status dot prefix
 *   preferred       | optional boolean | shows "(preferred)" muted suffix
 *   size            | 'sm' | 'md' (default)
 *
 * Reads the merchants table via useAdminData to resolve the display
 * name and status. If the id is not found, renders a muted "Unknown"
 * pill with an error dot.
 * ────────────────────────────────────────────────────────────────── */

const STATUS_DOT = {
  active:      'success',
  maintenance: 'warning',
  inactive:    'error',
  paused:      'warning',
};

// Brand accent per merchant — drives the dot colour when active.
// Stored as a CSS custom property so the stylesheet can reference it.
const MERCHANT_ACCENT = {
  kora:     '#7C3AED', // Kora purple
  paystack: '#0BA4DB', // Paystack blue
  monnify:  '#0055D4', // Monnify blue (paused; kept for history rows)
};

export function MerchantBadge({
  merchantId,
  showStatus = true,
  preferred = false,
  size = 'md',
  className,
}) {
  const { merchants } = useAdminData();
  const merchant = merchants.find(m => m.id === merchantId);

  const displayName = merchant?.displayName || 'Unknown';
  const status = merchant?.status || 'inactive';
  const dotTone = STATUS_DOT[status] || 'error';
  const accent = MERCHANT_ACCENT[merchantId] || null;

  const classes = [
    styles.badge,
    styles[`size-${size}`],
    !merchant && styles.unknown,
    className,
  ].filter(Boolean).join(' ');

  return (
    <span
      className={classes}
      data-merchant={merchant ? merchantId : undefined}
      style={accent ? { '--merchant-accent': accent } : undefined}
    >
      {showStatus && (
        <span
          className={`${styles.dot} ${styles[`dot-${dotTone}`]}`}
          style={status === 'active' && accent ? { background: accent } : undefined}
          aria-label={`Merchant status: ${status}`}
        />
      )}
      <span className={styles.name}>{displayName}</span>
      {preferred && (
        <span className={styles.preferred}>(preferred)</span>
      )}
    </span>
  );
}
