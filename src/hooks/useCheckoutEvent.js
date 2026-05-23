/* ──────────────────────────────────────────────────────────────────
 * src/hooks/useCheckoutEvent.js
 *
 * PHASE_7F_S4_CHECKOUT_EVENTS
 *
 * React seam over checkoutEventsClient. Two shapes, because the nine
 * funnel events split cleanly into two kinds:
 *
 *   View events  (checkout.open, select.view, confirm.view,
 *                 payment.view, complete.view, payment.waiting)
 *     | fire ONCE when the user reaches a step. "Reached" is keyed
 *       on the session_id first being observed, NOT on the React
 *       component mounting | mounts are an implementation artefact
 *       (StrictMode double-mounts, Suspense, error-boundary remounts,
 *       hot reload) and tying analytics to them makes analytics
 *       brittle. Use useCheckoutViewEvent for these.
 *
 *   Action events (select.amount, confirm.proceed, payment.copy)
 *     | fire in response to a user gesture (tap, click). Use the
 *       emit function from useCheckoutEmitter for these.
 *
 * One-shot guarantee
 * ------------------
 * A module-scoped Set keyed on `${sessionId}|${eventType}` ensures a
 * view event fires exactly once per (session, event) pair for the
 * lifetime of the page | across remounts, StrictMode's double effect
 * invocation, route re-entry (back button to a step), and hot reload.
 * The Set is module scope, not component state, so it survives the
 * component unmounting and remounting.
 *
 * The Set is intentionally NOT cleared. A checkout session is short
 * lived (15-minute lock) and a single browser tab walks one session;
 * the Set holds at most ~9 entries per session and a handful of
 * sessions per tab lifetime. Memory cost is nil. Clearing it would
 * risk re-firing on a genuine revisit, which is the bug we are
 * preventing.
 *
 * Failure handling lives entirely in checkoutEventsClient | this
 * hook never sees or surfaces an error. Fire-and-forget.
 * ────────────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useRef } from 'react';
import { postCheckoutEvent } from '@lib/checkoutEventsClient';

/* Module-scoped dedup ledger. Survives component unmount/remount. */
const firedViewEvents = new Set();

function viewKey(sessionId, eventType) {
  return `${sessionId}|${eventType}`;
}

/**
 * Fire a one-shot VIEW event when the session id is first available.
 *
 * Safe to call unconditionally at the top of a page component. If
 * sessionId is null/undefined (session still loading) nothing fires;
 * the effect re-runs when the id resolves and fires exactly once.
 *
 * @param {string} eventType   one of the view event types
 * @param {string|null|undefined} sessionId   from useSession().session.session_id
 * @param {object} [metadata]  optional metadata; captured once at fire time
 *
 * @example
 *   const { session } = useSession();
 *   useCheckoutViewEvent(CHECKOUT_EVENTS.SELECT_VIEW, session?.session_id);
 */
export function useCheckoutViewEvent(eventType, sessionId, metadata) {
  /* Keep the latest metadata in a ref so the effect dep array stays
   * [eventType, sessionId] | we don't want a new metadata object
   * identity each render to retrigger the effect. The event fires
   * once anyway; we just want whatever metadata was current then. */
  const metadataRef = useRef(metadata);
  metadataRef.current = metadata;

  useEffect(() => {
    if (!sessionId) return;

    const key = viewKey(sessionId, eventType);
    if (firedViewEvents.has(key)) return;

    /* Mark BEFORE the await. If two effect invocations race (Strict
     * Mode), the second sees the key already set and bails. The mark
     * is synchronous; the network call is not. */
    firedViewEvents.add(key);

    /* Fire-and-forget. No await, no .then chain that matters. */
    postCheckoutEvent({
      sessionId,
      eventType,
      metadata: metadataRef.current,
    });
  }, [eventType, sessionId]);
}

/**
 * Returns an imperative emitter for ACTION events (user gestures).
 *
 * The returned function is stable (useCallback) so it is safe to use
 * in dependency arrays or pass to memoised children.
 *
 * Action events are NOT deduplicated | a user can legitimately tap a
 * denomination three times, and each tap is a real select.amount
 * event. Dedup is a view-event concern only.
 *
 * @param {string|null|undefined} sessionId
 * @returns {(eventType: string, metadata?: object) => void}
 *
 * @example
 *   const emit = useCheckoutEmitter(session?.session_id);
 *   // in a click handler:
 *   emit(CHECKOUT_EVENTS.SELECT_AMOUNT, { amount_usd: 50 });
 */
export function useCheckoutEmitter(sessionId) {
  return useCallback(
    (eventType, metadata) => {
      /* checkoutEventsClient guards the session id shape itself, so
       * passing a null/mock id here is harmless | it no-ops. */
      postCheckoutEvent({ sessionId, eventType, metadata });
    },
    [sessionId]
  );
}
