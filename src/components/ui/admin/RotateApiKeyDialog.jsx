import { useEffect, useRef, useState } from 'react';
import { ConfirmDialog } from './ConfirmDialog';
import { IconCheck } from '@components/ui/icons/IconCheck';
import { IconAlert } from '@components/ui/icons/IconAlert';
import { IconCopy } from '@components/ui/icons/IconCopy';
import styles from '@styles/ui/admin/rotate-api-key-dialog.module.css';

/* ──────────────────────────────────────────────────────────────────
 * RotateApiKeyDialog
 *
 * Three-stage dialog:
 *
 *   1. CONFIRM | warn the operator that rotation invalidates the
 *      OLD key immediately. No grace period. The platform partner
 *      must be notified out-of-band before this is clicked.
 *
 *   2. LOADING | API call in flight. Buttons disabled.
 *
 *   3. REVEAL  | new raw key shown ONCE. Single-tap copy. Cannot
 *      close without explicit acknowledgement that the operator has
 *      transferred the key to the platform partner.
 *
 * The reveal stage is deliberately friction-heavy. If the operator
 * misses the key in transit, they have to rotate again | this is
 * the correct behaviour, not a bug. Better that than the key sitting
 * in a screen-share recording.
 *
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   platformName: string,
 *   onRotate: () => Promise<{ raw_key: string }>,
 * }} props
 * ────────────────────────────────────────────────────────────────── */

export function RotateApiKeyDialog({ isOpen, onClose, platformName, onRotate }) {
  const [stage, setStage] = useState('confirm'); // confirm | loading | reveal
  const [rawKey, setRawKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState(null);
  const copyTimer = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setStage('confirm');
      setRawKey('');
      setCopied(false);
      setAcknowledged(false);
      setError(null);
    }
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, [isOpen]);

  async function handleConfirmRotate() {
    setStage('loading');
    setError(null);
    try {
      const result = await onRotate();
      setRawKey(result.raw_key);
      setStage('reveal');
    } catch (e) {
      setError(e?.details?.message || e?.message || 'Rotation failed.');
      setStage('confirm');
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(rawKey);
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may be blocked in rare environments | fall back to silent.
    }
  }

  function handleClose() {
    if (stage === 'reveal' && !acknowledged) return;
    onClose();
  }

  // ── Confirm stage ───────────────────────────────────────────────

  if (stage === 'confirm' || stage === 'loading') {
    return (
      <ConfirmDialog
        isOpen={isOpen}
        onCancel={onClose}
        onConfirm={handleConfirmRotate}
        title="Rotate API key"
        body=""
        confirmLabel={stage === 'loading' ? 'Rotating' : 'Rotate now'}
        cancelLabel="Cancel"
        confirmVariant="destructive"
        isLoading={stage === 'loading'}
        obsidianHeader
      >
        <div className={styles.body}>
          <p className={styles.lede}>
            Rotation generates a new key and invalidates the current one immediately. There is no grace period.
          </p>
          <ul className={styles.checklist}>
            <li>The platform partner ({platformName}) must be notified out-of-band before you continue.</li>
            <li>The new key is shown <strong>once</strong>. We do not store it.</li>
            <li>If the partner cannot capture the key, you'll need to rotate again.</li>
          </ul>
          {error && (
            <p className={styles.error} role="alert">
              <IconAlert size={12} /> {error}
            </p>
          )}
        </div>
      </ConfirmDialog>
    );
  }

  // ── Reveal stage ────────────────────────────────────────────────

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onCancel={() => {}}              // backdrop / esc disabled
      onConfirm={handleClose}
      title="New API key"
      body=""
      confirmLabel="Done"
      cancelLabel=""
      confirmVariant="primary"
      isLoading={false}
      obsidianHeader
    >
      <div className={styles.body}>
        <div className={styles.revealHeader}>
          <IconCheck size={14} className={styles.revealCheck} />
          <span className={styles.revealText}>
            Key rotated. Copy it now — it will not be shown again.
          </span>
        </div>

        <div className={styles.keyBox}>
          <code className={styles.keyValue}>{rawKey}</code>
          <button
            type="button"
            className={styles.copyButton}
            onClick={handleCopy}
            aria-label="Copy API key"
          >
            {copied ? (
              <>
                <IconCheck size={14} /> Copied
              </>
            ) : (
              <>
                <IconCopy size={14} /> Copy
              </>
            )}
          </button>
        </div>

        <label className={styles.ackRow}>
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
          />
          <span>
            I have transferred this key to the platform partner ({platformName}). I understand it cannot be retrieved later.
          </span>
        </label>

        {!acknowledged && (
          <p className={styles.lockHint}>
            Tick the acknowledgement above to close this dialog.
          </p>
        )}
      </div>
    </ConfirmDialog>
  );
}
