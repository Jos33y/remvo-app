import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { AdminShell } from '@components/layout/admin/AdminShell';
import { DataTable } from '@components/ui/admin/DataTable';
import { FilterBar } from '@components/ui/admin/FilterBar';
import { StatusBadge } from '@components/ui/admin/StatusBadge';
import { MerchantBadge } from '@components/ui/admin/MerchantBadge';
import { IconMerchant } from '@components/ui/icons/IconMerchant';
import { useAdminData } from '@context/AdminContext';
import { useMerchantsListApi } from '@hooks/useMerchantsApi';
import { adminPath } from '@app/adminRouter';
import styles from '@styles/pages/admin/merchants-page.module.css';

/* ──────────────────────────────────────────────────────────────────
 * MerchantsPage
 *
 * Route: /admin/merchants
 * Register: neutral.
 *
 * Day-one rows: Kora (NG, bank_transfer, active) + Monnify (paused)
 * + Paystack (NG, bank_transfer, card, ussd, paused). Flutterwave
 * + Pan-African providers arrive later.
 *
 * Dual mode:
 *   Mock mode | data from useAdminData()
 *   API mode  | data from useMerchantsListApi() against the backend
 *
 * The page renders identically in both modes because the API
 * response shape matches the mock seed shape exactly.
 * ────────────────────────────────────────────────────────────────── */

const METHOD_LABELS = {
  bank_transfer: 'Bank transfer',
  card: 'Card',
  ussd: 'USSD',
  mobile_money: 'Mobile money',
  mpesa: 'M-Pesa',
};

export function MerchantsPage() {
  const navigate = useNavigate();
  const mock = useAdminData();
  const api = useMerchantsListApi();

  const [search, setSearch] = useState('');
  const [density, setDensity] = useState('default');

  const merchants = api?.isApiMode ? api.merchants : mock.merchants;
  const corridorMerchants = api?.isApiMode ? api.corridorMerchants : mock.corridorMerchants;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return merchants;
    return merchants.filter(m =>
      m.id.toLowerCase().includes(term) ||
      m.displayName.toLowerCase().includes(term)
    );
  }, [merchants, search]);

  function corridorUseCount(merchantId) {
    return corridorMerchants.filter(cm => cm.merchantId === merchantId).length;
  }

  const columns = useMemo(() => [
    {
      key: 'displayName',
      header: 'Merchant',
      priority: 'primary',
      renderer: (_v, row) => (
        <MerchantBadge merchantId={row.id} size="md" showStatus={false} />
      ),
    },
    {
      key: 'supportedCountries',
      header: 'Countries',
      priority: 'secondary',
      width: '160px',
      renderer: (_v, row) => (
        <div className={styles.chipRow}>
          {row.supportedCountries.map(code => (
            <span key={code} className={styles.countryChip}>{code}</span>
          ))}
        </div>
      ),
    },
    {
      key: 'supportedMethods',
      header: 'Methods',
      priority: 'secondary',
      renderer: (_v, row) => (
        <span className={styles.methodsText}>
          {row.supportedMethods.map(m => METHOD_LABELS[m] || m).join(', ')}
        </span>
      ),
    },
    {
      key: 'corridorUse',
      header: 'Corridors',
      priority: 'secondary',
      width: '110px',
      align: 'right',
      renderer: (_v, row) => (
        <span className={styles.countValue}>{corridorUseCount(row.id)}</span>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      priority: 'secondary',
      width: '140px',
      renderer: (_v, row) => (
        <span className={styles.typeText}>
          {row.type === 'both' ? 'Deposit + Disbursement' : row.type === 'deposit' ? 'Deposit' : 'Disbursement'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      priority: 'primary',
      width: '100px',
      renderer: (_v, row) => <StatusBadge status={row.status} size="sm" />,
    },
  ], [corridorMerchants]);

  return (
    <AdminShell pageTitle="Merchants" contentRegister="neutral">
      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <div className={styles.pageHeaderMain}>
            <h1 className={styles.pageTitle}>Merchants</h1>
            <p className={styles.pageSubtitle}>
              Payment providers that collect local currency on behalf of Remvo. Click a row to view credentials and health.
            </p>
          </div>
          <div className={styles.pageHeaderAside}>
            <button
              type="button"
              className={styles.primaryAction}
              disabled
              aria-disabled="true"
            >
              New merchant
            </button>
          </div>
        </header>

        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Merchant name or ID"
          filters={[]}
          density={density}
          onDensityChange={setDensity}
        />

        <DataTable
          columns={columns}
          rows={filtered}
          getRowKey={(r) => r.id}
          density={density}
          onRowClick={(row) => navigate(adminPath(`/merchants/${row.id}`))}
          mobileReflow="cards"
          ariaLabel="Merchants"
          emptyState={{
            icon: <IconMerchant size={24} />,
            heading: api?.error
              ? 'Could not load merchants'
              : search ? 'No merchants match' : 'No merchants yet',
            body: api?.error
              ? api.error.message
              : search
                ? 'Try a different search term.'
                : 'Merchants will appear here once connected.',
          }}
        />
      </div>
    </AdminShell>
  );
}
