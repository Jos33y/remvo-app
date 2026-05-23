import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { AdminShell } from '@components/layout/admin/AdminShell';
import { DataTable } from '@components/ui/admin/DataTable';
import { FilterBar } from '@components/ui/admin/FilterBar';
import { StatusBadge } from '@components/ui/admin/StatusBadge';
import { EmptyState } from '@components/ui/admin/EmptyState';
import { IconBuilding } from '@components/ui/icons/IconBuilding';
import { useAdminData } from '@context/AdminContext';
import { adminPath } from '@app/adminRouter';
import { listPlatforms, AuthApiError } from '@lib/authClient';
import styles from '@styles/pages/admin/platforms-page.module.css';

/* ──────────────────────────────────────────────────────────────────
 * PlatformsPage
 *
 * Route: /admin/platforms
 * Register: neutral.
 *
 * Dual-mode:
 *   mock | reads useAdminData().platforms
 *   api  | fetches GET /v1/admin/platforms on mount + on window focus
 *
 * The API row shape is snake_case + nested country_config; the mock
 * shape is camelCase with `countries` as the JSONB equivalent. We
 * adapt API rows into the mock shape with toViewModel() so the table
 * cells render the same regardless of mode.
 *
 * Filters:
 *   - status (active / paused / disabled / all)
 *   - search (id, name)
 *
 * Polling: none. Platforms config is low-velocity; the operator can
 * manually refresh via the page's refresh affordance (added in the
 * filter bar). On window focus (tab switch back), we re-fetch.
 * ────────────────────────────────────────────────────────────────── */

const AUTH_MODE = import.meta.env.VITE_REMVO_AUTH_MODE || 'local';
const IS_API_MODE = AUTH_MODE === 'api';

const STATUS_OPTIONS = [
  { value: 'all',      label: 'All' },
  { value: 'active',   label: 'Active' },
  { value: 'paused',   label: 'Paused' },
  { value: 'disabled', label: 'Disabled' },
];

// ─── Formatters ──────────────────────────────────────────────────

function formatAbsolute(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatTimeAgo(iso) {
  if (!iso) return '';
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ─── Adapt API row to view model ─────────────────────────────────

/**
 * The API returns:
 *   { id, name, status, platform_fee_pct, settlement_wallet,
 *     settlement_mode, country_config: { NG: {...}, GH: {...} },
 *     created_at, updated_at }
 *
 * The mock + table cells expect:
 *   { id, displayName, status, skimPercent, settlementWalletSolana,
 *     settlementMode, countries: { NG: {...}, ... },
 *     createdAt, updatedAt }
 */
function toViewModel(row) {
  return {
    id: row.id,
    displayName: row.name,
    status: row.status,
    skimPercent: Number(row.platform_fee_pct),
    settlementWalletSolana: row.settlement_wallet,
    settlementMode: row.settlement_mode,
    countries: row.country_config || {},
    apiKeyRef: '(stored as hash)',
    webhookUrl: row.webhook_url,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : row.created_at,
    updatedAt:
      row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : row.updated_at,
  };
}

// ─── Page ────────────────────────────────────────────────────────

export function PlatformsPage() {
  const navigate = useNavigate();
  const mock = useAdminData();

  // API-mode state
  const [apiPlatforms, setApiPlatforms] = useState(null);
  const [apiLoading, setApiLoading] = useState(IS_API_MODE);
  const [apiError, setApiError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  /* DENSITY_STATE */
  const [density, setDensity] = useState('default');

  // Source platforms (mock or api)
  const platforms = useMemo(() => {
    if (!IS_API_MODE) return mock.platforms;
    return apiPlatforms ?? [];
  }, [mock.platforms, apiPlatforms]);

  // ─── API loader ────────────────────────────────────────────────

  const loadPlatforms = useCallback(async () => {
    if (!IS_API_MODE) return;
    setApiLoading(true);
    setApiError(null);
    try {
      const result = await listPlatforms();
      setApiPlatforms((result.items || []).map(toViewModel));
    } catch (err) {
      if (err instanceof AuthApiError && err.status === 401) {
        navigate(adminPath('/login'));
        return;
      }
      setApiError(err?.message || 'Could not load platforms.');
    } finally {
      setApiLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadPlatforms();
  }, [loadPlatforms]);

  // Refresh on window focus | low-cost, keeps the list current after
  // an admin edits a platform in another tab.
  useEffect(() => {
    if (!IS_API_MODE) return undefined;
    function onFocus() {
      loadPlatforms();
    }
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [loadPlatforms]);

  // ─── Filter ────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return platforms.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (!term) return true;
      return (
        p.id.toLowerCase().includes(term) ||
        (p.displayName || '').toLowerCase().includes(term)
      );
    });
  }, [platforms, search, statusFilter]);

  // ─── Columns ───────────────────────────────────────────────────

  const columns = useMemo(
    () => [
      {
        key: 'displayName',
        header: 'Platform',
        priority: 'primary',
        renderer: (_v, row) => (
          <div className={styles.nameCell}>
            <span className={styles.nameText}>{row.displayName}</span>
            <span className={styles.nameId}>{row.id}</span>
          </div>
        ),
      },
      {
        key: 'countries',
        header: 'Countries',
        priority: 'secondary',
        width: '140px',
        renderer: (_v, row) => {
          const all = Object.values(row.countries || {});
          const active = all.filter((c) => c.status === 'active').length;
          const total = all.length;
          return (
            <span className={styles.countryCount}>
              <span className={styles.countryActive}>{active}</span>
              <span className={styles.countrySlash}>/</span>
              <span className={styles.countryTotal}>{total}</span>
            </span>
          );
        },
      },
      {
        key: 'settlementMode',
        header: 'Settlement',
        priority: 'tertiary',
        width: '140px',
        renderer: (v) => (
          <span className={styles.settlementText}>
            {v === 'batch' ? 'Daily batch' : 'Per transaction'}
          </span>
        ),
      },
      {
        key: 'skimPercent',
        header: 'Fee',
        priority: 'tertiary',
        width: '80px',
        align: 'right',
        renderer: (v) => (
          <span className={styles.skimValue}>
            {Number(v ?? 0).toFixed(2)}%
          </span>
        ),
      },
      {
        key: 'updatedAt',
        header: 'Last updated',
        priority: 'tertiary',
        width: '160px',
        renderer: (v) => (
          <div className={styles.timeCell}>
            <span className={styles.timeAbs}>{formatAbsolute(v)}</span>
            <span className={styles.timeRel}>{formatTimeAgo(v)}</span>
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        priority: 'primary',
        width: '120px',
        renderer: (v) => <StatusBadge status={v || 'active'} size="sm" />,
      },
    ],
    []
  );

  // ─── Render ────────────────────────────────────────────────────

  const showEmpty = !apiLoading && filtered.length === 0;

  return (
    <AdminShell pageTitle="Platforms" contentRegister="neutral">
      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <div className={styles.pageHeaderMain}>
            <h1 className={styles.pageTitle}>Platforms</h1>
            <p className={styles.pageSubtitle}>
              Partners that route deposits through Remvo.
            </p>
          </div>
        </header>

        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by name or id"
          filters={[
            {
              id: 'status',
              label: 'Status',
              value: statusFilter,
              options: STATUS_OPTIONS,
              onChange: setStatusFilter,
            },
          ]}
          /* DENSITY_FILTERBAR */
          density={density}
          onDensityChange={setDensity}
        />

        {apiError && (
          <div className={styles.errorBanner} role="alert">
            {apiError}
          </div>
        )}

        {showEmpty ? (
          <EmptyState
            icon={<IconBuilding size={24} />}
            heading={
              search || statusFilter !== 'all'
                ? 'No matches'
                : 'No platforms yet'
            }
            body={
              search || statusFilter !== 'all'
                ? 'Adjust the filters or clear the search.'
                : 'Platforms are seeded by bootSeeds.js on deploy.'
            }
          />
        ) : (
          <DataTable
            columns={columns}
            rows={filtered}
            getRowKey={(row) => row.id}
            onRowClick={(row) => navigate(adminPath(`/platforms/${row.id}`))}
            isLoading={apiLoading && filtered.length === 0}
            /* DENSITY_DATATABLE */
            density={density}
          />
        )}
      </div>
    </AdminShell>
  );
}
