import { useEffect } from 'react';
import { Logo } from '@components/ui/shared/Logo';
import { Button } from '@components/ui/shared/Button';
import { SELLER_ROUTES, siteUrl } from '@utils/constants';
import styles from '@styles/pages/seller/sign-in.module.css';

export function SellerNotFoundPage() {
  useEffect(() => { document.title = 'Remvo | Page not found'; }, []);

  return (
    <main className={styles.page}>
      <div className={styles.panel}>
        <div className={styles.brand}><Logo variant="gold" size="default" href={siteUrl('/')} /></div>
        <div className={styles.form}>
          <h1 className={styles.heading}>This page does not exist</h1>
          <p className={styles.sub}>The address may be mistyped, or the page has moved.</p>
          <Button href={SELLER_ROUTES.HOME} variant="primary" size="default" className={styles.submit}>
            Go to your account
          </Button>
        </div>
      </div>
    </main>
  );
}
