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
 * Front matter is a small, strict subset: `key: value` lines, and lists
 * as indented `- item` lines under a `key:` line. Anything else stops
 * the build with the file and line, rather than shipping a guide with a
 * field quietly missing.
 * ────────────────────────────────────────────────────────────────── */

import { basename } from 'node:path';
import { Marked } from 'marked';

const REQUIRED = ['title', 'description', 'short', 'published', 'checked', 'action', 'topic'];
// The topic gives a guide its ink and its cover picture (pages/guides/GuideArt.jsx).
export const TOPICS = ['bulk', 'drafts', 'listing', 'fees', 'postage', 'selling'];
const ACTIONS = ['listing', 'bulk', 'scan', 'calculator', 'calculator-uk', 'chat'];
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export const slugOf = (file) => basename(file, '.md');

const headingId = (text) => text.toLowerCase().replace(/<[^>]+>/g, '').replace(/&[a-z#0-9]+;/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function parseFrontMatter(source, file) {
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
  for (const key of REQUIRED) if (!meta[key]) throw new Error(`${file}: front matter needs "${key}"`);
  for (const key of ['published', 'checked']) if (!DATE.test(meta[key])) throw new Error(`${file}: ${key} must be YYYY-MM-DD`);
  if (!ACTIONS.includes(meta.action)) throw new Error(`${file}: action must be one of ${ACTIONS.join(', ')}`);
  if (!TOPICS.includes(meta.topic)) throw new Error(`${file}: topic must be one of ${TOPICS.join(', ')}`);
  if (meta.description.length > 160) throw new Error(`${file}: description is ${meta.description.length} characters; keep it to 160`);
  if (/—/.test(source)) throw new Error(`${file}: has an em dash`);
  meta.sources = (meta.sources ?? []).map((s) => {
    const [label, url] = s.split(' | ');
    if (!url || !/^https:\/\//.test(url)) throw new Error(`${file}: a source must be "Label | https://..."`);
    return { label: label.trim(), url: url.trim() };
  });
  meta.related = meta.related ?? [];
  return { meta, body: m[2] };
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
        if (depth === 2) headings.push({ id, n: step ? Number(step[1]) : null, text: (step ? step[2] : text).replace(/<[^>]+>/g, '') });
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
  return {
    name: 'remvo-guides',
    configResolved(config) { serve = config.command === 'serve'; },
    transform(source, id, options) {
      if (!/\/src\/content\/guides\/[^/]+\.md$/.test(id)) return null;
      const { meta, body } = parseFrontMatter(source, id);
      const { html, headings, minutes } = renderBody(body);
      const full = { ...meta, slug: slugOf(id), headings, minutes };
      const ship = options?.ssr || serve ? html : '';
      return { code: `export const meta = ${JSON.stringify(full)};\nexport const html = ${JSON.stringify(ship)};\n`, map: null };
    },
  };
}
