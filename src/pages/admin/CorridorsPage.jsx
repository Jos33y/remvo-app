import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { AdminShell } from '@components/layout/admin/AdminShell';
import { DataTable } from '@components/ui/admin/DataTable';
import { FilterBar } from '@components/ui/admin/FilterBar';
import { StatusBadge } from '@components/ui/admin/StatusBadge';
import { MerchantBadge } from '@components/ui/admin/MerchantBadge';
import { IconCountry } from '@components/ui/icons/IconCountry';
import { useAdminData } from '@context/AdminContext';
import { useCorridorsListApi } from '@hooks/useCorridorsApi';
import { adminPath } from '@app/adminRouter';
import styles from '@styles/pages/admin/corridors-page.module.css';

/* ──────────────────────────────────────────────────────────────────
 * CorridorsPage
 *
 * Route: /admin/corridors
 * Register: neutral.
 *
 * Dual mode:
 *   Mock mode | data from useAdminData()
 *   API mode  | data from useCorridorsListApi() against the backend
 * ────────────────────────────────────────────────────────────────── */

export function CorridorsPage() {
  const navigate = useNavigate();
  const mock = useAdminData();
  const api = useCorridorsListApi();

  const [search, setSearch] = useState('');
  const [density, setDensity] = useState('default');

  const corridors = api?.isApiMode ? api.corridors : mock.corridors;
  const corridorMerchants = api?.isApiMode ? api.corridorMerchants : mock.corridorMerchants;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return corridors;
    return corridors.filter(c =>
      c.id.toLowerCase().includes(term) ||
      c.countryCode.toLowerCase().includes(term) ||
      c.sourceCurrency.toLowerCase().includes(term)
    );
  }, [corridors, search]);

  function preferredMerchantId(corridorId) {
    const pref = corridorMerchants.find(cm => cm.corridorId === corridorId && cm.isPreferred);
    return pref?.merchantId;
  }

  function merchantsAttached(corridorId) {
    return corridorMerchants.filter(cm => cm.corridorId === corridorId).length;
  }

  const columns = useMemo(() => [
    {
      key: 'id',
      header: 'Corridor',
      priority: 'primary',
      renderer: (_v, row) => (
        <div className={styles.nameCell}>
          <span className={styles.corridorId}>{row.id}</span>
          <span className={styles.corridorSub}>
            {row.countryCode} | {row.sourceCurrency} {row.sourceMethod} to {row.destinationAsset} {row.destinationNetwork}
          </span>
        </div>
      ),
    },
    {
      key: 'direction',
      header: 'Direction',
      priority: 'secondary',
      width: '120px',
      renderer: (_v, row) => (
        <span className={styles.directionText}>
          {row.direction === 'deposit' ? 'Deposit' : 'Withdrawal'}
        </span>
      ),
    },
    {
      key: 'preferred',
      header: 'Preferred merchant',
      priority: 'secondary',
      width: '180px',
      renderer: (_v, row) => {
        const mid = preferredMerchantId(row.id);
        return mid
          ? <MerchantBadge merchantId={mid} size="sm" preferred showStatus={false} />
          : <span className={styles.mutedText}>None</span>;
      },
    },
    {
      key: 'merchants',
      header: 'Merchants',
      priority: 'secondary',
      width: '110px',
      align: 'right',
      renderer: (_v, row) => (
        <span className={styles.countValue}>{merchantsAttached(row.id)}</span>
      ),
    },
    {
      key: 'limits',
      header: 'Limits',
      priority: 'secondary',
      width: '160px',
      renderer: (_v, row) => (
        <span className={styles.limitsText}>
          ${row.minDepositUsd} to ${Number(row.maxDepositUsd).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      priority: 'primary',
      width: '110px',
      renderer: (_v, row) => <StatusBadge status={row.status} size="sm" />,
    },
  ], [corridorMerchants]);

  return (
    <AdminShell pageTitle="Corridors" contentRegister="neutral">
      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <div className={styles.pageHeaderMain}>
            <h1 className={styles.pageTitle}>Corridors</h1>
            <p className={styles.pageSubtitle}>
              Routes from a source payment method to a destination asset. Click a row to configure merchants and limits.
            </p>
          </div>
          <div className={styles.pageHeaderAside}>
            <button
              type="button"
              className={styles.primaryAction}
              disabled
              aria-disabled="true"
            >
              New corridor
            </button>
          </div>
        </header>

        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Corridor ID, country, or currency"
          filters={[]}
          density={density}
          onDensityChange={setDensity}
        />

        <DataTable
          columns={columns}
          rows={filtered}
          getRowKey={(r) => r.id}
          density={density}
          onRowClick={(row) => navigate(adminPath(`/corridors/${row.id}`))}
          mobileReflow="cards"
          ariaLabel="Corridors"
          emptyState={{
            icon: <IconCountry size={24} />,
            heading: api?.error
              ? 'Could not load corridors'
              : search ? 'No corridors match' : 'No corridors yet',
            body: api?.error
              ? api.error.message
              : search
                ? 'Try a different search term.'
                : 'Corridors will appear here once configured.',
          }}
        />
      </div>
    </AdminShell>
  );
}
