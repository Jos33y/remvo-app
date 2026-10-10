import { useSyncExternalStore } from 'react';
import { MARKETPLACE, currencyForCountry, guessCountry, marketplaceForCountry } from '@lib/market';

/* ──────────────────────────────────────────────────────────────────
 * useMarket
 *
 * The visitor's marketplace and currency, shared by every component
 * on the page and kept in this browser. Guessed on first visit;
 * whatever the visitor picks afterwards wins.
 *
 * Currency follows the marketplace (eBay.de means euros) until the
 * visitor picks a currency themselves; after that the two are
 * independent, because a seller in Ireland can list on eBay UK and
 * still want to pay in euros.
 *
 *   const { marketplace, currency, setMarketplace, setCurrency } = useMarket();
 * ────────────────────────────────────────────────────────────────── */

const KEY = 'remvo.market';
const listeners = new Set();
let state = null;

const CURRENCY_OF_SITE = { US: 'USD', CA: 'USD', UK: 'GBP', DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR' };

function load() {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(KEY) ?? 'null'); } catch { /* private mode */ }
  if (saved && MARKETPLACE[saved.marketplace] && ['USD', 'EUR', 'GBP'].includes(saved.currency)) {
    return { marketplace: saved.marketplace, currency: saved.currency, currencyChosen: Boolean(saved.currencyChosen) };
  }
  const country = guessCountry();
  return { marketplace: marketplaceForCountry(country), currency: currencyForCountry(country), currencyChosen: false };
}

function get() {
  if (!state) state = load();
  return state;
}

function set(next) {
  state = { ...get(), ...next };
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode */ }
  listeners.forEach((l) => l());
}

function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

const SERVER = { marketplace: 'US', currency: 'USD', currencyChosen: false };

export function useMarket() {
  const s = useSyncExternalStore(subscribe, get, () => SERVER);
  return {
    marketplace: s.marketplace,
    currency: s.currency,
    site: MARKETPLACE[s.marketplace],
    setMarketplace: (id) => set(get().currencyChosen ? { marketplace: id } : { marketplace: id, currency: CURRENCY_OF_SITE[id] }),
    setCurrency: (id) => set({ currency: id, currencyChosen: true }),
  };
}
