import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SessionContext } from './SessionContext';
import {
  fetchCheckoutSession,
  CheckoutSessionError,
} from '@lib/checkoutSessionClient';
import { CheckoutShell } from '@components/layout/checkout/CheckoutShell';
import { CheckoutLoading } from '@components/ui/checkout/CheckoutLoading';

/* ──────────────────────────────────────────────────────────────────
 * ApiSessionProvider
 *
 * PHASE_7F_S5_CHECKOUT_API
 *
 * The real checkout session provider. Resolves a session by its URL
 * token from GET /v1/checkout/session/:id, polls while pending, and
 * publishes the SAME SessionContext shape MockSessionProvider does |
 * so every checkout page and component consumes it byte-identically.
 *
 * Why a separate file from MockSessionProvider (not folded like
 * MockAdminProvider's api/local branches)
 * --------------------------------------------------------------
 * Admin's mock and API share a data-mutation surface | both call the
 * same action functions. Checkout's mock mutators (mockConfirmPayment,
 * mockSelectAmount, ...) have NO API equivalent | confirmation comes
 * from a Monnify webhook, not a button; the amount is set by the
 * platform at init, not chosen here. Folding the two would be one
 * file with two minds. The SessionContext IS the seam: two providers
 * satisfy it, the router picks one, consumers never branch.
 *
 * MockSessionProvider stays the untouched ?checkout dev escape.
 *
 * Status translation (normalize, below)
 * -------------------------------------
 *   backend            -> SessionContext / SessionResolver
 *   pending            -> pending
 *   confirmed          -> completed
 *   expired            -> expired
 *   failed             -> failed        (amount mismatch | PaymentIssuePage)
 *   country_not_active -> country_not_active
 *   404 (no row)       -> invalid
 * The backend has no 'processing' and no select mode.
 *
 * Polling
 * -------
 *   - One GET on mount, then every 3s while status is 'pending'
 *     (the route's own header prescribes 3s).
 *   - Stops on any terminal status or a 404.
 *   - Skips ticks while the tab is hidden (the user is in their
 *     bank app); re-polls immediately on focus.
 *   - A network / 5xx blip is TRANSIENT | last-known state is kept
 *     and the next tick retries. A blip never flips to an error
 *     screen.
 *   - Hard stop: if a session is still pending well past expires_at
 *     (a stalled expiry cron), it is treated as expired client-side
 *     so the user is never stranded on a dead pending screen.
 * ────────────────────────────────────────────────────────────────── */

/* The reserved-account name. Monnify's reserved account is created
 * with this exact name by the backend (modules/monnify/client.js,
 * createReservedAccount: accountName). The public GET does not echo
 * it, so we mirror the known constant here. If the reserved-account
 * name ever changes it changes in BOTH places | see the S5 handoff
 * "tracked follow-ups". */
const REMVO_ACCOUNT_NAME = 'Remvo';

/* Poll cadence while pending. Matches the route header in
 * modules/sessions/routes.js. */
const POLL_INTERVAL_MS = 3000;

/* If a session is still 'pending' this long past expires_at, the
 * expiry cron has not run (it should within ~30s). Rather than poll
 * forever, surface expiry client-side. 90s = 60s cron grace + slack. */
const POLL_HARD_STOP_AFTER_EXPIRY_MS = 90_000;

/* Country-code -> display name for the country_not_active branch.
 * The public GET returns only country_code; CountryComingSoonPage
 * needs a human name. Covers the corridors Remvo deals with; an
 * unknown code falls back to a neutral phrase. */
const COUNTRY_NAMES = {
  NG: 'Nigeria',
  GH: 'Ghana',
  KE: 'Kenya',
  UG: 'Uganda',
  TZ: 'Tanzania',
  ZA: 'South Africa',
  EG: 'Egypt',
  CI: "Cote d'Ivoire",
};

/* Terminal statuses | once reached, polling stops. */
const TERMINAL_STATUSES = new Set([
  'completed',
  'expired',
  'failed',
  'country_not_active',
  'invalid',
]);

/**
 * Map the raw backend session snapshot into the field shape every
 * checkout page already consumes (the shape MockSessionProvider
 * produces). This is the single translation point | downstream code
 * never sees backend vocabulary.
 *
 * @param {object} raw   the backend GET /v1/checkout/session/:id body
 * @param {{ confirmedInSession: boolean }} opts
 * @returns {object}  the SessionContext-shaped session
 */
function normalize(raw, opts) {
  // ── country_not_active branch | money fields stripped ──────────
  if (raw.status === 'country_not_active') {
    const code = raw.country_code || null;
    return {
      session_id: raw.session_id,
      status: 'country_not_active',
      reason: raw.reason === 'paused' ? 'paused' : 'coming_soon',
      country: (code && COUNTRY_NAMES[code]) || 'your region',
      country_code: code,
      // PHASE_8_FIX_A | the public GET echoes notify_email_enabled
      // (sessions/routes.js, Batch 16). Default to false on absence
      // so a platform whose country_config has not set the flag
      // never sees a waitlist form whose POST has no backing.
      notify_enabled: raw.notify_email_enabled === true,
      platform_id: raw.platform_id || null,
      platform_name: raw.platform_name || 'the platform',
      platform_logo_url: null,
      callback_url: raw.callback_url || null,
    };
  }

  // ── active / terminal money session ────────────────────────────
  // confirmed -> completed is the only status remap.
  const status = raw.status === 'confirmed' ? 'completed' : raw.status;
  const virtualAccount = raw.virtual_account || {};

  return {
    session_id: raw.session_id,
    status,
    // The backend has no select mode | the platform sets the amount
    // server-to-server at initialize. Always 'preset'. This keeps
    // ConfirmPage's "Change amount" link correctly hidden.
    checkout_mode: 'preset',
    platform_name: raw.platform_name || 'the platform',
    platform_logo_url: null,

    amount_usd_card: Number(raw.amount_usd),
    amount_usd_credited: Number(raw.amount_usd),
    user_pays_naira: Number(raw.amount_ngn),
    display_rate: Number(raw.rate_applied),

    bank_name: virtualAccount.bank_name || null,
    account_number: virtualAccount.account_number || null,
    account_name: REMVO_ACCOUNT_NAME,

    // The backend has ONE 15-minute window (expires_at). The mock's
    // separate payment_expires_at is fiction | alias it so the
    // PaymentPage countdown reads the real lock.
    expires_at: raw.expires_at,
    payment_expires_at: raw.expires_at,
    locked_at: null,

    reference: raw.public_reference,
    callback_url: raw.callback_url || null,
    country_code: raw.country_code || null,

    // completed_in_session distinguishes the celebratory CompletePage
    // (the user watched it confirm here) from AlreadyPaidPage (landed
    // on an already-confirmed session). True only when this tab
    // observed the pending -> confirmed transition.
    completed_in_session:
      status === 'completed' ? Boolean(opts.confirmedInSession) : false,
    confirmed_at: raw.confirmed_at || null,
  };
}

/**
 * The real checkout session provider.
 *
 * @param {{ token: string, children: React.ReactNode }} props
 */
export function ApiSessionProvider({ token, children }) {
  const [session, setSession] = useState(null);
  const [phase, setPhase] = useState('loading'); // 'loading' | 'ready'

  // Refs the poll loop reads without re-subscribing the effect.
  const tokenRef = useRef(token);
  tokenRef.current = token;

  const statusRef = useRef(null);
  statusRef.current = session ? session.status : null;

  const expiresRef = useRef(null);
  expiresRef.current = session ? session.expires_at : null;

  // Did this tab ever observe the session as 'pending'? Drives
  // completed_in_session | a pending->confirmed transition is a
  // CompletePage moment; a first-fetch-confirmed is AlreadyPaidPage.
  const sawPendingRef = useRef(false);

  /**
   * One fetch + normalize + apply. Returns the resulting status
   * string, or null when the fetch failed transiently (caller keeps
   * polling, no state change).
   */
  const refetch = useCallback(async () => {
    try {
      const raw = await fetchCheckoutSession(tokenRef.current);

      if (raw && raw.notFound) {
        setSession({
          session_id: tokenRef.current,
          status: 'invalid',
          platform_name: null,
          callback_url: null,
        });
        return 'invalid';
      }

      const next = normalize(raw, {
        confirmedInSession: sawPendingRef.current,
      });
      if (next.status === 'pending') sawPendingRef.current = true;
      setSession(next);
      return next.status;
    } catch (err) {
      // Transient (network / 5xx). Keep last-known state and let the
      // next poll tick retry. A 404 never reaches here | it resolves
      // above as notFound.
      if (!(err instanceof CheckoutSessionError) || err.status >= 500 || err.status === 0) {
        return null;
      }
      // A non-404 4xx is unexpected for this public read. Treat it
      // as transient too rather than guessing a terminal state.
      return null;
    }
  }, []);

  // ── Initial resolve | runs on mount and on a token change ───────
  useEffect(() => {
    let cancelled = false;
    sawPendingRef.current = false;
    setPhase('loading');
    setSession(null);

    (async () => {
      await refetch();
      if (!cancelled) setPhase('ready');
    })();

    return () => {
      cancelled = true;
    };
  }, [token, refetch]);

  // ── Poll while pending ──────────────────────────────────────────
  // Keyed on [phase, token] only | NOT on `session`. The loop is a
  // self-terminating recursive setTimeout that reads refs, so a
  // successful poll does not tear down and rebuild the effect.
  useEffect(() => {
    if (phase !== 'ready') return undefined;
    if (statusRef.current !== 'pending') return undefined;

    let cancelled = false;
    let timer = null;

    const schedule = () => {
      if (cancelled) return;
      timer = setTimeout(tick, POLL_INTERVAL_MS);
    };

    const tick = async () => {
      if (cancelled) return;

      // Skip the network call while the tab is hidden | the user is
      // in their bank app. The focus handler re-polls on return.
      if (typeof document !== 'undefined' && document.hidden) {
        schedule();
        return;
      }

      // Hard stop | session overdue and still pending. The expiry
      // cron has not run. Surface expiry rather than poll forever.
      const expiresAt = expiresRef.current;
      if (expiresAt) {
        const hardStopAt =
          new Date(expiresAt).getTime() + POLL_HARD_STOP_AFTER_EXPIRY_MS;
        if (Date.now() > hardStopAt) {
          setSession((prev) =>
            prev && prev.status === 'pending'
              ? { ...prev, status: 'expired' }
              : prev
          );
          return;
        }
      }

      const status = await refetch();
      if (cancelled) return;
      // null = transient failure | keep polling. Terminal = stop.
      if (status && TERMINAL_STATUSES.has(status)) return;
      schedule();
    };

    const onVisibility = () => {
      if (cancelled) return;
      if (typeof document !== 'undefined' && !document.hidden) {
        refetch();
      }
    };

    schedule();
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibility);
    }

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibility);
      }
    };
  }, [phase, token, refetch]);

  // ── Context value ───────────────────────────────────────────────
  // The mock mutators have no API equivalent | they are safe no-ops
  // here so checkout pages calling them never crash. The context
  // KEYS stay identical to MockSessionProvider so the seam holds.
  const noop = useCallback(() => {}, []);
  const refetchNow = useCallback(() => {
    refetch();
  }, [refetch]);

  const value = useMemo(
    () => ({
      session,
      // Confirmation is Monnify-driven | nothing to simulate.
      mockConfirmPayment: noop,
      // Countdown reaching zero nudges an immediate poll; the
      // backend 'expired' is authoritative.
      mockExpireSession: refetchNow,
      // Re-resolve from the backend.
      mockResetSession: refetchNow,
      // Single 15-minute window | nothing to start.
      startPaymentWindow: noop,
      // No select mode in the real flow.
      mockSelectAmount: noop,
      mockResetToSelectMode: noop,
    }),
    [session, noop, refetchNow]
  );

  // While the first resolve is in flight, render a branded skeleton
  // inside the shell | not a blank flash, not InvalidPage. Children
  // (the resolved page) mount only once phase is 'ready'.
  if (phase === 'loading') {
    return (
      <SessionContext.Provider value={value}>
        <CheckoutShell canvas="obsidian">
          <CheckoutLoading />
        </CheckoutShell>
      </SessionContext.Provider>
    );
  }

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}
