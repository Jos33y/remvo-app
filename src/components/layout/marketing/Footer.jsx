import { Link } from 'react-router';
import { Logo } from '@components/ui/shared/Logo';
import { ROUTES, BRAND } from '@utils/constants';
import styles from '@styles/layout/marketing/footer.module.css';

/* Marketing footer.
 *
 * Public surface — collapsed from three columns to two. The
 * "Product" column is gone because the public site no longer
 * links into partner-facing material. Final structure:
 *
 *   Legal   | Company
 *   Terms   | Remvo Labs Limited
 *   Privacy | RC 9550568
 *   AML     | partners@remvolabs.com
 *   Refunds | Lagos, Nigeria
 *
 * Bottom bar: logo + copyright.
 */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={styles.inner}>
        {/* ── Column grid ── */}
        <div className={styles.grid}>
          <div className={styles.col}>
            <h3 className={styles.colTitle}>Legal</h3>
            <nav aria-label="Legal links">
              <Link to={ROUTES.TERMS} className={styles.colLink}>Terms of service</Link>
              <Link to={ROUTES.PRIVACY} className={styles.colLink}>Privacy policy</Link>
              <Link to={ROUTES.AML} className={styles.colLink}>AML policy</Link>
              <Link to={ROUTES.REFUNDS} className={styles.colLink}>Refund policy</Link>
              <Link to={ROUTES.CONTACT} className={styles.colLink}>Contact</Link>
            </nav>
          </div>

          <div className={styles.col}>
            <h3 className={styles.colTitle}>Company</h3>
            <div className={styles.companyInfo}>
              <p className={styles.companyName}>{BRAND.LEGAL_NAME}</p>
              <p className={styles.companyMeta}>RC {BRAND.RC_NUMBER}</p>
              <a
                href={`mailto:${BRAND.EMAIL}`}
                className={styles.colLink}
              >
                {BRAND.EMAIL}
              </a>
              <p className={styles.companyMeta}>Lagos, Nigeria</p>
            </div>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className={styles.bottom}>
          <Logo variant="gold" size="small" />
          <p className={styles.copy}>
            {year} {BRAND.NAME}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
