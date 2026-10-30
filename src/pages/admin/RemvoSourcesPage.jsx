import { useState } from 'react';
import { Bars, Panel, Report, Toggle } from '@components/ui/admin/RemvoParts';
import { useRemvoReport } from '@hooks/useRemvoReport';
import { useRemvoRange } from './RemvoLayout';
import { count, moneyList, MEDIUM_NAMES, pct, rate, sourceName } from '@utils/remvoFormat';
import styles from '@styles/pages/admin/remvo.module.css';

/* ──────────────────────────────────────────────────────────────────
 * RemvoSourcesPage (analytics1) | /remvo/sources
 *
 * For each place visits came from: the traffic in the range, and the
 * sellers who signed up from it in the range, followed through to a
 * first listing and a payment. By source, or by post (?ref=tiktok.
 * zero-views puts "zero-views" in the campaign column).
 * ────────────────────────────────────────────────────────────────── */

function SourceTable({ rows, byCampaign }) {
  return (
    <div className={styles.scroller}>
      <table className={`${styles.table} ${styles.stack}`}>
        <thead>
          <tr>
            <th>{byCampaign ? 'Post or campaign' : 'Source'}</th>
            <th className={styles.num}>Visitors</th>
            <th className={styles.num}>Visits</th>
            <th className={styles.num}>Sign-ups</th>
            <th className={styles.num}>Sign-up rate</th>
            <th className={styles.num}>Listed</th>
            <th className={styles.num}>Paid</th>
            <th className={styles.num}>Revenue</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={`${r.source}|${r.medium}|${r.campaign ?? ''}`}>
              <td>
                <strong>{byCampaign ? r.campaign : sourceName(r.source)}</strong>
                <span className={styles.small}>{byCampaign ? sourceName(r.source) : MEDIUM_NAMES[r.medium] ?? r.medium}</span>
              </td>
              <td className={styles.num} data-label="Visitors">{count(r.visitors)}</td>
              <td className={styles.num} data-label="Visits">{count(r.visits)}</td>
              <td className={styles.num} data-label="Sign-ups">{count(r.signups)}</td>
              <td className={styles.num} data-label="Sign-up rate">{pct(rate(r.signups, r.visitors))}</td>
              <td className={styles.num} data-label="Listed">{count(r.listed)}</td>
              <td className={styles.num} data-label="Paid">{count(r.paid)}</td>
              <td className={`${styles.num} ${styles.money}`} data-label="Revenue">{moneyList(r.revenue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RemvoSourcesPage() {
  const { range, label } = useRemvoRange();
  const report = useRemvoReport('sources', { from: range.from, to: range.to });
  const [view, setView] = useState('source');
  const d = report.data;
  const rows = view === 'source' ? d?.bySource ?? [] : d?.byCampaign ?? [];

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <h2 className={styles.title}>Sources</h2>
        <p className={styles.sub}>
          <span className={styles.strong}>{label}</span>. Sign-ups are sellers who joined in this range; listed and paid follow them since.
          Tag a link with <span className={styles.mono}>?ref=tiktok.post-name</span> to see each post on its own.
        </p>
      </header>

      <Report report={report} empty={d && !d.bySource.length && !d.unattributed}>
        {d && (
          <>
            <Panel title={view === 'source' ? 'By source' : 'By post or campaign'} note={d.unattributed ? `${count(d.unattributed)} sign-ups not traced yet: they came direct or have not been back` : null}>
              <div className={styles.panelBody} style={{ paddingBottom: 'var(--space-3)' }}>
                <Toggle label="Group by" value={view} onChange={setView} options={[{ value: 'source', label: 'Source' }, { value: 'campaign', label: 'Post or campaign' }]} />
              </div>
              {rows.length
                ? <SourceTable rows={rows} byCampaign={view === 'campaign'} />
                : <p className={`${styles.panelBody} ${styles.muted}`}>{view === 'campaign' ? 'No tagged links used in this range.' : 'Nothing in this range.'}</p>}
            </Panel>

            <Panel title="Referring sites" note="Visits that arrived from another site">
              {d.referrers.length
                ? <Bars rows={d.referrers.map((r) => ({ key: r.referrer, label: r.referrer, value: r.visits }))} />
                : <p className={`${styles.panelBody} ${styles.muted}`}>No referring sites in this range.</p>}
            </Panel>
          </>
        )}
      </Report>
    </div>
  );
}
