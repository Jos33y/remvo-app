import { useEffect } from 'react';
import { Link } from 'react-router';
import { Reveal } from '@components/ui/marketing/Reveal';
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

  useEffect(() => {
    document.title = 'Remvo | A real listing, made from one barcode';
  }, []);

  return (
    <>
      <section className={info.intro} aria-labelledby="example-heading">
        <div className={info.introInner}>
          <Reveal>
            <span className={info.label}>Example</span>
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
            <div className={s.sheet}>
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
          <Button href={APP_LINKS.SIGN_IN} variant="primary" size="large">
            Make your first listing
          </Button>
        </div>
      </section>
    </>
  );
}
