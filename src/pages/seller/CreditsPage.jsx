import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { PageHeader } from '@components/ui/seller/PageHeader';
import { BalanceCard, TopUpSheet } from '@components/ui/seller/parts';
import { IconChevronRight } from '@components/ui/seller/icons';
import { useSellerData } from '@context/SellerData';
import { signed, when } from '@lib/sellerFormat';
import { PRICING, listingPath, siteUrl } from '@utils/constants';
import s from '@styles/pages/seller/app.module.css';

/* ──────────────────────────────────────────────────────────────────
 * Credits
 *
 * The balance, a way to add to it, and every movement: top-ups in,
 * listings out, failed listings back. A seller should be able to
 * reconcile this page against their card statement and their listings
 * without asking.
 *
 * ?topup=1 (from the marketing site's Top up, via /billing) opens the
 * top-up sheet on arrival.
 * ────────────────────────────────────────────────────────────────── */

function groupByMonth(rows) {
  const out = [];
  for (const r of rows) {
    const d = new Date(r.at);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const label = d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    if (!out.length || out.at(-1).key !== key) out.push({ key, label, rows: [] });
    out.at(-1).rows.push(r);
  }
  return out;
}

export function CreditsPage() {
  const { history } = useSellerData();
  const [params, setParams] = useSearchParams();
  const [topUp, setTopUp] = useState(params.get('topup') === '1');
  const months = useMemo(() => groupByMonth(history), [history]);

  useEffect(() => { document.title = 'Remvo | Credits'; }, []);

  const closeTopUp = () => {
    setTopUp(false);
    if (params.has('topup')) { params.delete('topup'); setParams(params, { replace: true }); }
  };

  return (
    <>
      <PageHeader title="Credits" />
      <div className={s.content}>
        <div className={s.section}>
          <BalanceCard onTopUp={() => setTopUp(true)} />
        </div>

        <section className={s.section} aria-labelledby="how-heading">
          <div className={s.groupHead}><h2 id="how-heading" className={s.groupTitle}>How credits work</h2></div>
          <div className={s.group}>
            <div className={s.row}>
              <span className={s.rowMain}><span className={s.rowTitle}>A credit</span></span>
              <span className={`${s.rowValue} ${s.rowValueMono}`}>{PRICING.CREDIT_PENCE}p</span>
            </div>
            <div className={s.row}>
              <span className={s.rowMain}><span className={s.rowTitle}>A listing</span></span>
              <span className={`${s.rowValue} ${s.rowValueMono}`}>{PRICING.JOBS.LISTING.credits} credits</span>
            </div>
            <div className={s.row}>
              <span className={s.rowMain}><span className={s.rowTitle}>Credits last</span></span>
              <span className={s.rowValue}>{PRICING.EXPIRY_MONTHS} months</span>
            </div>
            <a href={siteUrl('/credits')} className={s.row}>
              <span className={s.rowMain}><span className={s.rowTitle}>Credit terms and refunds</span></span>
              <span className={s.chevron}><IconChevronRight /></span>
            </a>
          </div>
          <p className={s.groupNote}>Every top-up extends your whole balance. A listing that fails gives its credits back on its own.</p>
        </section>

        <section className={s.section} aria-labelledby="history-heading">
          <div className={s.groupHead}><h2 id="history-heading" className={s.groupTitle}>History</h2></div>
          {months.map((m) => (
            <div key={m.key} className={s.month}>
              <h3 className={s.monthLabel}>{m.label}</h3>
              <div className={s.group}>
                {m.rows.map((r) => {
                  const inner = (
                    <>
                      <span className={s.rowMain}>
                        <span className={s.rowTitle}>{r.label}</span>
                        <span className={s.rowSub}>{when(r.at)}</span>
                      </span>
                      <span className={`${s.rowValue} ${s.rowValueMono} ${r.credits > 0 ? s.plus : ''}`}>
                        {signed(r.credits)}
                      </span>
                    </>
                  );
                  return r.jobId
                    ? <Link key={r.id} to={listingPath(r.jobId)} className={s.row}>{inner}</Link>
                    : <div key={r.id} className={s.row}>{inner}</div>;
                })}
              </div>
            </div>
          ))}
        </section>
      </div>
      <TopUpSheet open={topUp} onClose={closeTopUp} />
    </>
  );
}
