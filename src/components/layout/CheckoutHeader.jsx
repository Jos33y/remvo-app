import { Logo } from '@components/ui/Logo';
import styles from '@styles/layout/checkout-header.module.css';

/* ──────────────────────────────────────────────────────────────────
 * CheckoutHeader
 *
 * Slim, recessive header. Logo kept at `size="small"` so it stays
 * out of the page hero's way while still carrying the full brand
 * (mark + wordmark). The page hero — the card visual + Naira hero
 * — owns the visual weight; the header anchors brand without
 * competing for attention.
 *
 * The logo is non-interactive (href={null}) so a tap mid-payment
 * cannot navigate the user away from a live session.
 *
 * The platform context "for GE-AS" stays on the right with a
 * marginally smaller, calmer treatment.
 *
 * @param {{ platformName?: string }} props
 * ────────────────────────────────────────────────────────────────── */

export function CheckoutHeader({ platformName }) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Logo href={null} variant="gold" size="small" />

        {platformName && (
          <span className={styles.platform}>
            <span className={styles.platformLabel}>for</span>
            <span className={styles.platformName}>{platformName}</span>
          </span>
        )}
      </div>
    </header>
  );
}
