/* Formatting for the seller app. British English, dates the way
 * people say them. One place, so every screen reads alike.
 *
 * Two kinds of money: what the seller pays us (money() from market.js:
 * $, €, £) and the suggested selling price on their eBay site, written
 * the way that site writes it (listingPrice). */

export { money } from '@lib/market';

// Each site's own digit grouping, through Intl: $12,499.00, 12.499,00 €.
const figures = (locale) => {
  const f = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (n) => f.format(n);
};
const US = figures('en-US');
const CA = figures('en-CA');
const GB = figures('en-GB');
const EU = figures('de-DE');
const PRICE_FORMAT = {
  USD: (n) => `$${US(n)}`,
  CAD: (n) => `C$${CA(n)}`,
  GBP: (n) => `£${GB(n)}`,
  EUR: (n) => `${EU(n)}\u00a0€`,
};

/** A suggested selling price, as the eBay site shows it: $19.99, C$24.99, £14.99, 16,99 €. */
export const listingPrice = (value, currency) => (PRICE_FORMAT[currency] ?? PRICE_FORMAT.USD)(Number(value));

/** eBay.com's weight: "2 lb 2 oz", "2 lb", "9 oz". Listings made before
 *  ounces were kept have none, and read as whole pounds. */
export const lbOz = (lb, oz) => {
  const parts = [lb > 0 && `${lb} lb`, oz > 0 && `${oz} oz`].filter(Boolean);
  return parts.length ? parts.join(' ') : `${lb ?? 0} lb`;
};

/** "28 x 10 x 10 cm, 0.45 kg" or "8 x 4 x 4 in, 1 lb 7 oz". Only what is known:
 *  "2 lb 2 oz" when the page gives no size, "8 x 4 x 4 in" when it gives no weight. */
export function parcel(p) {
  if (!p) return '';
  const imperial = p.units === 'imperial';
  const size = p.l != null && p.w != null && p.h != null ? `${p.l} x ${p.w} x ${p.h} ${imperial ? 'in' : 'cm'}` : null;
  const weight = p.weight == null ? null : imperial ? lbOz(p.weight, p.oz) : `${p.weight} kg`;
  return [size, weight].filter(Boolean).join(', ');
}

/** True when the parcel has a size or a weight to show. */
export const hasParcel = (p) => Boolean(p && (p.weight != null || (p.l != null && p.w != null && p.h != null)));
export const credits = (n) => `${n} ${Math.abs(n) === 1 ? 'credit' : 'credits'}`;
/** A ledger figure with its sign, grouped: "+100,000", "−1,500". */
export const signed = (n) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${new Intl.NumberFormat('en-GB').format(Math.abs(n))}`;

export const longDate = (iso) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

/** "Today, 14:05", "Yesterday", "Tue", "3 Oct". How a list of recent things reads. */
export function when(iso, now = Date.now()) {
  const d = new Date(iso);
  const start = new Date(now); start.setHours(0, 0, 0, 0);
  const diff = (start.getTime() - new Date(d).setHours(0, 0, 0, 0)) / 86_400_000;
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  if (diff <= 0) return `Today, ${time}`;
  if (diff === 1) return `Yesterday, ${time}`;
  if (diff < 7) return d.toLocaleDateString('en-GB', { weekday: 'long' });
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', ...(d.getFullYear() !== new Date(now).getFullYear() ? { year: 'numeric' } : {}) });
}

/** "5012 3456 7890 0", grouped the way it is printed on a box. */
export const barcode = (v) => String(v).replace(/(\d{4})(?=\d)/g, '$1 ');

/** What a listing was made from, short enough for a row or a heading.
 *  A barcode in groups; an Amazon link as its site and product number
 *  (amazon.co.uk/dp/B0CB5MZXW8), since the product number is the part
 *  that tells two links apart. */
export function inputLabel(input) {
  if (input.kind === 'barcode') return barcode(input.value);
  const v = String(input.value);
  const host = (/^https?:\/\/(?:www\.)?([^/?#]+)/i.exec(v) ?? [])[1];
  const asin = (/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i.exec(v) ?? [])[1];
  if (host && asin) return `${host}/dp/${asin.toUpperCase()}`;
  return v.replace(/^https?:\/\/(?:www\.)?/i, '').replace(/[?#].*$/, '');
}
