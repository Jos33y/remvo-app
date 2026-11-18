/* ──────────────────────────────────────────────────────────────────
 * lib/buyerProtection.js (seo2)
 *
 * eBay.co.uk's Buyer Protection fee, which the buyer pays on an item
 * from a UK private seller (eBay help id 5594): 10p an item, then 7% of
 * the item price up to £20, 4% of the part from £20 to £300, 2% of the
 * part from £300 to £4,000, nothing on any part above. Postage is not
 * part of it. Business sellers' buyers pay nothing.
 *
 * Worked in pence so every answer is exact to the penny, and checked
 * against eBay's own examples in test (£5 item: 45p; £1,500: £36.70).
 * ────────────────────────────────────────────────────────────────── */

export const BP_CHECKED = '2026-11-18';
export const BP_SOURCE = 'https://www.ebay.co.uk/help/buying/paying-items/buyer-protection-fee?id=5594';

export const BP_FLAT = 10; // pence, once per item
export const BP_BANDS = Object.freeze([
  { from: 0, to: 2000, rate: 0.07, label: 'Up to £20' },
  { from: 2000, to: 30000, rate: 0.04, label: '£20 to £300' },
  { from: 30000, to: 400000, rate: 0.02, label: '£300 to £4,000' },
]);

/** The fee in pence for an item price in pence, with each band's share. */
export function buyerProtection(pricePence) {
  const p = Math.max(0, Math.round(pricePence));
  if (!p) return { fee: 0, flat: 0, parts: BP_BANDS.map((b) => ({ ...b, base: 0, amount: 0 })) };
  const parts = BP_BANDS.map((b) => {
    const base = Math.max(0, Math.min(p, b.to) - b.from);
    return { ...b, base, amount: Math.round(base * b.rate) };
  });
  const fee = BP_FLAT + parts.reduce((t, x) => t + x.amount, 0);
  return { fee, flat: BP_FLAT, parts };
}

/** The most the fee can be: an item of £4,000 or more. */
export const BP_MAX = buyerProtection(400000).fee;

/** The highest item price, in pence, whose price plus fee is no more than
 *  what the buyer should see. Null when even a 1p item costs more. */
export function priceForTotal(totalPence) {
  const t = Math.round(totalPence);
  if (t < 1 + buyerProtection(1).fee) return null;
  // The total rises with the price, so search the pence.
  let lo = 1;
  let hi = t;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (mid + buyerProtection(mid).fee <= t) lo = mid; else hi = mid - 1;
  }
  return lo;
}

export const pounds = (pence) => `£${(pence / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Prices shown worked out on the page, before anyone types anything. */
export const BP_EXAMPLES = Object.freeze([500, 1000, 2000, 5000, 10000, 30000, 150000, 400000]);
