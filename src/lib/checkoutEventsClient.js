/* ──────────────────────────────────────────────────────────────────
 * src/lib/checkoutEventsClient.js
 *
 * PHASE_7F_S4_CHECKOUT_EVENTS
 *
 * The fetch surface for POST /v1/events | the public, no-auth
 * funnel-telemetry endpoint the checkout pages fire into.
 *
 * Why this is separate from authClient.js
 * ---------------------------------------
 * authClient.js is the ADMIN auth surface: every call there sets
 * credentials:'include' to flow the operator session cookie, and
 * targets /v1/admin/*. The events endpoint is the opposite on every
 * axis | public, unauthenticated, fired from the checkout tree
 * (pay.remvo.app) which has no operator cookie and no admin context.
 * Folding it into authClient.js would mean a checkout-tree module
 * importing the admin auth client | wrong domain, wrong cookie
 * behaviour, wrong mental model. A dedicated 30-line client is the
 * correct seam.
 *
 * Contract (matches src/modules/events/routes.js eventBodySchema)
 * ---------------------------------------------------------------
 *   POST /v1/events
 *   body: { session_id, event_type, device?, metadata? }   .strict()
 *   -> 202 Accepted, no body. Fire-and-forget on the wire.
 *
 * The server resolves platform_id / corridor_id / country_code from
 * the session_id itself | the client MUST NOT send those (a client
 * could otherwise mislabel events and poison the funnel). This module
 * only ever sends the four permitted fields.
 *
 * Failure policy
 * --------------
 * Pure fire-and-forget. A dropped analytics event is monitored noise,
 * never a business outcome | the user has still paid, the platform
 * still got credited. We do not retry (retrying a 429 burns the
 * per-session throttle budget the server tuned assuming no retries;
 * retrying a network blip multiplies noise). We do not surface
 * anything to the UI. In dev we console.warn so a debugging session
 * has a paper trail; in prod we swallow silently (a noisy production
 * console is its own UX bug).
 *
 * No React, no hooks | a pure async function, importable anywhere.
 * ────────────────────────────────────────────────────────────────── */

const API_BASE =
  import.meta.env.VITE_REMVO_API_BASE || 'http://localhost:8080';

/* The events route validates session_id against this exact shape.
 * Sending anything else gets a 400 | we pre-filter so a mock/dev
 * token (e.g. ?checkout with a non-conforming token) never even
 * leaves the browser. Real sessions from /v1/checkout/initialize
 * always conform. */
const SESSION_ID_RE = /^cs_[A-Za-z0-9_-]{24}$/;

/* The nine client-emittable event types. Kept here as a frozen set
 * so a typo in a caller fails fast in dev rather than producing a
 * silent 400 from the server. Mirrors CLIENT_EMITTABLE in the API's
 * events/service.js.
 *
 * DEAD SINCE 20 AUGUST 2026: confirm.view and confirm.proceed.
 * ConfirmPage was deleted when the two checkout screens merged
 * (CONVERSION_CHECKLIST.md section C) and nothing emits them now.
 *
 * They stay in this set deliberately. The server's CLIENT_EMITTABLE
 * still lists them, historical rows exist, and removing them here
 * would make replaying or backfilling old sessions fail validation
 * on the client before the request left the browser.
 *
 * MEASUREMENT WARNING: the funnel's step 3 -> step 4 drop was 33.3%
 * before the merge and auto-qualifies to 100% after it, because the
 * step it measured no longer exists. That is an artefact, not an
 * improvement. Any before/after comparison must treat 20 August as a
 * boundary rather than reading straight across it. */
export const CHECKOUT_EVENTS = Object.freeze({
  CHECKOUT_OPEN: 'checkout.open',
  SELECT_VIEW: 'select.view',
  SELECT_AMOUNT: 'select.amount',
  CONFIRM_VIEW: 'confirm.view',
  CONFIRM_PROCEED: 'confirm.proceed',
  PAYMENT_VIEW: 'payment.view',
  PAYMENT_COPY: 'payment.copy',
  PAYMENT_WAITING: 'payment.waiting',
  COMPLETE_VIEW: 'complete.view',
});

const EMITTABLE = Object.freeze(new Set(Object.values(CHECKOUT_EVENTS)));

/**
 * Classify the current device into mobile / desktop / tablet.
 *
 * Prefers the modern userAgentData.mobile signal when present
 * (Chromium); falls back to a userAgent regex that mirrors the
 * server's classifyDevice() so labels are consistent whichever
 * side resolves them.
 *
 * @returns {'mobile'|'desktop'|'tablet'}
 */
function classifyDevice() {
  if (typeof navigator === 'undefined') return 'desktop';

  const ua = (navigator.userAgent || '').toLowerCase();

  /* Tablet check first | iPads and Android tablets also match the
   * mobile token set, so order matters. */
  if (/ipad|tablet/.test(ua)) return 'tablet';
  if (/mobi|android|iphone|ipod/.test(ua)) return 'mobile';

  /* userAgentData is the modern hint. Only trust it to upgrade a
   * desktop guess to mobile | it has no tablet signal. */
  if (navigator.userAgentData && navigator.userAgentData.mobile === true) {
    return 'mobile';
  }

  return 'desktop';
}

/**
 * Fire a single checkout funnel event. Fire-and-forget: resolves to
 * a boolean for testability but callers are expected to ignore it.
 *
 * Never throws. Never retries. Never blocks the UI.
 *
 * @param {object} input
 * @param {string} input.sessionId    cs_ + 24 url-safe chars
 * @param {string} input.eventType    one of CHECKOUT_EVENTS values
 * @param {object} [input.metadata]   optional, < 4KB serialised
 * @returns {Promise<boolean>}  true if the server accepted (202)
 */
export async function postCheckoutEvent({ sessionId, eventType, metadata }) {
  /* Guard 1: session id shape. A non-conforming token (mock/dev)
   * is filtered here | no network call, no console noise. This is
   * expected behaviour in ?checkout dev mode and is not an error. */
  if (typeof sessionId !== 'string' || !SESSION_ID_RE.test(sessionId)) {
    return false;
  }

  /* Guard 2: event vocabulary. A bad event_type is a programming
   * error | fail loud in dev, swallow in prod. */
  if (!EMITTABLE.has(eventType)) {
    if (import.meta.env.DEV) {
      console.warn('[checkout-event] unknown event_type, not sent:', eventType);
    }
    return false;
  }

  /* client_ts lets analysts correlate the browser clock against the
   * server receive time | the server reads metadata.client_ts. */
  const body = {
    session_id: sessionId,
    event_type: eventType,
    device: classifyDevice(),
    metadata: {
      ...(metadata && typeof metadata === 'object' ? metadata : {}),
      client_ts: Date.now(),
    },
  };

  try {
    const response = await fetch(`${API_BASE}/v1/events`, {
      method: 'POST',
      /* No credentials | this is a public endpoint and the checkout
       * tree has no cookie to send. Omitting it also avoids a CORS
       * preflight credential requirement on the API side. */
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
      /* keepalive lets the request survive a page navigation | when
       * the user clicks "Pay" and we fire confirm.proceed, the
       * navigation must not cancel the in-flight beacon. */
      keepalive: true,
    });

    if (!response.ok) {
      if (import.meta.env.DEV) {
        console.warn(
          '[checkout-event] non-2xx, dropped:',
          eventType,
          response.status
        );
      }
      return false;
    }
    return true;
  } catch (err) {
    /* Network failure | offline, DNS, CORS. Swallow. */
    if (import.meta.env.DEV) {
      console.warn('[checkout-event] network error, dropped:', eventType, err?.message);
    }
    return false;
  }
}
