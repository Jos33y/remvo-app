import { Logo } from '@components/ui/shared/Logo';
import { SellerCard } from '@components/ui/seller/SellerCard';
import { BRAND, siteUrl } from '@utils/constants';
import '@styles/base/instrument-serif.css';
import styles from '@styles/pages/seller/sign-in.module.css';

/* ──────────────────────────────────────────────────────────────────
 * AuthLayout
 *
 * Every screen before the app: sign in, open an account, confirm the
 * email, set a password, a sign-in link. The seller card waits beside
 * the form (above it on a phone) and takes the email as it is typed,
 * so the first thing Remvo shows a seller is their own card.
 *
 *   card   props for SellerCard (holder, holderHint, label, aside)
 * ────────────────────────────────────────────────────────────────── */

export function AuthLayout({ card, children }) {
  return (
    <div className={styles.page}>
      <header className={styles.top}>
        <Logo variant="gold" size="default" href={siteUrl('/')} />
      </header>
      <div className={styles.cardSide}>
        <SellerCard {...card} className={styles.card} />
      </div>
      <main className={styles.formSide}>
        <div className={styles.panel}>{children}</div>
      </main>
      <footer className={styles.foot}>{BRAND.LEGAL_NAME}, RC 9550568, Lagos, Nigeria</footer>
    </div>
  );
}
