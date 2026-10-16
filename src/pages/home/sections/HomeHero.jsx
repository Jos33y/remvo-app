import { Button } from '@components/ui/shared/Button';
import { Reveal } from '@components/ui/marketing/Reveal';
import { ListingPreview } from '@components/ui/marketing/ListingPreview';
import { useMarket } from '@hooks/useMarket';
import { MARKETPLACES, money } from '@lib/market';
import { ROUTES, APP_LINKS, PRICING, creditsCost } from '@utils/constants';
import styles from '@styles/pages/marketing/homepage.module.css';

/* The hero says the job, says who it is for (and who it is not for,
 * so a vintage seller does not spend money finding out), and puts the
 * three reassurances a careful seller looks for directly under the
 * button rather than in the footer. */
export function HomeHero() {
  const { currency, site } = useMarket();
  const perListing = money(creditsCost(PRICING.JOBS.LISTING.credits, currency), currency);

  return (
    <section className={styles.hero} aria-labelledby="hero-heading">
      <div className={styles.heroInner}>
        <Reveal>
          <div className={styles.heroContent}>
            <span className={styles.heroLabel}>For marketplace sellers, starting with eBay</span>
            <h1 id="hero-heading" className={styles.heroHeading}>
              Paste a barcode.<br />
              <span className={styles.heroGold}>Get a finished eBay listing.</span>
            </h1>
            <p className={styles.heroSub}>
              Title, description, category, item specifics, parcel size and
              weight, and a price from what sells on {site.site} today.
              Ready to copy in.
            </p>
            <p className={styles.heroFit}>
              Built for products with a barcode: wholesale, retail arbitrage,
              overstock, returns. <strong>Not for vintage, handmade or one-off
              items.</strong>
            </p>
            <div className={styles.heroCtas}>
              <Button href={APP_LINKS.SIGN_UP} variant="primary" size="default">
                Make your first listing
              </Button>
              <Button href={ROUTES.EXAMPLE} variant="secondary" size="default">
                See a real listing
              </Button>
            </div>
            <ul className={styles.heroTrust} aria-label="Before you start">
              <li>Payments by Polar</li>
              <li>Never asks for your eBay login</li>
              <li>You publish it yourself</li>
            </ul>
          </div>
        </Reveal>

        <Reveal delay={150}>
          <div className={styles.heroPreview}>
            <ListingPreview />
          </div>
        </Reveal>
      </div>

      <Reveal delay={300}>
        <div className={styles.trustBar}>
          <dl className={styles.trustBarInner}>
            <div className={styles.trustItem}>
              <dt className={styles.trustLabel}>Per listing</dt>
              <dd className={styles.trustValue}>{perListing}</dd>
            </div>
            <div className={styles.trustDivider} aria-hidden="true" />
            <div className={styles.trustItem}>
              <dt className={styles.trustLabel}>Subscription</dt>
              <dd className={styles.trustValue}>None</dd>
            </div>
            <div className={styles.trustDivider} aria-hidden="true" />
            <div className={styles.trustItem}>
              <dt className={styles.trustLabel}>eBay sites</dt>
              <dd className={styles.trustValue}>{MARKETPLACES.length}</dd>
            </div>
            <div className={styles.trustDivider} aria-hidden="true" />
            <div className={styles.trustItem}>
              <dt className={styles.trustLabel}>A job that fails</dt>
              <dd className={styles.trustValue}>Credits back</dd>
            </div>
          </dl>
        </div>
      </Reveal>
    </section>
  );
}
