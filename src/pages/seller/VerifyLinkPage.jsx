import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { Logo } from '@components/ui/shared/Logo';
import { Button } from '@components/ui/shared/Button';
import { useSellerSession } from '@context/SellerSession';
import { sellerApi } from '@lib/sellerApi';
import { SELLER_ROUTES, siteUrl } from '@utils/constants';
import styles from '@styles/pages/seller/sign-in.module.css';

/* ──────────────────────────────────────────────────────────────────
 * VerifyLinkPage, /sign-in/verify#t=<token>
 *
 * Where the emailed link lands. The token is in the fragment, so it
 * never reaches a server log; it is read once, then wiped from the
 * address bar and history before anything else happens.
 *
 * Sign-in waits for one tap. Email security scanners (Outlook Safe
 * Links is the common one) open links before the person does, and some
 * run the page's script; signing in on load would let the scanner use
 * up the one-time link and the seller would arrive to "expired".
 * ────────────────────────────────────────────────────────────────── */

function takeToken() {
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

  useEffect(() => { document.title = 'Remvo | Sign in'; }, []);

  if (session.status === 'signedIn' && !busy) return <Navigate to={SELLER_ROUTES.HOME} replace />;

  async function signIn() {
    if (!token || busy) return;
    setBusy(true);
    setError('');
    try {
      const { account } = await sellerApi.verifyLink(token);
      try { sessionStorage.removeItem('remvo.signIn.email'); } catch { /* private mode */ }
      session.signedIn(account);
      navigate(SELLER_ROUTES.HOME, { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.panel}>
        <div className={styles.brand}><Logo variant="gold" size="default" href={siteUrl('/')} /></div>

        {error ? (
          <div className={styles.form}>
            <h1 className={styles.heading}>This link did not work</h1>
            <p className={styles.error} role="alert">{error}</p>
            <Button href={SELLER_ROUTES.SIGN_IN} variant="primary" size="default" className={styles.submit}>
              Ask for a new link
            </Button>
          </div>
        ) : (
          <div className={styles.form}>
            <h1 className={styles.heading}>Sign in to Remvo</h1>
            <p className={styles.sub}>You opened a sign-in link. Continue to sign in on this device.</p>
            <Button type="button" variant="primary" size="default" className={styles.submit} onClick={signIn} disabled={busy} autoFocus>
              {busy ? 'Signing in' : 'Sign in'}
            </Button>
            <p className={styles.hint}>
              Did not ask for this? Close this page. <Link to={SELLER_ROUTES.SIGN_IN} className={styles.legalLink}>Sign in another way</Link>
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
