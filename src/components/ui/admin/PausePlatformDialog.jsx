import { useEffect, useRef, useState } from 'react';
import { ConfirmDialog } from './ConfirmDialog';
import { IconAlert } from '@components/ui/icons/IconAlert';
import styles from '@styles/ui/admin/pause-platform-dialog.module.css';

/* ──────────────────────────────────────────────────────────────────
 * PausePlatformDialog
 *
 * Owner-only emergency control. Three modes via `action` prop:
 *
 *   pause    | global kill switch. Stops new sessions across all
 *              countries on this platform. In-flight sessions
 *              continue.
 *   unpause  | restore traffic. No reason field.
 *   archive  | retire the platform. Status becomes 'disabled'.
 *              All future auth fails. The row is preserved (audit).
 *
 * Reason field is optional but recommended for pause/archive |
 * recorded in audit metadata.
 *
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   action: 'pause' | 'unpause' | 'archive',
 *   platformName: string,
 *   onConfirm: (reason?: string) => Promise<void>,
 * }} props
 * ────────────────────────────────────────────────────────────────── */

const COPY = {
  pause: {
    title: 'Pause platform',
    confirmLabel: 'Pause traffic',
    confirmVariant: 'destructive',
    needsReason: true,
    lede: 'Stops all new sessions for this platform across every country. In-flight sessions complete normally.',
  },
  unpause: {
    title: 'Resume platform',
    confirmLabel: 'Resume traffic',
    confirmVariant: 'primary',
    needsReason: false,
    lede: 'Re-enables session creation. Country-level state is unchanged.',
  },
  archive: {
    title: 'Archive platform',
    confirmLabel: 'Archive permanently',
    confirmVariant: 'destructive',
    needsReason: true,
    lede: 'Retires the platform. All future API requests will fail authentication. The platform row is preserved for audit. This action is reversible only by re-enabling status from the database.',
  },
};

export function PausePlatformDialog({
  isOpen,
  onClose,
  action,
  platformName,
  onConfirm,
}) {
  const reasonRef = useRef(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setError(null);
      setSubmitting(false);
      const t = setTimeout(() => reasonRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [isOpen, action]);

  const copy = COPY[action] || COPY.pause;

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(copy.needsReason && reason.trim() ? reason.trim() : undefined);
      onClose();
    } catch (e) {
      setError(e?.details?.message || e?.message || 'Action failed.');
      setSubmitting(false);
    }
  }

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onCancel={onClose}
      onConfirm={handleConfirm}
      title={copy.title}
      body=""
      confirmLabel={submitting ? 'Working' : copy.confirmLabel}
      cancelLabel="Cancel"
      confirmVariant={copy.confirmVariant}
      isLoading={submitting}
      obsidianHeader={action !== 'unpause'}
    >
      <div className={styles.body}>
        <p className={styles.lede}>{copy.lede}</p>
        <p className={styles.platformLine}>
          Platform: <strong>{platformName}</strong>
        </p>

        {copy.needsReason && (
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Reason (optional)</span>
            <textarea
              ref={reasonRef}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={280}
              rows={3}
              placeholder="Recorded in the audit log."
              className={styles.textarea}
            />
            <span className={styles.charCount}>{reason.length}/280</span>
          </label>
        )}

        {error && (
          <p className={styles.error} role="alert">
            <IconAlert size={12} /> {error}
          </p>
        )}
      </div>
    </ConfirmDialog>
  );
}
