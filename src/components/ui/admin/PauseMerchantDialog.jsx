import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { ConfirmDialog } from './ConfirmDialog';
import { adminPath } from '@app/adminRouter';
import styles from '@styles/ui/admin/pause-merchant-dialog.module.css';

/* PauseMerchantDialog
 *
 * Wraps ConfirmDialog to add:
 *   - reason textarea (280 char cap, recorded in audit_log.metadata)
 *   - 409 MERCHANT_IN_USE_BY_CORRIDOR error path: surfaces blocking
 *     corridor IDs as clickable links so the operator can navigate
 *     to flip preferred without leaving context.
 *
 * Used for both 'pause' and 'disable' actions; copy varies by action. */

const COPY = {
  pause: {
    title: (n) => `Pause ${n}?`,
    body: (n) =>
      `${n} will stop accepting new sessions. Sessions already initiated will continue to their outcome. Resume at any time without rotating credentials.`,
    confirmLabel: 'Pause merchant',
    confirmVariant: 'destructive',
  },
  disable: {
    title: (n) => `Disable ${n}?`,
    body: (n) =>
      `${n} will be removed from the merchant rotation. Stronger than Pause, but reversible: a disabled merchant can be re-enabled later.`,
    confirmLabel: 'Disable merchant',
    confirmVariant: 'destructive',
  },
};

export function PauseMerchantDialog({
  isOpen,
  action,
  merchantName,
  onCancel,
  onConfirm,
}) {
  const navigate = useNavigate();
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [blockingCorridors, setBlockingCorridors] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setError(null);
      setBlockingCorridors([]);
      setSubmitting(false);
    }
  }, [isOpen, action]);

  if (!isOpen || !action) return null;

  const copy = COPY[action];

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);
    setBlockingCorridors([]);
    try {
      await onConfirm(reason.trim() || undefined);
    } catch (err) {
      const code = err?.details?.code || err?.code;
      if (code === 'MERCHANT_IN_USE_BY_CORRIDOR') {
        setBlockingCorridors(err?.details?.blocking_corridor_ids || []);
        setError(null);
      } else {
        setError(err?.details?.message || err?.message || 'Could not update merchant.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onCancel={onCancel}
      onConfirm={handleConfirm}
      isLoading={submitting}
      title={copy.title(merchantName)}
      body={copy.body(merchantName)}
      confirmLabel={copy.confirmLabel}
      confirmVariant={copy.confirmVariant}
    >
      <label className={styles.reasonField}>
        <span className={styles.reasonLabel}>
          Reason <span className={styles.reasonHint}>optional, recorded in audit log</span>
        </span>
        <textarea
          className={styles.reasonInput}
          value={reason}
          onChange={(e) => setReason(e.target.value.slice(0, 280))}
          rows={3}
          placeholder="e.g. Migrating to production credentials"
          maxLength={280}
        />
        <span className={styles.reasonCount}>{reason.length} / 280</span>
      </label>

      {error && (
        <div className={styles.errorBox} role="alert">{error}</div>
      )}

      {blockingCorridors.length > 0 && (
        <div className={styles.blockedBox} role="alert">
          <p className={styles.blockedTitle}>
            Cannot {action}: {merchantName} is the preferred merchant on {blockingCorridors.length} active corridor{blockingCorridors.length === 1 ? '' : 's'}.
          </p>
          <p className={styles.blockedSubtitle}>
            Flip preferred to a different merchant first:
          </p>
          <ul className={styles.blockedList}>
            {blockingCorridors.map((cid) => (
              <li key={cid}>
                <button
                  type="button"
                  className={styles.blockedLink}
                  onClick={() => navigate(adminPath(`/corridors/${cid}`))}
                >
                  {cid}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </ConfirmDialog>
  );
}
