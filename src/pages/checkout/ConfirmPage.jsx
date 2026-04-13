import { useParams } from 'react-router';
import { motion } from 'motion/react';

import { useSession } from '@context/SessionContext';
import { useCheckoutNavigate } from '@hooks/useCheckoutNavigate';
import { useReducedMotion } from '@hooks/useReducedMotion';

import { CheckoutShell } from '@components/layout/CheckoutShell';
import { RemvoCard } from '@components/ui/RemvoCard';
import { GoldRing } from '@components/ui/GoldRing';
import { DevSimulateButton } from '@components/ui/DevSimulateButton';

import { formatNaira } from '@utils/formatNaira';
import { durSlow, easeOut } from '@utils/motion';

import styles from '@styles/pages/confirm-page.module.css';

/* Phase 5 — obsidian canvas. Card on the left (default state),
 * Naira hero in the centre with the gold-bloom signature moment,
 * gold pill CTA on the right (desktop) / below (mobile). The CTA
 * uses the GoldRing primitive (SVG stroke, vector-precise 1px)
 * instead of the old ::before + mask-composite technique which
 * aliased on curves. Same surface treatment across every screen. */
export function ConfirmPage() {
  const { token } = useParams();
  const checkoutNavigate = useCheckoutNavigate();
  const { session, mockResetToSelectMode } = useSession();
  const reduced = useReducedMotion();

  if (!session) return null;

  const isSelectFlow = session.checkout_mode === 'select';

  const handlePay = () => checkoutNavigate(`/${token}/pay`);
  const handleChangeAmount = () => {
    mockResetToSelectMode();
    checkoutNavigate(`/${token}`);
  };
  const handleCancel = () => {
    if (session?.callback_url) window.location.href = session.callback_url;
  };

  return (
    <CheckoutShell wide canvas="obsidian" platformName={session.platform_name}>
      <div className={styles.content}>
        <motion.div
          className={styles.cardBlock}
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: durSlow, ease: easeOut, delay: 0.1 }}
        >
          <RemvoCard amount={session.amount_usd_card} reference={session.reference} state="default" />
        </motion.div>

        {/* Signature moment: Naira figure resolves from gold bloom */}
        <motion.div
          className={styles.amountBlock}
          initial={reduced ? false : { opacity: 0, filter: 'blur(16px)', scale: 0.96 }}
          animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
          transition={{ duration: 1.2, ease: easeOut, delay: 0.3 }}
        >
          <div className={styles.amountValue}>{formatNaira(session.user_pays_naira)}</div>
          <div className={styles.amountRate}>at {formatNaira(session.display_rate)} per dollar</div>
        </motion.div>

        <motion.div
          className={styles.ctaBlock}
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: durSlow, ease: easeOut, delay: 0.5 }}
        >
          <button type="button" className={styles.cta} onClick={handlePay}>
            <GoldRing shape="rect" radius={14} />
            <span className={styles.ctaLabel}>Pay with bank transfer</span>
          </button>
          <p className={styles.lockNote}>You have 15 minutes to complete this purchase.</p>

          <div className={styles.secondaryLinks}>
            {isSelectFlow && (
              <>
                <button type="button" className={styles.secondaryLink} onClick={handleChangeAmount}>
                  Change amount
                </button>
                <span className={styles.secondaryDivider} aria-hidden="true">·</span>
              </>
            )}
            <button type="button" className={styles.secondaryLink} onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </motion.div>
      </div>

      <DevSimulateButton />
    </CheckoutShell>
  );
}
