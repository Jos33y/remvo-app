/* ──────────────────────────────────────────────────────────────────
 * lib/remvoAdminApi.js (analytics1)
 *
 * admin.remvo.app/remvo's door to /v1/admin/remvo/*. Same address and
 * operator cookie as lib/authClient.js (credentials: 'include').
 * ────────────────────────────────────────────────────────────────── */

const API_BASE = import.meta.env.VITE_REMVO_API_BASE || 'http://localhost:8080';

export class RemvoApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'RemvoApiError';
    this.status = status;
  }
}

/**
 * @param {string} path  e.g. 'overview', 'sellers/acc_x'
 * @param {{ from?: number, to?: number, all?: boolean }} [q]  epoch ms
 * @param {AbortSignal} [signal]
 */
export async function fetchRemvo(path, q = {}, signal) {
  const params = new URLSearchParams();
  if (q.from != null) params.set('from', new Date(q.from).toISOString());
  if (q.to != null) params.set('to', new Date(q.to).toISOString());
  if (q.all) params.set('all', '1');
  const qs = params.toString();
  let res;
  try {
    res = await fetch(`${API_BASE}/v1/admin/remvo/${path}${qs ? `?${qs}` : ''}`, { credentials: 'include', signal });
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    throw new RemvoApiError(0, 'Could not reach the API. Check your connection.');
  }
  let body = null;
  try { body = await res.json(); } catch { body = null; }
  if (!res.ok) {
    const message = body?.error?.message || body?.message || (res.status === 401 ? 'Sign in again.' : 'That report did not load.');
    throw new RemvoApiError(res.status, message);
  }
  return body;
}
