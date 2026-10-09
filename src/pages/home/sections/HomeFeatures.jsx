import { Link } from 'react-router';
import { Reveal } from '@components/ui/marketing/Reveal';
import { ROUTES, PRICING } from '@utils/constants';
import styles from '@styles/pages/marketing/homepage.module.css';

const STEPS = [
  {
    num: '01',
    title: 'Top up',
    desc: `Buy credits from £5. No subscription and nothing to cancel. Credits last ${PRICING.EXPIRY_MONTHS} months, and every top-up extends the lot.`,
  },
  {
    num: '02',
    title: 'Give it a product',
    desc: 'Type the barcode from the box, or paste the Amazon UK link for it. If the barcode matches more than one product, you pick, before any credits are used.',
  },
  {
    num: '03',
    title: 'Copy it into eBay',
    desc: 'Every field has its own copy button, or download the lot as a file. You publish it yourself. Remvo never touches your eBay account.',
  },
];

export function HomeFeatures() {
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
