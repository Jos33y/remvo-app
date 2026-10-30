import { useState } from 'react';
import { Link } from 'react-router';
import { adminPath } from '@app/adminRouter';
import { Panel, Report, Toggle } from '@components/ui/admin/RemvoParts';
import { useRemvoReport } from '@hooks/useRemvoReport';
import { useRemvoRange } from './RemvoLayout';
import { count, countryName, day, moneyList, sourceName, when } from '@utils/remvoFormat';
import styles from '@styles/pages/admin/remvo.module.css';

/* ──────────────────────────────────────────────────────────────────
 * RemvoSellersPage (analytics1) | /remvo/sellers
 *
 * Every seller who joined in the range (or everyone), newest first:
 * where they came from, what they listed, what they paid, and when
 * they were last seen. A seller's name opens their timeline.
 * ────────────────────────────────────────────────────────────────── */

export function RemvoSellersPage() {
  const { range, label } = useRemvoRange();
  const [scope, setScope] = useState('range');
  const report = useRemvoReport('sellers', { from: range.from, to: range.to, all: scope === 'all' });
  const list = report.data?.sellers ?? [];

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <h2 className={styles.title}>Sellers</h2>
        <p className={styles.sub}>{scope === 'all' ? 'Every seller, newest first.' : <><span className={styles.strong}>{label}</span>: sellers who joined in this range.</>} Team accounts are left out.</p>
      </header>

      <Toggle label="Which sellers" value={scope} onChange={setScope} options={[{ value: 'range', label: 'Joined in this range' }, { value: 'all', label: 'Everyone' }]} />

      <Report report={report} empty={report.data && !list.length} emptyText="No sellers joined in this range.">
        <Panel title={`${count(list.length)} ${list.length === 1 ? 'seller' : 'sellers'}`} note={list.length >= 200 ? 'The newest 200' : null}>
          <div className={styles.scroller}>
            <table className={`${styles.table} ${styles.stack}`}>
              <thead>
                <tr>
                  <th>Seller</th>
                  <th>Came from</th>
                  <th>eBay site</th>
                  <th className={styles.num}>Listings</th>
                  <th className={styles.num}>Spent</th>
                  <th className={styles.num}>Credits</th>
                  <th className={styles.num}>Last seen</th>
                </tr>
              </thead>
              <tbody>
                {list.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <Link className={styles.rowLink} to={adminPath(`/remvo/sellers/${s.id}`)}>{s.name || s.email}</Link>
                      <span className={styles.small}>{s.name ? `${s.email} · ` : ''}joined {day(s.createdAt)}{s.closedAt ? ' · closed' : ''}</span>
                    </td>
                    <td data-label="Came from">
                      {s.source ? sourceName(s.source) : <span className={styles.muted}>Not traced yet</span>}
                      {(s.campaign || s.landing) && <span className={styles.small}>{[s.campaign, s.landing].filter(Boolean).join(' · ')}</span>}
                    </td>
                    <td data-label="eBay site">{s.marketplace ?? '-'}{s.country && <span className={styles.small}>{countryName(s.country)}</span>}</td>
                    <td className={styles.num} data-label="Listings">{count(s.listings)}{s.failed ? <span className={styles.small}>{count(s.failed)} failed</span> : null}</td>
                    <td className={`${styles.num} ${styles.money}`} data-label="Spent">{moneyList(s.spent)}</td>
                    <td className={styles.num} data-label="Credits">{count(s.balance)}</td>
                    <td className={styles.num} data-label="Last seen">{when(s.lastSeenAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </Report>
    </div>
  );
}
