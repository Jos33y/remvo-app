import { useEffect } from 'react';
import { Reveal } from '@components/ui/marketing/Reveal';
import { BRAND } from '@utils/constants';
import styles from '@styles/pages/marketing/contact.module.css';

export function ContactPage() {
  useEffect(() => {
    document.title = 'Remvo | Contact';
  }, []);

  return (
    <section className={styles.contact}>
      <div className={styles.inner}>
        <Reveal>
          <span className={styles.label}>Contact</span>
          <h1 className={styles.heading}>Talk to us directly.</h1>
          <p className={styles.sub}>
            No contact form, no ticket queue. Reach the team that builds and
            operates {BRAND.NAME}.
          </p>
        </Reveal>

        <div className={styles.channels}>
          <Reveal delay={100}>
            <a href={`mailto:${BRAND.EMAIL}`} className={styles.card}>
              <div className={styles.cardIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M22 4L12 13 2 4" />
                </svg>
              </div>
              <h2 className={styles.cardTitle}>Bought a card</h2>
              <p className={styles.cardValue}>{BRAND.EMAIL}</p>
              <p className={styles.cardMeta}>Include your transaction reference</p>
            </a>
          </Reveal>

          <Reveal delay={200}>
            <a href={`mailto:${BRAND.PARTNERS_EMAIL}`} className={styles.card}>
              <div className={styles.cardIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="2" y="7" width="20" height="14" rx="2" />
                  <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
                </svg>
              </div>
              <h2 className={styles.cardTitle}>Accept Remvo Cards</h2>
              <p className={styles.cardValue}>{BRAND.PARTNERS_EMAIL}</p>
              <p className={styles.cardMeta}>Response within 1 business day</p>
            </a>
          </Reveal>

          <Reveal delay={300}>
            <a href={`mailto:${BRAND.LEGAL_EMAIL}`} className={styles.card}>
              <div className={styles.cardIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 3l8 4v5c0 4.5-3.2 7.9-8 9-4.8-1.1-8-4.5-8-9V7l8-4z" />
                </svg>
              </div>
              <h2 className={styles.cardTitle}>Legal and compliance</h2>
              <p className={styles.cardValue}>{BRAND.LEGAL_EMAIL}</p>
              <p className={styles.cardMeta}>Data protection, compliance, company enquiries</p>
            </a>
          </Reveal>
        </div>

        <Reveal delay={400}>
          <div className={styles.guidance}>
            <h3 className={styles.guidanceTitle}>Accepting Remvo Cards</h3>
            <p className={styles.guidanceText}>
              If your customers are in Nigeria and you want them to be able to
              pay you with a {BRAND.NAME} Card, tell us:
            </p>
            <div className={styles.guidanceList}>
              <div className={styles.guidanceItem}>
                <span className={styles.guidanceLabel}>Company and product</span>
                <span className={styles.guidanceDesc}>Your registered company, product name, and URL</span>
              </div>
              <div className={styles.guidanceItem}>
                <span className={styles.guidanceLabel}>Where your customers are</span>
                <span className={styles.guidanceDesc}>The countries your customers are based in</span>
              </div>
              <div className={styles.guidanceItem}>
                <span className={styles.guidanceLabel}>How they pay you today</span>
                <span className={styles.guidanceDesc}>What you currently accept, and what is missing</span>
              </div>
              <div className={styles.guidanceItem}>
                <span className={styles.guidanceLabel}>Timeline</span>
                <span className={styles.guidanceDesc}>When you would like to start accepting cards</span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
