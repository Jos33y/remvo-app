import { CheckoutMockup } from '@components/ui/CheckoutMockup';
import { Reveal } from '@components/ui/Reveal';
import styles from '@styles/pages/homepage.module.css';

export function HomeCheckout() {
  return (
    <section className={styles.checkout} aria-labelledby="checkout-heading">
      <div className={styles.checkoutInner}>
        <Reveal>
          <div className={styles.checkoutContent}>
            <span className={styles.sectionLabel}>The checkout</span>
            <h2 id="checkout-heading" className={styles.checkoutHeading}>
              See what your users see.
            </h2>
            <p className={styles.checkoutDesc}>
              A branded checkout page. Card denomination, Naira amount, bank
              transfer details, copy button, 30-minute countdown. Three screens
              from start to confirmed. No signup, no email, no account creation.
            </p>
            <div className={styles.checkoutStats}>
              <div className={styles.checkoutStat}>
                <span className={styles.checkoutStatValue}>3</span>
                <span className={styles.checkoutStatLabel}>Screens total</span>
              </div>
              <div className={styles.checkoutStat}>
                <span className={styles.checkoutStatValue}>0</span>
                <span className={styles.checkoutStatLabel}>Fields to fill</span>
              </div>
              <div className={styles.checkoutStat}>
                <span className={styles.checkoutStatValue}>&lt;5s</span>
                <span className={styles.checkoutStatLabel}>To confirmation</span>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={200}>
          <div className={styles.checkoutMockup}>
            <div className={styles.mockupGlow} aria-hidden="true" />
            <CheckoutMockup />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
