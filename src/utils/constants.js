/* ──────────────────────────────────────────────────────────────────
 * Marketing routes (remvo.app)
 *
 * October 2026: remvo.app sells listing jobs to eBay sellers. The
 * legal paths keep the addresses they already had, so nothing that
 * was indexed breaks. /aml is gone with the corridor.
 * ────────────────────────────────────────────────────────────────── */

export const ROUTES = {
  HOME: '/',
  HOW: '/how-it-works',
  PRICING: '/pricing',
  TERMS: '/terms',
  PRIVACY: '/privacy',
  REFUNDS: '/refunds',
  CREDITS: '/credits',
  CONTACT: '/contact',
  EXAMPLE: '/example',
  /* tools1: the free eBay fee calculators. */
  FEES_US: '/ebay-fee-calculator',
  FEES_UK: '/ebay-fee-calculator-uk',
};

/* The seller app. Its own host, chosen by App.jsx, so nothing from it
 * ships in the marketing chunk. In dev it is the same Vite server with
 * ?my (see App.jsx), so links never leave localhost. */
export const APP_URL = import.meta.env.DEV ? 'http://localhost:5173' : 'https://my.remvo.app';
const DEV_FLAG = import.meta.env.DEV ? '?my' : '';
export const APP_LINKS = {
  SIGN_IN: `${APP_URL}/sign-in${DEV_FLAG}`,
  /* "Make your first listing" buttons: straight to opening an account. */
  SIGN_UP: `${APP_URL}/sign-up${DEV_FLAG}`,
  TOP_UP: `${APP_URL}/billing${DEV_FLAG}`,
  BULK: `${APP_URL}/listings/bulk${DEV_FLAG}`,
};

/* The marketing site, for links from the seller app back to it. In dev
 * it is the same Vite server, and ?site switches the browser back from
 * the seller app (see App.jsx). */
export const SITE_URL = import.meta.env.DEV ? 'http://localhost:5173' : 'https://remvo.app';
export const siteUrl = (path = '/') => `${SITE_URL}${path}${import.meta.env.DEV ? '?site' : ''}`;

/* Support with a reason (chat3): where in the app they asked from, and
 * the listing or batch it is about, so the message starts itself. */
export const supportPath = (about, ref = null) => `/support?about=${encodeURIComponent(about)}${ref ? `&ref=${encodeURIComponent(ref)}` : ''}`;

/* Routes inside the seller app (my.remvo.app). */
export const SELLER_ROUTES = {
  HOME: '/',
  SIGN_IN: '/sign-in',
  SIGN_UP: '/sign-up',
  VERIFY: '/sign-in/verify',
  /* From the set-or-reset password email: #t= in the fragment. */
  SET_PASSWORD: '/sign-in/password',
  // emails1: where the link to turn Joseph's emails off lands (no sign-in).
  EMAILS_OFF: '/emails-off',
  LISTINGS: '/listings',
  NEW_LISTING: '/listings/new',
  BULK: '/listings/bulk',
  BATCH: '/batches/:id',
  /* world1: one product on several eBay sites. */
  WORLD: '/sites/:id',
  LISTING: '/listings/:id',
  CREDITS: '/credits',
  PROFILE: '/profile',
  SUPPORT: '/support',
  /* The marketing site's Top up links land here: sign in, then credits. */
  BILLING: '/billing',
};

export const listingPath = (id) => `/listings/${id}`;
export const batchPath = (id) => `/batches/${id}`;
export const worldPath = (id) => `/sites/${id}`;

/* What listing one product on several eBay sites costs (world1): one
 * site 3 credits, three 8, all seven 15; each further site 3 more,
 * never past 15. remvo-api's modules/worlds/pricing.js charges it. */
export function worldCredits(n) {
  if (n <= 0) return 0;
  if (n <= 2) return n * 3;
  return Math.min(15, 8 + (n - 3) * 3);
}

export const BRAND = {
  NAME: 'Remvo',
  LEGAL_NAME: 'Remvo Labs Limited',
  RC_NUMBER: '9550568',
  DOMAIN: 'remvo.app',
  /* Where the company is, as the site shows it: the city only (Joseph,
   * 17 October 2026). Remvo has no shop to visit; the RC number on the
   * CAC register identifies the company, and email reaches it. */
  ADDRESS: 'Lagos, Nigeria',

  /* One address for sellers, legal and data protection requests. On
   * the same domain as the site, as Polar requires; Cloudflare routes
   * it to the team inbox. */
  EMAIL: 'support@remvo.app',
  LEGAL_EMAIL: 'support@remvo.app',
};

/* ──────────────────────────────────────────────────────────────────
 * Pricing
 *
 * Every page that shows a price reads it from here, so the figure set
 * by the metered run is a one-line change. Three currencies, the same
 * credits in each: US dollars by default, euros, and pounds set a
 * little lower so a UK seller pays about the same as everyone else.
 * The Polar products carry the same prices; any VAT or sales tax is
 * worked out by Polar at checkout.
 * ────────────────────────────────────────────────────────────────── */

export const PRICING = Object.freeze({
  /* What one credit costs in each currency. */
  CREDIT: Object.freeze({ USD: 0.1, EUR: 0.1, GBP: 0.08 }),
  /* bonus: extra credits on the bigger packs (volume bonus). The API
   * decides what is credited; this mirrors modules/credits/pricing.js. */
  PACKS: Object.freeze([
    { credits: 50, bonus: 0, price: { USD: 5, EUR: 5, GBP: 4 }, featured: false },
    { credits: 200, bonus: 0, price: { USD: 20, EUR: 20, GBP: 16 }, featured: true },
    { credits: 500, bonus: 50, price: { USD: 50, EUR: 50, GBP: 40 }, featured: false },
    { credits: 1000, bonus: 150, price: { USD: 100, EUR: 100, GBP: 80 }, featured: false },
  ]),
  /* Peak season: 20% extra on top-ups of 200 credits or more, 20
   * November to 1 December 2026 (UK time). The API decides. */
  PEAK: Object.freeze({ percent: 20, minCredits: 200, startsAt: '2026-11-20T00:00:00Z', endsAt: '2026-12-02T00:00:00Z', lastDay: '1 December' }),
  /* Any whole amount between these, in the app. */
  CUSTOM: Object.freeze({ min: { USD: 5, EUR: 5, GBP: 4 }, max: { USD: 1000, EUR: 1000, GBP: 800 } }),
  JOBS: Object.freeze({
    LISTING: { name: 'Make a listing', credits: 3, live: true },
    CHECK: { name: 'Check a product', credits: null, live: false },
  }),
  EXPIRY_MONTHS: 12,
  /* A new account's first listing, on us: one listing's credits, for
   * this many days. Not extended by a top-up. The API gives them. */
  WELCOME: Object.freeze({ credits: 3, days: 30 }),
  REFUND_DAYS: 14,
  RESULT_DAYS: 90,
  /* Notice given before a job's credit cost changes. */
  NOTICE_DAYS: 14,
});

/* Whole listings a pack buys at the current job cost. */
export function listingsFor(credits) {
  return Math.floor(credits / PRICING.JOBS.LISTING.credits);
}

/* What a number of credits costs in a currency. */
export function creditsCost(credits, currency) {
  return Math.round(credits * PRICING.CREDIT[currency] * 100) / 100;
}

/* Credits a whole amount buys in a currency. */
export function creditsFor(amount, currency) {
  return Math.floor(Math.round(amount * 100) / Math.round(PRICING.CREDIT[currency] * 100));
}

/* The date shown on every legal page, and its machine form. */
export const LEGAL_UPDATED = { label: '18 October 2026', iso: '2026-10-18', version: 'v2.7' };

/* ── Paused corridor: checkout and admin trees only ── */

export const DENOMINATIONS = [10, 25, 50, 100, 250, 500];

/* ── Checkout routes (pay.remvo.app subdomain) ── */
export const CHECKOUT_ROUTES = {
  LANDING: '/',
  SESSION: '/:token',
  PAYMENT: '/:token/pay',
  COMPLETE: '/:token/complete',
};

/* Helper to build a checkout URL with a real token in place of :token */
export function buildCheckoutPath(template, token) {
  return template.replace(':token', token);
}

/* ──────────────────────────────────────────────────────────────────
 * African corridor countries (Section 7)
 *
 * These are the ISO-3166-1 alpha-2 codes Remvo's launch + near-term
 * roadmap targets. Order is the canonical sort order in admin lists
 * (active markets first, then ordered by GDP / fintech maturity).
 *
 * If we add a new country, add it here AND ensure CountryFlag.jsx
 * has a flag glyph for it. Flags are SVG-stroked at the icon layer.
 * ────────────────────────────────────────────────────────────────── */

export const AFRICAN_COUNTRIES = Object.freeze([
  { code: 'NG', name: 'Nigeria',       currency: 'NGN' },
  { code: 'GH', name: 'Ghana',         currency: 'GHS' },
  { code: 'KE', name: 'Kenya',         currency: 'KES' },
  { code: 'ZA', name: 'South Africa',  currency: 'ZAR' },
  { code: 'EG', name: 'Egypt',         currency: 'EGP' },
  { code: 'UG', name: 'Uganda',        currency: 'UGX' },
  { code: 'TZ', name: 'Tanzania',      currency: 'TZS' },
  { code: 'CI', name: "Cote d'Ivoire", currency: 'XOF' },
]);

/* O(1) lookups derived from the array. Built once at module load. */

export const COUNTRY_NAMES = Object.freeze(
  Object.fromEntries(AFRICAN_COUNTRIES.map((c) => [c.code, c.name]))
);

export const COUNTRY_CURRENCIES = Object.freeze(
  Object.fromEntries(AFRICAN_COUNTRIES.map((c) => [c.code, c.currency]))
);

/**
 * Resolve a country name from an ISO-3166 alpha-2 code. Falls back to
 * the code itself when unknown so the UI never shows blank.
 *
 * @param {string} code
 * @returns {string}
 */
export function countryName(code) {
  return COUNTRY_NAMES[code] || code;
}

/* ──────────────────────────────────────────────────────────────────
 * Country status registry (Section 7)
 *
 * The three states a country can be in inside platform.country_config.
 * Includes copy + colour-token for the StatusBadge variant.
 * ────────────────────────────────────────────────────────────────── */

export const COUNTRY_STATUS = Object.freeze({
  active: {
    label: 'Active',
    description: 'Users in this country can use the checkout.',
    badge: 'active',
  },
  coming_soon: {
    label: 'Coming soon',
    description: 'Users see a waitlist screen; no payment flow.',
    badge: 'coming_soon',
  },
  paused: {
    label: 'Paused',
    description: 'Users see a temporary unavailability screen.',
    badge: 'paused',
  },
});
