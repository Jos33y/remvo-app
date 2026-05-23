import { Link, useLocation } from 'react-router';
import { Logo } from '@components/ui/shared/Logo';
import { PARTNERS_ROUTES } from '@utils/constants';
import styles from '@styles/layout/partners/partners-header.module.css';

/* ──────────────────────────────────────────────────────────────────
 * PartnersHeader
 *
 * Minimal header for partners.remvo.app:
 *   Left:  Logo (mark + wordmark) — links home within partners.
 *   Right: Contextual link.
 *          - On /         -> "Agreement" (forward into the doc)
 *          - On /agreement -> "Overview" (back to the integration page)
 *
 * Single anchor on the right keeps the page calm without losing the
 * one navigation the partner actually needs.
 * ────────────────────────────────────────────────────────────────── */

export function PartnersHeader() {
  const { pathname } = useLocation();
  const onAgreement = pathname.startsWith(PARTNERS_ROUTES.AGREEMENT);

  const linkTo = onAgreement
    ? PARTNERS_ROUTES.HOME
    : PARTNERS_ROUTES.AGREEMENT;
  const linkLabel = onAgreement ? 'Overview' : 'Agreement';

  return (
    <header className={styles.header} role="banner">
      <div className={styles.inner}>
        <Link to={PARTNERS_ROUTES.HOME} className={styles.logoLink} aria-label="Remvo for platforms — home">
          <Logo variant="gold" size="default" href={null} />
        </Link>
        <nav className={styles.nav} aria-label="Primary navigation">
          <Link to={linkTo} className={styles.navLink}>
            {linkLabel}
          </Link>
        </nav>
      </div>
    </header>
  );
}
