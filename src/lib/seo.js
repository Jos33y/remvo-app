/* ──────────────────────────────────────────────────────────────────
 * lib/seo.js
 *
 * What each marketing page says about itself to Google and to a link
 * preview: title, description, whether it is in the sitemap. One
 * place, read by the build (prerender/run.mjs writes it into each
 * page's HTML) and by PageShell (keeps it right as a visitor moves
 * between pages without a reload).
 *
 * Titles: what the page is first, then "| Remvo"; the home page leads
 * with the brand. Descriptions: one or two plain sentences, under 160
 * characters, true of the product as built. No dashes.
 * ────────────────────────────────────────────────────────────────── */

import { LEGAL_UPDATED, ROUTES } from '@utils/constants';
import { GUIDES, guidePath } from '@lib/guides';
import { HELP, helpPath } from '@lib/help';

export const SITE_ORIGIN = 'https://remvo.app';
export const OG_IMAGE = `${SITE_ORIGIN}/og-remvo-1200x630.png`;

export const PAGES = Object.freeze({
  [ROUTES.HOME]: {
    title: 'Remvo | eBay listings done for you in 20 seconds',
    description: 'Stop typing eBay listings by hand. Paste a product link or a barcode: title, description, category, item specifics, parcel and price. $0.30 a finished listing.',
  },
  [ROUTES.HOW]: {
    title: 'How it works | Remvo',
    description: 'A barcode or a product link in, every eBay field back: title, category, item specifics, parcel and a price from live listings. One at a time, or 500 in bulk.',
  },
  [ROUTES.EXAMPLE]: {
    title: 'A real eBay listing made from one barcode | Remvo',
    description: 'Every field Remvo wrote for a JBL Flip 6 from its barcode: title, category, 9 item specifics, parcel, a price from live eBay.com listings.',
  },
  [ROUTES.FEES_US]: {
    title: 'eBay fee calculator: what eBay.com takes, what you keep | Remvo',
    description: 'Free eBay.com fee calculator. Type the sale price and your costs to see the final value fee, the per-order fee, your profit, margin and break-even price. No account.',
    updated: '2026-10-17',
  },
  [ROUTES.FEES_UK]: {
    title: 'eBay UK fee calculator for private and business sellers | Remvo',
    description: 'Free eBay.co.uk fee calculator. Private or business, with or without VAT, by category: see what eBay takes and what you keep after your costs. No account.',
    updated: '2026-10-17',
  },
  [ROUTES.GUIDES]: {
    title: 'Guides for eBay sellers | Remvo',
    description: 'Short guides that each answer one question about selling on eBay: bulk listing, drafts, item specifics, fees. Checked against eBay’s own pages.',
    updated: GUIDES[0]?.checked,
  },
  // guides1: one entry per guide, from its front matter.
  ...Object.fromEntries(GUIDES.map((g) => [guidePath(g.slug), {
    title: `${g.title} | Remvo`,
    description: g.description,
    updated: g.checked,
    guide: true,
  }])),
  // help1: the help pages, one task in the app each.
  [ROUTES.HELP]: {
    title: 'Remvo help: every task, step by step',
    description: 'How to do everything in Remvo, one task at a time: make a listing, scan a barcode, list in bulk, buy credits and talk to a person.',
    updated: HELP.map((h) => h.uploaded ?? h.checked).sort().at(-1),
  },
  ...Object.fromEntries(HELP.map((h) => [helpPath(h.slug), {
    title: `${h.title} | Remvo Help`,
    description: h.description,
    updated: [h.checked, h.uploaded].filter(Boolean).sort().at(-1),
    help: true,
  }])),
  [ROUTES.PRICING]: {
    title: 'Pricing | Remvo',
    description: '$0.30 a finished listing with prepaid credits. No subscription. Your first listing is on us, and a listing that fails gives its credits back.',
  },
  [ROUTES.CONTACT]: {
    title: 'Contact | Remvo',
    description: 'Write to the people who build Remvo. Every message is read and answered within 48 hours.',
  },
  [ROUTES.TERMS]: {
    title: 'Terms of service | Remvo',
    description: 'The agreement between you and Remvo Labs Limited for using Remvo, the software that prepares eBay listings.',
    updated: LEGAL_UPDATED.iso,
  },
  [ROUTES.PRIVACY]: {
    title: 'Privacy policy | Remvo',
    description: 'What Remvo collects, why, who else handles it, how long it is kept, and what you can ask us to do with it.',
    updated: LEGAL_UPDATED.iso,
  },
  [ROUTES.REFUNDS]: {
    title: 'Refund policy | Remvo',
    description: 'A failed listing gives its credits back on its own. Unused credits are refunded in full within 14 days of buying them.',
    updated: LEGAL_UPDATED.iso,
  },
  [ROUTES.CREDITS]: {
    title: 'Credit terms | Remvo',
    description: 'How Remvo credits work: what they cost, what a listing uses, which are spent first, and when they expire.',
    updated: LEGAL_UPDATED.iso,
  },
});

export const NOT_FOUND = Object.freeze({
  title: 'Page not found | Remvo',
  description: 'This page does not exist.',
  noindex: true,
});

/** The page's own address, never with a trailing slash (the home page is "/"). */
export const canonical = (path) => `${SITE_ORIGIN}${path === '/' ? '/' : path.replace(/\/+$/, '')}`;

/** What a path says about itself; unknown paths are the 404 page. */
export const pageMeta = (path) => PAGES[path.replace(/(.)\/+$/, '$1')] ?? NOT_FOUND;
