import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useSession } from '@context/SessionContext';
import { CheckoutShell } from '@components/layout/CheckoutShell';
import { RemvoCard } from '@components/ui/RemvoCard';
import { useReducedMotion } from '@hooks/useReducedMotion';
import { formatNaira } from '@utils/formatNaira';
import { durSlow, easeOut } from '@utils/motion';
import styles from '@styles/pages/complete-page.module.css';

const REDIRECT_DELAY_MS = 5000;

export function CompletePage() {
  const { session } = useSession();
  const reduced = useReducedMotion();
  const [autoCancelled, setAutoCancelled] = useState(false);
  const redirectedRef = useRef(false);
  const redirectRef = useRef(null);

  const cancelAutoRedirect = () => {
    if (autoCancelled) return;
    if (redirectRef.current) clearTimeout(redirectRef.current);
    redirectRef.current = null;
    setAutoCancelled(true);
  };

  const goToCallback = () => {
    if (redirectedRef.current || !session?.callback_url) return;
    redirectedRef.current = true;
    window.location.href = session.callback_url;
  };

  useEffect(() => {
    if (!session?.callback_url) return undefined;
    redirectRef.current = setTimeout(goToCallback, REDIRECT_DELAY_MS);
    return () => { if (redirectRef.current) clearTimeout(redirectRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.callback_url]);

  if (!session) return null;

  return (
    <CheckoutShell platformName={session.platform_name} canvas="obsidian" wide>
      <div
        className={styles.content}
        onPointerDown={cancelAutoRedirect}
        onFocus={cancelAutoRedirect}
      >
        <motion.div
          className={styles.cardBlock}
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: durSlow, ease: easeOut, delay: 0.1 }}
        >
          <RemvoCard
            amount={session.amount_usd_card}
            reference={session.reference}
            state="owned"
            interactive
          />
        </motion.div>

        <motion.div
          className={styles.messageBlock}
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: durSlow, ease: easeOut, delay: 0.4 }}
        >
          <div className={styles.amountValue}>
            {formatNaira(session.user_pays_naira)}
          </div>
          <div className={styles.confirmLine}>
            Credited to {session.platform_name} · just now
          </div>
          <button
            type="button"
            className={styles.doneLink}
            onClick={goToCallback}
            aria-label={`Return to ${session.platform_name}`}
          >
            Done →
          </button>
        </motion.div>
      </div>
    </CheckoutShell>
  );
}
