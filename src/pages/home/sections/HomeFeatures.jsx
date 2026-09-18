import { Reveal } from '@components/ui/marketing/Reveal';
import styles from '@styles/pages/marketing/homepage.module.css';

const FEATURES = [
  {
    num: '01',
    title: 'Choose a card',
    desc: 'Denominations from $10 to $500, or enter your own amount. You see the Naira price before you pay. That price is the whole cost.',
  },
  {
    num: '02',
    title: 'Pay by bank transfer',
    desc: 'Copy the account number, send the transfer from your bank app. You have thirty minutes. No card, no USSD, no app to install.',
  },
  {
    num: '03',
    title: 'Use it immediately',
    desc: 'Your card activates the moment payment confirms, and its value is applied to your account at the platform you bought it for.',
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
