import { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '@hooks/useReducedMotion';
import styles from '@styles/ui/admin/bottom-sheet.module.css';

/* ──────────────────────────────────────────────────────────────────
 * BottomSheet
 *
 * Mobile-native modal pattern. Slides up from the bottom, full
 * viewport width, content-sized height capped at 80vh with internal
 * scroll. Closes via handle tap, backdrop tap, swipe-down, or the
 * provided controls.
 *
 * Not to be used directly at desktop widths — ConfirmDialog composes
 * BottomSheet on mobile and a centred modal on desktop. Use
 * BottomSheet directly only when the desktop counterpart would be a
 * popover (filter menus, multi-option selectors).
 *
 * Props
 *   isOpen             | boolean
 *   onClose            | () => void
 *   title              | optional string; rendered above content
 *   children           | sheet content
 *   maxHeight          | override maxHeight (default 80vh)
 *   labelledBy         | optional id for aria-labelledby override
 *   className          | class merge on the sheet element
 *
 * Behaviour
 *   - Focus trap while open
 *   - Escape closes
 *   - Backdrop tap closes
 *   - Swipe-down on the handle (threshold 80px) closes
 *   - prefers-reduced-motion replaces slide with instant appear
 *   - Body scroll locked while open
 *
 * Accessibility
 *   - role="dialog" + aria-modal="true"
 *   - aria-labelledby set to title id if title provided, else
 *     `ariaLabelledBy` prop override
 *   - Focus moves to the sheet on open; returns to the trigger on close
 *   - The handle is a button; announces "Close" to screen readers
 * ────────────────────────────────────────────────────────────────── */

const SWIPE_THRESHOLD_PX = 80;

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  maxHeight = '80vh',
  labelledBy,
  className,
}) {
  const reduced = useReducedMotion();
  const sheetRef = useRef(null);
  const triggerRef = useRef(null);
  const titleId = useRef(`sheet-title-${Math.random().toString(36).slice(2, 9)}`);
  const [dragOffset, setDragOffset] = useState(0);
  const touchStartY = useRef(null);

  // Remember the focus trigger when opening so we can return focus on close
  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement;
    }
  }, [isOpen]);

  // Focus the sheet on open (puts screen reader focus on the dialog)
  useEffect(() => {
    if (isOpen && sheetRef.current) {
      // Small delay so the slide-in animation doesn't cause focus jitter
      const timer = setTimeout(() => {
        sheetRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Return focus on close
  useEffect(() => {
    if (!isOpen && triggerRef.current instanceof HTMLElement) {
      triggerRef.current.focus();
    }
  }, [isOpen]);

  // Body scroll lock
  useEffect(() => {
    if (!isOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [isOpen]);

  // Escape + focus trap
  useEffect(() => {
    if (!isOpen) return undefined;

    function handleKeydown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusables = sheetRef.current?.querySelectorAll(
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
  }, [isOpen, onClose]);

  // Swipe-down on handle
  const handleTouchStart = useCallback((event) => {
    touchStartY.current = event.touches[0]?.clientY ?? null;
  }, []);

  const handleTouchMove = useCallback((event) => {
    if (touchStartY.current === null) return;
    const current = event.touches[0]?.clientY ?? touchStartY.current;
    const delta = Math.max(0, current - touchStartY.current);
    setDragOffset(delta);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (dragOffset > SWIPE_THRESHOLD_PX) {
      onClose();
    }
    setDragOffset(0);
    touchStartY.current = null;
  }, [dragOffset, onClose]);

  const dynamicStyle = dragOffset > 0 ? { transform: `translateY(${dragOffset}px)` } : undefined;

  if (!isOpen) return null;

  return (
    <div
      className={styles.root}
      aria-hidden={false}
    >
      <div
        className={styles.backdrop}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={sheetRef}
        className={`${styles.sheet} ${reduced ? styles.reducedMotion : ''} ${className || ''}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy || (title ? titleId.current : undefined)}
        tabIndex={-1}
        style={{ maxHeight, ...dynamicStyle }}
      >
        <button
          type="button"
          className={styles.handleButton}
          onClick={onClose}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          aria-label="Close sheet"
        >
          <span className={styles.handle} aria-hidden="true" />
        </button>

        {title && (
          <header className={styles.header}>
            <h2 id={titleId.current} className={styles.title}>{title}</h2>
          </header>
        )}

        <div className={styles.content}>
          {children}
        </div>
      </div>
    </div>
  );
}
