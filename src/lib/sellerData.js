/* ──────────────────────────────────────────────────────────────────
 * lib/sellerData.js
 *
 * PREVIEW DATA. Everything the signed-in app shows, other than who is
 * signed in, comes from here: credits, history, listings, top-ups.
 * It is shaped exactly as the real API will be (GET /v1/my/summary,
 * /jobs, /jobs/:id, POST /jobs, /topups ...) so that wiring the real
 * thing is this one file, and no screen changes.
 *
 * It lives in this browser only (localStorage, per account), starts
 * from a believable seed, and never charges anything. PREVIEW is true
 * while it is in use, and the app says so in its header.
 *
 * Money rules it follows, from product-spec-02:
 *   1 credit = 10p. Packs £5 / £20 / £50 = 50 / 200 / 500 credits.
 *   A listing reserves its credits at start, takes them on delivery,
 *   returns them if it fails.
 *   Credits expire 12 months after the newest top-up (every top-up
 *   extends the whole balance). Oldest spent first.
 * ────────────────────────────────────────────────────────────────── */

import { PRICING } from '@utils/constants';

export const PREVIEW = true;

const DAY = 86_400_000;
const LISTING_CREDITS = PRICING.JOBS.LISTING.credits;
const EXPIRY_MONTHS = PRICING.EXPIRY_MONTHS;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const iso = (t) => new Date(t).toISOString();
const plusMonths = (t, m) => { const d = new Date(t); d.setMonth(d.getMonth() + m); return d.getTime(); };
const rid = (prefix, n = 8) => `${prefix}${Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 32]).join('')}`;

// ══════════════════════════════════════════════════════════════════
//  Products the preview can "find". The real job reads these from the
//  product page; here a barcode or link picks one by its digits.
// ══════════════════════════════════════════════════════════════════

const PRODUCTS = [
  {
    key: 'bottle',
    source: 'Insulated Stainless Steel Water Bottle, 750ml, Black',
    listing: {
      title: 'Insulated Stainless Steel Water Bottle 750ml Double Wall Leak Proof Lid Black',
      description: 'A double-walled stainless steel bottle that keeps drinks cold for 24 hours and hot for 12. The screw lid seals fully, so it can go in a bag on its side.\n\nKey features\n\n- Double-wall vacuum insulation\n- Leak-proof screw lid with carry loop\n- 18/8 food-grade stainless steel\n- Powder-coated finish for grip\n- Fits most car cup holders\n\nWhat\'s in the box\n\n- 1 x 750ml bottle with lid\n\nSize and weight\n\n- 26.5 x 7.3 cm\n- 380 g\n\nGood to know\n\n- Hand wash only\n- Not suitable for carbonated drinks',
      category: { id: '177022', path: 'Sporting Goods > Camping & Hiking > Hydration > Water Bottles' },
      specifics: [['Brand', 'Unbranded'], ['Type', 'Water Bottle'], ['Material', 'Stainless Steel'], ['Capacity', '750 ml'], ['Colour', 'Black'], ['Features', 'Insulated, Leak Proof']],
      parcel: { l: 28, w: 10, h: 10, kg: 0.45, band: 'Royal Mail small parcel' },
      price: { value: 14.99, median: 15.2, listings: 23 },
    },
  },
  {
    key: 'lego',
    source: 'LEGO Classic Medium Creative Brick Box 10696',
    listing: {
      title: 'LEGO Classic 10696 Medium Creative Brick Box 484 Pieces Age 4+ New Sealed',
      description: 'A box of 484 LEGO bricks in 35 colours, with windows, eyes and wheels for building whatever comes to mind. Comes in a plastic storage tub with a lid.\n\nKey features\n\n- 484 pieces in 35 colours\n- Includes windows, eyes and 8 tyres with rims\n- Reusable storage tub\n- Ideas booklet included\n\nWhat\'s in the box\n\n- 484 LEGO pieces\n- Storage tub with lid\n- Ideas booklet\n\nGood to know\n\n- Ages 4 and up\n- Not suitable for children under 3: small parts',
      category: { id: '183448', path: 'Toys & Games > Building Toys > LEGO Building Toys > LEGO Complete Sets & Packs' },
      specifics: [['Brand', 'LEGO'], ['LEGO Theme', 'Classic'], ['LEGO Set Number', '10696'], ['Number of Pieces', '484'], ['Age Level', '4+'], ['Packaging', 'Box']],
      parcel: { l: 38, w: 27, h: 19, kg: 1.2, band: 'Royal Mail small parcel' },
      price: { value: 24.99, median: 25.5, listings: 41 },
    },
  },
  {
    key: 'alarm',
    source: 'Aico Ei3016 Mains Optical Smoke Alarm with Lithium Backup',
    listing: {
      title: 'Aico Ei3016 Mains Optical Smoke Alarm 10 Year Lithium Battery Backup Ei3000',
      description: 'A mains-powered optical smoke alarm with a sealed 10-year lithium backup cell, from the Ei3000 range. Interconnects with other Ei3000 alarms.\n\nKey features\n\n- Optical smoke sensor\n- 230V mains with rechargeable lithium backup\n- Interconnects by wire or RadioLINK module\n- Test and hush button\n\nWhat\'s in the box\n\n- 1 x Ei3016 alarm\n- Mounting base\n\nGood to know\n\n- Fitting by a qualified electrician\n- Needs the Ei3000MRF module for wireless interconnect',
      category: { id: '20716', path: 'Home, Furniture & DIY > Home Security > Smoke Alarms' },
      specifics: [['Brand', 'Aico'], ['Model', 'Ei3016'], ['MPN', 'Ei3016'], ['Type', 'Smoke Alarm'], ['Power Source', 'Mains, Battery Backup'], ['Sensor Type', 'Optical']],
      parcel: { l: 15, w: 15, h: 7, kg: 0.4, band: 'Royal Mail small parcel' },
      price: { value: 27.49, median: 28.0, listings: 17 },
    },
  },
  {
    key: 'mat',
    source: 'Non-Slip Yoga Mat 6mm, Purple, with Carry Strap',
    listing: {
      title: 'Non Slip Yoga Mat 6mm Thick Exercise Fitness Pilates Mat with Carry Strap Purple',
      description: 'A 6mm mat for yoga, pilates and floor exercise, with a textured surface on both sides so it stays put on wooden and tiled floors.\n\nKey features\n\n- 6mm cushioning\n- Textured non-slip surface on both sides\n- Rolls up with the carry strap included\n- Wipes clean\n\nWhat\'s in the box\n\n- 1 x mat\n- 1 x carry strap\n\nSize and weight\n\n- 183 x 61 cm\n- 900 g',
      category: { id: '158919', path: 'Sporting Goods > Fitness, Running & Yoga > Yoga & Pilates > Mats' },
      specifics: [['Brand', 'Unbranded'], ['Type', 'Yoga Mat'], ['Thickness', '6 mm'], ['Colour', 'Purple'], ['Length', '183 cm'], ['Width', '61 cm']],
      parcel: { l: 63, w: 15, h: 15, kg: 1.1, band: 'Royal Mail small parcel' },
      price: { value: 12.99, median: 13.5, listings: 58 },
    },
  },
];

const productFor = (value) => {
  const n = [...String(value)].reduce((s, c) => s + c.charCodeAt(0), 0);
  return PRODUCTS[n % PRODUCTS.length];
};

// ══════════════════════════════════════════════════════════════════
//  Input: what the seller typed, read the way the real job will
// ══════════════════════════════════════════════════════════════════

/** A GTIN (EAN-8, UPC-A, EAN-13, GTIN-14) with a correct check digit. */
export function isBarcode(s) {
  if (!/^\d{8}$|^\d{12,14}$/.test(s)) return false;
  const d = s.split('').map(Number);
  const check = d.pop();
  const sum = d.reverse().reduce((a, x, i) => a + x * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
}

/** The ASIN from an Amazon UK product link, or null. */
export function asinOf(s) {
  try {
    const u = new URL(s);
    if (!/(^|\.)amazon\.co\.uk$/i.test(u.hostname)) return null;
    const m = /\/(?:dp|gp\/product)\/([A-Z0-9]{10})(?:[/?]|$)/i.exec(u.pathname + '/');
    return m ? m[1].toUpperCase() : null;
  } catch { return null; }
}

/**
 * What an input is, before any credits are spent.
 * @returns {{ kind: 'barcode'|'link', value: string } | { error: string }}
 */
export function readInput(raw) {
  const s = String(raw ?? '').trim();
  if (!s) return { error: 'Enter a barcode or an Amazon UK link.' };
  const digits = s.replace(/[\s-]/g, '');
  if (/^\d+$/.test(digits)) {
    if (!isBarcode(digits)) return { error: 'That barcode does not check out. Barcodes are 8, 12, 13 or 14 digits; check for a missing or extra digit.' };
    return { kind: 'barcode', value: digits };
  }
  if (/^https?:\/\//i.test(s) || /amazon\./i.test(s)) {
    const asin = asinOf(/^https?:/i.test(s) ? s : `https://${s}`);
    if (!asin) return { error: 'Use a product link from amazon.co.uk. It has /dp/ followed by ten letters and numbers.' };
    return { kind: 'link', value: `https://www.amazon.co.uk/dp/${asin}` };
  }
  return { error: 'Enter a barcode (the numbers under the stripes) or an Amazon UK product link.' };
}

// ══════════════════════════════════════════════════════════════════
//  The store, one per account, in this browser
// ══════════════════════════════════════════════════════════════════

const keyFor = (accountId) => `remvo.preview.${accountId}`;

function seed(now) {
  const t1 = now - 12 * DAY;
  const t2 = now - 2 * DAY;
  const lots = [
    { id: 'lot_seed1', credits: 200, remaining: 200, boughtAt: iso(t1), pounds: 20 },
    { id: 'lot_seed2', credits: 50, remaining: 50, boughtAt: iso(t2), pounds: 5 },
  ];
  const ledger = [
    { id: rid('led_'), at: iso(t1), kind: 'topup', credits: 200, label: 'Top-up £20' },
    { id: rid('led_'), at: iso(t2), kind: 'topup', credits: 50, label: 'Top-up £5' },
  ];
  const jobs = [];
  const inputs = [
    ['barcode', '5012345678900', 11.2], ['link', 'https://www.amazon.co.uk/dp/B07FKR6KXF', 9.6], ['barcode', '5702016616392', 6.1],
    ['barcode', '4006381333931', 3.4], ['link', 'https://www.amazon.co.uk/dp/B0BX4SPR5Q', 1.7], ['barcode', '5060324512876', 0.3],
  ];
  for (const [kind, value, daysAgo] of inputs) {
    const p = productFor(value);
    jobs.push({
      id: rid('job_'), ref: rid('L-', 6), createdAt: iso(now - daysAgo * DAY), status: 'ready',
      input: { kind, value }, credits: LISTING_CREDITS, source: p.source, listing: structuredClone(p.listing),
    });
  }
  jobs.push({
    id: rid('job_'), ref: rid('L-', 6), createdAt: iso(now - 4.2 * DAY), status: 'failed',
    input: { kind: 'barcode', value: '5000000000009' }, credits: 0, source: null, listing: null,
    failure: 'Amazon UK has no product for this barcode. Try the product link instead.',
  });
  jobs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  // Spend for the seeded jobs, oldest credits first, as the real ledger would.
  const store = { lots, ledger, jobs };
  for (const j of [...jobs].reverse()) {
    if (j.status === 'ready') {
      spend(store, j.credits);
      store.ledger.push({ id: rid('led_'), at: j.createdAt, kind: 'job', credits: -j.credits, label: 'Listing', jobId: j.id });
    } else {
      store.ledger.push({ id: rid('led_'), at: j.createdAt, kind: 'job', credits: -LISTING_CREDITS, label: 'Listing', jobId: j.id });
      store.ledger.push({ id: rid('led_'), at: j.createdAt, kind: 'refund', credits: LISTING_CREDITS, label: 'Returned: listing failed', jobId: j.id });
    }
  }
  store.ledger.sort((a, b) => b.at.localeCompare(a.at));
  return store;
}

function spend(store, credits) {
  let left = credits;
  for (const lot of [...store.lots].sort((a, b) => a.boughtAt.localeCompare(b.boughtAt))) {
    const take = Math.min(lot.remaining, left);
    lot.remaining -= take;
    left -= take;
    if (left === 0) break;
  }
  if (left > 0) throw new Error('not enough credits');
}

function refund(store, credits) {
  const newest = [...store.lots].sort((a, b) => b.boughtAt.localeCompare(a.boughtAt))[0];
  if (newest) newest.remaining += credits;
}

const memory = new Map();

function load(accountId) {
  if (memory.has(accountId)) return memory.get(accountId);
  let store = null;
  try { store = JSON.parse(localStorage.getItem(keyFor(accountId)) || 'null'); } catch { store = null; }
  if (!store || !Array.isArray(store.jobs)) store = seed(Date.now());
  memory.set(accountId, store);
  return store;
}

function save(accountId) {
  try { localStorage.setItem(keyFor(accountId), JSON.stringify(memory.get(accountId))); } catch { /* private mode */ }
}

const listeners = new Set();
const changed = () => listeners.forEach((fn) => fn());
export const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

// ══════════════════════════════════════════════════════════════════
//  Reads
// ══════════════════════════════════════════════════════════════════

/**
 * The account's money and activity at a glance.
 * @returns {{ balance: number, pence: number, listingsLeft: number, expiresAt: string|null,
 *             ready: number, thisMonth: number }}
 */
export function summary(accountId) {
  const s = load(accountId);
  const balance = s.lots.reduce((a, l) => a + l.remaining, 0);
  const newest = s.lots.reduce((m, l) => (l.boughtAt > m ? l.boughtAt : m), '');
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  return {
    balance,
    pence: balance * PRICING.CREDIT_PENCE,
    listingsLeft: Math.floor(balance / LISTING_CREDITS),
    expiresAt: newest && balance > 0 ? iso(plusMonths(Date.parse(newest), EXPIRY_MONTHS)) : null,
    ready: s.jobs.filter((j) => j.status === 'ready').length,
    thisMonth: s.jobs.filter((j) => j.status === 'ready' && Date.parse(j.createdAt) >= monthStart.getTime()).length,
  };
}

export const jobs = (accountId) => load(accountId).jobs;
export const job = (accountId, id) => load(accountId).jobs.find((j) => j.id === id) ?? null;
export const history = (accountId) => load(accountId).ledger;

// ══════════════════════════════════════════════════════════════════
//  Make a listing
// ══════════════════════════════════════════════════════════════════

export const STEPS = [
  'Reading the product page',
  'Finding its eBay category',
  'Filling in the item specifics',
  'Measuring the parcel',
  'Checking prices on eBay UK',
  'Writing the title and description',
];

export class NotEnoughCredits extends Error {
  constructor() { super(`A listing uses ${LISTING_CREDITS} credits. Top up to make this one.`); this.name = 'NotEnoughCredits'; }
}

/**
 * Before any credits move: what the input is, and whether a barcode
 * matches more than one product (the seller picks, for free).
 */
export async function lookUp(accountId, raw) {
  await wait(500);
  const read = readInput(raw);
  if (read.error) return read;
  if (read.kind === 'barcode' && read.value.endsWith('7')) {
    // The preview's stand-in for "Amazon lists several products for this barcode".
    const a = productFor(read.value);
    const b = PRODUCTS[(PRODUCTS.indexOf(a) + 1) % PRODUCTS.length];
    return { ...read, matches: [{ key: a.key, title: a.source }, { key: b.key, title: b.source }] };
  }
  return { ...read, matches: null };
}

/**
 * Run a listing job. onStep(i) fires as each of STEPS completes.
 * @returns {Promise<object>} the finished job
 */
export async function makeListing(accountId, { kind, value, matchKey = null }, onStep = () => {}) {
  const s = load(accountId);
  if (summary(accountId).balance < LISTING_CREDITS) throw new NotEnoughCredits();

  const job = {
    id: rid('job_'), ref: rid('L-', 6), createdAt: iso(Date.now()), status: 'running',
    input: { kind, value }, credits: LISTING_CREDITS, source: null, listing: null,
  };
  spend(s, LISTING_CREDITS);
  s.jobs.unshift(job);
  s.ledger.unshift({ id: rid('led_'), at: job.createdAt, kind: 'job', credits: -LISTING_CREDITS, label: 'Listing', jobId: job.id });
  save(accountId); changed();

  for (let i = 0; i < STEPS.length; i++) {
    await wait(550 + Math.round(Math.random() * 500));
    onStep(i);
    // The preview's stand-in for "the product page could not be read".
    if (i === 0 && kind === 'barcode' && value.endsWith('9')) {
      job.status = 'failed';
      job.credits = 0;
      job.failure = 'Amazon UK has no product for this barcode. Try the product link instead.';
      refund(s, LISTING_CREDITS);
      s.ledger.unshift({ id: rid('led_'), at: iso(Date.now()), kind: 'refund', credits: LISTING_CREDITS, label: 'Returned: listing failed', jobId: job.id });
      save(accountId); changed();
      return job;
    }
  }

  const p = matchKey ? PRODUCTS.find((x) => x.key === matchKey) : productFor(value);
  job.status = 'ready';
  job.source = p.source;
  job.listing = structuredClone(p.listing);
  save(accountId); changed();
  return job;
}

/** Delete a listing. Its credits stay spent: the work was done. */
export async function deleteJob(accountId, id) {
  await wait(250);
  const s = load(accountId);
  s.jobs = s.jobs.filter((j) => j.id !== id);
  save(accountId); changed();
}

// ══════════════════════════════════════════════════════════════════
//  Top-up. The real one opens Polar's checkout and the credits arrive
//  by webhook; the preview adds them after a pause.
// ══════════════════════════════════════════════════════════════════

export async function topUp(accountId, pounds) {
  const pack = PRICING.PACKS.find((p) => p.pounds === pounds);
  if (!pack) throw new Error('Unknown pack');
  await wait(1200);
  const s = load(accountId);
  const at = iso(Date.now());
  s.lots.push({ id: rid('lot_'), credits: pack.credits, remaining: pack.credits, boughtAt: at, pounds });
  s.ledger.unshift({ id: rid('led_'), at, kind: 'topup', credits: pack.credits, label: `Top-up £${pounds}` });
  save(accountId); changed();
  return summary(accountId);
}

/** Start the preview again from the seed. */
export function resetPreview(accountId) {
  memory.delete(accountId);
  try { localStorage.removeItem(keyFor(accountId)); } catch { /* private mode */ }
  changed();
}

// ══════════════════════════════════════════════════════════════════
//  A listing as a file
// ══════════════════════════════════════════════════════════════════

const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

/** One row per field, readable in Excel or Numbers and easy to copy from. */
export function listingCsv(job) {
  const l = job.listing;
  const rows = [
    ['Field', 'Value'],
    ['Title', l.title],
    ['Description', l.description],
    ['Category', l.category.path],
    ['Category ID', l.category.id],
    ...l.specifics.map(([k, v]) => [`Item specific: ${k}`, v]),
    ['Parcel size (cm)', `${l.parcel.l} x ${l.parcel.w} x ${l.parcel.h}`],
    ['Parcel weight (kg)', l.parcel.kg],
    ['Postage', l.parcel.band],
    ['Suggested price (GBP)', l.price.value.toFixed(2)],
    ['Job reference', job.ref],
  ];
  return '﻿' + rows.map((r) => r.map(cell).join(',')).join('\r\n');
}
