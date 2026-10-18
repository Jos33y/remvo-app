import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { AuthLayout } from '@components/layout/seller/AuthLayout';
import { IconAlert } from '@components/ui/seller/icons';
import { useSellerSession } from '@context/SellerSession';
import { sellerApi } from '@lib/sellerApi';
import { SELLER_ROUTES } from '@utils/constants';
import styles from '@styles/pages/seller/sign-in.module.css';

/* ──────────────────────────────────────────────────────────────────
 * EmailsOffPage, /emails-off?a=&t= (emails1)
 *
 * Where "Turn these emails off" in one of Joseph's emails lands. No
 * sign-in: the token in the link is the proof. It waits for a tap, as
 * the confirm-your-email page does, so a mail scanner opening the link
 * turns nothing off. Says plainly what stops and what does not.
 * ────────────────────────────────────────────────────────────────── */

const A = /^acc_[A-Za-z0-9_-]{20}$/;
const T = /^[A-Za-z0-9_-]{32}$/;

export function EmailsOffPage() {
  const [params] = useSearchParams();
  const { status } = useSellerSession();
  const a = params.get('a') ?? '';
  const t = params.get('t') ?? '';
  const whole = A.test(a) && T.test(t);
  const [state, setState] = useState(whole ? 'ask' : 'error');
  const [error, setError] = useState(whole ? '' : 'This link is not complete. Open it from the email again.');

  useEffect(() => { document.title = 'Remvo | Emails from Joseph'; }, []);

  async function turnOff() {
    setState('busy');
    try {
      await sellerApi.emailsOff(a, t);
      setState('done');
    } catch (err) {
      setError(err.message);
      setState('error');
    }
  }

  const profile = status === 'signedIn' ? SELLER_ROUTES.PROFILE : SELLER_ROUTES.SIGN_IN;

  return (
    <AuthLayout card={{ holderHint: 'you@example.com', label: 'Seller' }}>
      {state === 'done' ? (
        <>
          <h1 className={styles.heading} tabIndex={-1} ref={(el) => el?.focus()}>Done. No more emails from Joseph.</h1>
          <p className={styles.sub}>Receipts, codes, your listings and credit reminders still come. You can turn these on again in Profile.</p>
          <Link to={profile} className={styles.primary}>{status === 'signedIn' ? 'Go to Profile' : 'Sign in'}</Link>
        </>
      ) : state === 'error' ? (
        <>
          <h1 className={styles.heading}>This link did not work.</h1>
          <p className={styles.error} role="alert"><IconAlert size={18} /><span>{error} You can turn these emails off in Profile.</span></p>
          <Link to={profile} className={styles.primary}>{status === 'signedIn' ? 'Go to Profile' : 'Sign in'}</Link>
        </>
      ) : (
        <>
          <h1 className={styles.heading}>Turn off emails from Joseph?</h1>
          <p className={styles.sub}>The few short emails about getting started and what is new on Remvo. Receipts, codes, your listings and credit reminders still come.</p>
          <button type="button" className={styles.primary} onClick={turnOff} disabled={state === 'busy'} autoFocus>
            {state === 'busy' ? 'Turning them off…' : 'Turn them off'}
          </button>
        </>
      )}
    </AuthLayout>
  );
}
