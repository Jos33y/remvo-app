/* PHASE_7F_S3_ANALYTICS_API */
import { useMemo, useState } from 'react';
import { FunnelChart } from '@components/ui/admin/FunnelChart';
import { StatCard } from '@components/ui/admin/StatCard';
import { useAnalyticsRange } from './AnalyticsLayout';
import { useAdminData } from '@context/AdminContext';
import { useAnalyticsEvents } from '@hooks/useAnalyticsApi';
import {
  computeFunnel, eventsInRange, formatPercent, resolveSessionDevices,
} from '@utils/analytics';
import styles from '@styles/pages/admin/analytics-funnel-page.module.css';

/* ──────────────────────────────────────────────────────────────────
 * AnalyticsFunnelPage
 *
 * Route: /analytics/funnel
 *
 * Full conversion funnel: Session started → Checkout opened →
 * Amount selected → Payment viewed → Payment confirmed. Segments
 * let operators slice by device (mobile / desktop / tablet) and
 * country (top three + rest). A secondary callout surfaces the
 * biggest single drop in the funnel.
 *
 * Phase 7F Session 3 wiring
 * -------------------------
 * Events come from useAnalyticsEvents in API mode (one fetch for
 * the current range) and from useAdminData().events in mock mode.
 * Device + country filters stay client-side because computeFunnel
 * is fast over a filtered array and refetching per filter change
 * would slow the experience for no correctness gain.
 *
 * Device resolution (checklist section K, 20 August 2026)
 * ------------------------------------------------------
 * Events are piped through resolveSessionDevices before filtering.
 * session.init is recorded during a server-to-server call from the
 * platform's backend, so its device was ALWAYS 'desktop' | the user's
 * browser has not been involved at that point. Filtering by Mobile
 * therefore returned zero sessions started and a full count of
 * checkout opened, which is not a funnel.
 *
 * The resolver takes each session's device from its browser-originated
 * events and applies it across the session, so step 1 inherits the
 * truth. Aggregate numbers are unaffected; only the segmented views
 * were ever wrong.
 * ────────────────────────────────────────────────────────────────── */

const DEVICE_FILTERS = [
  { key: 'all',     label: 'All devices' },
  { key: 'mobile',  label: 'Mobile' },
  { key: 'desktop', label: 'Desktop' },
  { key: 'tablet',  label: 'Tablet' },
];

export function AnalyticsFunnelPage() {
  const { range, label } = useAnalyticsRange();
  const fallback = useAdminData();
  const [deviceFilter, setDeviceFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');

  const fromIso = useMemo(() => new Date(range.from).toISOString(), [range.from]);
  const toIso   = useMemo(() => new Date(range.to).toISOString(),   [range.to]);

  const api = useAnalyticsEvents({ from: fromIso, to: toIso });
  const events = api?.events ?? fallback.events;

  /* Range-scope first, then resolve device per session. Order
   * matters: resolving over the scoped set keeps the pass small, and
   * a session straddling the range edge resolves from whatever of it
   * is in view, which is the same set the funnel counts. */
  const scoped = useMemo(
    () => resolveSessionDevices(eventsInRange(events, range)),
    [events, range]
  );

  // Derive top three countries for the segment filter (weighted by
  // session count) plus an "all" pseudo-option.
  const countries = useMemo(() => {
    const count = new Map();
    for (const e of scoped) {
      const sessionKey = `${e.countryCode}|${e.sessionId}`;
      count.set(sessionKey, (count.get(sessionKey) || 0) + 1);
    }
    // Collapse back to per-country session count (1 per unique session)
    const byCountry = new Map();
    for (const key of count.keys()) {
      const [cc] = key.split('|');
      byCountry.set(cc, (byCountry.get(cc) || 0) + 1);
    }
    const rows = Array.from(byCountry.entries())
      .map(([code, total]) => ({ code, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
    return rows;
  }, [scoped]);

  // Filter event set by current segment filters
  const filteredEvents = useMemo(() => {
    return scoped.filter(e => {
      if (deviceFilter !== 'all' && e.device !== deviceFilter) return false;
      if (countryFilter !== 'all' && e.countryCode !== countryFilter) return false;
      return true;
    });
  }, [scoped, deviceFilter, countryFilter]);

  const funnelSteps = useMemo(
    () => computeFunnel(filteredEvents),
    [filteredEvents]
  );

  // Biggest drop: look at pct-of-previous per step, excluding step 0
  const biggestDrop = useMemo(() => {
    if (funnelSteps.length <= 1) return null;
    let worst = null;
    for (let i = 1; i < funnelSteps.length; i++) {
      const dropPct = 100 - funnelSteps[i].pctOfPrev;
      if (worst == null || dropPct > worst.dropPct) {
        worst = {
          fromLabel: funnelSteps[i - 1].label,
          toLabel: funnelSteps[i].label,
          dropPct,
          dropCount: funnelSteps[i].dropFromPrev,
        };
      }
    }
    return worst;
  }, [funnelSteps]);

  const start = funnelSteps[0]?.count || 0;
  const end = funnelSteps[funnelSteps.length - 1]?.count || 0;
  const e2eRate = start > 0 ? (end / start) * 100 : 0;

  return (
    <div className={styles.wrap}>
      <header className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Checkout funnel</h2>
          <p className={styles.sectionSubtitle}>
            Every step a user walks through. <span className={styles.rangeText}>{label}</span>.
            Filter by device or country to compare segments.
          </p>
        </div>
      </header>

      {/* ═══ Segment filters ═══ */}
      <div className={styles.filters} role="region" aria-label="Segment filters">
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Device</span>
          <div className={styles.filterChips}>
            {DEVICE_FILTERS.map(f => {
              const active = f.key === deviceFilter;
              return (
                <button
                  key={f.key}
                  type="button"
                  className={`${styles.chip} ${active ? styles.chipActive : ''}`}
                  onClick={() => setDeviceFilter(f.key)}
                  aria-pressed={active}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Country</span>
          <div className={styles.filterChips}>
            <button
              type="button"
              className={`${styles.chip} ${countryFilter === 'all' ? styles.chipActive : ''}`}
              onClick={() => setCountryFilter('all')}
              aria-pressed={countryFilter === 'all'}
            >
              All
            </button>
            {countries.map(c => {
              const active = c.code === countryFilter;
              return (
                <button
                  key={c.code}
                  type="button"
                  className={`${styles.chip} ${active ? styles.chipActive : ''}`}
                  onClick={() => setCountryFilter(c.code)}
                  aria-pressed={active}
                >
                  {c.code}
                  <span className={styles.chipCount}>{c.total.toLocaleString('en-US')}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══ Summary row ═══ */}
      <div className={styles.summaryRow}>
        <div className={styles.summaryCard}>
          <StatCard
            size="sm"
            label="Top of funnel"
            value={start.toLocaleString('en-US')}
            context="Sessions started"
          />
        </div>
        <div className={styles.summaryCard}>
          <StatCard
            size="sm"
            label="Bottom of funnel"
            value={end.toLocaleString('en-US')}
            context="Payment confirmed"
          />
        </div>
        <div className={styles.summaryCard}>
          <StatCard
            size="sm"
            label="End-to-end"
            value={formatPercent(e2eRate)}
            context="Conversion"
            status={e2eRate >= 50 ? 'success' : 'neutral'}
          />
        </div>
        <div className={styles.summaryCard}>
          <StatCard
            size="sm"
            label="Biggest drop"
            value={biggestDrop ? formatPercent(biggestDrop.dropPct) : '—'}
            context={biggestDrop
              ? `${biggestDrop.fromLabel} -> ${biggestDrop.toLabel}`
              : 'Insufficient data'}
            status={biggestDrop && biggestDrop.dropPct > 30 ? 'warning' : 'neutral'}
          />
        </div>
      </div>

      {/* ═══ Funnel chart ═══ */}
      <section className={styles.panel} aria-labelledby="funnel-heading">
        <header className={styles.panelHeader}>
          <h3 id="funnel-heading" className={styles.panelTitle}>Funnel breakdown</h3>
        </header>
        {start === 0 ? (
          <div className={styles.empty}>
            No sessions recorded for this segment in the selected range.
          </div>
        ) : (
          <FunnelChart steps={funnelSteps} register="neutral" />
        )}
      </section>
    </div>
  );
}
