import { useMemo, useState } from 'react';
import { AdminShell } from '@components/layout/admin/AdminShell';
import { Button } from '@components/ui/shared/Button';
import { SkeletonBlock } from '@components/ui/shared/SkeletonBlock';
import { PasskeyPrompt } from '@components/ui/shared/PasskeyPrompt';
import { WalletBalance } from '@components/ui/shared/WalletBalance';
import { SettlementTrigger } from '@components/ui/admin/SettlementTrigger';
import { RateEntryInput } from '@components/ui/admin/RateEntryInput';
import { StatusBadge } from '@components/ui/admin/StatusBadge';
import { MerchantBadge } from '@components/ui/admin/MerchantBadge';
import { OperatorBadge } from '@components/ui/admin/OperatorBadge';
import { EmptyState } from '@components/ui/admin/EmptyState';
import { Pagination } from '@components/ui/admin/Pagination';
import { FilterBar } from '@components/ui/admin/FilterBar';
import { ConfirmDialog } from '@components/ui/admin/ConfirmDialog';
import { BottomSheet } from '@components/ui/admin/BottomSheet';
import { DataTable } from '@components/ui/admin/DataTable';
import { StatCard } from '@components/ui/admin/StatCard';
import { AuditLogRow } from '@components/ui/admin/AuditLogRow';
import { useAdminData } from '@context/AdminContext';
import { getPendingBatch } from '@utils/rateEngine';
import { IconFilter } from '@components/ui/icons/IconFilter';
import { IconSort } from '@components/ui/icons/IconSort';
import { IconSearch } from '@components/ui/icons/IconSearch';
import { IconKebab } from '@components/ui/icons/IconKebab';
import { IconPlus } from '@components/ui/icons/IconPlus';
import { IconMinus } from '@components/ui/icons/IconMinus';
import { IconExpand } from '@components/ui/icons/IconExpand';
import { IconCollapse } from '@components/ui/icons/IconCollapse';
import { IconWallet } from '@components/ui/icons/IconWallet';
import { IconLayers } from '@components/ui/icons/IconLayers';
import { IconRate } from '@components/ui/icons/IconRate';
import { IconSettlement } from '@components/ui/icons/IconSettlement';
import styles from '@styles/pages/admin/dev-primitives-page.module.css';

/* ──────────────────────────────────────────────────────────────────
 * DevPrimitivesPage (/_dev/primitives)
 *
 * Not linked from the sidebar. Dev-only route mounted under
 * AdminProtected. Route is registered only when import.meta.env.DEV.
 *
 * A4: added StatCard + AuditLogRow + PasskeyPrompt sections.
 * AuditLogRow reads live from useAdminData().auditLog so every action
 * performed in the harness (e.g. triggering a settlement via the
 * ConfirmDialog loading demo) appears here with correct prose
 * attribution and before/after diff.
 * ────────────────────────────────────────────────────────────────── */

const NEW_ICONS = [
  { name: 'IconFilter', Component: IconFilter },
  { name: 'IconSort', Component: IconSort },
  { name: 'IconSearch', Component: IconSearch },
  { name: 'IconKebab', Component: IconKebab },
  { name: 'IconPlus', Component: IconPlus },
  { name: 'IconMinus', Component: IconMinus },
  { name: 'IconExpand', Component: IconExpand },
  { name: 'IconCollapse', Component: IconCollapse },
  { name: 'IconWallet', Component: IconWallet },
];

const STATUS_VALUES = [
  'active', 'paused', 'maintenance', 'coming_soon',
  'confirmed', 'pending', 'failed', 'settled',
];

// ─── Section wrappers ─────────────────────────────────────────────

function Section({ title, subtitle, children }) {
  return (
    <section className={styles.section}>
      <header className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        {subtitle && <p className={styles.sectionSubtitle}>{subtitle}</p>}
      </header>
      <div className={styles.sectionBody}>
        {children}
      </div>
    </section>
  );
}

function RegisterFrame({ register, label, children }) {
  return (
    <div className={`${styles.registerFrame} ${styles[`register-${register}`]}`} data-canvas={register}>
      <span className={styles.registerLabel}>{label}</span>
      <div className={styles.registerInner}>{children}</div>
    </div>
  );
}

function DemoRow({ label, children }) {
  return (
    <div className={styles.demoRow}>
      <span className={styles.demoLabel}>{label}</span>
      <div className={styles.demoCell}>{children}</div>
    </div>
  );
}

// ─── Formatting helpers ────────────────────────────────────────────

function formatNairaShort(amount) {
  if (amount == null) return '';
  return '\u20A6' + amount.toLocaleString('en-NG');
}

function formatUsdShort(amount) {
  if (amount == null) return '';
  return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatTimeAgo(iso) {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

function RefMono({ value }) {
  return <span className={styles.mono}>{value}</span>;
}

function KebabButton() {
  return (
    <button
      type="button"
      className={styles.kebabButton}
      aria-label="Row actions"
      onClick={(event) => event.stopPropagation()}
    >
      <IconKebab size={14} />
    </button>
  );
}

// ─── DataTable column schemas (from A3) ───────────────────────────

function buildTransactionsColumns() {
  return [
    { key: 'reference', header: 'Reference', width: 200, priority: 'primary', sortable: true, renderer: (v) => <RefMono value={v} /> },
    { key: 'createdAt', header: 'When', width: 100, priority: 'primary', sortable: true, renderer: (v) => <span className={styles.mono}>{formatTimeAgo(v)}</span> },
    { key: 'merchantId', header: 'Merchant', width: 130, priority: 'secondary', renderer: (v) => <MerchantBadge merchantId={v} size="sm" /> },
    { key: 'amountUsdCard', header: 'Card', width: 90, align: 'right', priority: 'primary', sortable: true, renderer: (v) => <span className={styles.mono}>{formatUsdShort(v)}</span> },
    { key: 'userPaysNaira', header: 'Naira', width: 120, align: 'right', priority: 'secondary', renderer: (v) => <span className={styles.mono}>{formatNairaShort(v)}</span> },
    { key: 'displayRate', header: 'Rate', width: 80, align: 'right', priority: 'secondary', renderer: (v) => <span className={styles.mono}>{v}</span> },
    { key: 'status', header: 'Status', width: 120, priority: 'primary', sortable: true, renderer: (v) => <StatusBadge status={v} size="sm" /> },
    { key: 'actions', header: '', width: 48, align: 'right', priority: 'hidden', renderer: () => <KebabButton /> },
  ];
}

function buildSettlementsColumns() {
  return [
    { key: 'id', header: 'Batch', width: 140, priority: 'primary', sortable: true, renderer: (v) => <RefMono value={v} /> },
    { key: 'triggeredAt', header: 'Triggered', width: 120, priority: 'primary', sortable: true, renderer: (v, row) => row.status === 'pending' ? <span className={styles.muted}>{'\u2014'}</span> : <span className={styles.mono}>{formatTimeAgo(v)}</span> },
    { key: 'transactionCount', header: 'Transactions', width: 120, align: 'right', priority: 'primary', sortable: true, renderer: (v) => <span className={styles.mono}>{v}</span> },
    { key: 'totalUsdSettled', header: 'USD settled', width: 130, align: 'right', priority: 'primary', sortable: true, renderer: (v) => <span className={styles.mono}>{formatUsdShort(v)}</span> },
    { key: 'totalFeeUsd', header: 'Fees', width: 100, align: 'right', priority: 'secondary', renderer: (v) => <span className={styles.mono}>{formatUsdShort(v)}</span> },
    { key: 'status', header: 'Status', width: 120, priority: 'primary', sortable: true, renderer: (v) => <StatusBadge status={v === 'completed' ? 'settled' : v} size="sm" /> },
  ];
}

function buildPlatformsColumns() {
  return [
    { key: 'displayName', header: 'Platform', width: 200, priority: 'primary', sortable: true, renderer: (v) => <span className={styles.strongValue}>{v}</span> },
    {
      key: 'countries',
      header: 'Active countries',
      priority: 'primary',
      renderer: (countries) => {
        const active = Object.entries(countries || {}).filter(([, v]) => v.status === 'active');
        const pending = Object.entries(countries || {}).filter(([, v]) => v.status === 'coming_soon');
        return (
          <span className={styles.muted}>
            <span className={styles.strongValue}>{active.length}</span>{' active'}
            {pending.length > 0 && (<>{' \u00B7 '}<span>{pending.length} coming soon</span></>)}
          </span>
        );
      },
    },
    { key: 'settlementMode', header: 'Settlement', width: 140, priority: 'secondary', renderer: (v) => <span className={styles.capitalise}>{v}</span> },
    { key: 'status', header: 'Status', width: 120, priority: 'primary', renderer: () => <StatusBadge status="active" size="sm" /> },
  ];
}

function applySort(rows, sortState) {
  if (!sortState || !sortState.key) return rows;
  const { key, direction } = sortState;
  const dir = direction === 'desc' ? -1 : 1;
  return [...rows].sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
    return String(av).localeCompare(String(bv)) * dir;
  });
}

function paginate(rows, pageSize, currentPage) {
  const start = (currentPage - 1) * pageSize;
  return rows.slice(start, start + pageSize);
}

// ─── PasskeyPrompt mock handlers (for the harness) ───────────────

function mockSuccess() {
  return new Promise(resolve => setTimeout(() => resolve({ ok: true }), 1200));
}

function mockCancelled() {
  return new Promise((_, reject) => setTimeout(() => {
    const err = new Error('cancelled');
    err.name = 'NotAllowedError';
    reject(err);
  }, 800));
}

function mockNotSupported() {
  return new Promise((_, reject) => setTimeout(() => {
    const err = new Error('WebAuthn not supported on this device');
    err.name = 'NotSupportedError';
    reject(err);
  }, 400));
}

function mockNetworkError() {
  return new Promise((_, reject) => setTimeout(() => {
    const err = new Error('network request failed');
    err.name = 'TypeError';
    reject(err);
  }, 900));
}

function mockUnknown() {
  return new Promise((_, reject) => setTimeout(() => {
    const err = new Error('unexpected failure');
    err.name = 'Error';
    reject(err);
  }, 600));
}

// ═══════════════════════════════════════════════════════════════════
// Page
// ═══════════════════════════════════════════════════════════════════

export function DevPrimitivesPage() {
  const { operators, transactions, settlements, platforms, auditLog, rateSources, rateEntries, wallet, actions } = useAdminData();
  const primaryOperator = operators[0];

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState([
    { key: 'status', label: 'Status', value: 'Confirmed' },
    { key: 'platform', label: 'Platform', value: 'GE-AS' },
  ]);
  const [density, setDensity] = useState('default');
  const [page, setPage] = useState(5);
  const [pageSize, setPageSize] = useState(50);

  const [confirmPrimaryOpen, setConfirmPrimaryOpen] = useState(false);
  const [confirmDestructiveOpen, setConfirmDestructiveOpen] = useState(false);
  const [confirmLoadingOpen, setConfirmLoadingOpen] = useState(false);
  const [confirmLoadingBusy, setConfirmLoadingBusy] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  // B1 | WalletBalance demo | tier forced-state switcher
  const [walletPreviewTier, setWalletPreviewTier] = useState('sufficient');
  const [walletPreviewLoading, setWalletPreviewLoading] = useState(false);

  // B1 | SettlementTrigger demo | forced-state switcher
  const [settlementPreviewState, setSettlementPreviewState] = useState('idle');

  // B1 | RateEntryInput demo | forced-state switcher for the side-by-side mock
  const [ratePreviewState, setRatePreviewState] = useState('idle');

  // A4 | StatCard demo toggle
  const [statsLoading, setStatsLoading] = useState(false);

  // A4 | AuditLogRow expand state (per-row)
  const [expandedAuditIds, setExpandedAuditIds] = useState(new Set());
  function toggleAuditExpand(id) {
    setExpandedAuditIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // DataTable states (from A3)
  const transactionColumns = useMemo(buildTransactionsColumns, []);
  const [txSort, setTxSort] = useState({ key: 'createdAt', direction: 'desc' });
  const [txSelected, setTxSelected] = useState(new Set());
  const [txPage, setTxPage] = useState(1);
  const [txPageSize, setTxPageSize] = useState(10);
  const txRowsSorted = useMemo(() => applySort(transactions, txSort), [transactions, txSort]);
  const txRowsPaged = useMemo(() => paginate(txRowsSorted, txPageSize, txPage), [txRowsSorted, txPage, txPageSize]);

  const settlementColumns = useMemo(buildSettlementsColumns, []);
  const [setSort, setSetSort] = useState({ key: 'triggeredAt', direction: 'desc' });

  const platformColumns = useMemo(buildPlatformsColumns, []);

  const [showLoadingDemo, setShowLoadingDemo] = useState(false);
  const [showEmptyDemo, setShowEmptyDemo] = useState(false);

  function demoLoadingConfirm() { setConfirmLoadingOpen(true); }
  async function demoLoadingSubmit() {
    // Wire to the real provider action so the audit log populates. Without
    // this the dialog closes but auditLog stays empty, which defeats the
    // point of the primitives harness for AuditLogRow.
    setConfirmLoadingBusy(true);
    try {
      await actions.triggerSettlementBatch();
    } finally {
      setConfirmLoadingBusy(false);
      setConfirmLoadingOpen(false);
    }
  }

  // Derived stats for StatCard demos (live from seed)
  const todayTxns = useMemo(() => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return transactions.filter(t => new Date(t.createdAt).getTime() > cutoff);
  }, [transactions]);

  const todayVolumeUsd = todayTxns.reduce((sum, t) => sum + (t.amountUsdCard || 0), 0);
  const usdOwed = useMemo(() => transactions
    .filter(t => t.status === 'confirmed' && !t.settlementBatchId)
    .reduce((sum, t) => sum + (t.amountUsdSettled || 0), 0), [transactions]);

  const activeCorridors = 1; // seeded
  const pendingSettlements = settlements.filter(s => s.status === 'pending').length;

  // ─── B1 derivations ──────────────────────────────────────────────

  const pendingBatch = useMemo(
    () => getPendingBatch({ transactions, platforms }),
    [transactions, platforms]
  );

  const coingeckoSource = rateSources.find(s => s.id === 'coingecko');
  const coingeckoReading = coingeckoSource?.lastReading
    ? {
        midRate: coingeckoSource.lastReading.midRate,
        bufferNaira: coingeckoSource.config?.bufferNaira || 0,
        fetchedAt: coingeckoSource.lastReading.fetchedAt,
      }
    : null;

  const manualSource = rateSources.find(s => s.id === 'manual');
  const manualSourceActive = !!manualSource?.isActive;

  const activeManualEntry = rateEntries.find(e => e.isActive);
  const currentManual = activeManualEntry
    ? {
        rate: activeManualEntry.buyRate,
        enteredAt: activeManualEntry.enteredAt,
        enteredBy: activeManualEntry.enteredBy,
        expiresAt: activeManualEntry.expiresAt,
      }
    : null;

  const walletSufficient = !!wallet && !!pendingBatch
    ? wallet.balanceUsdt >= pendingBatch.total
    : true;

  // Preview-only batch for the SettlementTrigger state switcher (forced states).
  const previewBatch = useMemo(
    () => ({
      platforms: [
        { id: 'geas', name: 'GE-AS', usdtOwed: 247.50, transactionCount: 32 },
      ],
      total: 247.50,
      nextScheduledAt: null,
    }),
    []
  );

  // Preview-only CoinGecko reading for the "out of bounds" rate demo.
  const previewCoingecko = useMemo(
    () => ({
      midRate: 1330.0,
      bufferNaira: 50,
      fetchedAt: new Date(Date.now() - 30 * 1000).toISOString(),
    }),
    []
  );

  async function noop() { /* harness stub for the preview demos */ }

  return (
    <AdminShell pageTitle="Dev | primitives" contentRegister="neutral">
      <div className={styles.wrap}>
        <header className={styles.pageHeader}>
          <span className={styles.devFlag}>DEV ONLY</span>
          <h1 className={styles.pageTitle}>Primitives harness</h1>
          <p className={styles.pageLead}>
            Every B1 + A2 + A3 + A4 primitive in every state, on both registers where applicable.
            Not linked from the sidebar. This route is stripped from production builds.
          </p>
        </header>

        {/* ═══ B1 | WalletBalance ═════════════════════════════════ */}

        <Section
          title="WalletBalance"
          subtitle="Obsidian hero | tier derived from (balance, owed, threshold) | full + compact variants"
        >
          <div className={styles.tableDemoControls}>
            <Button
              variant={walletPreviewTier === 'sufficient' ? 'primary' : 'outline'}
              size="small"
              onClick={() => setWalletPreviewTier('sufficient')}
            >
              Sufficient
            </Button>
            <Button
              variant={walletPreviewTier === 'adequate' ? 'primary' : 'outline'}
              size="small"
              onClick={() => setWalletPreviewTier('adequate')}
            >
              Adequate
            </Button>
            <Button
              variant={walletPreviewTier === 'underfunded' ? 'primary' : 'outline'}
              size="small"
              onClick={() => setWalletPreviewTier('underfunded')}
            >
              Underfunded
            </Button>
            <Button
              variant={walletPreviewLoading ? 'primary' : 'outline'}
              size="small"
              onClick={() => setWalletPreviewLoading(v => !v)}
            >
              {walletPreviewLoading ? 'Loading ON' : 'Toggle loading'}
            </Button>
            <span className={styles.demoNote}>
              Live card reads useAdminData().wallet. Preview forces tier on a fixed fixture so all three states are visible side-by-side.
            </span>
          </div>

          <RegisterFrame register="obsidian" label="Live | useAdminData().wallet">
            <div className={styles.heroCardsGrid}>
              <WalletBalance
                balanceUsdt={wallet ? wallet.balanceUsdt : 0}
                thresholdUsdt={wallet ? wallet.thresholdUsdt : 0}
                owedUsdt={usdOwed}
                onTopUpTap={() => console.log('wallet top-up tapped')}
              />
            </div>
          </RegisterFrame>

          <RegisterFrame register="obsidian" label="Forced state preview">
            <div className={styles.heroCardsGrid}>
              {(() => {
                const owed = 890;
                const threshold = 200;
                let balance = 4212.50;
                if (walletPreviewTier === 'adequate') balance = 1000;
                if (walletPreviewTier === 'underfunded') balance = 440;
                return (
                  <WalletBalance
                    balanceUsdt={balance}
                    thresholdUsdt={threshold}
                    owedUsdt={owed}
                    loading={walletPreviewLoading}
                    onTopUpTap={() => console.log('wallet top-up tapped')}
                  />
                );
              })()}
            </div>
          </RegisterFrame>

          <RegisterFrame register="obsidian" label="Compact | mobile AdminHeader strip (Phase B2)">
            <DemoRow label="sufficient">
              <WalletBalance
                variant="compact"
                balanceUsdt={4212.50}
                thresholdUsdt={200}
                owedUsdt={890}
                onTopUpTap={() => {}}
              />
            </DemoRow>
            <DemoRow label="adequate">
              <WalletBalance
                variant="compact"
                balanceUsdt={1000}
                thresholdUsdt={200}
                owedUsdt={890}
                onTopUpTap={() => {}}
              />
            </DemoRow>
            <DemoRow label="underfunded">
              <WalletBalance
                variant="compact"
                balanceUsdt={440}
                thresholdUsdt={200}
                owedUsdt={890}
                onTopUpTap={() => {}}
              />
            </DemoRow>
          </RegisterFrame>
        </Section>

        {/* ═══ B1 | SettlementTrigger ═════════════════════════════ */}

        <Section
          title="SettlementTrigger"
          subtitle="Obsidian hero | idle / empty / wallet-insufficient / batch-running / success | ConfirmDialog wrap"
        >
          <div className={styles.tableDemoControls}>
            <Button
              variant={settlementPreviewState === 'idle' ? 'primary' : 'outline'}
              size="small"
              onClick={() => setSettlementPreviewState('idle')}
            >
              Idle
            </Button>
            <Button
              variant={settlementPreviewState === 'empty' ? 'primary' : 'outline'}
              size="small"
              onClick={() => setSettlementPreviewState('empty')}
            >
              Empty
            </Button>
            <Button
              variant={settlementPreviewState === 'wallet-insufficient' ? 'primary' : 'outline'}
              size="small"
              onClick={() => setSettlementPreviewState('wallet-insufficient')}
            >
              Wallet insufficient
            </Button>
            <Button
              variant={settlementPreviewState === 'running' ? 'primary' : 'outline'}
              size="small"
              onClick={() => setSettlementPreviewState('running')}
            >
              Batch running
            </Button>
            <span className={styles.demoNote}>
              Live card reads transactions + platforms through getPendingBatch. Triggering it writes to the live audit log (visible in the A4 section below).
              First trigger consumes all seeded pending txns, after which the card flips to the empty state. Use window.__remvoResetMockData() to replay.
            </span>
          </div>

          <RegisterFrame register="obsidian" label="Live | wired to actions.triggerSettlementBatch">
            <div className={styles.heroCardsGrid}>
              <SettlementTrigger
                pendingBatch={pendingBatch}
                walletSufficient={walletSufficient}
                onTrigger={() => actions.triggerSettlementBatch()}
                onViewSettlement={(batchId) => console.log('view settlement', batchId)}
              />
            </div>
          </RegisterFrame>

          <RegisterFrame register="obsidian" label="Forced state preview">
            <div className={styles.heroCardsGrid}>
              {settlementPreviewState === 'idle' && (
                <SettlementTrigger
                  pendingBatch={previewBatch}
                  walletSufficient
                  onTrigger={async () => ({ id: 'bat_preview' })}
                  onViewSettlement={(id) => console.log('view', id)}
                />
              )}
              {settlementPreviewState === 'empty' && (
                <SettlementTrigger
                  pendingBatch={null}
                  walletSufficient
                  onTrigger={noop}
                />
              )}
              {settlementPreviewState === 'wallet-insufficient' && (
                <SettlementTrigger
                  pendingBatch={previewBatch}
                  walletSufficient={false}
                  onTrigger={noop}
                />
              )}
              {settlementPreviewState === 'running' && (
                <SettlementTrigger
                  pendingBatch={previewBatch}
                  walletSufficient
                  onTrigger={noop}
                  disabled
                />
              )}
            </div>
          </RegisterFrame>
        </Section>

        {/* ═══ B1 | RateEntryInput ════════════════════════════════ */}

        <Section
          title="RateEntryInput"
          subtitle="Obsidian hero | input + CoinGecko calibration + live delta + toggle + sanity +/-20% confirm"
        >
          <div className={styles.tableDemoControls}>
            <Button
              variant={ratePreviewState === 'idle' ? 'primary' : 'outline'}
              size="small"
              onClick={() => setRatePreviewState('idle')}
            >
              Idle
            </Button>
            <Button
              variant={ratePreviewState === 'no-coingecko' ? 'primary' : 'outline'}
              size="small"
              onClick={() => setRatePreviewState('no-coingecko')}
            >
              No CoinGecko
            </Button>
            <Button
              variant={ratePreviewState === 'source-off' ? 'primary' : 'outline'}
              size="small"
              onClick={() => setRatePreviewState('source-off')}
            >
              Source off
            </Button>
            <span className={styles.demoNote}>
              Live card writes via actions.updateRate + actions.toggleManualSource | audit entries appear in A4 below.
              Try entering 1,700 to see the +/-20% sanity-bound ConfirmDialog before save. Try entering 1,200 to see the below-market delta.
            </span>
          </div>

          <RegisterFrame register="obsidian" label="Live | wired to actions.updateRate + actions.toggleManualSource">
            <div className={styles.heroCardsGrid}>
              <RateEntryInput
                currentManual={currentManual}
                coingeckoReading={coingeckoReading}
                manualSourceActive={manualSourceActive}
                onSubmit={(rate, notes) => actions.updateRate(rate, notes)}
                onToggleManual={(enabled) => actions.toggleManualSource(enabled)}
              />
            </div>
          </RegisterFrame>

          <RegisterFrame register="obsidian" label="Forced state preview">
            <div className={styles.heroCardsGrid}>
              {ratePreviewState === 'idle' && (
                <RateEntryInput
                  currentManual={null}
                  coingeckoReading={previewCoingecko}
                  manualSourceActive
                  onSubmit={noop}
                  onToggleManual={noop}
                />
              )}
              {ratePreviewState === 'no-coingecko' && (
                <RateEntryInput
                  currentManual={null}
                  coingeckoReading={null}
                  manualSourceActive
                  onSubmit={noop}
                  onToggleManual={noop}
                />
              )}
              {ratePreviewState === 'source-off' && (
                <RateEntryInput
                  currentManual={null}
                  coingeckoReading={previewCoingecko}
                  manualSourceActive={false}
                  onSubmit={noop}
                  onToggleManual={noop}
                />
              )}
            </div>
          </RegisterFrame>
        </Section>

        {/* ═══ A4 | StatCard ═══════════════════════════════════════ */}

        <Section title="StatCard" subtitle="Cockpit tile primitive | three sizes | both registers | status colours | clickable + loading">
          <div className={styles.tableDemoControls}>
            <Button
              variant={statsLoading ? 'primary' : 'outline'}
              size="small"
              onClick={() => setStatsLoading(v => !v)}
            >
              {statsLoading ? 'Loading ON' : 'Toggle loading'}
            </Button>
            <span className={styles.demoNote}>StatCard values seed from live useAdminData. Toggle to see shimmer.</span>
          </div>

          <RegisterFrame register="obsidian" label="Obsidian | cockpit hero (lg)">
            <div className={styles.statGridCockpit}>
              <StatCard
                size="lg"
                label="Hot wallet"
                value={formatUsdShort(usdOwed * 2.5)}
                context="Funded 4h ago"
                icon={<IconWallet size={20} />}
                loading={statsLoading}
              />
              <StatCard
                size="lg"
                label="Current rate"
                value={'\u20A61,523'}
                context="Manual | set 4h ago"
                status="info"
                icon={<IconRate size={20} />}
                loading={statsLoading}
              />
              <StatCard
                size="lg"
                label="Today's volume"
                value={formatUsdShort(todayVolumeUsd)}
                context={`${todayTxns.length} transactions`}
                icon={<IconLayers size={20} />}
                loading={statsLoading}
              />
            </div>
          </RegisterFrame>

          <RegisterFrame register="obsidian" label="Obsidian | secondary (md)">
            <div className={styles.statGridSecondary}>
              <StatCard
                label="USDT owed"
                value={formatUsdShort(usdOwed)}
                context="Pending settlement"
                status="warning"
                loading={statsLoading}
              />
              <StatCard
                label="Active corridors"
                value={`${activeCorridors}`}
                context="All healthy"
                status="success"
                loading={statsLoading}
              />
              <StatCard
                label="Pending batches"
                value={`${pendingSettlements}`}
                context={pendingSettlements > 0 ? 'Ready to trigger' : 'None pending'}
                icon={<IconSettlement size={20} />}
                loading={statsLoading}
              />
              <StatCard
                label="Clickable tile"
                value={formatUsdShort(42.5)}
                context="Tap to drill in"
                onClick={() => {}}
                loading={statsLoading}
              />
            </div>
          </RegisterFrame>

          <RegisterFrame register="neutral" label="Neutral | detail-page embedded (md + sm)">
            <div className={styles.statGridSecondary}>
              <StatCard
                size="md"
                label="Webhook success rate"
                value="99.8%"
                context="Last 24h"
                status="success"
              />
              <StatCard
                size="md"
                label="Failed transactions"
                value="3"
                context="Below threshold (5)"
                status="neutral"
              />
              <StatCard
                size="sm"
                label="Avg response"
                value="142ms"
                context="+12ms vs yesterday"
                status="warning"
              />
              <StatCard
                size="sm"
                label="Manual rate age"
                value="4h"
                context="Expires in 20h"
              />
            </div>
          </RegisterFrame>
        </Section>

        {/* ═══ A4 | AuditLogRow ═══════════════════════════════════ */}

        <Section
          title="AuditLogRow"
          subtitle="Prose-first entries reading live from useAdminData | 11 action formatters | before/after JSON diff with gold changed-key highlighting"
        >
          {auditLog.length === 0 ? (
            <EmptyState
              heading="Audit log is empty"
              body="Perform a mock action elsewhere in the harness (e.g. the ConfirmDialog loading demo triggers settlement.trigger_batch) to populate this section."
              icon={<IconLayers size={40} />}
            />
          ) : (
            <div className={styles.auditTableWrap}>
              <table className={styles.auditTable}>
                <thead className={styles.auditThead}>
                  <tr>
                    <th scope="col" className={styles.auditTh}>When</th>
                    <th scope="col" className={styles.auditTh}>Action</th>
                    <th scope="col" className={styles.auditTh} aria-label="Expand" />
                  </tr>
                </thead>
                <tbody>
                  {auditLog.slice(0, 10).map(entry => (
                    <AuditLogRow
                      key={entry.id}
                      entry={entry}
                      expanded={expandedAuditIds.has(entry.id)}
                      onToggleExpand={() => toggleAuditExpand(entry.id)}
                      onOperatorClick={(operatorId) => console.log('filter by operator', operatorId)}
                      onEntityClick={(type, id) => console.log('jump to entity', type, id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className={styles.demoNote}>
            Tip: click a row to expand and see the exact before/after JSON with changed keys in gold.
            Click the operator name to filter, or an entity pill to jump to that entity.
          </p>
        </Section>

        {/* ═══ A4 | PasskeyPrompt ═════════════════════════════════ */}

        <Section
          title="PasskeyPrompt"
          subtitle="WebAuthn UX state machine | idle / requesting / success / error | 4 error categories"
        >
          <RegisterFrame register="obsidian" label="Obsidian tone (login / enrol pages)">
            <DemoRow label="Success (1.2s delay)">
              <div className={styles.passkeySlot}>
                <PasskeyPrompt
                  onRequest={mockSuccess}
                  label="Sign in with passkey"
                  idleDescription="Your system will prompt for Face ID, Touch ID, or a security key."
                  successAutoResetMs={2500}
                  onFallbackClick={() => console.log('fallback clicked')}
                />
              </div>
            </DemoRow>
            <DemoRow label="User cancelled">
              <div className={styles.passkeySlot}>
                <PasskeyPrompt
                  onRequest={mockCancelled}
                  label="Sign in with passkey"
                  onFallbackClick={() => console.log('fallback clicked')}
                />
              </div>
            </DemoRow>
            <DemoRow label="Not supported (no retry)">
              <div className={styles.passkeySlot}>
                <PasskeyPrompt
                  onRequest={mockNotSupported}
                  label="Sign in with passkey"
                  onFallbackClick={() => console.log('fallback clicked')}
                />
              </div>
            </DemoRow>
            <DemoRow label="Network error">
              <div className={styles.passkeySlot}>
                <PasskeyPrompt
                  onRequest={mockNetworkError}
                  label="Sign in with passkey"
                  onFallbackClick={() => console.log('fallback clicked')}
                />
              </div>
            </DemoRow>
            <DemoRow label="Unknown error">
              <div className={styles.passkeySlot}>
                <PasskeyPrompt
                  onRequest={mockUnknown}
                  label="Sign in with passkey"
                  onFallbackClick={() => console.log('fallback clicked')}
                />
              </div>
            </DemoRow>
          </RegisterFrame>

          <RegisterFrame register="neutral" label="Neutral tone (Settings > Passkeys)">
            <DemoRow label="Add device (idle)">
              <div className={styles.passkeySlot}>
                <PasskeyPrompt
                  onRequest={mockSuccess}
                  label="Enrol this device"
                  idleDescription="Set up Face ID or Touch ID to sign in from this device."
                  tone="neutral"
                  showFallbackLink={false}
                  successAutoResetMs={2500}
                />
              </div>
            </DemoRow>
          </RegisterFrame>
        </Section>

        {/* ═══ A3 | DataTable ═════════════════════════════════════ */}

        <Section title="DataTable" subtitle="Transactions (compact 8-col, mobile cards) / Settlements (default 6-col, mobile sticky) / Platforms (default 4-col)">
          <div className={styles.tableDemoControls}>
            <Button
              variant={showLoadingDemo ? 'primary' : 'outline'}
              size="small"
              onClick={() => { setShowLoadingDemo(v => !v); setShowEmptyDemo(false); }}
            >
              {showLoadingDemo ? 'Loading ON' : 'Show loading'}
            </Button>
            <Button
              variant={showEmptyDemo ? 'primary' : 'outline'}
              size="small"
              onClick={() => { setShowEmptyDemo(v => !v); setShowLoadingDemo(false); }}
            >
              {showEmptyDemo ? 'Empty ON' : 'Show empty'}
            </Button>
            <span className={styles.demoNote}>Toggle to exercise loading / empty states across all three tables.</span>
          </div>

          <DemoRow label="Transactions (compact, 8-col, cards)">
            <DataTable
              ariaLabel="Demo transactions"
              columns={transactionColumns}
              rows={showEmptyDemo ? [] : txRowsPaged}
              density="compact"
              sortState={txSort}
              onSortChange={(key, direction) => setTxSort({ key, direction })}
              selectable
              selectedKeys={txSelected}
              onSelectionChange={setTxSelected}
              onRowClick={(row) => console.log('tx clicked', row)}
              loading={showLoadingDemo}
              mobileReflow="cards"
              emptyState={{ icon: <IconLayers size={40} />, heading: 'No transactions match', body: 'Clear filters or adjust the date range.' }}
              pagination={{
                totalItems: transactions.length, pageSize: txPageSize, currentPage: txPage,
                onPageChange: setTxPage,
                onPageSizeChange: (next) => { setTxPageSize(next); setTxPage(1); },
                pageSizeOptions: [10, 25, 50],
              }}
            />
          </DemoRow>

          <DemoRow label="Settlements (default, 6-col, sticky first col on mobile)">
            <DataTable
              ariaLabel="Demo settlements"
              columns={settlementColumns}
              rows={showEmptyDemo ? [] : applySort(settlements, setSort)}
              density="default"
              sortState={setSort}
              onSortChange={(key, direction) => setSetSort({ key, direction })}
              onRowClick={(row) => console.log('settlement clicked', row)}
              loading={showLoadingDemo}
              mobileReflow="sticky"
              emptyState={{ icon: <IconWallet size={40} />, heading: 'No settlements yet', body: 'Settlements appear here after the first batch is triggered.' }}
            />
          </DemoRow>

          <DemoRow label="Platforms (default, 4-col, sticky)">
            <DataTable
              ariaLabel="Demo platforms"
              columns={platformColumns}
              rows={showEmptyDemo ? [] : platforms}
              density="default"
              onRowClick={(row) => console.log('platform clicked', row)}
              loading={showLoadingDemo}
              mobileReflow="sticky"
              emptyState={{
                icon: <IconPlus size={40} />,
                heading: 'Add your first platform',
                body: 'Platforms integrate Remvo via server-to-server checkout initialization.',
                action: <Button variant="primary" size="small">Add platform</Button>,
              }}
            />
          </DemoRow>
        </Section>

        {/* ═══ A2 | StatusBadge ═══════════════════════════════════ */}

        <Section title="StatusBadge" subtitle="8 statuses x 2 sizes x 2 registers">
          <RegisterFrame register="neutral" label="Neutral">
            <DemoRow label="md (default)">
              {STATUS_VALUES.map(status => <StatusBadge key={status} status={status} />)}
            </DemoRow>
            <DemoRow label="sm">
              {STATUS_VALUES.map(status => <StatusBadge key={status} status={status} size="sm" />)}
            </DemoRow>
          </RegisterFrame>
          <RegisterFrame register="obsidian" label="Obsidian">
            <DemoRow label="md">
              {STATUS_VALUES.map(status => <StatusBadge key={status} status={status} />)}
            </DemoRow>
            <DemoRow label="sm">
              {STATUS_VALUES.map(status => <StatusBadge key={status} status={status} size="sm" />)}
            </DemoRow>
          </RegisterFrame>
        </Section>

        {/* ═══ A2 | MerchantBadge ═════════════════════════════════ */}

        <Section title="MerchantBadge" subtitle="Reads live from useAdminData">
          <RegisterFrame register="neutral" label="Neutral">
            <DemoRow label="default">
              <MerchantBadge merchantId="monnify" />
              <MerchantBadge merchantId="paystack" />
              <MerchantBadge merchantId="unknown_id" />
            </DemoRow>
            <DemoRow label="preferred">
              <MerchantBadge merchantId="monnify" preferred />
            </DemoRow>
            <DemoRow label="sm">
              <MerchantBadge merchantId="monnify" size="sm" />
              <MerchantBadge merchantId="paystack" size="sm" preferred />
            </DemoRow>
          </RegisterFrame>
          <RegisterFrame register="obsidian" label="Obsidian">
            <DemoRow label="default">
              <MerchantBadge merchantId="monnify" />
              <MerchantBadge merchantId="paystack" preferred />
            </DemoRow>
          </RegisterFrame>
        </Section>

        {/* ═══ A2 | OperatorBadge ═════════════════════════════════ */}

        <Section title="OperatorBadge" subtitle="Non-interactive and interactive forms">
          <RegisterFrame register="neutral" label="Neutral">
            <DemoRow label="sm / md / lg">
              <OperatorBadge operator={primaryOperator} size="sm" />
              <OperatorBadge operator={primaryOperator} size="md" />
              <OperatorBadge operator={primaryOperator} size="lg" />
            </DemoRow>
            <DemoRow label="with email">
              <OperatorBadge operator={primaryOperator} size="md" showEmail />
            </DemoRow>
            <DemoRow label="interactive (onClick)">
              <OperatorBadge operator={primaryOperator} onClick={() => {}} />
            </DemoRow>
          </RegisterFrame>
          <RegisterFrame register="obsidian" label="Obsidian">
            <DemoRow label="default">
              <OperatorBadge operator={primaryOperator} />
              <OperatorBadge operator={primaryOperator} size="lg" showEmail />
            </DemoRow>
          </RegisterFrame>
        </Section>

        {/* ═══ A2 | EmptyState ════════════════════════════════════ */}

        <Section title="EmptyState" subtitle="Section and table density modes">
          <RegisterFrame register="neutral" label="Neutral">
            <DemoRow label="section density">
              <EmptyState
                icon={<IconLayers size={40} />}
                heading="No transactions yet"
                body="Transactions will appear here once users complete checkouts."
              />
            </DemoRow>
            <DemoRow label="with CTA">
              <EmptyState
                icon={<IconPlus size={40} />}
                heading="Add your first platform"
                body="Platforms integrate Remvo via server-to-server checkout initialization."
                action={<Button variant="primary" size="small">Add platform</Button>}
              />
            </DemoRow>
          </RegisterFrame>
          <RegisterFrame register="obsidian" label="Obsidian">
            <DemoRow label="section density">
              <EmptyState
                icon={<IconWallet size={40} />}
                heading="Wallet not funded"
                body="Fund the hot wallet before triggering settlement."
              />
            </DemoRow>
          </RegisterFrame>
        </Section>

        {/* ═══ A2 | Pagination ════════════════════════════════════ */}

        <Section title="Pagination" subtitle="Page-based pattern. Audit log uses cursor pagination instead.">
          <div className={styles.demoCell}>
            <Pagination totalItems={1247} pageSize={pageSize} currentPage={page} onPageChange={setPage} onPageSizeChange={setPageSize} />
          </div>
          <DemoRow label="Tiny dataset (single page)">
            <Pagination totalItems={12} pageSize={50} currentPage={1} onPageChange={() => {}} />
          </DemoRow>
          <DemoRow label="Empty dataset">
            <Pagination totalItems={0} pageSize={50} currentPage={1} onPageChange={() => {}} />
          </DemoRow>
        </Section>

        {/* ═══ A2 | FilterBar ═════════════════════════════════════ */}

        <Section title="FilterBar" subtitle="Debounced search (200ms), active filter pills, density toggle, export">
          <div className={styles.demoCell}>
            <FilterBar
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search transactions, references, platform users"
              filters={filters}
              onFilterRemove={key => setFilters(f => f.filter(p => p.key !== key))}
              onClearAll={() => setFilters([])}
              density={density}
              onDensityChange={setDensity}
              onExport={() => {}}
            />
          </div>
        </Section>

        {/* ═══ A2 | Dialogs ═══════════════════════════════════════ */}

        <Section title="ConfirmDialog + BottomSheet" subtitle="Desktop modal composes BottomSheet on mobile">
          <DemoRow label="Primary">
            <Button variant="primary" size="small" onClick={() => setConfirmPrimaryOpen(true)}>Open primary confirm</Button>
          </DemoRow>
          <DemoRow label="Destructive">
            <Button variant="primary" size="small" onClick={() => setConfirmDestructiveOpen(true)}>Open destructive confirm</Button>
          </DemoRow>
          <DemoRow label="Loading state">
            <Button variant="primary" size="small" onClick={demoLoadingConfirm}>Open async confirm</Button>
          </DemoRow>
          <DemoRow label="BottomSheet (direct)">
            <Button variant="outline" size="small" onClick={() => setSheetOpen(true)}>Open bottom sheet</Button>
          </DemoRow>
        </Section>

        {/* ═══ A2 | Skeletons ═════════════════════════════════════ */}

        <Section title="SkeletonBlock" subtitle="5 variants, on both registers">
          <RegisterFrame register="neutral" label="Neutral">
            <DemoRow label="text"><SkeletonBlock variant="text" /></DemoRow>
            <DemoRow label="lines"><SkeletonBlock variant="lines" /></DemoRow>
            <DemoRow label="card"><SkeletonBlock variant="card" /></DemoRow>
            <DemoRow label="row"><SkeletonBlock variant="row" /></DemoRow>
            <DemoRow label="circle">
              <SkeletonBlock variant="circle" size={24} />
              <SkeletonBlock variant="circle" size={32} />
              <SkeletonBlock variant="circle" size={40} />
            </DemoRow>
          </RegisterFrame>
          <RegisterFrame register="obsidian" label="Obsidian">
            <DemoRow label="text"><SkeletonBlock variant="text" /></DemoRow>
            <DemoRow label="card"><SkeletonBlock variant="card" /></DemoRow>
          </RegisterFrame>
        </Section>

        {/* ═══ A2 | Icons ═════════════════════════════════════════ */}

        <Section title="New A2 icons" subtitle="9 icons at 16 / 20 / 24 px, on both registers">
          <RegisterFrame register="neutral" label="Neutral">
            <div className={styles.iconGrid}>
              {NEW_ICONS.map(({ name, Component }) => (
                <div key={name} className={styles.iconCell}>
                  <div className={styles.iconRow}>
                    <Component size={16} />
                    <Component size={20} />
                    <Component size={24} />
                  </div>
                  <span className={styles.iconName}>{name}</span>
                </div>
              ))}
            </div>
          </RegisterFrame>
          <RegisterFrame register="obsidian" label="Obsidian">
            <div className={styles.iconGrid}>
              {NEW_ICONS.map(({ name, Component }) => (
                <div key={name} className={styles.iconCell}>
                  <div className={styles.iconRow}>
                    <Component size={16} />
                    <Component size={20} />
                    <Component size={24} />
                  </div>
                  <span className={styles.iconName}>{name}</span>
                </div>
              ))}
            </div>
          </RegisterFrame>
        </Section>
      </div>

      {/* ─── Interactive portals ─── */}

      <ConfirmDialog
        isOpen={confirmPrimaryOpen}
        onCancel={() => setConfirmPrimaryOpen(false)}
        onConfirm={async () => {
          try {
            await actions.flipPreferredMerchant(
              'cor_ng_dep_sol',
              Math.random() > 0.5 ? 'paystack' : 'monnify'
            );
          } catch (err) {
            if (typeof console !== 'undefined') console.error(err);
          } finally {
            setConfirmPrimaryOpen(false);
          }
        }}
        title="Confirm action"
        body={<>You are about to flip the preferred merchant for <strong>NG</strong> from <strong>Monnify</strong> to <strong>Paystack</strong>. This takes effect immediately for new sessions. In-flight sessions complete on their current merchant.</>}
        confirmLabel="Flip to Paystack"
        cancelLabel="Keep Monnify"
        confirmVariant="primary"
      />

      <ConfirmDialog
        isOpen={confirmDestructiveOpen}
        onCancel={() => setConfirmDestructiveOpen(false)}
        onConfirm={async () => {
          try {
            await actions.revokeOperator(2);
          } catch (err) {
            if (typeof console !== 'undefined') console.error(err);
          } finally {
            setConfirmDestructiveOpen(false);
          }
        }}
        title="Revoke operator access"
        body="Operator B will lose access immediately. Any in-flight admin sessions are terminated. This action is logged."
        confirmLabel="Revoke access"
        cancelLabel="Cancel"
        confirmVariant="destructive"
      />

      <ConfirmDialog
        isOpen={confirmLoadingOpen}
        onCancel={() => setConfirmLoadingOpen(false)}
        onConfirm={demoLoadingSubmit}
        title="Trigger settlement batch"
        body={<>Pending: <strong>12 transactions {'\u00B7'} $247.50 USDT</strong>. Batch will settle to the GE-AS Solana wallet. This action is logged.</>}
        confirmLabel="Trigger batch"
        confirmVariant="primary"
        obsidianHeader
        isLoading={confirmLoadingBusy}
      />

      <BottomSheet isOpen={sheetOpen} onClose={() => setSheetOpen(false)} title="Filter by platform">
        <ul className={styles.sheetList}>
          <li><button type="button" className={styles.sheetItem}>GE-AS</button></li>
          <li><button type="button" className={styles.sheetItem}>Show all</button></li>
        </ul>
        <p className={styles.sheetNote}>Swipe down or tap the backdrop to dismiss.</p>
      </BottomSheet>
    </AdminShell>
  );
}
