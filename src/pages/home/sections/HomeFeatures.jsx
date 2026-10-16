import { Link } from 'react-router';
import { useMarket } from '@hooks/useMarket';
import { money } from '@lib/market';
import { ROUTES, PRICING } from '@utils/constants';
import styles from '@styles/pages/marketing/homepage.module.css';

/* Three steps, in the order a seller takes them: numbered because
 * they are a sequence. */
function steps(currency) {
  return [
    {
      title: 'Open an account',
      desc: `An email and a password. Your first listing is on us; after that, credits from ${money(PRICING.PACKS[0].price[currency], currency)}. No subscription and nothing to cancel. Credits you buy last ${PRICING.EXPIRY_MONTHS} months, and every top-up extends them.`,
    },
    {
      title: 'Give it a product',
      desc: 'Type the barcode from the box, or paste the product’s link, and say what condition it is in. If it matches more than one product, you pick before any credits are used.',
    },
    {
      title: 'Check it, copy it in',
      desc: 'Change anything you like, then copy each field into eBay or download the lot as a file. You publish it yourself. Remvo never touches your eBay account.',
    },
  ];
}

export function HomeFeatures() {
  const { currency } = useMarket();
  return (
    <section className={styles.features} aria-labelledby="features-heading">
      <div className={styles.inner}>
        <h2 id="features-heading" className={styles.h2}>
          The typing, done before you open eBay.
        </h2>

        <ol className={styles.steps}>
          {steps(currency).map((s, i) => (
            <li key={s.title} className={styles.step}>
              <span className={styles.stepNum} aria-hidden="true">{i + 1}</span>
              <h3 className={styles.stepTitle}>{s.title}</h3>
              <p className={styles.stepDesc}>{s.desc}</p>
            </li>
          ))}
        </ol>

        <p className={styles.more}>
          <Link to={ROUTES.HOW} className={styles.inlineLink}>What Remvo reads, what it writes, and what it never does</Link>
        </p>
      </div>
    </section>
  );
}
