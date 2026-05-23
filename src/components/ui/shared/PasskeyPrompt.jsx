import { useCallback, useEffect, useRef, useState } from 'react';
import { IconLock } from '@components/ui/icons/IconLock';
import { IconCheck } from '@components/ui/icons/IconCheck';
import { IconAlert } from '@components/ui/icons/IconAlert';
import styles from '@styles/ui/shared/passkey-prompt.module.css';

/* ──────────────────────────────────────────────────────────────────
 * PasskeyPrompt
 *
 * Shared primitive consumed by:
 *   - LoginPage      (sign in with existing passkey)
 *   - EnrolPage      (first-device enrolment)
 *   - SettingsPage   (add additional device)
 *
 * Owns the WebAuthn UX state machine. Does NOT own the network calls.
 * Consumer supplies `onRequest`, an async function that returns on
 * success or throws on failure. The primitive categorises the thrown
 * error and renders the matching recovery copy.
 *
 * ── States ──
 *
 *   idle       | primary button visible
 *   requesting | button disabled, spinner + "Waiting for passkey"
 *   success    | checkmark + success message; optionally auto-resets
 *   error      | error copy + retry button + secondary "use email" link
 *
 * ── Error categorisation ──
 *
 * Standard WebAuthn errors map to these categories:
 *   user_cancelled  | NotAllowedError, AbortError
 *   not_supported   | NotSupportedError, SecurityError, message "support"
 *   network_error   | TypeError containing "fetch", message "network"
 *   unknown         | everything else
 *
 * Consumer can also throw `new Error('network_error')` etc. to skip
 * the inference and target a specific category directly.
 * Consumer can override the copy per category via `errorMessages`.
 *
 * ── Props ──
 *
 * onRequest         | async () => any   required async handler
 * label             | button label, default "Sign in with passkey"
 * pendingLabel      | default "Waiting for passkey"
 * successLabel      | default "Signed in"
 * idleDescription   | optional helper copy below the button
 * autoRequest       | default false; invoke onRequest on mount (enrolment)
 * onSuccess         | optional callback fired on resolved onRequest
 * onError           | optional callback (error, category)
 * errorMessages     | optional override: { user_cancelled, not_supported, network_error, unknown }
 * showFallbackLink  | default true; renders a "Use email + password" link
 * onFallbackClick   | handler for the fallback link
 * successAutoResetMs| default null; if set, reverts to idle after N ms
 * tone              | 'obsidian' (default) | 'neutral'
 * ariaLabelledBy    | optional id for aria-labelledby on the container
 * className         | class merge on the outer container
 * ────────────────────────────────────────────────────────────────── */

const DEFAULT_ERROR_MESSAGES = {
  user_cancelled: "Passkey request cancelled. Tap the button to try again.",
  not_supported:
    "Your browser or device doesn't support passkeys. Use the email and password option below.",
  network_error: "Couldn't reach the server. Check your connection and try again.",
  unknown:
    "Passkey sign-in didn't complete. Try again or use the email and password option below.",
};

function categoriseError(error) {
  if (!error) return 'unknown';
  const name = error.name || '';
  const rawMessage = String(error.message || '');
  const message = rawMessage.toLowerCase();

  // Consumer-thrown precise categories
  if (['user_cancelled', 'not_supported', 'network_error'].includes(rawMessage)) {
    return rawMessage;
  }

  if (name === 'NotAllowedError' || name === 'AbortError') return 'user_cancelled';
  if (name === 'NotSupportedError' || name === 'SecurityError') return 'not_supported';
  if (message.includes('not support')) return 'not_supported';
  if (message.includes('network') || (name === 'TypeError' && message.includes('fetch'))) {
    return 'network_error';
  }

  return 'unknown';
}

export function PasskeyPrompt({
  onRequest,
  label = 'Sign in with passkey',
  pendingLabel = 'Waiting for passkey',
  successLabel = 'Signed in',
  idleDescription,
  autoRequest = false,
  onSuccess,
  onError,
  errorMessages,
  showFallbackLink = true,
  onFallbackClick,
  successAutoResetMs = null,
  tone = 'obsidian',
  ariaLabelledBy,
  className,
}) {
  const [state, setState] = useState('idle');
  const [errorCategory, setErrorCategory] = useState(null);
  const lastRequestRef = useRef(null);
  const resetTimerRef = useRef(null);

  const errors = { ...DEFAULT_ERROR_MESSAGES, ...(errorMessages || {}) };

  const request = useCallback(async () => {
    if (state === 'requesting') return;
    if (!onRequest) return;

    setState('requesting');
    setErrorCategory(null);

    try {
      const result = await onRequest();
      setState('success');
      onSuccess?.(result);

      if (successAutoResetMs != null) {
        if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
        resetTimerRef.current = setTimeout(() => setState('idle'), successAutoResetMs);
      }
    } catch (err) {
      const category = categoriseError(err);
      setErrorCategory(category);
      setState('error');
      onError?.(err, category);
    }
  }, [state, onRequest, onSuccess, onError, successAutoResetMs]);

  lastRequestRef.current = request;

  useEffect(() => {
    if (autoRequest) {
      lastRequestRef.current?.();
    }
    // Run once on mount only when autoRequest is true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  const containerClasses = [
    styles.container,
    styles[`tone-${tone}`],
    styles[`state-${state}`],
    className,
  ].filter(Boolean).join(' ');

  const errorMessage = errorCategory ? errors[errorCategory] : null;
  const isRecoverableError = errorCategory !== 'not_supported';

  return (
    <div
      className={containerClasses}
      aria-labelledby={ariaLabelledBy}
      aria-live="polite"
    >
      {/* ── Idle ── */}
      {state === 'idle' && (
        <>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={request}
            aria-label={label}
          >
            <IconLock size={18} />
            <span>{label}</span>
          </button>
          {idleDescription && (
            <p className={styles.helper}>{idleDescription}</p>
          )}
        </>
      )}

      {/* ── Requesting ── */}
      {state === 'requesting' && (
        <>
          <div className={styles.primaryButton} aria-busy="true" aria-disabled="true">
            <span className={styles.spinner} aria-hidden="true" />
            <span>{pendingLabel}</span>
          </div>
          <p className={styles.helper}>
            Follow the system prompt. Don't close this window.
          </p>
        </>
      )}

      {/* ── Success ── */}
      {state === 'success' && (
        <div
          className={`${styles.primaryButton} ${styles.successSurface}`}
          role="status"
          aria-label={successLabel}
        >
          <IconCheck size={18} />
          <span>{successLabel}</span>
        </div>
      )}

      {/* ── Error ── */}
      {state === 'error' && (
        <>
          <div
            className={styles.errorPanel}
            role="alert"
          >
            <span className={styles.errorIcon} aria-hidden="true">
              <IconAlert size={18} />
            </span>
            <div className={styles.errorBody}>
              <div className={styles.errorTitle}>
                {errorCategory === 'not_supported' ? 'Passkey not available' : 'Passkey sign-in failed'}
              </div>
              <div className={styles.errorMessage}>{errorMessage}</div>
            </div>
          </div>

          {isRecoverableError && (
            <button
              type="button"
              className={styles.primaryButton}
              onClick={request}
            >
              <IconLock size={18} />
              <span>Try again</span>
            </button>
          )}
        </>
      )}

      {/* ── Fallback link (visible when consumer provides handler) ── */}
      {showFallbackLink && onFallbackClick && (
        <button
          type="button"
          className={styles.fallbackLink}
          onClick={onFallbackClick}
        >
          Use email and password instead
        </button>
      )}
    </div>
  );
}

// Exported for consumer unit tests + harness demos
export { categoriseError };
