import { BRAND } from '@utils/constants';
import styles from '@styles/layout/partners/partners-footer.module.css';

/* ──────────────────────────────────────────────────────────────────
 * PartnersFooter
 *
 * Legal mark only. No socials, no nav, no marketing CTAs. The page
 * itself carries every actionable link the partner needs; the
 * footer's only job is the CAC-required entity identification.
 *
 * "Remvo Labs Limited · RC 9550568 · remvo.app"
 * ────────────────────────────────────────────────────────────────── */

export function PartnersFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={styles.inner}>
        <p className={styles.mark}>
          <span className={styles.entity}>{BRAND.LEGAL_NAME}</span>
          <span aria-hidden="true" className={styles.sep}>·</span>
          <span className={styles.rc}>RC {BRAND.RC_NUMBER}</span>
          <span aria-hidden="true" className={styles.sep}>·</span>
          <span className={styles.domain}>{BRAND.DOMAIN}</span>
        </p>
        <p className={styles.copy}>
          {year} {BRAND.NAME}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
