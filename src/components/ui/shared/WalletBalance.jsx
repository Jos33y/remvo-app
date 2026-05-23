import { useEffect, useMemo, useRef } from 'react';
import { IconDot } from '@components/ui/icons/IconDot';
import { IconChevron } from '@components/ui/icons/IconChevron';
import styles from '@styles/ui/shared/wallet-balance.module.css';

/* ──────────────────────────────────────────────────────────────────
 * WalletBalance
 *
 * Always-visible hot-wallet reassurance on the Dashboard cockpit
 * and, in the compact variant, in the mobile AdminHeader (Phase B2).
 * Obsidian register.
 *
 * The tier is derived from the three input numbers, never passed in.
 * The component's job is to reveal the system state honestly from
 * the raw values so the operator can trust the signal at a glance.
 *
 * Tier rules:
 *   sufficient   | balance >= owed + threshold  | green dot, iridescent-gold numeral
 *   adequate     | balance >= owed              | gold dot, "watch for top-up"
 *   underfunded  | balance  < owed              | red dot, top-up affordance
 *
 * Variants:
 *   full     | cockpit tile. Hero numeral in --type-mono-data-display.
 *   compact  | one-line header strip. Used in AdminHeader on mobile.
 *
 * Background is rgba(255,255,255,0.02) so the underlying obsidian
 * canvas (and its vault watermark rendered at the shell level)
 * shows through. Depth comes from the 0.5px gold-tinted border only.
 *
 * @param {{
 *   balanceUsdt: number,
 *   thresholdUsdt: number,
 *   owedUsdt: number,
 *   onTopUpTap?: () => void,
 *   variant?: 'full' | 'compact',
 *   loading?: boolean,
 *   className?: string,
 * }} props
 * ────────────────────────────────────────────────────────────────── */

const TIER_META = {
  sufficient: { label: 'Sufficient' },
  adequate: { label: 'Adequate, watch for top-up' },
  underfunded: { label: 'Underfunded' },
};

function resolveTier(balance, owed, threshold) {
  if (balance >= owed + threshold) return 'sufficient';
  if (balance >= owed) return 'adequate';
  return 'underfunded';
}

function formatUsdt(value) {
  if (value == null || Number.isNaN(value)) return '0.00';
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function WalletBalance({
  balanceUsdt,
  thresholdUsdt,
  owedUsdt,
  onTopUpTap,
  variant = 'full',
  loading = false,
  className = '',
}) {
  const tier = resolveTier(balanceUsdt, owedUsdt, thresholdUsdt);
  const meta = TIER_META[tier];
  const underfundedBy = tier === 'underfunded' ? Math.max(0, owedUsdt - balanceUsdt) : 0;

  const lastTierRef = useRef(tier);
  useEffect(() => {
    lastTierRef.current = tier;
  }, [tier]);

  const liveLevel = tier === 'underfunded' ? 'assertive' : 'polite';

  const ariaLabel = useMemo(() => {
    if (loading) return 'Hot wallet balance loading';
    const suffix = tier === 'underfunded'
      ? `Underfunded by ${formatUsdt(underfundedBy)} USDT.`
      : `${meta.label}.`;
    return `Hot wallet: ${formatUsdt(balanceUsdt)} USDT. ${suffix}`;
  }, [loading, balanceUsdt, tier, meta.label, underfundedBy]);

  // ── Compact variant ──

  if (variant === 'compact') {
    return (
      <div
        className={[styles.compact, styles[`tier-${tier}`], className].filter(Boolean).join(' ')}
        role="region"
        aria-label={ariaLabel}
        data-canvas="obsidian"
      >
        <span className={styles.compactDot} aria-hidden="true">
          <IconDot size={10} />
        </span>
        <span className={styles.compactValue}>
          {loading ? (
            <span className={styles.compactValueLoading} aria-hidden="true" />
          ) : (
            `${formatUsdt(balanceUsdt)} USDT`
          )}
        </span>
        {onTopUpTap && (
          <span className={styles.compactChevron} aria-hidden="true">
            <IconChevron size={14} />
          </span>
        )}
      </div>
    );
  }

  // ── Full variant ──

  return (
    <section
      className={[styles.card, styles[`tier-${tier}`], className].filter(Boolean).join(' ')}
      role="region"
      aria-label={ariaLabel}
      data-canvas="obsidian"
    >
      <header className={styles.header}>
        <span className={styles.label}>Hot wallet</span>
      </header>

      <div className={styles.valueRow}>
        {loading ? (
          <span className={styles.valueLoading} aria-hidden="true" />
        ) : (
          <span className={styles.value}>
            <span className={styles.valueNumber}>{formatUsdt(balanceUsdt)}</span>
            <span className={styles.valueUnit}>USDT</span>
          </span>
        )}
      </div>

      {!loading && owedUsdt > 0 && (
        <div className={styles.calibration}>
          <span className={styles.calibrationLabel}>Owed today:</span>{' '}
          <span className={styles.calibrationValue}>{formatUsdt(owedUsdt)}</span>{' '}
          <span className={styles.calibrationUnit}>USDT</span>
        </div>
      )}

      <div className={styles.divider} aria-hidden="true" />

      <div className={styles.strip}>
        <div
          className={styles.stripStatus}
          role="status"
          aria-live={liveLevel}
        >
          <span className={styles.stripDot} aria-hidden="true">
            <IconDot size={10} />
          </span>
          <span className={styles.stripLabel}>
            {loading ? (
              <span className={styles.stripLabelLoading} aria-hidden="true" />
            ) : (
              meta.label
            )}
          </span>
        </div>
        {tier === 'underfunded' && onTopUpTap && !loading && (
          <button
            type="button"
            className={styles.topUpButton}
            onClick={onTopUpTap}
          >
            Top up
          </button>
        )}
      </div>
    </section>
  );
}
