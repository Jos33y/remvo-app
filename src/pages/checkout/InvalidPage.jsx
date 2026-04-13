import { motion } from 'motion/react';
import { useSession } from '@context/SessionContext';
import { useReducedMotion } from '@hooks/useReducedMotion';
import { CheckoutShell } from '@components/layout/CheckoutShell';
import { GoldRing } from '@components/ui/GoldRing';
import { IconAlert } from '@components/ui/icons/IconAlert';
import { staggerParent, reveal } from '@utils/motion';
import styles from '@styles/pages/edge-page.module.css';

/* ──────────────────────────────────────────────────────────────────
 * InvalidPage — Phase 5
 *
 * Bad token, missing session, unrecognised state. Session may or
 * may not have a callback_url depending on how the user arrived,
 * so the CTA falls back to remvo.app when no callback exists.
 * ────────────────────────────────────────────────────────────────── */

export function InvalidPage() {
  const { session } = useSession();
  const reduced = useReducedMotion();

  const initial = reduced ? false : 'hidden';
  const hasCallback = Boolean(session?.callback_url);
  const platformName = session?.platform_name ?? 'the platform';

  const handleReturn = () => {
    if (hasCallback) {
      window.location.href = session.callback_url;
    } else {
      window.location.href = 'https://remvo.app';
    }
  };

  return (
    <CheckoutShell canvas="obsidian" platformName={session?.platform_name}>
      <motion.div
        className={styles.content}
        variants={staggerParent}
        initial={initial}
        animate="visible"
      >
        <motion.div
          className={`${styles.iconWrap} ${styles.error}`}
          variants={reveal}
        >
          <span className={styles.iconGlyph}>
            <IconAlert size={28} />
          </span>
        </motion.div>

        <motion.div className={styles.textBlock} variants={reveal}>
          <h1 className={styles.headline}>This checkout link is not valid</h1>
          <p className={styles.subhead}>
            The link may be expired, mistyped, or already used.
            {hasCallback
              ? ` Return to ${platformName} and start a new purchase.`
              : ' Please start a new purchase from your platform.'}
          </p>
        </motion.div>

        <motion.div className={styles.ctaBlock} variants={reveal}>
          <button type="button" className={styles.cta} onClick={handleReturn}>
            <GoldRing shape="rect" radius={14} />
            <span className={styles.ctaLabel}>
            {hasCallback ? `Return to ${platformName}` : 'Visit remvo.app'}
          </span>
          </button>
        </motion.div>
      </motion.div>
    </CheckoutShell>
  );
}
