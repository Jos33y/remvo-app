import { FunnelChart } from '@components/ui/admin/FunnelChart';
import { Panel, Report } from '@components/ui/admin/RemvoParts';
import { useRemvoReport } from '@hooks/useRemvoReport';
import { useRemvoRange } from './RemvoLayout';
import styles from '@styles/pages/admin/remvo.module.css';

/* ──────────────────────────────────────────────────────────────────
 * RemvoFunnelPage (analytics1) | /remvo/funnel
 *
 * Two funnels. Visitors: the site, a click into the app, the sign-up
 * page, an account (visits, in the range). Sellers: everyone who
 * opened an account in the range, followed to a paid top-up. The
 * biggest drop is where to work next.
 * ────────────────────────────────────────────────────────────────── */

const NOTES = {
  site: 'Visits to remvo.app',
  to_app: 'Clicked a link into my.remvo.app',
  signup_page: 'Saw the sign-up form',
  signups: 'Joined in this range',
  listed: 'Spent credits on a listing',
  got_one: 'At least one listing came back ready',
  used_it: 'Copied a field, everything, or a CSV',
  second: 'Came back for another',
  credits_page: 'Looked at the packs',
  checkout: 'Went to Polar',
  paid: 'Credits bought',
};

function steps(list) {
  const top = list[0]?.count ?? 0;
  return list.map((s, i) => {
    const prev = i ? list[i - 1].count : s.count;
    return {
      ...s,
      description: NOTES[s.key] ?? '',
      pctOfStart: top ? (s.count / top) * 100 : 0,
      pctOfPrev: prev ? (s.count / prev) * 100 : 0,
      dropFromPrev: i ? Math.max(0, prev - s.count) : 0,
    };
  });
}

function biggestDrop(list) {
  let worst = null;
  for (let i = 1; i < list.length; i += 1) {
    const prev = list[i - 1].count;
    if (!prev) continue;
    const lost = 1 - list[i].count / prev;
    if (!worst || lost > worst.lost) worst = { lost, from: list[i - 1].label, to: list[i].label };
  }
  return worst;
}

export function RemvoFunnelPage() {
  const { range, label } = useRemvoRange();
  const report = useRemvoReport('funnel', { from: range.from, to: range.to });
  const d = report.data;
  const worst = d ? biggestDrop(d.sellers) : null;

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <h2 className={styles.title}>Funnel</h2>
        <p className={styles.sub}><span className={styles.strong}>{label}</span>. Sellers who joined in this range, followed to their first payment.</p>
      </header>

      <Report report={report} empty={d && !d.visitors[0].count && !d.sellers[0].count}>
        {d && (
          <div className={styles.split2}>
            <Panel title="Sellers" note={worst && worst.lost > 0 ? `Biggest drop: ${worst.from.toLowerCase()} to ${worst.to.toLowerCase()} (${Math.round(worst.lost * 100)}% lost)` : null}>
              <div className={styles.panelBody}><FunnelChart steps={steps(d.sellers)} register="neutral" /></div>
            </Panel>
            <Panel title="Visitors" note="Visits in this range">
              <div className={styles.panelBody}><FunnelChart steps={steps(d.visitors)} register="neutral" /></div>
            </Panel>
          </div>
        )}
      </Report>
    </div>
  );
}
