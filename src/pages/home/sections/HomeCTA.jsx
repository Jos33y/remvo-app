import { Button } from '@components/ui/shared/Button';
import { useMarket } from '@hooks/useMarket';
import { money } from '@lib/market';
import { APP_LINKS, PRICING } from '@utils/constants';
import styles from '@styles/pages/marketing/homepage.module.css';

export function HomeCTA() {
  const { currency } = useMarket();
  return (
    <section className={styles.cta} aria-labelledby="cta-heading">
      <div className={styles.ctaInner}>
        <h2 id="cta-heading" className={styles.ctaHeading}>
          Try it on the next thing you list.
        </h2>
        <p className={styles.ctaDesc}>
          Open an account and give it one product. Your first listing is on us. After that, top-ups start at {money(PRICING.PACKS[0].price[currency], currency)}.
        </p>
        <Button href={APP_LINKS.SIGN_UP} variant="ivory" size="large">
          Make your first listing
        </Button>
      </div>
    </section>
  );
}
