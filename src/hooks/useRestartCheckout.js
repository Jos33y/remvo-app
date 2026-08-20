import { useCallback, useState } from 'react';
import { restartCheckoutSession } from '@lib/checkoutSessionClient';

/* ──────────────────────────────────────────────────────────────────
 * useRestartCheckout
 *
 * Shared restart behaviour for every terminal checkout surface:
 * ExpiredPage, PaymentIssuePage, and PaymentPage's windowClosed
 * state. One hook so all three behave identically | a user who hits
 * the cap on one page must not see a different story on another.
 *
 * On success it does a FULL PAGE navigation to the new checkout_url
 * rather than a router push. The session provider keys on the token
 * and only remounts when the token changes, so a client-side route
 * change to a different cs_ id inside the same tree is a state
 * transition the provider was never designed for. A hard navigation
 * gives the new session a clean mount, a clean poll, and a clean
 * event stream. It costs one page load on a screen the user was
 * already stuck on.
 *
 * Error handling is deliberately plain. The three terminal states the
 * backend can return | not restartable, window expired, limit reached
 * | are all permanent for this token, so there is nothing to retry
 * and the only useful action is going back to the platform. Anything
 * else is treated as transient and the user can press again.
 *
 * @param {string|null} sessionId
 * @returns {{
 *   restart: () => Promise<void>,
 *   pending: boolean,
 *   error: string | null,
 *   exhausted: boolean,
 * }}
 */

/* Codes that mean this token can never be restarted. Mirrors
 * ErrorCodes in the API's errors/errorCodes.js. */
const TERMINAL_CODES = new Set([
  'session_not_restartable',
  'restart_window_expired',
  'restart_limit_reached',
  'session_not_found',
]);

export function useRestartCheckout(sessionId) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [exhausted, setExhausted] = useState(false);

  const restart = useCallback(async () => {
    if (!sessionId || pending || exhausted) return;

    setPending(true);
    setError(null);

    try {
      const result = await restartCheckoutSession(sessionId);

      if (result && result.checkout_url) {
        window.location.href = result.checkout_url;
        return;
      }

      /* A country paused since the original session was created. The
       * backend returns the coming-soon shape with a checkout_url
       * anyway, so this branch is defensive rather than expected. */
      setError('This purchase cannot be restarted right now.');
      setExhausted(true);
    } catch (err) {
      const code = err && err.code ? err.code : 'request_failed';

      if (TERMINAL_CODES.has(code)) {
        setExhausted(true);
        setError(
          err && err.message
            ? err.message
            : 'This purchase cannot be restarted.'
        );
      } else {
        setError('Could not start a new purchase. Try again.');
      }
    } finally {
      setPending(false);
    }
  }, [sessionId, pending, exhausted]);

  return { restart, pending, error, exhausted };
}
