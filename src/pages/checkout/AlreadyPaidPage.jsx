import { motion } from 'motion/react';
import { useSession } from '@context/SessionContext';
import { useReducedMotion } from '@hooks/useReducedMotion';
import { CheckoutShell } from '@components/layout/CheckoutShell';
import { GoldRing } from '@components/ui/GoldRing';
import { RemvoCard } from '@components/ui/RemvoCard';
import { CopyableRow } from '@components/ui/CopyableRow';
import { IconCheck } from '@components/ui/icons/IconCheck';
import { staggerParent, reveal } from '@utils/motion';
import styles from '@styles/pages/edge-page.module.css';

/* ──────────────────────────────────────────────────────────────────
 * AlreadyPaidPage — Phase 5
 *
 * Reached when status === 'completed' AND completed_in_session is
 * false. Shows the owned card + reference so the user can confirm
 * the activation that already happened. The card carries the
 * 'owned' state (iridescent gold inner border, drawn on mount)
 * just like CompletePage — this is the only screen outside Complete
 * where 'owned' appears. The card is non-interactive here: tap-to-
 * copy is reserved for CompletePage's celebration moment.
 * ────────────────────────────────────────────────────────────────── */

export function AlreadyPaidPage() {
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
        <motion.div
          className={`${styles.iconWrap} ${styles.success}`}
          variants={reveal}
        >
          <span className={styles.iconGlyph}>
            <IconCheck size={28} />
          </span>
        </motion.div>

        <motion.div className={styles.textBlock} variants={reveal}>
          <h1 className={styles.headline}>This card has already been activated</h1>
          <p className={styles.subhead}>
            {platformName} was credited in a previous session.
            No further action is needed.
          </p>
        </motion.div>

        <motion.div className={styles.contentBlock} variants={reveal}>
          <RemvoCard
            amount={session.amount_usd_card}
            reference={session.reference}
            state="owned"
          />
          <div className={styles.referenceWrap}>
            <CopyableRow
              label="Reference"
              value={session.reference}
              valueVariant="mono"
              ariaName="Reference number"
              tone="dark"
            />
          </div>
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
