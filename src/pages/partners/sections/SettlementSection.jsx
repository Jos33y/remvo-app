import { Reveal } from '@components/ui/Reveal';
import styles from '@styles/pages/partners.module.css';

const TERMS = [
  { label: 'Settlement asset', value: 'USDT' },
  { label: 'Network', value: 'Solana' },
  { label: 'Additional networks', value: 'TRON, Ethereum (coming)' },
  { label: 'Schedule', value: 'Daily batch' },
  { label: 'User credit', value: 'Instant via webhook' },
  { label: 'Setup fee', value: 'None' },
  { label: 'Monthly fee', value: 'None' },
];

export function SettlementSection() {
  return (
    <section className={styles.section} aria-labelledby="settlement-heading">
      <div className={styles.sectionInner}>
        <Reveal>
          <div className={styles.sectionLabel}>Settlement</div>
          <h2 id="settlement-heading" className={styles.sectionHeading}>
            USDT to your wallet. Every day.
          </h2>
        </Reveal>
        <div className={styles.settlementGrid}>
          <Reveal>
            <div className={styles.termsTable} role="table" aria-label="Settlement terms">
              {TERMS.map((term) => (
                <div key={term.label} className={styles.termsRow} role="row">
                  <span className={styles.termsLabel} role="rowheader">{term.label}</span>
                  <span className={styles.termsValue} role="cell">{term.value}</span>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={150}>
            <div className={styles.settlementHighlight}>
              <div className={styles.highlightLabel}>How settlement works</div>
              <h3 className={styles.highlightHeading}>
                Users deposit throughout the day. You receive one batch at
                your configured time.
              </h3>
              <p className={styles.highlightBody}>
                Each deposit triggers a webhook so you credit the user
                immediately. At settlement time, accumulated USDT is sent
                to your wallet with email and WhatsApp confirmation.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
