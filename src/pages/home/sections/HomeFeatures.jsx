import { Reveal } from '@components/ui/Reveal';
import styles from '@styles/pages/homepage.module.css';

const FEATURES = [
  {
    num: '01',
    title: 'Conversion routing',
    desc: 'Value in one form, out another. Naira enters via bank transfer. Dollars settle to your platform. No custody, no holding period beyond the conversion window.',
  },
  {
    num: '02',
    title: 'Instant credit',
    desc: 'The moment payment confirms, a webhook fires. Your platform credits the user immediately. No waiting for batch processing or manual review.',
  },
  {
    num: '03',
    title: 'Daily settlement',
    desc: 'Dollar value settles to your platform every day. Transaction reference, email confirmation, full audit trail.',
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
