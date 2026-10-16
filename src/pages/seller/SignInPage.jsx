import { useEffect, useId, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router';
import { AuthLayout } from '@components/layout/seller/AuthLayout';
import { IconAlert, IconEye, IconEyeOff } from '@components/ui/seller/icons';
import { useSellerSession } from '@context/SellerSession';
import { sellerApi } from '@lib/sellerApi';
import { autofillSupported, passkeysSupported, signInWithPasskey, stopPasskeyPrompt } from '@lib/sellerPasskeys';
import { SELLER_ROUTES, siteUrl as site } from '@utils/constants';
import styles from '@styles/pages/seller/sign-in.module.css';

/* ──────────────────────────────────────────────────────────────────
 * SignInPage: /sign-in and /sign-up (16 October 2026: passwords)
 *
 *   sign-in   email and password, or a passkey (offered in the email
 *             field's own suggestions where the browser can, and as a
 *             button)
 *   sign-up   email and password; then
 *   confirm   the six-digit code from the email (or its link, on the
 *             device that opens it). Then the account exists.
 *   forgot    email; then
 *   reset     the code and a new password. Sellers from before
 *             passwords set their first one this way.
 *
 * Fields carry the autocomplete names password managers look for
 * (username, current-password, new-password, one-time-code), so the
 * browser offers to save the password and fills it in next time.
 *
 * A step waiting on an email survives a refresh (sessionStorage), so
 * going to the mail app and back on a phone keeps the step. The
 * password itself is never stored; it lives in memory only.
 * ────────────────────────────────────────────────────────────────── */

const RESEND_SECONDS = 30;
const PENDING_KEY = 'remvo.signIn.pending';
const MIN = 10;

const readPending = () => { try { return JSON.parse(sessionStorage.getItem(PENDING_KEY) || 'null'); } catch { return null; } };
const writePending = (v) => { try { if (v) sessionStorage.setItem(PENDING_KEY, JSON.stringify(v)); else sessionStorage.removeItem(PENDING_KEY); } catch { /* private mode */ } };

/* Only a path on this site, never an absolute URL: ?next= must not
 * become a way to bounce a seller somewhere else after sign-in. */
const safeNext = (v) => (typeof v === 'string' && /^\/(?!\/)[^\s]*$/.test(v) ? v : SELLER_ROUTES.HOME);

const HEAD = {
  'sign-in': ['Welcome back.', 'Sign in to make your listings.'],
  'sign-up': ['Open your seller account.', 'An email and a password. Your first listing is on us.'],
  confirm: ['Check your email.', null],
  forgot: ['Forgot your password?', 'We will email you a code to choose a new one. Made your account before 16 October? This is how you set your first password.'],
  reset: ['Choose a new password.', null],
};

const now = new Date();
const MONTH = now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

function lengthHint(pw) {
  const n = [...pw].length;
  if (!n) return { text: `At least ${MIN} characters. A short sentence works well.`, done: false };
  if (n < MIN) return { text: `${MIN - n} more ${MIN - n === 1 ? 'character' : 'characters'} to go.`, done: false };
  return { text: 'Long enough.', done: true };
}

function Problem({ id, children }) {
  return (
    <p id={id} className={styles.error} role="alert">
      <IconAlert size={18} />
      <span>{children}</span>
    </p>
  );
}

function PasswordField({ id, label, value, onChange, autoComplete, invalid, describedBy, disabled, action, inputRef }) {
  const [shown, setShown] = useState(false);
  return (
    <div className={styles.field}>
      <div className={styles.labelRow}>
        <label htmlFor={id} className={styles.label}>{label}</label>
        {action}
      </div>
      <div className={styles.control}>
        <input
          ref={inputRef}
          id={id}
          className={`${styles.input} ${styles.withReveal}`}
          type={shown ? 'text' : 'password'}
          autoComplete={autoComplete}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={value}
          onChange={onChange}
          aria-invalid={invalid ? 'true' : undefined}
          aria-describedby={describedBy}
          disabled={disabled}
        />
        <button type="button" className={styles.reveal} onClick={() => setShown((v) => !v)} aria-label="Show password" aria-pressed={shown} aria-controls={id} disabled={disabled}>
          {shown ? <IconEyeOff /> : <IconEye />}
        </button>
      </div>
    </div>
  );
}

export function SignInPage() {
  const session = useSellerSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));
  const routeMode = location.pathname === SELLER_ROUTES.SIGN_UP ? 'sign-up' : 'sign-in';

  const pending = readPending();
  const [mode, setMode] = useState(pending?.mode ?? routeMode);
  const [email, setEmail] = useState(pending?.email ?? '');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [wait, setWait] = useState(pending ? RESEND_SECONDS : 0);
  const [canPasskey] = useState(passkeysSupported);

  const ids = { email: useId(), password: useId(), code: useId(), error: useId(), hint: useId() };
  const firstRef = useRef(null);
  const codeRef = useRef(null);

  // The tabs are links: following one starts that form fresh.
  useEffect(() => {
    if (mode === 'sign-in' || mode === 'sign-up') setMode(routeMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeMode]);

  useEffect(() => {
    document.title = mode === 'sign-up' ? 'Remvo | Open an account' : 'Remvo | Sign in';
  }, [mode]);

  useEffect(() => {
    if (wait <= 0) return undefined;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  useEffect(() => {
    if (mode === 'confirm' || mode === 'reset') codeRef.current?.focus();
    else if (window.matchMedia('(pointer: fine)').matches) firstRef.current?.focus();
  }, [mode]);

  // Passkeys in the email field's own suggestions, where the browser can.
  useEffect(() => {
    if (mode !== 'sign-in') return undefined;
    let live = true;
    (async () => {
      if (!(await autofillSupported()) || !live) return;
      try {
        const r = await signInWithPasskey({ autofill: true });
        if (r && live) done(r.account);
      } catch (err) {
        if (live) setError(err.message);
      }
    })();
    return () => { live = false; stopPasskeyPrompt(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  if (session.status === 'signedIn') return <Navigate to={next} replace />;

  function done(account) {
    writePending(null);
    session.signedIn(account);
    navigate(next, { replace: true });
  }

  function go(nextMode, keepEmail = true) {
    setError(''); setNote(''); setCode('');
    if (!keepEmail) setEmail('');
    if (nextMode === 'sign-in' || nextMode === 'sign-up') {
      writePending(null);
      setPassword('');
      navigate(nextMode === 'sign-up' ? SELLER_ROUTES.SIGN_UP : SELLER_ROUTES.SIGN_IN, { replace: true });
    }
    setMode(nextMode);
  }

  // A tab starts its form fresh; the link itself changes the address.
  function fresh() {
    writePending(null);
    setError(''); setNote(''); setPassword('');
  }

  async function run(fn) {
    if (busy) return;
    setError(''); setNote('');
    setBusy(true);
    try { await fn(); } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  const address = email.trim();
  const needEmail = () => { if (!address) throw new Error('Enter your email address.'); };

  const onSignIn = (e) => { e.preventDefault(); run(async () => {
    needEmail();
    if (!password) throw new Error('Enter your password.');
    const { account } = await sellerApi.signIn(address, password);
    done(account);
  }); };

  const onSignUp = (e) => { e.preventDefault(); run(async () => {
    needEmail();
    if ([...password].length < MIN) throw new Error(`Use at least ${MIN} characters. A short sentence works well.`);
    await sellerApi.signUp(address, password);
    writePending({ mode: 'confirm', email: address });
    setWait(RESEND_SECONDS);
    setMode('confirm');
  }); };

  const confirm = (digits) => run(async () => {
    if (digits.length !== 6) throw new Error('The code is six digits.');
    try {
      const { account } = await sellerApi.verifyCode(address, digits);
      done(account);
    } catch (err) {
      setCode('');
      codeRef.current?.focus();
      throw err;
    }
  });

  const resend = () => run(async () => {
    if (mode === 'confirm') await sellerApi.signUp(address, password);
    else await sellerApi.startReset(address);
    setWait(RESEND_SECONDS);
    setNote('Sent again. Use the newest email.');
  });

  const onForgot = (e) => { e.preventDefault(); run(async () => {
    needEmail();
    await sellerApi.startReset(address);
    writePending({ mode: 'reset', email: address });
    setPassword('');
    setWait(RESEND_SECONDS);
    setMode('reset');
  }); };

  const onReset = (e) => { e.preventDefault(); run(async () => {
    const digits = code.replace(/\D/g, '');
    if (digits.length !== 6) throw new Error('The code is six digits.');
    if ([...password].length < MIN) throw new Error(`Use at least ${MIN} characters. A short sentence works well.`);
    const { account } = await sellerApi.finishReset({ email: address, code: digits, password });
    done(account);
  }); };

  const onPasskey = () => run(async () => {
    stopPasskeyPrompt();
    const r = await signInWithPasskey();
    if (r) done(r.account);
  });

  function onCode(e) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(digits);
    if (error) setError('');
    // Six digits typed, pasted or filled from the email is the whole answer in confirm.
    if (mode === 'confirm' && digits.length === 6) confirm(digits);
  }

  const [heading, lead] = HEAD[mode];
  const errorNode = error ? <Problem id={ids.error}>{error}</Problem> : null;
  const describedBy = error ? ids.error : undefined;
  const hint = lengthHint(password);

  const emailField = (
    <div className={styles.field}>
      <div className={styles.labelRow}><label htmlFor={ids.email} className={styles.label}>Email</label></div>
      <input
        ref={firstRef}
        id={ids.email}
        name="email"
        className={styles.input}
        type="email"
        inputMode="email"
        autoComplete={mode === 'sign-in' ? 'username webauthn' : 'username'}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        value={email}
        onChange={(e) => { setEmail(e.target.value); if (error) setError(''); }}
        aria-invalid={error && !address ? 'true' : undefined}
        aria-describedby={describedBy}
        disabled={busy}
      />
    </div>
  );

  // For a password manager on the steps where the email is not a field.
  const hiddenUsername = <input type="email" name="email" autoComplete="username" value={address} readOnly hidden />;

  const card = {
    holder: address,
    holderHint: 'you@example.com',
    label: 'Seller',
    aside: mode === 'sign-up' || mode === 'confirm' ? { label: 'Seller since', value: MONTH } : null,
  };

  return (
    <AuthLayout card={card}>
      {(mode === 'sign-in' || mode === 'sign-up') && (
        <nav className={styles.switch} aria-label="Account">
          <Link to={SELLER_ROUTES.SIGN_IN} replace className={styles.switchItem} aria-current={mode === 'sign-in' ? 'page' : undefined} onClick={fresh}>Sign in</Link>
          <Link to={SELLER_ROUTES.SIGN_UP} replace className={styles.switchItem} aria-current={mode === 'sign-up' ? 'page' : undefined} onClick={fresh}>Open an account</Link>
        </nav>
      )}

      <h1 className={styles.heading}>{heading}</h1>
      {lead && <p className={styles.sub}>{lead}</p>}
      {(mode === 'confirm' || mode === 'reset') && (
        <p className={styles.sub}>
          We sent a six-digit code to <span className={styles.address}>{address}</span>.
          {mode === 'confirm' ? ' Enter it here, or open the link in the email on this device.' : ' Enter it with your new password.'}
        </p>
      )}

      {mode === 'sign-in' && (
        <form className={styles.form} onSubmit={onSignIn} noValidate>
          {emailField}
          <PasswordField
            id={ids.password}
            label="Password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); if (error) setError(''); }}
            autoComplete="current-password"
            invalid={Boolean(error)}
            describedBy={describedBy}
            disabled={busy}
            action={<button type="button" className={styles.inline} onClick={() => go('forgot')}>Forgot password?</button>}
          />
          {errorNode}
          <button type="submit" className={styles.primary} disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
          {canPasskey && (
            <button type="button" className={styles.secondary} onClick={onPasskey} disabled={busy}>Sign in with a passkey</button>
          )}
          <p className={styles.small}>
            Made your account before 16 October? It has no password yet.{' '}
            <button type="button" onClick={() => go('forgot')}>Set one now</button>.
          </p>
        </form>
      )}

      {mode === 'sign-up' && (
        <form className={styles.form} onSubmit={onSignUp} noValidate>
          {emailField}
          <PasswordField
            id={ids.password}
            label="Choose a password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); if (error) setError(''); }}
            autoComplete="new-password"
            invalid={Boolean(error) && [...password].length < MIN}
            describedBy={[ids.hint, describedBy].filter(Boolean).join(' ')}
            disabled={busy}
          />
          <p id={ids.hint} className={`${styles.hint} ${hint.done ? styles.hintDone : ''}`} aria-live="polite">{hint.text}</p>
          {errorNode}
          <button type="submit" className={styles.primary} disabled={busy}>{busy ? 'Opening your account…' : 'Open my account'}</button>
          <p className={styles.small}>
            We will email you a code to confirm it is your address. By opening an account you agree to the{' '}
            <a href={site('/terms')}>terms</a> and the <a href={site('/privacy')}>privacy policy</a>.
          </p>
        </form>
      )}

      {mode === 'confirm' && (
        <form className={styles.form} onSubmit={(e) => { e.preventDefault(); confirm(code); }} noValidate>
          {hiddenUsername}
          <div className={styles.field}>
            <div className={styles.labelRow}><label htmlFor={ids.code} className={styles.label}>Six-digit code</label></div>
            <input
              ref={codeRef}
              id={ids.code}
              className={`${styles.input} ${styles.code}`}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={onCode}
              aria-invalid={error ? 'true' : undefined}
              aria-describedby={describedBy}
              disabled={busy}
            />
          </div>
          {errorNode}
          {note && !error && <p className={styles.note} role="status">{note}</p>}
          <button type="submit" className={styles.primary} disabled={busy}>{busy ? 'Confirming…' : 'Confirm and sign in'}</button>
          <div className={styles.links}>
            <button type="button" className={styles.textButton} onClick={() => go('sign-up', false)} disabled={busy}>Use a different email</button>
            {password
              ? <button type="button" className={styles.textButton} onClick={resend} disabled={busy || wait > 0}>{wait > 0 ? `Send again in ${wait}s` : 'Send again'}</button>
              : <button type="button" className={styles.textButton} onClick={() => go('sign-up')} disabled={busy}>Start again</button>}
          </div>
          <p className={styles.small}>Not there? Check spam or promotions. It comes from Remvo.</p>
        </form>
      )}

      {mode === 'forgot' && (
        <form className={styles.form} onSubmit={onForgot} noValidate>
          {emailField}
          {errorNode}
          <button type="submit" className={styles.primary} disabled={busy}>{busy ? 'Sending…' : 'Email me a code'}</button>
          <div className={styles.links}>
            <button type="button" className={styles.textButton} onClick={() => go('sign-in')} disabled={busy}>Back to sign in</button>
          </div>
        </form>
      )}

      {mode === 'reset' && (
        <form className={styles.form} onSubmit={onReset} noValidate>
          {hiddenUsername}
          <div className={styles.field}>
            <div className={styles.labelRow}><label htmlFor={ids.code} className={styles.label}>Six-digit code</label></div>
            <input
              ref={codeRef}
              id={ids.code}
              className={`${styles.input} ${styles.code}`}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={onCode}
              aria-describedby={describedBy}
              disabled={busy}
            />
          </div>
          <PasswordField
            id={ids.password}
            label="New password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); if (error) setError(''); }}
            autoComplete="new-password"
            describedBy={[ids.hint, describedBy].filter(Boolean).join(' ')}
            disabled={busy}
          />
          <p id={ids.hint} className={`${styles.hint} ${hint.done ? styles.hintDone : ''}`} aria-live="polite">{hint.text}</p>
          {errorNode}
          {note && !error && <p className={styles.note} role="status">{note}</p>}
          <button type="submit" className={styles.primary} disabled={busy}>{busy ? 'Saving…' : 'Save and sign in'}</button>
          <div className={styles.links}>
            <button type="button" className={styles.textButton} onClick={() => go('forgot')} disabled={busy}>Use a different email</button>
            <button type="button" className={styles.textButton} onClick={resend} disabled={busy || wait > 0}>{wait > 0 ? `Send again in ${wait}s` : 'Send again'}</button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
