import styles from '@styles/ui/checkout-mockup.module.css';

export function CheckoutMockup() {
  return (
    <div
      className={styles.device}
      role="img"
      aria-label="Remvo checkout screen showing a 25 dollar deposit with bank transfer details"
    >
      {/* ── Status bar ── */}
      <div className={styles.statusBar}>
        <span className={styles.statusTime}>14:32</span>
        <div className={styles.statusIcons}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 19c1-1.5 3.5-3 7-3s6 1.5 7 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            <circle cx="12" cy="21" r="1" fill="currentColor"/>
          </svg>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="8" width="2.5" height="12" rx="1" fill="currentColor" opacity="0.3"/>
            <rect x="8" y="5" width="2.5" height="15" rx="1" fill="currentColor" opacity="0.5"/>
            <rect x="13" y="2" width="2.5" height="18" rx="1" fill="currentColor" opacity="0.7"/>
            <rect x="18" y="0" width="2.5" height="20" rx="1" fill="currentColor"/>
          </svg>
          <svg width="16" height="10" viewBox="0 0 28 14" fill="none" aria-hidden="true">
            <rect x="0.5" y="1.5" width="22" height="11" rx="2" stroke="currentColor" strokeWidth="1"/>
            <rect x="23.5" y="4.5" width="2" height="5" rx="0.5" fill="currentColor" opacity="0.4"/>
            <rect x="2" y="3" width="15" height="8" rx="1" fill="currentColor" opacity="0.6"/>
          </svg>
        </div>
      </div>

      {/* ── Screen ── */}
      <div className={styles.screen}>

        {/* Nav bar */}
        <div className={styles.nav}>
          <svg className={styles.navBack} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
          <span className={styles.navUrl}>pay.remvo.app</span>
          <div className={styles.navSpacer} />
        </div>

        {/* Checkout logo */}
        <div className={styles.logo}>
          <svg width="14" height="17" viewBox="0 0 40 48" fill="#C9A84C" aria-hidden="true">
            <polygon points="20,6 32,13 20,20 8,13" opacity="1"/>
            <polygon points="20,12 32,19 20,26 8,19" opacity="0.55"/>
            <polygon points="20,18 32,25 20,32 8,25" opacity="0.25"/>
          </svg>
          <span className={styles.logoText}>REMVO</span>
        </div>

        {/* Value card */}
        <div className={styles.card}>
          <div className={styles.cardTop}>
            <div className={styles.cardBrand}>
              <svg width="10" height="12" viewBox="0 0 40 48" fill="#C9A84C" aria-hidden="true">
                <polygon points="20,6 32,13 20,20 8,13" opacity="1"/>
                <polygon points="20,12 32,19 20,26 8,19" opacity="0.55"/>
                <polygon points="20,18 32,25 20,32 8,25" opacity="0.25"/>
              </svg>
              <span className={styles.cardBrandText}>REMVO</span>
            </div>
            <span className={styles.cardLabel}>DIGITAL VALUE CARD</span>
          </div>
          <div className={styles.cardBottom}>
            <span className={styles.cardAmount}>$25</span>
            <span className={styles.cardRef}>RMV-2026-0031-7A4F</span>
          </div>
        </div>

        {/* Naira amount */}
        <div className={styles.amount}>
          <span className={styles.amountValue}>₦38,800</span>
          <span className={styles.amountRate}>₦1,552 per dollar</span>
        </div>

        {/* Bank transfer card */}
        <div className={styles.bank}>
          <span className={styles.bankTitle}>Transfer to this account</span>
          <div className={styles.bankCard}>
            <div className={styles.bankRow}>
              <span className={styles.bankLabel}>Bank</span>
              <span className={styles.bankValue}>Wema Bank</span>
            </div>
            <div className={styles.bankDivider} />
            <div className={styles.bankRow}>
              <span className={styles.bankLabel}>Account number</span>
              <span className={styles.bankMono}>782 345 6123</span>
            </div>
            <div className={styles.bankDivider} />
            <div className={styles.bankRow}>
              <span className={styles.bankLabel}>Amount</span>
              <span className={styles.bankMono}>₦38,800.00</span>
            </div>
          </div>
        </div>

        {/* Copy button */}
        <button className={styles.copyBtn} type="button" tabIndex={-1}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <rect x="9" y="9" width="13" height="13" rx="2"/>
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
          </svg>
          Copy account number
        </button>

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.timer}>
            <span className={styles.timerValue}>29:42</span>
            <span className={styles.timerLabel}>remaining</span>
          </div>
          <div className={styles.status}>
            <span className={styles.statusDot} />
            Waiting for your transfer
          </div>
        </div>
      </div>
    </div>
  );
}
