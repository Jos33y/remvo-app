import { Reveal } from '@components/ui/marketing/Reveal';
import { BRAND } from '@utils/constants';
import { openChat } from '@lib/chatBus';
import styles from '@styles/pages/marketing/contact.module.css';

/* The chat first (chat3): a person answers, usually within a few
 * hours. Then two addresses: one for anything about your account, a
 * job, credits or a refund; one for company, legal and data
 * protection, answered within 48 hours, the time Polar holds
 * merchants to. */
export function ContactPage() {

  return (
    <section className={styles.contact}>
      <div className={styles.inner}>
        <Reveal>
          <h1 className={styles.heading}>Talk to the people who build it.</h1>
          <p className={styles.sub}>
            No ticket queue. A person answers the chat, usually within a few
            hours, and every email within 48.
          </p>
        </Reveal>

        <div className={styles.channels}>
          <Reveal className={styles.chatSlot}>
            <button type="button" className={`${styles.card} ${styles.cardChat}`} onClick={() => openChat()}>
              <div className={styles.cardIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 5h16v11H9l-5 4z" />
                </svg>
              </div>
              <h2 className={styles.cardTitle}>Anything at all</h2>
              <p className={styles.cardValue}>Chat with us</p>
              <p className={styles.cardMeta}>A person answers, usually within a few hours</p>
            </button>
          </Reveal>

          <Reveal delay={80}>
            <a href={`mailto:${BRAND.EMAIL}`} className={styles.card}>
              <div className={styles.cardIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M22 4L12 13 2 4" />
                </svg>
              </div>
              <h2 className={styles.cardTitle}>Your account, a job or a refund</h2>
              <p className={styles.cardValue}>{BRAND.EMAIL}</p>
              <p className={styles.cardMeta}>Write from the email you sign in with</p>
            </a>
          </Reveal>

          <Reveal delay={160}>
            <a href={`mailto:${BRAND.LEGAL_EMAIL}?subject=${encodeURIComponent('Data or legal request')}`} className={styles.card}>
              <div className={styles.cardIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 3l8 4v5c0 4.5-3.2 7.9-8 9-4.8-1.1-8-4.5-8-9V7l8-4z" />
                </svg>
              </div>
              <h2 className={styles.cardTitle}>Company, legal and your data</h2>
              <p className={styles.cardValue}>{BRAND.LEGAL_EMAIL}</p>
              <p className={styles.cardMeta}>Data requests, company enquiries</p>
            </a>
          </Reveal>
        </div>

        <Reveal delay={240}>
          <div className={styles.guidance}>
            <h2 className={styles.guidanceTitle}>Writing about a job</h2>
            <p className={styles.guidanceText}>
              It saves a reply if you include:
            </p>
            <dl className={styles.guidanceList}>
              <div className={styles.guidanceItem}>
                <dt className={styles.guidanceLabel}>Job reference</dt>
                <dd className={styles.guidanceDesc}>Shown at the top of every result</dd>
              </div>
              <div className={styles.guidanceItem}>
                <dt className={styles.guidanceLabel}>What you gave it</dt>
                <dd className={styles.guidanceDesc}>The barcode or the link</dd>
              </div>
              <div className={styles.guidanceItem}>
                <dt className={styles.guidanceLabel}>What was wrong</dt>
                <dd className={styles.guidanceDesc}>The field, and what it should have said</dd>
              </div>
            </dl>
          </div>
        </Reveal>

        <Reveal delay={300}>
          <p className={styles.company}>
            {BRAND.LEGAL_NAME} | RC {BRAND.RC_NUMBER} | {BRAND.ADDRESS}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
