import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router';
import { Logo } from '@components/ui/shared/Logo';
import { useSellerSession } from '@context/SellerSession';
import { SELLER_ROUTES, siteUrl, BRAND } from '@utils/constants';
import styles from '@styles/layout/seller/seller-shell.module.css';

/* The frame around every signed-in page: the mark, who is signed in,
 * and the way out. The balance and the job navigation join the bar
 * with the dashboard. */
export function SellerShell() {
  const { account, signOut } = useSellerSession();
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);

  async function onSignOut() {
    setLeaving(true);
    await signOut();
    navigate(SELLER_ROUTES.SIGN_IN, { replace: true });
  }

  return (
    <div className={styles.shell}>
      <a href="#seller-main" className="skip-link">Skip to content</a>
      <header className={styles.header}>
        <div className={styles.inner}>
          <Logo variant="gold" size="default" href={SELLER_ROUTES.HOME} />
          <div className={styles.account}>
            <span className={styles.email} title={account?.email}>{account?.email}</span>
            <button type="button" className={styles.signOut} onClick={onSignOut} disabled={leaving}>
              {leaving ? 'Signing out' : 'Sign out'}
            </button>
          </div>
        </div>
      </header>
      <main id="seller-main" className={styles.main}>
        <Outlet />
      </main>
      <footer className={styles.footer}>
        <div className={styles.inner}>
          <span>{BRAND.LEGAL_NAME}</span>
          <nav aria-label="Legal" className={styles.footerLinks}>
            <a href={siteUrl('/terms')}>Terms</a>
            <a href={siteUrl('/privacy')}>Privacy</a>
            <a href={siteUrl('/refunds')}>Refunds</a>
            <a href={`mailto:${BRAND.EMAIL}`}>{BRAND.EMAIL}</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
