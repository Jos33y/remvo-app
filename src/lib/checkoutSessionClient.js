/* ──────────────────────────────────────────────────────────────────
 * src/lib/checkoutSessionClient.js
 *
 * PHASE_7F_S5_CHECKOUT_API
 *
 * The fetch surface for GET /v1/checkout/session/:id | the public,
 * no-auth endpoint that resolves a checkout session by its token.
 *
 * Why this is separate from authClient.js and checkoutEventsClient.js
 * ------------------------------------------------------------------
 *   - authClient.js is the ADMIN auth surface | every call there
 *     sets credentials:'include' to flow the operator cookie and
 *     targets /v1/admin/*. Wrong domain, wrong cookie model.
 *   - checkoutEventsClient.js is fire-and-forget funnel telemetry
 *     (POST /v1/events). This is a read with a response the UI
 *     depends on | a different concern.
 *   A dedicated client keeps each seam single-purpose. Same pattern
 *   the codebase already follows.
 *
 * Contract (matches src/modules/sessions/routes.js GET handler)
 * -------------------------------------------------------------
 *   GET /v1/checkout/session/:id        | no auth, no cookie
 *   200  -> the session snapshot (active or country_not_active shape)
 *   404  -> unknown / malformed token
 *
 * The id IS the capability | 144 bits of entropy, unguessable. No
 * credentials are sent. The route is public and cookie-free.
 *
 * Failure policy
 * --------------
 *   404            -> resolved as { notFound: true }. The caller maps
 *                     this to an 'invalid' session | a definite,
 *                     terminal answer.
 *   network / 5xx  -> throw CheckoutSessionError. The caller treats a
 *                     throw as TRANSIENT | it holds last-known state
 *                     and retries on the next poll tick. A blip must
 *                     never flip a live checkout to an error screen.
 *
 * No React, no hooks | a pure async function.
 * ────────────────────────────────────────────────────────────────── */

const API_BASE =
  import.meta.env.VITE_REMVO_API_BASE || 'http://localhost:8080';

/**
 * Discriminated error for session-read failures. The caller branches
 * on `.status` (0 = network, >=500 = server) to decide retry.
 */
export class CheckoutSessionError extends Error {
  /**
   * @param {string} code     server-supplied or 'network_error'
   * @param {number} status   HTTP status (0 for network failure)
   * @param {string} message  diagnostic message
   */
  constructor(code, status, message) {
    super(message);
    this.name = 'CheckoutSessionError';
    this.code = code;
    this.status = status;
  }
}

/**
 * Resolve a checkout session by token.
 *
 * @param {string} token  the cs_<24> session id from the URL
 * @returns {Promise<object>}  the raw backend session snapshot, OR
 *                             { notFound: true } on a 404
 * @throws {CheckoutSessionError}  on network failure or a non-404
 *                                 error status (caller retries)
 */
export async function fetchCheckoutSession(token) {
  let response;
  try {
    response = await fetch(
      `${API_BASE}/v1/checkout/session/${encodeURIComponent(token)}`,
      {
        method: 'GET',
        // No credentials | the endpoint is public and cookie-free.
        headers: { Accept: 'application/json' },
      }
    );
  } catch (err) {
    // TypeError from fetch | offline, DNS, CORS preflight refusal.
    throw new CheckoutSessionError(
      'network_error',
      0,
      'Network request failed'
    );
  }

  // 404 is a definite answer, not an error to retry | the token is
  // unknown or malformed. Resolve it so the provider can route to
  // the invalid state.
  if (response.status === 404) {
    return { notFound: true };
  }

  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const code = body && body.error && body.error.code
      ? body.error.code
      : 'request_failed';
    const message = body && body.error && body.error.message
      ? body.error.message
      : `Session request failed (${response.status})`;
    throw new CheckoutSessionError(code, response.status, message);
  }

  return body;
}
