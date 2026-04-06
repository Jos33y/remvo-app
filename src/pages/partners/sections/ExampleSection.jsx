import { Reveal } from '@components/ui/Reveal';
import styles from '@styles/pages/partners.module.css';

const STEPS = [
  "On GE-AS, a user taps 'Deposit with Naira' and enters $100.",
  'She is redirected to Remvo checkout. The page shows a $100 Remvo Card and asks her to pay ₦151,414 by bank transfer.',
  'She opens her bank app, transfers ₦151,414, and returns to the page.',
  'Payment confirms within seconds. Remvo fires a webhook to GE-AS.',
  'GE-AS credits her account with $100 instantly. She starts trading.',
  'Later the same day, Remvo settles $99 to the GE-AS wallet in a batch.',
];

export function ExampleSection() {
  return (
    <section className={styles.section} aria-labelledby="example-heading">
      <div className={styles.sectionInner}>
        <Reveal>
          <div className={styles.sectionLabel}>Worked example</div>
          <h2 id="example-heading" className={styles.sectionHeading}>
            A $100 deposit, in numbers.
          </h2>
          <p className={styles.sectionBody}>
            The same flow as above, with real values. Two views of one transaction: what the user experiences, and what settles to your wallet.
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
              {/* ── User side ── */}
              <div className={styles.exampleBlock}>
                <div className={styles.exampleBlockLabel}>
                  User experience
                </div>

                <div className={styles.exampleHero}>
                  <div className={styles.exampleHeroRow}>
                    <span className={styles.exampleHeroLabel}>Pays</span>
                    <span className={styles.exampleHeroAmount}>₦151,414</span>
                  </div>
                  <div className={styles.exampleHeroRate}>
                    at ₦1,514 per dollar
                  </div>
                </div>

                <div className={styles.exampleCreditRow}>
                  <span className={styles.exampleCreditLabel}>
                    Balance credited on GE-AS
                  </span>
                  <span className={styles.exampleCreditAmount}>$100.00</span>
                </div>
              </div>

              <div className={styles.exampleDivider} aria-hidden="true" />

              {/* ── Platform side ── */}
              <div className={styles.exampleBlock}>
                <div className={styles.exampleBlockLabel}>
                  GE-AS settlement
                </div>

                <dl className={styles.exampleTable}>
                  <div className={styles.exampleRow}>
                    <dt className={styles.exampleRowLabel}>Card value</dt>
                    <dd className={styles.exampleRowValue}>$100.00</dd>
                  </div>
                  <div className={styles.exampleRow}>
                    <dt className={styles.exampleRowLabel}>
                      Less: Remvo service fee (1%)
                    </dt>
                    <dd className={styles.exampleRowValue}>−$1.00</dd>
                  </div>
                  <div
                    className={`${styles.exampleRow} ${styles.exampleRowTotal}`}
                  >
                    <dt className={styles.exampleRowLabel}>
                      Settled to GE-AS wallet
                    </dt>
                    <dd className={styles.exampleRowValue}>$99.00</dd>
                  </div>
                </dl>
              </div>

              <p className={styles.exampleNote}>
                The rate moves with the market and is locked for each checkout session. ₦1,514 is an example figure. Remvo retains a 2% service fee on every transaction, split between the user side and the platform side. The user never sees a fee line item.
              </p>
            </div>
          </Reveal>
        </div>

        <Reveal delay={200}>
          <div className={styles.exampleScale}>
            <span className={styles.exampleScaleLabel}>At scale</span>
            <span className={styles.exampleScaleText}>
              100 deposits a day averaging $100 settles $9,900 daily to the GE-AS wallet. Every user credited instantly at full card value. Zero integration overhead beyond receiving the webhook.
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
