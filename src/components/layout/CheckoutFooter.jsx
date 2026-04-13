import { IconLock } from '@components/ui/icons/IconLock';
import styles from '@styles/layout/checkout-footer.module.css';

/* ──────────────────────────────────────────────────────────────────
 * CheckoutFooter
 *
 * Slim footer with two elements:
 *   Left: trust signal — lock icon + "Secured by Remvo"
 *   Right: Help link to remvo.app/contact (new tab)
 *
 * The lock icon is a small visual reinforcement of the trust
 * statement. Top fintechs always pair "secured by" copy with a
 * lock or shield glyph because the visual reads faster than the
 * word, especially for users who don't read English fluently.
 *
 * The help link opens in a new tab so a help click during a live
 * payment session never drops the user out of the checkout flow.
 * ────────────────────────────────────────────────────────────────── */

export function CheckoutFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <span className={styles.secured}>
          <IconLock size={12} className={styles.securedIcon} />
          <span>Secured by Remvo</span>
        </span>
        <a
          href="https://remvo.app/contact"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.help}
        >
          Help
        </a>
      </div>
    </footer>
  );
}
