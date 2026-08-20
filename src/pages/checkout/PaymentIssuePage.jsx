import { motion } from 'motion/react';
import { useSession } from '@context/SessionContext';
import { useReducedMotion } from '@hooks/useReducedMotion';
import { useRestartCheckout } from '@hooks/useRestartCheckout';
import { CheckoutShell } from '@components/layout/checkout/CheckoutShell';
import { GoldRing } from '@components/ui/shared/GoldRing';
import { CopyableRow } from '@components/ui/shared/CopyableRow';
import { IconAlert } from '@components/ui/icons/IconAlert';
import { staggerParent, reveal } from '@utils/motion';
import styles from '@styles/pages/checkout/edge-page.module.css';

/* ──────────────────────────────────────────────────────────────────
 * PaymentIssuePage
 *
 * PHASE_7F_S5_CHECKOUT_API
 *
 * Reached via SessionResolver when status === 'failed'. The backend
 * marks a session 'failed' when a transfer arrives but the amount
 * does not match the locked order (modules/kora/routes.js, the
 * amount-tolerance check). It is rare, and an operator is alerted
 * over Telegram the moment it happens.
 *
 * This is a terminal, recovery-register surface | the same edge
 * canvas + structure as ExpiredPage and AlreadyPaidPage. It exists
 * because routing a mismatch to InvalidPage would tell a user who
 * simply transferred the wrong amount that their link is broken |
 * a trust-destroying lie on a money screen.
 *
 * Copy follows the two-part rule (what happened + what to do next).
 * The reference is shown so the user can quote it to support.
 * ────────────────────────────────────────────────────────────────── */

export function PaymentIssuePage() {
  const { session } = useSession();
  const reduced = useReducedMotion();
  const { restart, pending, error, exhausted } =
    useRestartCheckout(session?.session_id ?? null);

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
          className={`${styles.iconWrap} ${styles.error}`}
          variants={reveal}
        >
          <span className={styles.iconGlyph}>
            <IconAlert size={28} />
          </span>
        </motion.div>

        <motion.div className={styles.textBlock} variants={reveal}>
          <h1 className={styles.headline}>We could not confirm this payment</h1>
          <p className={styles.subhead}>
            A transfer was received but the amount did not match this
            order. Our team has been notified and is reviewing it.
            If you need help, quote the reference below.
          </p>
        </motion.div>

        {session.reference && (
          <motion.div className={styles.contentBlock} variants={reveal}>
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
        )}

        <motion.div className={styles.ctaBlock} variants={reveal}>
          {/* A 'failed' session means a transfer arrived with the
            * wrong amount and an operator is already reviewing it.
            * Restart is offered because the user still wants their
            * deposit, but the reference above stays visible so the
            * original is traceable | the two are separate matters and
            * starting a new purchase does not resolve the old one. */}
          {!exhausted && (
            <button
              type="button"
              className={styles.cta}
              onClick={restart}
              disabled={pending}
            >
              <GoldRing shape="rect" radius={14} />
              <span className={styles.ctaLabel}>
                {pending ? 'Starting new purchase' : 'Start a new purchase'}
              </span>
            </button>
          )}

          {error && (
            <p className={styles.subhead} role="alert">
              {error}
            </p>
          )}

          {exhausted ? (
            <button type="button" className={styles.cta} onClick={handleReturn}>
              <GoldRing shape="rect" radius={14} />
              <span className={styles.ctaLabel}>
                Return to {platformName}
              </span>
            </button>
          ) : (
            <button
              type="button"
              className={styles.secondaryLink}
              onClick={handleReturn}
            >
              Return to {platformName}
            </button>
          )}
        </motion.div>
      </motion.div>
    </CheckoutShell>
  );
}
