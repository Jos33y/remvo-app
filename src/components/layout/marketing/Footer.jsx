import { Link } from 'react-router';
import { Logo } from '@components/ui/shared/Logo';
import { ROUTES, BRAND } from '@utils/constants';
import styles from '@styles/layout/marketing/footer.module.css';

/* Marketing footer.
 *
 *   Product       | Legal          | Company
 *   How it works  | Terms          | Remvo Labs Limited
 *   Pricing       | Privacy        | RC 9550568
 *   Credit terms  | Refunds        | support@remvolabs.com
 *   Contact       |                | Lagos, Nigeria
 *
 * The bottom bar names Polar as merchant of record, which every
 * payment page is required to make plain, and says Remvo is not eBay.
 */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={styles.inner}>
        <div className={styles.grid}>
          <div className={styles.col}>
            <h2 className={styles.colTitle}>Product</h2>
            <nav aria-label="Product links">
              <Link to={ROUTES.HOW} className={styles.colLink}>How it works</Link>
              <Link to={ROUTES.PRICING} className={styles.colLink}>Pricing</Link>
              <Link to={ROUTES.CREDITS} className={styles.colLink}>Credit terms</Link>
              <Link to={ROUTES.CONTACT} className={styles.colLink}>Contact</Link>
            </nav>
          </div>

          <div className={styles.col}>
            <h2 className={styles.colTitle}>Legal</h2>
            <nav aria-label="Legal links">
              <Link to={ROUTES.TERMS} className={styles.colLink}>Terms of service</Link>
              <Link to={ROUTES.PRIVACY} className={styles.colLink}>Privacy policy</Link>
              <Link to={ROUTES.REFUNDS} className={styles.colLink}>Refund policy</Link>
            </nav>
          </div>

          <div className={styles.col}>
            <h2 className={styles.colTitle}>Company</h2>
            <div className={styles.companyInfo}>
              <p className={styles.companyName}>{BRAND.LEGAL_NAME}</p>
              <p className={styles.companyMeta}>RC {BRAND.RC_NUMBER}</p>
              <a href={`mailto:${BRAND.EMAIL}`} className={styles.colLink}>{BRAND.EMAIL}</a>
              <p className={styles.companyMeta}>Lagos, Nigeria</p>
            </div>
          </div>
        </div>

        <div className={styles.notes}>
          <p className={styles.note}>
            Payments are processed by Polar, our merchant of record. Polar
            handles the sale, the receipt and any VAT or sales tax.
          </p>
          <p className={styles.note}>
            {BRAND.NAME} is independent software for eBay sellers. It is not
            made, endorsed or approved by eBay or Amazon.
          </p>
        </div>

        <div className={styles.bottom}>
          <Logo variant="gold" size="small" />
          <p className={styles.copy}>
            &copy; {year} {BRAND.LEGAL_NAME}
          </p>
        </div>
      </div>
    </footer>
  );
}
