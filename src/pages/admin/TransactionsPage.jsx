import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { AdminShell } from '@components/layout/admin/AdminShell';
import { FilterBar } from '@components/ui/admin/FilterBar';
import { EmptyState } from '@components/ui/admin/EmptyState';
import { IconLayers } from '@components/ui/icons/IconLayers';
import { useAdminData } from '@context/AdminContext';
import { adminPath } from '@app/adminRouter';
import {
  fetchTransactions,
  countTransactions,
  buildTransactionsCsvUrl,
  AuthApiError,
} from '@lib/authClient';
import styles from '@styles/pages/admin/transactions-page.module.css';

/* ──────────────────────────────────────────────────────────────────
 * TransactionsPage
 *
 * Route: /admin/transactions | register: neutral.
 *
 * Filters (URL-backed except search):
 *   - Settlement | pending | settled
 *   - Date range | preset (today, yesterday, 7d, 30d, custom) on
 *                  confirmed_at
 *   - Search     | reference, session_id, platform_user_id (ILIKE)
 *   - Platform   | (Phase 7+ when multi-platform; URL param ready)
 *
 * Pagination:
 *   - Cursor on (confirmed_at, id), 50 rows per page
 *   - "Load older entries" + "End of list" terminal state
 *   - "Showing 50 of 247" header from the count endpoint, fired in
 *     parallel with the list fetch
 *
 * Auth-mode awareness:
 *   - VITE_REMVO_AUTH_MODE=api  | live API
 *   - any other value           | mock | client-side filter on
 *                                  useAdminData().transactions
 *
 * Pattern matches AuditLogPage.jsx so the two screens share muscle
 * memory across operators (filter strip on top, FilterBar with
 * pills below, table, paginate-or-end-of-log tail).
 *
 * Related docs:
 *   src/modules/transactions/adminRoutes.js
 *   src/lib/authClient.js
 * ────────────────────────────────────────────────────────────────── */

const AUTH_MODE = import.meta.env.VITE_REMVO_AUTH_MODE || 'local';
const IS_API_MODE = AUTH_MODE === 'api';
const PAGE_SIZE = 50;
const SEARCH_DEBOUNCE_MS = 300;

const SETTLEMENT_OPTIONS = [
  { value: '',         label: 'All transactions' },
  { value: 'pending',  label: 'Pending settlement' },
  { value: 'settled',  label: 'Settled' },
];

const DATE_PRESETS = [
  { value: '',          label: 'All time' },
  { value: 'today',     label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7d',        label: 'Last 7 days' },
  { value: '30d',       label: 'Last 30 days' },
  { value: 'custom',    label: 'Custom range' },
];

const SETTLEMENT_LABEL_MAP = Object.fromEntries(
  SETTLEMENT_OPTIONS.filter((o) => o.value).map((o) => [o.value, o.label])
);

// ─── Date preset resolver | matches AuditLogPage pattern ─────────

function resolveDatePreset(preset, customFrom, customTo) {
  if (!preset) return {};
  if (preset === 'custom') {
    return {
      fromDate: customFrom || undefined,
      toDate: customTo || undefined,
    };
  }
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  if (preset === 'today') {
    return { fromDate: startOfToday.toISOString() };
  }
  if (preset === 'yesterday') {
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    return {
      fromDate: startOfYesterday.toISOString(),
      toDate: startOfToday.toISOString(),
    };
  }
  if (preset === '7d') {
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    return { fromDate: start.toISOString() };
  }
  if (preset === '30d') {
    const start = new Date(now);
    start.setDate(start.getDate() - 30);
    return { fromDate: start.toISOString() };
  }
  return {};
}

// ─── Formatters ──────────────────────────────────────────────────

function formatUsd(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '$0.00';
  return '$' + n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatNaira(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '\u20A60';
  return '\u20A6' + Math.trunc(n).toLocaleString('en-US');
}

function formatDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  // "Apr 29, 14:32" in operator's locale | dense, two-line capable.
  return d.toLocaleString('en-GB', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Compute margin from row fields. Returns { naira, pct } where naira
 * is a number and pct is a number, or nulls when the inputs are
 * missing (mock rows without rate snapshot, or older rows).
 *
 * margin_naira = (effective_rate - cost_basis) * amount_usd_credited
 * margin_pct   = (effective_rate - cost_basis) / cost_basis * 100
 *
 * Mirrors the CSV computation in adminRoutes.js so the displayed
 * value and the exported value never diverge.
 */
function computeMargin(row) {
  const eff = row.effective_rate_full == null ? null : Number(row.effective_rate_full);
  const cost = row.p2p_rate_at_lock == null ? null : Number(row.p2p_rate_at_lock);
  const credited = row.amount_usd_credited == null ? null : Number(row.amount_usd_credited);
  if (eff == null || cost == null || credited == null || !Number.isFinite(eff) || !Number.isFinite(cost) || cost <= 0) {
    return { naira: null, pct: null };
  }
  return {
    naira: (eff - cost) * credited,
    pct: ((eff - cost) / cost) * 100,
  };
}

// ─── Page ────────────────────────────────────────────────────────

export function TransactionsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const mockData = useAdminData();

  // ─── Filter state | URL-backed except search ──

  const platformFilter = searchParams.get('platform_id') || '';
  const settlementFilter = searchParams.get('settlement_status') || '';
  const datePreset = searchParams.get('date') || '';
  const customFrom = searchParams.get('from_date') || '';
  const customTo = searchParams.get('to_date') || '';

  const [search, setSearch] = useState('');
  /* DENSITY_STATE */
  const [density, setDensity] = useState('default');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    if (search === debouncedSearch) return undefined;
    const t = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [search, debouncedSearch]);

  const resolvedDate = useMemo(
    () => resolveDatePreset(datePreset, customFrom, customTo),
    [datePreset, customFrom, customTo]
  );

  // ─── Data state ──

  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(null);
  const [loading, setLoading] = useState(IS_API_MODE);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  // Token guards against stale responses overwriting fresh data
  // when the operator types fast or rapidly toggles a filter.
  const fetchToken = useRef(0);

  const apiFilters = useMemo(
    () => ({
      platformId: platformFilter || undefined,
      settlementStatus: settlementFilter || undefined,
      fromDate: resolvedDate.fromDate,
      toDate: resolvedDate.toDate,
      search: debouncedSearch || undefined,
    }),
    [
      platformFilter,
      settlementFilter,
      resolvedDate.fromDate,
      resolvedDate.toDate,
      debouncedSearch,
    ]
  );

  const fetchPage = useCallback(
    async ({ append = false } = {}) => {
      if (!IS_API_MODE) return;
      const token = ++fetchToken.current;
      if (append) setLoadingMore(true);
      else setLoading(true);
      try {
        const [pageResult, countResult] = await Promise.all([
          fetchTransactions({
            limit: PAGE_SIZE,
            ...apiFilters,
            cursor: append ? cursor : undefined,
          }),
          // Only refetch count on a fresh load; appending doesn't
          // change the total. Append branch returns the existing
          // total via a no-op resolved promise.
          append
            ? Promise.resolve({ total: total ?? 0 })
            : countTransactions(apiFilters).catch(() => ({ total: null })),
        ]);

        if (token !== fetchToken.current) return;

        setItems((prev) => (append ? [...prev, ...pageResult.items] : pageResult.items));
        setCursor(pageResult.next_cursor);
        setHasMore(pageResult.next_cursor != null);
        if (!append) setTotal(countResult.total);
        setError(null);
      } catch (err) {
        if (token !== fetchToken.current) return;
        setError(
          err instanceof AuthApiError
            ? err.message
            : 'Could not load transactions.'
        );
      } finally {
        if (token === fetchToken.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    // cursor + total intentionally omitted | append=true reads them
    // at call time to avoid a re-render loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [apiFilters]
  );

  useEffect(() => {
    if (!IS_API_MODE) return;
    fetchPage({ append: false });
  }, [fetchPage]);

  // ─── Mock fallback ──

  const mockItems = useMemo(() => {
    if (IS_API_MODE) return [];
    const term = debouncedSearch.trim().toLowerCase();
    return mockData.transactions
      .filter((t) => t.status === 'confirmed')
      .filter((t) => {
        if (settlementFilter === 'pending' && t.settlementBatchId) return false;
        if (settlementFilter === 'settled' && !t.settlementBatchId) return false;
        if (resolvedDate.fromDate) {
          if (new Date(t.confirmedAt || t.createdAt) < new Date(resolvedDate.fromDate)) return false;
        }
        if (resolvedDate.toDate) {
          if (new Date(t.confirmedAt || t.createdAt) >= new Date(resolvedDate.toDate)) return false;
        }
        if (!term) return true;
        return (
          (t.reference && t.reference.toLowerCase().includes(term)) ||
          (t.sessionId && t.sessionId.toLowerCase().includes(term)) ||
          (t.platformUserId && t.platformUserId.toLowerCase().includes(term))
        );
      })
      .map((t) => ({
        // Reshape mock to API-style snake_case so the table renderer
        // is identical across modes.
        id: t.id,
        session_id: t.sessionId,
        public_reference: t.reference,
        platform_id: t.platformId,
        platform_user_id: t.platformUserId,
        country_code: 'NG',
        amount_usd_credited: String(t.amountUsdCredited),
        amount_usd_settled: String(t.amountUsdSettled),
        platform_fee_usd: String(t.platformFeeUsd),
        amount_ngn: String(t.userPaysNaira),
        display_rate: t.displayRate,
        effective_rate_full: t.effectiveRateFull,
        p2p_rate_at_lock: t.p2pRateAtLock,
        settlement_batch_id: t.settlementBatchId,
        settled_at: null,
        sol_tx_hash: null,
        confirmed_at: t.confirmedAt || t.createdAt,
        created_at: t.createdAt,
      }));
  }, [
    mockData.transactions,
    settlementFilter,
    resolvedDate.fromDate,
    resolvedDate.toDate,
    debouncedSearch,
  ]);

  const displayedItems = IS_API_MODE ? items : mockItems;
  const displayedTotal = IS_API_MODE ? total : mockItems.length;
  const displayedHasMore = IS_API_MODE ? hasMore : false;

  // ─── Filter setters ──

  function updateParam(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key === 'date' && value !== 'custom') {
      next.delete('from_date');
      next.delete('to_date');
    }
    setSearchParams(next);
  }

  function handleSettlementChange(e) { updateParam('settlement_status', e.target.value); }
  function handleDatePresetChange(e) { updateParam('date', e.target.value); }
  function handleCustomFromChange(e) {
    updateParam('from_date', e.target.value ? new Date(e.target.value).toISOString() : '');
  }
  function handleCustomToChange(e) {
    updateParam('to_date', e.target.value ? new Date(e.target.value).toISOString() : '');
  }

  // ─── Filter pills ──

  const activeFilters = useMemo(() => {
    const pills = [];
    if (settlementFilter) {
      pills.push({
        key: 'settlement_status',
        label: `Status: ${SETTLEMENT_LABEL_MAP[settlementFilter] || settlementFilter}`,
      });
    }
    if (platformFilter) {
      pills.push({
        key: 'platform_id',
        label: `Platform: ${platformFilter}`,
      });
    }
    if (datePreset) {
      const presetLabel = DATE_PRESETS.find((p) => p.value === datePreset)?.label || datePreset;
      pills.push({ key: 'date', label: `Date: ${presetLabel}` });
    }
    return pills;
  }, [settlementFilter, platformFilter, datePreset]);

  function handleFilterRemove(key) {
    const next = new URLSearchParams(searchParams);
    next.delete(key);
    if (key === 'date') {
      next.delete('from_date');
      next.delete('to_date');
    }
    setSearchParams(next);
  }

  function handleClearAll() {
    setSearch('');
    setSearchParams(new URLSearchParams());
  }

  function handleExport() {
    if (!IS_API_MODE) return;
    window.location.href = buildTransactionsCsvUrl(apiFilters);
  }

  function handleRowClick(row) {
    navigate(adminPath(`/transactions/${encodeURIComponent(row.id)}`));
  }

  // ─── Render ──

  return (
    <AdminShell pageTitle="Transactions" contentRegister="neutral">
      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Transactions</h1>
          <p className={styles.pageSubtitle}>
            Every confirmed deposit. Filter by status, date, or search by reference, session id, or platform user id.
          </p>
        </header>

        {/* Filter strip */}
        <div className={styles.filterStrip}>
          <div className={styles.filterField}>
            <label className={styles.filterLabel} htmlFor="filter-settlement">Status</label>
            <select
              id="filter-settlement"
              className={styles.filterSelect}
              value={settlementFilter}
              onChange={handleSettlementChange}
            >
              {SETTLEMENT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className={styles.filterField}>
            <label className={styles.filterLabel} htmlFor="filter-date">Date</label>
            <select
              id="filter-date"
              className={styles.filterSelect}
              value={datePreset}
              onChange={handleDatePresetChange}
            >
              {DATE_PRESETS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {datePreset === 'custom' && (
            <>
              <div className={styles.filterField}>
                <label className={styles.filterLabel} htmlFor="filter-from">From</label>
                <input
                  id="filter-from"
                  type="datetime-local"
                  className={styles.dateInput}
                  value={customFrom ? customFrom.slice(0, 16) : ''}
                  onChange={handleCustomFromChange}
                />
              </div>
              <div className={styles.filterField}>
                <label className={styles.filterLabel} htmlFor="filter-to">To</label>
                <input
                  id="filter-to"
                  type="datetime-local"
                  className={styles.dateInput}
                  value={customTo ? customTo.slice(0, 16) : ''}
                  onChange={handleCustomToChange}
                />
              </div>
            </>
          )}
        </div>

        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Reference, session id, or platform user id"
          autoFocusSearch
          filters={activeFilters}
          onFilterRemove={handleFilterRemove}
          onClearAll={handleClearAll}
          onExport={IS_API_MODE && displayedItems.length > 0 ? handleExport : undefined}
          /* DENSITY_FILTERBAR */
          density={density}
          onDensityChange={setDensity}
        />

        {!loading && !error && displayedItems.length > 0 && (
          <div className={styles.metaRow}>
            <span>
              Showing {displayedItems.length}
              {typeof displayedTotal === 'number' ? ` of ${displayedTotal.toLocaleString()}` : ''}
            </span>
          </div>
        )}

        {loading && (
          <div className={styles.loadingBlock}>Loading transactions...</div>
        )}

        {error && (
          <EmptyState
            icon={<IconLayers size={24} />}
            heading="Could not load transactions"
            body={error}
          />
        )}

        {!loading && !error && displayedItems.length === 0 && (
          <EmptyState
            icon={<IconLayers size={24} />}
            heading={
              activeFilters.length > 0 || search
                ? 'No transactions match'
                : 'No transactions yet'
            }
            body={
              activeFilters.length > 0 || search
                ? 'Try clearing filters or adjusting your search.'
                : 'Confirmed deposits will appear here once Monnify confirms a payment.'
            }
          />
        )}

        {!loading && !error && displayedItems.length > 0 && (
          <div className={styles.tableWrap} data-density={density}/* DENSITY_TABLEWRAP */>
            <table className={styles.table} aria-label="Transactions">
              <thead className={styles.thead}>
                <tr>
                  <th scope="col" className={styles.th} style={{ width: '152px' }}>Confirmed</th>
                  <th scope="col" className={styles.th}>Reference</th>
                  <th scope="col" className={styles.th} style={{ width: '120px' }}>Platform</th>
                  <th scope="col" className={`${styles.th} ${styles.thRight}`} style={{ width: '120px' }}>USD</th>
                  <th scope="col" className={`${styles.th} ${styles.thRight}`} style={{ width: '128px' }}>Naira</th>
                  <th scope="col" className={`${styles.th} ${styles.thRight}`} style={{ width: '88px' }}>Rate</th>
                  <th scope="col" className={`${styles.th} ${styles.thRight}`} style={{ width: '128px' }}>Margin</th>
                  <th scope="col" className={styles.th} style={{ width: '128px' }}>Settlement</th>
                </tr>
              </thead>
              <tbody>
                {displayedItems.map((t) => {
                  const margin = computeMargin(t);
                  return (
                  <tr
                    key={t.id}
                    className={styles.row}
                    tabIndex={0}
                    onClick={() => handleRowClick(t)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleRowClick(t);
                      }
                    }}
                  >
                    <td className={styles.td}>
                      <span className={styles.timeMono}>
                        {formatDateTime(t.confirmed_at)}
                      </span>
                    </td>
                    <td className={styles.td}>
                      <div className={styles.referenceBlock}>
                        <span className={styles.reference}>{t.public_reference}</span>
                        <span className={styles.userMeta}>
                          {t.platform_user_id}
                        </span>
                      </div>
                    </td>
                    <td className={styles.td}>
                      <span className={styles.platformChip}>{t.platform_id}</span>
                    </td>
                    <td className={`${styles.td} ${styles.tdRight}`}>
                      <span className={styles.mono}>
                        {formatUsd(t.amount_usd_credited)}
                      </span>
                    </td>
                    <td className={`${styles.td} ${styles.tdRight}`}>
                      <span className={styles.mono}>
                        {formatNaira(t.amount_ngn)}
                      </span>
                    </td>
                    <td className={`${styles.td} ${styles.tdRight}`}>
                      <span className={styles.monoMuted}>
                        {Number(t.display_rate).toLocaleString('en-US')}
                      </span>
                    </td>
                    <td className={`${styles.td} ${styles.tdRight}`}>
                      {margin.naira == null ? (
                        <span className={styles.marginEmpty}>—</span>
                      ) : (
                        <div className={styles.marginBlock}>
                          <span
                            className={[
                              styles.marginValue,
                              margin.naira < 0 ? styles.marginNeg : styles.marginPos,
                            ].join(' ')}
                          >
                            {margin.naira >= 0 ? '+' : '\u2212'}
                            {formatNaira(Math.abs(margin.naira))}
                          </span>
                          <span className={styles.marginPct}>
                            {margin.pct >= 0 ? '+' : '\u2212'}
                            {Math.abs(margin.pct).toFixed(2)}%
                          </span>
                        </div>
                      )}
                    </td>
                    <td className={styles.td}>
                      <span
                        className={[
                          styles.statusPill,
                          t.settlement_batch_id
                            ? styles.statusPillSettled
                            : styles.statusPillPending,
                        ].join(' ')}
                      >
                        {t.settlement_batch_id ? 'Settled' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination tail */}
        {!loading && !error && displayedItems.length > 0 && displayedHasMore && (
          <div className={styles.loadMoreWrap}>
            <button
              type="button"
              className={styles.loadMoreBtn}
              onClick={() => fetchPage({ append: true })}
              disabled={loadingMore}
            >
              {loadingMore ? 'Loading...' : 'Load older transactions'}
            </button>
          </div>
        )}

        {!loading && !error && displayedItems.length > 0 && !displayedHasMore && IS_API_MODE && (
          <div className={styles.endOfList}>End of list.</div>
        )}
      </div>
    </AdminShell>
  );
}
