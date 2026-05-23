import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { AdminShell } from '@components/layout/admin/AdminShell';
import { StatusBadge } from '@components/ui/admin/StatusBadge';
import { MerchantBadge } from '@components/ui/admin/MerchantBadge';
import { EmptyState } from '@components/ui/admin/EmptyState';
import { PauseCorridorDialog } from '@components/ui/admin/PauseCorridorDialog';
import { FlipMerchantDialog } from '@components/ui/admin/FlipMerchantDialog';
import { IconCountry } from '@components/ui/icons/IconCountry';
import { useAdminData, useOperatorSession } from '@context/AdminContext';
import { useCorridorDetailApi } from '@hooks/useCorridorsApi';
import {
  pauseCorridor as apiPauseCorridor,
  unpauseCorridor as apiUnpauseCorridor,
  flipCorridorMerchant as apiFlipCorridorMerchant,
} from '@lib/authClient';
import { adminPath } from '@app/adminRouter';
import styles from '@styles/pages/admin/corridor-detail-page.module.css';

/* ──────────────────────────────────────────────────────────────────
 * CorridorDetailPage
 *
 * Route: /admin/corridors/:id
 * Register: obsidian.
 *
 * Dual mode:
 *   Mock mode | data from useAdminData(). Mutation buttons disabled.
 *   API mode  | data from useCorridorDetailApi(id). Pause/unpause +
 *              flip-merchant buttons live (owner only).
 * ────────────────────────────────────────────────────────────────── */

const COUNTRY_NAMES = {
  NG: 'Nigeria', GH: 'Ghana', KE: 'Kenya', UG: 'Uganda',
  ZA: 'South Africa', EG: 'Egypt', TZ: 'Tanzania', CI: 'Cote d\'Ivoire',
};

const NETWORK_LABELS = {
  solana: 'Solana (SPL)',
  tron: 'TRON (TRC-20)',
  erc20: 'Ethereum (ERC-20)',
};

const METHOD_LABELS = {
  bank_transfer: 'Bank transfer',
  mobile_money: 'Mobile money',
  mpesa: 'M-Pesa',
};

function formatAbsolute(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
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

function IconArrowLeft({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Section({ title, aside, children }) {
  return (
    <section className={styles.section}>
      <header className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        {aside && <div>{aside}</div>}
      </header>
      <div className={styles.sectionBody}>{children}</div>
    </section>
  );
}

function Row({ label, value, mono = false }) {
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <span className={[styles.rowValue, mono ? styles.rowValueMono : ''].filter(Boolean).join(' ')}>
        {value}
      </span>
    </div>
  );
}

export function CorridorDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const mock = useAdminData();
  const api = useCorridorDetailApi(id);
  const session = useOperatorSession();
  const role = session?.operator?.role || null;
  const isOwner = role === 'owner';

  const isApiMode = api?.isApiMode === true;
  const apiError = api?.error;
  const loading = api?.loading;

  // Pull the slices the page consumes from API or mock.
  const corridor = isApiMode
    ? api.corridor
    : mock.corridors.find(c => c.id === id);
  const corridorMerchants = isApiMode ? api.corridorMerchants : mock.corridorMerchants;
  const merchants = isApiMode ? api.merchants : mock.merchants;
  const auditLog = isApiMode ? api.auditLog : mock.auditLog;
  const operators = isApiMode ? api.operators : mock.operators;

  // ─── Mutation state ───────────────────────────────────────────
  const [pauseDialog, setPauseDialog] = useState({ open: false, action: 'pause' });
  const [flipDialog, setFlipDialog] = useState({ open: false });
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState(null);

  async function handlePauseConfirm(reason) {
    if (!corridor) return;
    setBusy(true);
    setActionError(null);
    try {
      const next = pauseDialog.action === 'pause'
        ? await apiPauseCorridor(corridor.id, { reason })
        : await apiUnpauseCorridor(corridor.id);
      api?.setData?.(next);
      setPauseDialog({ open: false, action: 'pause' });
    } catch (err) {
      setActionError(err?.message || 'Could not update corridor.');
    } finally {
      setBusy(false);
    }
  }

  async function handleFlipConfirm({ new_merchant_id, reason }) {
    if (!corridor) return;
    setBusy(true);
    setActionError(null);
    try {
      const next = await apiFlipCorridorMerchant(corridor.id, {
        new_merchant_id,
        reason,
      });
      api?.setData?.(next);
      setFlipDialog({ open: false });
    } catch (err) {
      setActionError(err?.message || 'Could not flip merchant.');
    } finally {
      setBusy(false);
    }
  }

  const merchantLinks = useMemo(() => {
    if (!corridor) return [];
    return corridorMerchants
      .filter(cm => cm.corridorId === corridor.id)
      .sort((a, b) => (a.priority || 99) - (b.priority || 99));
  }, [corridorMerchants, corridor]);

  const activity = useMemo(() => {
    if (!corridor) return [];
    return auditLog
      .filter(e => e.entityType === 'corridor' && e.entityId === corridor.id)
      .slice(0, 10);
  }, [auditLog, corridor]);

  // ─── Loading / error / not-found gates ─────────────────────────

  if (loading && !corridor) {
    return (
      <AdminShell pageTitle="Corridor" contentRegister="obsidian">
        <div className={styles.page}>
          <button type="button" className={styles.backLink} onClick={() => navigate(adminPath('/corridors'))}>
            <IconArrowLeft size={14} /> Corridors
          </button>
          <div className={styles.loadingNote}>Loading corridor...</div>
        </div>
      </AdminShell>
    );
  }

  if (apiError && !corridor) {
    return (
      <AdminShell pageTitle="Corridor" contentRegister="obsidian">
        <div className={styles.page}>
          <button type="button" className={styles.backLink} onClick={() => navigate(adminPath('/corridors'))}>
            <IconArrowLeft size={14} /> Corridors
          </button>
          <EmptyState
            icon={<IconCountry size={24} />}
            heading={apiError.status === 404 ? 'Corridor not found' : 'Could not load corridor'}
            body={apiError.message}
          />
        </div>
      </AdminShell>
    );
  }

  if (!corridor) {
    return (
      <AdminShell pageTitle="Corridor" contentRegister="obsidian">
        <div className={styles.page}>
          <button type="button" className={styles.backLink} onClick={() => navigate(adminPath('/corridors'))}>
            <IconArrowLeft size={14} /> Corridors
          </button>
          <EmptyState
            icon={<IconCountry size={24} />}
            heading="Corridor not found"
            body={`No corridor matches ID "${id}".`}
          />
        </div>
      </AdminShell>
    );
  }

  const country = COUNTRY_NAMES[corridor.countryCode] || corridor.countryCode;
  const isPaused = corridor.status === 'paused';
  const canPauseToggle = isApiMode && isOwner;
  const canFlip = isApiMode && isOwner;

  const preferredId = merchantLinks.find(cm => cm.isPreferred)?.merchantId
    || corridor.preferredMerchantId
    || null;

  return (
    <AdminShell pageTitle="Corridor" contentRegister="obsidian">
      <div className={styles.page}>
        <button
          type="button"
          className={styles.backLink}
          onClick={() => navigate(adminPath('/corridors'))}
        >
          <IconArrowLeft size={14} /> Corridors
        </button>

        <header className={styles.pageHeader}>
          <div className={styles.pageHeaderMain}>
            <div className={styles.signatureRow}>
              <span className={styles.countryBadge}>{corridor.countryCode}</span>
              <h1 className={styles.pageTitle}>
                {corridor.sourceCurrency} {METHOD_LABELS[corridor.sourceMethod] || corridor.sourceMethod}
                <span className={styles.titleArrow}>to</span>
                {corridor.destinationAsset} {NETWORK_LABELS[corridor.destinationNetwork] || corridor.destinationNetwork}
              </h1>
            </div>
            <p className={styles.pageSubtitle}>
              <span className={styles.mono}>{corridor.id}</span> | {country} | {corridor.direction}
            </p>
          </div>
          <div className={styles.pageHeaderAside}>
            <StatusBadge status={corridor.status} size="md" />
          </div>
        </header>

        {actionError && (
          <div className={styles.actionErrorBanner} role="alert">
            {actionError}
          </div>
        )}

        {/* ═══ Merchants ═══ */}
        <Section
          title="Merchants"
          aside={
            <div className={styles.sectionAsideRow}>
              <span className={styles.sectionCounter}>{merchantLinks.length} attached</span>
              {canFlip && (
                <button
                  type="button"
                  className={styles.smallActionPrimary}
                  onClick={() => setFlipDialog({ open: true })}
                >
                  Flip preferred
                </button>
              )}
            </div>
          }
        >
          {merchantLinks.length === 0 ? (
            <div className={styles.emptyLine}>No merchants attached to this corridor.</div>
          ) : (
            <ul className={styles.merchantList}>
              {merchantLinks.map(cm => {
                const m = merchants.find(mm => mm.id === cm.merchantId);
                if (!m) return null;
                return (
                  <li key={cm.id} className={styles.merchantItem}>
                    <div className={styles.merchantIdent}>
                      <span className={styles.priorityNum}>{cm.priority}</span>
                      <MerchantBadge merchantId={m.id} size="sm" preferred={cm.isPreferred} showStatus={false} />
                    </div>
                    <div className={styles.merchantMeta}>
                      <StatusBadge status={cm.status} size="sm" />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>

        {/* ═══ Limits + Network ═══ */}
        <div className={styles.twoCol}>
          <Section title="Limits">
            <Row label="Min deposit" value={`$${corridor.minDepositUsd}`} mono />
            <Row label="Max deposit" value={`$${Number(corridor.maxDepositUsd).toLocaleString()}`} mono />
          </Section>

          <Section title="Route">
            <Row label="Country" value={country} />
            <Row label="Source" value={`${corridor.sourceCurrency} (${METHOD_LABELS[corridor.sourceMethod] || corridor.sourceMethod})`} />
            <Row label="Destination" value={`${corridor.destinationAsset} (${NETWORK_LABELS[corridor.destinationNetwork] || corridor.destinationNetwork})`} />
            <Row label="Direction" value={corridor.direction} />
          </Section>
        </div>

        {/* ═══ State controls ═══ */}
        <Section title="State">
          <Row label="Current status" value={<StatusBadge status={corridor.status} size="sm" />} />
          <Row label="Created" value={
            <span className={styles.timePair}>
              <span className={styles.timePairMono}>{formatAbsolute(corridor.createdAt)}</span>
              <span className={styles.timePairMuted}>{formatTimeAgo(corridor.createdAt)}</span>
            </span>
          } />
          <Row label="Last updated" value={
            <span className={styles.timePair}>
              <span className={styles.timePairMono}>{formatAbsolute(corridor.updatedAt)}</span>
              <span className={styles.timePairMuted}>{formatTimeAgo(corridor.updatedAt)}</span>
            </span>
          } />
          <div className={styles.stateActions}>
            {canPauseToggle ? (
              isPaused ? (
                <button
                  type="button"
                  className={styles.stateBtnUnpause}
                  onClick={() => setPauseDialog({ open: true, action: 'unpause' })}
                >
                  Unpause corridor
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.stateBtnPause}
                  onClick={() => setPauseDialog({ open: true, action: 'pause' })}
                >
                  Pause corridor
                </button>
              )
            ) : (
              <button
                type="button"
                className={styles.stateBtnPause}
                disabled
                aria-disabled="true"
                title={isApiMode ? 'Owner role required' : 'Available with backend'}
              >
                {isPaused ? 'Unpause corridor' : 'Pause corridor'}
              </button>
            )}
          </div>
        </Section>

        {/* ═══ Activity ═══ */}
        <Section title="Activity">
          {activity.length === 0 ? (
            <div className={styles.emptyLine}>No audit entries yet for this corridor.</div>
          ) : (
            <ul className={styles.activityList}>
              {activity.map(entry => {
                const op = operators.find(o => o.id === entry.operatorId);
                const name = op?.displayName || entry.operatorEmail || `Operator ${entry.operatorId}`;
                return (
                  <li key={entry.id} className={styles.activityItem}>
                    <span className={styles.activityTime}>{formatTimeAgo(entry.occurredAt)}</span>
                    <span className={styles.activityText}>
                      <strong>{name}</strong> performed <span className={styles.mono}>{entry.action}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>
      </div>

      {/* ═══ Dialogs ═══ */}
      <PauseCorridorDialog
        isOpen={pauseDialog.open}
        action={pauseDialog.action}
        corridor={corridor}
        onCancel={() => setPauseDialog({ open: false, action: 'pause' })}
        onConfirm={handlePauseConfirm}
        isLoading={busy}
        error={actionError}
      />

      <FlipMerchantDialog
        isOpen={flipDialog.open}
        corridor={corridor}
        currentPreferred={preferredId}
        merchants={merchants}
        onCancel={() => setFlipDialog({ open: false })}
        onConfirm={handleFlipConfirm}
        isLoading={busy}
        error={actionError}
      />
    </AdminShell>
  );
}
