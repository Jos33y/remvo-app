import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { IconCheck } from '@components/ui/seller/icons';
import { small, fade, useReducedMotion } from '@lib/sellerMotion';
import styles from '@styles/ui/seller/toast.module.css';
import theme from '@styles/layout/seller/app-theme.module.css';

/* Short confirmations: "Copied", "Listing deleted". One at a time, two
 * seconds, read aloud once (aria-live). Feedback only where an action
 * leaves nothing else on screen to show it happened.
 *
 * toast(text, { action: { label, onClick }, onClose, ms }) adds one
 * button, such as Undo, and stays longer (eight seconds by default). It
 * waits while a pointer is over it or it has focus, so nobody loses an
 * Undo by reaching for it; Escape closes it. onClose runs when it goes
 * without its button being used (timed out, Escape, or replaced by the
 * next toast): for Undo, that is when the delete is made for good. */

const ToastContext = createContext(() => {});

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);
  const reduced = useReducedMotion();

  const current = useRef(null);
  // The toast leaves; if its action was not used, its onClose runs.
  const leave = useCallback((used = false) => {
    clearTimeout(timer.current);
    const was = current.current;
    current.current = null;
    setToast(null);
    if (was && !used) was.onClose?.();
  }, []);
  const arm = useCallback((ms) => { clearTimeout(timer.current); timer.current = setTimeout(() => leave(), ms); }, [leave]);

  const show = useCallback((text, opts = {}) => {
    if (current.current) current.current.onClose?.();
    const ms = opts.ms ?? (opts.action ? 8000 : 2000);
    const next = { text, id: Date.now(), action: opts.action ?? null, onClose: opts.onClose ?? null, ms, focus: Boolean(opts.focus) };
    current.current = next;
    setToast(next);
    arm(ms);
  }, [arm]);

  // Asked for from a keyboard (focus: true), the action takes focus, so
  // Undo is one key away instead of at the end of the page.
  const actionRef = useRef(null);
  useEffect(() => { if (toast?.focus) actionRef.current?.focus(); }, [toast]);

  const motionProps = reduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: fade }
    : { initial: { opacity: 0, y: -12, scale: 0.96 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: -8, scale: 0.98 }, transition: small };

  return (
    <ToastContext.Provider value={show}>
      {children}
      {/* The layer sits outside the app root, so it takes the theme itself
          (as the sheet layer does): without it the toast had no colours and
          no top edge to sit under, and fell below the screen. */}
      <div className={`${theme.theme} ${styles.layer}`} aria-live="polite" aria-atomic="true">
        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast.id}
              className={`${styles.toast} ${toast.action ? styles.withAction : ''}`}
              {...motionProps}
              {...(toast.action ? {
                onPointerEnter: () => clearTimeout(timer.current),
                onPointerLeave: () => arm(toast.ms),
                onFocus: () => clearTimeout(timer.current),
                onBlur: () => arm(toast.ms),
                onKeyDown: (e) => { if (e.key === 'Escape') leave(); },
              } : {})}
            >
              <IconCheck size={18} />
              <span>{toast.text}</span>
              {toast.action && (
                <button ref={actionRef} type="button" className={styles.action} onClick={() => { leave(true); toast.action.onClick(); }}>
                  {toast.action.label}
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
