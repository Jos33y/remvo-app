import { useState } from 'react';
import { useNavigate } from 'react-router';
import { startRegistration } from '@simplewebauthn/browser';
import { AdminShell } from '@components/layout/admin/AdminShell';
import { Logo } from '@components/ui/shared/Logo';
import { PasskeyPrompt } from '@components/ui/shared/PasskeyPrompt';
import { adminPath } from '@app/adminRouter';
import {
  passkeyEnrolStart,
  passkeyEnrolFinish,
} from '@lib/authClient';
import styles from '@styles/pages/admin/enrol-page.module.css';

/* ──────────────────────────────────────────────────────────────────
 * EnrolPage | /enrol | obsidian | no nav
 *
 * Authenticated. Lands here after either:
 *   - accepting an invitation (InviteAcceptPage redirects on success)
 *   - signing in with password and noticing no passkey on this device
 *
 * Flow:
 *   1. Operator types a device label (required, 2-48 chars).
 *   2. Clicks "Enrol passkey" inside PasskeyPrompt.
 *   3. We call POST /v1/admin/auth/passkeys/start to get a
 *      WebAuthn challenge + the operator's existing credentials
 *      (so the system prompt won't double-enrol the same device).
 *   4. navigator.credentials.create(...) prompts the system; user
 *      consents with biometric / device PIN.
 *   5. We POST the attestation to /v1/admin/auth/passkeys/finish
 *      with the device label so it persists alongside the credential.
 *   6. On success, redirect to the dashboard.
 *
 * Errors (all caught by PasskeyPrompt):
 *   user_cancelled  | NotAllowedError | retry on the same screen
 *   not_supported   | rare here | fallback to password is offered
 *   network_error   | server unreachable | retry
 *   unknown         | bubble the catch-all message
 *
 * Related docs:
 *   SECTION_1_AUTH_BUILD_BRIEF.md §03.2
 *   src/lib/authClient.js
 * ────────────────────────────────────────────────────────────────── */

const DEVICE_LABEL_MAX = 48;

export function EnrolPage() {
  const navigate = useNavigate();
  const [deviceLabel, setDeviceLabel] = useState('');
  const [hasEnrolled, setHasEnrolled] = useState(false);
  const isProduction = import.meta.env.MODE === 'production';

  const trimmed = deviceLabel.trim();
  const canEnrol = trimmed.length >= 2 && trimmed.length <= DEVICE_LABEL_MAX;

  /**
   * The PasskeyPrompt onRequest handler. Runs the full WebAuthn
   * registration ceremony; throws on any failure so PasskeyPrompt's
   * own categoriser surfaces the right recovery copy.
   *
   * @returns {Promise<{ id: string, deviceLabel: string|null }>}
   */
  async function handleEnrolRequest() {
    // Validate label before kicking off the ceremony. Throwing here
    // is friendlier than disabling the button | the user gets a
    // single-shot inline error and can correct without a click that
    // appears unresponsive.
    if (!canEnrol) {
      throw new Error('Enter a device label first (2-48 characters).');
    }

    // Server issues a fresh challenge + the existing credentials list
    // so the platform UI prevents a re-enrol of the same device.
    const started = await passkeyEnrolStart({
      device_label: trimmed,
    });

    // Browser ceremony. On user cancel: NotAllowedError.
    // On unsupported authenticator: NotSupportedError.
    const credential = await startRegistration({ optionsJSON: started.options });

    // Server verifies + persists. The device_label binds at finish-time
    // so the user can label after the system prompt fires (matches
    // the brief's recommendation of post-prompt labelling).
    return passkeyEnrolFinish({
      nonce: started.nonce,
      credential,
      device_label: trimmed,
    });
  }

  function handleSuccess() {
    setHasEnrolled(true);
    // Brief delay so the success state is visible before the redirect
    // animation kicks in. Same UX timing as the previous mock flow.
    setTimeout(() => {
      navigate(adminPath('/'), { replace: true });
    }, 1200);
  }

  return (
    <AdminShell pageTitle="Enrol passkey" contentRegister="obsidian" nav={false}>
      <div className={styles.wrap}>
        <div className={styles.spacerTop} aria-hidden="true" />

        <div className={styles.card}>
          <div className={styles.logoSlot}>
            <Logo href={null} variant="gold" tone="white" size="large" />
          </div>

          <div className={styles.header}>
            <h1 className={styles.heading}>Enrol a passkey</h1>
            <p className={styles.sub}>
              Register this device so you can sign in without a password.
              Your passkey stays on this device and never leaves.
            </p>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="device-label">
              Device label
            </label>
            <input
              id="device-label"
              type="text"
              className={styles.input}
              value={deviceLabel}
              onChange={(e) => setDeviceLabel(e.target.value.slice(0, DEVICE_LABEL_MAX))}
              placeholder="MacBook Pro | Touch ID"
              autoComplete="off"
              spellCheck={false}
              maxLength={DEVICE_LABEL_MAX}
              disabled={hasEnrolled}
              aria-describedby="device-label-hint"
            />
            <div id="device-label-hint" className={styles.hint}>
              Name something recognisable. You can revoke individual
              devices later from Settings.
            </div>
          </div>

          <div className={styles.promptSlot}>
            <PasskeyPrompt
              onRequest={handleEnrolRequest}
              label="Enrol passkey"
              pendingLabel="Waiting for device"
              successLabel="Passkey enrolled"
              idleDescription="Follow the system prompt when it appears."
              onSuccess={handleSuccess}
              tone="obsidian"
            />
          </div>

          {/* Dashboard escape | the operator may have wandered here
              from Settings just to check, or already have a passkey
              they don't need to add to. /enrol is authenticated, so
              going back to / is always safe. We hide the exit while
              an enrolment is mid-success-redirect to avoid a brief
              "click both" race. */}
          {!hasEnrolled && (
            <button
              type="button"
              className={styles.exitLink}
              onClick={() => navigate(adminPath('/'))}
            >
              Back to dashboard
            </button>
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
