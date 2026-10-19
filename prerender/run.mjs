/* ──────────────────────────────────────────────────────────────────
 * prerender/run.mjs: the marketing pages as real HTML, at build
 *
 * Runs after `vite build` and the server build of
 * src/app/entry-server.jsx (see package.json "build"). For every page
 * in src/lib/seo.js it writes dist/<path>/index.html with:
 *
 *   - the page's full text, rendered by React (Google reads it without
 *     running any script, and the browser hydrates it);
 *   - its own title, description, canonical address, Open Graph and
 *     Twitter tags, and structured data where there is any;
 *   - the stylesheets and script chunks the marketing site needs, so it
 *     is styled on first paint and its code starts loading at once;
 *   - no loading screen.
 *
 * Also: dist/404.html (the not-found page, served with status 404),
 * dist/app.html (the untouched app shell, for my.remvo.app and
 * admin.remvo.app, marked noindex) and dist/sitemap.xml.
 *
 * Fails the build on anything unexpected, rather than shipping a page
 * without its text.
 * ────────────────────────────────────────────────────────────────── */

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const SSR = join(ROOT, 'dist-ssr', 'entry-server.js');

function fail(message) {
  console.error(`prerender: ${message}`);
  process.exit(1);
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const between = (html, name) => new RegExp(`\\s*<!-- ${name}:start[^>]*-->[\\s\\S]*?<!-- ${name}:end -->`, 'g');

if (!existsSync(SSR)) fail(`no server build at ${SSR}`);
const template = readFileSync(join(DIST, 'index.html'), 'utf8');
for (const marker of ['seo:start', 'seo:end', 'loader:start', 'loader:end', '<div id="root"></div>']) {
  if (!template.includes(marker)) fail(`index.html has lost "${marker}"`);
}

// ── What the marketing chunk needs: its stylesheets and its scripts ──
const manifestPath = join(DIST, '.vite', 'manifest.json');
if (!existsSync(manifestPath)) fail('no dist/.vite/manifest.json (build.manifest in vite.config.js)');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const css = new Set();
const js = new Set();
(function walk(key) {
  const entry = manifest[key];
  if (!entry) fail(`manifest has no ${key}`);
  if (entry.isEntry) return; // main.jsx: index.html already loads its script and stylesheet
  if (js.has(entry.file)) return;
  js.add(entry.file);
  for (const c of entry.css ?? []) css.add(c);
  for (const i of entry.imports ?? []) walk(i);
})('src/app/MarketingApp.jsx');

const font = Object.values(manifest).flatMap((e) => e.assets ?? []).find((a) => /geist-latin-wght-normal-[\w-]+\.woff2$/.test(a));
// The headlines' serif (site1): preloaded too, so the first headline is
// drawn in it rather than swapped in after.
const serif = Object.values(manifest).flatMap((e) => e.assets ?? []).find((a) => /instrument-serif-latin-400-normal-[\w-]+\.woff2$/.test(a));

const { render, PAGES, NOT_FOUND, canonical, OG_IMAGE, structuredData, GUIDES, HELP } = await import(pathToFileURL(SSR).href);

function head(path, meta) {
  const url = canonical(path);
  const lines = [
    `<title>${esc(meta.title)}</title>`,
    `<meta name="description" content="${esc(meta.description)}" />`,
    meta.noindex ? '<meta name="robots" content="noindex" />' : `<link rel="canonical" href="${url}" />`,
    '<meta name="author" content="Remvo Labs Limited" />',
    `<meta property="og:image" content="${OG_IMAGE}" />`,
    '<meta property="og:image:width" content="1200" />',
    '<meta property="og:image:height" content="630" />',
    '<meta property="og:image:alt" content="Stop typing eBay listings by hand. A real Remvo listing for an Energizer speaker, $137.99." />',
    '<meta property="og:type" content="website" />',
    `<meta property="og:title" content="${esc(meta.title)}" />`,
    `<meta property="og:description" content="${esc(meta.description)}" />`,
    `<meta property="og:url" content="${url}" />`,
    '<meta property="og:site_name" content="Remvo" />',
    '<meta property="og:locale" content="en_GB" />',
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:image" content="${OG_IMAGE}" />`,
    `<meta name="twitter:title" content="${esc(meta.title)}" />`,
    `<meta name="twitter:description" content="${esc(meta.description)}" />`,
    ...(font ? [`<link rel="preload" href="/${font}" as="font" type="font/woff2" crossorigin />`] : []),
    ...(serif ? [`<link rel="preload" href="/${serif}" as="font" type="font/woff2" crossorigin />`] : []),
    ...[...css].map((c) => `<link rel="stylesheet" crossorigin href="/${c}" />`),
    ...[...js].map((f) => `<link rel="modulepreload" crossorigin href="/${f}" />`),
  ];
  const data = structuredData(path);
  if (data) lines.push(`<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`);
  return `\n  ${lines.join('\n  ')}`;
}

async function page(path, meta, out) {
  const { html } = await render(path === '/404' ? '/this-page-does-not-exist' : path);
  if (!html.includes('<main')) fail(`${path} rendered without its <main>`);
  const doc = template
    .replace(between(template, 'seo'), head(path, meta))
    .replace(between(template, 'loader'), '')
    .replace('<div id="root"></div>', `<div id="root">${html}</div>`);
  if (doc.includes('app-loader')) fail(`${path} still has the loader`);
  const file = join(DIST, out);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, doc);
  return file;
}

// The app shell for my.remvo.app and admin.remvo.app, before index.html is replaced.
writeFileSync(
  join(DIST, 'app.html'),
  template.replace('<meta charset="UTF-8" />', '<meta charset="UTF-8" />\n  <meta name="robots" content="noindex, nofollow" />')
);

const written = [];
for (const [path, meta] of Object.entries(PAGES)) {
  written.push(await page(path, meta, path === '/' ? 'index.html' : join(path.slice(1), 'index.html')));
}
written.push(await page('/404', NOT_FOUND, '404.html'));

const urls = Object.entries(PAGES).map(([path, meta]) =>
  `  <url><loc>${canonical(path)}</loc>${meta.updated ? `<lastmod>${meta.updated}</lastmod>` : ''}</url>`);
writeFileSync(join(DIST, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);

// guides1: each guide as plain Markdown beside its page (/guides/<slug>.md),
// for AI tools and agents, and llms.txt listing the site for them.
const strip = (md) => md.replace(/^---[\s\S]*?\n---\r?\n?/, '').trim();
for (const g of GUIDES) {
  const source = join(ROOT, 'src', 'content', 'guides', `${g.slug}.md`);
  if (!existsSync(source)) fail(`no source for guide ${g.slug}`);
  const md = [
    `# ${g.title}`,
    '',
    `In short: ${g.short}`,
    '',
    strip(readFileSync(source, 'utf8')),
    '',
    '## Sources',
    '',
    ...g.sources.map((x) => `- [${x.label}](${x.url})`),
    '',
    `Checked ${g.checked} by Joseph at Remvo. Page: ${canonical(`/guides/${g.slug}`)}`,
    '',
  ].join('\n');
  writeFileSync(join(DIST, 'guides', `${g.slug}.md`), md);
}
// help1: the same for help pages (/help/<slug>.md).
for (const h of HELP) {
  const source = join(ROOT, 'src', 'content', 'help', `${h.slug}.md`);
  if (!existsSync(source)) fail(`no source for help page ${h.slug}`);
  const md = [
    `# ${h.title}`,
    '',
    `In short: ${h.short}`,
    '',
    ...(h.video ? [`Video (${h.duration}): https://www.youtube.com/watch?v=${h.video}`, ''] : []),
    strip(readFileSync(source, 'utf8')),
    '',
    `Checked against Remvo on ${h.checked}. Page: ${canonical(`/help/${h.slug}`)}`,
    '',
  ].join('\n');
  writeFileSync(join(DIST, 'help', `${h.slug}.md`), md);
}
const site = Object.entries(PAGES).filter(([path, m]) => !m.noindex && !m.guide && !m.help);
writeFileSync(join(DIST, 'llms.txt'), [
  '# Remvo',
  '',
  '> Software that prepares eBay listings from a barcode or a product link: title, description, category, item specifics, parcel size and weight, and a price from live eBay listings, in about 20 seconds, or up to 500 at once with an eBay drafts file. Pay as you go: $0.30 (£0.24) a listing, no subscription. Remvo never asks for the eBay login; the seller publishes. Made by Remvo Labs Limited, Lagos, Nigeria. Not made or endorsed by eBay.',
  '',
  '## Pages',
  '',
  ...site.map(([path, m]) => `- [${m.title.replace(/ \| Remvo$/, '').replace(/^Remvo \| /, '')}](${canonical(path)}): ${m.description}`),
  '',
  '## Guides',
  '',
  ...GUIDES.map((g) => `- [${g.title}](${canonical(`/guides/${g.slug}`)}.md): ${g.short}`),
  '',
  '## Help: using Remvo',
  '',
  ...HELP.map((h) => `- [${h.title}](${canonical(`/help/${h.slug}`)}.md): ${h.short}`),
  '',
].join('\n'));

// The manifest has done its job; it is not for the public site.
rmSync(join(DIST, '.vite'), { recursive: true, force: true });

console.log(`prerender: ${written.length} pages, app.html, sitemap.xml (${Object.keys(PAGES).length} URLs), llms.txt, ${GUIDES.length} guide${GUIDES.length === 1 ? '' : 's'} and ${HELP.length} help page${HELP.length === 1 ? '' : 's'} as Markdown`);
