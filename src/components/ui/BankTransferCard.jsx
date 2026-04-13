import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useClipboard } from '@hooks/useClipboard';
import { useReducedMotion } from '@hooks/useReducedMotion';
import { CopyableRow } from './CopyableRow';
import { IconCopy } from './icons/IconCopy';
import { IconCheck } from './icons/IconCheck';
import { formatNaira } from '@utils/formatNaira';
import { formatAccountNumber, rawAccountNumber } from '@utils/formatAccountNumber';
import { easeOut } from '@utils/motion';
import styles from '@styles/ui/bank-transfer-card.module.css';

/* Phase 5 — obsidian action surface. The digit-settle signature
 * moment fires once on mount: each digit of the account number
 * drops 8px and lands at 60ms intervals. Reduced motion mounts
 * complete. */
export function BankTransferCard({
  bankName,
  accountNumber,
  accountName,
  amountNaira,
  reference,
  disabled = false,
  accent = false,
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
    }
  };

  useEffect(() => {
    if (!allAnnouncement) return undefined;
    const t = setTimeout(() => setAllAnnouncement(''), 1500);
    return () => clearTimeout(t);
  }, [allAnnouncement]);

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
        caption={accountName}
        valueVariant="mono"
        ariaName="Account number"
        disabled={disabled}
        tone="dark"
      />

      <div className={styles.divider} aria-hidden="true" />
      <CopyableRow label="Amount" value={formattedAmount} copyValue={rawAmount} valueVariant="mono" ariaName="Amount" disabled={disabled} tone="dark" />

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
    </div>
  );
}
