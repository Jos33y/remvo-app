import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { AdminShell } from '@components/layout/admin/AdminShell';
import { Logo } from '@components/ui/shared/Logo';
import { IconAlert } from '@components/ui/icons/IconAlert';
import { IconCheck } from '@components/ui/icons/IconCheck';
import { adminPath } from '@app/adminRouter';
import { useOperatorSession } from '@context/AdminContext';
import {
  acceptInvitation,
  totpEnrolGenerate,
  totpEnrolConfirm,
  setOrChangePassword,
  AuthApiError,
} from '@lib/authClient';
import styles from '@styles/pages/admin/invite-accept-page.module.css';

/* ──────────────────────────────────────────────────────────────────
 * InviteAcceptPage | /invite/:token | obsidian | no nav
 *
 * Three-step wizard. The brief calls for a single combined form, but
 * the backend accept endpoint creates ONLY the operator row (it knows
 * nothing about TOTP secrets or password hashes), so we sequence the
 * three authenticated calls behind one screen with a stepper.
 *
 * Design constraint locked in by the backend invariant in
 * service.setOrChangePassword: TOTP must be enrolled before a
 * password can be set. The wizard order reflects that:
 *
 *   Step 1 | Welcome      | display name → POST /invitations/:t/accept
 *                          → cookie issued, operator authenticated
 *   Step 2 | Authenticator | POST /auth/totp/enrol → URI + secret
 *                          → user types code → POST /auth/totp/confirm
 *   Step 3 | Password     | new password + TOTP code (re-enter)
 *                          → POST /auth/password
 *   On success | redirect to /enrol so they add a passkey next.
 *
 * Token validation is submit-only per brief §03.3 line 348: a GET to
 * verify the token before submit would let an attacker enumerate
 * valid tokens by timing or response shape. The first POST resolves
 * "valid token" and "create operator row" atomically, no leak.
 *
 * Error semantics: the four reasons the backend may reject an
 * invitation (not found / accepted / revoked / expired) all collapse
 * to a single "Invitation invalid or expired" 400. We surface that
 * unchanged. The user is told to ask for a new invite.
 *
 * Related docs:
 *   SECTION_1_AUTH_BUILD_BRIEF.md §03.3
 *   src/lib/authClient.js
 *   src/modules/auth/service.js (acceptInvitation, totpEnrolConfirm,
 *                                setOrChangePassword)
 * ────────────────────────────────────────────────────────────────── */

const PASSWORD_MIN = 12;
const STEPS = ['welcome', 'totp', 'password'];

function StepIndicator({ current }) {
  const idx = STEPS.indexOf(current);
  return (
    <div className={styles.stepIndicator} aria-label={`Step ${idx + 1} of ${STEPS.length}`}>
      {STEPS.map((step, i) => {
        const dotClass = [
          styles.stepDot,
          i === idx && styles.stepDotActive,
          i < idx && styles.stepDotDone,
        ]
          .filter(Boolean)
          .join(' ');
        return (
          <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 'inherit' }}>
            <div className={dotClass}>{i + 1}</div>
            {i < STEPS.length - 1 && (
              <div
                className={`${styles.stepConnector} ${i < idx ? styles.stepConnectorDone : ''}`}
                aria-hidden="true"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function InviteAcceptPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { signIn } = useOperatorSession();
  const isProduction = import.meta.env.MODE === 'production';

  const [step, setStep] = useState('welcome');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Step 1 state
  const [displayName, setDisplayName] = useState('');

  // Step 2 state. Secret + uri come back from totp/enrol; we hold
  // them client-side until totp/confirm persists. The server has no
  // copy in the meantime | refreshing this page would lose the
  // secret and require restarting the wizard from step 1.
  const totpData = useRef({ secret: '', uri: '' });
  const [totpReady, setTotpReady] = useState(false);
  const [totpCode, setTotpCode] = useState('');

  // Step 3 state
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [passwordTotp, setPasswordTotp] = useState('');

  // Clear errors on field edits
  useEffect(() => {
    if (!error) return;
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayName, totpCode, password, confirm, passwordTotp, step]);

  // ─── Step 1 → Step 2 ──────────────────────────────────────────

  async function handleWelcomeSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    const trimmed = displayName.trim();
    if (trimmed.length < 1) {
      setError('Enter your display name.');
      return;
    }

    setSubmitting(true);
    try {
      // Atomically validates the token, creates the operator row,
      // and issues a session cookie. The new operator is now
      // authenticated for steps 2 and 3.
      const result = await acceptInvitation({
        token,
        display_name: trimmed,
      });
      signIn(result.operator);

      // Immediately request a TOTP enrolment URI. The secret is
      // returned ONCE; we hold it in a ref so it doesn't trigger a
      // re-render and survives across steps.
      const totpResult = await totpEnrolGenerate();
      totpData.current = totpResult;
      setTotpReady(true);
      setStep('totp');
    } catch (err) {
      setError(messageForError(err, 'Could not accept the invitation.'));
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Step 2 → Step 3 ──────────────────────────────────────────

  async function handleTotpSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    const code = totpCode.trim();
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code from your authenticator app.');
      return;
    }
    if (!totpData.current.secret) {
      setError('Authenticator setup expired. Restart the invitation.');
      return;
    }

    setSubmitting(true);
    try {
      await totpEnrolConfirm({
        secret: totpData.current.secret,
        code,
      });
      // Carry the verified code into step 3 | the backend requires a
      // fresh TOTP code on every password set/change, even on first
      // set. Reusing this one is fine because it's still inside the
      // ±1 step window for ~30s. If step 3 takes longer than that,
      // the user re-enters; we cover that with a separate field.
      setPasswordTotp(code);
      setStep('password');
    } catch (err) {
      setError(messageForError(err, 'That code did not match. Try again.'));
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Step 3 → /enrol ──────────────────────────────────────────

  async function handlePasswordSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    const policyError = validatePassword(password, confirm);
    if (policyError) {
      setError(policyError);
      return;
    }
    if (!/^\d{6}$/.test(passwordTotp.trim())) {
      setError('Enter a fresh 6-digit code from your authenticator app.');
      return;
    }

    setSubmitting(true);
    try {
      await setOrChangePassword({
        new_password: password,
        totp: passwordTotp.trim(),
      });
      // Ship them to passkey enrolment. They're already authenticated;
      // /enrol just registers a passkey and redirects to the dashboard.
      navigate(adminPath('/enrol'), { replace: true });
    } catch (err) {
      setError(messageForError(err, 'Could not set your password.'));
      setSubmitting(false);
    }
  }

  // ─── Render ───────────────────────────────────────────────────

  return (
    <AdminShell pageTitle="Accept invitation" contentRegister="obsidian" nav={false}>
      <div className={styles.wrap}>
        <div className={styles.spacerTop} aria-hidden="true" />

        <div className={styles.card}>
          <div className={styles.logoSlot}>
            <Logo href={null} variant="gold" tone="white" size="large" />
          </div>

          <StepIndicator current={step} />

          {/* ── Step 1: Welcome ── */}
          {step === 'welcome' && (
            <>
              <div className={styles.header}>
                <h1 className={styles.heading}>Accept your invitation</h1>
                <p className={styles.sub}>
                  We&apos;ll set up your authenticator and password
                  next. Pick a display name to get started.
                </p>
              </div>

              <form className={styles.form} onSubmit={handleWelcomeSubmit} noValidate>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="invite-name">
                    Display name
                  </label>
                  <input
                    id="invite-name"
                    type="text"
                    className={styles.input}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value.slice(0, 80))}
                    placeholder="What should we call you?"
                    autoComplete="name"
                    required
                    disabled={submitting}
                    maxLength={80}
                  />
                  <div className={styles.hint}>
                    Shown in the admin header and on every audit row
                    you create.
                  </div>
                </div>

                {error && (
                  <div className={styles.formError} role="alert">
                    <IconAlert size={14} />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className={styles.primary}
                  disabled={submitting}
                >
                  {submitting ? 'Verifying invitation' : 'Continue'}
                </button>
              </form>
            </>
          )}

          {/* ── Step 2: Authenticator ── */}
          {step === 'totp' && (
            <>
              <div className={styles.header}>
                <div className={styles.welcomeRow}>
                  <span className={styles.welcomeIcon} aria-hidden="true">
                    <IconCheck size={16} />
                  </span>
                  <span className={styles.welcomeText}>Invitation verified</span>
                </div>
                <h1 className={styles.heading}>Set up authenticator</h1>
                <p className={styles.sub}>
                  Open your authenticator app (1Password, Google
                  Authenticator, Authy, etc.) and add a new account
                  with the secret below.
                </p>
              </div>

              {totpReady && (
                <div className={styles.qrBlock}>
                  <div className={styles.qrSecret}>
                    {totpData.current.secret}
                  </div>
                </div>
              )}

              <p className={styles.emailLine}>
                Or paste this URL into your authenticator:{' '}
                <span className={styles.mono}>
                  {totpData.current.uri || '...'}
                </span>
              </p>

              <form className={styles.form} onSubmit={handleTotpSubmit} noValidate>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="invite-totp">
                    6-digit code
                  </label>
                  <input
                    id="invite-totp"
                    type="text"
                    className={`${styles.input} ${styles.inputMono}`}
                    value={totpCode}
                    onChange={(e) =>
                      setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                    }
                    placeholder="123 456"
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    required
                    disabled={submitting}
                  />
                  <div className={styles.hint}>
                    Enter the rotating code your authenticator shows
                    for this account.
                  </div>
                </div>

                {error && (
                  <div className={styles.formError} role="alert">
                    <IconAlert size={14} />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className={styles.primary}
                  disabled={submitting}
                >
                  {submitting ? 'Verifying code' : 'Verify and continue'}
                </button>
              </form>
            </>
          )}

          {/* ── Step 3: Password ── */}
          {step === 'password' && (
            <>
              <div className={styles.header}>
                <div className={styles.welcomeRow}>
                  <span className={styles.welcomeIcon} aria-hidden="true">
                    <IconCheck size={16} />
                  </span>
                  <span className={styles.welcomeText}>Authenticator linked</span>
                </div>
                <h1 className={styles.heading}>Set a password</h1>
                <p className={styles.sub}>
                  Used as a fallback. You will register a passkey on
                  the next screen for everyday sign-in.
                </p>
              </div>

              <form className={styles.form} onSubmit={handlePasswordSubmit} noValidate>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="invite-password">
                    New password
                  </label>
                  <input
                    id="invite-password"
                    type="password"
                    className={styles.input}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 12 characters"
                    autoComplete="new-password"
                    minLength={PASSWORD_MIN}
                    required
                    disabled={submitting}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="invite-confirm">
                    Confirm password
                  </label>
                  <input
                    id="invite-confirm"
                    type="password"
                    className={styles.input}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Type it again"
                    autoComplete="new-password"
                    required
                    disabled={submitting}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="invite-pw-totp">
                    Authenticator code
                  </label>
                  <input
                    id="invite-pw-totp"
                    type="text"
                    className={`${styles.input} ${styles.inputMono}`}
                    value={passwordTotp}
                    onChange={(e) =>
                      setPasswordTotp(e.target.value.replace(/\D/g, '').slice(0, 6))
                    }
                    placeholder="123 456"
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    required
                    disabled={submitting}
                  />
                  <div className={styles.hint}>
                    A fresh code from your authenticator. The
                    previous one may have rotated.
                  </div>
                </div>

                {error && (
                  <div className={styles.formError} role="alert">
                    <IconAlert size={14} />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className={styles.primary}
                  disabled={submitting}
                >
                  {submitting ? 'Saving password' : 'Set password and continue'}
                </button>
              </form>
            </>
          )}
        </div>

        <div className={styles.spacerBottom} aria-hidden="true" />

        {!isProduction && (
          <div className={styles.foot}>
            <span className={styles.envPillSandbox}>SANDBOX</span>
          </div>
        )}
      </div>
    </AdminShell>
  );
}

// ── Helpers ──────────────────────────────────────────────────────

/**
 * Validate the new password against the launch policy. Mirrors the
 * server-side rule in src/modules/auth/password.js:
 *   - 12+ characters
 *   - at least one letter
 *   - at least one number
 *   - confirm matches
 *
 * @param {string} pw
 * @param {string} confirm
 * @returns {string|null}
 */
function validatePassword(pw, confirm) {
  if (!pw) return 'Set a password to continue.';
  if (pw.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters.`;
  if (!/[a-zA-Z]/.test(pw)) return 'Include at least one letter.';
  if (!/\d/.test(pw)) return 'Include at least one number.';
  if (confirm !== pw) return 'Passwords do not match.';
  return null;
}

/**
 * Map an AuthApiError to a step-appropriate user message. Generic
 * fallback supplied per call site so the copy fits the moment.
 *
 * @param {unknown} err
 * @param {string} fallback
 * @returns {string}
 */
function messageForError(err, fallback) {
  if (err instanceof AuthApiError) {
    if (err.status === 0) {
      return "Couldn't reach the server. Check your connection and try again.";
    }
    return err.message || fallback;
  }
  return fallback;
}
