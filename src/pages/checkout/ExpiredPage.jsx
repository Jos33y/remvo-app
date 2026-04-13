import { motion } from 'motion/react';
import { useSession } from '@context/SessionContext';
import { useReducedMotion } from '@hooks/useReducedMotion';
import { CheckoutShell } from '@components/layout/CheckoutShell';
import { GoldRing } from '@components/ui/GoldRing';
import { IconClock } from '@components/ui/icons/IconClock';
import { staggerParent, reveal } from '@utils/motion';
import styles from '@styles/pages/edge-page.module.css';

/* ──────────────────────────────────────────────────────────────────
 * ExpiredPage — Phase 5
 *
 * Reached via SessionResolver when status === 'expired'. Calm
 * recovery surface on the edge canvas variant: warm paper, no
 * facet wedge, no vault watermark. The icon circle's iridescent
 * gold edge ignites on mount with a state-colour bloom — single
 * signature moment, ~600ms, acknowledging not celebrating.
 * ────────────────────────────────────────────────────────────────── */

export function ExpiredPage() {
  const { session } = useSession();
  const reduced = useReducedMotion();

  if (!session) return null;

  const platformName = session.platform_name ?? 'the platform';
  const initial = reduced ? false : 'hidden';

  const handleReturn = () => {
    if (session.callback_url) window.location.href = session.callback_url;
  };

  return (
    <CheckoutShell canvas="obsidian" platformName={session.platform_name}>
      <motion.div
        className={styles.content}
        variants={staggerParent}
        initial={initial}
        animate="visible"
      >
        {/* Signature moment: icon circle's edge ignites on mount.
            Implemented via initial box-shadow → animate box-shadow,
            wrapped in a motion.div so the bloom fades in cleanly. */}
        <motion.div
          className={`${styles.iconWrap} ${styles.warning}`}
          variants={reveal}
        >
          <span className={styles.iconGlyph}>
            <IconClock size={28} />
          </span>
        </motion.div>

        <motion.div className={styles.textBlock} variants={reveal}>
          <h1 className={styles.headline}>This payment window has expired</h1>
          <p className={styles.subhead}>
            The window to complete this payment has passed.
            Start a new purchase from {platformName} to continue.
          </p>
        </motion.div>

        <motion.div className={styles.ctaBlock} variants={reveal}>
          <button type="button" className={styles.cta} onClick={handleReturn}>
            <GoldRing shape="rect" radius={14} />
            <span className={styles.ctaLabel}>
            Return to {platformName}
          </span>
          </button>
        </motion.div>
      </motion.div>
    </CheckoutShell>
  );
}
