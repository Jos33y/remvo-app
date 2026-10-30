import { StatCard } from '@components/ui/admin/StatCard';
import { Panel, Report } from '@components/ui/admin/RemvoParts';
import { useRemvoReport } from '@hooks/useRemvoReport';
import { useRemvoRange } from './RemvoLayout';
import { count, pct, rate, seconds, usd } from '@utils/remvoFormat';
import styles from '@styles/pages/admin/remvo.module.css';

/* ──────────────────────────────────────────────────────────────────
 * RemvoQualityPage (analytics1) | /remvo/quality
 *
 * Whether listings work, how long they take and what they cost us,
 * from seller_jobs. Jobs are deleted after 90 days, so a longer range
 * is refused by the API and this page says so.
 * ────────────────────────────────────────────────────────────────── */

const WAYS = { single: 'One at a time', bulk: 'Bulk', sites: 'Several eBay sites' };
const INPUTS = { link: 'Product link', barcode: 'Barcode' };

function Split({ title, rows, name }) {
  return (
    <Panel title={title}>
      <div className={styles.scroller}>
        <table className={`${styles.table} ${styles.stack}`}>
          <thead><tr><th>{title.replace('By ', '')}</th><th className={styles.num}>Listings</th><th className={styles.num}>Failed</th><th className={styles.num}>Failure rate</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={name(r)}>
                <td>{name(r)}</td>
                <td className={styles.num} data-label="Listings">{count(r.listings)}</td>
                <td className={styles.num} data-label="Failed">{count(r.failed)}</td>
                <td className={styles.num} data-label="Failure rate">{pct(rate(r.failed, r.listings))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

export function RemvoQualityPage() {
  const { range, label } = useRemvoRange();
  const report = useRemvoReport('quality', { from: range.from, to: range.to });
  const d = report.data;
  const total = d ? Object.values(d.statuses).reduce((a, b) => a + b, 0) : 0;
  const failed = d?.statuses.failed ?? 0;

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <h2 className={styles.title}>Quality</h2>
        <p className={styles.sub}><span className={styles.strong}>{label}</span>. Up to the last 90 days: older listings are deleted.</p>
      </header>

      <Report report={report} empty={d && !total} emptyText="No listings made in this range.">
        {d && (
          <>
            <div className={styles.cards}>
              <StatCard size="md" label="Listings made" value={count(total)} context={<span className={styles.contextLine}>{count(d.statuses.ready ?? 0)} ready{d.statuses.queued || d.statuses.running ? `, ${count((d.statuses.queued ?? 0) + (d.statuses.running ?? 0))} still going` : ''}</span>} />
              <StatCard size="md" label="Failed" value={pct(rate(failed, total))} status={rate(failed, total) > 10 ? 'warning' : 'neutral'} context={<span className={styles.contextLine}>{count(failed)} listings, credits returned</span>} />
              <StatCard size="md" label="Time to ready" value={seconds(d.seconds.p50)} context={<span className={styles.contextLine}>median; slowest tenth {seconds(d.seconds.p90)}</span>} />
              <StatCard size="md" label="Our cost a listing" value={usd(d.costUsd.avg, 3)} context={<span className={styles.contextLine}>dearest tenth {usd(d.costUsd.p90, 3)}; {usd(d.costUsd.total)} in all</span>} />
            </div>
            <p className={styles.sub}>
              Waiting in the queue: <span className={styles.strong}>{seconds(d.seconds.waitP50)}</span> median, then <span className={styles.strong}>{seconds(d.seconds.workP50)}</span> of work.
              {' '}{count(d.costUsd.lookups)} barcode lookups cost {usd(d.costUsd.lookupTotal)}.
            </p>

            <Panel title="Why listings failed" note="Most common first, with the message the seller saw">
              {d.failures.length ? (
                <div className={styles.scroller}>
                  <table className={`${styles.table} ${styles.stack}`}>
                    <thead><tr><th>Reason</th><th className={styles.num}>Listings</th><th>Seller saw</th></tr></thead>
                    <tbody>
                      {d.failures.map((f) => (
                        <tr key={f.code}>
                          <td><span className={styles.mono}>{f.code}</span></td>
                          <td className={styles.num} data-label="Listings">{count(f.count)}</td>
                          <td data-label="Seller saw" className={styles.muted}>{f.example ?? '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p className={`${styles.panelBody} ${styles.muted}`}>No failures in this range.</p>}
            </Panel>

            <div className={styles.split2}>
              <Split title="By input" rows={d.inputs} name={(r) => INPUTS[r.input] ?? r.input} />
              <Split title="By way" rows={d.ways} name={(r) => WAYS[r.way] ?? r.way} />
            </div>
            <Split title="By eBay site" rows={d.sites} name={(r) => r.marketplace} />
          </>
        )}
      </Report>
    </div>
  );
}
