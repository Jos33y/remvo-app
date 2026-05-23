import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { AdminShell } from '@components/layout/admin/AdminShell';
import { FilterBar } from '@components/ui/admin/FilterBar';
import { EmptyState } from '@components/ui/admin/EmptyState';
import { IconLayers } from '@components/ui/icons/IconLayers';
import { adminPath } from '@app/adminRouter';
import {
  fetchSessions,
  countSessions,
  buildSessionsCsvUrl,
  AuthApiError,
} from '@lib/authClient';
import styles from '@styles/pages/admin/sessions-page.module.css';

/* ──────────────────────────────────────────────────────────────────
 * SessionsPage
 *
 * Route: /admin/sessions | register: neutral.
 *
 * Shows EVERY session, regardless of status | the cockpit for
 * "what payment is in what state right now". Operator scans for:
 *   - Pending payments approaching expiry (deposit window timing)
 *   - Failed sessions (need investigation)
 *   - country_not_active rows (demand from blocked geographies)
 *
 * Filters (URL-backed except search):
 *   - Status              | pending | confirmed | expired | failed | country_not_active
 *   - Date range          | preset (today, yesterday, 7d, 30d, custom) on created_at
 *   - Search              | ILIKE across (id, public_reference,
 *                           platform_user_id, monnify_reference)
 *
 * Sessions differ from transactions in two important ways:
 *   1. Money fields can be 0 (country_not_active rows) | the table
 *      shows USD only for active rows; otherwise displays a status pill
 *   2. confirmed_at can be null | use created_at as the time anchor
 *
 * Pagination + count fired in parallel; fetchToken guards against
 * stale responses on rapid filter changes.
 * ────────────────────────────────────────────────────────────────── */

const PAGE_SIZE = 50;
const SEARCH_DEBOUNCE_MS = 300;

const STATUS_OPTIONS = [
  { value: '',                   label: 'All sessions' },
  { value: 'pending',            label: 'Pending' },
  { value: 'confirmed',          label: 'Confirmed' },
  { value: 'expired',            label: 'Expired' },
  { value: 'failed',             label: 'Failed' },
  { value: 'country_not_active', label: 'Country blocked' },
];

const DATE_PRESETS = [
  { value: '',          label: 'All time' },
  { value: 'today',     label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7d',        label: 'Last 7 days' },
  { value: '30d',       label: 'Last 30 days' },
  { value: 'custom',    label: 'Custom range' },
];

const STATUS_LABEL_MAP = Object.fromEntries(
  STATUS_OPTIONS.filter((o) => o.value).map((o) => [o.value, o.label])
);

// Map status -> visual treatment. Country-blocked sessions get a
// neutral chip because they are not a fault state, just a demand
// signal from a country we haven't activated yet.
const STATUS_PILL_CLASS = {
  pending: 'statusPillPending',
  confirmed: 'statusPillConfirmed',
  expired: 'statusPillExpired',
  failed: 'statusPillFailed',
  country_not_active: 'statusPillBlocked',
};

const STATUS_PILL_LABEL = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  expired: 'Expired',
  failed: 'Failed',
  country_not_active: 'Blocked',
};

// ─── Date preset resolver | matches transactions pattern ─────────

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
  if (!Number.isFinite(n)) return '₦0';
  return '₦' + Math.trunc(n).toLocaleString('en-US');
}

function formatDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-GB', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Page ────────────────────────────────────────────────────────

export function SessionsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // ─── Filter state | URL-backed except search ──

  const platformFilter = searchParams.get('platform_id') || '';
  const statusFilter = searchParams.get('status') || '';
  const countryFilter = searchParams.get('country_code') || '';
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
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const fetchToken = useRef(0);

  const apiFilters = useMemo(
    () => ({
      status: statusFilter || undefined,
      platformId: platformFilter || undefined,
      countryCode: countryFilter || undefined,
      fromDate: resolvedDate.fromDate,
      toDate: resolvedDate.toDate,
      search: debouncedSearch || undefined,
    }),
    [
      statusFilter,
      platformFilter,
      countryFilter,
      resolvedDate.fromDate,
      resolvedDate.toDate,
      debouncedSearch,
    ]
  );

  const fetchPage = useCallback(
    async ({ append = false } = {}) => {
      const token = ++fetchToken.current;
      if (append) setLoadingMore(true);
      else setLoading(true);
      try {
        const [pageResult, countResult] = await Promise.all([
          fetchSessions({
            limit: PAGE_SIZE,
            ...apiFilters,
            cursor: append ? cursor : undefined,
          }),
          append
            ? Promise.resolve({ total: total ?? 0 })
            : countSessions(apiFilters).catch(() => ({ total: null })),
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
            : 'Could not load sessions.'
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
    fetchPage({ append: false });
  }, [fetchPage]);

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

  function handleStatusChange(e) { updateParam('status', e.target.value); }
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
    if (statusFilter) {
      pills.push({
        key: 'status',
        label: `Status: ${STATUS_LABEL_MAP[statusFilter] || statusFilter}`,
      });
    }
    if (platformFilter) {
      pills.push({ key: 'platform_id', label: `Platform: ${platformFilter}` });
    }
    if (countryFilter) {
      pills.push({ key: 'country_code', label: `Country: ${countryFilter}` });
    }
    if (datePreset) {
      const presetLabel = DATE_PRESETS.find((p) => p.value === datePreset)?.label || datePreset;
      pills.push({ key: 'date', label: `Date: ${presetLabel}` });
    }
    return pills;
  }, [statusFilter, platformFilter, countryFilter, datePreset]);

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
    window.location.href = buildSessionsCsvUrl(apiFilters);
  }

  function handleRowClick(row) {
    navigate(adminPath(`/sessions/${encodeURIComponent(row.id)}`));
  }

  // ─── Render ──

  return (
    <AdminShell pageTitle="Sessions" contentRegister="neutral">
      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Sessions</h1>
          <p className={styles.pageSubtitle}>
            Every checkout session in any state. Filter by status or date, search by reference, session id, platform user id, or Monnify reference.
          </p>
        </header>

        {/* Filter strip */}
        <div className={styles.filterStrip}>
          <div className={styles.filterField}>
            <label className={styles.filterLabel} htmlFor="filter-status">Status</label>
            <select
              id="filter-status"
              className={styles.filterSelect}
              value={statusFilter}
              onChange={handleStatusChange}
            >
              {STATUS_OPTIONS.map((opt) => (
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
          searchPlaceholder="Reference, session id, user id, or Monnify ref"
          autoFocusSearch
          filters={activeFilters}
          onFilterRemove={handleFilterRemove}
          onClearAll={handleClearAll}
          onExport={items.length > 0 ? handleExport : undefined}
          /* DENSITY_FILTERBAR */
          density={density}
          onDensityChange={setDensity}
        />

        {!loading && !error && items.length > 0 && (
          <div className={styles.metaRow}>
            <span>
              Showing {items.length}
              {typeof total === 'number' ? ` of ${total.toLocaleString()}` : ''}
            </span>
          </div>
        )}

        {loading && (
          <div className={styles.loadingBlock}>Loading sessions...</div>
        )}

        {error && (
          <EmptyState
            icon={<IconLayers size={24} />}
            heading="Could not load sessions"
            body={error}
          />
        )}

        {!loading && !error && items.length === 0 && (
          <EmptyState
            icon={<IconLayers size={24} />}
            heading={
              activeFilters.length > 0 || search
                ? 'No sessions match'
                : 'No sessions yet'
            }
            body={
              activeFilters.length > 0 || search
                ? 'Try clearing filters or adjusting your search.'
                : 'Sessions will appear here when platforms initialise checkouts.'
            }
          />
        )}

        {!loading && !error && items.length > 0 && (
          <div className={styles.tableWrap} data-density={density}/* DENSITY_TABLEWRAP */>
            <table className={styles.table} aria-label="Sessions">
              <thead className={styles.thead}>
                <tr>
                  <th scope="col" className={styles.th} style={{ width: '152px' }}>Created</th>
                  <th scope="col" className={styles.th}>Reference</th>
                  <th scope="col" className={styles.th} style={{ width: '108px' }}>Platform</th>
                  <th scope="col" className={`${styles.th} ${styles.thRight}`} style={{ width: '108px' }}>USD</th>
                  <th scope="col" className={`${styles.th} ${styles.thRight}`} style={{ width: '120px' }}>Naira</th>
                  <th scope="col" className={`${styles.th} ${styles.thRight}`} style={{ width: '88px' }}>Rate</th>
                  <th scope="col" className={styles.th} style={{ width: '64px' }}>Country</th>
                  <th scope="col" className={styles.th} style={{ width: '128px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((s) => {
                  const isInactive = s.status === 'country_not_active';
                  const pillClass = STATUS_PILL_CLASS[s.status] || 'statusPillExpired';
                  const pillLabel = STATUS_PILL_LABEL[s.status] || s.status;
                  return (
                    <tr
                      key={s.id}
                      className={styles.row}
                      tabIndex={0}
                      onClick={() => handleRowClick(s)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleRowClick(s);
                        }
                      }}
                    >
                      <td className={styles.td}>
                        <span className={styles.timeMono}>
                          {formatDateTime(s.created_at)}
                        </span>
                      </td>
                      <td className={styles.td}>
                        <div className={styles.referenceBlock}>
                          <span className={styles.reference}>{s.public_reference}</span>
                          <span className={styles.userMeta}>
                            {s.platform_user_id}
                          </span>
                        </div>
                      </td>
                      <td className={styles.td}>
                        <span className={styles.platformChip}>{s.platform_id}</span>
                      </td>
                      <td className={`${styles.td} ${styles.tdRight}`}>
                        {isInactive ? (
                          <span className={styles.dashCell}>—</span>
                        ) : (
                          <span className={styles.mono}>
                            {formatUsd(s.amount_usd_credited)}
                          </span>
                        )}
                      </td>
                      <td className={`${styles.td} ${styles.tdRight}`}>
                        {isInactive ? (
                          <span className={styles.dashCell}>—</span>
                        ) : (
                          <span className={styles.mono}>
                            {formatNaira(s.amount_ngn)}
                          </span>
                        )}
                      </td>
                      <td className={`${styles.td} ${styles.tdRight}`}>
                        {isInactive ? (
                          <span className={styles.dashCell}>—</span>
                        ) : (
                          <span className={styles.monoMuted}>
                            {Number(s.display_rate).toLocaleString('en-US')}
                          </span>
                        )}
                      </td>
                      <td className={styles.td}>
                        <span className={styles.countryCode}>{s.country_code}</span>
                      </td>
                      <td className={styles.td}>
                        <span
                          className={[styles.statusPill, styles[pillClass]].join(' ')}
                        >
                          {pillLabel}
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
        {!loading && !error && items.length > 0 && hasMore && (
          <div className={styles.loadMoreWrap}>
            <button
              type="button"
              className={styles.loadMoreBtn}
              onClick={() => fetchPage({ append: true })}
              disabled={loadingMore}
            >
              {loadingMore ? 'Loading...' : 'Load older sessions'}
            </button>
          </div>
        )}

        {!loading && !error && items.length > 0 && !hasMore && (
          <div className={styles.endOfList}>End of list.</div>
        )}
      </div>
    </AdminShell>
  );
}
