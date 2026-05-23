import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { IconCheck } from '@components/ui/icons/IconCheck';
import { IconAlert } from '@components/ui/icons/IconAlert';
import styles from '@styles/ui/admin/wallet-topup-drawer.module.css';

/* ──────────────────────────────────────────────────────────────────
 * WalletTopUpDrawer
 *
 * Modal sheet that surfaces the deposit hot wallet's address + mint
 * so the operator can top up the pool without leaving the dashboard.
 * Obsidian register, dialog semantics.
 *
 * Why a drawer (not a destination page):
 *
 *   The "Top up guidance" tap is a quick-reference flow | the
 *   operator is mid-context (looking at a low balance, deciding
 *   to fund) and needs the address + mint in front of them long
 *   enough to paste into the exchange they're sending from. A full
 *   page transition breaks that context. A drawer keeps the
 *   dashboard one tap away.
 *
 * Critical UX:
 *
 *   1. Address copy is the primary action. Single-tap copy with
 *      visible "Copied" state confirmation. The copy region has
 *      a generous 56px tap target.
 *
 *   2. "Send only USDT-SPL on Solana" warning is in error tone
 *      and above the fold. Wrong-network sends are unrecoverable;
 *      this one piece of copy is the most important on the screen.
 *
 *   3. Mint address is included because some exchanges require
 *      explicit mint confirmation when sending SPL tokens. Also
 *      copyable.
 *
 *   4. Closing | ESC, backdrop click, and the close button all
 *      work. Focus is trapped to the dialog while open. On close,
 *      focus returns to the trigger element.
 *
 * Accessibility:
 *
 *   role="dialog", aria-modal="true", aria-labelledby on the heading.
 *   Initial focus moves to the close button so a keyboard user can
 *   dismiss without tabbing through the address. Escape closes.
 *
 * What's NOT here (deliberately):
 *
 *   - QR code | needs an additional dep (qrcode.react). The full
 *     base58 address is the single-source-of-truth value an operator
 *     pastes into Bitget / Gate.io / their wallet app; a QR is
 *     redundant when copy works. Add later if mobile-only operators
 *     ever scan from another phone.
 *   - Fund-history | belongs on a future Wallet detail page.
 *   - In-app fund initiation | Phase 8+, not at launch.
 *
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   address: string | null,
 *   network: string,
 *   mint: string | null,
 *   balanceUsdt: number,
 *   owedUsdt: number,
 *   thresholdUsdt: number,
 * }} props
 * ────────────────────────────────────────────────────────────────── */

function formatUsdt(value) {
  if (value == null || Number.isNaN(value)) return '0.00';
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function WalletTopUpDrawer({
  isOpen,
  onClose,
  address,
  network = 'solana',
  mint,
  balanceUsdt = 0,
  owedUsdt = 0,
  thresholdUsdt = 0,
}) {
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const previouslyFocusedRef = useRef(null);

  // Two independent copy states so address + mint can be confirmed
  // separately. Each clears 2s after the click.
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedMint, setCopiedMint] = useState(false);

  // Suggested top-up = (owed + threshold) - balance, never below 0.
  // Just guidance | the operator decides the actual amount.
  const suggestedUsdt = Math.max(0, owedUsdt + thresholdUsdt - balanceUsdt);

  // Focus management + ESC dismiss
  useEffect(() => {
    if (!isOpen) return undefined;

    previouslyFocusedRef.current = document.activeElement;

    // Defer focus by one frame so the dialog has mounted and its
    // children are interactive. setTimeout(0) is the cross-browser
    // equivalent of requestAnimationFrame for this purpose.
    const id = setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 0);

    function onKeyDown(e) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      // Focus trap: if Tab/Shift+Tab would leave the dialog, wrap.
      if (e.key === 'Tab') {
        const focusable = dialogRef.current?.querySelectorAll(
          'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener('keydown', onKeyDown);
    // Lock body scroll while open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      clearTimeout(id);
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
      // Return focus to the trigger element
      const prev = previouslyFocusedRef.current;
      if (prev && typeof prev.focus === 'function') {
        prev.focus();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  async function copyToClipboard(text, setter) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setter(true);
      setTimeout(() => setter(false), 2000);
    } catch {
      // Fallback for older browsers / non-secure contexts. Select
      // the text via a hidden textarea + execCommand. Modern browsers
      // on https never hit this path.
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        setter(true);
        setTimeout(() => setter(false), 2000);
      } catch {
        // Give up silently | the operator can still select-copy by hand.
      } finally {
        document.body.removeChild(ta);
      }
    }
  }

  const networkLabel = network === 'solana' ? 'Solana' : network;

  return createPortal(
    <div
      className={styles.backdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="topup-heading"
      >
        <header className={styles.header}>
          <h2 id="topup-heading" className={styles.heading}>
            Top up the hot wallet
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        {/* Critical safety warning | first thing operator sees */}
        <div className={styles.warningStrip} role="alert">
          <span className={styles.warningIcon} aria-hidden="true">
            <IconAlert size={16} />
          </span>
          <span className={styles.warningText}>
            Send <strong>USDT-SPL on {networkLabel}</strong> only. Funds sent on
            other networks or as different tokens are unrecoverable.
          </span>
        </div>

        {/* Suggested amount + balance context */}
        <section className={styles.summary} aria-label="Balance context">
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Current balance</span>
            <span className={styles.summaryValue}>
              {formatUsdt(balanceUsdt)} USDT
            </span>
          </div>
          {owedUsdt > 0 && (
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Owed today</span>
              <span className={styles.summaryValue}>
                {formatUsdt(owedUsdt)} USDT
              </span>
            </div>
          )}
          {suggestedUsdt > 0 && (
            <div
              className={[styles.summaryRow, styles.summaryRowAccent].join(' ')}
            >
              <span className={styles.summaryLabel}>Suggested top-up</span>
              <span className={styles.summaryValue}>
                {formatUsdt(suggestedUsdt)} USDT
              </span>
            </div>
          )}
        </section>

        {/* Address | the primary copy action */}
        <section className={styles.field} aria-labelledby="topup-address-label">
          <div className={styles.fieldHeader}>
            <span id="topup-address-label" className={styles.fieldLabel}>
              Deposit address
            </span>
            <span className={styles.fieldNetwork}>{networkLabel}</span>
          </div>
          <button
            type="button"
            className={styles.copyRow}
            onClick={() => copyToClipboard(address, setCopiedAddress)}
            disabled={!address}
            aria-label={
              copiedAddress
                ? 'Address copied'
                : `Copy deposit address ${address || ''}`
            }
          >
            <span className={styles.copyValue}>
              {address || 'Not configured'}
            </span>
            <span
              className={[
                styles.copyAffordance,
                copiedAddress && styles.copyAffordanceCopied,
              ]
                .filter(Boolean)
                .join(' ')}
              aria-hidden="true"
            >
              {copiedAddress ? (
                <>
                  <IconCheck size={14} /> Copied
                </>
              ) : (
                'Copy'
              )}
            </span>
          </button>
        </section>

        {/* USDT-SPL mint */}
        <section className={styles.field} aria-labelledby="topup-mint-label">
          <div className={styles.fieldHeader}>
            <span id="topup-mint-label" className={styles.fieldLabel}>
              USDT-SPL mint address
            </span>
            <span className={styles.fieldHint}>
              Some exchanges require this
            </span>
          </div>
          <button
            type="button"
            className={styles.copyRow}
            onClick={() => copyToClipboard(mint, setCopiedMint)}
            disabled={!mint}
            aria-label={
              copiedMint
                ? 'Mint address copied'
                : `Copy USDT mint address ${mint || ''}`
            }
          >
            <span className={styles.copyValue}>{mint || 'Not configured'}</span>
            <span
              className={[
                styles.copyAffordance,
                copiedMint && styles.copyAffordanceCopied,
              ]
                .filter(Boolean)
                .join(' ')}
              aria-hidden="true"
            >
              {copiedMint ? (
                <>
                  <IconCheck size={14} /> Copied
                </>
              ) : (
                'Copy'
              )}
            </span>
          </button>
        </section>

        {/* Plain operator instructions | three numbered steps */}
        <section className={styles.steps} aria-label="How to top up">
          <ol className={styles.stepsList}>
            <li>
              On Bitget, Gate.io, or your wallet app, choose <em>Withdraw</em>{' '}
              and select <strong>USDT</strong> with network{' '}
              <strong>{networkLabel}</strong>.
            </li>
            <li>
              Paste the deposit address above. Double-check it matches before
              confirming.
            </li>
            <li>
              The dashboard refreshes the balance every 30 seconds. The new
              total appears once {networkLabel} confirms the transfer.
            </li>
          </ol>
        </section>

        <footer className={styles.footer}>
          <button
            type="button"
            className={styles.doneButton}
            onClick={onClose}
          >
            Done
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}
