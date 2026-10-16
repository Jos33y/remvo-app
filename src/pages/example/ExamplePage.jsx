import { Link } from 'react-router';
import { Reveal } from '@components/ui/marketing/Reveal';
import jbl from '@/assets/products/jbl-flip-6-560.webp';
import { Button } from '@components/ui/shared/Button';
import { useMarket } from '@hooks/useMarket';
import { money } from '@lib/market';
import { APP_LINKS, PRICING, ROUTES, creditsCost } from '@utils/constants';
import { EXAMPLE, descriptionBlocks } from './exampleListing';
import info from '@styles/pages/marketing/info-page.module.css';
import s from '@styles/pages/marketing/example-page.module.css';

/* ──────────────────────────────────────────────────────────────────
 * /example: a real Remvo listing, in full, for anyone to read.
 *
 * Proof before sign-in: the seller sees what comes back for one
 * barcode before giving us anything. It is the link for every video
 * and post. The listing is stored in exampleListing.js, so the page
 * never calls the API and never changes on its own.
 * ────────────────────────────────────────────────────────────────── */

/* The postmark on the listing's paper, in eBay.com's ink: the site
 * round the top, READY round the bottom, the day in the middle. */
function Postmark({ site, date }) {
  const d = new Date(date.iso);
  const day = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }).toUpperCase();
  return (
    <svg className={s.postmark} viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <defs>
        <path id="pm-top" d="M 18 60 A 42 42 0 0 1 102 60" />
        <path id="pm-bottom" d="M 14 60 A 46 46 0 0 0 106 60" />
      </defs>
      <circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="60" cy="60" r="34" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <text fontFamily="var(--font-mono)" fontSize="11" fontWeight="600" letterSpacing="2" fill="currentColor">
        <textPath href="#pm-top" startOffset="50%" textAnchor="middle">{site.toUpperCase()}</textPath>
      </text>
      <text fontFamily="var(--font-mono)" fontSize="11" fontWeight="600" letterSpacing="3" fill="currentColor">
        <textPath href="#pm-bottom" startOffset="50%" textAnchor="middle">READY</textPath>
      </text>
      <text x="60" y="58" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="12" fontWeight="600" fill="currentColor">{day}</text>
      <text x="60" y="72" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10" fill="currentColor">{d.getUTCFullYear()}</text>
    </svg>
  );
}

const grouped = (v) => String(v).replace(/(\d{4})(?=\d)/g, '$1 ');

function Row({ term, children, mono = false }) {
  return (
    <div className={s.row}>
      <dt className={s.term}>{term}</dt>
      <dd className={`${s.value} ${mono ? s.mono : ''}`}>{children}</dd>
    </div>
  );
}

export function ExamplePage() {
  const { currency } = useMarket();
  const e = EXAMPLE;
  const listingCost = money(creditsCost(PRICING.JOBS.LISTING.credits, currency), currency);


  return (
    <>
      <section className={info.intro} aria-labelledby="example-heading">
        <div className={info.introInner}>
          <Reveal>
            <h1 id="example-heading" className={info.title}>
              A real Remvo listing, made from one barcode
            </h1>
            <p className={info.lede}>
              A JBL Flip 6 speaker, listed for {e.site} on <time dateTime={e.madeOn.iso}>{e.madeOn.label}</time>.
              This is every field Remvo gave back, as it came out.
            </p>
            <dl className={s.given}>
              <div><dt>Barcode</dt><dd className={s.mono}>{grouped(e.input.value)}</dd></div>
              <div><dt>Condition</dt><dd>{e.condition}</dd></div>
              <div><dt>eBay site</dt><dd>{e.site}</dd></div>
              <div><dt>Cost</dt><dd>{PRICING.JOBS.LISTING.credits} credits</dd></div>
            </dl>
          </Reveal>
        </div>
      </section>

      <div className={info.body}>
        <div className={info.bodyInner}>
          <Reveal>
            <section className={info.section} aria-labelledby="given">
              <h2 id="given" className={info.sectionHeading}>What it was given</h2>
              <div className={info.sectionBody}>
                <p>
                  The barcode from the box and the condition. Nothing else: no title, no notes, no photos.
                </p>
                <p className={info.muted}>
                  The barcode matched {e.matches} products: the speaker on its own and {e.matches - 1} bundles.
                  The speaker on its own was picked before any credits were used.
                </p>
              </div>
            </section>
          </Reveal>

          <section className={`${info.section} ${s.listingSection}`} aria-labelledby="listing">
            <h2 id="listing" className={info.sectionHeading}>What came back</h2>
            <div className={s.paper}>
            <div className={s.sheet}>
              <div className={s.top}>
                <div className={s.photo}>
                  <img src={jbl} width="207" height="560" alt="The JBL Flip 6 speaker, in black" loading="lazy" decoding="async" />
                </div>
                <Postmark site={e.site} date={e.madeOn} />
              </div>
              <dl className={s.rows}>
                <Row term="Title">
                  <span className={s.title}>{e.title}</span>
                  <span className={s.note}>{e.title.length} of 80 characters</span>
                </Row>
                <Row term="Category">
                  {e.category.path.split(' > ').at(-1)}
                  <span className={s.note}>
                    {e.category.path.split(' > ').slice(0, -1).join(', ')}. Category ID <span className={s.mono}>{e.category.id}</span>
                  </span>
                </Row>
                <Row term="Item specifics">
                  <table className={s.specifics}>
                    <caption className="sr-only">Item specifics</caption>
                    <tbody>
                      {e.specifics.map(([k, v]) => (
                        <tr key={k}><th scope="row">{k}</th><td>{v}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </Row>
                <Row term="UPC" mono>{e.identifiers.gtin}</Row>
                <Row term="Parcel">
                  <span className={s.mono}>{e.parcel.size}, {e.parcel.weight}</span>
                  <span className={s.note}>{e.parcel.band}</span>
                </Row>
                <Row term="Price">
                  <span className={`${s.mono} ${s.price}`}>{e.price.value}</span>
                  <span className={s.note}>
                    {e.price.median
                      ? `Middle of ${e.price.listings} live ${e.site} listings is ${e.price.median}`
                      : `Set from live ${e.site} listings of the same product`}
                  </span>
                </Row>
                <Row term="Description">
                  <div className={s.description}>
                    {descriptionBlocks(e.description).map((b, i) => {
                      if (b.kind === 'h') return <p key={i} className={s.descHeading}>{b.text}</p>;
                      if (b.kind === 'ul') return <ul key={i}>{b.items.map((it) => <li key={it}>{it}</li>)}</ul>;
                      return <p key={i}>{b.text}</p>;
                    })}
                  </div>
                </Row>
              </dl>
            </div>
            </div>
          </section>

          <Reveal>
            <section className={info.section} aria-labelledby="next">
              <h2 id="next" className={info.sectionHeading}>What the seller does next</h2>
              <div className={info.sectionBody}>
                <ul className={info.list}>
                  <li>Reads it, and changes anything they want.</li>
                  <li>Copies each field into eBay, or downloads the listing as a file.</li>
                  <li>Adds their own photos and publishes it. Remvo never touches the eBay account.</li>
                </ul>
                <p className={`${info.muted} ${info.after}`}>
                  More on what Remvo reads and writes: <Link to={ROUTES.HOW} className={info.link}>how it works</Link>.
                </p>
              </div>
            </section>
          </Reveal>
        </div>
      </div>

      <section className={info.close} aria-label="Get started">
        <div className={info.closeInner}>
          <p className={info.closeHeading}>
            Made for {PRICING.JOBS.LISTING.credits} credits ({listingCost}). Yours is next, and your first one is on us.
          </p>
          <Button href={APP_LINKS.SIGN_UP} variant="ivory" size="large">
            Make your first listing
          </Button>
        </div>
      </section>
    </>
  );
}
