import { useEffect, useId, useRef, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router';
import { Logo } from '@components/ui/shared/Logo';
import { Button } from '@components/ui/shared/Button';
import { useSellerSession } from '@context/SellerSession';
import { sellerApi } from '@lib/sellerApi';
import { BRAND, SELLER_ROUTES, siteUrl as site } from '@utils/constants';
import styles from '@styles/pages/seller/sign-in.module.css';

/* ──────────────────────────────────────────────────────────────────
 * SignInPage, /sign-in
 *
 * Two steps on one page, so the address bar never changes mid-flow:
 *
 *   email  one field. The same email signs in or creates the account,
 *          so there is no separate sign-up and nothing to choose.
 *   code   "check your email". The link in it signs in on the device
 *          that opens it; the six-digit code signs in here, which is
 *          what someone reading email on their phone needs.
 *
 * The email in progress survives a refresh (sessionStorage), so
 * switching to the mail app and back on a phone does not lose the
 * step. A signed-in seller who lands here goes straight home.
 * ────────────────────────────────────────────────────────────────── */

const RESEND_SECONDS = 30;
const PENDING_KEY = 'remvo.signIn.email';

const readPending = () => { try { return sessionStorage.getItem(PENDING_KEY) || ''; } catch { return ''; } };
const writePending = (v) => { try { if (v) sessionStorage.setItem(PENDING_KEY, v); else sessionStorage.removeItem(PENDING_KEY); } catch { /* private mode */ } };

/* Only a path on this site, never an absolute URL: ?next= must not
 * become a way to bounce a seller somewhere else after sign-in. */
const safeNext = (v) => (typeof v === 'string' && /^\/(?!\/)[^\s]*$/.test(v) ? v : SELLER_ROUTES.HOME);

export function SignInPage() {
  const session = useSellerSession();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));

  const pending = readPending();
  const [step, setStep] = useState(pending ? 'code' : 'email');
  const [email, setEmail] = useState(pending);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [wait, setWait] = useState(pending ? RESEND_SECONDS : 0);

  const emailId = useId();
  const codeId = useId();
  const errorId = useId();
  const codeRef = useRef(null);
  const emailRef = useRef(null);

  useEffect(() => { document.title = 'Remvo | Sign in'; }, []);

  useEffect(() => {
    if (wait <= 0) return undefined;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  useEffect(() => {
    if (step === 'code') codeRef.current?.focus();
    else emailRef.current?.focus();
  }, [step]);

  if (session.status === 'signedIn') return <Navigate to={next} replace />;

  async function sendEmail(e) {
    e?.preventDefault();
    if (busy) return;
    setError(''); setNote('');
    const address = email.trim();
    if (!address) { setError('Enter your email address.'); return; }
    setBusy(true);
    try {
      await sellerApi.start(address);
      writePending(address);
      setEmail(address);
      setCode('');
      setStep('code');
      setWait(RESEND_SECONDS);
      if (step === 'code') setNote('Sent again. Use the newest email.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function submitCode(value) {
    if (busy) return;
    const digits = value.replace(/\D/g, '');
    if (digits.length !== 6) { setError('The code is six digits.'); return; }
    setError(''); setNote('');
    setBusy(true);
    try {
      const { account } = await sellerApi.verifyCode(email, digits);
      writePending('');
      session.signedIn(account);
      navigate(next, { replace: true });
    } catch (err) {
      setError(err.message);
      setCode('');
      codeRef.current?.focus();
    } finally {
      setBusy(false);
    }
  }

  function onCodeChange(e) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(digits);
    if (error) setError('');
    // Six digits typed or pasted (or filled from the email by the
    // phone's keyboard) is the whole answer; no button press needed.
    if (digits.length === 6) submitCode(digits);
  }

  function useAnotherEmail() {
    writePending('');
    setStep('email'); setCode(''); setError(''); setNote(''); setWait(0);
  }

  return (
    <main className={styles.page}>
      <div className={styles.panel}>
        <div className={styles.brand}><Logo variant="gold" size="default" href={site('/')} /></div>

        {step === 'email' ? (
          <form onSubmit={sendEmail} noValidate className={styles.form}>
            <h1 className={styles.heading}>Sign in to Remvo</h1>
            <p className={styles.sub}>New here? The same email creates your account.</p>

            <label htmlFor={emailId} className={styles.label}>Email</label>
            <input
              ref={emailRef}
              id={emailId}
              className={styles.input}
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (error) setError(''); }}
              aria-invalid={error ? 'true' : undefined}
              aria-describedby={error ? errorId : undefined}
              disabled={busy}
            />
            {error && <p id={errorId} className={styles.error} role="alert">{error}</p>}

            <Button type="submit" variant="primary" size="default" className={styles.submit} disabled={busy}>
              {busy ? 'Sending…' : 'Email me a sign-in link'}
            </Button>

            <p className={styles.legal}>
              By continuing you agree to the{' '}
              <a href={site('/terms')} className={styles.legalLink}>terms</a> and{' '}
              <a href={site('/privacy')} className={styles.legalLink}>privacy policy</a>.
            </p>
          </form>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); submitCode(code); }} noValidate className={styles.form}>
            <h1 className={styles.heading}>Check your email</h1>
            <p className={styles.sub}>
              We sent a link and a code to <span className={styles.address}>{email}</span>.
              The link signs you in on the device that opens it. The code works here.
            </p>

            <label htmlFor={codeId} className={styles.label}>Six-digit code</label>
            <input
              ref={codeRef}
              id={codeId}
              className={`${styles.input} ${styles.code}`}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={onCodeChange}
              aria-invalid={error ? 'true' : undefined}
              aria-describedby={error ? errorId : undefined}
              disabled={busy}
            />
            {error && <p id={errorId} className={styles.error} role="alert">{error}</p>}
            {note && !error && <p className={styles.note} role="status">{note}</p>}

            <Button type="submit" variant="primary" size="default" className={styles.submit} disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </Button>

            <div className={styles.links}>
              <button type="button" className={styles.textButton} onClick={useAnotherEmail} disabled={busy}>
                Use a different email
              </button>
              <button type="button" className={styles.textButton} onClick={() => sendEmail()} disabled={busy || wait > 0}>
                {wait > 0 ? `Send again in ${wait}s` : 'Send again'}
              </button>
            </div>
            <p className={styles.hint}>Not there? Check spam or promotions. It comes from {BRAND.NAME}.</p>
          </form>
        )}
      </div>
    </main>
  );
}
