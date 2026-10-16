import { Button } from '@components/ui/shared/Button';
import { APP_LINKS, PRICING } from '@utils/constants';
import styles from '@styles/pages/marketing/homepage.module.css';

/* Bulk listing, for the seller with a list: a pallet, a returns lot or
 * a list of products. Plum is the colour of bulk in the app, and the
 * picture is the app's own: a batch as a sheet of stamps, made ones
 * filled, one being made, a line that did not work left empty and
 * dashed, the rest waiting. */

const FACTS = [
  ['Up to 500', 'products at a time, pasted or from a CSV'],
  ['Free check', 'of every line: what will run, and what it will cost'],
  ['Email', 'when they are done, with an eBay drafts file for Seller Hub'],
];

// The sheet: 48 stamps, in the order a batch fills.
const SHEET = Array.from({ length: 48 }, (_, i) => (i === 9 || i === 22 ? 'failed' : i < 31 ? 'ready' : i === 31 ? 'running' : 'queued'));

function StampSheet() {
  return (
    <div className={styles.sheet} aria-hidden="true">
      {SHEET.map((st, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <span key={i} className={`${styles.stamp} ${styles[`stamp_${st}`]}`} />
      ))}
    </div>
  );
}

export function HomeBulk() {
  return (
    <section className={styles.bulk} aria-labelledby="bulk-heading">
      <div className={styles.inner}>
        <div className={styles.bulkPanel}>
          <div className={styles.bulkText}>
            <h2 id="bulk-heading" className={styles.h2}>Got a list? Make them all at once.</h2>
            <p className={styles.bulkDesc}>
              Paste your products, one a line (barcodes or product links), or upload your spreadsheet, up to
              500 at a time. Remvo checks every line for free, tells you what will run and what it will cost,
              then makes them while you get on with something else. You get an email and an eBay drafts file to
              upload in Seller Hub.
            </p>
            <Button href={APP_LINKS.BULK} variant="secondary" size="default">List in bulk</Button>
          </div>
          <div className={styles.bulkSide}>
            <StampSheet />
            <dl className={styles.bulkFacts}>
              {FACTS.map(([term, desc]) => (
                <div key={term} className={styles.bulkFact}>
                  <dt>{term}</dt>
                  <dd>{desc}</dd>
                </div>
              ))}
              <div className={styles.bulkFact}>
                <dt>{PRICING.JOBS.LISTING.credits} credits</dt>
                <dd>a listing, the same as one at a time; a line that fails gives them back</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
