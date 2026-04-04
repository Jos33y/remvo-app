import styles from '@styles/ui/remvo-card.module.css';

export function RemvoCard({ amount = 25, reference = 'RMV-2026-0031-7A4F', scale = 1 }) {
  const formattedAmount = Number.isInteger(amount) ? amount : amount.toFixed(2);

  return (
    <div
      className={styles.card}
      style={{ transform: `scale(${scale})` }}
      role="img"
      aria-label={`${formattedAmount} dollar Remvo Digital Value Card`}
    >
      <div className={styles.top}>
        <div className={styles.brand}>
          <svg
            className={styles.mark}
            viewBox="0 0 40 48"
            fill="#C9A84C"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <polygon points="20,6 32,13 20,20 8,13" opacity="1" />
            <polygon points="20,12 32,19 20,26 8,19" opacity="0.55" />
            <polygon points="20,18 32,25 20,32 8,25" opacity="0.25" />
          </svg>
          <span className={styles.brandName}>REMVO</span>
        </div>
        <span className={styles.label}>DIGITAL VALUE CARD</span>
      </div>
      <div className={styles.bottom}>
        <span className={styles.amount}>${formattedAmount}</span>
        <span className={styles.reference}>{reference}</span>
      </div>
    </div>
  );
}
