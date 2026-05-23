import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { AdminShell } from '@components/layout/admin/AdminShell';
import { WalletBalance } from '@components/ui/shared/WalletBalance';
import { SettlementTrigger } from '@components/ui/admin/SettlementTrigger';
import { CurrentRateTile } from '@components/ui/admin/CurrentRateTile';
import { StatCard } from '@components/ui/admin/StatCard';
import { WalletTopUpDrawer } from '@components/ui/admin/WalletTopUpDrawer';
import { IconLayers } from '@components/ui/icons/IconLayers';
import { IconSettlement } from '@components/ui/icons/IconSettlement';
import { IconAlert } from '@components/ui/icons/IconAlert';
import { useAdminData } from '@context/AdminContext';
import { adminPath } from '@app/adminRouter';
import { getCurrentBuyRate, getPendingBatch } from '@utils/rateEngine';
import {
  listAuditLog,
  fetchDashboardOverview,
  fetchWalletBalance,
  fetchCurrentRate,
  fetchRecentTransactions,
  fetchSettlementsPending,
  triggerSettlementBatch,
  AuthApiError,
} from '@lib/authClient';
import styles from '@styles/pages/admin/dashboard-page.module.css';

const AUTH_MODE = import.meta.env.VITE_REMVO_AUTH_MODE || 'local';
const IS_API_MODE = AUTH_MODE === 'api';

/* ──────────────────────────────────────────────────────────────────
 * DashboardPage
 *
 * Route: /admin
 * Register: obsidian (full page).
 *
 * Two-mode page:
 *
 *   API mode  | live cockpit. Four endpoints (dashboard overview,
 *               wallet balance, current rate, recent transactions)
 *               fetched in parallel via Promise.allSettled on mount,
 *               polled every 30s while the tab is visible. A
 *               manual refresh button bypasses the cache. Per-tile
 *               state preservation: a partial failure on one tile
 *               does not blank the others.
 *
 *   Mock mode | original sandbox behaviour, unchanged. Reads from
 *               useAdminData(), derives stats client-side. The
 *               dev escape (?admin in localhost) drops into this
 *               mode for screen reviews without a running API.
 *
 * Mobile critical workflow (#1): open admin, biometric login, land
 * on dashboard, see wallet + rate + settlement above fold, tap
 * SettlementTrigger, confirm, success. Under 30 seconds.
 * ────────────────────────────────────────────────────────────────── */

const RECENT_ACTIVITY_LIMIT = 6;
const RECENT_TXNS_LIMIT = 5;
const POLL_MS = 30_000;

// ─── Formatters ──────────────────────────────────────────────────

function formatUsdCompact(value) {
  if (value == null || Number.isNaN(value)) return '$0';
  if (value >= 1000) {
    return '$' + (value / 1000).toFixed(1) + 'k';
  }
  return '$' + Math.round(value).toLocaleString('en-US');
}

function formatUsdExact(value) {
  if (value == null || Number.isNaN(value)) return '$0';
  return '$' + Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatTimeAgo(iso) {
  if (!iso) return '';
  const seconds = Math.max(
    0,
    Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  );
  if (seconds < 60) return seconds < 5 ? 'just now' : `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function operatorName(entry) {
  return entry.operatorEmail?.split('@')[0] || `Operator ${entry.operatorId}`;
}

/* Compact action summary for the dashboard preview. */
function formatActionSummary(entry) {
  const actor = operatorName(entry);
  switch (entry.action) {
    case 'rate.update': {
      const before = entry.before?.buyRate;
      const after = entry.after?.buyRate;
      if (before != null && after != null) {
        return `${actor} updated rate from ${Number(before).toFixed(2)} to ${Number(after).toFixed(2)}`;
      }
      return `${actor} updated the manual rate`;
    }
    case 'rate.toggle_manual': {
      const enabled = entry.after?.isActive;
      return `${actor} ${enabled ? 'enabled' : 'disabled'} the manual rate source`;
    }
    case 'corridor.flip_merchant': {
      const after = entry.after?.preferredMerchantId || 'n/a';
      return `${actor} flipped preferred merchant to ${after}`;
    }
    case 'corridor.pause':
      return `${actor} paused a corridor`;
    case 'corridor.unpause':
      return `${actor} unpaused a corridor`;
    case 'platform.update_country_state': {
      const code = entry.after?.countryCode;
      const state = entry.after?.status;
      return `${actor} set ${code || 'country'} to ${state || 'updated'}`;
    }
    case 'settlement.trigger_batch': {
      const count = entry.metadata?.transactionCount ?? 0;
      const total = entry.metadata?.totalUsdSettled;
      const totalFragment = total != null ? ` ($${Number(total).toFixed(2)})` : '';
      return `${actor} triggered settlement batch: ${count} transaction${count === 1 ? '' : 's'}${totalFragment}`;
    }
    case 'operator.invite':
      return `${actor} invited ${entry.metadata?.email || 'a new operator'}`;
    case 'operator.invitation_accepted':
      return `${actor} accepted their invitation`;
    case 'operator.invitation_revoked':
      return `${actor} revoked an invitation${entry.metadata?.email ? ' to ' + entry.metadata.email : ''}`;
    case 'operator.revoke':
      return `${actor} revoked access for operator ${entry.entityId}`;
    case 'auth.login.password':
      return `${actor} signed in with email + code`;
    case 'auth.login.passkey':
      return `${actor} signed in with passkey`;
    case 'auth.login.failed':
      return `Failed sign-in${entry.metadata?.email ? ' for ' + entry.metadata.email : ''}`;
    case 'auth.logout':
      return `${actor} signed out`;
    case 'auth.password_set':
    case 'auth.password_changed':
      return `${actor} ${entry.action === 'auth.password_changed' ? 'changed' : 'set'} their password`;
    case 'auth.totp_enrolled':
      return `${actor} linked an authenticator`;
    case 'auth.passkey_enrolled':
      return `${actor} enrolled a new passkey`;
    case 'auth.passkey_revoked':
      return `${actor} revoked a passkey`;
    case 'rate.set_manual': {
      const buy = entry.metadata?.buyRate ?? entry.after?.buyRate;
      return buy != null
        ? `${actor} set manual rate to ${Number(buy).toFixed(2)}`
        : `${actor} set a manual rate`;
    }
    default:
      return `${actor} performed ${entry.action}`;
  }
}

// ─── API-mode state shape helpers ────────────────────────────────

/** @typedef {{data: any, loading: boolean, error: string|null}} TileState */

const INITIAL_TILE = Object.freeze({ data: null, loading: true, error: null });

/* When a poll resolves, settled.fulfilled = success; settled.rejected
 * = failure. We preserve previous data on failure so the operator
 * keeps seeing the last known value with an inline error indicator
 * instead of a flash of empty state. */
function reconcileTile(prev, settled) {
  if (settled.status === 'fulfilled') {
    return { data: settled.value, loading: false, error: null };
  }
  const reason = settled.reason;
  return {
    data: prev?.data ?? null,
    loading: false,
    error: reason?.message || 'Request failed',
  };
}

// ─── Page ────────────────────────────────────────────────────────

export function DashboardPage() {
  const navigate = useNavigate();
  const {
    wallet,
    transactions,
    platforms,
    corridors,
    rateSources,
    rateEntries,
    operators,
    auditLog,
    actions,
  } = useAdminData();

  // ─── API-mode poll state ──

  const [apiState, setApiState] = useState(() => ({
    overview: { ...INITIAL_TILE, loading: IS_API_MODE },
    wallet: { ...INITIAL_TILE, loading: IS_API_MODE },
    rate: { ...INITIAL_TILE, loading: IS_API_MODE },
    recentTxns: { ...INITIAL_TILE, loading: IS_API_MODE },
    activity: { ...INITIAL_TILE, loading: IS_API_MODE },
    pendingSettlement: { ...INITIAL_TILE, loading: IS_API_MODE },
    lastUpdated: null,
  }));

  // Stable refresh callback exposed via ref so the manual refresh
  // button can call the same path the poll uses without re-creating
  // the function on every render.
  const refreshRef = useRef(null);

  useEffect(() => {
    if (!IS_API_MODE) return undefined;

    let cancelled = false;
    let timer = null;

    async function fetchAll() {
      const results = await Promise.allSettled([
        fetchDashboardOverview(),
        fetchWalletBalance(),
        fetchCurrentRate(),
        fetchRecentTransactions({ limit: RECENT_TXNS_LIMIT }),
        listAuditLog({ limit: RECENT_ACTIVITY_LIMIT }),
        fetchSettlementsPending(),
      ]);
      if (cancelled) return;
      const [ov, wal, rate, txns, audit, pending] = results;
      setApiState((prev) => ({
        overview: reconcileTile(prev.overview, ov),
        wallet: reconcileTile(prev.wallet, wal),
        rate: reconcileTile(prev.rate, rate),
        recentTxns: reconcileTile(prev.recentTxns, txns),
        activity: reconcileTile(prev.activity, audit),
        pendingSettlement: reconcileTile(prev.pendingSettlement, pending),
        lastUpdated: new Date().toISOString(),
      }));
    }

    refreshRef.current = fetchAll;
    fetchAll();

    // Visibility-gated poll. document.hidden returns true when the
    // tab is backgrounded, the screen is locked, or the user's app
    // is hidden behind another. Polling those is wasted Helius +
    // DB load and gives the operator stale data anyway since they
    // can't see it. Resume immediately on focus.
    timer = setInterval(() => {
      if (document.visibilityState === 'visible') fetchAll();
    }, POLL_MS);

    function onVisibility() {
      if (document.visibilityState === 'visible') fetchAll();
    }
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
      refreshRef.current = null;
    };
  }, []);

  const handleManualRefresh = useCallback(() => {
    refreshRef.current?.();
  }, []);

  // Tick a clock every 10s so the "Last updated 12s ago" string
  // stays current between polls. Cheap; one setInterval at 10s,
  // one Date.now read.
  const [, setNowTick] = useState(0);
  useEffect(() => {
    if (!IS_API_MODE) return undefined;
    const t = setInterval(() => setNowTick((n) => n + 1), 10_000);
    return () => clearInterval(t);
  }, []);

  // Top-up drawer open state. Triggered from WalletBalance via
  // the existing onTopUpTap prop (currently surfaced only when the
  // wallet tier is 'underfunded'). The drawer exposes the deposit
  // address + mint so the operator can fund the pool from any
  // exchange or wallet app without leaving the dashboard.
  const [topUpOpen, setTopUpOpen] = useState(false);
  const openTopUp = useCallback(() => setTopUpOpen(true), []);
  const closeTopUp = useCallback(() => setTopUpOpen(false), []);

  // ─── Cockpit data (unified across modes) ──

  const cockpit = useMemo(() => {
    if (IS_API_MODE) {
      const ov = apiState.overview.data;
      return {
        todayVolumeUsd: ov?.today.volume_usd ?? 0,
        todayConfirmedCount: ov?.today.count ?? 0,
        todayTxnCount: ov?.today.count ?? 0,
        usdOwed: ov?.pending_settlement.total_usdt ?? 0,
        pendingCount: ov?.pending_settlement.transaction_count ?? 0,
        activeCorridors: ov?.corridors.active ?? 0,
        pausedCorridorsCount: ov?.corridors.paused ?? 0,
        totalCorridors: ov?.corridors.total ?? 0,
        webhookHealth: ov?.webhook_health_1h ?? null,
        // No corridor list in API mode | the alert banner uses count.
        pausedCorridorsList: [],
      };
    }
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const todayTxns = transactions.filter(
      (t) => new Date(t.createdAt).getTime() > cutoff
    );
    const todayConfirmed = todayTxns.filter((t) => t.status === 'confirmed');
    const todayVolumeUsd = todayConfirmed.reduce(
      (sum, t) => sum + (t.amountUsdCard || 0),
      0
    );
    const usdOwed = transactions
      .filter((t) => t.status === 'confirmed' && !t.settlementBatchId)
      .reduce((sum, t) => sum + (t.amountUsdSettled || 0), 0);
    const pausedList = corridors.filter((c) => c.status === 'paused');
    return {
      todayVolumeUsd,
      todayConfirmedCount: todayConfirmed.length,
      todayTxnCount: todayTxns.length,
      usdOwed,
      pendingCount: transactions.filter(
        (t) => t.status === 'confirmed' && !t.settlementBatchId
      ).length,
      activeCorridors: corridors.filter((c) => c.status === 'active').length,
      pausedCorridorsCount: pausedList.length,
      totalCorridors: corridors.length,
      webhookHealth: null,
      pausedCorridorsList: pausedList,
    };
  }, [
    apiState.overview.data,
    transactions,
    corridors,
  ]);

  // ─── Wallet props (mode-aware) ──

  const walletProps = useMemo(() => {
    if (IS_API_MODE) {
      const w = apiState.wallet.data;
      if (!w) return null;
      return {
        balanceUsdt: w.balanceUsdt,
        thresholdUsdt: w.thresholdUsdt,
        owedUsdt: cockpit.usdOwed,
        address: w.address,
        mint: w.mint,
        network: w.network,
      };
    }
    if (!wallet) return null;
    return {
      balanceUsdt: wallet.balanceUsdt,
      thresholdUsdt: wallet.thresholdUsdt,
      owedUsdt: cockpit.usdOwed,
      address: wallet.address,
      // The mock seed doesn't ship a mint; fall back to the canonical
      // mainnet USDT-SPL mint so the drawer has something to display.
      mint:
        wallet.mint ||
        'Es9vMFrzaCERmJfrF4H2FYD4KConky11McCe8BenwNYB',
      network: wallet.network || 'solana',
    };
  }, [apiState.wallet.data, wallet, cockpit.usdOwed]);

  // ─── Rate tile props (mode-aware) ──

  const rateTileData = useMemo(() => {
    if (IS_API_MODE) {
      const r = apiState.rate.data;
      if (!r) return null;
      const base = {
        rate: r.display_rate,
        source: r.source,
        stale: r.stale,
      };
      if (r.source === 'manual' && r.manual_entry) {
        return {
          ...base,
          enteredAt: r.manual_entry.entered_at,
          // CurrentRateTile resolves enteredBy -> displayName via the
          // operators array. In API mode, operators is the mock seed
          // and id is a string from the DB; mismatch falls back to
          // "operator" which is acceptable until Section 5 wires
          // operators. enteredBy is preserved for future resolution.
          enteredBy: r.manual_entry.entered_by,
          expiresAt: r.manual_entry.expires_at,
        };
      }
      if (r.coingecko) {
        return {
          ...base,
          midRate: Number(r.coingecko.mid_rate),
          bufferNaira: r.coingecko.buffer_naira,
          fetchedAt: r.coingecko.fetched_at,
        };
      }
      return base;
    }
    return getCurrentBuyRate({ rateSources, rateEntries });
  }, [apiState.rate.data, rateSources, rateEntries]);

  // ─── Pending batch (mock-only; settlement tile in API mode reads
  //                   the cockpit's pending_settlement aggregate) ──

  const pendingBatch = useMemo(() => {
    if (IS_API_MODE) {
      const data = apiState.pendingSettlement.data;
      if (!data || data.transaction_count === 0 || data.total_usdt <= 0) {
        return null;
      }
      return {
        platforms: data.per_platform.map((p) => ({
          id: p.platform_id,
          name: p.platform_name,
          usdtOwed: p.amount_usdt,
          transactionCount: p.transaction_count,
        })),
        total: data.total_usdt,
        nextScheduledAt: null,
      };
    }
    return getPendingBatch({ transactions, platforms });
  }, [
    apiState.pendingSettlement.data,
    transactions,
    platforms,
  ]);

  const walletSufficient =
    walletProps != null
      ? walletProps.balanceUsdt >= (pendingBatch?.total || 0)
      : false;

  // ─── Recent activity (audit slice) ──

  const recentActivity = useMemo(() => {
    if (IS_API_MODE) {
      const rows = apiState.activity.data?.items ?? [];
      return rows.map((r) => ({
        id: r.id,
        occurredAt: r.occurred_at,
        action: r.action,
        operatorEmail:
          r.actor_email ||
          (r.actor_type !== 'operator' ? `${r.actor_type}@remvo.system` : null),
        operatorId: r.actor_id,
        entityType: r.entity_type,
        entityId: r.entity_id,
        before: r.before,
        after: r.after,
        metadata: {
          ...(r.metadata || {}),
          ...(r.request_id ? { requestId: r.request_id } : {}),
        },
      }));
    }
    return auditLog.slice(0, RECENT_ACTIVITY_LIMIT);
  }, [apiState.activity.data, auditLog]);

  // ─── Recent transactions (Section 2 addition) ──

  const recentTxns = useMemo(() => {
    if (IS_API_MODE) {
      const items = apiState.recentTxns.data?.items ?? [];
      return items.map((t) => ({
        id: t.id,
        confirmedAt: t.confirmed_at,
        amountUsd: Number(t.amount_usd_credited),
        platformId: t.platform_id,
        settled: t.settlement_batch_id != null,
      }));
    }
    return transactions
      .filter((t) => t.status === 'confirmed')
      .slice(0, RECENT_TXNS_LIMIT)
      .map((t) => ({
        id: t.id,
        confirmedAt: t.confirmedAt || t.createdAt,
        amountUsd: t.amountUsdCard,
        platformId: t.platformId,
        settled: !!t.settlementBatchId,
      }));
  }, [apiState.recentTxns.data, transactions]);

  // ─── Webhook health pill tone ──

  const webhookPillTone = useMemo(() => {
    const wh = cockpit.webhookHealth;
    if (!wh || wh.total === 0) return 'neutral';
    if (wh.success_rate_pct == null) return 'neutral';
    if (wh.success_rate_pct >= 99) return 'success';
    if (wh.success_rate_pct >= 95) return 'warning';
    return 'error';
  }, [cockpit.webhookHealth]);

  // ─── Handlers ──

  const goTransactions = useCallback(
    () => navigate(adminPath('/transactions')),
    [navigate]
  );
  const goSettlements = useCallback(
    () => navigate(adminPath('/settlements')),
    [navigate]
  );
  const goCorridors = useCallback(
    () => navigate(adminPath('/corridors')),
    [navigate]
  );
  const goRateEngine = useCallback(
    () => navigate(adminPath('/rates')),
    [navigate]
  );
  const goAuditLog = useCallback(
    () => navigate(adminPath('/audit')),
    [navigate]
  );
  const goSettlement = useCallback(
    (id) => navigate(adminPath(`/settlements/${id}`)),
    [navigate]
  );

  const triggerSettlement = useCallback(async () => {
    if (!IS_API_MODE) {
      return actions.triggerSettlementBatch();
    }
    try {
      const { batch } = await triggerSettlementBatch();
      // Refresh wallet + pending so the operator's tiles reflect
      // the post-batch state immediately.
      refreshRef.current?.();
      // Surface failure-not-thrown case: a batch returned 'failed'
      // status means partial or total failure. The SettlementTrigger
      // component expects a thrown error to render its inline error
      // surface, OR a returned { id } to render success. We treat
      // 'failed' as a thrown error so the operator sees the
      // diagnostic message rather than a silent green.
      if (batch.status === 'failed') {
        const reason =
          batch.error_message || 'Solana send did not confirm. Check the batch detail page.';
        const err = new Error(reason);
        err.batchId = batch.id;
        throw err;
      }
      return { id: batch.id };
    } catch (err) {
      if (err instanceof AuthApiError) {
        // Re-throw with the server-supplied message so the trigger
        // dialog can surface it without the wrapper noise.
        const re = new Error(err.message);
        re.code = err.code;
        throw re;
      }
      throw err;
    }
  }, [actions]);

  // Consolidated tile-error indicator: any of the four tile fetches
  // failed on the last poll. Surfaces in the status strip so the
  // operator sees something is off without each tile screaming.
  const anyTileError =
    !!apiState.overview.error ||
    !!apiState.wallet.error ||
    !!apiState.rate.error ||
    !!apiState.recentTxns.error;

  // ── Render ──

  return (
    <AdminShell pageTitle="Dashboard" contentRegister="obsidian">
      <h1 className={styles.visuallyHidden}>Dashboard</h1>

      <div className={styles.page}>
        {/* ═══ Paused corridor banner ═══ */}
        {cockpit.pausedCorridorsCount > 0 && (
          <div
            className={styles.alertBanner}
            role="alert"
            aria-live="assertive"
          >
            <span className={styles.alertIcon} aria-hidden="true">
              <IconAlert size={18} />
            </span>
            <div className={styles.alertBody}>
              <strong>
                {cockpit.pausedCorridorsCount === 1
                  ? IS_API_MODE
                    ? '1 corridor is paused.'
                    : `${cockpit.pausedCorridorsList[0].id} corridor is paused.`
                  : `${cockpit.pausedCorridorsCount} corridors are paused.`}
              </strong>
              <span className={styles.alertSub}>
                New sessions on paused corridors are blocked. Resolve in Corridors.
              </span>
            </div>
            <button
              type="button"
              className={styles.alertLink}
              onClick={goCorridors}
            >
              View corridors
            </button>
          </div>
        )}

        {/* ═══ Cockpit hero row ═══ */}
        <section aria-label="Cockpit" className={styles.cockpit}>
          <h2 className={styles.visuallyHidden}>Cockpit</h2>

          <div className={styles.heroRow}>
            <WalletBalance
              balanceUsdt={walletProps ? walletProps.balanceUsdt : 0}
              thresholdUsdt={walletProps ? walletProps.thresholdUsdt : 0}
              owedUsdt={cockpit.usdOwed}
              loading={IS_API_MODE && apiState.wallet.loading && !walletProps}
              onTopUpTap={openTopUp}
            />

            <CurrentRateTile
              rate={rateTileData}
              operators={operators}
              onOpenRateEngine={goRateEngine}
            />

            <SettlementTrigger
              pendingBatch={pendingBatch}
              walletSufficient={walletSufficient}
              onTrigger={triggerSettlement}
              onViewSettlement={goSettlement}
            />
          </div>

          <div className={styles.secondaryRow}>
            <StatCard
              size="md"
              label="Today's volume"
              value={formatUsdCompact(cockpit.todayVolumeUsd)}
              context={
                IS_API_MODE
                  ? `${cockpit.todayConfirmedCount} confirmed in last 24h`
                  : `${cockpit.todayConfirmedCount} confirmed, ${cockpit.todayTxnCount} total`
              }
              icon={<IconLayers size={20} />}
              loading={IS_API_MODE && apiState.overview.loading}
              onClick={goTransactions}
            />

            <StatCard
              size="md"
              label="USDT owed"
              value={formatUsdCompact(cockpit.usdOwed)}
              context={
                cockpit.pendingCount > 0
                  ? `${cockpit.pendingCount} ${cockpit.pendingCount === 1 ? 'transaction' : 'transactions'}`
                  : 'No pending settlement'
              }
              icon={<IconSettlement size={20} />}
              status={cockpit.usdOwed > 0 ? 'warning' : 'neutral'}
              loading={IS_API_MODE && apiState.overview.loading}
              onClick={goSettlements}
            />

            <StatCard
              size="md"
              label="Active corridors"
              value={`${cockpit.activeCorridors} / ${cockpit.totalCorridors}`}
              context={
                cockpit.pausedCorridorsCount > 0
                  ? `${cockpit.pausedCorridorsCount} paused`
                  : 'All healthy'
              }
              status={cockpit.pausedCorridorsCount > 0 ? 'error' : 'success'}
              loading={IS_API_MODE && apiState.overview.loading}
              onClick={goCorridors}
            />
          </div>

          {/* ═══ Status strip (API mode only) ═══ */}
          {IS_API_MODE && (
            <div className={styles.statusStrip} role="status" aria-live="polite">
              <span className={styles.statusFresh}>
                {apiState.lastUpdated ? (
                  <>Last updated {formatTimeAgo(apiState.lastUpdated)}</>
                ) : (
                  'Loading...'
                )}
              </span>

              <button
                type="button"
                className={styles.refreshButton}
                onClick={handleManualRefresh}
                aria-label="Refresh dashboard"
              >
                Refresh
              </button>

              {cockpit.webhookHealth && cockpit.webhookHealth.total > 0 && (
                <span
                  className={[
                    styles.webhookPill,
                    styles[`webhookPill_${webhookPillTone}`],
                  ].join(' ')}
                  title={`Last hour: ${cockpit.webhookHealth.delivered} delivered, ${cockpit.webhookHealth.failed} failed, ${cockpit.webhookHealth.pending} pending, ${cockpit.webhookHealth.abandoned} abandoned`}
                >
                  <span className={styles.webhookDot} aria-hidden="true" />
                  Webhooks {cockpit.webhookHealth.delivered}/
                  {cockpit.webhookHealth.delivered +
                    cockpit.webhookHealth.failed +
                    cockpit.webhookHealth.abandoned}
                  {cockpit.webhookHealth.success_rate_pct != null && (
                    <> ({cockpit.webhookHealth.success_rate_pct}%)</>
                  )}{' '}
                  · 1h
                </span>
              )}

              {cockpit.webhookHealth && cockpit.webhookHealth.total === 0 && (
                <span className={styles.webhookPillIdle}>
                  No webhooks · 1h
                </span>
              )}

              {anyTileError && (
                <span className={styles.statusError}>
                  Some tiles couldn't refresh
                </span>
              )}
            </div>
          )}
        </section>

        {/* ═══ Recent transactions ═══ */}
        <section
          className={styles.recentTxns}
          aria-labelledby="recent-txns-heading"
        >
          <header className={styles.activityHeader}>
            <div className={styles.activityTitleGroup}>
              <h2 id="recent-txns-heading" className={styles.activityTitle}>
                Recent transactions
              </h2>
              <p className={styles.activitySubtitle}>
                Last {RECENT_TXNS_LIMIT} confirmed deposits.
              </p>
            </div>
            <button
              type="button"
              className={styles.activityViewAll}
              onClick={goTransactions}
            >
              View all
            </button>
          </header>

          {IS_API_MODE && apiState.recentTxns.loading && recentTxns.length === 0 ? (
            <div className={styles.txnsLoading} aria-hidden="true">
              <div className={styles.txnsLoadingRow} />
              <div className={styles.txnsLoadingRow} />
              <div className={styles.txnsLoadingRow} />
            </div>
          ) : recentTxns.length === 0 ? (
            <div className={styles.activityEmpty}>
              <div className={styles.activityEmptyHeading}>
                No transactions yet
              </div>
              <div className={styles.activityEmptyBody}>
                Confirmed deposits will appear here.
              </div>
            </div>
          ) : (
            <ul className={styles.txnsList}>
              {recentTxns.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    className={styles.txnsRow}
                    onClick={() => navigate(adminPath(`/transactions/${encodeURIComponent(t.id)}`))}
                  >
                    <span className={styles.txnsTime}>
                      {formatTimeAgo(t.confirmedAt)}
                    </span>
                    <span className={styles.txnsAmount}>
                      {formatUsdExact(t.amountUsd)}
                    </span>
                    <span className={styles.txnsPlatform}>{t.platformId}</span>
                    <span
                      className={[
                        styles.txnsStatus,
                        t.settled
                          ? styles.txnsStatusSettled
                          : styles.txnsStatusPending,
                      ].join(' ')}
                    >
                      {t.settled ? 'Settled' : 'Pending settlement'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ═══ Recent activity ═══ */}
        <section
          className={styles.activity}
          aria-labelledby="recent-activity-heading"
        >
          <header className={styles.activityHeader}>
            <div className={styles.activityTitleGroup}>
              <h2 id="recent-activity-heading" className={styles.activityTitle}>
                Recent activity
              </h2>
              <p className={styles.activitySubtitle}>
                Last {RECENT_ACTIVITY_LIMIT} operator actions. Open audit log for full history.
              </p>
            </div>
            <button
              type="button"
              className={styles.activityViewAll}
              onClick={goAuditLog}
            >
              View audit log
            </button>
          </header>

          {recentActivity.length === 0 ? (
            <div className={styles.activityEmpty}>
              <div className={styles.activityEmptyHeading}>No activity yet</div>
              <div className={styles.activityEmptyBody}>
                Rate updates, merchant flips, and settlement triggers will appear here.
              </div>
            </div>
          ) : (
            <ul className={styles.activityList}>
              {recentActivity.map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    className={styles.activityRow}
                    onClick={goAuditLog}
                  >
                    <span className={styles.activityTime}>
                      {formatTimeAgo(entry.occurredAt)}
                    </span>
                    <span className={styles.activityText}>
                      {formatActionSummary(entry)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Top-up drawer | rendered at page level so it overlays the
          full dashboard. Open state lives in DashboardPage so the
          surrounding cockpit stays interactive (a future Phase 7+
          can expand this to a slide-in side sheet on desktop). */}
      <WalletTopUpDrawer
        isOpen={topUpOpen}
        onClose={closeTopUp}
        address={walletProps?.address ?? null}
        network={walletProps?.network ?? 'solana'}
        mint={walletProps?.mint ?? null}
        balanceUsdt={walletProps?.balanceUsdt ?? 0}
        owedUsdt={cockpit.usdOwed}
        thresholdUsdt={walletProps?.thresholdUsdt ?? 0}
      />
    </AdminShell>
  );
}
