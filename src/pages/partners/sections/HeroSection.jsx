import { Button } from '@components/ui/Button';
import { CheckoutMockup } from '@components/ui/CheckoutMockup';
import { Reveal } from '@components/ui/Reveal';
import { ROUTES, EXTERNAL } from '@utils/constants';
import styles from '@styles/pages/partners.module.css';

export function HeroSection() {
  return (
    <section className={styles.hero} aria-labelledby="hero-heading">
      <div className={styles.heroInner}>
        <Reveal>
          <div className={styles.heroContent}>
            <div className={styles.heroLabel}>For platforms</div>
            <h1 id="hero-heading" className={styles.heroHeading}>
              Your users deposit Naira.
              <span className={styles.heroAccent}> You receive USDT.</span>
            </h1>
            <p className={styles.heroSub}>
              Conversion infrastructure for platforms. Your users pay Naira
              via bank transfer and receive credit in 3 to 5 minutes. Any
              Nigerian bank account. One API. Daily USDT settlement.
            </p>
            <div className={styles.heroCtas}>
              <Button href={EXTERNAL.EMAIL} variant="primary">
                Start integrating
              </Button>
              <Button href={ROUTES.AGREEMENT} variant="secondary">
                Review agreement
              </Button>
            </div>
          </div>
        </Reveal>
        <Reveal delay={200}>
          <div className={styles.heroMockup}>
            <CheckoutMockup />
          </div>
        </Reveal>
      </div>
      <div className={styles.heroTrust}>
        <div className={styles.heroTrustInner}>
          <div className={styles.trustItem}>
            <span className={styles.trustValue}>Bank transfer</span>
            <span className={styles.trustLabel}>Collection</span>
          </div>
          <div className={styles.trustDivider} />
          <div className={styles.trustItem}>
            <span className={styles.trustValue}>USDT on Solana</span>
            <span className={styles.trustLabel}>Settlement</span>
          </div>
          <div className={styles.trustDivider} />
          <div className={styles.trustItem}>
            <span className={styles.trustValue}>Daily batch</span>
            <span className={styles.trustLabel}>Schedule</span>
          </div>
          <div className={styles.trustDivider} />
          <div className={styles.trustItem}>
            <span className={styles.trustValue}>&lt; 1 day</span>
            <span className={styles.trustLabel}>Integration</span>
          </div>
        </div>
      </div>
    </section>
  );
}
