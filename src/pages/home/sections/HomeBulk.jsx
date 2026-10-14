import { Reveal } from '@components/ui/marketing/Reveal';
import { Button } from '@components/ui/shared/Button';
import { APP_LINKS, PRICING } from '@utils/constants';
import styles from '@styles/pages/marketing/homepage.module.css';

/* Bulk listing, for the seller with a stack: the feature that decides
 * the sale for someone listing 50 to 300 at once. Plum is the colour
 * of bulk and batches; it marks the label only. */

const FACTS = [
  ['Up to 500', 'barcodes at a time, pasted as a column or from a CSV'],
  ['Free check', 'of every line: what will run, and what it will cost'],
  ['Email', 'when they are done, with an eBay drafts file for Seller Hub'],
];

export function HomeBulk() {
  return (
    <section className={styles.bulk} aria-labelledby="bulk-heading">
      <div className={styles.bulkInner}>
        <div className={styles.bulkGrid}>
          <Reveal>
            <div className={styles.bulkText}>
              <span className={styles.bulkLabel}>In bulk</span>
              <h2 id="bulk-heading" className={styles.bulkHeading}>Got a stack? List them all at once.</h2>
              <p className={styles.bulkDesc}>
                Paste a column of barcodes or upload your spreadsheet, up to 500 lines. Remvo checks every
                line for free, tells you what will run and what it will cost, then makes them while you get on
                with something else. You get an email and an eBay drafts file to upload in Seller Hub.
              </p>
              <Button href={APP_LINKS.BULK} variant="outline" size="default">List in bulk</Button>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <dl className={styles.bulkFacts}>
              {FACTS.map(([term, desc]) => (
                <div key={term} className={styles.bulkFact}>
                  <dt className={styles.bulkFactTerm}>{term}</dt>
                  <dd className={styles.bulkFactDesc}>{desc}</dd>
                </div>
              ))}
              <div className={styles.bulkFact}>
                <dt className={styles.bulkFactTerm}>{PRICING.JOBS.LISTING.credits} credits</dt>
                <dd className={styles.bulkFactDesc}>a listing, the same as one at a time; a line that fails gives them back</dd>
              </div>
            </dl>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
