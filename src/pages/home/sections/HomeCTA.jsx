import { Button } from '@components/ui/shared/Button';
import { Reveal } from '@components/ui/marketing/Reveal';
import { useMarket } from '@hooks/useMarket';
import { money } from '@lib/market';
import { APP_LINKS, PRICING } from '@utils/constants';
import styles from '@styles/pages/marketing/homepage.module.css';

export function HomeCTA() {
  const { currency } = useMarket();
  return (
    <section className={styles.cta} aria-labelledby="cta-heading">
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
            Try it on the next thing you list.
          </h2>
          <p className={styles.ctaDesc}>
            Sign in with your email and give it one barcode. Your first listing is on us. After that, top-ups start at {money(PRICING.PACKS[0].price[currency], currency)}.
          </p>
          <div className={styles.ctaActions}>
            <Button href={APP_LINKS.SIGN_IN} variant="primary" size="large">
              Make your first listing
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
