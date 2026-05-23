import { useLocation } from 'react-router';
import { AdminShell } from '@components/layout/admin/AdminShell';
import { Button } from '@components/ui/shared/Button';
import { adminPath } from '@app/adminRouter';
import styles from '@styles/pages/admin/admin-not-found-page.module.css';

/* ──────────────────────────────────────────────────────────────────
 * AdminNotFoundPage
 *
 * Rendered when a signed-in operator lands on an unknown admin
 * route. Deliberately treats the 404 as a signature surface rather
 * than a utilitarian fallback. Obsidian register, iridescent mono
 * 404 numerals, quick-links row pointing at the most-visited admin
 * destinations.
 *
 * Rationale
 *   Operators who hit 404 are mid-task. The page must recover them
 *   fast, confirm they're still in the admin panel (brand signal),
 *   and offer the top 4 routes by frequency without requiring a
 *   sidebar trip. Stripe, Mercury, and Linear all follow this
 *   pattern. Remvo follows the same, in its own typography.
 *
 * Shell
 *   contentRegister="obsidian" | vault watermark renders ambiently
 *   via AdminShell. Full header + sidebar chrome intact because the
 *   operator is authenticated.
 * ────────────────────────────────────────────────────────────────── */

const QUICK_LINKS = [
  { route: '/',             label: 'Dashboard' },
  { route: '/transactions', label: 'Transactions' },
  { route: '/audit',        label: 'Audit log' },
  { route: '/settings',     label: 'Settings' },
];

export function AdminNotFoundPage() {
  const location = useLocation();
  const pathname = location.pathname;

  return (
    <AdminShell pageTitle="Not found" contentRegister="obsidian">
      <div className={styles.wrap}>
        <div className={styles.card}>
          <div className={styles.numeralRow}>
            <span className={styles.numeral} aria-hidden="true">404</span>
            <span className={styles.hairline} aria-hidden="true" />
          </div>

          <h1 className={styles.heading}>Route not found</h1>

          <p className={styles.body}>
            The admin panel has no page at{' '}
            <code className={styles.pathCode}>{pathname}</code>.
          </p>
          <p className={styles.bodyMuted}>
            It may have been renamed, removed, or mistyped.
          </p>

          <div className={styles.primaryAction}>
            <Button variant="primary" href={adminPath('/')} size="default">
              Back to dashboard
            </Button>
          </div>

          <div className={styles.quickLinks}>
            <span className={styles.quickLinksLabel}>Or jump to</span>
            <ul className={styles.quickLinksList}>
              {QUICK_LINKS.map((link) => (
                <li key={link.route}>
                  <a href={adminPath(link.route)} className={styles.quickLink}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
