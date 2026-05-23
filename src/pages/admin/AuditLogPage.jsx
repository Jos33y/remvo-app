import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { AdminShell } from '@components/layout/admin/AdminShell';
import { AuditLogRow } from '@components/ui/admin/AuditLogRow';
import { FilterBar } from '@components/ui/admin/FilterBar';
import { EmptyState } from '@components/ui/admin/EmptyState';
import { IconAudit } from '@components/ui/icons/IconAudit';
/* AUDIT_PAGINATION_IMPORT */
import { PaginationControl } from '@components/ui/admin/PaginationControl';
import { useAdminData } from '@context/AdminContext';
import { adminPath } from '@app/adminRouter';
import {
  listAuditLog,
  countAuditLog,
  buildAuditLogCsvUrl,
  AuthApiError,
} from '@lib/authClient';
import styles from '@styles/pages/admin/audit-log-page.module.css';

/* ──────────────────────────────────────────────────────────────────
 * AuditLogPage
 *
 * Route: /admin/audit | register: neutral.
 *
 * Filter UI:
 *   - Action selector  | dropdown of every action category we emit
 *   - Actor type       | operator | platform | system | merchant
 *   - Date range       | preset (today / yesterday / 7d / 30d) + custom
 *   - Search box       | free text across action / email / entity_id
 *   - Pills            | every active filter, removable individually
 *   - Export CSV       | one-click download of the filtered set
 *
 * URL state:
 *   - All filters round-trip through query params so deep links work
 *     (e.g. /admin/audit?action=auth.login.failed&actor_type=operator)
 *   - Search does NOT round-trip (would flood history every keystroke)
 *
 * Pagination:
 *   - Cursor on (occurred_at, id), 50 rows per page
 *   - "Load older entries" button + "End of log" terminal state
 *   - "Showing 50 of 247" header so depth is visible before paging
 *
 * Auth-mode awareness:
 *   - VITE_REMVO_AUTH_MODE=api   | live API
 *   - any other value             | mock | client-side filter on
 *                                   useAdminData().auditLog
 *
 * Related docs:
 *   src/modules/audit/adminRoutes.js (list / count / csv endpoints)
 *   src/lib/authClient.js
 * ────────────────────────────────────────────────────────────────── */

const AUTH_MODE = import.meta.env.VITE_REMVO_AUTH_MODE || 'local';
const IS_API_MODE = AUTH_MODE === 'api';
/* AUDIT_PAGINATION_CONSTS */
const PAGE_SIZE_OPTIONS = [25, 50, 100];
const DEFAULT_PAGE_SIZE = 50;
const SEARCH_DEBOUNCE_MS = 300;

const ACTION_OPTIONS = [
  { value: '', label: 'All actions' },
  // Auth
  { value: 'auth.login.password', label: 'Sign in (password)' },
  { value: 'auth.login.passkey',  label: 'Sign in (passkey)' },
  { value: 'auth.login.failed',   label: 'Failed sign-in' },
  { value: 'auth.logout',         label: 'Sign out' },
  { value: 'auth.password_set',   label: 'Password set' },
  { value: 'auth.totp_enrolled',  label: 'Authenticator linked' },
  { value: 'auth.passkey_enrolled', label: 'Passkey enrolled' },
  { value: 'auth.passkey_revoked',  label: 'Passkey revoked' },
  // Operator management
  { value: 'operator.invite',                label: 'Operator invited' },
  { value: 'operator.invitation_accepted',   label: 'Invitation accepted' },
  { value: 'operator.invitation_revoked',    label: 'Invitation revoked' },
  { value: 'operator.revoke',                label: 'Operator revoked' },
  // Domain
  { value: 'rate.set_manual',                label: 'Manual rate set' },
  { value: 'corridor.flip_merchant',         label: 'Merchant flipped' },
  { value: 'corridor.pause',                 label: 'Corridor paused' },
  { value: 'corridor.unpause',               label: 'Corridor unpaused' },
  { value: 'platform.update_country_state',  label: 'Country state changed' },
  { value: 'settlement.trigger_batch',       label: 'Settlement triggered' },
  { value: 'session.init',                   label: 'Session created' },
  { value: 'session.confirm',                label: 'Session confirmed' },
  { value: 'session.amount_mismatch',        label: 'Amount mismatch' },
  { value: 'session.country_not_active',     label: 'Blocked country attempt' },
  { value: 'transaction.created',            label: 'Transaction created' },
  { value: 'webhook.bad_signature',          label: 'Webhook bad signature' },
  { value: 'webhook_delivery.replay',        label: 'Webhook replayed' },
];

const ACTOR_TYPE_OPTIONS = [
  { value: '',          label: 'All actors' },
  { value: 'operator',  label: 'Operators' },
  { value: 'platform',  label: 'Platforms' },
  { value: 'system',    label: 'System' },
  { value: 'merchant',  label: 'Merchants' },
];

// Date presets | the value is a kebab-cased key the URL stores; we
// translate to from_date/to_date at request time.
const DATE_PRESETS = [
  { value: '',          label: 'All time' },
  { value: 'today',     label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7d',        label: 'Last 7 days' },
  { value: '30d',       label: 'Last 30 days' },
  { value: 'custom',    label: 'Custom range' },
];

const ACTION_LABEL_MAP = Object.fromEntries(
  ACTION_OPTIONS.filter((o) => o.value).map((o) => [o.value, o.label])
);
const ACTOR_TYPE_LABEL_MAP = Object.fromEntries(
  ACTOR_TYPE_OPTIONS.filter((o) => o.value).map((o) => [o.value, o.label])
);

/**
 * Resolve a date preset key to ISO from/to strings. Returns
 * {fromDate, toDate} (each possibly undefined). 'custom' returns
 * empty | the consumer reads from from_date / to_date URL params.
 */
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

/**
 * Map an API audit row to the shape AuditLogRow expects. Bridge
 * between the snake_case API and the camelCase row primitive.
 */
function mapApiRow(r) {
  const operatorEmail =
    r.actor_email ||
    r.actor_display_name ||
    (r.actor_type && r.actor_type !== 'operator' ? `${r.actor_type}@remvo.system` : null);

  const metadata = {
    ...(r.metadata || {}),
    ...(r.request_id ? { requestId: r.request_id } : {}),
  };

  return {
    id: r.id,
    occurredAt: r.occurred_at,
    action: r.action,
    operatorEmail,
    operatorId: r.actor_id,
    entityType: r.entity_type,
    entityId: r.entity_id,
    before: r.before,
    after: r.after,
    metadata: Object.keys(metadata).length > 0 ? metadata : null,
  };
}

export function AuditLogPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const mockData = useAdminData();

  // ─── Filter state | URL-backed where it makes sense ───────────
  const actionFilter = searchParams.get('action') || '';
  const actorTypeFilter = searchParams.get('actor_type') || '';
  const actorIdFilter = searchParams.get('actor_id') || '';
  const datePreset = searchParams.get('date') || '';
  const customFrom = searchParams.get('from_date') || '';
  const customTo = searchParams.get('to_date') || '';

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    if (search === debouncedSearch) return undefined;
    const t = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [search, debouncedSearch]);

  // Resolved date filter | feeds into the API call.
  const resolvedDate = useMemo(
    () => resolveDatePreset(datePreset, customFrom, customTo),
    [datePreset, customFrom, customTo]
  );

  // ─── Data state ───────────────────────────────────────────────
  /* AUDIT_PAGINATION_STATE
   * pageStartCursor : the `before` cursor used to fetch the current
   *                   page. null = page 1 (no `before` sent).
   * pageHistory     : stack of pageStartCursors for prior pages.
   *                   Length = current page index (page 1 -> []).
   * hasNextPage     : whether the latest fetch returned a next_cursor.
   * pageSize        : rows per page; resets pagination when changed. */
  const [entries, setEntries] = useState([]);
  const [pageStartCursor, setPageStartCursor] = useState(null);
  const [pageHistory, setPageHistory] = useState([]);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(null);
  const [loading, setLoading] = useState(IS_API_MODE);
  const [error, setError] = useState(null);
  const [expandedIds, setExpandedIds] = useState(() => new Set());

  const fetchToken = useRef(0);

  // Filters we send to the API (and the URL).
  const apiFilters = useMemo(
    () => ({
      action: actionFilter || undefined,
      actorType: actorTypeFilter || undefined,
      actorId: actorIdFilter || undefined,
      fromDate: resolvedDate.fromDate,
      toDate: resolvedDate.toDate,
      search: debouncedSearch || undefined,
    }),
    [actionFilter, actorTypeFilter, actorIdFilter, resolvedDate.fromDate, resolvedDate.toDate, debouncedSearch]
  );

  /* AUDIT_PAGINATION_FETCH
   * One fetch path. Always REPLACES entries (no append). The
   * `before` cursor is taken from argument so the caller controls
   * position. `refreshCount` skips the count endpoint on Prev/Next
   * (filters unchanged) | halves nav latency. */
  const fetchPage = useCallback(
    async ({ before = null, refreshCount = true } = {}) => {
      if (!IS_API_MODE) return;
      const token = ++fetchToken.current;
      setLoading(true);
      try {
        const [pageResult, countResult] = await Promise.all([
          listAuditLog({
            limit: pageSize,
            ...apiFilters,
            before: before ?? undefined,
          }),
          refreshCount
            ? countAuditLog(apiFilters).catch(() => ({ total: null }))
            : Promise.resolve({ total: total ?? null }),
        ]);

        if (token !== fetchToken.current) return;

        const mapped = pageResult.items.map(mapApiRow);
        setEntries(mapped);
        setNextCursor(pageResult.next_cursor);
        setHasNextPage(pageResult.next_cursor != null);
        if (refreshCount) setTotal(countResult.total);
        setError(null);
      } catch (err) {
        if (token !== fetchToken.current) return;
        setError(
          err instanceof AuthApiError ? err.message : 'Could not load the audit log.'
        );
      } finally {
        if (token === fetchToken.current) {
          setLoading(false);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [apiFilters, pageSize]
  );

  // Reset to page 1 whenever filters or page size change.
  useEffect(() => {
    if (!IS_API_MODE) return;
    setPageStartCursor(null);
    setPageHistory([]);
    fetchPage({ before: null, refreshCount: true });
  }, [fetchPage]);

  // â”€â”€â”€ Pagination handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function goNextPage() {
    if (!hasNextPage || !nextCursor) return;
    setPageHistory((h) => [...h, pageStartCursor]);
    setPageStartCursor(nextCursor);
    fetchPage({ before: nextCursor, refreshCount: false });
  }

  function goPrevPage() {
    if (pageHistory.length === 0) return;
    const previous = pageHistory[pageHistory.length - 1];
    setPageHistory((h) => h.slice(0, -1));
    setPageStartCursor(previous);
    fetchPage({ before: previous, refreshCount: false });
  }

  function jumpToFirstPage() {
    if (pageHistory.length === 0) return;
    setPageHistory([]);
    setPageStartCursor(null);
    fetchPage({ before: null, refreshCount: false });
  }

  function changePageSize(nextSize) {
    if (nextSize === pageSize) return;
    setPageSize(nextSize);
    // useEffect on [fetchPage] resets to page 1 because fetchPage
    // identity changes when pageSize does (in deps).
  }

  // ─── Mock fallback ────────────────────────────────────────────
  const mockEntries = useMemo(() => {
    if (IS_API_MODE) return [];
    const term = debouncedSearch.trim().toLowerCase();
    return mockData.auditLog.filter((entry) => {
      if (actionFilter && entry.action !== actionFilter) return false;
      if (!term) return true;
      return (
        entry.action.toLowerCase().includes(term) ||
        (entry.operatorEmail && entry.operatorEmail.toLowerCase().includes(term)) ||
        (entry.entityId && String(entry.entityId).toLowerCase().includes(term))
      );
    });
  }, [mockData.auditLog, actionFilter, debouncedSearch]);

  const displayedEntries = IS_API_MODE ? entries : mockEntries;
  const displayedTotal = IS_API_MODE ? total : mockEntries.length;
  /* AUDIT_PAGINATION_DERIVED */
  const displayedPage = IS_API_MODE ? pageHistory.length + 1 : 1;
  const displayedHasNext = IS_API_MODE ? hasNextPage : false;
  const displayedHasPrev = IS_API_MODE ? pageHistory.length > 0 : false;

  // ─── Filter setters ──────────────────────────────────────────

  function updateParam(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    // Custom date preset implies custom from/to; clearing the preset
    // also clears the custom dates so we don't leave stale params.
    if (key === 'date' && value !== 'custom') {
      next.delete('from_date');
      next.delete('to_date');
    }
    setSearchParams(next);
  }

  function handleActionChange(e) { updateParam('action', e.target.value); }
  function handleActorTypeChange(e) { updateParam('actor_type', e.target.value); }
  function handleDatePresetChange(e) { updateParam('date', e.target.value); }
  function handleCustomFromChange(e) { updateParam('from_date', e.target.value ? new Date(e.target.value).toISOString() : ''); }
  function handleCustomToChange(e) { updateParam('to_date', e.target.value ? new Date(e.target.value).toISOString() : ''); }

  // ─── Filter pills ────────────────────────────────────────────

  const activeFilters = useMemo(() => {
    const pills = [];
    if (actionFilter) {
      pills.push({
        key: 'action',
        label: `Action: ${ACTION_LABEL_MAP[actionFilter] || actionFilter}`,
      });
    }
    if (actorTypeFilter) {
      pills.push({
        key: 'actor_type',
        label: `Actor: ${ACTOR_TYPE_LABEL_MAP[actorTypeFilter] || actorTypeFilter}`,
      });
    }
    if (actorIdFilter) {
      pills.push({
        key: 'actor_id',
        label: `Operator id: ${actorIdFilter}`,
      });
    }
    if (datePreset) {
      const presetLabel = DATE_PRESETS.find((p) => p.value === datePreset)?.label || datePreset;
      pills.push({ key: 'date', label: `Date: ${presetLabel}` });
    }
    return pills;
  }, [actionFilter, actorTypeFilter, actorIdFilter, datePreset]);

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
    const url = buildAuditLogCsvUrl(apiFilters);
    // Direct navigation triggers the browser's native Save dialog
    // because the server sets Content-Disposition: attachment.
    // The session cookie rides along automatically since the URL is
    // same-site (api.remvo.app from admin.remvo.app, both eTLD+1).
    window.location.href = url;
  }

  // ─── Row interactions ───────────────────────────────────────

  function toggleExpand(entryId) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(entryId)) next.delete(entryId);
      else next.add(entryId);
      return next;
    });
  }

  function handleEntityClick(type, id) {
    switch (type) {
      case 'transaction':
        navigate(adminPath(`/transactions/${encodeURIComponent(id)}`));
        break;
      case 'settlement':
        navigate(adminPath(`/settlements/${id}`));
        break;
      case 'platform':
        navigate(adminPath(`/platforms/${id}`));
        break;
      case 'corridor':
        navigate(adminPath(`/corridors/${id}`));
        break;
      default:
        break;
    }
  }

  function handleOperatorClick(operatorId) {
    if (!operatorId) return;
    updateParam('actor_id', operatorId);
  }

  // ─── Render ─────────────────────────────────────────────────

  return (
    <AdminShell pageTitle="Audit log" contentRegister="neutral">
      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Audit log</h1>
          <p className={styles.pageSubtitle}>
            Every operator action, in order. Click any row to see before and after state.
          </p>
        </header>

        {/* Filter strip | dropdowns above the search bar. */}
        <div className={styles.filterStrip}>
          <div className={styles.filterField}>
            <label className={styles.filterLabel} htmlFor="filter-action">Action</label>
            <select
              id="filter-action"
              className={styles.filterSelect}
              value={actionFilter}
              onChange={handleActionChange}
            >
              {ACTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className={styles.filterField}>
            <label className={styles.filterLabel} htmlFor="filter-actor-type">Actor</label>
            <select
              id="filter-actor-type"
              className={styles.filterSelect}
              value={actorTypeFilter}
              onChange={handleActorTypeChange}
            >
              {ACTOR_TYPE_OPTIONS.map((opt) => (
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
          searchPlaceholder="Operator, action, entity, or ID"
          autoFocusSearch
          filters={activeFilters}
          onFilterRemove={handleFilterRemove}
          onClearAll={handleClearAll}
          onExport={IS_API_MODE && displayedTotal > 0 ? handleExport : undefined}
        />

        {/* Showing N of M | terse, only render when total is known. */}
        {!loading && !error && displayedEntries.length > 0 && (
          <div className={styles.metaRow}>
            <span>
              Showing {displayedEntries.length}
              {typeof displayedTotal === 'number' ? ` of ${displayedTotal.toLocaleString()}` : ''}
            </span>
          </div>
        )}

        {loading && (
          <div className={styles.loadingBlock}>Loading audit log...</div>
        )}

        {error && (
          <EmptyState
            icon={<IconAudit size={24} />}
            heading="Could not load the audit log"
            body={error}
          />
        )}

        {!loading && !error && displayedEntries.length === 0 && (
          <EmptyState
            icon={<IconAudit size={24} />}
            heading={activeFilters.length > 0 || search ? 'No entries match' : 'No audit entries yet'}
            body={
              activeFilters.length > 0 || search
                ? 'Try clearing filters or adjusting your search.'
                : 'Operator actions will appear here as they happen.'
            }
          />
        )}

        {!loading && !error && displayedEntries.length > 0 && (
          <div className={styles.tableWrap}>
            <table className={styles.table} aria-label="Audit log entries">
              <thead className={styles.thead}>
                <tr>
                  <th scope="col" className={styles.th} style={{ width: '140px' }}>When</th>
                  <th scope="col" className={styles.th}>Action</th>
                  <th scope="col" className={styles.th} style={{ width: '48px' }}></th>
                </tr>
              </thead>
              <tbody>
                {displayedEntries.map((entry) => (
                  <AuditLogRow
                    key={entry.id}
                    entry={entry}
                    expanded={expandedIds.has(entry.id)}
                    onToggleExpand={() => toggleExpand(entry.id)}
                    onEntityClick={handleEntityClick}
                    onOperatorClick={handleOperatorClick}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* AUDIT_PAGINATION_RENDER
         * Page-based navigation. Renders only in API mode where the
         * cursor is real; mock mode shows the entire filtered list. */}
        {IS_API_MODE && !loading && !error && displayedEntries.length > 0 && (
          <PaginationControl
            page={displayedPage}
            pageSize={pageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            onPageSizeChange={changePageSize}
            onPrev={displayedHasPrev ? goPrevPage : undefined}
            onNext={displayedHasNext ? goNextPage : undefined}
            onJumpToFirst={jumpToFirstPage}
            itemsOnPage={displayedEntries.length}
            total={displayedTotal}
            loading={loading}
          />
        )}
      </div>
    </AdminShell>
  );
}
