import { useEffect, useState } from 'react';

/* ──────────────────────────────────────────────────────────────────
 * useStaticBody (guides1, shared with help1 since)
 *
 * A guide's or help page's body is HTML from its Markdown file. It
 * arrives in the prerendered page; in the browser it is read back from
 * the element with this id and slug rather than shipped in the script.
 * Reached without a reload (Back after leaving for another page), it is
 * fetched from the page's own address.
 * ────────────────────────────────────────────────────────────────── */

function fromPage(id, slug) {
  if (typeof document === 'undefined') return '';
  const el = document.getElementById(id);
  return el && el.dataset.slug === slug ? el.innerHTML : '';
}

export function useStaticBody(id, entry, path) {
  const [html, setHtml] = useState(() => entry?.html || fromPage(id, entry?.slug));
  useEffect(() => {
    if (!entry || html) return undefined;
    let live = true;
    fetch(path)
      .then((r) => (r.ok ? r.text() : ''))
      .then((page) => {
        const found = new DOMParser().parseFromString(page, 'text/html').getElementById(id);
        if (live) setHtml(found?.innerHTML ?? '');
      })
      .catch(() => {});
    return () => { live = false; };
  }, [id, entry, path, html]);
  return html;
}
