import { RemvoCard } from '@components/ui/shared/RemvoCard';
import { Button } from '@components/ui/shared/Button';
import { Reveal } from '@components/ui/marketing/Reveal';
import { ROUTES } from '@utils/constants';
import styles from '@styles/pages/marketing/homepage.module.css';

export function HomeHero() {
  return (
    <section className={styles.hero} aria-labelledby="hero-heading">
      <div className={styles.heroInner}>
        <Reveal>
          <div className={styles.heroContent}>
            <span className={styles.heroLabel}>The digital value card</span>
            <h1 id="hero-heading" className={styles.heroHeading}>
              Buy a card.<br />
              <span className={styles.heroGold}>Activate instantly.</span>
            </h1>
            <p className={styles.heroSub}>
              A digital value card for the platforms you already use. Pay in
              Naira by bank transfer. Your card activates the moment payment
              confirms.
            </p>
            <div className={styles.heroCtas}>
              <Button href={ROUTES.CONTACT} variant="primary" size="large">
                Get in touch
              </Button>
              <Button href={ROUTES.TERMS} variant="secondary" size="large">
                Read terms
              </Button>
            </div>
          </div>
        </Reveal>

        <Reveal delay={200}>
          <div className={styles.heroCards} aria-hidden="true">
            <div className={styles.cardStack}>
              <div className={styles.cardBack}>
                <RemvoCard amount={100} />
              </div>
              <div className={styles.cardMid}>
                <RemvoCard amount={50} />
              </div>
              <div className={styles.cardFront}>
                <RemvoCard amount={25} reference="RMV-2026-0031-7A4F" />
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      {/* Trust bar */}
      <Reveal delay={350}>
        <div className={styles.trustBar}>
          <div className={styles.trustBarInner}>
            <div className={styles.trustItem}>
              <span className={styles.trustValue}>3-5 min</span>
              <span className={styles.trustLabel}>Checkout time</span>
            </div>
            <div className={styles.trustDivider} aria-hidden="true" />
            <div className={styles.trustItem}>
              <span className={styles.trustValue}>Any bank</span>
              <span className={styles.trustLabel}>Nigerian accounts</span>
            </div>
            <div className={styles.trustDivider} aria-hidden="true" />
            <div className={styles.trustItem}>
              <span className={styles.trustValue}>Instant</span>
              <span className={styles.trustLabel}>User credit</span>
            </div>
            <div className={styles.trustDivider} aria-hidden="true" />
            <div className={styles.trustItem}>
              <span className={styles.trustValue}>Daily</span>
              <span className={styles.trustLabel}>Reconciliation</span>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
