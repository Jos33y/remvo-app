/* PHASE_7F_S3_ANALYTICS_API */
import { useMemo } from 'react';
import { useAnalyticsRange } from './AnalyticsLayout';
import { useAdminData } from '@context/AdminContext';
import { useAnalyticsEvents } from '@hooks/useAnalyticsApi';
import {
  computePlatformRollup, formatPercent, formatUsdCompact,
  formatNairaCompact,
} from '@utils/analytics';
import styles from '@styles/pages/admin/analytics-platforms-page.module.css';

/* ──────────────────────────────────────────────────────────────────
 * AnalyticsPlatformsPage
 *
 * Route: /analytics/platforms
 *
 * Per-platform performance. Designed as the view you could screenshot
 * for a platform partner during renewal conversation: their sessions,
 * their conversion rate, volume they sent, revenue they generated,
 * and country split of their traffic. One row per platform.
 *
 * Column layout is calibrated to fit 960px max-width without
 * horizontal scroll. Volume (NGN) is folded under Volume (USD) as a
 * muted sub-line rather than its own column. Country breakdown shows
 * the top two countries plus a "+N more" counter when applicable.
 *
 * Phase 7F Session 3 wiring
 * -------------------------
 * Events come from useAnalyticsEvents in API mode (one fetch for
 * the current range) and from useAdminData().events in mock mode.
 * Transactions + platforms continue to read from useAdminData() |
 * those slices get their own API hooks in later sessions.
 * ────────────────────────────────────────────────────────────────── */

const COUNTRIES_VISIBLE = 2;

function ConversionBar({ rate }) {
  const pct = Math.max(0, Math.min(100, rate));
  const tone = rate >= 60 ? 'success' : rate >= 40 ? 'neutral' : 'warning';
  const cls = [styles.bar, styles[`barTone-${tone}`]].join(' ');
  return (
    <div className={styles.barTrack} aria-hidden="true">
      <div className={cls} style={{ width: `${pct}%` }} />
    </div>
  );
}

function CountryBreakdown({ rows }) {
  if (!rows || rows.length === 0) {
    return <span className={styles.emptyInline}>None</span>;
  }
  const top = rows.slice(0, COUNTRIES_VISIBLE);
  const rest = rows.length - top.length;
  return (
    <span className={styles.countryList}>
      {top.map((r) => (
        <span key={r.code} className={styles.countryItem}>
          <span className={styles.countryCode}>{r.code}</span>
          <span className={styles.countryCount}>{r.count.toLocaleString('en-US')}</span>
        </span>
      ))}
      {rest > 0 && (
        <span className={styles.countryMore}>+{rest} more</span>
      )}
    </span>
  );
}

export function AnalyticsPlatformsPage() {
  const { range, label } = useAnalyticsRange();
  const fallback = useAdminData();

  const fromIso = useMemo(() => new Date(range.from).toISOString(), [range.from]);
  const toIso   = useMemo(() => new Date(range.to).toISOString(),   [range.to]);

  const api = useAnalyticsEvents({ from: fromIso, to: toIso });
  const events = api?.events ?? fallback.events;
  const transactions = fallback.transactions;
  const platforms = fallback.platforms;

  const rows = useMemo(
    () => computePlatformRollup({ events, transactions, platforms, range }),
    [events, transactions, platforms, range]
  );

  const totals = useMemo(() => {
    let sessionsStarted = 0;
    let sessionsConfirmed = 0;
    let volumeUsd = 0;
    let revenueUsd = 0;
    for (const r of rows) {
      sessionsStarted   += r.sessionsStarted;
      sessionsConfirmed += r.sessionsConfirmed;
      volumeUsd         += r.volumeUsd;
      revenueUsd        += r.revenueUsd;
    }
    const conversionRate = sessionsStarted > 0
      ? (sessionsConfirmed / sessionsStarted) * 100
      : 0;
    return { sessionsStarted, sessionsConfirmed, conversionRate, volumeUsd, revenueUsd };
  }, [rows]);

  const empty = rows.length === 0 || totals.sessionsStarted === 0;

  return (
    <div className={styles.wrap}>
      <header className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Platforms</h2>
          <p className={styles.sectionSubtitle}>
            Performance by integrating platform. <span className={styles.rangeText}>{label}</span>.
          </p>
        </div>
      </header>

      {empty ? (
        <div className={styles.empty}>
          No platform traffic recorded in this range.
        </div>
      ) : (
        <>
          {/* ═══ Totals strip ═══ */}
          <div className={styles.totals}>
            <div className={styles.totalCell}>
              <span className={styles.totalLabel}>Total sessions</span>
              <span className={styles.totalValue}>{totals.sessionsStarted.toLocaleString('en-US')}</span>
            </div>
            <div className={styles.totalCell}>
              <span className={styles.totalLabel}>Confirmed</span>
              <span className={styles.totalValue}>{totals.sessionsConfirmed.toLocaleString('en-US')}</span>
            </div>
            <div className={styles.totalCell}>
              <span className={styles.totalLabel}>Conversion</span>
              <span className={styles.totalValue}>{formatPercent(totals.conversionRate)}</span>
            </div>
            <div className={styles.totalCell}>
              <span className={styles.totalLabel}>Volume</span>
              <span className={styles.totalValue}>{formatUsdCompact(totals.volumeUsd)}</span>
            </div>
            <div className={styles.totalCell}>
              <span className={styles.totalLabel}>Revenue</span>
              <span className={styles.totalValue}>{formatUsdCompact(totals.revenueUsd)}</span>
            </div>
          </div>

          {/* ═══ Platform table ═══ */}
          <section className={styles.panel}>
            <div className={styles.tableScroller}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.colPlatform}>Platform</th>
                    <th className={styles.colNum}>Sessions</th>
                    <th className={styles.colNum}>Confirmed</th>
                    <th className={styles.colConversion}>Conversion</th>
                    <th className={styles.colNum}>Volume</th>
                    <th className={styles.colNum}>Revenue</th>
                    <th className={styles.colCountries}>Top countries</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.platformId} className={styles.row}>
                      <td className={styles.platformCell}>
                        <span className={styles.platformName}>{r.platformName}</span>
                        <span className={styles.platformId}>{r.platformId}</span>
                      </td>
                      <td className={styles.numCell}>
                        {r.sessionsStarted.toLocaleString('en-US')}
                      </td>
                      <td className={styles.numCell}>
                        {r.sessionsConfirmed.toLocaleString('en-US')}
                      </td>
                      <td className={styles.conversionCell}>
                        <div className={styles.conversionStack}>
                          <span className={styles.conversionValue}>
                            {formatPercent(r.conversionRate)}
                          </span>
                          <ConversionBar rate={r.conversionRate} />
                        </div>
                      </td>
                      <td className={styles.volumeCell}>
                        <span className={styles.volumeUsd}>
                          {formatUsdCompact(r.volumeUsd)}
                        </span>
                        <span className={styles.volumeNaira}>
                          {formatNairaCompact(r.volumeNaira)}
                        </span>
                      </td>
                      <td className={styles.numCell}>
                        {formatUsdCompact(r.revenueUsd)}
                      </td>
                      <td className={styles.countryCell}>
                        <CountryBreakdown rows={r.byCountry} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
