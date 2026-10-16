/* ──────────────────────────────────────────────────────────────────
 * lib/sellerApi.js
 *
 * The seller app's only door to remvo-api: /v1/my/*. Every call sends
 * the session cookie (credentials: 'include'); the cookie itself is
 * HttpOnly and never touched here.
 *
 * API address: VITE_API_URL when set, otherwise localhost:8080 in dev
 * and api.remvo.app in production.
 *
 * Every failure becomes a SellerApiError with a message a seller can
 * read: the API's own message when it sent one, a plain fallback when
 * it did not, and a connection message when nothing came back.
 * ────────────────────────────────────────────────────────────────── */

const ROOT = (import.meta.env.VITE_API_URL
  ?? (import.meta.env.DEV ? 'http://localhost:8080' : 'https://api.remvo.app')).replace(/\/+$/, '');
const BASE = `${ROOT}/v1/my`;

export class SellerApiError extends Error {
  /**
   * @param {number} status   0 when the request never got an answer
   * @param {string} code
   * @param {string} message  safe to show as is
   * @param {object|null} details  what the API sent with it (a balance, the products to pick from)
   */
  constructor(status, code, message, details = null) {
    super(message);
    this.name = 'SellerApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const FALLBACK = {
  400: 'Check what you entered and try again.',
  401: 'Sign in to continue.',
  403: 'That is not allowed.',
  404: 'That could not be found.',
  429: 'Too many attempts. Wait a minute and try again.',
  402: 'Not enough credits. Top up and try again.',
  503: 'Remvo is not answering just now. Try again in a minute.',
};

async function call(method, path, body, { keepalive = false } = {}) {
  // Development only: the break-the-UI fixtures (lib/devData.js), when
  // ?data= picked one. Not in a production build.
  if (import.meta.env.DEV) {
    const { devAnswer } = await import('./devData.js');
    const answer = await devAnswer(method, path, body, SellerApiError);
    if (answer !== undefined) return answer;
  }
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      credentials: 'include',
      headers: body ? { 'content-type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
      // A delete sent as the page closes still reaches the server.
      ...(keepalive ? { keepalive: true } : {}),
    });
  } catch {
    throw new SellerApiError(0, 'network', 'We could not reach Remvo. Check your connection and try again.');
  }

  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (res.ok) return data;

  const err = data?.error ?? {};
  // A validation failure carries the field's own message; show that.
  const issue = Array.isArray(err.details?.issues) ? err.details.issues[0]?.message : null;
  // A 500 is never shown as the server worded it: in development that is
  // the raw internal error. Anything else from the API is written for sellers.
  const ours = 'Something went wrong on our side. Try again in a minute.';
  const message = res.status === 500 ? ours : (issue || err.message || FALLBACK[res.status] || ours);
  throw new SellerApiError(res.status, err.code ?? 'unknown', message, err.details ?? null);
}

export const sellerApi = Object.freeze({
  // Sign-up and sign-in (modules/accounts in remvo-api)
  signUp: (email, password) => call('POST', '/auth/sign-up', { email, password }),
  verifyLink: (token) => call('POST', '/auth/verify-link', { token }),
  verifyCode: (email, code) => call('POST', '/auth/verify-code', { email, code }),
  signIn: (email, password) => call('POST', '/auth/sign-in', { email, password }),
  startReset: (email) => call('POST', '/auth/reset', { email }),
  checkReset: (token) => call('POST', '/auth/reset/check', { token }),
  /** { email, code, password } or { token, password } -> { account } */
  finishReset: (body) => call('POST', '/auth/reset/finish', body),
  passkeySignInStart: () => call('POST', '/auth/passkey/start'),
  passkeySignInFinish: (challengeId, credential) => call('POST', '/auth/passkey/finish', { challengeId, credential }),
  signOut: () => call('POST', '/auth/sign-out'),
  me: () => call('GET', '/me'),
  /** The last 7 days: listings made and stock value, in the seller's time zone. */
  summary: (tz) => call('GET', `/summary${tz ? `?tz=${encodeURIComponent(tz)}` : ''}`),
  setName: (name) => call('PATCH', '/me', { name }),
  /** { password } for a first one, { current, password } to change it */
  setPassword: (body) => call('POST', '/me/password', body),
  passkeys: () => call('GET', '/me/passkeys'),
  passkeyAddStart: () => call('POST', '/me/passkeys/start'),
  passkeyAddFinish: (challengeId, credential) => call('POST', '/me/passkeys/finish', { challengeId, credential }),
  passkeyRemove: (id) => call('DELETE', `/me/passkeys/${encodeURIComponent(id)}`),

  // Wallet (modules/credits in remvo-api)
  wallet: () => call('GET', '/wallet'),
  history: (before) => call('GET', `/wallet/history${before ? `?before=${encodeURIComponent(before)}` : ''}`),
  updateSettings: (patch) => call('PATCH', '/settings', patch),
  /** { pack: 50|200|500 } or { amount: 37 }, with currency. Returns { checkoutId, url, credits }. */
  startTopUp: (body) => call('POST', '/topups', body),
  topUpStatus: (checkoutId) => call('GET', `/topups/${encodeURIComponent(checkoutId)}`),

  // Listings (modules/jobs in remvo-api)
  /** { input, marketplace? } -> { kind, value, amazon, product, matches } */
  lookUp: (body) => call('POST', '/jobs/lookup', body),
  /** { input, asin?, condition } -> { job }; credits taken */
  createJob: (body) => call('POST', '/jobs', body),
  jobs: (before) => call('GET', `/jobs${before ? `?before=${encodeURIComponent(before)}` : ''}`),
  job: (id) => call('GET', `/jobs/${encodeURIComponent(id)}`),
  editJob: (id, field, value) => call('PATCH', `/jobs/${encodeURIComponent(id)}/edits`, { field, value }),
  deleteJob: (id, opts) => call('DELETE', `/jobs/${encodeURIComponent(id)}`, undefined, opts),

  // Bulk listing (modules/batches in remvo-api)
  /** { text, marketplace?, condition } -> every line read, the cost; free */
  checkBatch: (body) => call('POST', '/batches/check', body),
  /** { text, marketplace?, condition, limit? } -> { batch }; credits taken */
  startBatch: (body) => call('POST', '/batches', body),
  batches: () => call('GET', '/batches'),
  batch: (id) => call('GET', `/batches/${encodeURIComponent(id)}`),
  /** The eBay drafts file ('ebay') or the full CSV ('csv'), as a Blob. */
  batchFile: (id, format) => download(`/batches/${encodeURIComponent(id)}/export?format=${format}`),
});

/** A file from the API, as a Blob, with the same errors as call(). */
async function download(path) {
  if (import.meta.env.DEV) {
    const { devAnswer } = await import('./devData.js');
    const answer = await devAnswer('GET', path, null, SellerApiError);
    if (answer !== undefined) return answer;
  }
  let res;
  try {
    res = await fetch(`${BASE}${path}`, { credentials: 'include' });
  } catch {
    throw new SellerApiError(0, 'network', 'We could not reach Remvo. Check your connection and try again.');
  }
  if (res.ok) return res.blob();
  const data = await res.json().catch(() => null);
  const err = data?.error ?? {};
  throw new SellerApiError(res.status, err.code ?? 'unknown', res.status === 500 ? 'Something went wrong on our side. Try again in a minute.' : (err.message || FALLBACK[res.status] || 'That did not download. Try again.'));
}
