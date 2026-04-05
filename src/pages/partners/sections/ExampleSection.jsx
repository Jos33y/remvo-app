import { Reveal } from '@components/ui/Reveal';
import styles from '@styles/pages/partners.module.css';

const STEPS = [
  "On GE-AS, a user taps 'Deposit with Naira' and enters $25.",
  'She is redirected to Remvo checkout. The page shows a $25 Remvo Card and asks her to pay ₦37,950 by bank transfer.',
  'She opens her bank app, transfers ₦37,950, and returns to the page.',
  'Payment confirms within seconds. Remvo fires a webhook to GE-AS.',
  'GE-AS credits her account with $25 instantly. She starts trading.',
  'Later the same day, Remvo settles $24.50 to the GE-AS wallet in a batch.',
];

export function ExampleSection() {
  return (
    <section className={styles.section} aria-labelledby="example-heading">
      <div className={styles.sectionInner}>
        <Reveal>
          <div className={styles.sectionLabel}>Worked example</div>
          <h2 id="example-heading" className={styles.sectionHeading}>
            A $25 deposit, in numbers.
          </h2>
          <p className={styles.sectionBody}>
            The same flow as above, with real values. This is what a user sees, what they pay, and what lands in your wallet on a single transaction.
          </p>
        </Reveal>

        <div className={styles.exampleGrid}>
          <Reveal>
            <ol className={styles.exampleStory}>
              {STEPS.map((step, i) => (
                <li key={i} className={styles.exampleStep}>
                  <span className={styles.exampleStepNumber}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className={styles.exampleStepText}>{step}</span>
                </li>
              ))}
            </ol>
          </Reveal>

          <Reveal delay={100}>
            <div className={styles.exampleBreakdown}>
              <div className={styles.examplePays}>
                <div className={styles.examplePaysLabel}>User pays</div>
                <div className={styles.examplePaysAmount}>₦37,950</div>
                <div className={styles.examplePaysRate}>
                  at ₦1,518 per dollar
                </div>
              </div>

              <div className={styles.exampleDivider} aria-hidden="true" />

              <div className={styles.exampleBreakdownLabel}>
                Breakdown
              </div>
              <dl className={styles.exampleTable}>
                <div className={styles.exampleRow}>
                  <dt className={styles.exampleRowLabel}>Card value</dt>
                  <dd className={styles.exampleRowValue}>$25.00</dd>
                </div>
                <div className={styles.exampleRow}>
                  <dt className={styles.exampleRowLabel}>
                    Less: Remvo service fee (2%)
                  </dt>
                  <dd className={styles.exampleRowValue}>−$0.50</dd>
                </div>
                <div
                  className={`${styles.exampleRow} ${styles.exampleRowTotal}`}
                >
                  <dt className={styles.exampleRowLabel}>
                    Settled to GE-AS wallet
                  </dt>
                  <dd className={styles.exampleRowValue}>$24.50</dd>
                </div>
              </dl>

              <p className={styles.exampleNote}>
                ₦1,518 is today&rsquo;s rate. Remvo recalculates it continuously from live market data, so the number moves with the market. The user sees the current rate at checkout, locked for the 30-minute payment window.
              </p>
            </div>
          </Reveal>
        </div>

        <Reveal delay={200}>
          <div className={styles.exampleScale}>
            <span className={styles.exampleScaleLabel}>At scale</span>
            <span className={styles.exampleScaleText}>
              100 deposits a day averaging $25 settles ~$2,450 daily to the GE-AS wallet. Every user credited instantly. Zero integration overhead beyond receiving the webhook.
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
