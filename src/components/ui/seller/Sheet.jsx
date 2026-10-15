import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useDragControls } from 'motion/react';
import { sheet, fade, project, useReducedMotion, useWide } from '@lib/sellerMotion';
import { IconClose } from '@components/ui/seller/icons';
import theme from '@styles/layout/seller/app-theme.module.css';
import styles from '@styles/ui/seller/sheet.module.css';

/* ──────────────────────────────────────────────────────────────────
 * Sheet
 *
 * A bottom sheet on a phone, a centred panel on a wide screen.
 *
 * On a phone it follows the finger 1:1 from the grabber or the title
 * bar, resists past the top (rubber band, motion's elastic), and on
 * release decides by where the flick would come to rest, not only by
 * how far it was dragged: a quick flick down dismisses, a slow drag
 * that stops short springs back. The spring picks up the release
 * velocity, so there is no seam between finger and animation.
 *
 * Esc, the close button and the scrim all close it. Focus moves in on
 * open and back to what opened it on close. The page behind does not
 * scroll while it is open.
 *
 * Props: open, onClose, title, children, footer (optional, pinned).
 * ────────────────────────────────────────────────────────────────── */

/* Leaving never bounces: a settle on the way out reads as hesitation. */
const leave = { type: 'spring', bounce: 0, visualDuration: 0.2 };

const DISMISS_AT = 140; // px of projected travel past which a release closes

export function Sheet({ open, onClose, title, children, footer }) {
  const reduced = useReducedMotion();
  const wide = useWide();
  const titleId = useId();
  const panelRef = useRef(null);
  const returnTo = useRef(null);
  const drag = useDragControls();

  useEffect(() => {
    if (!open) return undefined;
    returnTo.current = document.activeElement;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const t = setTimeout(() => {
      // In order of preference: a field marked for it, the chosen
      // option of a radio group, then the first control. Not the close
      // button, which would make Return dismiss the sheet.
      const panel = panelRef.current;
      const first = ['[data-autofocus]', '[role="radio"][aria-checked="true"]', 'input, button:not([data-close]), [href]']
        .map((q) => panel?.querySelector(q))
        .find(Boolean);
      (first ?? panel)?.focus();
    }, 60);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
      returnTo.current?.focus?.();
    };
  }, [open, onClose]);

  const phone = !wide;
  const panelMotion = reduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: fade }
    : phone
      ? { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%', transition: leave }, transition: sheet }
      : { initial: { opacity: 0, scale: 0.96, y: 8 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.97, y: 4, transition: leave }, transition: sheet };

  const onDragEnd = (_e, info) => {
    const restsAt = info.offset.y + project(info.velocity.y);
    if (restsAt > DISMISS_AT) onClose();
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className={`${theme.theme} ${styles.layer}`} key="sheet">
          <motion.div
            className={styles.scrim}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={fade}
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className={styles.panel}
            {...panelMotion}
            drag={phone && !reduced ? 'y' : false}
            dragListener={false}
            dragControls={drag}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.06, bottom: 1 }}
            dragMomentum={false}
            onDragEnd={onDragEnd}
          >
            <div className={styles.head} onPointerDown={(e) => phone && drag.start(e)}>
              {phone && <span className={styles.grabber} aria-hidden="true" />}
              <h2 id={titleId} className={styles.title}>{title}</h2>
              <button type="button" className={styles.close} onClick={onClose} aria-label="Close" data-close>
                <IconClose size={20} />
              </button>
            </div>
            <div className={styles.body}>{children}</div>
            {footer && <div className={styles.footer}>{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
