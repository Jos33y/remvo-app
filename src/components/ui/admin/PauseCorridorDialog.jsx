import { useEffect, useRef, useState } from 'react';
import { ConfirmDialog } from './ConfirmDialog';
import styles from '@styles/ui/admin/pause-corridor-dialog.module.css';

/* PauseCorridorDialog
 *
 * Confirms pausing or unpausing a corridor. Reason is optional but
 * encouraged for audit trail. Escapes/closes return focus to trigger.
 *
 * Props:
 *   isOpen
 *   action            | 'pause' | 'unpause'
 *   corridor          | { id, sourceCurrency, sourceMethod, destinationAsset, destinationNetwork }
 *   onCancel
 *   onConfirm         | (reason: string | undefined) => void | async
 *   isLoading         | bool
 *   error             | string | null
 */

export function PauseCorridorDialog({
  isOpen,
  action,
  corridor,
  onCancel,
  onConfirm,
  isLoading = false,
  error = null,
}) {
  const [reason, setReason] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isOpen) setReason('');
  }, [isOpen, action]);

  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => textareaRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [isOpen]);

  const isPause = action === 'pause';
  const title = isPause ? 'Pause this corridor?' : 'Unpause this corridor?';
  const confirmLabel = isLoading
    ? (isPause ? 'Pausing...' : 'Unpausing...')
    : (isPause ? 'Pause corridor' : 'Unpause corridor');

  const route = corridor
    ? `${corridor.sourceCurrency} ${corridor.sourceMethod} to ${corridor.destinationAsset} ${corridor.destinationNetwork}`
    : '';

  const body = isPause ? (
    <>
      <p className={styles.lead}>
        New checkout sessions on the <span className={styles.routeMono}>{route}</span> route will be rejected
        until you unpause. In-flight sessions are not affected.
      </p>
    </>
  ) : (
    <p className={styles.lead}>
      Sessions will resume on the <span className={styles.routeMono}>{route}</span> route immediately.
    </p>
  );

  return (
    <ConfirmDialog
      isOpen={isOpen}
      title={title}
      body={body}
      confirmLabel={confirmLabel}
      cancelLabel="Cancel"
      confirmVariant={isPause ? 'destructive' : 'primary'}
      isLoading={isLoading}
      onCancel={onCancel}
      onConfirm={() => onConfirm(reason.trim() || undefined)}
    >
      <label className={styles.fieldLabel}>
        <span className={styles.fieldLabelText}>Reason (optional)</span>
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          placeholder="Logged to audit trail"
          maxLength={280}
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={isLoading}
        />
        <span className={styles.charCount}>{reason.length} / 280</span>
      </label>
      {error && <p className={styles.error} role="alert">{error}</p>}
    </ConfirmDialog>
  );
}
