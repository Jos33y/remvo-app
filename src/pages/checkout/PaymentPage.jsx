import { useEffect } from 'react';
import { useParams } from 'react-router';
import { motion } from 'motion/react';

import { useSession } from '@context/SessionContext';
import { useCheckoutNavigate } from '@hooks/useCheckoutNavigate';
import { useReducedMotion } from '@hooks/useReducedMotion';

import { CheckoutShell } from '@components/layout/checkout/CheckoutShell';
import { RemvoCard } from '@components/ui/shared/RemvoCard';
import { BankTransferCard } from '@components/ui/checkout/BankTransferCard';
import { PaymentStatusBar } from '@components/ui/checkout/PaymentStatusBar';
import { useCountdown } from '@hooks/useCountdown';
import { DevSimulateButton } from '@components/ui/checkout/DevSimulateButton';

import { formatNaira } from '@utils/formatNaira';
/* PHASE_7F_S4_CHECKOUT_EVENTS */
import { useCheckoutViewEvent, useCheckoutEmitter } from '@hooks/useCheckoutEvent';
import { CHECKOUT_EVENTS } from '@lib/checkoutEventsClient';
import { durSlow, easeOut } from '@utils/motion';

import styles from '@styles/pages/checkout/payment-page.module.css';

/* Phase 5 | obsidian canvas. Card on the left in default state,
 * transitions to pending when the webhook lands, then SessionResolver
 * navigates to /complete where the card becomes owned with the
 * iridescent border draw. BankTransferCard on the right carries the
 * digit-settle signature moment. */
export function PaymentPage() {
  const { token } = useParams();
  const checkoutNavigate = useCheckoutNavigate();
  const { session, startPaymentWindow, mockExpireSession } = useSession();
  const reduced = useReducedMotion();

  useEffect(() => {
    startPaymentWindow();
  }, [startPaymentWindow]);

  /* payment.view | reached the bank-transfer page. */
  useCheckoutViewEvent(CHECKOUT_EVENTS.PAYMENT_VIEW, session?.session_id);
  const emitPayment = useCheckoutEmitter(session?.session_id);

  /* payment.waiting | the window is live and the user is still
   * pending a transfer. Only emit when status is 'pending' so a
   * session that lands already-settled does not record a phantom
   * wait. The view-event dedup makes this safe to evaluate every
   * render | it fires at most once. */
  useCheckoutViewEvent(
    CHECKOUT_EVENTS.PAYMENT_WAITING,
    session?.status === 'pending' ? session?.session_id : null
  );

  useEffect(() => {
    if (!session) return;
    if (session.status === 'completed') {
      checkoutNavigate(`/${token}/complete`, { replace: true });
    } else if (session.status === 'expired' || session.status === 'failed') {
      /* PHASE_7F_S5_FAILED_NAV | expired or failed both route home to SessionResolver */
      checkoutNavigate(`/${token}`, { replace: true });
    }
  }, [session, token, checkoutNavigate]);

  /* The PSP account dies at expires_at. The server does not flip the
   * session to 'expired' until the cron runs (up to a 60s grace plus
   * the 30s interval), and the provider's client-side hard stop is
   * 90s past expiry | deliberately generous, because a transfer that
   * lands at 14:59 may not confirm until after the window closes, and
   * calling it expired early would be worse.
   *
   * That leaves a window where the countdown reads 00:00 while the
   * panel still shows a live account number with working copy
   * buttons. A user can copy it and send money to an account that no
   * longer exists.
   *
   * The client already knows expires_at has passed, so it stops
   * presenting the panel as actionable immediately. The server stays
   * authoritative for the final status; this only governs what the
   * page offers the user to do in the meantime.
   *
   * Timestamp-derived, so a backgrounded tab returning to focus is
   * correct without waiting for a tick. */
  const { expired: windowClosed } = useCountdown(
    session?.status === 'pending' ? session?.payment_expires_at : null
  );

  if (!session) return null;

  const isPending = session.status === 'pending';
  const isSettled = session.status === 'processing' || session.status === 'completed';
  const cardState = isSettled ? 'pending' : 'default';

  const handleCountdownExpire = () => mockExpireSession();

  return (
    <CheckoutShell wide canvas="obsidian" platformName={session.platform_name}>
      <div className={styles.content}>
        <div className={styles.leftCol}>
          <motion.div
            className={styles.cardBlock}
            initial={reduced ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: durSlow, ease: easeOut, delay: 0.1 }}
          >
            <RemvoCard
              amount={session.amount_usd_card}
              reference={session.reference}
              state={cardState}
            />
          </motion.div>

          <motion.div
            className={styles.amountBlock}
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: durSlow, ease: easeOut, delay: 0.25 }}
          >
            <div className={styles.amountValue}>{formatNaira(session.user_pays_naira)}</div>
            <div className={styles.amountRate}>at {formatNaira(session.display_rate)} per dollar</div>
          </motion.div>
        </div>

        <div className={styles.rightCol}>
          <motion.div
            className={styles.bankBlock}
            initial={reduced ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: durSlow, ease: easeOut, delay: 0.15 }}
          >
            <BankTransferCard
              bankName={session.bank_name}
              accountNumber={session.account_number}
              accountName={session.account_name}
              amountNaira={session.user_pays_naira}
              reference={session.reference}
              disabled={!isPending || windowClosed}
              accent={isSettled}
              onCopy={() => emitPayment(CHECKOUT_EVENTS.PAYMENT_COPY)}
            />
          </motion.div>

          <motion.div
            className={styles.statusBlock}
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: durSlow, ease: easeOut, delay: 0.35 }}
          >
            <PaymentStatusBar
              status={session.status}
              expiresAt={isPending ? session.payment_expires_at : null}
              onExpire={handleCountdownExpire}
            />
          </motion.div>
        </div>
      </div>

      <DevSimulateButton />
    </CheckoutShell>
  );
}
