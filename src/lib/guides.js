/* ──────────────────────────────────────────────────────────────────
 * lib/guides.js (guides1): every guide on the site, newest first.
 *
 * Read from src/content/guides/*.md at build (vite-plugins/guides.js).
 * In the browser each guide's `html` is empty: the page arrives as
 * finished HTML, so the site's script carries only what the list needs.
 * ────────────────────────────────────────────────────────────────── */

const files = import.meta.glob('../content/guides/*.md', { eager: true });

export const GUIDES = Object.freeze(
  Object.values(files)
    .map((m) => Object.freeze({ ...m.meta, html: m.html }))
    .sort((a, b) => (a.published === b.published ? a.title.localeCompare(b.title) : b.published.localeCompare(a.published)))
);

export const guidePath = (slug) => `/guides/${slug}`;
export const guideBySlug = (slug) => GUIDES.find((g) => g.slug === slug) ?? null;

/** "18 October 2026", from 2026-10-18, the same on the server and in any browser. */
export const longDate = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
