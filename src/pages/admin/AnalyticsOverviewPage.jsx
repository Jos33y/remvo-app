/* PHASE_7F_S3_ANALYTICS_API */
import { useMemo } from 'react';
import { StatCard } from '@components/ui/admin/StatCard';
import { TrendLine } from '@components/ui/admin/TrendLine';
import { useAnalyticsRange } from './AnalyticsLayout';
import { useAdminData } from '@context/AdminContext';
import { useAnalyticsEvents } from '@hooks/useAnalyticsApi';
import {
  computeOverview, computeTrend, eventsInRange, formatDelta,
  formatPercent, formatUsdCompact, EVENT_TYPES,
} from '@utils/analytics';
import { IconLayers } from '@components/ui/icons/IconLayers';
import { IconCheck } from '@components/ui/icons/IconCheck';
import { IconRate } from '@components/ui/icons/IconRate';
import { IconAlert } from '@components/ui/icons/IconAlert';
import styles from '@styles/pages/admin/analytics-overview-page.module.css';

/* ──────────────────────────────────────────────────────────────────
 * AnalyticsOverviewPage
 *
 * Route: /analytics
 * The cockpit. Six top-line metrics, one trend chart, and two
 * highlight callouts (top country + session outcomes).
 *
 * Delta comparison uses formatDelta with a minBase guard so noisy
 * previous-period values do not produce absurd percentage swings.
 * When the previous period has fewer than 3 samples, we show a
 * neutral "new period" tag instead of a bogus green/red badge.
 *
 * Phase 7F Session 3 wiring (no compute changes)
 * ----------------------------------------------
 * In API mode (VITE_REMVO_AUTH_MODE === 'api'), events come from two
 * fetches | one over the current range, one over the previous range
 * | through useAnalyticsEvents. Each fetch fits under the backend's
 * 31-day cap independently, so a 30-day current range with a 30-day
 * comparison window remains valid.
 *
 * In any other mode the page falls through to useAdminData().events
 * (mock derivation), keeping the dev-escape walkthroughs working
 * without the backend.
 *
 * Money fields (volumeUsd, revenueUsd, avgSessionUsd) continue to
 * read from useAdminData().transactions until the transactions
 * slice gets its own API hook in a later session. The mock
 * transactions are consistent with the seeded events, so cross-mode
 * drift is bounded.
 * ────────────────────────────────────────────────────────────────── */

function formatDayLabel(t) {
  const d = new Date(t);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatHourTick(t) {
  const d = new Date(t);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })
    .replace(' ', '');
}

function formatTooltipX(rangeDurationMs) {
  const HOUR = 60 * 60 * 1000;
  const DAY = 24 * HOUR;
  if (rangeDurationMs <= DAY + HOUR) {
    return (t) => {
      const d = new Date(t);
      return d.toLocaleString('en-US', {
        hour: 'numeric', minute: '2-digit', hour12: true,
      });
    };
  }
  return (t) => formatDayLabel(t);
}

function formatTickX(rangeDurationMs) {
  const HOUR = 60 * 60 * 1000;
  const DAY = 24 * HOUR;
  if (rangeDurationMs <= DAY + HOUR) {
    return formatHourTick;
  }
  return formatDayLabel;
}

function DeltaBadge({ delta }) {
  if (!delta) return null;
  const cls = [
    styles.delta,
    styles[`delta-${delta.sign}`],
  ].join(' ');
  const a11yLabel = delta.sign === 'new'
    ? 'New reporting period, no previous comparison'
    : `Change versus previous period: ${delta.text}`;
  return (
    <span className={cls} aria-label={a11yLabel}>
      {delta.text}
    </span>
  );
}

export function AnalyticsOverviewPage() {
  const { range, label } = useAnalyticsRange();
  const fallback = useAdminData();

  /* ISO conversions memoised on the primitive epoch ms inputs so the
   * useAnalyticsEvents dep arrays receive stable string keys. */
  const currentFromIso = useMemo(() => new Date(range.from).toISOString(), [range.from]);
  const currentToIso   = useMemo(() => new Date(range.to).toISOString(),   [range.to]);
  const prevFromIso    = useMemo(() => new Date(range.previousFrom).toISOString(), [range.previousFrom]);
  const prevToIso      = useMemo(() => new Date(range.previousTo).toISOString(),   [range.previousTo]);

  const apiCurrent  = useAnalyticsEvents({ from: currentFromIso, to: currentToIso });
  const apiPrevious = useAnalyticsEvents({ from: prevFromIso,    to: prevToIso });

  /* In API mode the two hook returns are independent event arrays
   * pre-filtered to their respective windows. computeOverview's
   * internal eventsInRange() is a no-op in that case, which is fine.
   *
   * In mock mode the hooks return null and we use the same mock
   * array for both calls; eventsInRange() inside computeOverview does
   * the per-window filtering as before. */
  const events         = apiCurrent?.events  ?? fallback.events;
  const previousEvents = apiPrevious?.events ?? fallback.events;
  const transactions   = fallback.transactions;

  const current = useMemo(
    () => computeOverview({ events, transactions, range }),
    [events, transactions, range]
  );

  const previous = useMemo(() => {
    const prevRange = { from: range.previousFrom, to: range.previousTo };
    return computeOverview({ events: previousEvents, transactions, range: prevRange });
  }, [previousEvents, transactions, range]);

  const deltas = useMemo(() => ({
    sessionsStarted:   formatDelta(current.sessionsStarted,   previous.sessionsStarted),
    conversionRate:    formatDelta(current.conversionRate,    previous.conversionRate),
    volumeUsd:         formatDelta(current.volumeUsd,         previous.volumeUsd),
    revenueUsd:        formatDelta(current.revenueUsd,        previous.revenueUsd),
    avgSessionUsd:     formatDelta(current.avgSessionUsd,     previous.avgSessionUsd),
    failedCount:       formatDelta(current.failedCount,       previous.failedCount),
  }), [current, previous]);

  const trend = useMemo(() => computeTrend({
    events: eventsInRange(events, range),
    transactions: [],
    range,
    eventType: EVENT_TYPES.SESSION_INIT,
  }), [events, range]);

  const bestCountry = useMemo(() => {
    const scoped = eventsInRange(events, range);
    const byCountry = new Map();
    for (const e of scoped) {
      const cc = e.countryCode || 'XX';
      let row = byCountry.get(cc);
      if (!row) {
        row = { code: cc, sessions: new Set(), confirmed: new Set() };
        byCountry.set(cc, row);
      }
      row.sessions.add(e.sessionId);
      if (e.event === EVENT_TYPES.PAYMENT_CONFIRMED) {
        row.confirmed.add(e.sessionId);
      }
    }
    let best = null;
    for (const row of byCountry.values()) {
      const total = row.sessions.size;
      if (total < 3) continue;
      const rate = (row.confirmed.size / total) * 100;
      if (!best || rate > best.rate) {
        best = { code: row.code, rate, total };
      }
    }
    return best;
  }, [events, range]);

  const hasData = current.sessionsStarted > 0;
  const xFormatter = formatTooltipX(range.durationMs);
  const xTickFormatter = formatTickX(range.durationMs);
  const hasFailures = current.failedCount > 0;

  return (
    <div className={styles.wrap}>
      <header className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Overview</h2>
        <p className={styles.sectionSubtitle}>
          Reading: <span className={styles.sectionRange}>{label}</span>
          <span className={styles.sectionSeparator}> · </span>
          Comparison: previous period
        </p>
      </header>

      {/* ═══ Primary cockpit row ═══ */}
      <div className={styles.primaryRow}>
        <div className={styles.primaryCard}>
          <StatCard
            size="md"
            label="Sessions started"
            value={current.sessionsStarted.toLocaleString('en-US')}
            context={<DeltaBadge delta={deltas.sessionsStarted} />}
            icon={<IconLayers size={20} />}
          />
        </div>
        <div className={styles.primaryCard}>
          <StatCard
            size="md"
            label="Conversion rate"
            value={formatPercent(current.conversionRate)}
            context={
              <span>
                {current.sessionsConfirmed.toLocaleString('en-US')} confirmed
                {deltas.conversionRate && (
                  <>
                    <span className={styles.sep}> · </span>
                    <DeltaBadge delta={deltas.conversionRate} />
                  </>
                )}
              </span>
            }
            icon={<IconCheck size={20} />}
            status={current.conversionRate >= 50 ? 'success' : 'neutral'}
          />
        </div>
        <div className={styles.primaryCard}>
          <StatCard
            size="md"
            label="Volume (USD)"
            value={formatUsdCompact(current.volumeUsd)}
            context={<DeltaBadge delta={deltas.volumeUsd} />}
            icon={<IconRate size={20} />}
          />
        </div>
      </div>

      {/* ═══ Secondary row ═══ */}
      <div className={styles.secondaryRow}>
        <div className={styles.secondaryCard}>
          <StatCard
            size="sm"
            label="Revenue"
            value={formatUsdCompact(current.revenueUsd)}
            context={<DeltaBadge delta={deltas.revenueUsd} />}
          />
        </div>
        <div className={styles.secondaryCard}>
          <StatCard
            size="sm"
            label="Average session"
            value={formatUsdCompact(current.avgSessionUsd)}
            context={<DeltaBadge delta={deltas.avgSessionUsd} />}
          />
        </div>
        <div className={styles.secondaryCard}>
          <StatCard
            size="sm"
            label="Failed sessions"
            value={current.failedCount.toLocaleString('en-US')}
            context={<DeltaBadge delta={deltas.failedCount} />}
            status={hasFailures ? 'warning' : 'neutral'}
            icon={<IconAlert size={18} />}
          />
        </div>
      </div>

      {/* ═══ Trend panel ═══ */}
      <section className={styles.panel} aria-labelledby="trend-heading">
        <header className={styles.panelHeader}>
          <div className={styles.panelText}>
            <h3 id="trend-heading" className={styles.panelTitle}>Sessions over time</h3>
            <p className={styles.panelSubtitle}>
              Session starts bucketed across the selected window. Hover any point for the exact count.
            </p>
          </div>
        </header>
        <div className={styles.trendWrap}>
          <TrendLine
            data={trend}
            valueKey="count"
            height={200}
            label="Sessions over time"
            tone="gold"
            register="neutral"
            xFormat={xFormatter}
            xTickFormat={xTickFormatter}
            yFormat={(v) => `${v.toLocaleString('en-US')} sessions`}
          />
        </div>
      </section>

      {/* ═══ Highlight callouts ═══ */}
      <div className={styles.highlightGrid}>
        <section className={styles.highlight}>
          <h3 className={styles.highlightTitle}>Top country</h3>
          {bestCountry ? (
            <div className={styles.highlightBody}>
              <span className={styles.highlightValue}>{bestCountry.code}</span>
              <span className={styles.highlightMeta}>
                {formatPercent(bestCountry.rate)} conversion
                <span className={styles.sep}> · </span>
                {bestCountry.total.toLocaleString('en-US')} sessions
              </span>
            </div>
          ) : (
            <div className={styles.highlightEmpty}>
              Not enough sessions to rank yet.
            </div>
          )}
        </section>

        <section className={styles.highlight}>
          <h3 className={styles.highlightTitle}>Session outcomes</h3>
          {hasData ? (
            <div className={styles.outcomeRow}>
              <div className={styles.outcome}>
                <span className={`${styles.outcomeDot} ${styles.outcomeDotSuccess}`} aria-hidden="true" />
                <span className={styles.outcomeValue}>
                  {current.sessionsConfirmed.toLocaleString('en-US')}
                </span>
                <span className={styles.outcomeLabel}>Confirmed</span>
              </div>
              <div className={styles.outcome}>
                <span className={`${styles.outcomeDot} ${styles.outcomeDotWarning}`} aria-hidden="true" />
                <span className={styles.outcomeValue}>
                  {current.expiredCount.toLocaleString('en-US')}
                </span>
                <span className={styles.outcomeLabel}>Expired</span>
              </div>
              <div className={styles.outcome}>
                <span className={`${styles.outcomeDot} ${styles.outcomeDotError}`} aria-hidden="true" />
                <span className={styles.outcomeValue}>
                  {current.failedCount.toLocaleString('en-US')}
                </span>
                <span className={styles.outcomeLabel}>Failed</span>
              </div>
            </div>
          ) : (
            <div className={styles.highlightEmpty}>
              No sessions in this range.
            </div>
          )}
        </section>
      </div>

      {!hasData && (
        <div className={styles.emptyState}>
          No sessions recorded in this range. Try widening the date range or wait for checkout traffic.
        </div>
      )}
    </div>
  );
}
