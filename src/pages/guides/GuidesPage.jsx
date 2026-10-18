import { ChatLine } from '@components/ui/marketing/ChatInvite';
import { GuideArt } from '@pages/guides/GuideArt';
import { GUIDES, guidePath, longDate } from '@lib/guides';
import G from '@styles/pages/marketing/guides.module.css';

/* ──────────────────────────────────────────────────────────────────
 * Guides, /guides (guides1, guides1b)
 *
 * An album of stamps: each guide is a stamp in its topic's colour, with
 * its cover picture, its question and its short answer, so a seller can
 * often stop here. Newest first. The whole stamp is the link, and it
 * reloads the page on purpose: each guide is its own finished HTML page
 * (see GuidePage.jsx).
 * ────────────────────────────────────────────────────────────────── */

const TOPIC_NAMES = { bulk: 'Bulk listing', drafts: 'Drafts', listing: 'Listing', fees: 'Fees', postage: 'Postage', selling: 'Selling' };

export function GuidesPage() {
  return (
    <div className={G.album}>
      <div className={G.albumInner}>
        <header className={G.albumHead}>
          <h1 className={G.title}>Guides for eBay sellers</h1>
          <p className={G.lede}>
            One question each, answered first and checked against eBay’s own pages. Short enough to read
            between listings.
          </p>
        </header>

        <ol className={G.grid}>
          {GUIDES.map((g) => (
            <li key={g.slug} className={`${G.stamp} ${G.perforated}`} data-topic={g.topic}>
              <div className={G.stampFace}>
                <div className={G.stampArt}><GuideArt art={g.art} /></div>
                <h2 className={G.stampTitle}><a href={guidePath(g.slug)}>{g.title}</a></h2>
                <p className={G.stampShort}>{g.short}</p>
                <p className={G.stampMeta}>
                  <span className={G.stampTopic}>{TOPIC_NAMES[g.topic]}</span>
                  <span>Checked <time dateTime={g.checked}>{longDate(g.checked)}</time> <span aria-hidden="true">·</span> {g.minutes} min read</span>
                </p>
              </div>
            </li>
          ))}
        </ol>

        <ChatLine className={G.listTalk} path="other" hint="Your question about selling on eBay." action="Ask us, and we may write the next guide on it.">
          Can’t find your question?
        </ChatLine>
      </div>
    </div>
  );
}
