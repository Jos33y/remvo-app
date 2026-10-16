import { useEffect, useId, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { AuthLayout } from '@components/layout/seller/AuthLayout';
import { IconAlert } from '@components/ui/seller/icons';
import { useSellerSession } from '@context/SellerSession';
import { sellerApi } from '@lib/sellerApi';
import { SELLER_ROUTES } from '@utils/constants';
import { takeToken } from './VerifyLinkPage';
import styles from '@styles/pages/seller/sign-in.module.css';

/* ──────────────────────────────────────────────────────────────────
 * SetPasswordPage, /sign-in/password#t=<token>
 *
 * Where the "set or reset your password" email's link lands. The link
 * is checked first (without using it up), so the page can say which
 * account it is for and a password manager can save the email and the
 * new password as a pair. Saving uses the link once; every other
 * session on the account ends and this one begins.
 * ────────────────────────────────────────────────────────────────── */

const MIN = 10;

export function SetPasswordPage() {
  const session = useSellerSession();
  const navigate = useNavigate();
  const tokenRef = useRef(undefined);
  if (tokenRef.current === undefined) tokenRef.current = takeToken();
  const token = tokenRef.current;

  const [state, setState] = useState(token ? 'checking' : 'bad');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [shown, setShown] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(token ? '' : 'This link is not complete. Open it from the email again, or ask for a new one.');
  const ids = { pw: useId(), hint: useId(), err: useId() };

  useEffect(() => { document.title = 'Remvo | Choose a password'; }, []);

  useEffect(() => {
    if (!token) return;
    sellerApi.checkReset(token)
      .then((r) => { setEmail(r.email); setState('ready'); })
      .catch((err) => { setError(err.message); setState('bad'); });
  }, [token]);

  async function save(e) {
    e.preventDefault();
    if (busy) return;
    if ([...password].length < MIN) { setError(`Use at least ${MIN} characters. A short sentence works well.`); return; }
    setBusy(true); setError('');
    try {
      const { account } = await sellerApi.finishReset({ token, password });
      session.signedIn(account);
      navigate(SELLER_ROUTES.HOME, { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  const n = [...password].length;
  const hint = !n ? `At least ${MIN} characters. A short sentence works well.` : n < MIN ? `${MIN - n} more to go.` : 'Long enough.';

  return (
    <AuthLayout card={{ holder: email, holderHint: 'you@example.com', label: 'Seller' }}>
      {state === 'bad' ? (
        <>
          <h1 className={styles.heading}>This link did not work.</h1>
          <p className={styles.error} role="alert"><IconAlert size={18} /><span>{error}</span></p>
          <Link to={SELLER_ROUTES.SIGN_IN} className={styles.primary}>Go to sign in</Link>
          <p className={styles.small}>On the sign-in page, choose “Forgot password?” for a new code.</p>
        </>
      ) : (
        <>
          <h1 className={styles.heading}>Choose a new password.</h1>
          <p className={styles.sub}>
            {state === 'checking' ? 'Checking the link…' : <>For <span className={styles.address}>{email}</span>. Every other device is signed out when you save.</>}
          </p>
          <form className={styles.form} onSubmit={save} noValidate>
            <input type="email" name="email" autoComplete="username" value={email} readOnly hidden />
            <div className={styles.field}>
              <div className={styles.labelRow}><label htmlFor={ids.pw} className={styles.label}>New password</label></div>
              <div className={styles.control}>
                <input
                  id={ids.pw}
                  className={`${styles.input} ${styles.withReveal}`}
                  type={shown ? 'text' : 'password'}
                  autoComplete="new-password"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (error) setError(''); }}
                  aria-describedby={[ids.hint, error ? ids.err : null].filter(Boolean).join(' ')}
                  aria-invalid={error ? 'true' : undefined}
                  disabled={busy || state !== 'ready'}
                  autoFocus
                />
                <button type="button" className={styles.reveal} onClick={() => setShown((v) => !v)} aria-pressed={shown} aria-controls={ids.pw}>
                  {shown ? 'Hide' : 'Show'}<span className="sr-only"> password</span>
                </button>
              </div>
            </div>
            <p id={ids.hint} className={`${styles.hint} ${n >= MIN ? styles.hintDone : ''}`} aria-live="polite">{hint}</p>
            {error && <p id={ids.err} className={styles.error} role="alert"><IconAlert size={18} /><span>{error}</span></p>}
            <button type="submit" className={styles.primary} disabled={busy || state !== 'ready'}>{busy ? 'Saving…' : 'Save and sign in'}</button>
          </form>
        </>
      )}
    </AuthLayout>
  );
}
