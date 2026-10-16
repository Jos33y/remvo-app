import { PackGrid } from '@components/ui/marketing/PackGrid';
import { useMarket } from '@hooks/useMarket';
import { money } from '@lib/market';
import { PRICING, creditsCost } from '@utils/constants';
import styles from '@styles/pages/marketing/homepage.module.css';

export function HomePricing() {
  const { currency } = useMarket();
  const listing = PRICING.JOBS.LISTING;
  const each = money(creditsCost(listing.credits, currency), currency);

  return (
    <section className={styles.pricing} aria-labelledby="pricing-heading">
      <div className={styles.inner}>
        <h2 id="pricing-heading" className={styles.h2}>
          <span className={styles.money}>{each}</span> a listing. Pay only for what you list.
        </h2>
        <p className={styles.lede}>
          A listing uses {listing.credits} credits. A listing that fails gives its credits back on its own, and
          unused credits are refunded in full within {PRICING.REFUND_DAYS} days of buying them.
        </p>
        <PackGrid headingLevel={3} />
      </div>
    </section>
  );
}
