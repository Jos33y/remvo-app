import { useEffect, useMemo, useRef, useState } from 'react';
import { ConfirmDialog } from './ConfirmDialog';
import { MerchantBadge } from './MerchantBadge';
import { StatusBadge } from './StatusBadge';
import styles from '@styles/ui/admin/flip-merchant-dialog.module.css';

/* FlipMerchantDialog
 *
 * Picks a new preferred merchant for a corridor. Lists every merchant
 * the parent passes in. Filters and disables non-eligible rows
 * locally so the operator sees WHY a merchant cannot be picked
 * (paused merchant; missing source method support).
 *
 * Props:
 *   isOpen
 *   corridor          | { id, sourceMethod, sourceCurrency, destinationAsset, destinationNetwork }
 *   currentPreferred  | merchantId currently set
 *   merchants         | array of { id, displayName, status, supportedMethods }
 *                       (the parent should pass the detail-endpoint
 *                       merchants slice; eligible ones are bubbled to top)
 *   onCancel
 *   onConfirm         | ({ new_merchant_id, reason }) => void | async
 *   isLoading
 *   error
 */

export function FlipMerchantDialog({
  isOpen,
  corridor,
  currentPreferred,
  merchants,
  onCancel,
  onConfirm,
  isLoading = false,
  error = null,
}) {
  const [selected, setSelected] = useState(null);
  const [reason, setReason] = useState('');
  const firstRadioRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setSelected(null);
      setReason('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => firstRadioRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [isOpen]);

  const candidates = useMemo(() => {
    if (!corridor || !merchants) return [];
    return merchants
      .filter((m) => m.id !== currentPreferred)
      .map((m) => {
        const supports = Array.isArray(m.supportedMethods)
          && m.supportedMethods.includes(corridor.sourceMethod);
        const active = m.status === 'active';
        let disabledReason = null;
        if (!active) disabledReason = `${m.displayName || m.id} is ${m.status}`;
        else if (!supports) disabledReason = `Does not support ${corridor.sourceMethod}`;
        return { ...m, eligible: active && supports, disabledReason };
      });
  }, [merchants, corridor, currentPreferred]);

  const eligibleCount = candidates.filter((c) => c.eligible).length;
  const route = corridor
    ? `${corridor.sourceCurrency} ${corridor.sourceMethod} to ${corridor.destinationAsset} ${corridor.destinationNetwork}`
    : '';

  const body = (
    <p className={styles.lead}>
      Pick a different merchant to handle <span className={styles.routeMono}>{route}</span>. The change takes
      effect for new sessions. In-flight sessions continue with the previous merchant.
    </p>
  );

  return (
    <ConfirmDialog
      isOpen={isOpen}
      title="Flip preferred merchant"
      body={body}
      confirmLabel={isLoading ? 'Switching...' : 'Switch merchant'}
      cancelLabel="Cancel"
      confirmVariant="primary"
      isLoading={isLoading}
      confirmDisabled={!selected}
      onCancel={onCancel}
      onConfirm={() => onConfirm({
        new_merchant_id: selected,
        reason: reason.trim() || undefined,
      })}
    >
      {candidates.length === 0 ? (
        <div className={styles.emptyNote}>
          No other merchants are configured. Section 7+ adds onboarding for new merchants.
        </div>
      ) : (
        <fieldset className={styles.fieldset} disabled={isLoading}>
          <legend className={styles.legend}>
            Available merchants
            {eligibleCount === 0 && (
              <span className={styles.legendNote}>
                None can be selected | check status and supported methods.
              </span>
            )}
          </legend>
          <ul className={styles.list}>
            {candidates.map((m, i) => {
              const inputId = `flip-m-${m.id}`;
              return (
                <li key={m.id} className={`${styles.item} ${!m.eligible ? styles.itemDisabled : ''}`}>
                  <label htmlFor={inputId} className={styles.itemLabel}>
                    <input
                      ref={i === 0 ? firstRadioRef : null}
                      id={inputId}
                      type="radio"
                      name="flip-merchant"
                      value={m.id}
                      checked={selected === m.id}
                      onChange={() => setSelected(m.id)}
                      disabled={!m.eligible}
                      className={styles.radio}
                    />
                    <span className={styles.itemMain}>
                      <MerchantBadge merchantId={m.id} size="sm" showStatus={false} />
                      <span className={styles.itemMethods}>
                        {(m.supportedMethods || []).join(', ')}
                      </span>
                    </span>
                    <span className={styles.itemAside}>
                      <StatusBadge status={m.status} size="sm" />
                    </span>
                  </label>
                  {!m.eligible && (
                    <span className={styles.disabledReason}>{m.disabledReason}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </fieldset>
      )}

      <label className={styles.fieldLabel}>
        <span className={styles.fieldLabelText}>Reason (optional)</span>
        <textarea
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
