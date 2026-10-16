/* ──────────────────────────────────────────────────────────────────
 * lib/devData.js: the break-the-UI fixtures (remvo_break_ui_plan.md)
 *
 * Development only. lib/sellerApi.js asks here before calling the API
 * when the app runs under `vite` (import.meta.env.DEV); a production
 * build drops this file entirely.
 *
 *   ?data=worst   every field at its realistic worst
 *   ?data=empty   a new account: nothing made, nothing bought
 *   ?data=one     one of everything
 *   ?data=huge    1,200 listings and a 500-line batch
 *   ?data=real    back to the real API
 *   ?balance=N    any balance, with any of the above (0, 1, 2, 100350)
 *
 *
 * The choice is kept for the tab (sessionStorage), so it survives
 * moving between screens. The data changes, never the component.
 * Every value is something a real product, seller or eBay produces.
 * ────────────────────────────────────────────────────────────────── */

export const MODES = Object.freeze(['real', 'worst', 'empty', 'one', 'huge']);
const KEY = 'remvo.devData';
const BALANCE_KEY = 'remvo.devBalance';

function store(key, value) {
  try {
    if (value == null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, value);
  } catch { /* private window: the URL still works for this load */ }
}
function stored(key) {
  try { return sessionStorage.getItem(key); } catch { return null; }
}

/** Reads ?data= and ?balance= once per load, then remembers them. */
export function devMode() {
  const q = new URLSearchParams(window.location.search);
  if (q.has('data')) store(KEY, MODES.includes(q.get('data')) && q.get('data') !== 'real' ? q.get('data') : null);
  if (q.has('balance')) store(BALANCE_KEY, /^\d{1,7}$/.test(q.get('balance')) ? q.get('balance') : null);
  return { mode: stored(KEY) ?? 'real', balance: stored(BALANCE_KEY) };
}

export function setDevMode(mode, balance = undefined) {
  store(KEY, mode === 'real' ? null : mode);
  if (balance !== undefined) store(BALANCE_KEY, balance);
  const url = new URL(window.location.href);
  url.searchParams.delete('data');
  url.searchParams.delete('balance');
  window.location.replace(url.toString());
}

// ── Building blocks ──

const NOW = Date.now();
const ago = (mins) => new Date(NOW - mins * 60_000).toISOString();
const ahead = (days) => new Date(NOW + days * 86_400_000).toISOString();
const STEPS = ['Reading the product page', 'Finding the eBay category', 'Filling the item specifics', 'Measuring the parcel', 'Checking prices', 'Writing the title and description'];

// Product photos without the network: a drawn product on white, as Amazon shoots them.
const PHOTO = (fill, shape) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#fff"/>${shape.replace(/F/g, fill)}</svg>`)}`;
const SPEAKER = PHOTO('#d8c9a8', '<rect x="22" y="30" width="56" height="44" rx="14" fill="F"/><circle cx="50" cy="52" r="12" fill="#00000022"/>');
const CHARGER = PHOTO('#222', '<rect x="34" y="14" width="32" height="72" rx="6" fill="F"/><rect x="44" y="20" width="12" height="3" rx="1.5" fill="#4af"/>');
const DRILL = PHOTO('#1b6f8a', '<path d="M20 30h46v18H44v30H30V48H20z" fill="F"/><rect x="66" y="35" width="18" height="6" fill="#999"/>');

const LONG_EMAIL = 'bartholomew.fitzgerald+ebay-wholesale@northwind-liquidation-holdings.example.com';
const LONG_LINK = 'https://www.amazon.co.uk/Philips-Shaver-Series-Electric-Precision/dp/B0CB5MZXW8/ref=sr_1_3?crid=2QK7ZJ0X8W1&keywords=philips+shaver&qid=1728912345&sprefix=philips%2Caps%2C89&sr=8-3&th=1';
const LONG_CATEGORY = 'Home & Garden > Kitchen, Dining & Bar > Small Kitchen Appliances > Coffee Makers, Espresso Machines & Accessories > Espresso Machines';

const THIRTY_SPECIFICS = [
  ['Brand', 'Anker'], ['Model', 'A1263 PowerCore 10000'], ['MPN', 'A1263011'], ['Type', 'Power Bank'],
  ['Compatible Brand', 'Apple, Samsung, Google'], ['Compatible Model', 'Compatible with iPhone 15, iPhone 15 Pro, Samsung Galaxy S23, Pix'],
  ['Battery Capacity', '10000 mAh'], ['Connectivity', 'USB-A, USB-C'], ['Number of Ports', '2'], ['Output Power', '12 W'],
  ['Input', 'USB-C 5 V 2 A'], ['Color', 'Black'], ['Features', 'PowerIQ, Trickle-Charging Mode, LED Indicator'],
  ['Material', 'Plastic'], ['Item Weight', '6.35 oz'], ['Item Length', '3.6 in'], ['Item Width', '2.3 in'], ['Item Height', '0.9 in'],
  ['California Prop 65 Warning', 'This product can expose you to chemicals including lead, which is known to the State of California to cause cancer.'],
  ['Country/Region of Manufacture', 'China'], ['Charging Time', '5 h'], ['Cable Included', 'Yes'], ['Wireless Charging', 'No'],
  ['Fast Charging', 'No'], ['Display', 'LED'], ['Unit Quantity', '1'], ['Unit Type', 'Unit'], ['Character Family', 'None'],
  ['Custom Bundle', 'No'], ['Manufacturer Warranty', '18 months'],
];

const listing = (over = {}) => ({
  site: 'eBay.com', language: 'English', alternative: null, condition: 'New', condition_id: 1000, missing: [], notes: [],
  category: { id: '111694', path: 'Consumer Electronics > Portable Audio & Headphones > Audio Docks & Mini Speakers' },
  title: 'Energizer BTS356 Wireless Bluetooth Speaker Waterproof Magnetic Power Bank Beige',
  description: 'Energizer BTS356 is a rugged portable Bluetooth speaker in beige with a built-in magnet.',
  specifics: [['Brand', 'Energizer'], ['Model', 'BTS356'], ['Color', 'Beige']],
  identifiers: { brand: 'Energizer', mpn: 'BTS356', gtin: '842982108097' },
  parcel: { l: 8, w: 4, h: 4, weight: 2, oz: 2, units: 'imperial', band: 'USPS Ground Advantage' },
  price: { value: 137.99, median: 139.5, low: 119.99, high: 159.99, listings: 9, by: 'median', currency: 'USD' },
  ...over,
});

let seq = 0;
const ref = () => `L-${(++seq).toString(36).toUpperCase().padStart(6, 'X')}`;
const jobId = () => `job_dev${String(seq).padStart(17, '0')}`;

function job({ status = 'ready', input = { kind: 'barcode', value: '842982108097' }, marketplace = 'US', source = null, l = {}, mins = 5, batchId = null, failure = null, step } = {}) {
  const r = ref();
  return {
    id: jobId(), ref: r, batchId, status, createdAt: ago(mins), finishedAt: status === 'ready' || status === 'failed' ? ago(mins - 1) : null,
    input, marketplace, condition: 'new', credits: status === 'failed' ? 0 : 3,
    step: step ?? (status === 'ready' ? 6 : status === 'running' ? 2 : 0), steps: STEPS,
    source: source ?? { title: 'Energizer BTS356 Bluetooth Speaker', url: 'https://www.amazon.com/dp/B0EXAMPLE', image: SPEAKER, amazon: 'amazon.com' },
    listing: status === 'ready' ? listing(l) : null, edits: {}, failure: status === 'failed' ? failure : null,
  };
}

// ── The worst case, spread across rows as real data is ──

function worstJobs() {
  seq = 0;
  return [
    job({ status: 'running', input: { kind: 'link', value: LONG_LINK }, source: { title: null, url: LONG_LINK, image: null, amazon: 'amazon.co.uk' }, marketplace: 'UK', mins: 1 }),
    job({ status: 'queued', input: { kind: 'barcode', value: '5000394203693' }, source: null, mins: 1 }),
    job({ status: 'running', source: { title: 'Anker Portable Charger, Power Bank, 10,000mAh Battery Pack with PowerIQ Charging Technology and USB-C (Input Only) for iPhone 15/15 Pro/15 Pro Max, Samsung Galaxy S23, Pixel and More', url: 'https://www.amazon.com/dp/B0194WDVHI', image: CHARGER, amazon: 'amazon.com' }, mins: 2 }),
    job({ mins: 8, input: { kind: 'barcode', value: '848061039423' }, source: { title: 'Anker PowerCore 10000', url: 'https://www.amazon.com/dp/B0194WDVHI', image: 'https://example.invalid/broken.jpg', amazon: 'amazon.com' },
      l: { title: 'Anker PowerCore 10000 Portable Charger 10000mAh Power Bank USB-C Black A1263 New', specifics: THIRTY_SPECIFICS,
        category: { id: '20612', path: LONG_CATEGORY }, parcel: { l: 24, w: 18, h: 14, weight: 46, oz: 0, units: 'imperial', band: 'USPS Ground Advantage' },
        price: { value: 12499, median: 12500, low: 11999, high: 12999, listings: 1, by: 'median', currency: 'USD' },
        alternative: 'Anker A1263 PowerCore 10000 mAh Power Bank, USB-C Input, Black, Boxed, Brand New',
        missing: ['Compatible Model', 'Features'] } }),
    job({ mins: 30, marketplace: 'DE', input: { kind: 'barcode', value: '4059952513839' },
      source: { title: 'Bosch Professional 18V System Akku-Bohrschrauber GSR 18V-55 (inkl. 2x 2,0 Ah Akku, Ladegerät GAL 18V-20, Zusatzhandgriff, L-BOXX)', url: 'https://www.amazon.de/dp/B07XYZ1234', image: DRILL, amazon: 'amazon.de' },
      l: { site: 'eBay.de', language: 'German', title: 'Bosch Professional GSR 18V-55 Akku-Bohrschrauber 2x 2,0 Ah Akku Ladegerät L-BOXX',
        category: { id: '122838', path: 'Heimwerker > Elektrowerkzeuge > Bohrmaschinen & Akkuschrauber' },
        parcel: { l: 40, w: 32, h: 12, weight: 3.4, units: 'metric', band: 'DHL Paket' },
        price: { value: 12499, median: 12499, low: 11000, high: 13999, listings: 3, by: 'median', currency: 'EUR' } } }),
    job({ mins: 90, marketplace: 'FR', input: { kind: 'barcode', value: '5025155028681' },
      l: { site: 'eBay.fr', language: 'French', title: "Aspirateur balai sans fil Dyson V8 Absolute, autonomie jusqu'à 40 min, gris",
        parcel: { l: 26, w: 22, h: 72, weight: null, units: 'metric', band: 'Colissimo' },
        price: { value: null, median: null, low: null, high: null, listings: 0, by: null, currency: 'EUR' } } }),
    job({ mins: 200, input: { kind: 'barcode', value: '5010415241062' },
      source: { title: 'TOMMEE TIPPEE CLOSER TO NATURE BABY BOTTLES 260ML X3 ANTI-COLIC VALVE', url: 'https://www.amazon.com/dp/B00XYZ', image: null, amazon: 'amazon.com' },
      l: { title: 'TOMMEE TIPPEE CLOSER TO NATURE BABY BOTTLES 260ML X3 ANTI-COLIC VALVE BPA FREE', parcel: null,
        category: null, missing: ['category'], identifiers: { brand: 'Tommee Tippee', mpn: null, gtin: null } } }),
    job({ mins: 600, input: { kind: 'barcode', value: '841667174051' }, source: { title: 'Echo Dot', url: 'https://www.amazon.com/dp/B09B8V1LZ3', image: null, amazon: 'amazon.com' },
      l: { title: 'Echo Dot', parcel: { l: 4, w: 4, h: 4, weight: 0, oz: 9, units: 'imperial', band: 'USPS Ground Advantage' } } }),
    job({ status: 'failed', mins: 1400, input: { kind: 'barcode', value: '012345678905' }, failure: 'Amazon has no product for this barcode on amazon.com. Check the number, or paste the product page link instead.' }),
    job({ mins: 3000, l: { title: 'Philips Norelco Shaver 3900 Wet Dry Electric Razor Pop-up Trimmer Blue S3311/85', parcel: { l: 8, w: 4, h: 4, weight: null, units: 'imperial', band: 'USPS Ground Advantage' } } }),
  ];
}

function batchLines(total, batchId, mix) {
  const lines = [];
  for (let i = 0; i < total; i += 1) {
    const k = mix(i);
    const id = `job_devline${String(i).padStart(13, '0')}`;
    lines.push({
      id, ref: `L-B${i.toString(36).toUpperCase().padStart(5, '0')}`, status: k, condition: 'new', step: k === 'running' ? 3 : k === 'ready' ? 6 : 0,
      input: { kind: 'barcode', value: String(5000394000000 + i) },
      title: k === 'ready' ? (i % 7 === 0 ? 'Bosch Professional GSR 18V-55 Akku-Bohrschrauber 2x 2,0 Ah Akku Ladegerät L-BOXX' : 'Philips Norelco Shaver 3900 Wet Dry Electric Razor Pop-up Trimmer Blue S3311/85') : null,
      product: k === 'queued' ? null : 'Anker Portable Charger, Power Bank, 10,000mAh Battery Pack with PowerIQ Charging Technology and USB-C (Input Only) for iPhone 15/15 Pro/15 Pro Max, Samsung Galaxy S23, Pixel and More',
      price: k === 'ready' ? { value: i % 11 === 0 ? 12499 : 37.99, currency: 'USD' } : null,
      picked: k === 'ready' && i % 9 === 0 ? { of: 5 } : null,
      missing: k === 'ready' && i % 13 === 0 ? ['Compatible Model', 'Features'] : [],
      failure: k === 'failed' ? (i % 2 ? 'Amazon has no product for this barcode on amazon.com. Check the number, or paste the product page link instead.' : 'Not a barcode.') : null,
    });
  }
  const counts = { queued: 0, running: 0, ready: 0, failed: 0 };
  lines.forEach((l) => { counts[l.status] += 1; });
  return { lines, counts };
}

function batch(id, refName, total, mix, mins = 20) {
  const { lines, counts } = batchLines(total, id, mix);
  const running = counts.queued + counts.running > 0;
  return {
    id, ref: refName, status: running ? 'running' : 'done', marketplace: 'US', condition: 'new', total, counts,
    createdAt: ago(mins), finishedAt: running ? null : ago(mins - 15), lines,
  };
}

const everyStatus = (i) => (i < 3 ? 'failed' : i < 280 ? 'ready' : i < 284 ? 'running' : 'queued');

function supportThread(mode) {
  if (mode === 'empty') return { id: null, ref: null, status: null, unread: 0, messages: [] };
  const csv = ['barcode,condition', ...Array.from({ length: 40 }, (_, i) => `${5000394203600 + i},new`)].join('\n');
  const messages = [
    { id: '1', from: 'you', body: 'Hello. Half of these came back as needing a look, can you see why?', at: ago(90) },
    { id: '2', from: 'you', body: csv, at: ago(89) },
    { id: '3', from: 'remvo', body: `Thanks. Lines 4 and 9 are 12 digits with a letter in them. The rest are fine. More here: ${LONG_LINK}`, at: ago(60) },
  ];
  return { id: 'chat_dev0000000000000001', ref: 'C-DEV001', status: 'open', unread: 1, messages: mode === 'one' ? messages.slice(0, 1) : messages };
}

function history(mode) {
  if (mode === 'empty') return [{ id: '1', at: ago(5), kind: 'welcome', credits: 3, jobId: null, amountCents: null, currency: null, note: 'Welcome credits' }];
  const rows = [
    { id: '9', at: ago(10), kind: 'job', credits: -1500, jobId: null, amountCents: null, currency: null, note: 'B-GC6SNQ' },
    { id: '8', at: ago(12), kind: 'job_return', credits: 3, jobId: 'job_x', amountCents: null, currency: null, note: 'L-9GSHF4' },
    { id: '7b', at: ago(60 * 24 * 3), kind: 'bonus', credits: 150, jobId: null, amountCents: null, currency: null, note: 'Volume bonus' },
    { id: '7', at: ago(60 * 24 * 3), kind: 'topup', credits: 100000, jobId: null, amountCents: 1000000, currency: 'USD', note: null },
    { id: '6', at: ago(60 * 24 * 40), kind: 'topup', credits: 50, jobId: null, amountCents: 0, currency: 'USD', note: null },
    { id: '5', at: ago(60 * 24 * 41), kind: 'refund', credits: -50, jobId: null, amountCents: 500, currency: 'GBP', note: null },
    { id: '4', at: ago(60 * 24 * 45), kind: 'expiry', credits: -3, jobId: null, amountCents: null, currency: null, note: 'Welcome credits' },
    { id: '3', at: ago(60 * 24 * 70), kind: 'job', credits: -3, jobId: 'job_y', amountCents: null, currency: null, note: 'L-KMHKB6' },
    { id: '2', at: ago(60 * 24 * 74), kind: 'grant', credits: 1, jobId: null, amountCents: null, currency: null, note: null },
    { id: '1', at: ago(60 * 24 * 75), kind: 'welcome', credits: 3, jobId: null, amountCents: null, currency: null, note: 'Welcome credits' },
  ];
  return mode === 'one' ? rows.slice(-1) : rows;
}

// ── Each mode as the API would answer it ──

function build(mode, balanceOverride) {
  let jobs = [];
  let batches = [];
  let balance = 197;
  let expiresAt = ahead(300);
  let welcome = null;

  if (mode === 'worst') {
    jobs = worstJobs();
    batches = [batch('bat_dev000000000000000001', 'B-WORST1', 500, everyStatus, 5)];
    balance = 100350;
    expiresAt = ahead(3);
    welcome = { credits: 3, expiresAt: ahead(2) };
  } else if (mode === 'empty') {
    balance = 3;
    expiresAt = null;
    welcome = { credits: 3, expiresAt: ahead(30) };
  } else if (mode === 'one') {
    seq = 0;
    jobs = [job({ mins: 3 })];
    batches = [batch('bat_dev000000000000000001', 'B-ONE001', 1, () => 'ready', 30)];
    balance = 1;
  } else if (mode === 'huge') {
    seq = 0;
    jobs = Array.from({ length: 1200 }, (_, i) => job({ mins: 5 + i * 30, status: i % 40 === 7 ? 'failed' : 'ready', failure: 'Not a barcode.' }));
    batches = [batch('bat_dev000000000000000001', 'B-HUGE01', 500, (i) => (i < 8 ? 'failed' : i < 420 ? 'ready' : 'queued'), 10),
      ...Array.from({ length: 30 }, (_, i) => batch(`bat_dev${String(i + 2).padStart(18, '0')}`, `B-OLD${String(i).padStart(3, '0')}`, 120, (k) => (k < 2 ? 'failed' : 'ready'), 2000 + i * 1440))];
    balance = 4200;
  }
  if (balanceOverride != null) {
    balance = Number(balanceOverride);
    if (balance < (welcome?.credits ?? 0)) welcome = balance ? { credits: balance, expiresAt: welcome.expiresAt } : null;
    if (balance === 0) expiresAt = null;
  }
  const bought = balance - (welcome?.credits ?? 0);
  return {
    me: { account: { id: 'acc_dev0000000000000000', email: mode === 'worst' ? LONG_EMAIL : 'seller@example.com', name: mode === 'worst' ? 'Bartholomew-Alexander' : null, hasPassword: true, createdAt: ago(60 * 24 * 75) } },
    wallet: {
      balance, expiresAt: bought > 0 ? expiresAt : null, welcome,
      worth: { cents: Math.max(0, bought) * 10, currency: 'USD' },
      settings: { marketplace: 'US', currency: 'USD', settingsSetAt: ago(60 * 24 * 75) },
      topUpsEnabled: true, listingsEnabled: true, listingCredits: 3,
      // worst: the peak is on (every bonus showing); one: Polar has only the first three packs set up.
      packs: mode === 'one'
        ? [{ credits: 50, volumeBonus: 0, peakBonus: 0, total: 50 }, { credits: 200, volumeBonus: 0, peakBonus: 0, total: 200 }, { credits: 500, volumeBonus: 50, peakBonus: 0, total: 550 }]
        : mode === 'worst'
          ? [{ credits: 50, volumeBonus: 0, peakBonus: 0, total: 50 }, { credits: 200, volumeBonus: 0, peakBonus: 40, total: 240 }, { credits: 500, volumeBonus: 50, peakBonus: 100, total: 650 }, { credits: 1000, volumeBonus: 150, peakBonus: 200, total: 1350 }]
          : null,
      peak: mode === 'worst' ? { percent: 20, minCredits: 200, endsAt: '2026-12-02T00:00:00Z' } : null,
    },
    history: history(mode),
    jobs,
    batches,
    support: supportThread(mode),
  };
}

// GET /summary, worked out from the fixture's own listings, in local days.
function weekOf(jobs) {
  const key = (t) => { const x = new Date(t); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
  const days = Array.from({ length: 7 }, (_, i) => ({ date: key(NOW - (6 - i) * 86_400_000), ready: 0, failed: 0 }));
  const byDate = new Map(days.map((x) => [x.date, x]));
  const value = new Map();
  for (const j of jobs) {
    const day = byDate.get(key(j.createdAt));
    if (!day || (j.status !== 'ready' && j.status !== 'failed')) continue;
    day[j.status] += 1;
    const p = j.status === 'ready' ? j.listing?.price : null;
    if (p?.value != null) {
      const v = value.get(p.currency) ?? { currency: p.currency, total: 0, priced: 0 };
      v.total += p.value; v.priced += 1; value.set(p.currency, v);
    }
  }
  return {
    tz: 'UTC', days,
    week: { ready: days.reduce((n, x) => n + x.ready, 0), failed: days.reduce((n, x) => n + x.failed, 0), value: [...value.values()].sort((a, b) => b.total - a.total) },
    allTime: { ready: jobs.filter((j) => j.status === 'ready').length },
  };
}

const PAGE = 50;
let cache = null;

/**
 * The fixture's answer to a call, or undefined to let the call reach
 * the API. Throws the way the API would where the mode calls for it.
 */
export async function devAnswer(method, path, body, ApiError) {
  const { mode, balance } = devMode();
  if (mode === 'real') return undefined;
  if (!cache || cache.key !== `${mode}:${balance}`) cache = { key: `${mode}:${balance}`, data: build(mode, balance) };
  const d = cache.data;
  await new Promise((r) => { setTimeout(r, 120); });

  const [route, query = ''] = path.split('?');
  const q = new URLSearchParams(query);
  const page = (items) => {
    const before = q.get('before');
    const from = before ? items.findIndex((x) => x.id === before) + 1 : 0;
    const slice = items.slice(from, from + PAGE);
    return { items: slice, next: from + PAGE < items.length ? slice.at(-1).id : null };
  };

  if (method === 'GET') {
    if (route === '/me') return d.me;
    if (route === '/me/passkeys') return { items: [] };
    if (route === '/wallet') return d.wallet;
    if (route === '/wallet/history') return page(d.history);
    if (route === '/jobs') return page(d.jobs);
    if (route.startsWith('/jobs/')) {
      const j = d.jobs.find((x) => x.id === decodeURIComponent(route.slice(6)));
      if (!j) throw new ApiError(404, 'not_found', 'That could not be found.');
      return { job: j };
    }
    if (route === '/batches') return { items: d.batches.map(({ lines, ...b }) => b) };
    if (route.startsWith('/batches/')) {
      const b = d.batches.find((x) => x.id === decodeURIComponent(route.slice(9)));
      if (!b) throw new ApiError(404, 'not_found', 'That could not be found.');
      return { batch: b };
    }
    if (route === '/support') return { chat: d.support };
    if (route === '/summary') return weekOf(d.jobs);
  }

  if (method === 'POST' && route === '/batches/check') {
    const problemsWorst = [
      { line: 4, raw: 'https://www.amazon.com/s?k=philips+norelco+shaver+3900&crid=2QK7ZJ0X8W1&sprefix=philips+norelco%2Caps%2C142&ref=nb_sb_noss_1', reason: 'That is an Amazon search, not a product page. Open the product and paste its link.' },
      { line: 9, raw: '50003942O3693', reason: 'A barcode is numbers only. This one has a letter in it: check for an O that should be a 0.' },
      ...Array.from({ length: 6 }, (_, i) => ({ line: 40 + i * 31, raw: '12345', reason: 'Too short for a barcode.' })),
    ];
    const shapes = {
      worst: { lines: 500, ready: 480, duplicates: 12, problems: problemsWorst, tooMany: true, fixed: [{ line: 7, from: '50036384407', to: '050036384407' }] },
      empty: { lines: 3, ready: 0, duplicates: 0, problems: problemsWorst.slice(0, 3), tooMany: false, fixed: [] },
      one: { lines: 1, ready: 1, duplicates: 0, problems: [], tooMany: false, fixed: [] },
      huge: { lines: 500, ready: 500, duplicates: 0, problems: [], tooMany: false, fixed: [] },
    }[mode];
    return {
      marketplace: 'US', condition: body?.condition ?? 'new', column: null, conditionColumn: null, maxRows: 500,
      ...shapes, creditsEach: 3, credits: shapes.ready * 3, balance: d.wallet.balance,
    };
  }

  if (method === 'POST' && route === '/jobs/lookup') {
    if (mode === 'one') return { kind: 'barcode', value: body.input, amazon: 'US', product: { asin: 'B0194WDVHI', title: 'Echo Dot', image: null }, matches: null };
    return {
      kind: 'barcode', value: body.input, amazon: 'US', product: null,
      matches: [
        { asin: 'B0194WDVHI', title: 'Anker Portable Charger, Power Bank, 10,000mAh Battery Pack with PowerIQ Charging Technology and USB-C (Input Only) for iPhone 15/15 Pro/15 Pro Max, Samsung Galaxy S23, Pixel and More', image: null },
        { asin: 'B07XYZ1234', title: 'Bosch Professional 18V System Akku-Bohrschrauber GSR 18V-55 (inkl. 2x 2,0 Ah Akku, Ladegerät GAL 18V-20, Zusatzhandgriff, L-BOXX)', image: 'https://example.invalid/broken.jpg' },
        { asin: 'B09B8V1LZ3', title: 'Echo Dot', image: null },
        { asin: 'B00XYZABCD', title: 'TOMMEE TIPPEE CLOSER TO NATURE BABY BOTTLES 260ML X3 ANTI-COLIC VALVE', image: null },
        { asin: 'B0CB5MZXW8', title: 'Philips Norelco Shaver 3900 Wet Dry Electric Razor Pop-up Trimmer Blue S3311/85', image: null },
      ],
    };
  }

  // Anything that would spend, pay or change data: say so, never pretend.
  console.warn(`devData: no fixture for ${method} ${path}`);
  throw new ApiError(503, 'dev_fixture', `Fixture data (${mode}): this action needs the real API. Switch to Real in the dev bar.`);
}
