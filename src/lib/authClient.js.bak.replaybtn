/* ──────────────────────────────────────────────────────────────────
 * src/lib/authClient.js
 *
 * The single fetch surface for /v1/admin/auth/*. Every auth network
 * call in the frontend goes through this module. Three reasons:
 *
 *   1. credentials: 'include' is set ONCE here. Forgetting it on a
 *      single fetch would silently drop the session cookie on that
 *      call only — a hard-to-spot bug. Centralising removes the
 *      whole class of error.
 *
 *   2. Error envelope normalisation. The API returns
 *      { error: { code, message, details? } } on every 4xx/5xx. We
 *      throw a single AuthApiError class with `.code` and `.status`
 *      so consumers branch on `err.code === 'unauthorized'` rather
 *      than parsing JSON in every catch.
 *
 *   3. Base URL resolution. VITE_REMVO_API_BASE in dev points to
 *      http://localhost:8080; in prod the admin frontend is hosted
 *      separately from the API and the env var holds the cross-
 *      origin URL. Resolved once.
 *
 * No React, no hooks, no JSX | pure functions over fetch. Importable
 * from contexts, pages, or tests without a render cycle.
 *
 * Related docs:
 *   SECTION_1_AUTH_BUILD_BRIEF.md §03 frontend
 *   src/modules/auth/routes.js (the routes we're calling)
 * ────────────────────────────────────────────────────────────────── */

const API_BASE =
  import.meta.env.VITE_REMVO_API_BASE || 'http://localhost:8080';

/**
 * Discriminated error class for auth API failures. Consumers pattern-
 * match on `.code` or `.status` to render the right message.
 *
 * @example
 *   try { await login(...) }
 *   catch (e) {
 *     if (e instanceof AuthApiError && e.status === 401) ...
 *   }
 */
export class AuthApiError extends Error {
  /**
   * @param {string} code     server-supplied or 'network_error' / 'unknown'
   * @param {number} status   HTTP status (0 for network failure)
   * @param {string} message  user-safe message
   * @param {object} [details]
   */
  constructor(code, status, message, details) {
    super(message);
    this.name = 'AuthApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

/**
 * Single private fetch helper. Every export funnels through here so
 * cookie handling, JSON parsing, and error shape stay uniform.
 *
 * @template T
 * @param {string} path                 path under /v1/admin/auth or /v1
 * @param {object} [options]
 * @param {'GET'|'POST'} [options.method]
 * @param {object} [options.body]       JSON-serialised when present
 * @returns {Promise<T>}
 */
async function request(path, { method = 'GET', body } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      // The whole point: send and receive cookies on cross-origin
      // requests so the session cookie flows. The API's CORS config
      // must list the admin origin in Access-Control-Allow-Origin
      // (with credentials) for this to work.
      credentials: 'include',
      headers: body
        ? { 'Content-Type': 'application/json', Accept: 'application/json' }
        : { Accept: 'application/json' },
      body: body != null ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    // TypeError on fetch | DNS, offline, CORS preflight refusal, etc.
    throw new AuthApiError(
      'network_error',
      0,
      err?.message || 'Could not reach the server'
    );
  }

  // Handle no-content success (logout returns 200 with no body too,
  // but we tolerate empty responses for any successful call).
  const text = await response.text();
  /** @type {any} */
  let payload = null;
  if (text.length > 0) {
    try {
      payload = JSON.parse(text);
    } catch {
      // Server returned non-JSON. Surface as a generic error rather
      // than blowing up the caller with a SyntaxError.
      throw new AuthApiError(
        'unknown',
        response.status,
        'Server returned an unexpected response'
      );
    }
  }

  if (!response.ok) {
    const env = payload?.error;
    throw new AuthApiError(
      env?.code || 'unknown',
      response.status,
      env?.message || 'Request failed',
      env?.details
    );
  }

  return /** @type {T} */ (payload);
}

// ══════════════════════════════════════════════════════════════════
//  Identity
// ══════════════════════════════════════════════════════════════════

/**
 * GET /v1/admin/auth/me. Returns the current operator + session metadata.
 * Used by ApiAdminProvider on mount AND on every 5-minute refresh poll.
 *
 * @returns {Promise<{
 *   operator: { id: string, email: string, displayName: string, role: 'owner'|'operator' },
 *   session: { created_at: string, expires_at: string, last_seen_at: string }
 * }>}
 */
export function fetchMe() {
  return request('/v1/admin/auth/me');
}

// ══════════════════════════════════════════════════════════════════
//  Password login
// ══════════════════════════════════════════════════════════════════

/**
 * POST /v1/admin/auth/login/password. Three-factor sign-in: email +
 * password + TOTP. On success the server sets the session cookie via
 * Set-Cookie; the browser stores it; subsequent fetches include it
 * because we configured credentials: 'include' globally.
 *
 * @param {{ email: string, password: string, totp: string }} credentials
 * @returns {Promise<{ operator: { id: string, email: string, displayName: string, role: 'owner'|'operator' } }>}
 */
export function loginWithPassword(credentials) {
  return request('/v1/admin/auth/login/password', {
    method: 'POST',
    body: credentials,
  });
}

// ══════════════════════════════════════════════════════════════════
//  Passkey login
// ══════════════════════════════════════════════════════════════════

/**
 * POST /v1/admin/auth/login/passkey/start. Issues a WebAuthn challenge
 * + the operator's allowCredentials list. Per brief §02.5 line 187 an
 * unknown email STILL gets a real challenge — frontend cannot infer
 * account existence from a 200/404.
 *
 * @param {{ email: string }} input
 * @returns {Promise<{
 *   options: PublicKeyCredentialRequestOptionsJSON,
 *   nonce: string
 * }>}
 */
export function passkeyLoginStart(input) {
  return request('/v1/admin/auth/login/passkey/start', {
    method: 'POST',
    body: input,
  });
}

/**
 * POST /v1/admin/auth/login/passkey/finish. Submits the assertion
 * built by navigator.credentials.get() back to the server.
 *
 * @param {{ nonce: string, credential: any }} input
 * @returns {Promise<{ operator: { id: string, email: string, displayName: string, role: 'owner'|'operator' } }>}
 */
export function passkeyLoginFinish(input) {
  return request('/v1/admin/auth/login/passkey/finish', {
    method: 'POST',
    body: input,
  });
}

// ══════════════════════════════════════════════════════════════════
//  Logout
// ══════════════════════════════════════════════════════════════════

/**
 * POST /v1/admin/auth/logout. Server revokes the session and clears
 * the cookie. Even if this errors, the consumer should clear local
 * state | the cookie will eventually expire on its own.
 *
 * @returns {Promise<{ ok: true }>}
 */
export function logout() {
  return request('/v1/admin/auth/logout', { method: 'POST' });
}

// ══════════════════════════════════════════════════════════════════
//  Passkey enrolment (authenticated)
// ══════════════════════════════════════════════════════════════════

/**
 * POST /v1/admin/auth/passkeys/start. Issues a WebAuthn registration
 * challenge for the current operator (cookie-authenticated).
 *
 * @param {{ device_label?: string }} [input]
 * @returns {Promise<{
 *   options: PublicKeyCredentialCreationOptionsJSON,
 *   nonce: string
 * }>}
 */
export function passkeyEnrolStart(input = {}) {
  return request('/v1/admin/auth/passkeys/start', {
    method: 'POST',
    body: input,
  });
}

/**
 * POST /v1/admin/auth/passkeys/finish. Submits the attestation built
 * by navigator.credentials.create() back to the server. device_label
 * binds at finish-time so the user can label after the system prompt.
 *
 * @param {{ nonce: string, credential: any, device_label?: string }} input
 * @returns {Promise<{ id: string, deviceLabel: string|null, createdAt: string }>}
 */
export function passkeyEnrolFinish(input) {
  return request('/v1/admin/auth/passkeys/finish', {
    method: 'POST',
    body: input,
  });
}

// ══════════════════════════════════════════════════════════════════
//  TOTP (authenticated)
// ══════════════════════════════════════════════════════════════════

/**
 * POST /v1/admin/auth/totp/enrol. Generates a fresh secret + URI.
 * The secret is NOT persisted server-side until totpConfirm succeeds;
 * the client must hold it across the two calls.
 *
 * @returns {Promise<{ secret: string, uri: string }>}
 */
export function totpEnrolGenerate() {
  return request('/v1/admin/auth/totp/enrol', { method: 'POST' });
}

/**
 * POST /v1/admin/auth/totp/confirm. Verify the user typed the right
 * code, then persist the encrypted secret.
 *
 * @param {{ secret: string, code: string }} input
 * @returns {Promise<{ ok: true }>}
 */
export function totpEnrolConfirm(input) {
  return request('/v1/admin/auth/totp/confirm', {
    method: 'POST',
    body: input,
  });
}

// ══════════════════════════════════════════════════════════════════
//  Password set / change (authenticated)
// ══════════════════════════════════════════════════════════════════

/**
 * POST /v1/admin/auth/password.
 *
 * @param {{ current_password?: string, new_password: string, totp: string }} input
 * @returns {Promise<{ ok: true, action: 'auth.password_set'|'auth.password_changed' }>}
 */
export function setOrChangePassword(input) {
  return request('/v1/admin/auth/password', {
    method: 'POST',
    body: input,
  });
}

// ══════════════════════════════════════════════════════════════════
//  Invitation accept (PUBLIC)
// ══════════════════════════════════════════════════════════════════

/**
 * POST /v1/invitations/:token/accept. Public endpoint | no auth.
 * Atomically creates the operator row, marks invitation accepted,
 * AND issues a session cookie so the new operator lands logged-in.
 *
 * @param {{ token: string, display_name: string }} input
 * @returns {Promise<{ operator: { id: string, email: string, displayName: string, role: 'owner'|'operator' } }>}
 */
export function acceptInvitation({ token, display_name }) {
  return request(`/v1/invitations/${encodeURIComponent(token)}/accept`, {
    method: 'POST',
    body: { display_name },
  });
}

// ══════════════════════════════════════════════════════════════════
//  WebAuthn helpers
// ══════════════════════════════════════════════════════════════════

/**
 * Browser feature detection for WebAuthn. Used by LoginPage to switch
 * the default tab to "password" on browsers without passkey support.
 *
 * @returns {boolean}
 */
export function isWebAuthnSupported() {
  return (
    typeof window !== 'undefined' &&
    typeof window.PublicKeyCredential !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    typeof navigator.credentials !== 'undefined' &&
    typeof navigator.credentials.create === 'function' &&
    typeof navigator.credentials.get === 'function'
  );
}

// ══════════════════════════════════════════════════════════════════
//  Operators (admin Settings)
// ══════════════════════════════════════════════════════════════════

/**
 * GET /v1/admin/operators. Returns every operator | active and revoked.
 * Any operator can read this; mutations are owner-only.
 *
 * @returns {Promise<{ items: Array<{
 *   id: string, email: string, display_name: string,
 *   role: 'owner'|'operator', is_active: boolean,
 *   has_password: boolean, has_totp: boolean,
 *   last_login_at: string|null, created_at: string
 * }> }>}
 */
export function listOperators() {
  return request('/v1/admin/operators');
}

/**
 * GET /v1/admin/operators/invitations. Pending (non-accepted, non-revoked,
 * non-expired) invitations. Visible to any operator so they can chase
 * up invitees, but only owners can mutate.
 *
 * @returns {Promise<{ items: Array<{
 *   id: string, email: string, role: 'owner'|'operator',
 *   invited_by: string, expires_at: string, created_at: string
 * }> }>}
 */
export function listInvitations() {
  return request('/v1/admin/operators/invitations');
}

/**
 * POST /v1/admin/operators. Owner-only. Creates an invitation row
 * AND sends the invitation email via Resend; if the email fails to
 * send, the invitation is rolled back so we never have a "ghost"
 * invitation row that no one received.
 *
 * @param {{ email: string, role: 'owner'|'operator' }} input
 * @returns {Promise<{ id: string, email: string, role: 'owner'|'operator', expires_at: string }>}
 */
export function inviteOperator(input) {
  return request('/v1/admin/operators', {
    method: 'POST',
    body: input,
  });
}

/**
 * POST /v1/admin/operators/invitations/:id/revoke. Owner-only.
 * Marks invitation revoked; the link in the invitee's email becomes
 * a 400 on next use.
 *
 * @param {{ invitationId: string }} input
 * @returns {Promise<{ ok: true }>}
 */
export function revokeInvitation({ invitationId }) {
  return request(
    `/v1/admin/operators/invitations/${encodeURIComponent(invitationId)}/revoke`,
    { method: 'POST' }
  );
}

/**
 * POST /v1/admin/operators/:id/revoke. Owner-only. Marks operator
 * inactive AND revokes all their active sessions in one transaction.
 * Server-side guardrails:
 *   - cannot revoke yourself (use a second owner)
 *   - cannot revoke the last active owner
 *
 * @param {{ operatorId: string }} input
 * @returns {Promise<{ ok: true, sessions_revoked: number }>}
 */
export function revokeOperator({ operatorId }) {
  return request(`/v1/admin/operators/${encodeURIComponent(operatorId)}/revoke`, {
    method: 'POST',
  });
}

// ══════════════════════════════════════════════════════════════════
//  Passkeys (admin Settings)
// ══════════════════════════════════════════════════════════════════

/**
 * GET /v1/admin/auth/passkeys. Returns the current operator's
 * enrolled passkeys, newest first. Used by Settings > Passkeys.
 *
 * @returns {Promise<{ items: Array<{
 *   id: string, device_label: string|null,
 *   backed_up: boolean, last_used_at: string|null, created_at: string
 * }> }>}
 */
export function listPasskeys() {
  return request('/v1/admin/auth/passkeys');
}

/**
 * POST /v1/admin/auth/passkeys/:id/revoke. Removes a passkey from the
 * current operator's account. Server-side guardrail: cannot revoke
 * your only credential | the operator must keep at least one passkey
 * OR a password to retain access.
 *
 * @param {{ passkeyId: string }} input
 * @returns {Promise<{ ok: true }>}
 */
export function revokePasskey({ passkeyId }) {
  return request(
    `/v1/admin/auth/passkeys/${encodeURIComponent(passkeyId)}/revoke`,
    { method: 'POST' }
  );
}

// ══════════════════════════════════════════════════════════════════
//  Audit log (admin)
// ══════════════════════════════════════════════════════════════════

/**
 * GET /v1/admin/audit-log. Read-only listing of audit rows, joined
 * with operators so the UI can render display names without a
 * follow-up fetch. Cursor pagination on (occurred_at, id).
 *
 * Filters are all optional. Pass none to get the most recent 50 rows
 * across all actors and actions.
 *
 * @param {Object} [input]
 * @param {number} [input.limit]          1..500, default 50
 * @param {string} [input.action]         exact match
 * @param {string} [input.actorId]
 * @param {'operator'|'platform'|'system'|'merchant'} [input.actorType]
 * @param {string} [input.entityType]
 * @param {string} [input.search]         ILIKE across action / email / entity_id
 * @param {string} [input.fromDate]       ISO timestamp, inclusive
 * @param {string} [input.toDate]         ISO timestamp, exclusive
 * @param {{ occurred_at: string, id: string }} [input.before]
 * @returns {Promise<{
 *   items: Array<{
 *     id: string, occurred_at: string, action: string,
 *     actor_type: 'operator'|'platform'|'system'|'merchant',
 *     actor_id: string|null,
 *     actor_email: string|null, actor_display_name: string|null,
 *     entity_type: string, entity_id: string,
 *     before: object|null, after: object|null,
 *     metadata: object|null, request_id: string|null,
 *   }>,
 *   next_cursor: { occurred_at: string, id: string } | null
 * }>}
 */
export function listAuditLog(input = {}) {
  const params = new URLSearchParams();
  if (input.limit) params.set('limit', String(input.limit));
  if (input.action) params.set('action', input.action);
  if (input.actorId) params.set('actor_id', input.actorId);
  if (input.actorType) params.set('actor_type', input.actorType);
  if (input.entityType) params.set('entity_type', input.entityType);
  if (input.search) params.set('search', input.search);
  if (input.fromDate) params.set('from_date', input.fromDate);
  if (input.toDate) params.set('to_date', input.toDate);
  if (input.before) {
    params.set('before_occurred_at', input.before.occurred_at);
    params.set('before_id', input.before.id);
  }
  const qs = params.toString();
  return request(`/v1/admin/audit-log${qs ? `?${qs}` : ''}`);
}

/**
 * GET /v1/admin/audit-log/count. Total row count under the same
 * filters as listAuditLog (minus pagination). Drives the
 * "Showing 50 of 247" header and the export-too-many-rows guard.
 *
 * @param {Object} [input] | same filter shape as listAuditLog (no `limit` / `before`)
 * @returns {Promise<{ total: number }>}
 */
export function countAuditLog(input = {}) {
  const params = new URLSearchParams();
  if (input.action) params.set('action', input.action);
  if (input.actorId) params.set('actor_id', input.actorId);
  if (input.actorType) params.set('actor_type', input.actorType);
  if (input.entityType) params.set('entity_type', input.entityType);
  if (input.search) params.set('search', input.search);
  if (input.fromDate) params.set('from_date', input.fromDate);
  if (input.toDate) params.set('to_date', input.toDate);
  const qs = params.toString();
  return request(`/v1/admin/audit-log/count${qs ? `?${qs}` : ''}`);
}

/**
 * Build the URL for the CSV export endpoint, with the current
 * filters serialised as query params. We DON'T fetch this through
 * the request() helper | a CSV download wants the browser's native
 * download UX (Content-Disposition triggers Save dialog), which a
 * fetch+blob round-trip would defeat unless we carefully reconstruct
 * the filename. Easier to just open the URL.
 *
 * Caller is expected to do `window.location.href = url` or
 * `window.open(url)`. The session cookie rides along automatically.
 *
 * @param {Object} [input] | same filter shape as listAuditLog
 * @returns {string} absolute URL
 */
export function buildAuditLogCsvUrl(input = {}) {
  const params = new URLSearchParams();
  if (input.action) params.set('action', input.action);
  if (input.actorId) params.set('actor_id', input.actorId);
  if (input.actorType) params.set('actor_type', input.actorType);
  if (input.entityType) params.set('entity_type', input.entityType);
  if (input.search) params.set('search', input.search);
  if (input.fromDate) params.set('from_date', input.fromDate);
  if (input.toDate) params.set('to_date', input.toDate);
  const qs = params.toString();
  return `${API_BASE}/v1/admin/audit-log.csv${qs ? `?${qs}` : ''}`;
}

// ══════════════════════════════════════════════════════════════════
//  Dashboard (Section 2)
// ══════════════════════════════════════════════════════════════════

/**
 * GET /v1/admin/dashboard/overview. Single-aggregate cockpit data:
 * today's volume, pending settlement, corridor health, webhook
 * health (1h window). One round-trip; the dashboard polls this
 * every 30s while visible.
 *
 * @returns {Promise<{
 *   today: { volume_usd: number, count: number },
 *   pending_settlement: { total_usdt: number, transaction_count: number },
 *   corridors: { active: number, paused: number, maintenance: number, total: number },
 *   webhook_health_1h: {
 *     delivered: number, pending: number, failed: number,
 *     abandoned: number, total: number,
 *     success_rate_pct: number | null
 *   },
 *   fetched_at: string
 * }>}
 */
export function fetchDashboardOverview() {
  return request('/v1/admin/dashboard/overview');
}

/**
 * GET /v1/admin/wallet/balance. On-chain USDT + SOL balance of the
 * Remvo deposit hot wallet, plus the configured safety buffer. The
 * server caches the response for 30 seconds, so the dashboard's
 * polling interval translates into ~one Helius RPC pair per minute
 * regardless of how many operators are watching.
 *
 * Throws AuthApiError with code='wallet_not_configured' (status 503)
 * when the env var is unset, and code='wallet_balance_unavailable'
 * (status 503) when the RPC layer fails. Both states are recoverable
 * and the tile renders an inline retry hint.
 *
 * @returns {Promise<{
 *   address: string,
 *   network: 'solana',
 *   mint: string,
 *   balanceUsdt: number,
 *   balanceSol: number,
 *   lamports: number,
 *   thresholdUsdt: number,
 *   fetchedAt: string,
 * }>}
 */
export function fetchWalletBalance() {
  return request('/v1/admin/wallet/balance');
}

/**
 * GET /v1/admin/rates/current. The resolved buy rate plus
 * source-specific metadata so the dashboard tile can render
 * attribution without a follow-up fetch.
 *
 * The `manual_entry` block is populated when source='manual';
 * `coingecko` is populated when source='coingecko' or 'last_known'
 * (the fallback case where the buffer was applied to a coingecko
 * reading). At most one of the two is non-null.
 *
 * @param {{ fiat?: string, asset?: string }} [input]
 * @returns {Promise<{
 *   fiat: string,
 *   asset: string,
 *   buy_rate: string,
 *   display_rate: number,
 *   source: 'manual' | 'coingecko' | 'last_known',
 *   source_id: string | null,
 *   stale: boolean,
 *   resolved_at: string,
 *   manual_entry: {
 *     id: string, entered_at: string, entered_by: string | null,
 *     notes: string | null, expires_at: string,
 *   } | null,
 *   coingecko: {
 *     mid_rate: string, buffer_naira: number, fetched_at: string,
 *   } | null,
 * }>}
 */
export function fetchCurrentRate({ fiat = 'NGN', asset = 'USDT' } = {}) {
  const params = new URLSearchParams();
  if (fiat) params.set('fiat', fiat);
  if (asset) params.set('asset', asset);
  return request(`/v1/admin/rates/current?${params.toString()}`);
}

/**
 * GET /v1/admin/transactions?limit=N. Newest-first list of confirmed
 * transactions (cursor-paginated). The dashboard takes the top 5 for
 * its compact recent-activity panel.
 *
 * @param {{ limit?: number }} [input]
 * @returns {Promise<{
 *   items: Array<{
 *     id: string,
 *     session_id: string,
 *     platform_id: string,
 *     amount_usd_credited: string,
 *     amount_usd_settled: string,
 *     platform_fee_usd: string,
 *     amount_ngn: string,
 *     settlement_batch_id: string | null,
 *     settled_at: string | null,
 *     sol_tx_hash: string | null,
 *     confirmed_at: string,
 *     created_at: string,
 *   }>,
 *   next_cursor: string | null,
 *   limit: number,
 * }>}
 */
export function fetchRecentTransactions({ limit = 5 } = {}) {
  return request(`/v1/admin/transactions?limit=${encodeURIComponent(limit)}`);
}

// ══════════════════════════════════════════════════════════════════
//  Transactions list / detail / count / csv (Section 3)
// ══════════════════════════════════════════════════════════════════

/**
 * Build the query string for transactions list/count/csv. Shared so
 * the three endpoints always serialise the same filter shape and a
 * "Showing 50 of 247" header can never be 247 of one shape and 50
 * of another.
 *
 * @param {Object} input
 * @param {string} [input.platformId]
 * @param {'pending'|'settled'} [input.settlementStatus]
 * @param {string} [input.search]
 * @param {string} [input.fromDate]   ISO timestamp
 * @param {string} [input.toDate]     ISO timestamp
 * @returns {URLSearchParams}
 */
function buildTransactionsParams(input = {}) {
  const params = new URLSearchParams();
  if (input.platformId) params.set('platform_id', input.platformId);
  if (input.settlementStatus) params.set('settlement_status', input.settlementStatus);
  if (input.search) params.set('search', input.search);
  if (input.fromDate) params.set('from_date', input.fromDate);
  if (input.toDate) params.set('to_date', input.toDate);
  return params;
}

/**
 * GET /v1/admin/transactions. Cursor-paginated list, newest first.
 *
 * @param {Object} [input]
 * @param {number} [input.limit]               1..100, default 50
 * @param {string} [input.cursor]              base64url cursor from a prior response
 * @param {string} [input.platformId]
 * @param {'pending'|'settled'} [input.settlementStatus]
 * @param {string} [input.search]              ILIKE across reference / session_id / platform_user_id
 * @param {string} [input.fromDate]            ISO timestamp, inclusive
 * @param {string} [input.toDate]              ISO timestamp, exclusive
 * @returns {Promise<{
 *   items: Array<{
 *     id: string, session_id: string, public_reference: string,
 *     platform_id: string, platform_user_id: string, country_code: string,
 *     amount_usd_credited: string, amount_usd_settled: string,
 *     platform_fee_usd: string, amount_ngn: string,
 *     display_rate: number,
 *     settlement_batch_id: string|null, settled_at: string|null,
 *     sol_tx_hash: string|null,
 *     confirmed_at: string, created_at: string,
 *   }>,
 *   next_cursor: string | null,
 *   limit: number,
 * }>}
 */
export function fetchTransactions(input = {}) {
  const params = buildTransactionsParams(input);
  if (input.limit) params.set('limit', String(input.limit));
  if (input.cursor) params.set('cursor', input.cursor);
  const qs = params.toString();
  return request(`/v1/admin/transactions${qs ? `?${qs}` : ''}`);
}

/**
 * GET /v1/admin/transactions/count. Total under the same filters.
 * No cursor / limit.
 *
 * @param {Parameters<typeof buildTransactionsParams>[0]} [input]
 * @returns {Promise<{ total: number }>}
 */
export function countTransactions(input = {}) {
  const params = buildTransactionsParams(input);
  const qs = params.toString();
  return request(`/v1/admin/transactions/count${qs ? `?${qs}` : ''}`);
}

/**
 * Build the URL for the transactions CSV export. Caller does
 * `window.location.href = url` to trigger the browser's native
 * download (the server sets Content-Disposition: attachment).
 *
 * Same-site fetch | the session cookie rides along automatically.
 *
 * @param {Parameters<typeof buildTransactionsParams>[0]} [input]
 * @returns {string} absolute URL
 */
export function buildTransactionsCsvUrl(input = {}) {
  const params = buildTransactionsParams(input);
  const qs = params.toString();
  return `${API_BASE}/v1/admin/transactions.csv${qs ? `?${qs}` : ''}`;
}

/**
 * GET /v1/admin/transactions/:id. Detail: transaction row + nested
 * session row (for rate snapshot, virtual account, public reference).
 *
 * @param {string|number} id   bigserial id
 * @returns {Promise<{
 *   transaction: {
 *     id: string, session_id: string, platform_id: string,
 *     amount_usd_credited: string, amount_usd_settled: string,
 *     platform_fee_usd: string, amount_ngn: string,
 *     settlement_batch_id: string|null, settled_at: string|null,
 *     sol_tx_hash: string|null,
 *     confirmed_at: string, created_at: string,
 *   },
 *   session: object | null
 * }>}
 */
export function fetchTransactionDetail(id) {
  return request(`/v1/admin/transactions/${encodeURIComponent(String(id))}`);
}

// ══════════════════════════════════════════════════════════════════
//  Sessions list / detail / count / csv (Section 4)
// ══════════════════════════════════════════════════════════════════

/**
 * Build the query string for sessions list/count/csv. Shared so the
 * three endpoints always serialise the same filter shape. Without it,
 * "Showing N of M" can be wrong when one endpoint sees a filter the
 * others don't.
 *
 * @param {Object} input
 * @param {string} [input.status]               'pending' | 'confirmed' | 'expired' | 'failed' | 'country_not_active'
 * @param {string} [input.platformId]
 * @param {string} [input.countryCode]          two-letter ISO
 * @param {string} [input.search]               ILIKE across id, public_reference, platform_user_id, monnify_reference
 * @param {string} [input.fromDate]             ISO timestamp
 * @param {string} [input.toDate]               ISO timestamp
 * @returns {URLSearchParams}
 */
function buildSessionsParams(input = {}) {
  const params = new URLSearchParams();
  if (input.status) params.set('status', input.status);
  if (input.platformId) params.set('platform_id', input.platformId);
  if (input.countryCode) params.set('country_code', input.countryCode);
  if (input.search) params.set('search', input.search);
  if (input.fromDate) params.set('from_date', input.fromDate);
  if (input.toDate) params.set('to_date', input.toDate);
  return params;
}

/**
 * GET /v1/admin/sessions. Cursor-paginated, newest first.
 *
 * @param {Object} [input]
 * @param {number} [input.limit]                1..100, default 50
 * @param {string} [input.cursor]               base64url cursor
 * @param {string} [input.status]
 * @param {string} [input.platformId]
 * @param {string} [input.countryCode]
 * @param {string} [input.search]
 * @param {string} [input.fromDate]
 * @param {string} [input.toDate]
 * @returns {Promise<{
 *   items: Array<Object>,
 *   next_cursor: string | null,
 *   limit: number
 * }>}
 */
export function fetchSessions(input = {}) {
  const params = buildSessionsParams(input);
  if (input.limit) params.set('limit', String(input.limit));
  if (input.cursor) params.set('cursor', input.cursor);
  const qs = params.toString();
  return request(`/v1/admin/sessions${qs ? `?${qs}` : ''}`);
}

/**
 * GET /v1/admin/sessions/count. Total under the same filters.
 *
 * @param {Parameters<typeof buildSessionsParams>[0]} [input]
 * @returns {Promise<{ total: number }>}
 */
export function countSessions(input = {}) {
  const params = buildSessionsParams(input);
  const qs = params.toString();
  return request(`/v1/admin/sessions/count${qs ? `?${qs}` : ''}`);
}

/**
 * Build URL for the sessions CSV export. Caller does
 * `window.location.href = url` to trigger the download (the server
 * sets Content-Disposition: attachment).
 *
 * @param {Parameters<typeof buildSessionsParams>[0]} [input]
 * @returns {string}
 */
export function buildSessionsCsvUrl(input = {}) {
  const params = buildSessionsParams(input);
  const qs = params.toString();
  return `${API_BASE}/v1/admin/sessions.csv${qs ? `?${qs}` : ''}`;
}

/**
 * GET /v1/admin/sessions/:id. Returns:
 *   - session              full session row
 *   - transaction          if confirmed, the joined transaction row;
 *                          else null
 *   - webhook_deliveries   array of every delivery for this session
 *
 * @param {string} id   session id (cs_...)
 * @returns {Promise<{
 *   session: Object,
 *   transaction: Object | null,
 *   webhook_deliveries: Array<Object>
 * }>}
 */
export function fetchSessionDetail(id) {
  return request(`/v1/admin/sessions/${encodeURIComponent(String(id))}`);
}

// ══════════════════════════════════════════════════════════════════
//  Settlements (Section 5)
// ══════════════════════════════════════════════════════════════════

/**
 * GET /v1/admin/settlements/pending. The aggregate that powers the
 * dashboard's pending-settlement tile and the SettlementsPage's
 * pending card. Computed on every call (no cache); the hot path is
 * a single grouped query against the partial
 * idx_transactions_pending_settlement index.
 *
 * @returns {Promise<{
 *   total_usdt: number,
 *   transaction_count: number,
 *   per_platform: Array<{
 *     platform_id: string,
 *     platform_name: string,
 *     settlement_wallet: string|null,
 *     amount_usdt: number,
 *     transaction_count: number
 *   }>
 * }>}
 */
export function fetchSettlementsPending() {
  return request('/v1/admin/settlements/pending');
}

/**
 * GET /v1/admin/settlements. List of past + in-flight batches.
 *
 * @param {Object} [input]
 * @param {'sending'|'settled'|'failed'} [input.status]
 * @param {number} [input.limit]
 * @param {string} [input.cursor]
 */
export function fetchSettlements(input = {}) {
  const params = new URLSearchParams();
  if (input.status) params.set('status', input.status);
  if (input.limit) params.set('limit', String(input.limit));
  if (input.cursor) params.set('cursor', input.cursor);
  const qs = params.toString();
  return request(`/v1/admin/settlements${qs ? `?${qs}` : ''}`);
}

/**
 * GET /v1/admin/settlements/count.
 *
 * @param {Object} [input]
 * @param {string} [input.status]
 */
export function countSettlements(input = {}) {
  const params = new URLSearchParams();
  if (input.status) params.set('status', input.status);
  const qs = params.toString();
  return request(`/v1/admin/settlements/count${qs ? `?${qs}` : ''}`);
}

/**
 * GET /v1/admin/settlements/:id. Returns batch + claimed transactions.
 *
 * @param {string} id
 * @returns {Promise<{ batch: Object, transactions: Array<Object> }>}
 */
export function fetchSettlementDetail(id) {
  return request(`/v1/admin/settlements/${encodeURIComponent(String(id))}`);
}

/**
 * POST /v1/admin/settlements/trigger. The moment-of-truth call. Does
 * the entire pipeline server-side (pre-flight, claim, Solana send,
 * complete) and returns the final batch row. Long-running: up to
 * ~60s for a single-platform batch on Solana mainnet.
 *
 * Errors map to:
 *   400 settlement_no_pending                | nothing to settle
 *   400 settlement_platform_wallet_missing   | a platform has no wallet
 *   400 settlement_wallet_insufficient       | hot wallet too low
 *   409 settlement_in_progress               | another batch in flight
 *   503 settlement_solana_not_configured     | env vars missing
 *   500 settlement_solana_send_failed        | unexpected RPC error
 *
 * @returns {Promise<{ batch: Object }>}
 */
export function triggerSettlementBatch() {
  return request('/v1/admin/settlements/trigger', { method: 'POST' });
}

// ══════════════════════════════════════════════════════════════════
//  Rate engine | manual entry, history, sources (Section 6)
// ══════════════════════════════════════════════════════════════════

/**
 * POST /v1/admin/rates/manual. Submit a manual rate entry.
 *
 * @param {Object} input
 * @param {string} [input.fiat='NGN']
 * @param {string} [input.asset='USDT']
 * @param {number|string} input.buyRate
 * @param {number} [input.ttlMinutes=1440]   default 24h
 * @param {string} [input.notes]
 * @param {boolean} [input.confirmDeviation] set true to bypass +/-20% bound
 * @returns {Promise<{
 *   id: string, fiat: string, asset: string, buy_rate: string,
 *   entered_by: string|null, notes: string|null,
 *   entered_at: string, expires_at: string
 * }>}
 *
 * On 400 with code='manual_rate_deviation', the operator is asked to
 * confirm; resubmit with confirmDeviation=true. Other 4xx errors
 * surface as AuthApiError to the caller.
 */
export function setManualRate(input) {
  const body = {
    fiat: input.fiat || 'NGN',
    asset: input.asset || 'USDT',
    buy_rate: input.buyRate,
    ttl_minutes: input.ttlMinutes ?? 24 * 60,
  };
  if (input.notes) body.notes = input.notes;
  if (input.confirmDeviation) body.confirm_deviation = true;
  return request('/v1/admin/rates/manual', {
    method: 'POST',
    body,
  });
}

/**
 * GET /v1/admin/rates/manual/history. Recent manual entries newest
 * first. Each row carries `is_expired` for UI colouring.
 *
 * @param {Object} [input]
 * @param {string} [input.fiat='NGN']
 * @param {string} [input.asset='USDT']
 * @param {number} [input.limit=50]
 */
export function fetchManualHistory(input = {}) {
  const params = new URLSearchParams();
  params.set('fiat', input.fiat || 'NGN');
  params.set('asset', input.asset || 'USDT');
  params.set('limit', String(input.limit || 50));
  return request(`/v1/admin/rates/manual/history?${params.toString()}`);
}

/**
 * GET /v1/admin/rates/sources. Full priority chain for the pair.
 * Each source carries `last_used_at` (ISO string or null).
 *
 * @param {Object} [input]
 * @param {string} [input.fiat='NGN']
 * @param {string} [input.asset='USDT']
 */
export function fetchRateSources(input = {}) {
  const params = new URLSearchParams();
  params.set('fiat', input.fiat || 'NGN');
  params.set('asset', input.asset || 'USDT');
  return request(`/v1/admin/rates/sources?${params.toString()}`);
}

/* ──────────────────────────────────────────────────────────────────
 * authClient.js | Section 7 additions
 *
 * Append these to src/lib/authClient.js (after the rate-engine
 * functions). All use the shared private request() helper so cookie
 * handling + error envelope normalisation stay uniform.
 *
 * The platforms admin surface returns API-shape rows (snake_case +
 * country_config nested by ISO code). The page-level adapter
 * converts to the camelCase mock shape so the existing UI components
 * keep rendering without churn.
 * ────────────────────────────────────────────────────────────────── */

// ── List + detail ────────────────────────────────────────────────

/**
 * GET /v1/admin/platforms
 * @returns {Promise<{ items: Array<object> }>}
 */
export function listPlatforms() {
  return request('/v1/admin/platforms');
}

/**
 * GET /v1/admin/platforms/:id
 * @param {string} id
 * @returns {Promise<object>}
 */
export function fetchPlatform(id) {
  return request(`/v1/admin/platforms/${encodeURIComponent(id)}`);
}

// ── Identity (operator) ──────────────────────────────────────────

/**
 * PATCH /v1/admin/platforms/:id
 *
 * Pass any subset of name / webhook_url / settlement_mode.
 *
 * @param {string} id
 * @param {{
 *   name?: string,
 *   webhook_url?: string,
 *   settlement_mode?: 'batch'|'per_transaction',
 *   telegram_chat_id?: string|null,
 * }} patch
 * @returns {Promise<object>}
 */
export function updatePlatformIdentity(id, patch) {
  return request(`/v1/admin/platforms/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: patch,
  });
}

// ── Fees (OWNER) ─────────────────────────────────────────────────

/**
 * PATCH /v1/admin/platforms/:id/fees
 *
 * @param {string} id
 * @param {{ platform_fee_pct: number }} patch
 * @returns {Promise<object>}
 */
export function updatePlatformFees(id, patch) {
  return request(`/v1/admin/platforms/${encodeURIComponent(id)}/fees`, {
    method: 'PATCH',
    body: patch,
  });
}

// ── Settlement wallet ────────────────────────────────────────────

/**
 * POST /v1/admin/platforms/:id/settlement-wallet/validate
 *
 * Returns { valid, ata, ata_exists }. UI calls this BEFORE the
 * confirm dialog opens so the operator sees the validation result.
 *
 * @param {string} id
 * @param {{ address: string, verify_ata?: boolean }} input
 * @returns {Promise<{ valid: boolean, ata: string|null, ata_exists: boolean }>}
 */
export function validateSettlementWallet(id, input) {
  return request(
    `/v1/admin/platforms/${encodeURIComponent(id)}/settlement-wallet/validate`,
    { method: 'POST', body: input }
  );
}

/**
 * PATCH /v1/admin/platforms/:id/settlement-wallet
 *
 * Re-validates server-side and saves in one round-trip. Returns the
 * updated platform. Owner-only (server-enforced).
 *
 * @param {string} id
 * @param {{ address: string, verify_ata?: boolean }} input
 * @returns {Promise<object>}
 */
export function updateSettlementWallet(id, input) {
  return request(
    `/v1/admin/platforms/${encodeURIComponent(id)}/settlement-wallet`,
    { method: 'PATCH', body: input }
  );
}

// ── Country state (operator) ─────────────────────────────────────

/**
 * PATCH /v1/admin/platforms/:id/countries/:cc
 *
 * Shallow patch over the country sub-object. Pass `null` to clear an
 * override field; `undefined` (omitted) leaves it unchanged.
 *
 * @param {string} id
 * @param {string} countryCode  ISO-3166-1 alpha-2, will be uppercased server-side
 * @param {{
 *   status?: 'active'|'coming_soon'|'paused',
 *   min_amount_usd?: number|null,
 *   max_amount_usd?: number|null,
 *   active_merchants?: string[]|null,
 *   preferred_merchant?: string|null,
 *   notify_email_enabled?: boolean|null,
 * }} patch
 * @returns {Promise<object>}
 */
export function updatePlatformCountry(id, countryCode, patch) {
  return request(
    `/v1/admin/platforms/${encodeURIComponent(id)}/countries/${encodeURIComponent(countryCode)}`,
    { method: 'PATCH', body: patch }
  );
}

// ── API key rotation (OWNER) ─────────────────────────────────────

/**
 * POST /v1/admin/platforms/:id/api-key/rotate
 *
 * Returns { platform, raw_key }. The raw_key is shown ONCE and must
 * be captured by the caller; it is not retrievable later.
 *
 * @param {string} id
 * @returns {Promise<{ platform: object, raw_key: string }>}
 */
export function rotatePlatformApiKey(id) {
  return request(
    `/v1/admin/platforms/${encodeURIComponent(id)}/api-key/rotate`,
    { method: 'POST' }
  );
}

// ── Status: pause / unpause / archive (OWNER) ────────────────────

/**
 * POST /v1/admin/platforms/:id/pause
 * @param {string} id
 * @param {{ reason?: string }} [body]
 * @returns {Promise<object>}
 */
export function pausePlatform(id, body = {}) {
  return request(
    `/v1/admin/platforms/${encodeURIComponent(id)}/pause`,
    { method: 'POST', body }
  );
}

/**
 * POST /v1/admin/platforms/:id/unpause
 * @param {string} id
 * @returns {Promise<object>}
 */
export function unpausePlatform(id) {
  return request(
    `/v1/admin/platforms/${encodeURIComponent(id)}/unpause`,
    { method: 'POST', body: {} }
  );
}

/**
 * POST /v1/admin/platforms/:id/archive
 * @param {string} id
 * @param {{ reason?: string }} [body]
 * @returns {Promise<object>}
 */
export function archivePlatform(id, body = {}) {
  return request(
    `/v1/admin/platforms/${encodeURIComponent(id)}/archive`,
    { method: 'POST', body }
  );
}

// ── Webhook test (operator) ──────────────────────────────────────

/**
 * POST /v1/admin/platforms/:id/webhook-test
 *
 * Fires a synthetic webhook.test payload at the platform's
 * configured webhook URL. Returns status code + latency + body
 * snippet. Does not write to audit_log (active probe, not a state
 * change).
 *
 * @param {string} id
 * @returns {Promise<{
 *   ok: boolean,
 *   status: number,
 *   latency_ms: number,
 *   body_preview: string,
 *   error: string|null,
 * }>}
 */
export function testPlatformWebhook(id) {
  return request(
    `/v1/admin/platforms/${encodeURIComponent(id)}/webhook-test`,
    { method: 'POST', body: {} }
  );
}


/* APPEND to remvo-web/src/lib/authClient.js
 *
 * Section 8 | Merchants admin client.
 * Uses the existing module-private `request()` helper. Append AS-IS,
 * inside the same file, after the existing exports.
 */

export function fetchMerchants() {
  return request('/v1/admin/merchants', { method: 'GET' });
}

export function fetchMerchant(id) {
  return request(`/v1/admin/merchants/${encodeURIComponent(id)}`, { method: 'GET' });
}

export function updateMerchant(id, patch) {
  return request(`/v1/admin/merchants/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: patch,
  });
}

export function pauseMerchant(id, opts = {}) {
  return request(`/v1/admin/merchants/${encodeURIComponent(id)}/pause`, {
    method: 'POST',
    body: opts,
  });
}

export function unpauseMerchant(id) {
  return request(`/v1/admin/merchants/${encodeURIComponent(id)}/unpause`, {
    method: 'POST',
    body: {},
  });
}

export function disableMerchant(id, opts = {}) {
  return request(`/v1/admin/merchants/${encodeURIComponent(id)}/disable`, {
    method: 'POST',
    body: opts,
  });
}

export function rotateMerchantSecrets(id) {
  return request(`/v1/admin/merchants/${encodeURIComponent(id)}/rotate-secrets`, {
    method: 'POST',
    body: {},
  });
}

/* SECTION_9_CORRIDORS_CLIENT */
export function fetchCorridors() {
  return request('/v1/admin/corridors', { method: 'GET' });
}

export function fetchCorridor(id) {
  return request(`/v1/admin/corridors/${encodeURIComponent(id)}`, { method: 'GET' });
}

export function pauseCorridor(id, opts = {}) {
  return request(`/v1/admin/corridors/${encodeURIComponent(id)}/pause`, {
    method: 'POST',
    body: opts,
  });
}

export function unpauseCorridor(id) {
  return request(`/v1/admin/corridors/${encodeURIComponent(id)}/unpause`, {
    method: 'POST',
    body: {},
  });
}

export function flipCorridorMerchant(id, opts) {
  return request(`/v1/admin/corridors/${encodeURIComponent(id)}/flip-merchant`, {
    method: 'POST',
    body: opts,
  });
}

// ══════════════════════════════════════════════════════════════════
//  Org settings (Phase 7E.x)
// ══════════════════════════════════════════════════════════════════
//
// Read-side: any operator. Write-side: owner only (server-enforced).
// Cross-field guardrail: enabling require_totp_for_owners while any
// active owner lacks TOTP returns 409 SETTINGS_TOTP_NOT_READY with
// `details.owners_without_totp` populated. Consumers branch on
// err.code === 'SETTINGS_TOTP_NOT_READY' to render the offending list.

/**
 * GET /v1/admin/settings
 *
 * Returns the singleton org_settings row plus the operator who last
 * updated it.
 *
 * @returns {Promise<{
 *   telegram_chat_id: string|null,
 *   wallet_low_threshold_usd: string,         numeric on wire as string
 *   settlement_sla_hours: number,
 *   rate_deviation_pct: string,                numeric on wire as string
 *   require_totp_for_owners: boolean,
 *   auto_revoke_inactive_days: number,
 *   updated_at: string,                        ISO
 *   updated_by: { id: string, email: string, display_name: string }|null,
 * }>}
 */
export function fetchSettings() {
  return request('/v1/admin/settings');
}

/**
 * PATCH /v1/admin/settings
 *
 * Partial update. Only the keys present in `patch` are written. An
 * empty patch (no keys) returns 400 from the backend zod refine; the
 * UI is responsible for not submitting one. Owner role required.
 *
 * Throws AuthApiError with code 'SETTINGS_TOTP_NOT_READY' (status 409)
 * if the patch flips require_totp_for_owners=true while owners lack
 * TOTP. `err.details.owners_without_totp` is the email list to display.
 *
 * @param {Partial<{
 *   telegram_chat_id: string|null,
 *   wallet_low_threshold_usd: number,
 *   settlement_sla_hours: number,
 *   rate_deviation_pct: number,
 *   require_totp_for_owners: boolean,
 *   auto_revoke_inactive_days: number,
 * }>} patch
 * @returns {Promise<object>}                  same shape as fetchSettings()
 */
export function patchSettings(patch) {
  return request('/v1/admin/settings', {
    method: 'PATCH',
    body: patch,
  });
}

// ══════════════════════════════════════════════════════════════════
//  Sign-out flavours (Phase 7E.x)
// ══════════════════════════════════════════════════════════════════
//
// The single-session logout from `logout()` covers sign-out-this-tab.
// These two cover the broader cases:
//
//   sign-out-others | every operator. Revokes their other sessions,
//                     current cookie survives. Useful after travelling
//                     or a shared device.
//
//   sign-out-all    | owner only. Revokes ALL sessions org-wide,
//                     including the caller's. The caller is signed out
//                     of this tab too once the response returns; the
//                     UI is responsible for navigating to /login.

/**
 * POST /v1/admin/auth/sign-out-others
 *
 * @returns {Promise<{ revoked_count: number }>}
 */
export function signOutOthers() {
  return request('/v1/admin/auth/sign-out-others', {
    method: 'POST',
    body: {},
  });
}

/**
 * POST /v1/admin/auth/sign-out-all
 *
 * Owner-only (server-enforced). The session cookie is now dead when
 * this resolves; UI must navigate to /login.
 *
 * @returns {Promise<{ revoked_count: number }>}
 */
export function signOutAll() {
  return request('/v1/admin/auth/sign-out-all', {
    method: 'POST',
    body: {},
  });
}

// ══════════════════════════════════════════════════════════════════
//  Notification testing (Phase 7E.x)
// ══════════════════════════════════════════════════════════════════

/**
 * POST /v1/admin/settings/notify/test
 *
 * Owner-only. Sends a test Telegram alert through the live alerter,
 * exercising chat-id resolution (DB → env fallback), HTML escaping,
 * and dedup. Reports back which source was used so the operator can
 * verify configuration intent.
 *
 * @returns {Promise<{
 *   ok: boolean,
 *   chat_id_source: 'database' | 'env_fallback' | 'none',
 *   chat_id_used: string | null,
 * }>}
 */
export function sendTestAlert() {
  return request('/v1/admin/settings/notify/test', {
    method: 'POST',
    body: {},
  });
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  Analytics read API (Phase 7F Session 2 backend / Session 3 frontend)
//  PHASE_7F_S3_ANALYTICS_API
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

/**
 * GET /v1/admin/analytics/events
 *
 * Returns raw events shaped to match the frontend event contract.
 * 60s server-side cache keyed on (from, to, platform_id, country_code).
 *
 * @param {{ from: string, to: string, platform_id?: string, country_code?: string }} query
 * @returns {Promise<{
 *   events: Array<object>,
 *   truncated: boolean,
 *   fetched_at: string,
 *   cached: boolean,
 * }>}
 */
export function fetchAnalyticsEvents(query) {
  const params = new URLSearchParams();
  if (query?.from) params.set('from', query.from);
  if (query?.to)   params.set('to',   query.to);
  if (query?.platform_id)  params.set('platform_id',  query.platform_id);
  if (query?.country_code) params.set('country_code', query.country_code);
  const qs = params.toString();
  return request('/v1/admin/analytics/events' + (qs ? '?' + qs : ''));
}

/**
 * GET /v1/admin/analytics/availability
 *
 * Returns launch toggle states + a "has any recent events" flag.
 *
 * @returns {Promise<{
 *   analytics_enabled: boolean,
 *   withdrawals_enabled: boolean,
 *   has_recent_events: boolean,
 *   fetched_at: string,
 *   cached: boolean,
 * }>}
 */
export function fetchAnalyticsAvailability() {
  return request('/v1/admin/analytics/availability');
}
