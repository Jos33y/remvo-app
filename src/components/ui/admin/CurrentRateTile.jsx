import { useMemo } from 'react';
import { IconRate } from '@components/ui/icons/IconRate';
import { IconAlert } from '@components/ui/icons/IconAlert';
import styles from '@styles/ui/admin/current-rate-tile.module.css';

/* ──────────────────────────────────────────────────────────────────
 * CurrentRateTile
 *
 * Dashboard cockpit hero tile showing the effective buy rate from the
 * rate-engine priority chain, with source attribution so the operator
 * sees which source priced the last session init without drilling
 * into the Rate engine screen.
 *
 * Obsidian register. Tile geometry matches WalletBalance and
 * SettlementTrigger so the three cockpit cards line up.
 *
 * Manual source  | white numeral, "Manual, 4h ago by Joseey"
 * CoinGecko      | white numeral, "CoinGecko + 50 buffer, updated 30s ago"
 * Last known     | amber numeral, "Last known (stale, 12m ago)"
 * Unavailable    | red strip, "Rate unavailable. Enter a manual rate."
 *
 * @param {{
 *   rate: {
 *     rate: number,
 *     source: 'manual' | 'coingecko' | 'last_known',
 *     stale?: boolean,
 *     enteredAt?: string,
 *     enteredBy?: number,
 *     expiresAt?: string,
 *     midRate?: number,
 *     bufferNaira?: number,
 *     fetchedAt?: string,
 *   } | null,
 *   operators: Array<{ id: number, displayName: string }>,
 *   onOpenRateEngine?: () => void,
 *   className?: string,
 * }} props
 * ────────────────────────────────────────────────────────────────── */

function formatNairaInt(value) {
  if (value == null) return '';
  return '\u20A6' + Math.round(value).toLocaleString('en-US');
}

function formatTimeAgo(iso) {
  if (!iso) return '';
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatExpiresIn(iso) {
  if (!iso) return '';
  const seconds = Math.floor((new Date(iso).getTime() - Date.now()) / 1000);
  if (seconds <= 0) return 'expired';
  const hours = Math.floor(seconds / 3600);
  if (hours >= 1) return `expires in ${hours}h`;
  const minutes = Math.floor(seconds / 60);
  return `expires in ${minutes}m`;
}

export function CurrentRateTile({ rate, operators = [], onOpenRateEngine, className = '' }) {
  const attribution = useMemo(() => {
    if (!rate) return null;
    if (rate.source === 'manual') {
      const operator = operators.find(o => o.id === rate.enteredBy);
      const name = operator ? operator.displayName : 'operator';
      return {
        primary: `Manual, ${formatTimeAgo(rate.enteredAt)} by ${name}`,
        secondary: rate.expiresAt ? formatExpiresIn(rate.expiresAt) : null,
        tone: 'manual',
      };
    }
    if (rate.source === 'coingecko') {
      const buf = rate.bufferNaira || 0;
      return {
        primary: `CoinGecko + ${buf} buffer`,
        secondary: rate.fetchedAt ? `updated ${formatTimeAgo(rate.fetchedAt)}` : null,
        tone: 'coingecko',
      };
    }
    if (rate.source === 'last_known') {
      return {
        primary: 'Last known',
        secondary: rate.enteredAt ? `stale, ${formatTimeAgo(rate.enteredAt)}` : 'stale',
        tone: 'stale',
      };
    }
    return null;
  }, [rate, operators]);

  // ── Unavailable state ──

  if (!rate || !attribution) {
    return (
      <section
        className={[styles.card, styles.cardUnavailable, className].filter(Boolean).join(' ')}
        data-canvas="obsidian"
        role="region"
        aria-label="Current rate: unavailable"
      >
        <header className={styles.header}>
          <span className={styles.label}>Current rate</span>
          <span className={styles.iconSlot} aria-hidden="true">
            <IconRate size={16} />
          </span>
        </header>
        <div className={styles.unavailableInner} role="status" aria-live="assertive">
          <span className={styles.unavailableIcon} aria-hidden="true">
            <IconAlert size={18} />
          </span>
          <div className={styles.unavailableText}>
            <div className={styles.unavailableHeadline}>Rate unavailable</div>
            <div className={styles.unavailableBody}>Enter a manual rate to resume sessions.</div>
          </div>
        </div>
        {onOpenRateEngine && (
          <button
            type="button"
            className={styles.openButton}
            onClick={onOpenRateEngine}
          >
            Open rate engine
          </button>
        )}
      </section>
    );
  }

  // ── Resolved state ──

  return (
    <section
      className={[styles.card, styles[`tone-${attribution.tone}`], className].filter(Boolean).join(' ')}
      data-canvas="obsidian"
      role="region"
      aria-label={`Current rate: ${formatNairaInt(rate.rate)} naira per USDT, source ${attribution.primary}`}
    >
      <header className={styles.header}>
        <span className={styles.label}>Current rate</span>
        <span className={styles.iconSlot} aria-hidden="true">
          <IconRate size={16} />
        </span>
      </header>

      <div className={styles.valueRow}>
        <span className={styles.value}>
          <span className={styles.valueNumber}>{formatNairaInt(rate.rate)}</span>
          <span className={styles.valueUnit}>per USDT</span>
        </span>
      </div>

      <div className={styles.attribution}>
        <span className={styles.attributionPrimary}>{attribution.primary}</span>
        {attribution.secondary && (
          <span className={styles.attributionSecondary}>{attribution.secondary}</span>
        )}
      </div>
    </section>
  );
}
