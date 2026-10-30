import { useMemo } from 'react';
import { StatCard } from '@components/ui/admin/StatCard';
import { TrendLine } from '@components/ui/admin/TrendLine';
import { Bars, Delta, Panel, Report } from '@components/ui/admin/RemvoParts';
import { useRemvoReport } from '@hooks/useRemvoReport';
import { useRemvoRange } from './RemvoLayout';
import { count, countryName, delta, moneyList, pct, rate, usd } from '@utils/remvoFormat';
import styles from '@styles/pages/admin/remvo.module.css';

/* ──────────────────────────────────────────────────────────────────
 * RemvoOverviewPage (analytics1) | /remvo
 *
 * The numbers that say whether Remvo is working, against the same
 * length of time just before: visitors, sign-ups, first listings,
 * listings, paying sellers, revenue and what the listings cost us.
 * Then the four rates between them, the days, and where and on what
 * people visit from.
 * ────────────────────────────────────────────────────────────────── */

const dayLabel = (t) => new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

export function RemvoOverviewPage() {
  const { range, label } = useRemvoRange();
  const report = useRemvoReport('overview', { from: range.from, to: range.to });
  const d = report.data;

  const trend = useMemo(() => (d?.daily ?? []).map((x) => ({ t: new Date(x.day).getTime(), count: x.visitors, listings: x.listings, signups: x.signups })), [d]);
  const c = d?.current;
  const p = d?.previous;

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <h2 className={styles.title}>Overview</h2>
        <p className={styles.sub}><span className={styles.strong}>{label}</span>, against the same length of time before it. Team accounts are left out.</p>
      </header>

      <Report report={report}>
        {c && (
          <>
            <div className={styles.cards}>
              <StatCard size="md" label="Visitors" value={count(c.visitors)} context={<span className={styles.contextLine}><Delta d={delta(c.visitors, p.visitors)} />{count(c.visits)} visits</span>} />
              <StatCard size="md" label="Sign-ups" value={count(c.signups)} context={<span className={styles.contextLine}><Delta d={delta(c.signups, p.signups)} />{pct(rate(c.signups, c.visitors))} of visitors</span>} />
              <StatCard size="md" label="First listings" value={count(c.firstListings)} context={<span className={styles.contextLine}><Delta d={delta(c.firstListings, p.firstListings)} />sellers who made their first</span>} />
              <StatCard size="md" label="Listings" value={count(c.listingsDone)} context={<span className={styles.contextLine}><Delta d={delta(c.listingsDone, p.listingsDone)} />{count(c.failed)} failed, by {count(c.listingSellers)} sellers</span>} />
            </div>
            <div className={styles.cards}>
              <StatCard size="md" label="Paying sellers" value={count(c.payingSellers)} context={<span className={styles.contextLine}><Delta d={delta(c.payingSellers, p.payingSellers)} />{count(c.topups)} top-ups</span>} />
              <StatCard size="md" label="Revenue" value={moneyList(c.revenue)} context={<span className={styles.contextLine}>Before Polar's fee{c.refunds.length ? `, ${moneyList(c.refunds)} refunded` : ''}</span>} />
              <StatCard size="md" label="Checkouts" value={`${count(c.checkoutsPaid)} of ${count(c.checkouts)}`} context={<span className={styles.contextLine}>started checkouts that were paid</span>} />
              <StatCard size="md" label="What listings cost us" value={usd(c.costUsd)} context={<span className={styles.contextLine}>{c.listings ? `${usd(c.costUsd / c.listings, 3)} a listing` : 'No listings yet'}</span>} />
            </div>

            <div className={styles.rates} aria-label="Conversion between steps">
              <div className={styles.rate}><span className={styles.rateLabel}>Visitor to sign-up</span><span className={styles.rateValue}>{pct(rate(c.signups, c.visitors))}</span><span className={styles.rateNote}>{count(c.signups)} of {count(c.visitors)}</span></div>
              <div className={styles.rate}><span className={styles.rateLabel}>Sign-up to first listing</span><span className={styles.rateValue}>{pct(rate(c.firstListings, c.signups))}</span><span className={styles.rateNote}>in this range</span></div>
              <div className={styles.rate}><span className={styles.rateLabel}>Listings that worked</span><span className={styles.rateValue}>{pct(rate(c.listingsDone, c.listings))}</span><span className={styles.rateNote}>{count(c.listingsDone)} of {count(c.listings)}</span></div>
              <div className={styles.rate}><span className={styles.rateLabel}>Checkout to paid</span><span className={styles.rateValue}>{pct(rate(c.checkoutsPaid, c.checkouts))}</span><span className={styles.rateNote}>{count(c.checkoutsPaid)} of {count(c.checkouts)}</span></div>
            </div>

            <div className={styles.split2}>
              <Panel title="Visitors a day" note="Daily unique visitors">
                <div className={styles.panelBody}>
                  <TrendLine data={trend} valueKey="count" height={180} label="Visitors" register="neutral" tone="gold" xFormat={dayLabel} yFormat={(v) => count(v)} />
                </div>
              </Panel>
              <Panel title="Listings a day" note="Charged listings, before returns">
                <div className={styles.panelBody}>
                  <TrendLine data={trend} valueKey="listings" height={180} label="Listings" register="neutral" tone="info" xFormat={dayLabel} yFormat={(v) => count(v)} />
                </div>
              </Panel>
            </div>

            <div className={styles.split2}>
              <Panel title="Countries" note="Daily visitors, from Cloudflare">
                {d.countries.length
                  ? <Bars rows={d.countries.map((x) => ({ key: x.country ?? 'none', label: countryName(x.country), value: x.visitors }))} />
                  : <p className={`${styles.panelBody} ${styles.muted}`}>No countries yet. Cloudflare's IP Geolocation must be on.</p>}
              </Panel>
              <Panel title="Devices" note="Daily visitors">
                <Bars rows={d.devices.map((x) => ({ key: x.device, label: x.device[0].toUpperCase() + x.device.slice(1), value: x.visitors }))} />
              </Panel>
            </div>
          </>
        )}
      </Report>
    </div>
  );
}
