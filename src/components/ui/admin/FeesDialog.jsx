import { useEffect, useMemo, useRef, useState } from 'react';
import { ConfirmDialog } from './ConfirmDialog';
import styles from '@styles/ui/admin/fees-dialog.module.css';

/* ──────────────────────────────────────────────────────────────────
 * FeesDialog
 *
 * Edit platform_fee_pct. Owner-only at the route layer. The dialog
 * is presented after the operator clicks the "Edit" affordance on
 * the Fees section of PlatformDetail.
 *
 * Live impact preview:
 *   We show what the new fee means in concrete numbers at three
 *   reference card values ($25, $100, $500). The operator's mental
 *   model is "what does my partner actually receive?", not the
 *   percent. Showing both is cheap and prevents a wrong-decimal
 *   typo (1.0 vs 0.1 vs 10) from shipping.
 *
 * Safety:
 *   In-flight sessions are unaffected (sessions stamp platform_fee_usd
 *   at lock per remvo_rate_engine_spec). Copy makes this clear so
 *   the operator doesn't worry about timing.
 *
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   currentPct: number,
 *   onSave: (pct: number) => Promise<void>,
 * }} props
 * ────────────────────────────────────────────────────────────────── */

const REFERENCE_AMOUNTS = [25, 100, 500];

export function FeesDialog({ isOpen, onClose, currentPct, onSave }) {
  const inputRef = useRef(null);
  const [draft, setDraft] = useState(String(currentPct ?? '1.00'));
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDraft(String(currentPct ?? '1.00'));
      setError(null);
      setSubmitting(false);
      const t = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [isOpen, currentPct]);

  const parsedPct = useMemo(() => {
    if (draft === '' || draft == null) return null;
    const n = Number(draft);
    if (Number.isNaN(n)) return null;
    return n;
  }, [draft]);

  const isValid =
    parsedPct != null &&
    parsedPct >= 0 &&
    parsedPct <= 10 &&
    Number(parsedPct.toFixed(2)) === parsedPct;

  const isChanged = parsedPct != null && parsedPct !== Number(currentPct);

  async function handleConfirm() {
    if (!isValid || !isChanged) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSave(Number(parsedPct.toFixed(2)));
      onClose();
    } catch (e) {
      setError(e?.message || 'Could not save.');
      setSubmitting(false);
    }
  }

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onCancel={onClose}
      onConfirm={handleConfirm}
      title="Edit platform fee"
      body=""
      confirmLabel={submitting ? 'Saving' : 'Save fee'}
      cancelLabel="Cancel"
      confirmVariant="primary"
      isLoading={submitting}
    >
      <div className={styles.body}>
        <p className={styles.lede}>
          Affects new sessions only. In-flight sessions keep the fee they were locked at.
        </p>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>Platform fee (%)</span>
          <div className={styles.inputRow}>
            <input
              ref={inputRef}
              type="number"
              min="0"
              max="10"
              step="0.01"
              inputMode="decimal"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className={styles.input}
              aria-invalid={!isValid && draft !== '' || undefined}
            />
            <span className={styles.percentSign}>%</span>
          </div>
          <span className={styles.hint}>0.00 to 10.00, two decimals</span>
        </label>

        {!isValid && draft !== '' && (
          <p className={styles.error} role="alert">
            Enter a number between 0 and 10 with at most two decimal places.
          </p>
        )}

        {/* Impact preview */}
        {isValid && (
          <div className={styles.preview}>
            <h3 className={styles.previewTitle}>Settlement impact</h3>
            <table className={styles.previewTable}>
              <thead>
                <tr>
                  <th scope="col" className={styles.previewTh}>Card value</th>
                  <th scope="col" className={styles.previewTh}>You keep</th>
                  <th scope="col" className={styles.previewTh}>Platform settles</th>
                </tr>
              </thead>
              <tbody>
                {REFERENCE_AMOUNTS.map((amt) => {
                  const fee = (amt * parsedPct) / 100;
                  const settled = amt - fee;
                  return (
                    <tr key={amt}>
                      <td className={styles.previewTd}>${amt}</td>
                      <td className={`${styles.previewTd} ${styles.previewMono}`}>
                        ${fee.toFixed(2)}
                      </td>
                      <td className={`${styles.previewTd} ${styles.previewMono}`}>
                        ${settled.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {error && (
          <p className={styles.error} role="alert">{error}</p>
        )}
      </div>
    </ConfirmDialog>
  );
}
