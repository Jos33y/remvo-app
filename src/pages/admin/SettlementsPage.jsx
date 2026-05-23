import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { AdminShell } from '@components/layout/admin/AdminShell';
import { DataTable } from '@components/ui/admin/DataTable';
import { FilterBar } from '@components/ui/admin/FilterBar';
import { Pagination } from '@components/ui/admin/Pagination';
import { StatusBadge } from '@components/ui/admin/StatusBadge';
import { OperatorBadge } from '@components/ui/admin/OperatorBadge';
import { EmptyState } from '@components/ui/admin/EmptyState';
import { IconSettlement } from '@components/ui/icons/IconSettlement';
import { useAdminData } from '@context/AdminContext';
import { adminPath } from '@app/adminRouter';
import {
  fetchSettlements,
  fetchSettlementsPending,
  AuthApiError,
} from '@lib/authClient';
import styles from '@styles/pages/admin/settlements-page.module.css';

const AUTH_MODE = import.meta.env.VITE_REMVO_AUTH_MODE || 'local';
const IS_API_MODE = AUTH_MODE === 'api';

/* ──────────────────────────────────────────────────────────────────
 * SettlementsPage
 *
 * Route: /admin/settlements
 * Register: neutral.
 *
 * Sections
 *   1. Header
 *   2. Pending batch card (if any)
 *   3. FilterBar (search by batch id, optional status tabs)
 *   4. Past batches table
 * ────────────────────────────────────────────────────────────────── */

const PAGE_SIZE_OPTIONS = [25, 50, 100];

function formatUsd(v) {
  if (v == null) return '';
  return '$' + Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatAbsolute(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
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

export function SettlementsPage() {
  const navigate = useNavigate();
  const { settlements, platforms, operators, transactions } = useAdminData();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [density, setDensity] = useState('default');

  // ─── API mode state ──

  const [apiBatches, setApiBatches] = useState([]);
  const [apiPending, setApiPending] = useState(null);
  const [apiCursor, setApiCursor] = useState(null);
  const [apiHasMore, setApiHasMore] = useState(false);
  const [apiLoading, setApiLoading] = useState(IS_API_MODE);
  const [apiError, setApiError] = useState(null);
  const fetchToken = useRef(0);

  useEffect(() => {
    if (!IS_API_MODE) return undefined;
    let cancelled = false;
    const token = ++fetchToken.current;
    setApiLoading(true);
    Promise.all([
      fetchSettlements({ limit: 50 }),
      fetchSettlementsPending().catch(() => null),
    ])
      .then(([list, pending]) => {
        if (cancelled || token !== fetchToken.current) return;
        setApiBatches(list.items);
        setApiCursor(list.next_cursor);
        setApiHasMore(list.next_cursor != null);
        setApiPending(pending);
        setApiError(null);
        setApiLoading(false);
      })
      .catch((err) => {
        if (cancelled || token !== fetchToken.current) return;
        setApiError(
          err instanceof AuthApiError ? err.message : 'Could not load settlements.'
        );
        setApiLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const [loadingMore, setLoadingMore] = useState(false);

  async function loadMoreApi() {
    if (!IS_API_MODE || !apiCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const result = await fetchSettlements({ limit: 50, cursor: apiCursor });
      setApiBatches((prev) => [...prev, ...result.items]);
      setApiCursor(result.next_cursor);
      setApiHasMore(result.next_cursor != null);
    } catch (err) {
      setApiError(
        err instanceof AuthApiError ? err.message : 'Could not load more.'
      );
    } finally {
      setLoadingMore(false);
    }
  }

  // Pending: any confirmed transactions not yet assigned to a batch
  const pendingBatch = useMemo(() => {
    if (IS_API_MODE) {
      if (!apiPending || apiPending.transaction_count === 0) return null;
      return {
        transactionCount: apiPending.transaction_count,
        totalUsdSettled: apiPending.total_usdt,
        platformCount: apiPending.per_platform.length,
      };
    }
    const pendingTxns = transactions.filter(t => t.status === 'confirmed' && !t.settlementBatchId);
    if (pendingTxns.length === 0) return null;
    const totalUsd = pendingTxns.reduce((s, t) => s + (t.amountUsdSettled || 0), 0);
    const platformIds = new Set(pendingTxns.map(t => t.platformId));
    return {
      transactionCount: pendingTxns.length,
      totalUsdSettled: Number(totalUsd.toFixed(2)),
      platformCount: platformIds.size,
    };
  }, [apiPending, transactions]);

  // ─── Past batches (API or mock) ──
  //
  // API rows arrive in snake_case; mock rows in camelCase. Normalise
  // to one shape the renderer can consume regardless of source.

  const pastBatches = useMemo(() => {
    if (IS_API_MODE) {
      // Show ALL batches (including 'sending') in API mode | the
      // "Pending" pseudo-row is the per-transaction aggregate, not
      // a batch row. A real in-flight batch is a real batch.
      return apiBatches.map((b) => ({
        id: b.id,
        triggeredAt: b.triggered_at,
        triggeredBy: b.triggered_by,
        triggeredByEmail: b.triggered_by_email,
        transactionCount: b.transaction_count,
        totalUsdSettled: Number(b.total_usdt),
        // For multi-platform batches we don't surface a single
        // platform | the detail page shows the breakdown. Use
        // the keys of per_platform as a pragmatic display.
        platformId: Object.keys(b.per_platform || {})[0] || '',
        platformCount: b.platform_count,
        status: b.status === 'settled' ? 'completed' : b.status,
        solTxHash: b.sol_tx_hash,
      }));
    }
    return settlements
      .filter(s => s.status !== 'pending')
      .sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime());
  }, [apiBatches, settlements]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return pastBatches;
    return pastBatches.filter(b =>
      b.id.toLowerCase().includes(term) ||
      (b.solTxHash && b.solTxHash.toLowerCase().includes(term))
    );
  }, [pastBatches, search]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedRows = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize]
  );

  function platformName(id) {
    if (!id) return '';
    if (IS_API_MODE) {
      // API rows don't carry a name | fall back to the id, which
      // for our launch ('geas') is human-recognisable. When platform
      // mgmt ships real names per id, swap this for a lookup.
      return id;
    }
    return platforms.find(p => p.id === id)?.displayName || id;
  }

  function operatorFor(row) {
    if (IS_API_MODE) {
      // Synthesise a minimal OperatorBadge prop from the row's
      // own triggered_by + email fields; no separate operators
      // collection in API mode.
      if (!row.triggeredBy) return null;
      return {
        id: row.triggeredBy,
        displayName: row.triggeredByEmail
          ? row.triggeredByEmail.split('@')[0]
          : row.triggeredBy,
        email: row.triggeredByEmail || '',
      };
    }
    return operators.find(o => o.id === row.triggeredBy);
  }

  const columns = useMemo(() => [
    {
      key: 'id',
      header: 'Batch',
      priority: 'primary',
      renderer: (_v, row) => (
        <span className={styles.batchId}>{row.id}</span>
      ),
    },
    {
      key: 'triggeredAt',
      header: 'Triggered',
      priority: 'secondary',
      width: '180px',
      renderer: (_v, row) => (
        <div className={styles.timeCell}>
          <span className={styles.timeRel}>{formatTimeAgo(row.triggeredAt)}</span>
          <span className={styles.timeAbs}>{formatAbsolute(row.triggeredAt)}</span>
        </div>
      ),
    },
    {
      key: 'transactionCount',
      header: 'Transactions',
      priority: 'secondary',
      width: '130px',
      align: 'right',
      renderer: (_v, row) => (
        <span className={styles.countValue}>{row.transactionCount}</span>
      ),
    },
    {
      key: 'totalUsdSettled',
      header: 'Total',
      priority: 'primary',
      width: '140px',
      align: 'right',
      renderer: (_v, row) => (
        <span className={styles.totalValue}>{formatUsd(row.totalUsdSettled)}</span>
      ),
    },
    {
      key: 'platformId',
      header: 'Platform',
      priority: 'secondary',
      width: '140px',
      renderer: (_v, row) => (
        <span className={styles.platformText}>{platformName(row.platformId)}</span>
      ),
    },
    {
      key: 'triggeredBy',
      header: 'By',
      priority: 'secondary',
      width: '180px',
      renderer: (_v, row) => {
        const op = operatorFor(row);
        return op ? <OperatorBadge operator={op} size="sm" /> : null;
      },
    },
    {
      key: 'status',
      header: 'Status',
      priority: 'primary',
      width: '120px',
      renderer: (_v, row) => (
        <StatusBadge status={row.status === 'completed' ? 'settled' : row.status} size="sm" />
      ),
    },
  ], [platforms, operators]);

  function handleRowClick(row) {
    navigate(adminPath(`/settlements/${row.id}`));
  }

  return (
    <AdminShell pageTitle="Settlements" contentRegister="neutral">
      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Settlements</h1>
          <p className={styles.pageSubtitle}>
            Daily batches that pay confirmed USDT out to platform wallets.
          </p>
        </header>

        {/* ═══ Pending batch ═══ */}
        {pendingBatch && (
          <section className={styles.pendingCard} aria-label="Pending settlement">
            <div className={styles.pendingHeader}>
              <span className={styles.pendingLabel}>Pending batch</span>
              <span className={styles.pendingBadge}>Awaiting trigger</span>
            </div>
            <div className={styles.pendingGrid}>
              <div className={styles.pendingStat}>
                <span className={styles.pendingStatLabel}>Total owed</span>
                <span className={styles.pendingStatValue}>{formatUsd(pendingBatch.totalUsdSettled)}</span>
              </div>
              <div className={styles.pendingStat}>
                <span className={styles.pendingStatLabel}>Transactions</span>
                <span className={styles.pendingStatValue}>{pendingBatch.transactionCount}</span>
              </div>
              <div className={styles.pendingStat}>
                <span className={styles.pendingStatLabel}>Platforms</span>
                <span className={styles.pendingStatValue}>{pendingBatch.platformCount}</span>
              </div>
            </div>
            <p className={styles.pendingHelper}>
              Trigger the batch from the Dashboard when the operator is ready to settle.
            </p>
          </section>
        )}

        {/* ═══ API loading state ═══ */}
        {IS_API_MODE && apiLoading && (
          <div className={styles.loadingBlock}>Loading settlements...</div>
        )}

        {/* ═══ API error state ═══ */}
        {IS_API_MODE && apiError && !apiLoading && (
          <EmptyState
            icon={<IconSettlement size={24} />}
            heading="Could not load settlements"
            body={apiError}
          />
        )}

        {/* ═══ Filter bar (mock-mode only; API mode has no client-side
                  filtering yet | search lands on batch id which is
                  cursor-paginated server-side) ═══ */}
        {!IS_API_MODE && (
          <FilterBar
            searchValue={search}
            onSearchChange={(v) => { setSearch(v); setPage(1); }}
            searchPlaceholder="Batch ID or transaction hash"
            filters={[]}
            density={density}
            onDensityChange={setDensity}
          />
        )}

        {/* ═══ Table ═══ */}
        {(!IS_API_MODE || (!apiLoading && !apiError)) && (
          <DataTable
            columns={columns}
            rows={pagedRows}
            getRowKey={(r) => r.id}
            density={density}
            onRowClick={handleRowClick}
            mobileReflow="cards"
            ariaLabel="Past settlement batches"
            emptyState={{
              icon: <IconSettlement size={24} />,
              heading: search ? 'No batches match' : 'No settlement batches yet',
              body: search
                ? 'Try a different search term.'
                : 'Completed settlement batches will appear here after the first trigger.',
            }}
          />
        )}

        {/* ═══ Pagination tail ═══ */}
        {!IS_API_MODE && totalItems > PAGE_SIZE_OPTIONS[0] && (
          <Pagination
            totalItems={totalItems}
            pageSize={pageSize}
            currentPage={safePage}
            onPageChange={setPage}
            onPageSizeChange={(n) => { setPageSize(n); setPage(1); }}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
          />
        )}

        {IS_API_MODE && !apiLoading && !apiError && apiBatches.length > 0 && apiHasMore && (
          <div className={styles.loadMoreWrap}>
            <button
              type="button"
              className={styles.loadMoreBtn}
              onClick={loadMoreApi}
              disabled={loadingMore}
            >
              {loadingMore ? 'Loading...' : 'Load older batches'}
            </button>
          </div>
        )}

        {IS_API_MODE && !apiLoading && !apiError && apiBatches.length > 0 && !apiHasMore && (
          <div className={styles.endOfList}>End of list.</div>
        )}
      </div>
    </AdminShell>
  );
}
