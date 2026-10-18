import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { Button } from '@components/ui/shared/Button';
import { ChatLine } from '@components/ui/marketing/ChatInvite';
import { NotFoundPage } from '@pages/not-found/NotFoundPage';
import { GUIDES, guideBySlug, guidePath, longDate } from '@lib/guides';
import { APP_LINKS, ROUTES } from '@utils/constants';
import G from '@styles/pages/marketing/guides.module.css';

/* ──────────────────────────────────────────────────────────────────
 * A guide, /guides/:slug (guides1)
 *
 * One question, answered first ("In short"), then the steps, the
 * sources, and one action. Written for a person in a hurry, and laid
 * out so Google and AI tools can quote it: the question is the h1, the
 * short answer sits right under it, every step is a heading.
 *
 * The body is HTML from the Markdown file. It arrives in the page; in
 * the browser it is read back from the page rather than shipped in the
 * script (lib/guides.js). Reached without a reload (Back after leaving
 * for another page), it is fetched from the guide's own address.
 * ────────────────────────────────────────────────────────────────── */

const BODY_ID = 'guide-body';

const ACTIONS = {
  bulk: { heading: 'Skip the slow part', text: 'Paste or scan your barcodes, or upload the spreadsheet. Remvo fills in every row, up to 500 at a time. Your first listing is free.', label: 'List in bulk', href: APP_LINKS.BULK },
  listing: { heading: 'Let Remvo write it', text: 'Scan or paste a barcode and get the title, category, item specifics, parcel and price in about 20 seconds. Your first listing is free.', label: 'Make your first listing', href: APP_LINKS.SIGN_UP },
  scan: { heading: 'Scan a box, get the listing', text: 'Point your phone at the barcode. Remvo writes the listing in about 20 seconds. Your first listing is free.', label: 'Make your first listing', href: APP_LINKS.SIGN_UP },
  calculator: { heading: 'Work it out for your sale', text: 'Type the price and your costs to see what eBay.com takes and what you keep. Free, no sign-up.', label: 'Open the fee calculator', to: ROUTES.FEES_US },
  'calculator-uk': { heading: 'Work it out for your sale', text: 'Private or business, with or without VAT: see what eBay.co.uk takes and what you keep. Free, no sign-up.', label: 'Open the UK fee calculator', to: ROUTES.FEES_UK },
  chat: { heading: 'Ask a person', text: 'Tell us what you sell and where you are stuck. A person answers, usually the same day.', label: null },
};

function bodyFromPage(slug) {
  if (typeof document === 'undefined') return '';
  const el = document.getElementById(BODY_ID);
  return el && el.dataset.slug === slug ? el.innerHTML : '';
}

function useBody(guide) {
  const [html, setHtml] = useState(() => guide?.html || bodyFromPage(guide?.slug));
  useEffect(() => {
    if (!guide || html) return undefined;
    let live = true;
    fetch(guidePath(guide.slug))
      .then((r) => (r.ok ? r.text() : ''))
      .then((page) => {
        const found = new DOMParser().parseFromString(page, 'text/html').getElementById(BODY_ID);
        if (live) setHtml(found?.innerHTML ?? '');
      })
      .catch(() => {});
    return () => { live = false; };
  }, [guide, html]);
  return html;
}

export function GuidePage() {
  const { slug } = useParams();
  const guide = guideBySlug(slug);
  const html = useBody(guide);
  if (!guide) return <NotFoundPage />;

  const action = ACTIONS[guide.action];
  const related = guide.related.map(guideBySlug).filter(Boolean);
  const more = related.length ? related : GUIDES.filter((g) => g.slug !== guide.slug).slice(0, 3);

  return (
    <article className={G.page} aria-labelledby="guide-title">
      <div className={G.inner}>
        <nav className={G.crumbs} aria-label="Breadcrumb">
          <ol>
            <li><Link to={ROUTES.GUIDES}>Guides</Link></li>
            <li aria-current="page">{guide.title}</li>
          </ol>
        </nav>

        <header className={G.head}>
          <h1 id="guide-title" className={G.title}>{guide.title}</h1>
          <p className={G.byline}>
            By Joseph at Remvo <span aria-hidden="true">·</span> Checked <time dateTime={guide.checked}>{longDate(guide.checked)}</time>{' '}
            <span aria-hidden="true">·</span> {guide.minutes} min read
          </p>
        </header>

        <section className={G.short} aria-labelledby="in-short">
          <h2 id="in-short" className={G.shortLabel}>In short</h2>
          <p>{guide.short}</p>
        </section>

        {guide.headings.length > 2 && (
          <nav className={G.toc} aria-labelledby="on-this-page">
            <h2 id="on-this-page" className={G.tocLabel}>On this page</h2>
            <ul>
              {guide.headings.map((h) => <li key={h.id}><a href={`#${h.id}`}>{h.text}</a></li>)}
            </ul>
          </nav>
        )}

        <div id={BODY_ID} data-slug={guide.slug} className={G.body} dangerouslySetInnerHTML={{ __html: html }} />

        <aside className={G.action} aria-labelledby="guide-action">
          <h2 id="guide-action" className={G.actionHeading}>{action.heading}</h2>
          <p className={G.actionText}>{action.text}</p>
          {action.href && <Button href={action.href} variant="ivory" size="default">{action.label}</Button>}
          {action.to && <Button href={action.to} variant="ivory" size="default">{action.label}</Button>}
          <ChatLine className={G.actionTalk} path={guide.action === 'bulk' ? 'bulk' : 'other'} hint={`About "${guide.title}": `} action="Ask a person.">
            Stuck on a step?
          </ChatLine>
        </aside>

        {guide.sources.length > 0 && (
          <section className={G.sources} aria-labelledby="sources">
            <h2 id="sources" className={G.smallHeading}>Sources</h2>
            <ul>
              {guide.sources.map((s) => (
                <li key={s.url}><a href={s.url} target="_blank" rel="noopener">{s.label}<span className="sr-only"> (opens in a new tab)</span></a></li>
              ))}
            </ul>
            <p className={G.note}>
              Checked against these on {longDate(guide.checked)}. eBay changes its tools and fees; if something here no longer matches, <Link to={ROUTES.CONTACT}>tell us</Link> and we will fix it.
            </p>
          </section>
        )}

        {more.length > 0 && (
          <section className={G.more} aria-labelledby="more-guides">
            <h2 id="more-guides" className={G.smallHeading}>More guides</h2>
            <ul className={G.moreList}>
              {more.map((g) => (
                <li key={g.slug}><a href={guidePath(g.slug)}>{g.title}</a></li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </article>
  );
}
