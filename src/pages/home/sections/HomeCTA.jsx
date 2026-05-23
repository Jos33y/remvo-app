import { Button } from '@components/ui/shared/Button';
import { Reveal } from '@components/ui/marketing/Reveal';
import { ROUTES } from '@utils/constants';
import styles from '@styles/pages/marketing/homepage.module.css';

export function HomeCTA() {
  return (
    <section className={styles.cta} aria-labelledby="cta-heading">
      {/* Vault watermark */}
      <svg
        className={styles.ctaWatermark}
        viewBox="0 0 40 48"
        fill="#C9A84C"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <polygon points="20,6 32,13 20,20 8,13" opacity="1" />
        <polygon points="20,12 32,19 20,26 8,19" opacity="0.55" />
        <polygon points="20,18 32,25 20,32 8,25" opacity="0.25" />
      </svg>

      <div className={styles.ctaInner}>
        <Reveal>
          <h2 id="cta-heading" className={styles.ctaHeading}>
            Built for platforms processing<br />
            real volume.
          </h2>
          <p className={styles.ctaDesc}>
            One integration. Instant user credits. Daily reconciliation.
          </p>
          <div className={styles.ctaActions}>
            <Button href={ROUTES.CONTACT} variant="primary" size="large">
              Get in touch
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
