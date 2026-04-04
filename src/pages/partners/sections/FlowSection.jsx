import { Reveal } from '@components/ui/Reveal';
import styles from '@styles/pages/partners.module.css';

const STEPS = [
  {
    number: '1',
    title: 'User selects amount',
    description:
      'Your backend calls the Remvo API to create a checkout session. The user is redirected to a branded checkout page.',
  },
  {
    number: '2',
    title: 'User pays via bank transfer',
    description:
      'The checkout shows a bank account number, exact Naira amount, and a 30-minute window. The user transfers from their bank app.',
  },
  {
    number: '3',
    title: 'Platform credits instantly',
    description:
      'Remvo fires a webhook the moment payment confirms. You credit the user balance immediately. USDT settles daily.',
  },
];

export function FlowSection() {
  return (
    <section className={styles.section} aria-labelledby="flow-heading">
      <div className={styles.sectionInner}>
        <Reveal>
          <div className={styles.sectionLabel}>How it works</div>
          <h2 id="flow-heading" className={styles.sectionHeading}>
            Three steps. No crypto for your users.
          </h2>
        </Reveal>
        <div className={styles.flowGrid}>
          {STEPS.map((step, i) => (
            <Reveal key={step.number} delay={i * 100}>
              <div className={styles.flowStep}>
                <div className={styles.flowNumber}>{step.number}</div>
                <h3 className={styles.flowTitle}>{step.title}</h3>
                <p className={styles.flowDescription}>{step.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
