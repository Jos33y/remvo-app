import { Reveal } from '@components/ui/marketing/Reveal';
import styles from '@styles/pages/marketing/homepage.module.css';

const FEATURES = [
  {
    num: '01',
    title: 'Card checkout',
    desc: 'Your users buy digital value cards in Naira through a hosted checkout. The dollar value is credited to your platform. One integration, one flow.',
  },
  {
    num: '02',
    title: 'Instant credit',
    desc: 'The moment payment confirms, a webhook fires. Your platform credits the user immediately. No waiting, no manual review.',
  },
  {
    num: '03',
    title: 'Daily reconciliation',
    desc: 'Dollar value posts to your platform every day. Reference number, email confirmation, full audit trail.',
  },
];

export function HomeFeatures() {
  return (
    <section className={styles.features} aria-labelledby="features-heading">
      <div className={styles.featuresInner}>
        <Reveal>
          <span className={styles.sectionLabel}>How it works</span>
          <h2 id="features-heading" className={styles.featuresHeading}>
            Three steps. Zero complexity.
          </h2>
        </Reveal>

        <div className={styles.featureGrid}>
          {FEATURES.map((f, i) => (
            <Reveal key={f.num} delay={i * 100}>
              <div className={styles.featureBlock}>
                <span className={styles.featureNum}>{f.num}</span>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureDesc}>{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
