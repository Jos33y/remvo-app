import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useClipboard } from '@hooks/useClipboard';
import { useReducedMotion } from '@hooks/useReducedMotion';
import { CopyableRow } from '@components/ui/shared/CopyableRow';
import { IconCopy } from '@components/ui/icons/IconCopy';
import { IconCheck } from '@components/ui/icons/IconCheck';
import { formatNaira } from '@utils/formatNaira';
import { formatAccountNumber, rawAccountNumber } from '@utils/formatAccountNumber';
import { easeOut } from '@utils/motion';
import styles from '@styles/ui/checkout/bank-transfer-card.module.css';

/* Phase 5 — obsidian action surface. The digit-settle signature
 * moment fires once on mount: each digit of the account number
 * drops 8px and lands at 60ms intervals. Reduced motion mounts
 * complete. */
/* Merchant id from sessions.merchant_id -> the name the user knows.
 * An unmapped id renders no footer at all rather than printing a raw
 * database identifier at someone about to transfer money. */
const PROCESSOR_NAMES = {
  paystack: 'Paystack',
  kora: 'Kora',
};

export function BankTransferCard({
  bankName,
  accountNumber,
  accountName,
  amountNaira,
  reference,
  /* Which PSP holds this account. Optional | absent means no footer.
   * Never hardcode a brand here: merchant dispatch is per-corridor
   * and a flip to Kora must change what the user reads. */
  processor,
  disabled = false,
  accent = false,
  /* PHASE_7F_S4_CHECKOUT_EVENTS
   * Optional. Called once per successful "copy all details" action.
   * PaymentPage wires this to emit the payment.copy funnel event.
   * Absent in any other caller | the card stays standalone. */
  onCopy,
}) {
  const reduced = useReducedMotion();
  const formattedAccount = formatAccountNumber(accountNumber);
  const rawAccount = rawAccountNumber(accountNumber);
  const formattedAmount = formatNaira(amountNaira);
  const rawAmount = String(Math.trunc(amountNaira));

  const { copy: copyAll, copied: copiedAll } = useClipboard({ resetMs: 2000 });
  const [allAnnouncement, setAllAnnouncement] = useState('');

  const allDetailsPayload = [
    `Bank: ${bankName}`,
    `Account: ${rawAccount}`,
    `Account name: ${accountName}`,
    `Amount: ${formattedAmount}`,
    `Reference: ${reference}`,
  ].join('\n');

  const handleCopyAll = async () => {
    if (disabled) return;
    const ok = await copyAll(allDetailsPayload);
    if (ok) {
      setAllAnnouncement('');
      requestAnimationFrame(() => setAllAnnouncement('All bank details copied'));
      /* payment.copy | fire-and-forget telemetry. Guarded so a card
       * used without the prop stays inert. */
      if (typeof onCopy === 'function') onCopy();
    }
  };

  useEffect(() => {
    if (!allAnnouncement) return undefined;
    const t = setTimeout(() => setAllAnnouncement(''), 1500);
    return () => clearTimeout(t);
  }, [allAnnouncement]);

  const processorName = processor ? PROCESSOR_NAMES[processor] : null;

  const cardClassName = [
    styles.card,
    disabled && styles.cardDisabled,
    accent && styles.cardAccent,
  ].filter(Boolean).join(' ');

  // Custom-rendered account number with digit-settle motion.
  // We pass it via the value prop of CopyableRow which accepts a node.
  const accountValueNode = (
    <span className={styles.accountDigits} aria-label={rawAccount}>
      {formattedAccount.split('').map((ch, i) => (
        <motion.span
          key={`${ch}-${i}`}
          className={styles.accountDigit}
          initial={reduced ? { y: 0, opacity: 1 } : { y: -8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.28, delay: reduced ? 0 : 0.2 + i * 0.06, ease: easeOut }}
        >
          {ch}
        </motion.span>
      ))}
    </span>
  );

  return (
    <div className={cardClassName} aria-disabled={disabled || undefined}>
      <div className={styles.header}>
        <span className={styles.headerLabel}>Transfer to this account</span>
      </div>

      <div className={styles.divider} aria-hidden="true" />
      <CopyableRow label="Bank" value={bankName} valueVariant="sans" ariaName="Bank name" disabled={disabled} tone="dark" />

      <div className={styles.divider} aria-hidden="true" />
      <CopyableRow
        label="Account number"
        value={accountValueNode}
        copyValue={rawAccount}
        valueVariant="mono"
        ariaName="Account number"
        disabled={disabled}
        tone="dark"
      />

      {/* Own row, not a caption under the account number. This is the
        * beneficiary name the user cross-checks against their bank app
        * before sending, so it needs the same weight as Bank and
        * Amount rather than being the faintest text in the panel. Not
        * copyable | nobody types a beneficiary name in, and a copy
        * button there implies they should. The value is whatever the
        * PSP resolves (currently "PAYSTACK CHECKOUT"); we do not
        * control it and must show it verbatim or the page and the
        * bank app disagree. */}
      <div className={styles.divider} aria-hidden="true" />
      <CopyableRow
        label="Account name"
        value={accountName}
        valueVariant="sans"
        ariaName="Account name"
        disabled={disabled}
        tone="dark"
        copyable={false}
      />

      <div className={styles.divider} aria-hidden="true" />
      <CopyableRow label="Amount" value={formattedAmount} copyValue={rawAmount} valueVariant="mono" ariaName="Amount" disabled={disabled} tone="dark" />

      {/* The PwT virtual account is bound to the exact charge amount.
        * Paystack reverses anything higher or lower at the account,
        * before it reaches us | verified live across two banks in both
        * directions. The reversal is automatic and the user gets their
        * money back, but their bank says "reversed" with no reason
        * while this page still reads "waiting for your transfer", so
        * they assume we took it. One line here prevents the mistake
        * instead of explaining it afterwards. Hidden when the window
        * is closed, where it no longer applies. */}
      {!disabled && (
        <>
          <div className={styles.divider} aria-hidden="true" />
          <p className={styles.exactNote}>
            Transfer this exact amount. Anything higher or lower is
            reversed automatically.
          </p>
        </>
      )}

      <div className={styles.divider} aria-hidden="true" />

      <button
        type="button"
        className={[styles.copyAll, copiedAll && styles.copyAllCopied, disabled && styles.copyAllDisabledState].filter(Boolean).join(' ')}
        onClick={handleCopyAll}
        disabled={disabled}
        aria-label="Copy all bank transfer details"
      >
        <span className={styles.copyAllLabel}>{copiedAll ? 'All details copied' : 'Copy all details'}</span>
        <span className={styles.copyAllIconWrap} aria-hidden="true">
          <span className={styles.copyAllIconLayer} style={{ opacity: copiedAll ? 0 : 1 }}><IconCopy size={16} /></span>
          <span className={`${styles.copyAllIconLayer} ${styles.copyAllIconCheck}`} style={{ opacity: copiedAll ? 1 : 0 }}><IconCheck size={16} /></span>
        </span>
        <span className={styles.srOnly} aria-live="polite" aria-atomic="true">{allAnnouncement}</span>
      </button>

      {/* The account name row above reads "PAYSTACK CHECKOUT", which is
        * whatever the PSP resolves and outside our control. In Nigeria
        * that name is an asset: Paystack is in every bank app and reads
        * as a licensed, compliance-verified rail. Rendered as a bare
        * value it is just a string. Named here, it is the reassurance
        * the user needs at the moment they are about to send money to a
        * domain they have never seen.
        *
        * Stays visible when the window has closed. It is a statement
        * about who operates the account, not an invitation to act, so
        * unlike the exact-amount note it does not stop being true. */}
      {processorName && (
        <>
          <div className={styles.divider} aria-hidden="true" />
          <p className={styles.processorNote}>
            Secured by {processorName}, Remvo&apos;s payment processor.
          </p>
        </>
      )}
    </div>
  );
}
