import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { AdminShell } from '@components/layout/admin/AdminShell';
import { RateEntryInput } from '@components/ui/admin/RateEntryInput';
import { CurrentRateTile } from '@components/ui/admin/CurrentRateTile';
import { OperatorBadge } from '@components/ui/admin/OperatorBadge';
import { IconCheck } from '@components/ui/icons/IconCheck';
import { IconClock } from '@components/ui/icons/IconClock';
import { IconDot } from '@components/ui/icons/IconDot';
import { useAdminData } from '@context/AdminContext';
import { adminPath } from '@app/adminRouter';
import { getCurrentBuyRate } from '@utils/rateEngine';
import {
  fetchCurrentRate,
  fetchManualHistory,
  fetchRateSources,
  setManualRate as apiSetManualRate,
  listOperators,
  AuthApiError,
} from '@lib/authClient';
import styles from '@styles/pages/admin/rate-engine-page.module.css';

/* ──────────────────────────────────────────────────────────────────
 * RateEnginePage
 *
 * Route: /admin/rates
 * Register: obsidian (full page).
 *
 * Sections
 *   1. Page header               | title + subtitle
 *   2. Hero row                  | RateEntryInput (left) + CurrentRateTile (right)
 *   3. Rate sources              | priority chain status
 *   4. Recent entries            | history of manual rate updates
 *
 * Mobile critical workflow #3: open RateEngine | type new rate |
 * Save | confirmation. Under 30 seconds on a real device.
 *
 * Two data modes:
 *   - mock   (VITE_REMVO_AUTH_MODE !== 'api')  | reads useAdminData()
 *   - api    (VITE_REMVO_AUTH_MODE === 'api')  | three parallel
 *                                                fetches: current,
 *                                                history, sources.
 *                                                Polls current every
 *                                                30s (rate display).
 *
 * Manual source toggle is hidden in API mode at launch | source
 * priority editing is a Phase 7+ admin action and the operator's
 * launch interaction is rate entry only.
 * ────────────────────────────────────────────────────────────────── */

const AUTH_MODE = import.meta.env.VITE_REMVO_AUTH_MODE || 'local';
const IS_API_MODE = AUTH_MODE === 'api';

// Refresh interval for the current-rate poll. The CurrentRateTile
// caption shows source attribution that changes when the manual
// entry expires; 30s is a comfortable balance between freshness and
// idle-tab politeness.
const CURRENT_REFRESH_MS = 30_000;

const NAIRA = '₦';

// ─── Formatters ──────────────────────────────────────────────────

function formatNairaRate(value) {
  if (value == null || Number.isNaN(value)) return '';
  return NAIRA + Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatTimeAgo(iso) {
  if (!iso) return '';
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatAbsoluteTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function sourceDisplayName(id) {
  switch (id) {
    case 'manual':    return 'Manual entry';
    case 'coingecko': return 'CoinGecko + buffer';
    case 'p2p_army':  return 'P2P.Army';
    default:          return id;
  }
}

function sourceSubLabel(source) {
  if (source.id === 'coingecko') {
    // API: source.config.buffer_naira | mock: source.config.bufferNaira
    const buf = source.config?.buffer_naira ?? source.config?.bufferNaira;
    if (buf != null && buf > 0) return `+ ${NAIRA}${buf} buffer`;
  }
  return null;
}

// ─── Page ────────────────────────────────────────────────────────

export function RateEnginePage() {
  const navigate = useNavigate();
  const {
    rateSources: mockSources,
    rateEntries: mockEntries,
    operators,
    actions,
  } = useAdminData();

  // ─── API-mode state (only used when IS_API_MODE) ──

  const [apiCurrent, setApiCurrent] = useState(null);
  const [apiHistory, setApiHistory] = useState([]);
  const [apiSources, setApiSources] = useState([]);
  const [apiOperators, setApiOperators] = useState([]);
  const [apiLoading, setApiLoading] = useState(IS_API_MODE);
  const [apiError, setApiError] = useState(null);

  const fetchToken = useRef(0);

  const refreshAll = useCallback(async () => {
    if (!IS_API_MODE) return;
    const token = ++fetchToken.current;
    try {
      const [current, history, sources, ops] = await Promise.all([
        fetchCurrentRate().catch((err) => {
          if (err instanceof AuthApiError && err.status === 503) {
            return null;
          }
          throw err;
        }),
        fetchManualHistory({ limit: 50 }),
        fetchRateSources(),
        // Operators are static-ish; fetch each refresh is cheap and
        // saves a separate effect. If listing fails (forbidden, etc.)
        // fall back to empty so the page still renders.
        listOperators().catch(() => ({ items: [] })),
      ]);
      if (token !== fetchToken.current) return;
      setApiCurrent(current);
      setApiHistory(history.items);
      setApiSources(sources.items);
      setApiOperators(ops.items || []);
      setApiError(null);
    } catch (err) {
      if (token !== fetchToken.current) return;
      setApiError(
        err instanceof AuthApiError ? err.message : 'Could not load rate engine data.'
      );
    } finally {
      if (token === fetchToken.current) setApiLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!IS_API_MODE) return undefined;
    refreshAll();
    const t = setInterval(refreshAll, CURRENT_REFRESH_MS);
    return () => clearInterval(t);
  }, [refreshAll]);

  // ─── Submit handler (API mode) ──
  //
  // Returns a promise. Throws on error so RateEntryInput surfaces it.
  // On success, refresh history + current so the new entry shows up
  // immediately in the table and the tile.

  const handleApiSubmit = useCallback(
    async (rate, notes, opts = {}) => {
      try {
        await apiSetManualRate({
          buyRate: rate,
          notes,
          confirmDeviation: !!opts.confirmDeviation,
        });
        // Best-effort refresh; if it fails the operator still sees
        // the success state (the post returned 201).
        refreshAll();
      } catch (err) {
        // Surface server-supplied messages so the deviation
        // explanation reaches the operator without wrapper noise.
        if (err instanceof AuthApiError) {
          throw new Error(err.message);
        }
        throw err;
      }
    },
    [refreshAll]
  );

  // ─── Mock-mode submit (untouched) ──

  const handleMockSubmit = useCallback(
    (rate, notes) => actions.updateRate(rate, notes),
    [actions]
  );

  // ─── Mock data into the same shape API mode produces ──
  //
  // Both modes funnel through the same render block, so we adapt
  // mock entries to match the API row shape. Only happens in mock
  // mode; in API mode the apiHistory rows arrive in the right shape
  // already.

  const mockHistoryAsApi = useMemo(() => {
    if (IS_API_MODE) return [];
    return [...mockEntries]
      .sort((a, b) => new Date(b.enteredAt).getTime() - new Date(a.enteredAt).getTime())
      .map((e) => ({
        id: e.id,
        buy_rate: String(e.buyRate),
        entered_at: e.enteredAt,
        entered_by: e.enteredBy,
        notes: e.notes,
        expires_at: e.expiresAt,
        is_expired: !e.isActive && new Date(e.expiresAt).getTime() < Date.now(),
        is_active: e.isActive,
      }));
  }, [mockEntries]);

  const mockSourcesAsApi = useMemo(() => {
    if (IS_API_MODE) return [];
    return [...mockSources]
      .sort((a, b) => a.priority - b.priority)
      .map((s) => ({
        id: s.id,
        priority: s.priority,
        is_active: !!s.isActive,
        config: s.config || {},
        last_used_at: s.lastUsedAt || null,
      }));
  }, [mockSources]);

  // ─── Effective values used by the render ──

  const sortedSources = IS_API_MODE
    ? [...apiSources].sort((a, b) => a.priority - b.priority)
    : mockSourcesAsApi;

  const historyRows = IS_API_MODE ? apiHistory : mockHistoryAsApi;

  // ─── currentManual / coingecko / currentRate for the hero row ──

  const heroData = useMemo(() => {
    if (IS_API_MODE) {
      // API: apiCurrent contains source, manual_entry, coingecko.
      const cur = apiCurrent;
      const currentRate = cur
        ? {
            rate: Number(cur.buy_rate),
            source: cur.source,
            stale: cur.stale,
            enteredAt: cur.manual_entry?.entered_at,
            enteredBy: cur.manual_entry?.entered_by,
            expiresAt: cur.manual_entry?.expires_at,
            midRate: cur.coingecko?.mid_rate ? Number(cur.coingecko.mid_rate) : undefined,
            bufferNaira: cur.coingecko?.buffer_naira,
            fetchedAt: cur.coingecko?.fetched_at,
          }
        : null;
      const currentManual = cur?.manual_entry
        ? {
            rate: Number(cur.buy_rate),
            enteredAt: cur.manual_entry.entered_at,
            enteredBy: cur.manual_entry.entered_by,
            expiresAt: cur.manual_entry.expires_at,
          }
        : null;
      const coingeckoReading = cur?.coingecko
        ? {
            midRate: Number(cur.coingecko.mid_rate),
            bufferNaira: Number(cur.coingecko.buffer_naira || 0),
            fetchedAt: cur.coingecko.fetched_at,
          }
        : null;
      const manualSource = apiSources.find((s) => s.id === 'manual');
      const manualSourceActive = !!manualSource?.is_active;
      return { currentRate, currentManual, coingeckoReading, manualSourceActive };
    }
    // Mock
    const currentRate = getCurrentBuyRate({
      rateSources: mockSources,
      rateEntries: mockEntries,
    });
    const manualSource = mockSources.find((s) => s.id === 'manual');
    const manualSourceActive = !!manualSource?.isActive;
    const coingeckoSource = mockSources.find((s) => s.id === 'coingecko');
    const coingeckoReading = coingeckoSource?.lastReading
      ? {
          midRate: coingeckoSource.lastReading.midRate,
          bufferNaira: coingeckoSource.config?.bufferNaira || 0,
          fetchedAt: coingeckoSource.lastReading.fetchedAt,
        }
      : null;
    const activeManualEntry = mockEntries.find((e) => e.isActive);
    const currentManual = activeManualEntry
      ? {
          rate: activeManualEntry.buyRate,
          enteredAt: activeManualEntry.enteredAt,
          enteredBy: activeManualEntry.enteredBy,
          expiresAt: activeManualEntry.expiresAt,
        }
      : null;
    return { currentRate, currentManual, coingeckoReading, manualSourceActive };
  }, [apiCurrent, apiSources, mockSources, mockEntries]);

  function operatorFor(entry) {
    if (IS_API_MODE) {
      if (!entry.entered_by) return null;
      // Look up by id. The API stores 'op_xxx' or for the system
      // poller it's the literal string 'system'. Match those to a
      // real operator row when possible; otherwise synthesise.
      const match = apiOperators.find((o) => o.id === entry.entered_by);
      if (match) {
        return {
          id: match.id,
          displayName: match.display_name || match.email,
          email: match.email,
        };
      }
      return {
        id: entry.entered_by,
        displayName: entry.entered_by === 'system' ? 'System' : entry.entered_by,
      };
    }
    return operators.find((o) => o.id === entry.entered_by);
  }

  // Operators array passed to CurrentRateTile. Tile resolves the
  // attribution name by matching rate.enteredBy to operator.id.
  // In API mode we feed the live operators; in mock mode we feed
  // the mock collection.
  const tileOperators = useMemo(() => {
    if (!IS_API_MODE) return operators;
    return apiOperators.map((o) => ({
      id: o.id,
      displayName: o.display_name || o.email,
    }));
  }, [apiOperators, operators]);

  return (
    <AdminShell pageTitle="Rate engine" contentRegister="obsidian">
      <div className={styles.page}>
        {/* ═══ Header ═══ */}
        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Rate engine</h1>
          <p className={styles.pageSubtitle}>
            Manual rate entry is priority 1 in the session-init priority chain.
            Sources below fall through in order when manual is expired or off.
          </p>
        </header>

        {/* ═══ API error banner ═══ */}
        {IS_API_MODE && apiError && (
          <div className={styles.errorBanner} role="alert">
            {apiError}
          </div>
        )}

        {/* ═══ Hero row: entry + current ═══ */}
        <section className={styles.heroRow} aria-label="Rate entry and current rate">
          <div className={styles.heroEntry}>
            <RateEntryInput
              currentManual={heroData.currentManual}
              coingeckoReading={heroData.coingeckoReading}
              manualSourceActive={heroData.manualSourceActive}
              onSubmit={IS_API_MODE ? handleApiSubmit : handleMockSubmit}
              onToggleManual={
                IS_API_MODE
                  ? async () => { /* hidden in API mode at launch */ }
                  : (enabled) => actions.toggleManualSource(enabled)
              }
              hideToggle={IS_API_MODE}
            />
          </div>
          <div className={styles.heroCurrent}>
            <CurrentRateTile
              rate={heroData.currentRate}
              operators={tileOperators}
              onOpenRateEngine={() => {}}
            />
          </div>
        </section>

        {/* ═══ Rate sources ═══ */}
        <section className={styles.sourcesSection} aria-labelledby="sources-heading">
          <header className={styles.sectionHeader}>
            <div className={styles.sectionTitleGroup}>
              <h2 id="sources-heading" className={styles.sectionTitle}>
                Rate sources
              </h2>
              <p className={styles.sectionSubtitle}>
                Priority chain. The first source that returns a valid rate wins.
              </p>
            </div>
          </header>

          <div className={styles.sourcesTableWrap}>
            <table className={styles.sourcesTable}>
              <thead>
                <tr className={styles.sourcesHeadRow}>
                  <th scope="col" className={styles.sourcesTh} style={{ width: '64px' }}>Priority</th>
                  <th scope="col" className={styles.sourcesTh}>Source</th>
                  <th scope="col" className={styles.sourcesTh} style={{ width: '140px' }}>Status</th>
                  <th scope="col" className={styles.sourcesTh} style={{ width: '160px' }}>Last used</th>
                </tr>
              </thead>
              <tbody>
                {sortedSources.map((source) => {
                  const isWinning = heroData.currentRate?.source === source.id;
                  const sub = sourceSubLabel(source);
                  return (
                    <tr key={source.id} className={styles.sourcesRow}>
                      <td className={styles.sourcesTd}>
                        <span className={styles.priorityNum}>{source.priority}</span>
                      </td>
                      <td className={styles.sourcesTd}>
                        <div className={styles.sourceNameRow}>
                          <span className={styles.sourceName}>{sourceDisplayName(source.id)}</span>
                          {sub && <span className={styles.sourceSub}>{sub}</span>}
                          {isWinning && (
                            <span className={styles.winningBadge}>
                              <IconCheck size={10} /> Winning
                            </span>
                          )}
                        </div>
                      </td>
                      <td className={styles.sourcesTd}>
                        {source.is_active ? (
                          <span className={`${styles.statusPill} ${styles.statusActive}`}>
                            <IconDot size={8} /> Active
                          </span>
                        ) : (
                          <span className={`${styles.statusPill} ${styles.statusPaused}`}>
                            <IconClock size={10} /> Paused
                          </span>
                        )}
                      </td>
                      <td className={styles.sourcesTd}>
                        <span className={styles.lastUsed}>
                          {source.last_used_at ? formatTimeAgo(source.last_used_at) : 'Never'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* ═══ Recent entries ═══ */}
        <section className={styles.historySection} aria-labelledby="history-heading">
          <header className={styles.sectionHeader}>
            <div className={styles.sectionTitleGroup}>
              <h2 id="history-heading" className={styles.sectionTitle}>
                Recent entries
              </h2>
              <p className={styles.sectionSubtitle}>
                Every manual rate the operators have entered. Most recent first.
              </p>
            </div>
            <button
              type="button"
              className={styles.sectionViewAll}
              onClick={() => navigate(adminPath('/audit?action=rate.update'))}
            >
              View in audit log
            </button>
          </header>

          {historyRows.length === 0 ? (
            <div className={styles.historyEmpty}>
              <div className={styles.historyEmptyHeading}>
                {IS_API_MODE && apiLoading ? 'Loading rate history...' : 'No rate entries yet'}
              </div>
              <div className={styles.historyEmptyBody}>
                {IS_API_MODE && apiLoading
                  ? ''
                  : 'The first rate you enter will appear here.'}
              </div>
            </div>
          ) : (
            <div className={styles.historyTableWrap}>
              <table className={styles.historyTable}>
                <thead>
                  <tr className={styles.historyHeadRow}>
                    <th scope="col" className={styles.historyTh} style={{ width: '160px' }}>Entered</th>
                    <th scope="col" className={styles.historyTh} style={{ width: '130px' }}>Rate</th>
                    <th scope="col" className={styles.historyTh} style={{ width: '160px' }}>By</th>
                    <th scope="col" className={styles.historyTh}>Notes</th>
                    <th scope="col" className={styles.historyTh} style={{ width: '100px' }}>State</th>
                  </tr>
                </thead>
                <tbody>
                  {historyRows.map((entry) => {
                    const operator = operatorFor(entry);
                    const expiresAtMs = new Date(entry.expires_at).getTime();
                    const isExpired = entry.is_expired ?? expiresAtMs < Date.now();
                    // "Active" means the latest non-expired entry.
                    // The API doesn't return an `is_active` flag; we
                    // derive it from position-in-list (newest non-
                    // expired = active). Mock provides .is_active.
                    const isActive =
                      entry.is_active !== undefined
                        ? entry.is_active
                        : !isExpired && entry === historyRows.find((r) => !r.is_expired);
                    return (
                      <tr key={entry.id} className={styles.historyRow}>
                        <td className={styles.historyTd}>
                          <div className={styles.historyTimeGroup}>
                            <span className={styles.historyTimeAbs}>{formatAbsoluteTime(entry.entered_at)}</span>
                            <span className={styles.historyTimeRel}>{formatTimeAgo(entry.entered_at)}</span>
                          </div>
                        </td>
                        <td className={styles.historyTd}>
                          <span className={styles.historyRate}>
                            {formatNairaRate(Number(entry.buy_rate))}
                          </span>
                        </td>
                        <td className={styles.historyTd}>
                          {operator && <OperatorBadge operator={operator} size="sm" />}
                        </td>
                        <td className={styles.historyTd}>
                          <span className={styles.historyNotes}>
                            {entry.notes || <span className={styles.historyMuted}>{'—'}</span>}
                          </span>
                        </td>
                        <td className={styles.historyTd}>
                          {isActive && (
                            <span className={`${styles.statePill} ${styles.stateActive}`}>Active</span>
                          )}
                          {!isActive && isExpired && (
                            <span className={`${styles.statePill} ${styles.stateExpired}`}>Expired</span>
                          )}
                          {!isActive && !isExpired && (
                            <span className={`${styles.statePill} ${styles.stateReplaced}`}>Replaced</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
