import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { IconCheck } from '@components/ui/icons/IconCheck';
import { IconAlert } from '@components/ui/icons/IconAlert';
import { IconX } from '@components/ui/icons/IconX';
import styles from '@styles/ui/admin/toast.module.css';

/* ──────────────────────────────────────────────────────────────────
 * ToastProvider
 *
 * Drop-in toast/notification system. Mount once near the top of the
 * tree (App.jsx). Anywhere inside, call useToast() to fire.
 *
 *   const toast = useToast();
 *   toast.success('Settings saved');
 *   toast.error('Save failed', 'Network unreachable');
 *   toast.info('Background sync running');
 *
 * Stacking contract:
 *   The viewport renders via createPortal() into document.body so
 *   the toasts always sit ABOVE any drawer/dialog at any z-index.
 *   This deliberately escapes any parent stacking context (e.g.
 *   AdminShell .main { z-index: 1 }) that would otherwise trap them.
 *
 * Position:
 *   Desktop  | bottom-right, 24px gutter, stacks upward
 *   Mobile   | bottom-centre, full width minus 16px gutters,
 *              respects env(safe-area-inset-bottom) so it sits
 *              above iOS home indicator + Android nav
 *
 * Lifetime:
 *   success / info | auto-dismiss after 4s
 *   error          | stays until the user dismisses it (errors are
 *                    stateful information; auto-clearing them silently
 *                    is hostile)
 *   custom         | pass `duration: 0` to pin
 *
 * Accessibility:
 *   role="status"  for success / info (aria-live polite)
 *   role="alert"   for error           (aria-live assertive)
 *   Each toast has a labelled close button.
 *   Reduced-motion respected; transitions become instant.
 *
 * Why one provider, not a global mutable store:
 *   React 19 strict-mode dev double-mounting + future server
 *   components mean a singleton has tricky semantics. The provider
 *   keeps state component-local and testable.
 * ────────────────────────────────────────────────────────────────── */

const ToastContext = createContext(null);

const DEFAULT_DURATIONS = {
  success: 4000,
  info: 4000,
  error: 0,    // sticky | user must dismiss
};

let _id = 0;
function nextId() {
  _id += 1;
  return `t${_id}_${Date.now()}`;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const show = useCallback((toast) => {
    const id = toast.id || nextId();
    const variant = toast.variant || 'info';
    const duration = toast.duration ?? DEFAULT_DURATIONS[variant] ?? 4000;
    const entry = {
      id,
      variant,
      title: toast.title,
      description: toast.description,
      action: toast.action,
    };
    setToasts((prev) => {
      // Cap at 5 stacked toasts | older ones drop off the top
      const next = [...prev, entry];
      return next.length > 5 ? next.slice(next.length - 5) : next;
    });
    if (duration > 0) {
      const timer = setTimeout(() => dismiss(id), duration);
      timers.current.set(id, timer);
    }
    return id;
  }, [dismiss]);

  // Convenience helpers
  const success = useCallback(
    (title, description) => show({ variant: 'success', title, description }),
    [show]
  );
  const error = useCallback(
    (title, description) => show({ variant: 'error', title, description }),
    [show]
  );
  const info = useCallback(
    (title, description) => show({ variant: 'info', title, description }),
    [show]
  );

  // Cleanup on unmount
  useEffect(() => () => {
    for (const timer of timers.current.values()) clearTimeout(timer);
    timers.current.clear();
  }, []);

  const value = useMemo(
    () => ({ show, dismiss, success, error, info }),
    [show, dismiss, success, error, info]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {typeof document !== 'undefined'
        ? createPortal(
            <ToastViewport toasts={toasts} onDismiss={dismiss} />,
            document.body
          )
        : null}
    </ToastContext.Provider>
  );
}

/**
 * Read toast helpers. Throws when called outside <ToastProvider>;
 * silent no-op fallbacks would mask wiring bugs in dev.
 */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast() must be used inside <ToastProvider>');
  }
  return ctx;
}

// ── Viewport (private) ───────────────────────────────────────────

function ToastViewport({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;
  return (
    <div className={styles.viewport} aria-live="polite" aria-atomic="false">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }) {
  const { id, variant, title, description, action } = toast;

  const role = variant === 'error' ? 'alert' : 'status';
  const ariaLive = variant === 'error' ? 'assertive' : 'polite';

  const Icon =
    variant === 'success' ? IconCheck :
    variant === 'error' ? IconAlert :
    IconAlert;  // info uses the same glyph; differentiated by color

  const variantClass =
    variant === 'success' ? styles.success :
    variant === 'error' ? styles.error :
    styles.info;

  return (
    <div
      className={`${styles.toast} ${variantClass}`}
      role={role}
      aria-live={ariaLive}
    >
      <span className={styles.iconWrap} aria-hidden="true">
        <Icon size={14} />
      </span>
      <div className={styles.body}>
        {title && <div className={styles.title}>{title}</div>}
        {description && <div className={styles.description}>{description}</div>}
        {action && (
          <button
            type="button"
            className={styles.actionButton}
            onClick={() => {
              action.onClick();
              onDismiss(id);
            }}
          >
            {action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        className={styles.closeButton}
        onClick={() => onDismiss(id)}
        aria-label="Dismiss notification"
      >
        <IconX size={12} />
      </button>
    </div>
  );
}
