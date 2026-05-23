import { useEffect, useRef, useState } from 'react';
import { IconCheck } from '@components/ui/icons/IconCheck';
import { ConfirmDialog } from '@components/ui/admin/ConfirmDialog';
import styles from '@styles/ui/admin/settlement-trigger.module.css';

/* ──────────────────────────────────────────────────────────────────
 * SettlementTrigger
 *
 * The moment-of-truth action on the Dashboard cockpit. Reviews the
 * pending-settlement batch and disburses via a two-step confirm.
 * Obsidian register.
 *
 * State machine (internal):
 *   idle          | card rendered, CTA enabled
 *   confirming    | ConfirmDialog open
 *   triggering    | ConfirmDialog isLoading=true while provider runs
 *   success       | card replaced with confirmation (4s auto-dismiss)
 *   error         | ConfirmDialog stays, inline error under CTA
 *
 * Empty-batch, wallet-insufficient, and external-disabled states
 * short-circuit the idle render.
 *
 * The microcopy reads "Trigger batch manually when ready" at launch
 * because Phase 6 is manual-trigger only. When cron ships in Phase
 * 7+, this becomes the real next-scheduled timestamp.
 *
 * onTrigger resolves to the created batch object (with an id) or
 * null if nothing was pending when the provider handler ran. The
 * success confirmation's "View settlement" link uses that id.
 *
 * @param {{
 *   pendingBatch: { platforms: Array<{ id: string, name: string, usdtOwed: number, transactionCount: number }>, total: number, nextScheduledAt: string | null } | null,
 *   walletSufficient: boolean,
 *   onTrigger: () => Promise<{ id: string } | null>,
 *   disabled?: boolean,
 *   onViewSettlement?: (batchId: string) => void,
 *   className?: string,
 * }} props
 * ────────────────────────────────────────────────────────────────── */

const SUCCESS_HOLD_MS = 4000;

function formatUsdt(value) {
  if (value == null || Number.isNaN(value)) return '0.00';
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function pluralise(n, singular, plural) {
  return n === 1 ? singular : plural;
}

export function SettlementTrigger({
  pendingBatch,
  walletSufficient,
  onTrigger,
  disabled = false,
  onViewSettlement,
  className = '',
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [successState, setSuccessState] = useState(null);
  const [error, setError] = useState(null);
  const successTimerRef = useRef(null);

  useEffect(() => () => {
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
  }, []);

  const hasBatch = !!pendingBatch && pendingBatch.total > 0;
  const ctaDisabled = disabled || !hasBatch || !walletSufficient;

  function openConfirm() {
    if (ctaDisabled) return;
    setError(null);
    setDialogOpen(true);
  }

  function handleCancel() {
    if (dialogLoading) return;
    setDialogOpen(false);
  }

  async function handleConfirm() {
    setDialogLoading(true);
    setError(null);
    try {
      const result = await onTrigger();
      setDialogLoading(false);
      setDialogOpen(false);
      if (result && result.id) {
        setSuccessState({
          batchId: result.id,
          total: pendingBatch.total,
          platformCount: pendingBatch.platforms.length,
        });
        if (successTimerRef.current) clearTimeout(successTimerRef.current);
        successTimerRef.current = setTimeout(() => {
          setSuccessState(null);
          successTimerRef.current = null;
        }, SUCCESS_HOLD_MS);
      }
    } catch (e) {
      setDialogLoading(false);
      setError((e && e.message) || 'Batch trigger failed. Retry, or check logs.');
    }
  }

  // ── Success state ──

  if (successState) {
    return (
      <section
        className={[styles.card, styles.cardSuccess, className].filter(Boolean).join(' ')}
        data-canvas="obsidian"
        role="region"
        aria-label="Settlement batch triggered"
      >
        <div className={styles.successInner} role="status" aria-live="assertive">
          <span className={styles.successIcon} aria-hidden="true">
            <IconCheck size={18} />
          </span>
          <div className={styles.successText}>
            <div className={styles.successHeadline}>Batch triggered</div>
            <div className={styles.successBody}>
              {formatUsdt(successState.total)} USDT disbursing to {successState.platformCount}{' '}
              {pluralise(successState.platformCount, 'platform', 'platforms')}
            </div>
          </div>
        </div>
        {onViewSettlement && (
          <button
            type="button"
            className={styles.viewLink}
            onClick={() => onViewSettlement(successState.batchId)}
          >
            View settlement
          </button>
        )}
      </section>
    );
  }

  // ── Empty state ──
  //
  // Renders with the same vertical rhythm as the populated card so
  // height, label position, and divider all line up with the siblings
  // (WalletBalance and CurrentRateTile) in the hero row.

  if (!hasBatch) {
    return (
      <section
        className={[styles.card, styles.cardEmpty, className].filter(Boolean).join(' ')}
        data-canvas="obsidian"
        role="region"
        aria-label="Pending settlement: none"
      >
        <header className={styles.header}>
          <span className={styles.label}>Pending settlement</span>
        </header>

        <div className={styles.emptyValueRow}>
          <span className={styles.emptyIcon} aria-hidden="true">
            <IconCheck size={16} />
          </span>
          <span className={styles.emptyValue}>No pending batch</span>
        </div>

        <div className={styles.emptyDivider} aria-hidden="true" />

        <div className={styles.emptyStatus}>
          New confirmed transactions will batch here automatically.
        </div>
      </section>
    );
  }

  // ── Idle / disabled ──

  const helperId = 'settlement-trigger-helper';
  const showWalletHelper = hasBatch && !walletSufficient;
  const showRunningHelper = disabled;
  const helperText = showWalletHelper
    ? 'Wallet balance below batch total. Top up before triggering.'
    : showRunningHelper
    ? 'Another settlement batch is in progress.'
    : null;

  const ctaAriaLabel = `Trigger settlement batch of ${formatUsdt(pendingBatch.total)} USDT`;

  return (
    <>
      <section
        className={[styles.card, className].filter(Boolean).join(' ')}
        data-canvas="obsidian"
        role="region"
        aria-label="Pending settlement"
      >
        <header className={styles.header}>
          <span className={styles.label}>Pending settlement</span>
          <span className={styles.microcopy}>Trigger batch manually when ready</span>
        </header>

        <div className={styles.totalRow}>
          <span className={styles.totalValue}>
            <span className={styles.totalNumber}>{formatUsdt(pendingBatch.total)}</span>
            <span className={styles.totalUnit}>USDT</span>
          </span>
        </div>

        {pendingBatch.platforms.length > 0 && (
          <div className={styles.breakdown}>
            <div className={styles.breakdownTitle}>Per platform</div>
            <ul className={styles.breakdownList}>
              {pendingBatch.platforms.map((p) => (
                <li key={p.id} className={styles.breakdownRow}>
                  <span className={styles.breakdownName}>{p.name}</span>
                  <span className={styles.breakdownCount}>
                    {p.transactionCount} {pluralise(p.transactionCount, 'txn', 'txns')}
                  </span>
                  <span className={styles.breakdownAmount}>{formatUsdt(p.usdtOwed)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className={styles.ctaWrap}>
          <button
            type="button"
            className={[
              styles.cta,
              ctaDisabled ? styles.ctaDisabled : '',
              showRunningHelper ? styles.ctaRunning : '',
            ].filter(Boolean).join(' ')}
            onClick={openConfirm}
            disabled={ctaDisabled}
            aria-disabled={ctaDisabled || undefined}
            aria-label={ctaAriaLabel}
            aria-describedby={helperText ? helperId : undefined}
          >
            {showRunningHelper ? (
              <>
                <span className={styles.ctaSkeleton} aria-hidden="true" />
                <span className={styles.ctaLabel}>Batch in progress</span>
              </>
            ) : (
              <span className={styles.ctaLabel}>Trigger batch</span>
            )}
          </button>

          {helperText && (
            <p id={helperId} className={styles.helper}>
              {helperText}
            </p>
          )}
          {error && (
            <p className={styles.errorText} role="alert">
              {error}
            </p>
          )}
        </div>
      </section>

      <ConfirmDialog
        isOpen={dialogOpen}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
        title="Trigger settlement batch"
        body={
          <>
            You are about to trigger settlement for{' '}
            <strong>{formatUsdt(pendingBatch.total)} USDT</strong> across{' '}
            {pendingBatch.platforms.length}{' '}
            {pluralise(pendingBatch.platforms.length, 'platform', 'platforms')}
            {' ('}
            {pendingBatch.platforms.map((p, idx) => (
              <span key={p.id}>
                {p.name}, {p.transactionCount} {pluralise(p.transactionCount, 'txn', 'txns')}
                {idx < pendingBatch.platforms.length - 1 ? '; ' : ''}
              </span>
            ))}
            {'). '}
            This disburses to the platform wallet and cannot be reversed. This action is logged.
          </>
        }
        confirmLabel="Trigger batch"
        cancelLabel="Cancel"
        confirmVariant="primary"
        obsidianHeader
        isLoading={dialogLoading}
      />
    </>
  );
}
