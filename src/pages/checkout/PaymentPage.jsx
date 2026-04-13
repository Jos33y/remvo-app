import { useEffect } from 'react';
import { useParams } from 'react-router';
import { motion } from 'motion/react';

import { useSession } from '@context/SessionContext';
import { useCheckoutNavigate } from '@hooks/useCheckoutNavigate';
import { useReducedMotion } from '@hooks/useReducedMotion';

import { CheckoutShell } from '@components/layout/CheckoutShell';
import { RemvoCard } from '@components/ui/RemvoCard';
import { BankTransferCard } from '@components/ui/BankTransferCard';
import { PaymentStatusBar } from '@components/ui/PaymentStatusBar';
import { DevSimulateButton } from '@components/ui/DevSimulateButton';

import { formatNaira } from '@utils/formatNaira';
import { durSlow, easeOut } from '@utils/motion';

import styles from '@styles/pages/payment-page.module.css';

/* Phase 5 — obsidian canvas. Card on the left in default state,
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

  useEffect(() => {
    if (!session) return;
    if (session.status === 'completed') {
      checkoutNavigate(`/${token}/complete`, { replace: true });
    } else if (session.status === 'expired') {
      checkoutNavigate(`/${token}`, { replace: true });
    }
  }, [session, token, checkoutNavigate]);

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
              disabled={!isPending}
              accent={isSettled}
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
