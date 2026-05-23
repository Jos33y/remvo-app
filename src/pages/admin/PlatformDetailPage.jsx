import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { AdminShell } from '@components/layout/admin/AdminShell';
import { StatusBadge } from '@components/ui/admin/StatusBadge';
import { MerchantBadge } from '@components/ui/admin/MerchantBadge';
import { EmptyState } from '@components/ui/admin/EmptyState';
import { CopyableRow } from '@components/ui/shared/CopyableRow';
import { CountryStateDrawer } from '@components/ui/admin/CountryStateDrawer';
import { FeesDialog } from '@components/ui/admin/FeesDialog';
import { SettlementWalletDialog } from '@components/ui/admin/SettlementWalletDialog';
import { RotateApiKeyDialog } from '@components/ui/admin/RotateApiKeyDialog';
import { WebhookTestDialog } from '@components/ui/admin/WebhookTestDialog';
import { PausePlatformDialog } from '@components/ui/admin/PausePlatformDialog';
import { useToast } from '@components/ui/admin/ToastProvider';
import { CountryFlag } from '@components/ui/icons/CountryFlag';
import { IconBuilding } from '@components/ui/icons/IconBuilding';
import { IconKebab } from '@components/ui/icons/IconKebab';
import { useAdminData, useOperatorSession } from '@context/AdminContext';
import { adminPath } from '@app/adminRouter';
import {
  AFRICAN_COUNTRIES,
  countryName,
} from '@utils/constants';
import {
  fetchPlatform,
  updatePlatformIdentity,
  updatePlatformFees,
  validateSettlementWallet as apiValidateWallet,
  updateSettlementWallet as apiUpdateWallet,
  updatePlatformCountry,
  rotatePlatformApiKey,
  pausePlatform as apiPausePlatform,
  unpausePlatform as apiUnpausePlatform,
  archivePlatform as apiArchivePlatform,
  testPlatformWebhook,
  AuthApiError,
} from '@lib/authClient';
import styles from '@styles/pages/admin/platform-detail-page.module.css';

/* ──────────────────────────────────────────────────────────────────
 * PlatformDetailPage
 *
 * Route: /admin/platforms/:id
 * Register: neutral.
 *
 * Dual-mode (mock vs api). In API mode, all actions hit the
 * authClient functions; in mock mode, they hit useAdminData()
 * actions which mutate local state and append audit. Both flows
 * end with a re-fetch of the platform to keep view in sync with
 * server state (covers the case where the operator is editing
 * concurrently from another tab).
 *
 * Sections (all in scope, no deferments):
 *   1. Header             | name, id, status pill, kebab menu
 *   2. Identity           | inline edit, save bar appears on dirty
 *   3. Integration        | API key (rotate), webhook URL (test)
 *   4. Countries          | matrix, click row to edit via drawer
 *   5. Fees               | owner-only Edit button | dialog
 *   6. Settlement         | owner-only Edit button | dialog
 *   7. Activity           | filtered audit log slice
 *
 * Permission model:
 *   operator | identity, country state, webhook test
 *   owner    | fees, settlement_wallet, API key rotation, pause/archive
 *
 * Operator-only attempts on owner-gated controls don't render the
 * button (defence in depth: the server enforces too).
 * ────────────────────────────────────────────────────────────────── */

const AUTH_MODE = import.meta.env.VITE_REMVO_AUTH_MODE || 'local';
const IS_API_MODE = AUTH_MODE === 'api';

// ─── Formatters ──────────────────────────────────────────────────

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

// ─── API row -> view model ───────────────────────────────────────
//
//   Same adapter as PlatformsPage, kept locally so a future schema
//   shift doesn't ripple across pages.

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
      row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updatedAt:
      row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
  };
}

// ─── UI helpers ──────────────────────────────────────────────────

function IconArrowLeft({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M10 3L5 8l5 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Section({ title, aside, children, id }) {
  return (
    <section className={styles.section} aria-labelledby={id}>
      <header className={styles.sectionHeader}>
        <h2 id={id} className={styles.sectionTitle}>{title}</h2>
        {aside && <div className={styles.sectionAside}>{aside}</div>}
      </header>
      <div className={styles.sectionBody}>{children}</div>
    </section>
  );
}

function Row({ label, value, mono = false, muted = false }) {
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <span
        className={[
          styles.rowValue,
          mono ? styles.rowValueMono : '',
          muted ? styles.rowValueMuted : '',
        ].filter(Boolean).join(' ')}
      >
        {value}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  PAGE
// ═══════════════════════════════════════════════════════════════════

export function PlatformDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const mock = useAdminData();
  const { operator } = useOperatorSession();
  const toast = useToast();

  const isOwner = operator?.role === 'owner';

  // ── Source platform (mock or api) ────────────────────────────

  const [apiPlatform, setApiPlatform] = useState(null);
  const [apiLoading, setApiLoading] = useState(IS_API_MODE);
  const [apiError, setApiError] = useState(null);

  const platform = useMemo(() => {
    if (!IS_API_MODE) return mock.platforms.find((p) => p.id === id);
    return apiPlatform;
  }, [mock.platforms, apiPlatform, id]);

  const loadPlatform = useCallback(async () => {
    if (!IS_API_MODE) return;
    setApiLoading(true);
    setApiError(null);
    try {
      const row = await fetchPlatform(id);
      setApiPlatform(toViewModel(row));
    } catch (err) {
      if (err instanceof AuthApiError && err.status === 401) {
        navigate(adminPath('/login'));
        return;
      }
      if (err instanceof AuthApiError && err.status === 404) {
        setApiPlatform(null);
        setApiError(null);
      } else {
        setApiError(err?.message || 'Could not load platform.');
      }
    } finally {
      setApiLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadPlatform();
  }, [loadPlatform]);

  // ── Identity edit (inline) ───────────────────────────────────

  const [identityDraft, setIdentityDraft] = useState(null);
  const [savingIdentity, setSavingIdentity] = useState(false);
  const [identityError, setIdentityError] = useState(null);

  // Initialise draft when platform loads.
  useEffect(() => {
    if (platform && identityDraft === null) {
      setIdentityDraft({
        name: platform.displayName || '',
        webhook_url: platform.webhookUrl || '',
        settlement_mode: platform.settlementMode || 'batch',
      });
    }
  }, [platform, identityDraft]);

  const identityDirty =
    identityDraft != null &&
    platform != null &&
    (identityDraft.name !== platform.displayName ||
      identityDraft.webhook_url !== platform.webhookUrl ||
      identityDraft.settlement_mode !== platform.settlementMode);

  const handleSaveIdentity = useCallback(async () => {
    if (!identityDirty) return;
    setSavingIdentity(true);
    setIdentityError(null);
    try {
      const patch = {};
      if (identityDraft.name !== platform.displayName) patch.name = identityDraft.name;
      if (identityDraft.webhook_url !== platform.webhookUrl) patch.webhook_url = identityDraft.webhook_url;
      if (identityDraft.settlement_mode !== platform.settlementMode) patch.settlement_mode = identityDraft.settlement_mode;
      if (IS_API_MODE) {
        const row = await updatePlatformIdentity(id, patch);
        setApiPlatform(toViewModel(row));
      } else {
        await mock.actions.updatePlatformIdentity(id, patch);
      }
      toast.success('Platform identity updated');
    } catch (err) {
      setIdentityError(err?.details?.message || err?.message || 'Save failed.');
    } finally {
      setSavingIdentity(false);
    }
  }, [identityDirty, identityDraft, platform, id, mock.actions, toast]);

  const handleCancelIdentity = useCallback(() => {
    if (!platform) return;
    setIdentityDraft({
      name: platform.displayName || '',
      webhook_url: platform.webhookUrl || '',
      settlement_mode: platform.settlementMode || 'batch',
    });
    setIdentityError(null);
  }, [platform]);

  // Re-init draft when platform updates externally (after save).
  useEffect(() => {
    if (!platform || savingIdentity) return;
    if (
      identityDraft &&
      identityDraft.name === platform.displayName &&
      identityDraft.webhook_url === platform.webhookUrl &&
      identityDraft.settlement_mode === platform.settlementMode
    ) return;
    if (identityDraft && !identityDirty) {
      // No-op: dirty check above keeps us from clobbering a dirty draft.
    }
  }, [platform, identityDraft, savingIdentity, identityDirty]);

  // ── Dialog state ─────────────────────────────────────────────

  const [feesOpen, setFeesOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [rotateOpen, setRotateOpen] = useState(false);
  const [webhookOpen, setWebhookOpen] = useState(false);
  const [pauseAction, setPauseAction] = useState(null);  // 'pause' | 'unpause' | 'archive' | null
  const [drawerCountry, setDrawerCountry] = useState(null);  // ISO code or null
  const [kebabOpen, setKebabOpen] = useState(false);

  // Close kebab on outside click
  useEffect(() => {
    if (!kebabOpen) return undefined;
    function onClick() {
      setKebabOpen(false);
    }
    setTimeout(() => document.addEventListener('click', onClick), 0);
    return () => document.removeEventListener('click', onClick);
  }, [kebabOpen]);

  // ── Mutation handlers ────────────────────────────────────────

  const handleSaveFees = useCallback(async (pct) => {
    if (IS_API_MODE) {
      const row = await updatePlatformFees(id, { platform_fee_pct: pct });
      setApiPlatform(toViewModel(row));
    } else {
      await mock.actions.updatePlatformFees(id, { platform_fee_pct: pct });
    }
    toast.success('Platform fee updated', `${Number(pct).toFixed(2)}%`);
  }, [id, mock.actions, toast]);

  const handleValidateWallet = useCallback(async (input) => {
    if (IS_API_MODE) {
      return apiValidateWallet(id, input);
    }
    return mock.actions.validateSettlementWallet(input);
  }, [id, mock.actions]);

  const handleSaveWallet = useCallback(async (input) => {
    if (IS_API_MODE) {
      const row = await apiUpdateWallet(id, input);
      setApiPlatform(toViewModel(row));
    } else {
      await mock.actions.updatePlatformSettlementWallet(id, input);
    }
    toast.success('Settlement wallet updated');
  }, [id, mock.actions, toast]);

  const handleSaveCountry = useCallback(async (cc, patch) => {
    if (IS_API_MODE) {
      const row = await updatePlatformCountry(id, cc, patch);
      setApiPlatform(toViewModel(row));
    } else {
      await mock.actions.updateCountryConfig(id, cc, patch);
    }
    toast.success('Country settings saved', countryName(cc));
  }, [id, mock.actions, toast]);

  const handleRotateApiKey = useCallback(async () => {
    if (IS_API_MODE) {
      const result = await rotatePlatformApiKey(id);
      setApiPlatform(toViewModel(result.platform));
      return result;
    }
    return mock.actions.rotatePlatformApiKey(id);
  }, [id, mock.actions]);

  const handleTestWebhook = useCallback(async () => {
    if (IS_API_MODE) return testPlatformWebhook(id);
    return mock.actions.testPlatformWebhook(id);
  }, [id, mock.actions]);

  const handleStatusChange = useCallback(async (action, reason) => {
    if (IS_API_MODE) {
      let row;
      if (action === 'pause') row = await apiPausePlatform(id, { reason });
      else if (action === 'unpause') row = await apiUnpausePlatform(id);
      else if (action === 'archive') row = await apiArchivePlatform(id, { reason });
      if (row) setApiPlatform(toViewModel(row));
    } else {
      if (action === 'pause') await mock.actions.pausePlatform(id, reason);
      else if (action === 'unpause') await mock.actions.unpausePlatform(id);
      else if (action === 'archive') await mock.actions.archivePlatform(id, reason);
    }
    if (action === 'pause')   toast.success('Platform paused', 'New sessions are blocked.');
    if (action === 'unpause') toast.success('Platform resumed');
    if (action === 'archive') toast.success('Platform archived');
  }, [id, mock.actions, toast]);

  // ── Derived ──────────────────────────────────────────────────

  const sortedCountries = useMemo(() => {
    if (!platform) return [];
    const order = { active: 0, coming_soon: 1, paused: 2 };
    // Show every country in AFRICAN_COUNTRIES ever, even if not in
    // platform config | gives the operator a way to ADD a country
    // by tapping its row and switching to active/coming_soon.
    const configured = new Set(Object.keys(platform.countries || {}));
    const codes = AFRICAN_COUNTRIES.map((c) => c.code);
    return codes
      .map((code) => {
        const config = platform.countries?.[code] ?? null;
        return { code, config };
      })
      .sort((a, b) => {
        const aRank = a.config ? order[a.config.status] ?? 9 : 10;
        const bRank = b.config ? order[b.config.status] ?? 9 : 10;
        if (aRank !== bRank) return aRank - bRank;
        return a.code.localeCompare(b.code);
      });
  }, [platform]);

  const activeCount = useMemo(
    () => sortedCountries.filter((c) => c.config?.status === 'active').length,
    [sortedCountries]
  );

  // Mock activity for the bottom section. API mode reads from the
  // global audit log via mock.auditLog (same in both modes since the
  // dashboard recent-activity widget already uses live audit).
  const activity = useMemo(() => {
    if (!platform) return [];
    return (mock.auditLog || [])
      .filter((e) => e.entityType === 'platform' && e.entityId === platform.id)
      .slice(0, 10);
  }, [mock.auditLog, platform]);

  // Available merchants for the country drawer's checkbox list.
  const merchants = useMemo(() => mock.merchants || [], [mock.merchants]);

  // ── Render: not found ────────────────────────────────────────

  if ((!IS_API_MODE && !platform) || (IS_API_MODE && !apiLoading && !platform && !apiError)) {
    return (
      <AdminShell pageTitle="Platform" contentRegister="neutral">
        <div className={styles.page}>
          <button
            type="button"
            className={styles.backLink}
            onClick={() => navigate(adminPath('/platforms'))}
          >
            <IconArrowLeft size={14} /> Platforms
          </button>
          <EmptyState
            icon={<IconBuilding size={24} />}
            heading="Platform not found"
            body={`No platform matches ID "${id}".`}
          />
        </div>
      </AdminShell>
    );
  }

  // Skeleton while API loads
  if (IS_API_MODE && apiLoading && !platform) {
    return (
      <AdminShell pageTitle="Platform" contentRegister="neutral">
        <div className={styles.page}>
          <button
            type="button"
            className={styles.backLink}
            onClick={() => navigate(adminPath('/platforms'))}
          >
            <IconArrowLeft size={14} /> Platforms
          </button>
          <div className={styles.skeleton} aria-busy="true" />
        </div>
      </AdminShell>
    );
  }

  if (IS_API_MODE && apiError && !platform) {
    return (
      <AdminShell pageTitle="Platform" contentRegister="neutral">
        <div className={styles.page}>
          <button
            type="button"
            className={styles.backLink}
            onClick={() => navigate(adminPath('/platforms'))}
          >
            <IconArrowLeft size={14} /> Platforms
          </button>
          <div className={styles.errorBanner} role="alert">
            {apiError}
            <button
              type="button"
              onClick={loadPlatform}
              className={styles.errorRetry}
            >
              Retry
            </button>
          </div>
        </div>
      </AdminShell>
    );
  }

  if (!platform) return null;

  // ── Render: main ─────────────────────────────────────────────

  return (
    <AdminShell pageTitle="Platform" contentRegister="neutral">
      <div className={styles.page}>
        <button
          type="button"
          className={styles.backLink}
          onClick={() => navigate(adminPath('/platforms'))}
        >
          <IconArrowLeft size={14} /> Platforms
        </button>

        {/* ─── Header ─────────────────────────────────────────── */}

        <header className={styles.pageHeader}>
          <div className={styles.pageHeaderMain}>
            <h1 className={styles.pageTitle}>{platform.displayName}</h1>
            <p className={styles.pageSubtitle}>
              <span className={styles.mono}>{platform.id}</span> | {activeCount}{' '}
              active {activeCount === 1 ? 'country' : 'countries'}
            </p>
          </div>
          <div className={styles.pageHeaderAside}>
            <StatusBadge status={platform.status || 'active'} size="md" />
            {isOwner && (
              <div className={styles.kebabWrap}>
                <button
                  type="button"
                  className={styles.kebabButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    setKebabOpen((v) => !v);
                  }}
                  aria-label="Platform actions"
                  aria-expanded={kebabOpen}
                  aria-haspopup="menu"
                >
                  <IconKebab size={16} />
                </button>
                {kebabOpen && (
                  <div
                    className={styles.kebabMenu}
                    role="menu"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {platform.status === 'active' && (
                      <button
                        type="button"
                        role="menuitem"
                        className={styles.kebabItem}
                        onClick={() => {
                          setKebabOpen(false);
                          setPauseAction('pause');
                        }}
                      >
                        Pause platform
                      </button>
                    )}
                    {platform.status === 'paused' && (
                      <button
                        type="button"
                        role="menuitem"
                        className={styles.kebabItem}
                        onClick={() => {
                          setKebabOpen(false);
                          setPauseAction('unpause');
                        }}
                      >
                        Resume platform
                      </button>
                    )}
                    {platform.status !== 'disabled' && (
                      <button
                        type="button"
                        role="menuitem"
                        className={`${styles.kebabItem} ${styles.kebabItemDanger}`}
                        onClick={() => {
                          setKebabOpen(false);
                          setPauseAction('archive');
                        }}
                      >
                        Archive
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* ─── Identity (inline edit) ─────────────────────────── */}

        <Section id="sec-identity" title="Identity">
          <Row label="Platform ID" value={<span className={styles.mono}>{platform.id}</span>} />

          <label className={styles.editField}>
            <span className={styles.editFieldLabel}>Display name</span>
            <input
              type="text"
              value={identityDraft?.name ?? ''}
              onChange={(e) =>
                setIdentityDraft((d) => ({ ...(d || {}), name: e.target.value }))
              }
              className={styles.editInput}
              maxLength={64}
            />
          </label>

          <label className={styles.editField}>
            <span className={styles.editFieldLabel}>Webhook URL</span>
            <input
              type="url"
              value={identityDraft?.webhook_url ?? ''}
              onChange={(e) =>
                setIdentityDraft((d) => ({
                  ...(d || {}),
                  webhook_url: e.target.value,
                }))
              }
              className={`${styles.editInput} ${styles.editInputMono}`}
              maxLength={2048}
              spellCheck="false"
              autoCorrect="off"
            />
            <button
              type="button"
              className={styles.inlineAction}
              onClick={() => setWebhookOpen(true)}
            >
              Test webhook
            </button>
          </label>

          <label className={styles.editField}>
            <span className={styles.editFieldLabel}>Settlement mode</span>
            <select
              value={identityDraft?.settlement_mode ?? 'batch'}
              onChange={(e) =>
                setIdentityDraft((d) => ({
                  ...(d || {}),
                  settlement_mode: e.target.value,
                }))
              }
              className={styles.editSelect}
            >
              <option value="batch">Daily batch</option>
              <option value="per_transaction">Per transaction</option>
            </select>
          </label>

          <Row
            label="Created"
            value={
              <span className={styles.timePair}>
                <span className={styles.timePairMono}>{formatAbsolute(platform.createdAt)}</span>
                <span className={styles.timePairMuted}>{formatTimeAgo(platform.createdAt)}</span>
              </span>
            }
          />
          <Row
            label="Last updated"
            value={
              <span className={styles.timePair}>
                <span className={styles.timePairMono}>{formatAbsolute(platform.updatedAt)}</span>
                <span className={styles.timePairMuted}>{formatTimeAgo(platform.updatedAt)}</span>
              </span>
            }
          />

          {(identityDirty || identityError) && (
            <div className={styles.saveBar} role="region" aria-label="Unsaved identity changes">
              <span className={styles.saveBarText}>
                {identityError ? identityError : 'Unsaved changes'}
              </span>
              <div className={styles.saveBarActions}>
                <button
                  type="button"
                  onClick={handleCancelIdentity}
                  disabled={savingIdentity}
                  className={styles.saveBarCancel}
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleSaveIdentity}
                  disabled={savingIdentity || !identityDirty}
                  className={styles.saveBarSave}
                >
                  {savingIdentity ? 'Saving' : 'Save changes'}
                </button>
              </div>
            </div>
          )}
        </Section>

        {/* ─── Integration ─────────────────────────────────────── */}

        <Section
          id="sec-integration"
          title="Integration"
          aside={
            isOwner && (
              <button
                type="button"
                onClick={() => setRotateOpen(true)}
                className={styles.dangerButton}
              >
                Rotate API key
              </button>
            )
          }
        >
          <Row
            label="API key"
            value={<span className={styles.mono}>{platform.apiKeyRef}</span>}
            mono
          />
          <CopyableRow
            label="Webhook URL"
            value={platform.webhookUrl}
            valueVariant="sans"
            ariaName="webhook URL"
          />
          <Row
            label="Webhook test"
            value={
              <button
                type="button"
                className={styles.linkButton}
                onClick={() => setWebhookOpen(true)}
              >
                Send a test payload
              </button>
            }
          />
        </Section>

        {/* ─── Countries ─────────────────────────────────────── */}

        <Section
          id="sec-countries"
          title="Countries"
          aside={
            <span className={styles.sectionCounter}>
              {activeCount} of {AFRICAN_COUNTRIES.length} active
            </span>
          }
        >
          <div className={styles.countryGrid}>
            {sortedCountries.map(({ code, config }) => (
              <button
                type="button"
                key={code}
                className={styles.countryRow}
                onClick={() => setDrawerCountry(code)}
                aria-label={`Edit ${countryName(code)} settings`}
              >
                <div className={styles.countryIdent}>
                  <CountryFlag code={code} size={20} />
                  <div className={styles.countryNames}>
                    <span className={styles.countryName}>{countryName(code)}</span>
                    <span className={styles.countryCode}>{code}</span>
                  </div>
                </div>
                <div className={styles.countryMeta}>
                  {config?.status === 'active' && config?.preferredMerchant && (
                    <MerchantBadge
                      merchantId={config.preferredMerchant}
                      size="sm"
                      preferred
                      showStatus={false}
                    />
                  )}
                  {config ? (
                    <StatusBadge status={config.status} size="sm" />
                  ) : (
                    <span className={styles.notConfigured}>Not configured</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </Section>

        {/* ─── Fees + Settlement ─────────────────────────────── */}

        <div className={styles.twoCol}>
          <Section
            id="sec-fees"
            title="Fees"
            aside={
              isOwner && (
                <button
                  type="button"
                  onClick={() => setFeesOpen(true)}
                  className={styles.editAction}
                >
                  Edit
                </button>
              )
            }
          >
            <Row
              label="Platform fee"
              value={`${Number(platform.skimPercent ?? 0).toFixed(2)}%`}
              mono
            />
            <p className={styles.subtle}>
              Deducted from each settled USD before payout. Locked at session init.
            </p>
          </Section>

          <Section
            id="sec-settlement"
            title="Settlement"
            aside={
              isOwner && (
                <button
                  type="button"
                  onClick={() => setWalletOpen(true)}
                  className={styles.editAction}
                >
                  Edit
                </button>
              )
            }
          >
            <Row
              label="Mode"
              value={
                platform.settlementMode === 'batch' ? 'Daily batch' : 'Per transaction'
              }
            />
            <Row label="Network" value="Solana (SPL)" />
            <Row
              label="Wallet"
              value={
                platform.settlementWalletSolana ? (
                  <span className={styles.mono}>
                    {platform.settlementWalletSolana.slice(0, 10)}...
                    {platform.settlementWalletSolana.slice(-6)}
                  </span>
                ) : (
                  <span className={styles.notSet}>Not set</span>
                )
              }
            />
          </Section>
        </div>

        {/* ─── Activity ─────────────────────────────────────── */}

        <Section id="sec-activity" title="Activity">
          {activity.length === 0 ? (
            <div className={styles.activityEmpty}>
              No audit entries yet for this platform.
            </div>
          ) : (
            <ul className={styles.activityList}>
              {activity.map((entry) => {
                const op = (mock.operators || []).find((o) => o.id === entry.operatorId);
                const name =
                  op?.displayName ||
                  entry.operatorEmail ||
                  `Operator ${entry.operatorId}`;
                return (
                  <li key={entry.id} className={styles.activityItem}>
                    <span className={styles.activityTime}>
                      {formatTimeAgo(entry.occurredAt)}
                    </span>
                    <span className={styles.activityText}>
                      <strong>{name}</strong> performed{' '}
                      <span className={styles.mono}>{entry.action}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>
      </div>

      {/* ─── Dialogs ──────────────────────────────────────────── */}

      <CountryStateDrawer
        isOpen={drawerCountry != null}
        onClose={() => setDrawerCountry(null)}
        countryCode={drawerCountry || 'NG'}
        country={drawerCountry ? platform.countries?.[drawerCountry] ?? null : null}
        merchants={merchants}
        onSave={handleSaveCountry}
      />

      {isOwner && (
        <FeesDialog
          isOpen={feesOpen}
          onClose={() => setFeesOpen(false)}
          currentPct={Number(platform.skimPercent ?? 1)}
          onSave={handleSaveFees}
        />
      )}

      {isOwner && (
        <SettlementWalletDialog
          isOpen={walletOpen}
          onClose={() => setWalletOpen(false)}
          currentAddress={platform.settlementWalletSolana}
          onValidate={handleValidateWallet}
          onSave={handleSaveWallet}
        />
      )}

      {isOwner && (
        <RotateApiKeyDialog
          isOpen={rotateOpen}
          onClose={() => setRotateOpen(false)}
          platformName={platform.displayName}
          onRotate={handleRotateApiKey}
        />
      )}

      <WebhookTestDialog
        isOpen={webhookOpen}
        onClose={() => setWebhookOpen(false)}
        webhookUrl={platform.webhookUrl}
        onTest={handleTestWebhook}
      />

      {isOwner && (
        <PausePlatformDialog
          isOpen={pauseAction != null}
          onClose={() => setPauseAction(null)}
          action={pauseAction || 'pause'}
          platformName={platform.displayName}
          onConfirm={(reason) => handleStatusChange(pauseAction, reason)}
        />
      )}
    </AdminShell>
  );
}
