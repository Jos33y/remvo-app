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
};

/* The seller app. Its own host, chosen by App.jsx, so nothing from it
 * ships in the marketing chunk. */
export const APP_URL = 'https://my.remvo.app';
export const APP_LINKS = {
  SIGN_IN: `${APP_URL}/sign-in`,
  TOP_UP: `${APP_URL}/billing`,
};

export const BRAND = {
  NAME: 'Remvo',
  LEGAL_NAME: 'Remvo Labs Limited',
  RC_NUMBER: '9550568',
  DOMAIN: 'remvo.app',
  /* Registered office, as on the CAC register. The Privacy Policy
   * names it because a data controller has to give an address. */
  ADDRESS: '5 Funmilayo Awodiya Close, Ige Estate, Lagos, Nigeria',

  /* Sellers write here about their account, a job or a refund. */
  EMAIL: 'support@remvolabs.com',

  /* Company, legal and data protection enquiries. The address on the
   * CAC register. */
  LEGAL_EMAIL: 'hello@remvolabs.com',

  /* Paused corridor only. Not used by the marketing site. Kept so the
   * checkout and admin trees still build. */
  PARTNERS_EMAIL: 'partners@remvolabs.com',
};

/* Paused corridor only. Not used by the marketing site. */
export const EXTERNAL = {
  WHATSAPP: 'https://wa.me/2348162438553',
  EMAIL: 'mailto:partners@remvolabs.com',
};

/* ──────────────────────────────────────────────────────────────────
 * Pricing (product-spec-02, sections 04 and 12)
 *
 * Every page that shows a price reads it from here, so the figure
 * set by the metered run is a one-line change. Prices exclude VAT;
 * Polar adds it at checkout where it applies.
 * ────────────────────────────────────────────────────────────────── */

export const PRICING = Object.freeze({
  CREDIT_PENCE: 10,
  PACKS: Object.freeze([
    { pounds: 5, credits: 50, featured: false },
    { pounds: 20, credits: 200, featured: true },
    { pounds: 50, credits: 500, featured: false },
  ]),
  JOBS: Object.freeze({
    LISTING: { name: 'Make a listing', credits: 3, live: true },
    CHECK: { name: 'Check a product', credits: null, live: false },
  }),
  EXPIRY_MONTHS: 12,
  REFUND_DAYS: 14,
  RESULT_DAYS: 90,
  /* Notice given before a job's credit cost changes. */
  NOTICE_DAYS: 14,
});

/* Whole listings a pack buys at the current job cost. */
export function listingsFor(credits) {
  return Math.floor(credits / PRICING.JOBS.LISTING.credits);
}

/* The date shown on every legal page, and its machine form. */
export const LEGAL_UPDATED = { label: '9 October 2026', iso: '2026-10-09', version: 'v2.0' };

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
