import { motion } from 'motion/react';
import { useReducedMotion } from '@hooks/useReducedMotion';

import { CheckoutShell } from '@components/layout/CheckoutShell';
import { GoldRing } from '@components/ui/GoldRing';
import { Logo } from '@components/ui/Logo';
import { RemvoCard } from '@components/ui/RemvoCard';

import { staggerParent, reveal } from '@utils/motion';

import styles from '@styles/pages/landing-page.module.css';

/* ──────────────────────────────────────────────────────────────────
 * LandingPage — Phase 5 (mounts at /)
 *
 * Reached when a user lands on pay.remvo.app without a session
 * token. Not a marketing page — the marketing site lives at
 * remvo.app. This is a confident dead-end with brand presence.
 *
 * Canvas: obsidian void (matches the entire premium flow). The
 * vault watermark sits behind everything via the shell, the
 * faceted facet wedge cuts across, the xlarge logo dead-centre is
 * the brand expression, the small distant card top-right satisfies
 * the "card on every screen" rule.
 *
 * Signature moment: the vault planes draw in sequence on mount
 * (bottom → middle → top, 200ms each, 600ms total) then the
 * wordmark catches a left-to-right gold light sweep (800ms).
 * Total 1.4s. Inherited from the Logo primitive's animated path.
 * ────────────────────────────────────────────────────────────────── */

export function LandingPage() {
  const reduced = useReducedMotion();
  const initial = reduced ? false : 'hidden';

  return (
    <CheckoutShell hideFooter canvas="obsidian">
      {/* Small distant card — anchored top-right of the content area,
          slightly off-axis. Decorative, non-interactive, satisfies
          the card-on-every-screen rule. Pulled out of the staggered
          motion tree (just a quiet fade) so it doesn't compete with
          the logo's signature moment. */}
      <motion.div
        className={styles.distantCardWrap}
        aria-hidden="true"
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.2 }}
      >
        <div className={styles.distantCardTilt}>
          <RemvoCard amount={100} reference="RMV-2026-0001-0001" state="default" scale={0.55} />
        </div>
      </motion.div>

      <motion.div
        className={styles.content}
        variants={staggerParent}
        initial={initial}
        animate="visible"
      >
        <motion.div className={styles.logoBlock} variants={reveal}>
          <Logo variant="gold" tone="white" size="xlarge" href={null} animated />
        </motion.div>

        <motion.div className={styles.textBlock} variants={reveal}>
          <h1 className={styles.headline}>Secure checkout for cards.</h1>
          <p className={styles.subhead}>
            Start a purchase from any Remvo-enabled platform.
          </p>
        </motion.div>

        <motion.div className={styles.linkBlock} variants={reveal}>
          <a
            href="https://remvo.app"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            <GoldRing shape="rect" radius={14} />
            <span className={styles.linkLabel}>Visit remvo.app</span>
            <span className={styles.linkArrow} aria-hidden="true">→</span>
          </a>
        </motion.div>

        <motion.p className={styles.attribution} variants={reveal}>
          © Remvo Labs Limited · 2026
        </motion.p>
      </motion.div>
    </CheckoutShell>
  );
}
