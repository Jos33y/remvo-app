/* ──────────────────────────────────────────────────────────────────
 * lib/help.js (help1): every help page on the site, by section.
 *
 * Read from src/content/help/*.md at build (vite-plugins/guides.js).
 * As with guides, each page's `html` is empty in the browser: the page
 * arrives as finished HTML.
 * ────────────────────────────────────────────────────────────────── */

import { APP_URL } from '@utils/constants';

const files = import.meta.glob('../content/help/*.md', { eager: true });

/** The sections, in the order a new seller meets them, each in one of
 * the guides' inks (styles/pages/marketing/help.module.css). */
export const HELP_SECTIONS = Object.freeze([
  { id: 'start', name: 'Getting started', ink: 'listing' },
  { id: 'listing', name: 'Making listings', ink: 'listing' },
  { id: 'bulk', name: 'Bulk listing', ink: 'bulk' },
  { id: 'account', name: 'Credits and your account', ink: 'fees' },
  { id: 'tools', name: 'Free tools', ink: 'fees' },
  { id: 'support', name: 'Getting help', ink: 'selling' },
]);

const SECTION_ORDER = Object.fromEntries(HELP_SECTIONS.map((s, i) => [s.id, i]));

export const HELP = Object.freeze(
  Object.values(files)
    .map((m) => Object.freeze({ ...m.meta, html: m.html }))
    .sort((a, b) => SECTION_ORDER[a.section] - SECTION_ORDER[b.section] || a.order - b.order || a.title.localeCompare(b.title))
);

export const helpPath = (slug) => `/help/${slug}`;
export const helpBySlug = (slug) => HELP.find((h) => h.slug === slug) ?? null;
export const sectionOf = (id) => HELP_SECTIONS.find((s) => s.id === id) ?? HELP_SECTIONS[0];

/** Where a help page's button goes: a screen in the app, or a page on this site. */
export function openHref({ host, path }) {
  return host === 'app' ? `${APP_URL}${path}${import.meta.env.DEV ? '?my' : ''}` : path;
}

/** "1:05" as words, for a screen reader: "1 minute 5 seconds". */
export function spokenDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const part = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
  return [m ? part(m, 'minute') : '', s ? part(s, 'second') : ''].filter(Boolean).join(' ');
}

/** ISO 8601 duration for VideoObject: 65 → "PT1M5S". */
export const isoDuration = (seconds) => `PT${Math.floor(seconds / 60)}M${seconds % 60}S`;
