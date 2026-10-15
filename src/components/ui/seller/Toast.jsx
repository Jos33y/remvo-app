import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { IconCheck } from '@components/ui/seller/icons';
import { small, fade, useReducedMotion } from '@lib/sellerMotion';
import styles from '@styles/ui/seller/toast.module.css';

/* Short confirmations: "Copied", "Listing deleted". One at a time, two
 * seconds, read aloud once (aria-live). Feedback only where an action
 * leaves nothing else on screen to show it happened. */

const ToastContext = createContext(() => {});

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);
  const reduced = useReducedMotion();

  const show = useCallback((text) => {
    clearTimeout(timer.current);
    setToast({ text, id: Date.now() });
    timer.current = setTimeout(() => setToast(null), 2000);
  }, []);

  const motionProps = reduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: fade }
    : { initial: { opacity: 0, y: -12, scale: 0.96 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: -8, scale: 0.98 }, transition: small };

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className={styles.layer} aria-live="polite" aria-atomic="true">
        <AnimatePresence>
          {toast && (
            <motion.div key={toast.id} className={styles.toast} {...motionProps}>
              <IconCheck size={18} />
              <span>{toast.text}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
