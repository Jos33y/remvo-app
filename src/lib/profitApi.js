/* ──────────────────────────────────────────────────────────────────
 * lib/profitApi.js
 *
 * remvo.app's fee calculator asking remvo-api for a sum (tools1). No
 * account, no cookie, nothing stored: the figures go, the answer comes
 * back, from the same fee table the app's listings use.
 * ────────────────────────────────────────────────────────────────── */

const ROOT = (import.meta.env.VITE_API_URL
  ?? (import.meta.env.DEV ? 'http://localhost:8080' : 'https://api.remvo.app')).replace(/\/+$/, '');

/**
 * @param {object} body  { marketplace, sellerType, vatRegistered, groupKey, feeRate, price, postCharged, cost, postCost }
 * @param {AbortSignal} [signal]
 */
export async function workOut(body, signal) {
  let res;
  try {
    res = await fetch(`${ROOT}/v1/profit`, {
      method: 'POST',
      credentials: 'omit',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    throw new Error('We could not reach Remvo to work this out. Check your connection and try again.');
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(res.status === 429 ? 'That is a lot of sums at once. Wait a minute.' : 'Those figures did not work. Check them and try again.');
  return data.profit;
}
