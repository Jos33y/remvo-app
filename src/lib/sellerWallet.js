/* ──────────────────────────────────────────────────────────────────
 * lib/sellerWallet.js
 *
 * The real wallet: balance, history, settings and top-ups, from
 * remvo-api. One small store per signed-in account, shared by every
 * screen through useSellerData(), refreshed after anything that could
 * change it (a top-up landing, a settings change, coming back to the
 * tab).
 *
 * Listings are still preview data (lib/sellerData.js) until the
 * listing engine ships; they read the balance from here but never
 * spend from it.
 * ────────────────────────────────────────────────────────────────── */

import { sellerApi } from '@lib/sellerApi';
import { currencyForCountry, guessCountry, marketplaceForCountry } from '@lib/market';

let state = { accountId: null, status: 'idle', wallet: null, history: [], error: null };
const listeners = new Set();
const set = (patch) => { state = { ...state, ...patch }; listeners.forEach((l) => l()); };

export const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
export const getState = () => state;

let inflight = null;

/** Load (or reload) the wallet and history for this account. */
export function refresh(accountId) {
  if (!accountId) return Promise.resolve();
  if (state.accountId !== accountId) set({ accountId, status: 'loading', wallet: null, history: [], error: null });
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const [wallet, page] = await Promise.all([sellerApi.wallet(), sellerApi.history()]);
      // A new account's settings are still the server's defaults. Set
      // them once from where this browser is, as the site did.
      if (!wallet.settings.settingsSetAt) {
        const country = guessCountry();
        const settings = (await sellerApi.updateSettings({
          marketplace: marketplaceForCountry(country),
          currency: currencyForCountry(country),
        })).settings;
        wallet.settings = settings;
        wallet.worth = { ...wallet.worth, currency: settings.currency };
      }
      if (state.accountId === accountId) set({ status: 'ready', wallet, history: page.items, error: null });
    } catch (err) {
      if (state.accountId === accountId) set({ status: state.wallet ? 'ready' : 'error', error: err });
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export async function updateSettings(accountId, patch) {
  const { settings } = await sellerApi.updateSettings(patch);
  if (state.wallet) set({ wallet: { ...state.wallet, settings } });
  await refresh(accountId);
  return settings;
}

/** Start a top-up and go to Polar's checkout. Does not come back. */
export async function startTopUp({ credits = null, amount = null, currency }) {
  const out = await sellerApi.startTopUp(credits ? { pack: credits, currency } : { amount, currency });
  window.location.assign(out.url);
  return out;
}

export const topUpStatus = (checkoutId) => sellerApi.topUpStatus(checkoutId);

export function clear() { set({ accountId: null, status: 'idle', wallet: null, history: [], error: null }); }
