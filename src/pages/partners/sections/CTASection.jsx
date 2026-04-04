import { Button } from '@components/ui/Button';
import { Reveal } from '@components/ui/Reveal';
import { EXTERNAL, ROUTES } from '@utils/constants';
import styles from '@styles/pages/partners.module.css';

export function CTASection() {
  return (
    <section className={styles.ctaSection} aria-labelledby="cta-heading">
      <svg
        className={styles.ctaBgMark}
        viewBox="0 0 40 48"
        fill="#C9A84C"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <polygon points="20,6 32,13 20,20 8,13" opacity="1" />
        <polygon points="20,12 32,19 20,26 8,19" opacity="0.55" />
        <polygon points="20,18 32,25 20,32 8,25" opacity="0.25" />
      </svg>
      <Reveal>
        <div className={styles.ctaInner}>
          <div className={styles.ctaContent}>
            <h2 id="cta-heading" className={styles.ctaHeading}>
              Ready to offer Naira deposits?
            </h2>
            <p className={styles.ctaBody}>
              One integration. Instant user credits. Daily USDT settlement.
            </p>
          </div>
          <div className={styles.ctaActions}>
            <Button href={EXTERNAL.EMAIL} variant="primary">
              Get in touch
            </Button>
            <Button href={ROUTES.AGREEMENT} variant="secondary">
              Review agreement
            </Button>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
