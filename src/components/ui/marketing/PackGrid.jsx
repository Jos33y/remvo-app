import { Link } from 'react-router';
import { Button } from '@components/ui/shared/Button';
import { PRICING, APP_LINKS, ROUTES, listingsFor } from '@utils/constants';
import styles from '@styles/ui/marketing/pack-grid.module.css';

/* PackGrid
 *
 * The three top-ups, read from PRICING, used on the home page and the
 * pricing page so the two can never disagree. A credit costs the same
 * in every pack, so no pack is called better value. £20 carries the
 * accent because the payment fee on £5 is nearly double (spec 12); the
 * card says what it buys, not that it is popular.
 */
export function PackGrid({ headingLevel = 3 }) {
  const H = `h${headingLevel}`;
  const listing = PRICING.JOBS.LISTING;

  return (
    <div className={styles.wrap}>
      <ul className={styles.grid} role="list">
        {PRICING.PACKS.map((p) => (
          <li key={p.pounds} className={`${styles.pack} ${p.featured ? styles.featured : ''}`}>
            <H className={styles.price}>
              <span className={styles.currency}>£</span>{p.pounds}
              <span className="sr-only"> top-up</span>
            </H>
            <p className={styles.credits}>{p.credits} credits</p>
            <p className={styles.covers}>
              About {listingsFor(p.credits)} listings
              <span className={styles.coversNote}> at {listing.credits} credits each</span>
            </p>
            <Button
              href={APP_LINKS.TOP_UP}
              variant={p.featured ? 'primary' : 'secondary'}
              size="default"
              className={styles.buy}
            >
              Top up £{p.pounds}
            </Button>
          </li>
        ))}
      </ul>

      <p className={styles.terms}>
        1 credit is {PRICING.CREDIT_PENCE}p. Prices exclude VAT, which is added at checkout where it
        applies. Credits last {PRICING.EXPIRY_MONTHS} months, and every top-up extends your whole
        balance. <Link to={ROUTES.CREDITS} className={styles.link}>Credit terms</Link>
      </p>
    </div>
  );
}
