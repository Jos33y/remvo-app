import styles from '@styles/ui/vault-watermark.module.css';

/* Three stacked diamond planes — the vault glyph from the logo,
 * blown up and anchored bottom-right, off-axis. Decorative.
 *
 * @param {{ size?: 'default' | 'large' }} props
 *   default: ~70vh, used on SelectPage
 *   large:   ~95vh, used on LandingPage
 */
export function VaultWatermark({ size = 'default' }) {
  return (
    <svg
      className={`${styles.watermark} ${styles[size]}`}
      viewBox="0 0 100 100"
      aria-hidden="true"
    >
      <g fill="var(--color-gold)" className={styles.planes}>
        <polygon points="50,10 85,30 50,50 15,30" />
        <polygon points="50,40 85,60 50,80 15,60" />
        <polygon points="50,70 85,90 50,110 15,90" />
      </g>
    </svg>
  );
}
