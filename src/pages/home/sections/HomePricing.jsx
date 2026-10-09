import { Reveal } from '@components/ui/marketing/Reveal';
import { PackGrid } from '@components/ui/marketing/PackGrid';
import { PRICING } from '@utils/constants';
import styles from '@styles/pages/marketing/homepage.module.css';

export function HomePricing() {
  const listing = PRICING.JOBS.LISTING;
  const pence = listing.credits * PRICING.CREDIT_PENCE;

  return (
    <section className={styles.pricing} aria-labelledby="pricing-heading">
      <div className={styles.pricingInner}>
        <Reveal>
          <span className={styles.sectionLabel}>Pricing</span>
          <h2 id="pricing-heading" className={styles.pricingHeading}>
            {pence}p a listing. Pay only for what you list.
          </h2>
          <p className={styles.pricingDesc}>
            {listing.name} uses {listing.credits} credits. A job that fails gives
            its credits back on its own, and unused credits are refunded in full
            within {PRICING.REFUND_DAYS} days of buying them.
          </p>
        </Reveal>

        <Reveal delay={100}>
          <PackGrid headingLevel={3} />
        </Reveal>
      </div>
    </section>
  );
}
