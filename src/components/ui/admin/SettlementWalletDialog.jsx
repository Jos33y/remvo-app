import { useEffect, useRef, useState } from 'react';
import { ConfirmDialog } from './ConfirmDialog';
import { IconCheck } from '@components/ui/icons/IconCheck';
import { IconAlert } from '@components/ui/icons/IconAlert';
import styles from '@styles/ui/admin/settlement-wallet-dialog.module.css';

/* ──────────────────────────────────────────────────────────────────
 * SettlementWalletDialog
 *
 * Edit settlement_wallet for a platform. Owner-only. The flow:
 *
 *   1. Operator types / pastes the new address.
 *   2. Click "Validate" | calls validate endpoint, surfaces shape +
 *      ATA result inline.
 *   3. Click "Save" | re-validates + saves in one round-trip.
 *      ConfirmDialog footer wraps both buttons; we drive the
 *      confirm action ourselves with submitting state.
 *
 * If ATA does not exist, the dialog surfaces a clear warning and
 * lets the operator either:
 *   - Cancel and fund the ATA first (recommended)
 *   - Tick "I'm setting this ahead of ATA funding" which sets
 *     verify_ata=false on the save request.
 *
 * Address shown side-by-side: current (before) vs new (after) in
 * IBM Plex Mono so the diff is unambiguous.
 *
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   currentAddress: string | null,
 *   onValidate: (input: { address: string, verify_ata: boolean }) => Promise<{
 *     valid: boolean, ata: string|null, ata_exists: boolean
 *   }>,
 *   onSave: (input: { address: string, verify_ata: boolean }) => Promise<void>,
 * }} props
 * ────────────────────────────────────────────────────────────────── */

export function SettlementWalletDialog({
  isOpen,
  onClose,
  currentAddress,
  onValidate,
  onSave,
}) {
  const inputRef = useRef(null);
  const [draft, setDraft] = useState('');
  const [validation, setValidation] = useState(null); // null | { valid, ata, ata_exists }
  const [validating, setValidating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [skipAtaCheck, setSkipAtaCheck] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDraft('');
      setValidation(null);
      setError(null);
      setSubmitting(false);
      setValidating(false);
      setSkipAtaCheck(false);
      const t = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Reset validation when input changes
  useEffect(() => {
    setValidation(null);
    setError(null);
  }, [draft]);

  const isShapeValid = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(draft);
  const isUnchanged = draft === currentAddress;

  async function handleValidate() {
    if (!isShapeValid || isUnchanged) return;
    setValidating(true);
    setError(null);
    try {
      const result = await onValidate({
        address: draft,
        verify_ata: !skipAtaCheck,
      });
      setValidation(result);
    } catch (e) {
      setError(e?.details?.message || e?.message || 'Validation failed.');
      setValidation(null);
    } finally {
      setValidating(false);
    }
  }

  async function handleConfirm() {
    if (!isShapeValid || isUnchanged) return;
    // Require an explicit validation pass before save unless the
    // operator has knowingly opted out of the ATA check.
    if (!validation && !skipAtaCheck) {
      await handleValidate();
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSave({ address: draft, verify_ata: !skipAtaCheck });
      onClose();
    } catch (e) {
      setError(e?.details?.message || e?.message || 'Could not save.');
      setSubmitting(false);
    }
  }

  const canConfirm =
    isShapeValid &&
    !isUnchanged &&
    !submitting &&
    !validating &&
    (validation?.valid === true || skipAtaCheck);

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onCancel={onClose}
      onConfirm={handleConfirm}
      title="Change settlement wallet"
      body=""
      confirmLabel={
        submitting ? 'Saving' :
        validating ? 'Validating' :
        !validation && !skipAtaCheck ? 'Validate' :
        'Save wallet'
      }
      cancelLabel="Cancel"
      confirmVariant="destructive"
      isLoading={submitting || validating}
      obsidianHeader
    >
      <div className={styles.body}>
        <p className={styles.lede}>
          Settlement payouts route to this address. A wrong wallet means USDT goes to the wrong place and is unrecoverable.
        </p>

        {/* Current */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Current</h3>
          <div className={styles.addressRow}>
            <span className={styles.address}>
              {currentAddress || <span className={styles.empty}>not set</span>}
            </span>
          </div>
        </section>

        {/* New */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>New</h3>
          <input
            ref={inputRef}
            type="text"
            spellCheck="false"
            autoCorrect="off"
            autoComplete="off"
            value={draft}
            onChange={(e) => setDraft(e.target.value.trim())}
            placeholder="Solana base58 address"
            className={styles.input}
            aria-invalid={draft !== '' && !isShapeValid || undefined}
          />
          {draft !== '' && !isShapeValid && (
            <p className={styles.hintError}>
              Address must be 32-44 base58 characters.
            </p>
          )}
          {isUnchanged && draft !== '' && (
            <p className={styles.hintMuted}>
              This is the current wallet. No change.
            </p>
          )}
        </section>

        {/* Validation result */}
        {validation && (
          <div
            className={
              validation.ata_exists
                ? styles.validationOk
                : styles.validationWarn
            }
            role="status"
          >
            {validation.ata_exists ? (
              <>
                <IconCheck size={14} />
                <div>
                  <strong className={styles.validationTitle}>Wallet validated</strong>
                  <p className={styles.validationBody}>
                    USDT-SPL associated token account exists on chain.
                  </p>
                  {validation.ata && (
                    <code className={styles.validationAta}>{validation.ata}</code>
                  )}
                </div>
              </>
            ) : (
              <>
                <IconAlert size={14} />
                <div>
                  <strong className={styles.validationTitle}>USDT account not found</strong>
                  <p className={styles.validationBody}>
                    The wallet exists but has no USDT-SPL associated token account. The first settlement will fail until the platform funds the ATA.
                  </p>
                  <label className={styles.skipCheck}>
                    <input
                      type="checkbox"
                      checked={skipAtaCheck}
                      onChange={(e) => setSkipAtaCheck(e.target.checked)}
                    />
                    <span>I'm setting this ahead of ATA funding (acknowledge risk)</span>
                  </label>
                </div>
              </>
            )}
          </div>
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
