/* ──────────────────────────────────────────────────────────────────
 * Marketplaces and currencies
 *
 * Two separate choices, because they are separate facts about a
 * seller. The marketplace is the eBay site they list on: it decides
 * the language of the listing, the category tree, the parcel service
 * and the currency of the suggested price. The currency is what they
 * pay us in: US dollars by default, euros in the eurozone, pounds in
 * the UK. A seller in Ireland pays in euros and may well list on eBay
 * UK; a seller in Canada pays in dollars and lists on eBay Canada.
 *
 * Both are guessed once from the browser (time zone first, then
 * language) and can be changed at any time. A choice the visitor makes
 * sticks; a guess never overrides it.
 * ────────────────────────────────────────────────────────────────── */

export const MARKETPLACES = Object.freeze([
  { id: 'US', name: 'United States', site: 'eBay.com', amazon: 'amazon.com', priceCurrency: 'USD', carrier: 'USPS Ground Advantage', units: 'imperial', lang: 'English', langCode: 'en' },
  { id: 'CA', name: 'Canada', site: 'eBay.ca', amazon: 'amazon.ca', priceCurrency: 'CAD', carrier: 'Canada Post Expedited Parcel', units: 'metric', lang: 'English', langCode: 'en' },
  { id: 'UK', name: 'United Kingdom', site: 'eBay.co.uk', amazon: 'amazon.co.uk', priceCurrency: 'GBP', carrier: 'Royal Mail small parcel', units: 'metric', lang: 'English', langCode: 'en' },
  { id: 'DE', name: 'Germany', site: 'eBay.de', amazon: 'amazon.de', priceCurrency: 'EUR', carrier: 'DHL Paket', units: 'metric', lang: 'German', langCode: 'de' },
  { id: 'FR', name: 'France', site: 'eBay.fr', amazon: 'amazon.fr', priceCurrency: 'EUR', carrier: 'Colissimo', units: 'metric', lang: 'French', langCode: 'fr' },
  { id: 'IT', name: 'Italy', site: 'eBay.it', amazon: 'amazon.it', priceCurrency: 'EUR', carrier: 'Poste Italiane', units: 'metric', lang: 'Italian', langCode: 'it' },
  { id: 'ES', name: 'Spain', site: 'eBay.es', amazon: 'amazon.es', priceCurrency: 'EUR', carrier: 'Correos Paq', units: 'metric', lang: 'Spanish', langCode: 'es' },
]);

export const MARKETPLACE = Object.freeze(Object.fromEntries(MARKETPLACES.map((m) => [m.id, m])));

/* What we charge in. Anyone outside the eurozone and the UK pays in
 * US dollars, which is also what Polar falls back to. */
export const CURRENCIES = Object.freeze([
  { id: 'USD', symbol: '$', name: 'US dollars' },
  { id: 'EUR', symbol: '€', name: 'Euros' },
  { id: 'GBP', symbol: '£', name: 'Pounds' },
]);

export const DEFAULT_MARKETPLACE = 'US';
export const DEFAULT_CURRENCY = 'USD';

/* Euro countries (ISO 3166-1 alpha-2) as of October 2026. */
const EUROZONE = new Set(['AT', 'BE', 'BG', 'HR', 'CY', 'EE', 'FI', 'FR', 'DE', 'GR', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PT', 'SK', 'SI', 'ES']);

/* Countries with no eBay site of their own, listed on the nearest one
 * that shares their language or their buyers. */
const NEAREST_SITE = { IE: 'UK', AT: 'DE', NL: 'DE', LU: 'DE', BE: 'FR', PT: 'ES', CH: 'DE' };

export function currencyForCountry(country) {
  if (country === 'GB') return 'GBP';
  if (EUROZONE.has(country)) return 'EUR';
  return DEFAULT_CURRENCY;
}

export function marketplaceForCountry(country) {
  if (country === 'GB') return 'UK';
  if (MARKETPLACE[country]) return country;
  return NEAREST_SITE[country] ?? DEFAULT_MARKETPLACE;
}

/* The browser's country, from its time zone. Language is a much weaker
 * signal: a seller in Lagos or Nairobi often runs en-GB or en-US, and
 * would be wrongly sent to eBay UK. So the language region is only
 * consulted when there is no real zone at all (UTC, or none). */
const ZONES = {
  'Europe/London': 'GB', 'Europe/Belfast': 'GB', 'Europe/Dublin': 'IE',
  'Europe/Berlin': 'DE', 'Europe/Busingen': 'DE', 'Europe/Vienna': 'AT', 'Europe/Zurich': 'CH',
  'Europe/Paris': 'FR', 'Europe/Brussels': 'BE', 'Europe/Luxembourg': 'LU', 'Europe/Amsterdam': 'NL',
  'Europe/Rome': 'IT', 'Europe/Madrid': 'ES', 'Atlantic/Canary': 'ES', 'Africa/Ceuta': 'ES',
  'Europe/Lisbon': 'PT', 'Atlantic/Madeira': 'PT', 'Atlantic/Azores': 'PT',
  'Europe/Helsinki': 'FI', 'Europe/Tallinn': 'EE', 'Europe/Riga': 'LV', 'Europe/Vilnius': 'LT',
  'Europe/Athens': 'GR', 'Asia/Nicosia': 'CY', 'Europe/Malta': 'MT', 'Europe/Bratislava': 'SK',
  'Europe/Ljubljana': 'SI', 'Europe/Zagreb': 'HR', 'Europe/Sofia': 'BG',
};
const CANADA = /^America\/(Toronto|Montreal|Vancouver|Edmonton|Winnipeg|Halifax|Regina|St_Johns|Moncton|Glace_Bay|Goose_Bay|Whitehorse|Dawson|Yellowknife|Iqaluit|Swift_Current|Rankin_Inlet|Resolute|Cambridge_Bay|Inuvik|Atikokan|Creston|Fort_Nelson|Dawson_Creek)$/;

export function guessCountry() {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
    if (ZONES[zone]) return ZONES[zone];
    if (CANADA.test(zone)) return 'CA';
    if (zone.startsWith('America/') || zone.startsWith('US/') || zone === 'Pacific/Honolulu') return 'US';
    if (zone && zone !== 'UTC' && !zone.startsWith('Etc/')) return 'US';
    const region = (navigator.language ?? '').split('-')[1]?.toUpperCase();
    if (region) return region === 'UK' ? 'GB' : region;
  } catch { /* fall through */ }
  return 'US';
}

/* ── Money ──────────────────────────────────────────────────────── */

/* A price in a currency, written the way a seller in that market
 * reads it on our English pages: $5, €5, £4; under 1 in pence or
 * cents for pounds, decimals for the rest ($0.30, 24p). */
export function money(amount, currency, { whole = false } = {}) {
  if (currency === 'GBP' && amount < 1 && amount > 0) return `${Math.round(amount * 100)}p`;
  const sym = CURRENCIES.find((c) => c.id === currency)?.symbol ?? '';
  const digits = whole || Number.isInteger(amount) ? 0 : 2;
  return `${sym}${amount.toLocaleString('en-GB', { minimumFractionDigits: digits, maximumFractionDigits: 2 })}`;
}
