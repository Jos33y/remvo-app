import { CheckoutMockup } from '@components/ui/marketing/CheckoutMockup';
import { Reveal } from '@components/ui/marketing/Reveal';
import styles from '@styles/pages/marketing/homepage.module.css';

export function HomeCheckout() {
  return (
    <section className={styles.checkout} aria-labelledby="checkout-heading">
      <div className={styles.checkoutInner}>
        <Reveal>
          <div className={styles.checkoutContent}>
            <span className={styles.sectionLabel}>Buying a card</span>
            <h2 id="checkout-heading" className={styles.checkoutHeading}>
              Three screens, start to finish.
            </h2>
            <p className={styles.checkoutDesc}>
              Pick your denomination. Give us your name, email and phone so we
              know who bought the card. Copy the account number and transfer.
              You get a reference and your card is active.
            </p>
            <div className={styles.checkoutStats}>
              <div className={styles.checkoutStat}>
                <span className={styles.checkoutStatValue}>3</span>
                <span className={styles.checkoutStatLabel}>Screens total</span>
              </div>
              <div className={styles.checkoutStat}>
                <span className={styles.checkoutStatValue}>30 min</span>
                <span className={styles.checkoutStatLabel}>To transfer</span>
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
            <CheckoutMockup />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
