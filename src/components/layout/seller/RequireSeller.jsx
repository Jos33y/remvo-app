import { Navigate, Outlet, useLocation } from 'react-router';
import { Button } from '@components/ui/shared/Button';
import { useSellerSession } from '@context/SellerSession';
import { SELLER_ROUTES } from '@utils/constants';
import styles from '@styles/layout/seller/seller-shell.module.css';

/* The gate for every signed-in route. Sends a signed-out seller to
 * /sign-in with ?next= so they come back to where they were going.
 * A dropped connection is not a sign-out: it says so and offers a retry
 * instead of throwing the seller onto the sign-in page. */
export function RequireSeller() {
  const { status, retry } = useSellerSession();
  const location = useLocation();

  if (status === 'loading') {
    return <div className={styles.loading} role="status" aria-live="polite"><span className="sr-only">Loading your account</span></div>;
  }

  if (status === 'unreachable') {
    return (
      <main className={styles.unreachable}>
        <h1 className={styles.unreachableHeading}>We could not reach Remvo</h1>
        <p className={styles.unreachableText}>Check your connection. Nothing is lost.</p>
        <Button type="button" variant="primary" onClick={retry}>Try again</Button>
      </main>
    );
  }

  if (status === 'signedOut') {
    const here = `${location.pathname}${location.search}`;
    const next = here && here !== SELLER_ROUTES.HOME ? `?next=${encodeURIComponent(here)}` : '';
    return <Navigate to={`${SELLER_ROUTES.SIGN_IN}${next}`} replace />;
  }

  return <Outlet />;
}
