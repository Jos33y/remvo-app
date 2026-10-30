import { useState } from 'react';
import { Bars, Panel, Report, Toggle } from '@components/ui/admin/RemvoParts';
import { useRemvoReport } from '@hooks/useRemvoReport';
import { useRemvoRange } from './RemvoLayout';
import { count, duration, eventName } from '@utils/remvoFormat';
import styles from '@styles/pages/admin/remvo.module.css';

/* ──────────────────────────────────────────────────────────────────
 * RemvoPagesPage (analytics1) | /remvo/pages
 *
 * Which pages are read, which start a visit, how long people stay,
 * and which site pages the sellers who joined first landed on. Then
 * the steps people take (copy, CSV, calculator, chat, video) and the
 * listing fields copied most.
 * ────────────────────────────────────────────────────────────────── */

export function RemvoPagesPage() {
  const { range, label } = useRemvoRange();
  const report = useRemvoReport('pages', { from: range.from, to: range.to });
  const [app, setApp] = useState('site');
  const d = report.data;
  const rows = (d?.pages ?? []).filter((p) => p.app === app);

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <h2 className={styles.title}>Pages</h2>
        <p className={styles.sub}><span className={styles.strong}>{label}</span>. Time on page counts only while the tab was on screen.</p>
      </header>

      <Report report={report} empty={d && !d.pages.length && !d.events.length}>
        {d && (
          <>
            <Panel title={app === 'site' ? 'remvo.app' : 'my.remvo.app'} note={app === 'site' ? 'Sign-ups: sellers whose visit began on the page' : 'Listing, batch and site ids grouped as one page'}>
              <div className={styles.panelBody} style={{ paddingBottom: 'var(--space-3)' }}>
                <Toggle label="Which site" value={app} onChange={setApp} options={[{ value: 'site', label: 'Website' }, { value: 'app', label: 'App' }]} />
              </div>
              {rows.length ? (
                <div className={styles.scroller}>
                  <table className={`${styles.table} ${styles.stack}`}>
                    <thead>
                      <tr>
                        <th>Page</th>
                        <th className={styles.num}>Views</th>
                        <th className={styles.num}>Visitors</th>
                        <th className={styles.num}>Entries</th>
                        <th className={styles.num}>Median time</th>
                        {app === 'site' && <th className={styles.num}>Sign-ups</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((p) => (
                        <tr key={p.path}>
                          <td><span className={styles.path}>{p.path}</span></td>
                          <td className={styles.num} data-label="Views">{count(p.views)}</td>
                          <td className={styles.num} data-label="Visitors">{count(p.visitors)}</td>
                          <td className={styles.num} data-label="Entries">{count(p.entries)}</td>
                          <td className={styles.num} data-label="Median time">{duration(p.medianMs)}</td>
                          {app === 'site' && <td className={styles.num} data-label="Sign-ups">{p.signups ? count(p.signups) : '-'}</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p className={`${styles.panelBody} ${styles.muted}`}>No views on this side in this range.</p>}
            </Panel>

            <div className={styles.split2}>
              <Panel title="Steps taken" note="Times, with how many visits and sellers">
                {d.events.length ? (
                  <div className={styles.scroller}>
                    <table className={`${styles.table} ${styles.stack}`}>
                      <thead><tr><th>Step</th><th className={styles.num}>Times</th><th className={styles.num}>Visits</th><th className={styles.num}>Sellers</th></tr></thead>
                      <tbody>
                        {d.events.map((e) => (
                          <tr key={`${e.app}|${e.name}`}>
                            <td>{eventName(e.name)}<span className={styles.small}>{e.app === 'site' ? 'Website' : 'App'}</span></td>
                            <td className={styles.num} data-label="Times">{count(e.times)}</td>
                            <td className={styles.num} data-label="Visits">{count(e.visits)}</td>
                            <td className={styles.num} data-label="Sellers">{e.app === 'app' ? count(e.sellers) : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <p className={`${styles.panelBody} ${styles.muted}`}>No steps recorded in this range.</p>}
              </Panel>
              <Panel title="Fields copied" note="What sellers take into eBay by hand">
                {d.copiedFields.length
                  ? <Bars rows={d.copiedFields.map((f) => ({ key: f.field, label: f.field, value: f.times }))} />
                  : <p className={`${styles.panelBody} ${styles.muted}`}>No fields copied in this range.</p>}
              </Panel>
            </div>
          </>
        )}
      </Report>
    </div>
  );
}
