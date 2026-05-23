import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { startAuthentication } from '@simplewebauthn/browser';
import { AdminShell } from '@components/layout/admin/AdminShell';
import { Logo } from '@components/ui/shared/Logo';
import { PasskeyPrompt } from '@components/ui/shared/PasskeyPrompt';
import { IconAlert } from '@components/ui/icons/IconAlert';
import { adminPath } from '@app/adminRouter';
import { useOperatorSession } from '@context/AdminContext';
import {
  loginWithPassword,
  passkeyLoginStart,
  passkeyLoginFinish,
  isWebAuthnSupported,
  AuthApiError,
} from '@lib/authClient';
import styles from '@styles/pages/admin/login-page.module.css';

/* ──────────────────────────────────────────────────────────────────
 * LoginPage | /login | obsidian | no nav
 *
 * Two-tab sign-in:
 *
 *   Passkey   | email + WebAuthn assertion. Default for browsers
 *               that support PublicKeyCredential.
 *   Password  | email + password + 6-digit TOTP. Default fallback for
 *               browsers without WebAuthn (banner explains why).
 *
 * Either tab's success handler funnels through the same useOperatorSession
 * .signIn(apiOperator) call so the rest of the app sees a single
 * "now signed in" event. The session cookie is set by the server on
 * the matching network call; useOperatorSession.signIn just stores
 * the operator object locally so the UI knows who.
 *
 * Constant-time error UX: the API gives us one 401 message regardless
 * of which factor failed (brief §02.5). We surface it verbatim. The
 * value of distinguishing "wrong email" from "wrong password" to a
 * legitimate user is low; the cost of leaking it to an attacker is
 * non-zero. A single message wins.
 *
 * Network/transport errors get their own message because they're
 * actionable ("check your connection") in a way 401 isn't.
 *
 * Related docs:
 *   SECTION_1_AUTH_BUILD_BRIEF.md §03.1
 *   src/lib/authClient.js
 * ────────────────────────────────────────────────────────────────── */

const TAB_PASSKEY = 'passkey';
const TAB_PASSWORD = 'password';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useOperatorSession();
  const isProduction = import.meta.env.MODE === 'production';

  // WebAuthn check runs once; the result determines the default tab
  // and disables the passkey tab on unsupported browsers.
  const webauthnSupported = useMemo(() => isWebAuthnSupported(), []);
  const [tab, setTab] = useState(webauthnSupported ? TAB_PASSKEY : TAB_PASSWORD);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totp, setTotp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Clear error whenever the user edits any field. Stops a stale
  // "Invalid email, password, or code" from sitting next to a fresh
  // attempt. Mirrors the pattern in CountryComingSoonPage.
  useEffect(() => {
    if (!formError) return;
    setFormError(null);
    // We intentionally only re-run when these fields change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, password, totp, tab]);

  function redirectAfterSignIn() {
    const from = location.state?.from || adminPath('/');
    navigate(from, { replace: true });
  }

  // ─── Password submit ──────────────────────────────────────────

  async function handlePasswordSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedTotp = totp.trim();

    // Cheap client-side checks for shape (skip a round trip when the
    // input clearly can't pass server-side validation). The server
    // remains the source of truth.
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setFormError('Enter your work email.');
      return;
    }
    if (password.length < 12) {
      setFormError('Password is at least 12 characters.');
      return;
    }
    if (!/^\d{6}$/.test(trimmedTotp)) {
      setFormError('Enter the 6-digit code from your authenticator app.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await loginWithPassword({
        email: trimmedEmail,
        password,
        totp: trimmedTotp,
      });
      signIn(result.operator);
      redirectAfterSignIn();
    } catch (err) {
      setFormError(messageForError(err));
      setSubmitting(false);
    }
  }

  // ─── Passkey submit (driven by PasskeyPrompt) ─────────────────

  /**
   * Passes through to PasskeyPrompt as `onRequest`. The prompt
   * categorises thrown errors and shows the right recovery copy.
   *
   * A PasskeyPrompt-thrown 'user_cancelled' is recoverable on the
   * same screen; 'not_supported' should never fire here because we
   * already gated the tab on isWebAuthnSupported(); 'network_error'
   * is the connectivity bucket; 'unknown' covers everything else.
   *
   * @returns {Promise<{ operator: object }>}
   */
  async function handlePasskeyRequest() {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      // PasskeyPrompt categorises Error('unknown') etc; we throw a
      // shaped error so the prompt's error message is sensible.
      throw new Error('Enter your work email above first.');
    }

    // Step 1 | server-issued challenge + allowCredentials.
    let started;
    try {
      started = await passkeyLoginStart({ email: trimmedEmail });
    } catch (err) {
      // Surface as network_error if the API was unreachable; otherwise
      // bubble the exact server message via the catch in this file.
      if (err instanceof AuthApiError && err.status === 0) {
        throw new Error('network_error');
      }
      throw err;
    }

    // Step 2 | browser ceremony. Throws NotAllowedError on user cancel,
    // NotSupportedError on unsupported authenticator, etc. PasskeyPrompt
    // categorises these correctly via its own categoriseError().
    const credential = await startAuthentication({ optionsJSON: started.options });

    // Step 3 | server verifies + sets cookie + returns operator.
    const result = await passkeyLoginFinish({
      nonce: started.nonce,
      credential,
    });

    signIn(result.operator);
    return result;
  }

  function handlePasskeySuccess() {
    redirectAfterSignIn();
  }

  function handlePasskeyFallback() {
    setTab(TAB_PASSWORD);
  }

  // ─── Render ───────────────────────────────────────────────────

  return (
    <AdminShell pageTitle="Sign in" contentRegister="obsidian" nav={false}>
      <div className={styles.wrap}>
        <div className={styles.spacerTop} aria-hidden="true" />

        <div className={styles.card}>
          <div className={styles.logoSlot}>
            <Logo href={null} variant="gold" tone="white" size="large" />
          </div>

          <h1 className={styles.heading}>Sign in to admin</h1>
          <p className={styles.sub}>
            Use your passkey, or sign in with email + password and a
            6-digit code from your authenticator app.
          </p>

          {/* Tab switcher | passkey / password */}
          <div className={styles.tabRow} role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === TAB_PASSKEY}
              className={`${styles.tab} ${tab === TAB_PASSKEY ? styles.tabActive : ''}`}
              onClick={() => setTab(TAB_PASSKEY)}
              disabled={!webauthnSupported}
            >
              Passkey
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === TAB_PASSWORD}
              className={`${styles.tab} ${tab === TAB_PASSWORD ? styles.tabActive : ''}`}
              onClick={() => setTab(TAB_PASSWORD)}
            >
              Password + code
            </button>
          </div>

          {/* WebAuthn-unsupported banner | only shown when the user is on the password tab BECAUSE they had to be */}
          {!webauthnSupported && (
            <div className={styles.banner} role="status">
              Your browser doesn&apos;t support passkeys. Use the password
              flow below.
            </div>
          )}

          {/* Passkey tab: email + PasskeyPrompt */}
          {tab === TAB_PASSKEY && (
            <form
              className={styles.form}
              onSubmit={(e) => e.preventDefault()}
              noValidate
            >
              <div className={styles.field}>
                <label className={styles.label} htmlFor="login-email-passkey">
                  Email
                </label>
                <input
                  id="login-email-passkey"
                  type="email"
                  className={styles.input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="username webauthn"
                  inputMode="email"
                  spellCheck={false}
                  required
                />
              </div>

              {formError && (
                <div className={styles.formError} role="alert">
                  <IconAlert size={14} />
                  <span>{formError}</span>
                </div>
              )}

              <div className={styles.passkeySlot}>
                <PasskeyPrompt
                  onRequest={handlePasskeyRequest}
                  label="Sign in with passkey"
                  pendingLabel="Waiting for passkey"
                  successLabel="Signed in"
                  idleDescription="Your authenticator will prompt you to confirm."
                  onSuccess={handlePasskeySuccess}
                  onFallbackClick={handlePasskeyFallback}
                  showFallbackLink
                  tone="obsidian"
                />
              </div>
            </form>
          )}

          {/* Password tab: email + password + TOTP */}
          {tab === TAB_PASSWORD && (
            <form
              className={styles.form}
              onSubmit={handlePasswordSubmit}
              noValidate
            >
              <div className={styles.field}>
                <label className={styles.label} htmlFor="login-email-password">
                  Email
                </label>
                <input
                  id="login-email-password"
                  type="email"
                  className={styles.input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="username"
                  inputMode="email"
                  spellCheck={false}
                  required
                  disabled={submitting}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="login-password">
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  className={styles.input}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 12 characters"
                  autoComplete="current-password"
                  required
                  disabled={submitting}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="login-totp">
                  Authenticator code
                </label>
                <input
                  id="login-totp"
                  type="text"
                  className={`${styles.input} ${styles.inputMono}`}
                  value={totp}
                  onChange={(e) => setTotp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123 456"
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  required
                  disabled={submitting}
                />
              </div>

              {formError && (
                <div className={styles.formError} role="alert">
                  <IconAlert size={14} />
                  <span>{formError}</span>
                </div>
              )}

              <button
                type="submit"
                className={styles.primary}
                disabled={submitting}
              >
                {submitting ? 'Signing in' : 'Sign in'}
              </button>
            </form>
          )}

          <p className={styles.note}>
            Trouble signing in? Ask the operator who invited you to
            send a fresh invitation.
          </p>
        </div>

        <div className={styles.spacerBottom} aria-hidden="true" />

        {/* Sandbox indicator only. Production deployments suppress
            the pill | the URL bar and TLS state already signal prod
            unambiguously, and a "PRODUCTION" pill on a sign-in page
            reads as warning copy where there is no warning. */}
        {!isProduction && (
          <div className={styles.foot}>
            <span className={styles.envPillSandbox}>SANDBOX</span>
          </div>
        )}
      </div>
    </AdminShell>
  );
}

/**
 * Map an AuthApiError to a user-safe message. The server's 401
 * message is already constant-time (brief §02.5); we surface it
 * verbatim. Everything else gets a category-specific message that's
 * actionable.
 *
 * @param {unknown} err
 * @returns {string}
 */
function messageForError(err) {
  if (err instanceof AuthApiError) {
    if (err.status === 0) {
      return "Couldn't reach the server. Check your connection and try again.";
    }
    if (err.status === 429) {
      return 'Too many sign-in attempts. Wait a minute and try again.';
    }
    if (err.status === 401) {
      // The server has already sanitised this to be uniform across
      // wrong-email / wrong-password / wrong-TOTP / inactive operator.
      return err.message;
    }
    return err.message || 'Sign-in failed. Try again.';
  }
  return 'Sign-in failed. Try again.';
}
