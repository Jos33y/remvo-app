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

const { render, PAGES, NOT_FOUND, canonical, OG_IMAGE, structuredData } = await import(pathToFileURL(SSR).href);

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
    '<meta property="og:image:alt" content="A finished eBay listing prepared by Remvo from a barcode" />',
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

// The manifest has done its job; it is not for the public site.
rmSync(join(DIST, '.vite'), { recursive: true, force: true });

console.log(`prerender: ${written.length} pages, app.html, sitemap.xml (${Object.keys(PAGES).length} URLs)`);
