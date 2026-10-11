/* ──────────────────────────────────────────────────────────────────
 * lib/supportApi.js
 *
 * Live chat's calls to remvo-api.
 *
 *   The site    /v1/support/chats. No account: the chat's own key, kept
 *               in this browser, is sent as a bearer token. The key is
 *               never in an address, so it stays out of every log.
 *   The app     /v1/my/support, with the seller's session cookie.
 *
 * Failures come back as SellerApiError with words a visitor can read.
 * ────────────────────────────────────────────────────────────────── */

import { SellerApiError } from '@lib/sellerApi';

const ROOT = (import.meta.env.VITE_API_URL
  ?? (import.meta.env.DEV ? 'http://localhost:8080' : 'https://api.remvo.app')).replace(/\/+$/, '');

async function call(method, path, { body, key, cookie = false } = {}) {
  let res;
  try {
    res = await fetch(`${ROOT}/v1${path}`, {
      method,
      credentials: cookie ? 'include' : 'omit',
      headers: {
        ...(body ? { 'content-type': 'application/json' } : {}),
        ...(key ? { authorization: `Bearer ${key}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new SellerApiError(0, 'network', 'We could not reach Remvo. Check your connection and try again.');
  }
  const data = await res.json().catch(() => null);
  if (res.ok) return data;
  const err = data?.error ?? {};
  const issue = Array.isArray(err.details?.issues) ? err.details.issues[0]?.message : null;
  const message = res.status >= 500 && res.status !== 503
    ? 'Something went wrong on our side. Email support@remvo.app and we will answer.'
    : (issue || err.message || 'That did not send. Try again.');
  throw new SellerApiError(res.status, err.code ?? 'unknown', message, err.details ?? null);
}

const q = (after, open) => `?after=${encodeURIComponent(after ?? '0')}&open=${open ? '1' : '0'}`;

export const siteChat = Object.freeze({
  /** { email, name?, message, page?, website } -> { chat, key } */
  start: (body) => call('POST', '/support/chats', { body }),
  read: (id, key, { after, open } = {}) => call('GET', `/support/chats/${encodeURIComponent(id)}${q(after, open)}`, { key }),
  write: (id, key, message) => call('POST', `/support/chats/${encodeURIComponent(id)}/messages`, { key, body: { message } }),
});

export const appChat = Object.freeze({
  read: ({ after, open } = {}) => call('GET', `/my/support${q(after, open)}`, { cookie: true }),
  write: (message, page) => call('POST', '/my/support/messages', { cookie: true, body: { message, ...(page ? { page } : {}) } }),
});
