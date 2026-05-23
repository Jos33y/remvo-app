import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useReducedMotion } from '@hooks/useReducedMotion';
import { BottomSheet } from './BottomSheet';
import styles from '@styles/ui/admin/confirm-dialog.module.css';

/* ──────────────────────────────────────────────────────────────────
 * ConfirmDialog
 *
 * Modal for destructive or high-stakes operator actions. Desktop
 * shows a centred modal (max-width 480px, auto height). Mobile
 * swaps to a BottomSheet composition to match platform native
 * expectations.
 *
 * Behaviour
 *   - Focus moves to cancel button on open (safer default than
 *     confirm for destructive variants; primary variants can be
 *     Enter-submitted from anywhere inside)
 *   - Escape cancels
 *   - Enter submits ONLY when confirmVariant === 'primary'
 *     (destructive variants require explicit click to prevent
 *     accidental Enter presses)
 *   - Backdrop click cancels
 *   - isLoading disables both buttons and shows skeleton on confirm
 *
 * Props
 *   isOpen
 *   onCancel           | () => void
 *   onConfirm          | () => void
 *   title              | string
 *   body               | ReactNode | prose specific to the action
 *   confirmLabel       | default 'Confirm'
 *   cancelLabel        | default 'Cancel'
 *   confirmVariant     | 'primary' (default) | 'destructive'
 *   isLoading          | boolean | disables both buttons during async
 *   obsidianHeader     | boolean | renders an obsidian header strip for
 *                      |           brand-forward confirmations (settlement
 *                      |           trigger, merchant flip on production)
 *   children           | optional | additional content above the buttons
 * ────────────────────────────────────────────────────────────────── */

const MOBILE_BREAKPOINT_PX = 768;

export function ConfirmDialog({
  isOpen,
  onCancel,
  onConfirm,
  title,
  body,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'primary',
  isLoading = false,
  confirmDisabled = false,
  obsidianHeader = false,
  children,
}) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX}px)`).matches;
  });
  const reduced = useReducedMotion();
  const dialogRef = useRef(null);
  const cancelRef = useRef(null);
  const triggerRef = useRef(null);
  const titleId = useRef(`confirm-title-${Math.random().toString(36).slice(2, 9)}`);
  const bodyId = useRef(`confirm-body-${Math.random().toString(36).slice(2, 9)}`);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX}px)`);
    const handler = (event) => setIsMobile(event.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Remember trigger on open
  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement;
    }
  }, [isOpen]);

  // Focus cancel on open (desktop only; BottomSheet handles its own focus)
  useEffect(() => {
    if (!isOpen || isMobile) return;
    const timer = setTimeout(() => {
      cancelRef.current?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, [isOpen, isMobile]);

  // Return focus on close
  useEffect(() => {
    if (!isOpen && triggerRef.current instanceof HTMLElement) {
      triggerRef.current.focus();
    }
  }, [isOpen]);

  // Body scroll lock (desktop path; mobile is BottomSheet which locks itself)
  useEffect(() => {
    if (!isOpen || isMobile) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [isOpen, isMobile]);

  // Escape + Enter + focus trap (desktop only)
  useEffect(() => {
    if (!isOpen || isMobile) return undefined;

    function handleKeydown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (!isLoading) onCancel();
        return;
      }

      if (event.key === 'Enter' && confirmVariant === 'primary' && !isLoading) {
        // Only commit primary confirmations on Enter; destructive requires click.
        event.preventDefault();
        onConfirm();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusables = dialogRef.current?.querySelectorAll(
        'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables || focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [isOpen, isMobile, isLoading, confirmVariant, onCancel, onConfirm]);

  if (!isOpen) return null;

  // ─── Shared content ──────────────────────────────────────────

  const buttons = (
    <div className={styles.actions}>
      <button
        type="button"
        ref={cancelRef}
        className={styles.cancelButton}
        onClick={onCancel}
        disabled={isLoading}
      >
        {cancelLabel}
      </button>
      <button
        type="button"
        className={`${styles.confirmButton} ${styles[`confirm-${confirmVariant}`]}`}
        onClick={onConfirm}
        disabled={isLoading || confirmDisabled}
        aria-busy={isLoading || undefined}
      >
        {isLoading ? (
          <span className={styles.spinner} aria-hidden="true" />
        ) : null}
        <span>{confirmLabel}</span>
      </button>
    </div>
  );

  const contentBody = (
    <>
      {typeof body === 'string' ? (
        <p id={bodyId.current} className={styles.body}>{body}</p>
      ) : (
        <div id={bodyId.current} className={styles.body}>{body}</div>
      )}
      {children && <div className={styles.extra}>{children}</div>}
      {buttons}
    </>
  );

  // ─── Mobile path ─────────────────────────────────────────────

  if (isMobile) {
    return createPortal(
      <BottomSheet
        isOpen={isOpen}
        onClose={isLoading ? () => {} : onCancel}
        title={title}
        labelledBy={titleId.current}
      >
        {contentBody}
      </BottomSheet>,
      document.body
    );
  }

  // ─── Desktop path ────────────────────────────────────────────

  return createPortal(
    <div className={styles.root}>
      <div
        className={styles.backdrop}
        onClick={isLoading ? undefined : onCancel}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        className={`${styles.dialog} ${reduced ? styles.reducedMotion : ''}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId.current}
        aria-describedby={bodyId.current}
      >
        {obsidianHeader ? (
          <header className={styles.obsidianHeader} data-canvas="obsidian">
            <h2 id={titleId.current} className={styles.title}>{title}</h2>
          </header>
        ) : (
          <header className={styles.header}>
            <h2 id={titleId.current} className={styles.title}>{title}</h2>
          </header>
        )}
        <div className={styles.content}>
          {contentBody}
        </div>
      </div>
    </div>,
    document.body
  );
}
