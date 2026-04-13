import { useEffect, useState } from 'react';
import { useClipboard } from '@hooks/useClipboard';
import { IconCopy } from './icons/IconCopy';
import { IconCheck } from './icons/IconCheck';
import styles from '@styles/ui/copyable-row.module.css';

/* CopyableRow — Phase 5 adds `tone` prop ('light' | 'dark').
 * 'light' (default) preserves Phase 4 behaviour. 'dark' switches
 * label/value/icon colours for usage on the obsidian canvas inside
 * BankTransferCard. No API breakage; existing call sites unchanged. */
export function CopyableRow({
  label,
  value,
  copyValue,
  caption,
  valueVariant = 'sans',
  ariaName,
  disabled = false,
  tone = 'light',
}) {
  const { copy, copied } = useClipboard({ resetMs: 2000 });
  const [announcement, setAnnouncement] = useState('');

  const payload = copyValue ?? value;
  const noun = ariaName ?? label;

  const handleClick = async () => {
    if (disabled) return;
    const ok = await copy(payload);
    if (ok) {
      setAnnouncement('');
      requestAnimationFrame(() => setAnnouncement(`${noun} copied`));
    }
  };

  useEffect(() => {
    if (!announcement) return undefined;
    const t = setTimeout(() => setAnnouncement(''), 1500);
    return () => clearTimeout(t);
  }, [announcement]);

  const className = [
    styles.row,
    styles[`tone-${tone}`],
    copied ? styles.copied : '',
    disabled ? styles.disabled : '',
  ].filter(Boolean).join(' ');

  const valueClassName = valueVariant === 'mono' ? styles.valueMono : styles.valueSans;

  return (
    <button
      type="button"
      className={className}
      onClick={handleClick}
      disabled={disabled}
      aria-label={`Copy ${noun.toLowerCase()}`}
    >
      <span className={styles.label}>{label}</span>

      <span className={styles.valueCol}>
        <span className={valueClassName}>{value}</span>
        {caption && <span className={styles.caption}>{caption}</span>}
      </span>

      <span className={styles.iconWrap} aria-hidden="true">
        <span className={styles.iconLayer} style={{ opacity: copied ? 0 : 1 }}>
          <IconCopy size={16} />
        </span>
        <span
          className={`${styles.iconLayer} ${styles.iconCheck}`}
          style={{ opacity: copied ? 1 : 0 }}
        >
          <IconCheck size={16} />
        </span>
      </span>

      <span className={styles.srOnly} aria-live="polite" aria-atomic="true">
        {announcement}
      </span>
    </button>
  );
}
