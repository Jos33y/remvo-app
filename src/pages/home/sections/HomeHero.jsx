import { Button } from '@components/ui/shared/Button';
import { HeroListing } from '@components/ui/marketing/HeroListing';
import { useMarket } from '@hooks/useMarket';
import { MARKETPLACES, money } from '@lib/market';
import { ROUTES, APP_LINKS, PRICING, creditsCost } from '@utils/constants';
import styles from '@styles/pages/marketing/homepage.module.css';

/* The hero says the job in the words of the Instagram post, says who
 * it is for (and who it is not for, so a vintage seller does not spend
 * money finding out), and puts the three reassurances a careful seller
 * looks for directly under the button. Beside it, a real listing. */
export function HomeHero() {
  const { currency, site } = useMarket();
  const perListing = money(creditsCost(PRICING.JOBS.LISTING.credits, currency), currency);

  return (
    <section className={styles.hero} aria-labelledby="hero-heading">
      <div className={styles.heroInner}>
        <div className={styles.heroContent}>
          <p className={styles.heroFor}>For eBay sellers</p>
          <h1 id="hero-heading" className={styles.heroHeading}>
            <span className={styles.line}>Paste a product.</span>{' '}
            <span className={styles.line}>Get a finished eBay listing.</span>
          </h1>
          <p className={styles.heroSub}>
            A barcode or a product link in. The title, description, category, item specifics, parcel and
            a price from live {site.site} listings out, in about 20 seconds.
          </p>
          <p className={styles.heroFit}>
            For resellers and dropshippers listing branded products. <strong>Not for vintage, handmade or one-off items.</strong>
          </p>
          <div className={styles.heroCtas}>
            <Button href={APP_LINKS.SIGN_UP} variant="ivory" size="default">
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

        <div className={styles.heroPreview}>
          <HeroListing />
        </div>
      </div>

      <div className={styles.trustBar}>
        <dl className={styles.trustBarInner}>
          <div className={styles.trustItem}>
            <dt className={styles.trustLabel}>A listing</dt>
            <dd className={`${styles.trustValue} ${styles.trustMoney}`}>{perListing}</dd>
          </div>
          <div className={styles.trustItem}>
            <dt className={styles.trustLabel}>Subscription</dt>
            <dd className={styles.trustValue}>None</dd>
          </div>
          <div className={styles.trustItem}>
            <dt className={styles.trustLabel}>eBay sites</dt>
            <dd className={styles.trustValue}>{MARKETPLACES.length}</dd>
          </div>
          <div className={styles.trustItem}>
            <dt className={styles.trustLabel}>A listing that fails</dt>
            <dd className={styles.trustValue}>Credits back</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
