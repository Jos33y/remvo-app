import { useEffect } from 'react';
import { useSellerSession } from '@context/SellerSession';
import styles from '@styles/layout/seller/seller-shell.module.css';

/* Signed-in home. Holds the place the dashboard takes next: balance,
 * top-up, and "make a listing". Until then it confirms who is signed
 * in and since when, which is what proves sign-in end to end. */
export function SellerHomePage() {
  const { account } = useSellerSession();

  useEffect(() => { document.title = 'Remvo | Your account'; }, []);

  const since = account?.createdAt
    ? new Date(account.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <section className={styles.home} aria-labelledby="home-heading">
      <h1 id="home-heading" className={styles.homeHeading}>You are signed in</h1>
      <dl className={styles.facts}>
        <div className={styles.fact}>
          <dt>Email</dt>
          <dd>{account?.email}</dd>
        </div>
        {since && (
          <div className={styles.fact}>
            <dt>Account since</dt>
            <dd>{since}</dd>
          </div>
        )}
      </dl>
      <p className={styles.homeNext}>Your balance, top-ups and listings will appear here.</p>
    </section>
  );
}
