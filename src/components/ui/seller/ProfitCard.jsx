import { ProfitSlip } from '@components/ui/profit/ProfitSlip';
import s from '@styles/pages/seller/app.module.css';
import P from '@styles/pages/seller/profit.module.css';

/* ──────────────────────────────────────────────────────────────────
 * What you keep, on a listing (profit1, slip redrawn in tools1)
 *
 * The listing's slip: the seller's figures are saved to the listing
 * (edits price, cost, postCost, postCharged, otherCost, adRate, target,
 * feeRate) and remvo-api sends the
 * listing back with its profit worked out on the seller's own eBay
 * account. The slip itself (components/ui/profit/ProfitSlip) is the
 * same one remvo.app's fee calculator shows.
 * ────────────────────────────────────────────────────────────────── */

export function ProfitCard({ job, profit, site, onSave, onSellerType, onOpenSettings }) {
  if (!profit) return null;
  const e = job.edits ?? {};
  return (
    <section className={P.section} aria-labelledby="profit-heading">
      <div className={`${s.groupHead} ${P.head}`}>
        <h2 id="profit-heading" className={s.groupTitle}>What you keep</h2>
        <span className={P.headNote}>Free. Never sent to eBay.</span>
      </div>
      <ProfitSlip
        profit={profit}
        values={{ price: profit.price ?? null, cost: e.cost, postCost: e.postCost, postCharged: e.postCharged, otherCost: e.otherCost, adRate: e.adRate, target: e.target, feeRate: e.feeRate }}
        onSave={onSave}
        siteName={site.site}
        marketplace={job.marketplace}
        onSellerType={onSellerType}
        onOpenSettings={onOpenSettings}
      />
    </section>
  );
}
