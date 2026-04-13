export const ROUTES = {
  HOME: '/',
  PARTNERS: '/partners',
  AGREEMENT: '/partners/agreement',
  TERMS: '/terms',
  PRIVACY: '/privacy',
  AML: '/aml',
  REFUNDS: '/refunds',
  CONTACT: '/contact',
};

export const BRAND = {
  NAME: 'Remvo',
  LEGAL_NAME: 'Remvo Labs Limited',
  DOMAIN: 'remvo.app',
  EMAIL: 'partners@remvolabs.com',
};

export const EXTERNAL = {
  WHATSAPP: 'https://wa.me/2348000000000',
  EMAIL: 'mailto:partners@remvolabs.com',
};

export const DENOMINATIONS = [10, 25, 50, 100, 250, 500];

export const SETTLEMENT = {
  ASSET: 'USDT',
  NETWORK: 'Solana',
  SCHEDULE: 'Daily',
};

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