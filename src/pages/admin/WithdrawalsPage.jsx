import { AdminShell } from '@components/layout/admin/AdminShell';
import { IconExport } from '@components/ui/icons/IconExport';
import { IconClock } from '@components/ui/icons/IconClock';
import styles from '@styles/pages/admin/withdrawals-page.module.css';

/* ──────────────────────────────────────────────────────────────────
 * WithdrawalsPage
 *
 * Route: /admin/withdrawals
 * Register: neutral.
 *
 * Phase 6 ships the empty-state shell only. The real disbursement
 * flow (Monnify Disbursement API, refund-after-3-attempts, per-batch
 * withdrawal wallet) lands in Phase 7 per BUILD_ORDER section 07.
 *
 * The screen exists now so operators see the intended navigation
 * from day one, and so the layout slot is ready when the backend
 * arrives without a re-design pass.
 * ────────────────────────────────────────────────────────────────── */

export function WithdrawalsPage() {
  return (
    <AdminShell pageTitle="Withdrawals" contentRegister="neutral">
      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Withdrawals</h1>
          <p className={styles.pageSubtitle}>
            USDT in, Naira out via Monnify Disbursement API. Batch-triggered by the operator.
          </p>
        </header>

        <section className={styles.shell} aria-label="Withdrawals coming soon">
          <div className={styles.icon} aria-hidden="true">
            <IconExport size={32} />
          </div>

          <div className={styles.content}>
            <h2 className={styles.heading}>Coming in Phase 7</h2>
            <p className={styles.body}>
              Withdrawals go live once the Monnify Disbursement API is wired and the
              separate withdrawal wallet is provisioned. Deposit operations stay the
              priority until GE-AS volume is proven for one month.
            </p>

            <ul className={styles.scope} aria-label="Phase 7 scope">
              <li className={styles.scopeItem}>
                <IconClock size={14} /> USDT-in (Solana) to Naira-out via Monnify Disbursement
              </li>
              <li className={styles.scopeItem}>
                <IconClock size={14} /> Rate lock at USDT receipt | per-corridor spread
              </li>
              <li className={styles.scopeItem}>
                <IconClock size={14} /> 3-attempt retry | auto-refund USDT on failure
              </li>
              <li className={styles.scopeItem}>
                <IconClock size={14} /> Batch or per-transaction settlement per platform config
              </li>
            </ul>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
