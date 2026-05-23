import { createContext, useContext, useMemo, useState } from 'react';
import { Outlet } from 'react-router';
import { AdminShell } from '@components/layout/admin/AdminShell';
import { AnalyticsTabs } from '@components/ui/admin/AnalyticsTabs';
import { RangePicker } from '@components/ui/admin/RangePicker';
import { RANGE_KEYS, resolveRange, rangeLabel } from '@utils/analytics';
import styles from '@styles/pages/admin/analytics-page.module.css';

/* ──────────────────────────────────────────────────────────────────
 * AnalyticsLayout
 *
 * Layout wrapper mounted as the element for the `/analytics` parent
 * route. Provides:
 *   - AdminShell with neutral content register
 *   - Obsidian hero strip containing title, description, RangePicker
 *   - Neutral tab bar (Overview | Funnel | Platforms)
 *   - A context that exposes the current range + its resolved window
 *     to the three child pages via useAnalyticsRange()
 *
 * Why range lives here
 * --------------------
 * All three tabs operate on the same time window. Pushing range
 * state into each child would require duplicate state + URL sync
 * three times. Keeping it at the layout means switching tabs
 * preserves the range choice, and the window is resolved once per
 * change instead of per render per tab.
 *
 * URL persistence: future enhancement. For Phase 6 the range is
 * in-memory; tab switches preserve it, page reloads reset to 7d.
 * Phase 7 adds ?range= URL sync when the backend is wired.
 * ────────────────────────────────────────────────────────────────── */

const AnalyticsRangeContext = createContext(null);

export function useAnalyticsRange() {
  const ctx = useContext(AnalyticsRangeContext);
  if (!ctx) {
    throw new Error('useAnalyticsRange must be used inside AnalyticsLayout');
  }
  return ctx;
}

const DEFAULT_VALUE = { key: RANGE_KEYS.WEEK, custom: null };

export function AnalyticsLayout() {
  const [value, setValue] = useState(DEFAULT_VALUE);

  const range = useMemo(
    () => resolveRange(value.key, value.custom),
    [value.key, value.custom?.from, value.custom?.to]
  );

  const contextValue = useMemo(
    () => ({ value, setValue, range, label: rangeLabel(value.key, value.custom) }),
    [value, range]
  );

  return (
    <AdminShell pageTitle="Analytics" contentRegister="neutral">
      <div className={styles.page}>
        <section className={styles.hero} aria-label="Analytics controls">
          <div className={styles.heroInner}>
            <div className={styles.heroText}>
              <p className={styles.kicker}>Analytics</p>
              <h1 className={styles.title}>Checkout performance</h1>
              <p className={styles.subtitle}>
                Conversion funnel, platform health, and user behaviour across every Remvo session.
              </p>
            </div>
            <div className={styles.heroControls}>
              <RangePicker
                value={value}
                onChange={setValue}
                register="obsidian"
              />
            </div>
          </div>
        </section>

        <div className={styles.tabsWrap}>
          <AnalyticsTabs />
        </div>

        <div className={styles.body}>
          <AnalyticsRangeContext.Provider value={contextValue}>
            <Outlet />
          </AnalyticsRangeContext.Provider>
        </div>
      </div>
    </AdminShell>
  );
}
