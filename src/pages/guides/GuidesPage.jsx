import { ChatLine } from '@components/ui/marketing/ChatInvite';
import { GUIDES, guidePath, longDate } from '@lib/guides';
import G from '@styles/pages/marketing/guides.module.css';

/* ──────────────────────────────────────────────────────────────────
 * Guides, /guides (guides1)
 *
 * Every guide answers one question, so the list is the questions, each
 * with its short answer under it: a seller can often stop reading here.
 * Newest first. Links reload the page on purpose: each guide is its own
 * finished HTML page (see GuidePage.jsx).
 * ────────────────────────────────────────────────────────────────── */

export function GuidesPage() {
  return (
    <div className={G.page}>
      <div className={G.inner}>
        <header className={G.head}>
          <h1 className={G.title}>Guides for eBay sellers</h1>
          <p className={G.lede}>
            One question each, answered first and checked against eBay’s own pages. Short enough to read
            between listings.
          </p>
        </header>

        <ol className={G.list}>
          {GUIDES.map((g) => (
            <li key={g.slug} className={G.item}>
              <h2 className={G.itemTitle}><a href={guidePath(g.slug)}>{g.title}</a></h2>
              <p className={G.itemShort}>{g.short}</p>
              <p className={G.itemMeta}>
                Checked <time dateTime={g.checked}>{longDate(g.checked)}</time> <span aria-hidden="true">·</span> {g.minutes} min read
              </p>
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
