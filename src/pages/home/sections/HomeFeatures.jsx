import { Link } from 'react-router';
import { Reveal } from '@components/ui/marketing/Reveal';
import { useMarket } from '@hooks/useMarket';
import { money } from '@lib/market';
import { ROUTES, PRICING } from '@utils/constants';
import styles from '@styles/pages/marketing/homepage.module.css';

function steps(currency, site) {
  return [
    {
      num: '01',
      title: 'Open an account',
      desc: `An email and a password. Your first listing is on us; after that, credits from ${money(PRICING.PACKS[0].price[currency], currency)}. No subscription and nothing to cancel. Credits you buy last ${PRICING.EXPIRY_MONTHS} months, and every top-up extends them.`,
    },
    {
      num: '02',
      title: 'Give it a product',
      desc: `Type the barcode from the box, or paste its ${site.amazon} link, and say what condition it is in. If the barcode matches more than one product, you pick before any credits are used.`,
    },
    {
      num: '03',
      title: 'Check it, copy it in',
      desc: 'Change anything you like, then copy each field into eBay or download the lot as a file. You publish it yourself. Remvo never touches your eBay account.',
    },
  ];
}

export function HomeFeatures() {
  const { currency, site } = useMarket();
  const STEPS = steps(currency, site);
  return (
    <section className={styles.features} aria-labelledby="features-heading">
      <div className={styles.featuresInner}>
        <Reveal>
          <span className={styles.sectionLabel}>How it works</span>
          <h2 id="features-heading" className={styles.featuresHeading}>
            The typing, done before you open eBay.
          </h2>
        </Reveal>

        <ol className={styles.featureGrid}>
          {STEPS.map((s, i) => (
            <li key={s.num}>
              <Reveal delay={i * 80}>
                <div className={styles.featureBlock}>
                  <span className={styles.featureNum} aria-hidden="true">{s.num}</span>
                  <h3 className={styles.featureTitle}>{s.title}</h3>
                  <p className={styles.featureDesc}>{s.desc}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>

        <Reveal>
          <p className={styles.featuresMore}>
            <Link to={ROUTES.HOW} className={styles.inlineLink}>What Remvo reads, what it writes, and what it never does</Link>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
