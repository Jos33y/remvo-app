import { useEffect } from 'react';
import { Reveal } from '@components/ui/Reveal';
import { BRAND, EXTERNAL } from '@utils/constants';
import styles from '@styles/pages/contact.module.css';

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
            <a
              href={`mailto:${BRAND.EMAIL}`}
              className={styles.card}
            >
              <div className={styles.cardIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M22 4L12 13 2 4" />
                </svg>
              </div>
              <h2 className={styles.cardTitle}>Email</h2>
              <p className={styles.cardValue}>{BRAND.EMAIL}</p>
              <p className={styles.cardMeta}>Response within 1 business day</p>
            </a>
          </Reveal>

          <Reveal delay={200}>
            <a
              href={EXTERNAL.WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.card}
            >
              <div className={styles.cardIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
                </svg>
              </div>
              <h2 className={styles.cardTitle}>WhatsApp</h2>
              <p className={styles.cardValue}>Send a message</p>
              <p className={styles.cardMeta}>For time-sensitive enquiries</p>
            </a>
          </Reveal>
        </div>

        <Reveal delay={300}>
          <div className={styles.guidance}>
            <h3 className={styles.guidanceTitle}>For platform partnerships</h3>
            <p className={styles.guidanceText}>
              If you operate a platform and want to offer Naira deposits to
              your users, include the following in your message:
            </p>
            <div className={styles.guidanceList}>
              <div className={styles.guidanceItem}>
                <span className={styles.guidanceLabel}>Platform name</span>
                <span className={styles.guidanceDesc}>Your product name and URL</span>
              </div>
              <div className={styles.guidanceItem}>
                <span className={styles.guidanceLabel}>Expected volume</span>
                <span className={styles.guidanceDesc}>Monthly deposit volume estimate in Naira or USD</span>
              </div>
              <div className={styles.guidanceItem}>
                <span className={styles.guidanceLabel}>Settlement preference</span>
                <span className={styles.guidanceDesc}>USDT network preference (Solana, TRON, or ERC-20)</span>
              </div>
              <div className={styles.guidanceItem}>
                <span className={styles.guidanceLabel}>Timeline</span>
                <span className={styles.guidanceDesc}>When you want to go live</span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
