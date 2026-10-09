import { Button } from '@components/ui/shared/Button';
import { Reveal } from '@components/ui/marketing/Reveal';
import { ListingPreview } from '@components/ui/marketing/ListingPreview';
import { ROUTES, APP_LINKS, PRICING } from '@utils/constants';
import styles from '@styles/pages/marketing/homepage.module.css';

export function HomeHero() {
  const credits = PRICING.JOBS.LISTING.credits;

  return (
    <section className={styles.hero} aria-labelledby="hero-heading">
      <div className={styles.heroInner}>
        <Reveal>
          <div className={styles.heroContent}>
            <span className={styles.heroLabel}>For eBay sellers</span>
            <h1 id="hero-heading" className={styles.heroHeading}>
              Give us a barcode.<br />
              <span className={styles.heroGold}>Get back a finished listing.</span>
            </h1>
            <p className={styles.heroSub}>
              Title, description, category, item specifics, parcel size and
              weight, and a price taken from what sells on eBay UK today.
              Ready to copy into eBay.
            </p>
            <div className={styles.heroCtas}>
              <Button href={APP_LINKS.SIGN_IN} variant="primary" size="default">
                Make your first listing
              </Button>
              <Button href={ROUTES.PRICING} variant="secondary" size="default">
                See pricing
              </Button>
            </div>
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
              <dd className={styles.trustValue}>{credits} credits</dd>
            </div>
            <div className={styles.trustDivider} aria-hidden="true" />
            <div className={styles.trustItem}>
              <dt className={styles.trustLabel}>Subscription</dt>
              <dd className={styles.trustValue}>None</dd>
            </div>
            <div className={styles.trustDivider} aria-hidden="true" />
            <div className={styles.trustItem}>
              <dt className={styles.trustLabel}>Your eBay login</dt>
              <dd className={styles.trustValue}>Never asked for</dd>
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
