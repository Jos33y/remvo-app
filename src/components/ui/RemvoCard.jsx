import { motion } from 'motion/react';
import { useClipboard } from '@hooks/useClipboard';
import { useReducedMotion } from '@hooks/useReducedMotion';
import { durSignature, easeOut } from '@utils/motion';
import styles from '@styles/ui/remvo-card.module.css';

/* Phase 5 RemvoCard.
 * state: 'default' | 'pending' | 'owned'
 *  - default: faceted obsidian, hairline gold border at low opacity
 *  - pending: same surface + soft gold edge bloom (static)
 *  - owned:   iridescent gold inner border drawn around perimeter
 *             over 1.4s on mount, then held forever
 * interactive: when true, card becomes a button — tap copies reference
 * glow (deprecated): maps to state="pending" for backwards compat
 */
export function RemvoCard({
  amount = 25,
  reference = 'RMV-2026-0031-7A4F',
  scale = 1,
  state = 'default',
  interactive = false,
  glow = false,
}) {
  const reduced = useReducedMotion();
  const { copied, copy } = useClipboard();
  const formatted = Number.isInteger(amount) ? amount : amount.toFixed(2);
  const resolvedState = glow ? 'pending' : state;

  const className = [
    styles.card,
    styles[`state-${resolvedState}`],
    interactive && styles.interactive,
    copied && styles.copied,
  ].filter(Boolean).join(' ');

  const Inner = (
    <>
      {resolvedState === 'owned' && (
        <svg className={styles.edgeSvg} aria-hidden="true">
          <motion.rect
            x="0.5" y="0.5"
            width="calc(100% - 1px)" height="calc(100% - 1px)"
            rx="15.5" ry="15.5"
            fill="none"
            stroke="url(#remvoGoldGrad)"
            strokeWidth="1"
            initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: reduced ? 0 : durSignature, ease: easeOut }}
          />
          <defs>
            <linearGradient id="remvoGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#B89438" />
              <stop offset="35%" stopColor="#C9A84C" />
              <stop offset="50%" stopColor="#D4B85C" />
              <stop offset="65%" stopColor="#C9A84C" />
              <stop offset="100%" stopColor="#A88838" />
            </linearGradient>
          </defs>
        </svg>
      )}
      <div className={styles.top}>
        <div className={styles.brand}>
          <svg className={styles.mark} viewBox="0 0 40 48" fill="#C9A84C" aria-hidden="true">
            <polygon points="20,6 32,13 20,20 8,13" />
            <polygon points="20,12 32,19 20,26 8,19" opacity="0.55" />
            <polygon points="20,18 32,25 20,32 8,25" opacity="0.25" />
          </svg>
          <span className={styles.brandName}>REMVO</span>
        </div>
        <span className={styles.label}>DIGITAL VALUE CARD</span>
      </div>
      <div className={styles.bottom}>
        <span className={styles.amount}>${formatted}</span>
        <span className={styles.reference}>{copied ? 'Reference copied' : reference}</span>
      </div>
    </>
  );

  const style = scale !== 1 ? { transform: `scale(${scale})` } : undefined;

  if (interactive) {
    return (
      <button
        type="button"
        className={className}
        style={style}
        onClick={() => copy(reference)}
        aria-label={`${formatted} dollar Remvo card. Tap to copy reference ${reference}`}
      >
        {Inner}
      </button>
    );
  }

  return (
    <div className={className} style={style} role="img"
      aria-label={`${formatted} dollar Remvo Digital Value Card`}>
      {Inner}
    </div>
  );
}
