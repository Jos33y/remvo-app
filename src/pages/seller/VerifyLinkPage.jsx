import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { AuthLayout } from '@components/layout/seller/AuthLayout';
import { IconAlert } from '@components/ui/seller/icons';
import { useSellerSession } from '@context/SellerSession';
import { sellerApi } from '@lib/sellerApi';
import { SELLER_ROUTES } from '@utils/constants';
import styles from '@styles/pages/seller/sign-in.module.css';

/* ──────────────────────────────────────────────────────────────────
 * VerifyLinkPage, /sign-in/verify#t=<token>
 *
 * Where the "confirm your email" link lands (and the old emailed
 * sign-in links, while any are still out). The token is in the
 * fragment, so it never reaches a server log; it is read once, then
 * wiped from the address bar and history before anything else happens.
 *
 * It waits for one tap. Email security scanners (Outlook Safe Links is
 * the common one) open links before the person does, and some run the
 * page's script; confirming on load would let the scanner use up the
 * one-time link and the seller would arrive to "expired".
 * ────────────────────────────────────────────────────────────────── */

export function takeToken() {
  const m = /(?:^|[#&])t=([A-Za-z0-9_-]{43})(?:&|$)/.exec(window.location.hash);
  if (window.location.hash) {
    window.history.replaceState(null, '', window.location.pathname);
  }
  return m ? m[1] : null;
}

export function VerifyLinkPage() {
  const session = useSellerSession();
  const navigate = useNavigate();
  const tokenRef = useRef(undefined);
  if (tokenRef.current === undefined) tokenRef.current = takeToken();
  const token = tokenRef.current;

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(token ? '' : 'This link is not complete. Open it from the email again, or ask for a new one.');

  useEffect(() => { document.title = 'Remvo | Confirm your email'; }, []);

  if (session.status === 'signedIn' && !busy) return <Navigate to={SELLER_ROUTES.HOME} replace />;

  async function confirm() {
    if (!token || busy) return;
    setBusy(true);
    setError('');
    try {
      const { account } = await sellerApi.verifyLink(token);
      try { sessionStorage.removeItem('remvo.signIn.pending'); } catch { /* private mode */ }
      session.signedIn(account);
      navigate(SELLER_ROUTES.HOME, { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <AuthLayout card={{ holderHint: 'you@example.com', label: 'Seller' }}>
      {error ? (
        <>
          <h1 className={styles.heading}>This link did not work.</h1>
          <p className={styles.error} role="alert"><IconAlert size={18} /><span>{error}</span></p>
          <Link to={SELLER_ROUTES.SIGN_IN} className={styles.primary}>Go to sign in</Link>
        </>
      ) : (
        <>
          <h1 className={styles.heading}>One tap and you are in.</h1>
          <p className={styles.sub}>You opened the link from your Remvo email. Continue on this device.</p>
          <button type="button" className={styles.primary} onClick={confirm} disabled={busy} autoFocus>
            {busy ? 'Signing in…' : 'Continue'}
          </button>
          <p className={styles.small}>
            Did not ask for this? Close this page. <Link to={SELLER_ROUTES.SIGN_IN}>Sign in another way</Link>
          </p>
        </>
      )}
    </AuthLayout>
  );
}
