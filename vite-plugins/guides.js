/* ──────────────────────────────────────────────────────────────────
 * vite-plugins/guides.js (guides1)
 *
 * A guide is one Markdown file in src/content/guides/, named by its
 * address: how-to-bulk-list-on-ebay-from-a-spreadsheet.md is
 * remvo.app/guides/how-to-bulk-list-on-ebay-from-a-spreadsheet.
 *
 * At build this turns the file into a module:
 *
 *   export const meta   what the page says about itself (the front
 *                        matter: title, description, the short answer,
 *                        dates, sources, related guides), plus its slug,
 *                        headings and reading time
 *   export const html   the body as HTML, for the server render only.
 *                        The browser gets an empty string: the page
 *                        arrives as finished HTML and the body is taken
 *                        from it (pages/guides/GuidePage.jsx), so the
 *                        site's script does not grow with every guide.
 *                        In development (vite dev) the browser gets it.
 *
 * help1: the same for src/content/help/*.md, the pages at
 * remvo.app/help/<slug>: one task in the app each, with its video (when
 * it is on YouTube), a poster from the app, and the steps. Their front
 * matter is checked by parseHelp below.
 *
 * Front matter is a small, strict subset: `key: value` lines, and lists
 * as indented `- item` lines under a `key:` line. Anything else stops
 * the build with the file and line, rather than shipping a guide with a
 * field quietly missing.
 * ────────────────────────────────────────────────────────────────── */

import { basename, join } from 'node:path';
import { existsSync } from 'node:fs';
import { Marked } from 'marked';

const REQUIRED = ['title', 'description', 'short', 'published', 'checked', 'action', 'topic'];
// The topic gives a guide its ink and its cover picture (pages/guides/GuideArt.jsx).
export const TOPICS = ['bulk', 'drafts', 'listing', 'fees', 'postage', 'selling'];
const ACTIONS = ['listing', 'bulk', 'scan', 'calculator', 'calculator-uk', 'chat'];
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export const slugOf = (file) => basename(file, '.md');

// Headings' text for the contents list, as plain text: no tags, entities decoded.
const plain = (html) => html.replace(/<[^>]+>/g, '').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

const headingId = (text) => text.toLowerCase().replace(/<[^>]+>/g, '').replace(/&[a-z#0-9]+;/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** The front matter's keys and lists, and the body, before any checks. */
function readFrontMatter(source, file) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(source);
  if (!m) throw new Error(`${file}: no front matter (--- at the top)`);
  const meta = {};
  let list = null;
  m[1].split(/\r?\n/).forEach((line, i) => {
    if (!line.trim()) return;
    const item = /^\s+-\s+(.*)$/.exec(line);
    if (item) {
      if (!list) throw new Error(`${file}:${i + 2}: a list item with no list above it`);
      meta[list].push(item[1].trim());
      return;
    }
    const kv = /^([a-z][a-zA-Z]*):\s*(.*)$/.exec(line);
    if (!kv) throw new Error(`${file}:${i + 2}: not "key: value": ${line}`);
    const [, key, value] = kv;
    if (value === '') { meta[key] = []; list = key; } else { meta[key] = value.trim(); list = null; }
  });
  if (/—/.test(source)) throw new Error(`${file}: has an em dash`);
  return { meta, body: m[2] };
}

export function parseFrontMatter(source, file) {
  const { meta, body } = readFrontMatter(source, file);
  for (const key of REQUIRED) if (!meta[key]) throw new Error(`${file}: front matter needs "${key}"`);
  for (const key of ['published', 'checked']) if (!DATE.test(meta[key])) throw new Error(`${file}: ${key} must be YYYY-MM-DD`);
  if (!ACTIONS.includes(meta.action)) throw new Error(`${file}: action must be one of ${ACTIONS.join(', ')}`);
  if (!TOPICS.includes(meta.topic)) throw new Error(`${file}: topic must be one of ${TOPICS.join(', ')}`);
  // The cover picture: its own (art:) or the topic's.
  if (meta.art && !/^[a-z]+$/.test(meta.art)) throw new Error(`${file}: art must be one word, such as pallet`);
  meta.art = meta.art ?? meta.topic;
  if (meta.description.length > 160) throw new Error(`${file}: description is ${meta.description.length} characters; keep it to 160`);
  meta.sources = (meta.sources ?? []).map((s) => {
    const [label, url] = s.split(' | ');
    if (!url || !/^https:\/\//.test(url)) throw new Error(`${file}: a source must be "Label | https://..."`);
    return { label: label.trim(), url: url.trim() };
  });
  meta.related = meta.related ?? [];
  return { meta, body };
}

/* ── help1 ── */
const HELP_REQUIRED = ['title', 'description', 'short', 'section', 'order', 'checked', 'open'];
export const HELP_SECTIONS = ['start', 'listing', 'bulk', 'account', 'tools', 'support'];
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const DURATION = /^(\d{1,2}):([0-5]\d)$/;

/**
 * A help page's front matter:
 *   title, description (160 or fewer), short (the one-line answer),
 *   section (one of HELP_SECTIONS), order (its place in the section),
 *   checked (YYYY-MM-DD, against the app as built),
 *   open ("Label | app:/path" or "Label | site:/path": the one button),
 *   related (help slugs), guide (a guide's slug), optional;
 *   video, duration, uploaded: the YouTube id, "m:ss" and the day it went
 *   up, all three or none. Without them the page shows its poster.
 * The poster is public/help/<slug>.webp, 1280x720, and must exist.
 */
export function parseHelp(source, file, publicDir) {
  const { meta, body } = readFrontMatter(source, file);
  for (const key of HELP_REQUIRED) if (!meta[key]) throw new Error(`${file}: front matter needs "${key}"`);
  if (!HELP_SECTIONS.includes(meta.section)) throw new Error(`${file}: section must be one of ${HELP_SECTIONS.join(', ')}`);
  if (!/^\d+$/.test(meta.order)) throw new Error(`${file}: order must be a whole number`);
  meta.order = Number(meta.order);
  if (!DATE.test(meta.checked)) throw new Error(`${file}: checked must be YYYY-MM-DD`);
  if (meta.description.length > 160) throw new Error(`${file}: description is ${meta.description.length} characters; keep it to 160`);
  const open = /^(.+?) \| (app|site):(\/[^\s]*)$/.exec(meta.open);
  if (!open) throw new Error(`${file}: open must be "Label | app:/path" or "Label | site:/path"`);
  meta.open = { label: open[1].trim(), host: open[2], path: open[3] };
  const video = ['video', 'duration', 'uploaded'].filter((k) => meta[k]);
  if (video.length && video.length < 3) throw new Error(`${file}: a video needs video, duration and uploaded together`);
  if (meta.video) {
    if (!YOUTUBE_ID.test(meta.video)) throw new Error(`${file}: video must be the 11-character YouTube id`);
    const d = DURATION.exec(meta.duration);
    if (!d) throw new Error(`${file}: duration must be m:ss`);
    meta.seconds = Number(d[1]) * 60 + Number(d[2]);
    if (!DATE.test(meta.uploaded)) throw new Error(`${file}: uploaded must be YYYY-MM-DD`);
  } else {
    meta.video = null;
  }
  const slug = slugOf(file);
  meta.poster = `/help/${slug}.webp`;
  if (publicDir && !existsSync(join(publicDir, 'help', `${slug}.webp`))) throw new Error(`${file}: no poster at public${meta.poster}`);
  meta.related = meta.related ?? [];
  meta.guide = meta.guide ?? null;
  return { meta, body };
}

/** The body as HTML: headings get ids, external links open in a new tab, images are lazy and sized. */
export function renderBody(body) {
  const headings = [];
  const marked = new Marked({
    gfm: true,
    renderer: {
      // A step ("## 2. Fill in one row per product") gets its number set
      // apart, for the big numeral and the route between steps; its text
      // still reads "2. Fill in one row per product" to Google and AI tools.
      heading({ tokens, depth }) {
        const text = this.parser.parseInline(tokens);
        const id = headingId(text);
        const step = depth === 2 ? /^(\d+)\.\s+(.*)$/.exec(text) : null;
        if (depth === 2) headings.push({ id, n: step ? Number(step[1]) : null, text: plain(step ? step[2] : text) });
        if (step) return `<h2 id="${id}" class="step"><span class="step-n">${step[1]}<span class="sr-only">.</span></span> <span class="step-t">${step[2]}</span></h2>\n`;
        return `<h${depth} id="${id}">${text}</h${depth}>\n`;
      },
      link({ href, title, tokens }) {
        const text = this.parser.parseInline(tokens);
        const external = /^https?:\/\//.test(href) && !/^https:\/\/(www\.)?remvo\.app/.test(href);
        const t = title ? ` title="${title}"` : '';
        return external
          ? `<a href="${href}"${t} target="_blank" rel="noopener">${text}<span class="sr-only"> (opens in a new tab)</span></a>`
          : `<a href="${href.replace(/^https:\/\/(www\.)?remvo\.app/, '') || '/'}"${t}>${text}</a>`;
      },
      // ![What it shows](/guides/slug/picture.webp "1280x800"): the title is the picture's size, so it never shifts the page.
      image({ href, title, text }) {
        const size = /^(\d+)x(\d+)$/.exec(title ?? '');
        if (!size) throw new Error(`image ${href} needs its size as the title, e.g. "1280x800"`);
        return `<img src="${href}" alt="${text}" width="${size[1]}" height="${size[2]}" loading="lazy" decoding="async" />`;
      },
      table(token) {
        // A table can be wider than a phone: it scrolls on its own, the page never does.
        const head = token.header.map((c) => `<th scope="col">${this.parser.parseInline(c.tokens)}</th>`).join('');
        const rows = token.rows.map((r) => `<tr>${r.map((c, i) => (i === 0 ? `<th scope="row">${this.parser.parseInline(c.tokens)}</th>` : `<td>${this.parser.parseInline(c.tokens)}</td>`)).join('')}</tr>`).join('\n');
        return `<div class="table-scroll" role="region" aria-label="Table" tabindex="0"><table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>\n`;
      },
    },
  });
  const html = marked.parse(body);
  const words = body.replace(/[#*_`>|[\]()-]/g, ' ').split(/\s+/).filter(Boolean).length;
  return { html, headings, minutes: Math.max(1, Math.ceil(words / 200)) };
}

export function guidesPlugin() {
  let serve = false;
  let publicDir = null;
  return {
    name: 'remvo-guides',
    configResolved(config) { serve = config.command === 'serve'; publicDir = config.publicDir; },
    transform(source, id, options) {
      const kind = /\/src\/content\/(guides|help)\/[^/]+\.md$/.exec(id)?.[1];
      if (!kind) return null;
      const { meta, body } = kind === 'help' ? parseHelp(source, id, publicDir) : parseFrontMatter(source, id);
      const { html, headings, minutes } = renderBody(body);
      const full = { ...meta, slug: slugOf(id), headings, minutes };
      const ship = options?.ssr || serve ? html : '';
      return { code: `export const meta = ${JSON.stringify(full)};\nexport const html = ${JSON.stringify(ship)};\n`, map: null };
    },
  };
}
