/* ──────────────────────────────────────────────────────────────────
 * Marketing routes (remvo.app)
 *
 * Partners + Agreement removed. They live on partners.remvo.app
 * now and are reached via the PARTNERS_ROUTES constant below.
 * ────────────────────────────────────────────────────────────────── */

export const ROUTES = {
  HOME: '/',
  TERMS: '/terms',
  PRIVACY: '/privacy',
  AML: '/aml',
  REFUNDS: '/refunds',
  CONTACT: '/contact',
};

/* ──────────────────────────────────────────────────────────────────
 * Partners routes (partners.remvo.app)
 *
 * Mounted via partnersRouter. The agreement is at /agreement on the
 * partners host (was /partners/agreement on the marketing host).
 * ────────────────────────────────────────────────────────────────── */

export const PARTNERS_ROUTES = {
  HOME: '/',
  AGREEMENT: '/agreement',
};

export const BRAND = {
  NAME: 'Remvo',
  LEGAL_NAME: 'Remvo Labs Limited',
  RC_NUMBER: '9550568',
  DOMAIN: 'remvo.app',
  EMAIL: 'partners@remvolabs.com',
};

export const EXTERNAL = {
  WHATSAPP: 'https://wa.me/2348000000000',
  EMAIL: 'mailto:partners@remvolabs.com',
};

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
