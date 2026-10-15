/* ──────────────────────────────────────────────────────────────────
 * lib/sellerData.js
 *
 * What a listing is, on this side: reading what the seller typed, the
 * conditions, the steps a job shows, the listing with the seller's
 * edits laid over it, and the listing as a CSV file.
 *
 * The listings themselves come from remvo-api (lib/sellerJobs.js) and
 * the wallet from lib/sellerWallet.js. The API reads the input again
 * and is the one that decides; readInput() here only saves a round
 * trip for a typo. Kept in step with remvo-api's src/engine/lookup.js.
 * ────────────────────────────────────────────────────────────────── */

import { MARKETPLACE } from '@lib/market';

/* ── Condition: asked before a job, written into the listing ── */

export const CONDITIONS = Object.freeze([
  { id: 'new', label: 'New', hint: 'Sealed, never used' },
  { id: 'new_other', label: 'New other', hint: 'Open box, unused' },
  { id: 'used', label: 'Used', hint: 'Has been used' },
]);
export const CONDITION = Object.freeze(Object.fromEntries(CONDITIONS.map((c) => [c.id, c])));

// ══════════════════════════════════════════════════════════════════
//  Input: what the seller typed
// ══════════════════════════════════════════════════════════════════

/** A GTIN (EAN-8, UPC-A, EAN-13, GTIN-14) with a correct check digit. */
export function isBarcode(s) {
  if (!/^\d{8}$|^\d{12,14}$/.test(s)) return false;
  const d = s.split('').map(Number);
  const check = d.pop();
  const sum = d.reverse().reduce((a, x, i) => a + x * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
}

const AMAZON = /(^|\.)amazon\.(com|ca|co\.uk|de|fr|it|es)$/i;

/** The Amazon site and ASIN from a product link, or null. */
export function asinOf(s) {
  try {
    const u = new URL(s);
    const host = AMAZON.exec(u.hostname);
    if (!host) return null;
    const m = /\/(?:dp|gp\/product|gp\/aw\/d)\/([A-Z0-9]{10})(?:[/?]|$)/i.exec(u.pathname + '/');
    return m ? { domain: `amazon.${host[2].toLowerCase()}`, asin: m[1].toUpperCase() } : null;
  } catch { return null; }
}

/**
 * What an input is, before anything is sent.
 * @returns {{ kind: 'barcode'|'link', value: string } | { error: string }}
 */
export function readInput(raw) {
  const s = String(raw ?? '').trim();
  if (!s) return { error: 'Enter a barcode or an Amazon product link.' };
  const digits = s.replace(/[\s-]/g, '');
  if (/^\d+$/.test(digits)) {
    if (!isBarcode(digits)) return { error: 'That barcode does not check out. Barcodes are 8, 12, 13 or 14 digits; check for a missing or extra digit.' };
    return { kind: 'barcode', value: digits };
  }
  if (/^https?:\/\//i.test(s) || /amazon\./i.test(s)) {
    const found = asinOf(/^https?:/i.test(s) ? s : `https://${s}`);
    if (!found) return { error: 'Use a product link from Amazon (.com, .ca, .co.uk, .de, .fr, .it or .es). It has /dp/ followed by ten letters and numbers.' };
    return { kind: 'link', value: `https://www.${found.domain}/dp/${found.asin}` };
  }
  return { error: 'Enter a barcode (the numbers under the stripes) or an Amazon product link.' };
}

// ══════════════════════════════════════════════════════════════════
//  A job
// ══════════════════════════════════════════════════════════════════

/** What the seller watches while a listing is made, for their eBay site. Same order as the API's steps. */
export const stepsFor = (marketplaceId) => [
  'Reading the product page',
  'Finding its eBay category',
  'Filling in the item specifics',
  'Measuring the parcel',
  `Checking prices on ${(MARKETPLACE[marketplaceId] ?? MARKETPLACE.US).site}`,
  'Writing the title and description',
];

/** The product's name as the app shows it: Amazon's title, or what was typed. */
export const productName = (job) => job?.source?.title ?? null;

/*
 * The listing as the seller will copy it: Remvo's, with their edits.
 * Edits sit beside what Remvo wrote, never over it, so any field can be
 * put back. Keys: title, description, price, and spec:<name>.
 */
export function withEdits(j) {
  if (!j?.listing) return null;
  const e = j.edits ?? {};
  const l = j.listing;
  return {
    ...l,
    title: e.title ?? l.title,
    description: e.description ?? l.description,
    specifics: (l.specifics ?? []).map(([k, v]) => [k, e[`spec:${k}`] ?? v]),
    price: { ...l.price, value: e.price ?? l.price?.value ?? null },
  };
}

/** What eBay calls the barcode box on a site: UPC in North America, EAN in Europe. */
export const barcodeLabel = (marketplaceId) => (['US', 'CA'].includes(marketplaceId) ? 'UPC' : 'EAN');

// ══════════════════════════════════════════════════════════════════
//  A listing as a file
// ══════════════════════════════════════════════════════════════════

const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
const dims = (p) => (p?.l && p?.w && p?.h ? `${p.l} x ${p.w} x ${p.h}` : '');

/** One row per field, readable in Excel or Numbers and easy to copy from. */
export function listingCsv(j) {
  const l = withEdits(j);
  // The site's units, even with no parcel: eBay.com never reads "cm" or "kg".
  const metric = (l.parcel?.units ?? (MARKETPLACE[j.marketplace] ?? MARKETPLACE.US).units) !== 'imperial';
  const id = l.identifiers ?? {};
  const rows = [
    ['Field', 'Value'],
    ['eBay site', (MARKETPLACE[j.marketplace] ?? MARKETPLACE.US).site],
    ['Title', l.title],
    ['Condition', l.condition],
    ['Description', l.description],
    ['Category', l.category?.path ?? ''],
    ['Category ID', l.category?.id ?? ''],
    ['Brand', id.brand ?? ''],
    ['MPN', id.mpn ?? ''],
    [barcodeLabel(j.marketplace), id.gtin ?? ''],
    ...l.specifics.map(([k, v]) => [`Item specific: ${k}`, v]),
    ...(l.missing ?? []).filter((m) => m !== 'category').map((m) => [`Item specific: ${m}`, '']),
    [metric ? 'Parcel size (cm)' : 'Parcel size (in)', dims(l.parcel)],
    ...(metric
      ? [['Parcel weight (kg)', l.parcel?.weight ?? '']]
      : [
        // Seller Hub takes pounds and ounces in two boxes.
        ['Parcel weight (lb)', l.parcel?.weight ?? ''],
        ['Parcel weight (oz)', l.parcel?.weight != null ? l.parcel.oz ?? 0 : ''],
      ]),
    ['Postage', l.parcel?.band ?? ''],
    [`Price (${l.price.currency})`, l.price.value != null ? Number(l.price.value).toFixed(2) : ''],
    ['Job reference', j.ref],
  ];
  return '﻿' + rows.map((r) => r.map(cell).join(',')).join('\r\n');
}
