import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { AdminShell } from '@components/layout/admin/AdminShell';
import { StatusBadge } from '@components/ui/admin/StatusBadge';
import { MerchantBadge } from '@components/ui/admin/MerchantBadge';
import { EmptyState } from '@components/ui/admin/EmptyState';
import { CopyableRow } from '@components/ui/shared/CopyableRow';
import { ConfirmDialog } from '@components/ui/admin/ConfirmDialog';
import { PauseMerchantDialog } from '@components/ui/admin/PauseMerchantDialog';
import { useToast } from '@components/ui/admin/ToastProvider';
import { IconMerchant } from '@components/ui/icons/IconMerchant';
import { IconKebab } from '@components/ui/icons/IconKebab';
import { useAdminData, useOperatorSession } from '@context/AdminContext';
import { useMerchantDetailApi } from '@hooks/useMerchantsApi';
import { adminPath } from '@app/adminRouter';
import {
  pauseMerchant as apiPauseMerchant,
  unpauseMerchant as apiUnpauseMerchant,
  disableMerchant as apiDisableMerchant,
  rotateMerchantSecrets as apiRotateMerchantSecrets,
} from '@lib/authClient';
import styles from '@styles/pages/admin/merchant-detail-page.module.css';

const METHOD_LABELS = {
  bank_transfer: 'Bank transfer',
  card: 'Card',
  ussd: 'USSD',
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
  if (minutes < 1) return 'just now';
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

function Row({ label, value }) {
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <span className={styles.rowValue}>{value}</span>
    </div>
  );
}

export function MerchantDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const mock = useAdminData();
  const api = useMerchantDetailApi(id);
  const { operator } = useOperatorSession();
  const toast = useToast();

  const isApiMode = !!api?.isApiMode;
  const isOwner = operator?.role === 'owner';

  /* ── Data resolution ──────────────────────────────────── */

  const merchants = isApiMode ? api.merchants : mock.merchants;
  const corridorMerchants = isApiMode ? api.corridorMerchants : mock.corridorMerchants;
  const corridors = isApiMode ? api.corridors : mock.corridors;
  const auditLog = isApiMode ? api.auditLog : mock.auditLog;
  const operators = isApiMode ? api.operators : mock.operators;

  const merchant = useMemo(() => merchants.find(m => m.id === id), [merchants, id]);

  const corridorLinks = useMemo(() => {
    if (!merchant) return [];
    return corridorMerchants
      .filter(cm => cm.merchantId === merchant.id)
      .map(cm => {
        const corridor = corridors.find(c => c.id === cm.corridorId);
        return { cm, corridor };
      })
      .filter(entry => entry.corridor);
  }, [corridorMerchants, corridors, merchant]);

  const activity = useMemo(() => {
    if (!merchant) return [];
    return auditLog
      .filter(e =>
        (e.entityType === 'merchant' && e.entityId === merchant.id) ||
        (e.action === 'corridor.flip_merchant' &&
          (e.before?.preferredMerchantId === merchant.id ||
           e.after?.preferredMerchantId === merchant.id ||
           e.before?.preferred_merchant_id === merchant.id ||
           e.after?.preferred_merchant_id === merchant.id))
      )
      .slice(0, 10);
  }, [auditLog, merchant]);

  /* ── Owner action state ───────────────────────────────── */

  const [kebabOpen, setKebabOpen] = useState(false);
  const [pauseAction, setPauseAction] = useState(null);
  const [unpauseConfirm, setUnpauseConfirm] = useState(false);
  const [rotateConfirm, setRotateConfirm] = useState(false);
  const [rotating, setRotating] = useState(false);
  const kebabRef = useRef(null);

  /* Close kebab on outside click */
  useEffect(() => {
    if (!kebabOpen) return undefined;
    function onClick(e) {
      if (kebabRef.current && !kebabRef.current.contains(e.target)) {
        setKebabOpen(false);
      }
    }
    setTimeout(() => document.addEventListener('click', onClick), 0);
    return () => document.removeEventListener('click', onClick);
  }, [kebabOpen]);

  /* ── Mutation handlers (API mode only) ───────────────── */

  const handlePause = useCallback(async (reason) => {
    const detail = await apiPauseMerchant(id, { reason });
    api?.applyDetail(detail);
    toast.success('Merchant paused', merchant?.displayName || id);
  }, [id, api, toast, merchant]);

  const handleDisable = useCallback(async (reason) => {
    const detail = await apiDisableMerchant(id, { reason });
    api?.applyDetail(detail);
    toast.success('Merchant disabled', merchant?.displayName || id);
  }, [id, api, toast, merchant]);

  const handleUnpause = useCallback(async () => {
    try {
      const detail = await apiUnpauseMerchant(id);
      api?.applyDetail(detail);
      toast.success('Merchant resumed', merchant?.displayName || id);
      setUnpauseConfirm(false);
    } catch (err) {
      toast.error('Could not resume merchant', err?.details?.message || err?.message || 'Try again.');
    }
  }, [id, api, toast, merchant]);

  const handleRotate = useCallback(async () => {
    setRotating(true);
    try {
      await apiRotateMerchantSecrets(id);
      toast.success(
        'Secrets refreshed',
        'Next webhook and outbound call will use the new credentials.'
      );
      setRotateConfirm(false);
    } catch (err) {
      toast.error(
        'Could not refresh secrets',
        err?.details?.message || err?.message || 'Verify Infisical is reachable.'
      );
    } finally {
      setRotating(false);
    }
  }, [id, toast]);

  /* ── Render ───────────────────────────────────────────── */

  if (api?.loading && !merchant) {
    return (
      <AdminShell pageTitle="Merchant" contentRegister="neutral">
        <div className={styles.page}>
          <button type="button" className={styles.backLink} onClick={() => navigate(adminPath('/merchants'))}>
            <IconArrowLeft size={14} /> Merchants
          </button>
          <div className={styles.loadingNote}>Loading merchant...</div>
        </div>
      </AdminShell>
    );
  }

  if (!merchant) {
    return (
      <AdminShell pageTitle="Merchant" contentRegister="neutral">
        <div className={styles.page}>
          <button type="button" className={styles.backLink} onClick={() => navigate(adminPath('/merchants'))}>
            <IconArrowLeft size={14} /> Merchants
          </button>
          <EmptyState
            icon={<IconMerchant size={24} />}
            heading={api?.error ? 'Could not load merchant' : 'Merchant not found'}
            body={api?.error ? api.error.message : `No merchant matches ID "${id}".`}
          />
        </div>
      </AdminShell>
    );
  }

  const infisicalApiKey = merchant.apiKeyPath || `infisical://remvo/merchants/${merchant.id}/api_key`;
  const infisicalSecret = merchant.secretPath || `infisical://remvo/merchants/${merchant.id}/secret`;

  // Health metrics: API mode uses real values; mock falls back to displayed defaults
  const uptime = isApiMode
    ? (merchant.uptimePct30d != null ? `${merchant.uptimePct30d.toFixed(1)}%` : '-')
    : '99.9%';
  const lastSuccessfulWebhook = isApiMode
    ? merchant.lastWebhookAt
    : new Date(Date.now() - 6 * 60 * 1000).toISOString();

  const isPaused = merchant.status === 'paused';
  const isDisabled = merchant.status === 'disabled';

  return (
    <AdminShell pageTitle="Merchant" contentRegister="neutral">
      <div className={styles.page}>
        <button
          type="button"
          className={styles.backLink}
          onClick={() => navigate(adminPath('/merchants'))}
        >
          <IconArrowLeft size={14} /> Merchants
        </button>

        <header className={styles.pageHeader}>
          <div className={styles.pageHeaderMain}>
            <h1 className={styles.pageTitle}>{merchant.displayName}</h1>
            <p className={styles.pageSubtitle}>
              <span className={styles.mono}>{merchant.id}</span> | {merchant.type === 'both' ? 'Deposit + Disbursement' : merchant.type === 'deposit' ? 'Deposit' : 'Disbursement'}
            </p>
          </div>
          <div className={styles.pageHeaderAside}>
            <StatusBadge status={merchant.status} size="md" />
            {isApiMode && isOwner ? (
              <div className={styles.kebabWrap} ref={kebabRef}>
                <button
                  type="button"
                  className={styles.kebabButton}
                  onClick={(e) => { e.stopPropagation(); setKebabOpen(v => !v); }}
                  aria-label="Merchant actions"
                  aria-expanded={kebabOpen}
                  aria-haspopup="menu"
                >
                  <IconKebab size={16} />
                </button>
                {kebabOpen && (
                  <div className={styles.kebabMenu} role="menu">
                    {!isPaused && !isDisabled && (
                      <button
                        type="button"
                        role="menuitem"
                        className={styles.kebabItem}
                        onClick={() => { setPauseAction('pause'); setKebabOpen(false); }}
                      >
                        Pause merchant
                      </button>
                    )}
                    {isPaused && (
                      <button
                        type="button"
                        role="menuitem"
                        className={styles.kebabItem}
                        onClick={() => { setUnpauseConfirm(true); setKebabOpen(false); }}
                      >
                        Resume merchant
                      </button>
                    )}
                    {isDisabled && (
                      <button
                        type="button"
                        role="menuitem"
                        className={styles.kebabItem}
                        onClick={() => { setUnpauseConfirm(true); setKebabOpen(false); }}
                      >
                        Re-enable merchant
                      </button>
                    )}
                    {!isDisabled && !isPaused && (
                      <button
                        type="button"
                        role="menuitem"
                        className={`${styles.kebabItem} ${styles.kebabItemDanger}`}
                        onClick={() => { setPauseAction('disable'); setKebabOpen(false); }}
                      >
                        Disable merchant
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  type="button"
                  className={styles.editAction}
                  disabled
                  aria-disabled="true"
                  title="Available in Phase 7"
                >
                  Edit
                </button>
                <span className={styles.actionHint}>Edit available in Phase 7</span>
              </>
            )}
          </div>
        </header>

        {/* ═══ Health ═══ */}
        <div className={styles.statRow}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Uptime (30d)</span>
            <span className={styles.statValue}>{uptime}</span>
            <span className={styles.statFoot}>Rolling 30-day window</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Last webhook</span>
            <span className={styles.statValueSm}>
              {lastSuccessfulWebhook ? formatTimeAgo(lastSuccessfulWebhook) : 'No webhooks yet'}
            </span>
            <span className={styles.statFoot}>
              {lastSuccessfulWebhook ? formatAbsolute(lastSuccessfulWebhook) : '-'}
            </span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Corridors using</span>
            <span className={styles.statValue}>{corridorLinks.length}</span>
            <span className={styles.statFoot}>{corridorLinks.filter(e => e.cm.isPreferred).length} as preferred</span>
          </div>
        </div>

        {/* ═══ Credentials ═══ */}
        <Section
          title="Credentials"
          aside={
            isApiMode && isOwner ? (
              <button
                type="button"
                className={styles.smallAction}
                onClick={() => setRotateConfirm(true)}
                disabled={rotating}
              >
                {rotating ? 'Rotating...' : 'Rotate'}
              </button>
            ) : (
              <button
                type="button"
                className={styles.smallAction}
                disabled
                aria-disabled="true"
                title="Available in Phase 7"
              >
                Rotate
              </button>
            )
          }
        >
          <Row label="API key" value={<span className={styles.mono}>{infisicalApiKey}</span>} />
          <Row label="Secret" value={<span className={styles.mono}>{infisicalSecret}</span>} />
          <CopyableRow
            label="API base URL"
            value={merchant.apiBaseUrl}
            valueVariant="sans"
            ariaName="API base URL"
          />
          <CopyableRow
            label="Webhook receiver"
            value={merchant.webhookUrl}
            valueVariant="sans"
            ariaName="webhook receiver URL"
          />
          <p className={styles.credentialNote}>
            Credentials are stored in Infisical. Raw keys never appear in the admin panel.
          </p>
        </Section>

        {/* ═══ Capabilities ═══ */}
        <Section title="Capabilities">
          <Row
            label="Supported countries"
            value={
              <div className={styles.chipRow}>
                {merchant.supportedCountries.map(code => (
                  <span key={code} className={styles.countryChip}>{code}</span>
                ))}
              </div>
            }
          />
          <Row
            label="Supported methods"
            value={
              <div className={styles.methodList}>
                {merchant.supportedMethods.map(m => {
                  const cap = merchant.capabilities?.[m];
                  return (
                    <div key={m} className={styles.methodItem}>
                      <span className={styles.methodName}>{METHOD_LABELS[m] || m}</span>
                      {cap && (
                        <span className={styles.methodMeta}>
                          {cap.webhooks ? 'webhooks' : 'poll'}
                          {' | '}
                          {cap.instantConfirmation ? 'instant' : 'async'}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            }
          />
        </Section>

        {/* ═══ Corridors ═══ */}
        <Section title="Corridors">
          {corridorLinks.length === 0 ? (
            <div className={styles.emptyLine}>Not attached to any corridor yet.</div>
          ) : (
            <ul className={styles.corridorList}>
              {corridorLinks.map(({ cm, corridor }) => (
                <li key={cm.id} className={styles.corridorItem}>
                  <button
                    type="button"
                    className={styles.corridorLink}
                    onClick={() => navigate(adminPath(`/corridors/${corridor.id}`))}
                  >
                    <span className={styles.corridorId}>{corridor.id}</span>
                    <span className={styles.corridorLabel}>
                      {corridor.countryCode} | {corridor.sourceCurrency} {corridor.sourceMethod} to {corridor.destinationAsset} {corridor.destinationNetwork}
                    </span>
                  </button>
                  <div className={styles.corridorMeta}>
                    {cm.isPreferred && <span className={styles.preferredTag}>Preferred</span>}
                    <StatusBadge status={cm.status} size="sm" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* ═══ Activity ═══ */}
        <Section title="Activity">
          {activity.length === 0 ? (
            <div className={styles.emptyLine}>No audit entries yet for this merchant.</div>
          ) : (
            <ul className={styles.activityList}>
              {activity.map(entry => {
                const op = operators.find(o => o.id === entry.operatorId);
                const name = op?.displayName || entry.operatorEmail || `Operator ${entry.operatorId || '-'}`;
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

      {/* ── Owner dialogs (API mode only) ── */}

      {isApiMode && isOwner && (
        <>
          <PauseMerchantDialog
            isOpen={pauseAction != null}
            action={pauseAction}
            merchantName={merchant.displayName}
            onCancel={() => setPauseAction(null)}
            onConfirm={async (reason) => {
              if (pauseAction === 'pause') {
                await handlePause(reason);
                setPauseAction(null);
              } else if (pauseAction === 'disable') {
                await handleDisable(reason);
                setPauseAction(null);
              }
            }}
          />

          <ConfirmDialog
            isOpen={unpauseConfirm}
            onCancel={() => setUnpauseConfirm(false)}
            onConfirm={handleUnpause}
            title={`Resume ${merchant.displayName}?`}
            body={`${merchant.displayName} will be available for new sessions immediately. Corridors that previously used it as preferred will resume routing through it.`}
            confirmLabel="Resume merchant"
            confirmVariant="primary"
          />

          <ConfirmDialog
            isOpen={rotateConfirm}
            onCancel={() => setRotateConfirm(false)}
            onConfirm={handleRotate}
            isLoading={rotating}
            title={`Refresh ${merchant.displayName} secrets?`}
            body="This refreshes the running container's environment from Infisical. Update the values in Infisical first, then click Refresh. The next webhook and outbound call will use the new credentials. There is no rollback; if Infisical is misconfigured, both directions will fail until corrected."
            confirmLabel="Refresh secrets"
            confirmVariant="primary"
          />
        </>
      )}
    </AdminShell>
  );
}
