import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { Button } from '@components/ui/shared/Button';
import { ChatLine } from '@components/ui/marketing/ChatInvite';
import { Postmark } from '@components/ui/marketing/Postmark';
import { NotFoundPage } from '@pages/not-found/NotFoundPage';
import { GuideArt } from '@pages/guides/GuideArt';
import { GUIDES, guideBySlug, guidePath, longDate } from '@lib/guides';
import { APP_LINKS, ROUTES } from '@utils/constants';
import G from '@styles/pages/marketing/guides.module.css';

/* ──────────────────────────────────────────────────────────────────
 * A guide, /guides/:slug (guides1, guides1b)
 *
 * One question, answered first, then the steps, the sources and one
 * action. Written for a seller in a hurry and laid out so Google and AI
 * tools can quote it: the question is the h1, the short answer sits
 * right under it, every step is a heading.
 *
 * In Remvo's postage world: a cover drawn for the topic, in its ink;
 * the short answer on ivory stamp paper, postmarked with the day it was
 * checked; big numerals down a dotted route for the steps; on a wide
 * screen the contents ride beside the text and mark where you are.
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
  calculator: { heading: 'Work it out for your sale', text: 'Type the price and your costs to see what eBay.com takes and what you keep. Free, no sign-up.', label: 'Open the fee calculator', href: ROUTES.FEES_US },
  'calculator-uk': { heading: 'Work it out for your sale', text: 'Private or business, with or without VAT: see what eBay.co.uk takes and what you keep. Free, no sign-up.', label: 'Open the UK fee calculator', href: ROUTES.FEES_UK },
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

/* Which part of the guide is being read: the last heading that has
 * reached a line just under the site's header (where a jump puts it). Only for the rail beside the text;
 * worked out at most once a frame while scrolling. */
function useReading(ids, html) {
  const [current, setCurrent] = useState(null);
  const key = ids.join(' ');
  useEffect(() => {
    if (!html) return undefined;
    const ids = key.split(' ');
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = 160;
      let here = null;
      // Looked up each time: the body's HTML can be replaced after the page loads.
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) here = id;
      }
      setCurrent(here);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); };
  }, [key, html]);
  return current;
}

/* The dotted route down the margin, from under the first step's numeral
 * to the top of the last one's: measured from where the numerals are, so
 * it fits any length of guide. Only where they hang in the margin. */
function useRoute(html, wrapRef) {
  const [route, setRoute] = useState(null);
  useEffect(() => {
    if (!html) return undefined;
    const measure = () => {
      const wrap = wrapRef.current;
      const nums = wrap ? [...wrap.querySelectorAll('.step-n')] : [];
      if (nums.length < 2 || getComputedStyle(nums[0]).position !== 'absolute') { setRoute(null); return; }
      const box = wrap.getBoundingClientRect();
      const first = nums[0].getBoundingClientRect();
      const last = nums.at(-1).getBoundingClientRect();
      setRoute({ left: first.left + first.width / 2 - box.left - 1, top: first.bottom - box.top + 10, height: last.top - first.bottom - 20 });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrapRef.current);
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, [html, wrapRef]);
  return route;
}

function Contents({ headings, current, className, labelId }) {
  return (
    <nav className={className} aria-labelledby={labelId}>
      <h2 id={labelId} className={G.tocLabel}>On this page</h2>
      <ol className={G.tocList}>
        {headings.map((h) => (
          <li key={h.id}>
            <a href={`#${h.id}`} aria-current={current === h.id ? 'location' : undefined}>
              <span className={G.tocN} aria-hidden="true">{h.n ?? ''}</span>
              <span>{h.text}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function GuidePage() {
  const { slug } = useParams();
  const guide = guideBySlug(slug);
  const html = useBody(guide);
  const current = useReading(guide ? guide.headings.map((h) => h.id) : [], html);
  const wrapRef = useRef(null);
  const route = useRoute(html, wrapRef);
  if (!guide) return <NotFoundPage />;

  const action = ACTIONS[guide.action];
  const related = guide.related.map(guideBySlug).filter(Boolean);
  const more = related.length ? related : GUIDES.filter((g) => g.slug !== guide.slug).slice(0, 3);
  const withContents = guide.headings.length > 2;

  return (
    <article className={G.page} data-topic={guide.topic} aria-labelledby="guide-title">
      <header className={G.cover}>
        <div className={G.coverInner}>
          <div className={G.coverText}>
            <nav className={G.crumbs} aria-label="Breadcrumb">
              <ol>
                <li><Link to={ROUTES.GUIDES}>Guides</Link></li>
                <li aria-current="page">{guide.title}</li>
              </ol>
            </nav>
            <h1 id="guide-title" className={G.title}>{guide.title}</h1>
            <p className={G.byline}>
              By Joseph at Remvo <span aria-hidden="true">·</span> Checked <time dateTime={guide.checked}>{longDate(guide.checked)}</time>{' '}
              <span aria-hidden="true">·</span> {guide.minutes} min read
            </p>
          </div>
          <div className={G.coverArt}>
            <GuideArt topic={guide.topic} />
          </div>
        </div>
      </header>

      <div className={`${G.layout} ${withContents ? G.layoutRail : ''}`}>
        <div className={G.main}>
          <section className={G.ticket} aria-labelledby="in-short">
            <div className={`${G.ticketPaper} ${G.perforated}`}>
              <div className={G.ticketHead}>
                <h2 id="in-short" className={G.ticketLabel}>In short</h2>
                <Postmark className={G.postmark} top="CHECKED" bottom="REMVO" iso={guide.checked} />
              </div>
              <p className={G.ticketText}>{guide.short}</p>
            </div>
          </section>

          {withContents && <Contents headings={guide.headings} current={null} className={G.tocInline} labelId="on-this-page" />}

          <div className={G.bodyWrap} ref={wrapRef}>
            {route && <span className={G.route} style={{ left: route.left, top: route.top, height: route.height }} aria-hidden="true" />}
            <div id={BODY_ID} data-slug={guide.slug} className={G.body} dangerouslySetInnerHTML={{ __html: html }} />
          </div>

          <aside className={G.action} aria-labelledby="guide-action">
            <h2 id="guide-action" className={G.actionHeading}>{action.heading}</h2>
            <p className={G.actionText}>{action.text}</p>
            {action.href && <Button href={action.href} variant="ivory" size="default">{action.label}</Button>}
            <ChatLine className={G.actionTalk} path={guide.action === 'bulk' ? 'bulk' : 'other'} hint={`About "${guide.title}": `} action="Ask a person.">
              Stuck on a step?
            </ChatLine>
          </aside>

          {guide.sources.length > 0 && (
            <section className={G.sources} aria-labelledby="sources">
              <h2 id="sources" className={G.smallHeading}>Sources</h2>
              <ol className={G.sourceList}>
                {guide.sources.map((s) => (
                  <li key={s.url}><a href={s.url} target="_blank" rel="noopener">{s.label}<span className="sr-only"> (opens in a new tab)</span></a></li>
                ))}
              </ol>
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

        {withContents && (
          <aside className={G.rail}>
            <Contents headings={guide.headings} current={current} className={G.tocRail} labelId="on-this-page-rail" />
          </aside>
        )}
      </div>
    </article>
  );
}
