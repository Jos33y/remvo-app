import { RemvoCard } from '@components/ui/RemvoCard';
import { Button } from '@components/ui/Button';
import { Reveal } from '@components/ui/Reveal';
import { ROUTES } from '@utils/constants';
import styles from '@styles/pages/homepage.module.css';

export function HomeHero() {
  return (
    <section className={styles.hero} aria-labelledby="hero-heading">
      <div className={styles.heroInner}>
        <Reveal>
          <div className={styles.heroContent}>
            <span className={styles.heroLabel}>The digital value card</span>
            <h1 id="hero-heading" className={styles.heroHeading}>
              Naira in.<br />
              <span className={styles.heroGold}>Dollars out.</span>
            </h1>
            <p className={styles.heroSub}>
              Pay in Naira from any Nigerian bank account. Receive
              dollar-denominated value in seconds. One card, one checkout.
            </p>
            <div className={styles.heroCtas}>
              <Button href={ROUTES.PARTNERS} variant="primary" size="large">
                For platforms
              </Button>
              <Button href={ROUTES.CONTACT} variant="secondary" size="large">
                Get in touch
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
              <span className={styles.trustLabel}>Deposit time</span>
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
              <span className={styles.trustLabel}>Settlement</span>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
