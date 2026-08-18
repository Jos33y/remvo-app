import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { AdminShell } from '@components/layout/admin/AdminShell';
import { EmptyState } from '@components/ui/admin/EmptyState';
import { IconLayers } from '@components/ui/icons/IconLayers';
import { IconChevron } from '@components/ui/icons/IconChevron';
import { IconCheck } from '@components/ui/icons/IconCheck';
import { adminPath } from '@app/adminRouter';
import {
  fetchSessionDetail,
  replayWebhookDelivery,
  AuthApiError,
} from '@lib/authClient';
import styles from '@styles/pages/admin/session-detail-page.module.css';

/* ──────────────────────────────────────────────────────────────────
 * SessionDetailPage
 *
 * Route: /admin/sessions/:id | register: neutral.
 *
 * Six sections:
 *   1. Header               | reference, status pill, lifecycle times
 *   2. Money snapshot       | what-they-pay vs what-they-get vs settled
 *   3. Rate snapshot        | display, effective, cost basis, gross margin
 *                             (only for sessions that priced)
 *   4. Session              | id, platform user id, country, corridor,
 *                             merchant, virtual account, callback url
 *   5. Webhook deliveries   | every outbound delivery, status + attempts
 *   6. Linked transaction   | jump to /admin/transactions/:txnId when
 *                             confirmed; absent state otherwise
 *
 * Two design notes:
 *   - country_not_active sessions skip the Money + Rate sections
 *     entirely and surface an info note (the rows have zeroed fields
 *     by schema default; rendering them would mislead).
 *   - Webhook deliveries gets a tight density inside the section
 *     card | this is the one place where "small repeating rows"
 *     beats prose layout.
 * ────────────────────────────────────────────────────────────────── */

// ─── Formatters ──────────────────────────────────────────────────

function formatUsd(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '$0.00';
  return '$' + n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatNaira(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '₦0';
  return '₦' + Math.trunc(n).toLocaleString('en-US');
}

function formatDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  });
}

function shortHash(hash, head = 8, tail = 8) {
  if (!hash) return '';
  if (hash.length <= head + tail + 3) return hash;
  return `${hash.slice(0, head)}...${hash.slice(-tail)}`;
}

// ─── Status pill mapping ─────────────────────────────────────────

const STATUS_PILL_CLASS = {
  pending: 'statusPillPending',
  confirmed: 'statusPillConfirmed',
  expired: 'statusPillExpired',
  failed: 'statusPillFailed',
  country_not_active: 'statusPillBlocked',
};

const STATUS_LABEL = {
  pending: 'Pending payment',
  confirmed: 'Confirmed',
  expired: 'Expired',
  failed: 'Failed',
  country_not_active: 'Country blocked',
};

/* Terminal-state labels for the lifecycle strip. Keyed on status so
 * the cell can never disagree with the status pill above it. */
const LIFECYCLE_TERMINAL_LABELS = {
  confirmed: 'Confirmed',
  expired: 'Expired',
  failed: 'Failed',
};

const WEBHOOK_PILL_CLASS = {
  pending: 'webhookPillPending',
  delivered: 'webhookPillDelivered',
  failed: 'webhookPillFailed',
  abandoned: 'webhookPillAbandoned',
};

// ─── Copy hook (mirrors TransactionDetailPage) ───────────────────

function useCopyToClipboard() {
  const [copiedKey, setCopiedKey] = useState(null);
  const copy = useCallback(async (value, key) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = value;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch { /* noop */ }
      document.body.removeChild(ta);
    }
    setCopiedKey(key);
    setTimeout(() => setCopiedKey((cur) => (cur === key ? null : cur)), 1500);
  }, []);
  return [copiedKey, copy];
}

// ─── Field row primitive ─────────────────────────────────────────

function FieldRow({ label, value, mono = false, copyable = false, copyKey, onCopy, copiedKey, link, hint }) {
  const isCopied = copyKey && copiedKey === copyKey;
  const valueClass = [
    styles.fieldValue,
    mono && styles.fieldValueMono,
  ].filter(Boolean).join(' ');

  return (
    <div className={styles.fieldRow}>
      <div className={styles.fieldLabel}>{label}</div>
      <div className={styles.fieldValueWrap}>
        {link ? (
          <a
            className={[valueClass, styles.fieldLink].join(' ')}
            href={link}
            target="_blank"
            rel="noopener noreferrer"
          >
            {value}
            <span className={styles.fieldLinkArrow} aria-hidden="true">↗</span>
          </a>
        ) : (
          <span className={valueClass}>{value || <span className={styles.fieldEmpty}>—</span>}</span>
        )}
        {copyable && value && (
          <button
            type="button"
            className={[
              styles.copyButton,
              isCopied && styles.copyButtonActive,
            ].filter(Boolean).join(' ')}
            onClick={() => onCopy(value, copyKey)}
            aria-label={isCopied ? `${label} copied` : `Copy ${label}`}
          >
            {isCopied ? (
              <>
                <IconCheck size={12} /> Copied
              </>
            ) : (
              'Copy'
            )}
          </button>
        )}
        {hint && <span className={styles.fieldHint}>{hint}</span>}
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────

export function SessionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [copiedKey, copy] = useCopyToClipboard();

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pre-Live Alerts follow-up | replay state, keyed by delivery id.
  // Per-row so a click on one button doesn't disable the others.
  //
  // Shape per id:
  //   { phase: 'idle' | 'confirm' | 'sending' | 'error', error?: string }
  //
  // The 'confirm' phase is the second-click inline confirmation.
  // First click flips idle -> confirm; second click within ~6s flips
  // confirm -> sending; outside the window we revert to idle (a
  // setTimeout per row handles this).
  const [replayStateById, setReplayStateById] = useState({});

  /**
   * Load (or reload) the detail. Used by the initial mount effect AND
   * after a successful replay so the deliveries list refreshes with
   * the new attempts / status. Returns a Promise so callers can chain
   * post-load actions.
   *
   * cancelled-guard pattern: the caller passes a `cancelledRef` (a
   * mutable ref-like object) so the strict-mode double-invoke + an
   * unmount mid-fetch don't both set state on a dead component.
   */
  const loadDetail = useCallback(
    async (cancelledRef) => {
      try {
        const result = await fetchSessionDetail(id);
        if (cancelledRef?.cancelled) return;
        setDetail(result);
        setError(null);
        setLoading(false);
      } catch (err) {
        if (cancelledRef?.cancelled) return;
        setLoading(false);
        if (err instanceof AuthApiError && err.status === 404) {
          setError({ kind: 'not_found' });
        } else {
          setError({
            kind: 'other',
            message: err instanceof AuthApiError ? err.message : 'Could not load this session.',
          });
        }
      }
    },
    [id]
  );

  useEffect(() => {
    const cancelledRef = { cancelled: false };
    setLoading(true);
    setError(null);
    loadDetail(cancelledRef);
    return () => { cancelledRef.cancelled = true; };
  }, [loadDetail]);

  /**
   * Replay an abandoned or failed outbound webhook delivery.
   *
   * Two-step inline confirm | first click sets row to 'confirm'
   * (button label changes to "Confirm replay"). A 6-second timer
   * reverts to 'idle' if the operator doesn't follow through. Second
   * click within the window fires the API call.
   *
   * On success: refetch the session detail so the list reflects new
   * attempts/status. The dispatcher tick (~5s) means the row may
   * appear in 'pending' first and flip to 'delivered' on a subsequent
   * load | the operator's natural reflex is to refresh, which Just
   * Works.
   *
   * On error: surface the API message inline next to the button.
   * Never blocks the rest of the page.
   *
   * @param {string|number} deliveryId
   */
  const handleReplay = useCallback(
    async (deliveryId) => {
      const current = replayStateById[deliveryId]?.phase;

      // First click | arm the confirm window.
      if (current !== 'confirm') {
        setReplayStateById((prev) => ({
          ...prev,
          [deliveryId]: { phase: 'confirm' },
        }));
        // Auto-revert after 6s so an abandoned click doesn't leave
        // the row armed forever.
        setTimeout(() => {
          setReplayStateById((prev) => {
            if (prev[deliveryId]?.phase !== 'confirm') return prev;
            const next = { ...prev };
            delete next[deliveryId];
            return next;
          });
        }, 6000);
        return;
      }

      // Second click | fire the replay.
      setReplayStateById((prev) => ({
        ...prev,
        [deliveryId]: { phase: 'sending' },
      }));
      try {
        await replayWebhookDelivery(deliveryId);
        // Clear the row state, then refetch.
        setReplayStateById((prev) => {
          const next = { ...prev };
          delete next[deliveryId];
          return next;
        });
        await loadDetail({ cancelled: false });
      } catch (err) {
        setReplayStateById((prev) => ({
          ...prev,
          [deliveryId]: {
            phase: 'error',
            error:
              err instanceof AuthApiError
                ? err.message
                : 'Replay failed. Try again.',
          },
        }));
      }
    },
    [replayStateById, loadDetail]
  );

  function goBack() {
    navigate(adminPath('/sessions'));
  }

  function goToTransaction(txnId) {
    navigate(adminPath(`/transactions/${encodeURIComponent(txnId)}`));
  }

  // ─── Margin computation (only when priced) ──

  const margin = useMemo(() => {
    if (!detail?.session) return { naira: null, pct: null };
    const s = detail.session;
    const eff = s.effective_rate_full == null ? null : Number(s.effective_rate_full);
    const cost = s.p2p_rate_at_lock == null ? null : Number(s.p2p_rate_at_lock);
    const credited = s.amount_usd_credited == null ? null : Number(s.amount_usd_credited);
    if (eff == null || cost == null || credited == null || cost <= 0 || credited <= 0) {
      return { naira: null, pct: null };
    }
    return {
      naira: (eff - cost) * credited,
      pct: ((eff - cost) / cost) * 100,
    };
  }, [detail]);

  // ─── States ──

  if (loading) {
    return (
      <AdminShell pageTitle="Session" contentRegister="neutral">
        <div className={styles.page}>
          <BackLink onClick={goBack} />
          <div className={styles.loadingBlock}>Loading session...</div>
        </div>
      </AdminShell>
    );
  }

  if (error?.kind === 'not_found') {
    return (
      <AdminShell pageTitle="Session" contentRegister="neutral">
        <div className={styles.page}>
          <BackLink onClick={goBack} />
          <EmptyState
            icon={<IconLayers size={24} />}
            heading="Session not found"
            body="This id doesn't match any session. It may have been removed or the link is wrong."
          />
        </div>
      </AdminShell>
    );
  }

  if (error) {
    return (
      <AdminShell pageTitle="Session" contentRegister="neutral">
        <div className={styles.page}>
          <BackLink onClick={goBack} />
          <EmptyState
            icon={<IconLayers size={24} />}
            heading="Could not load this session"
            body={error.message}
          />
        </div>
      </AdminShell>
    );
  }

  if (!detail) return null;

  const { session: s, transaction: tx, webhook_deliveries: deliveries } = detail;
  const isInactive = s.status === 'country_not_active';
  /* Only a confirmed session moved money. Everything else is a
   * quote, and the money and rate panels say so. */
  const isConfirmed = s.status === 'confirmed';
  const statusClass = STATUS_PILL_CLASS[s.status] || 'statusPillExpired';
  const statusLabel = STATUS_LABEL[s.status] || s.status;
  const marginNegative = margin.naira != null && margin.naira < 0;
  /* Gross margin is the only figure in the rate panel that describes
   * an OUTCOME rather than a price. Display rate, cost basis, spread
   * and source were all genuinely true at lock time on any session.
   * Margin was not: on an unconfirmed session no money moved and
   * nothing was earned.
   *
   * Rendered in success green it is the most revenue-looking number
   * on the page, so an operator scanning expired sessions reads
   * income that does not exist. Neutral colour when unconfirmed. */
  const marginValueClass = [
    styles.fieldValue,
    styles.fieldValueMono,
    styles.marginValueLg,
    !isConfirmed
      ? styles.marginValueQuoted
      : marginNegative
      ? styles.marginValueNeg
      : styles.marginValuePos,
  ].join(' ');

  return (
    <AdminShell pageTitle={`Session ${s.public_reference || s.id}`} contentRegister="neutral">
      <div className={styles.page}>
        <BackLink onClick={goBack} />

        {/* ── Header ── */}
        <header className={styles.header}>
          <div className={styles.headerMain}>
            <span className={styles.headerEyebrow}>Reference</span>
            <h1 className={styles.headerTitle}>{s.public_reference}</h1>
            <div className={styles.headerSub}>
              Created {formatDateTime(s.created_at)}
            </div>
          </div>
          <div className={styles.headerStatus}>
            <span className={[styles.statusPill, styles[statusClass]].join(' ')}>
              {statusLabel}
            </span>
            {!isInactive && (
              <div className={styles.headerAmount}>
                <span className={styles.headerAmountValue}>
                  {formatUsd(s.amount_usd_credited)}
                </span>
                <span className={styles.headerAmountFiat}>
                  {formatNaira(s.amount_ngn)} payable
                </span>
              </div>
            )}
          </div>
        </header>

        {/* ── Lifecycle timeline | tight strip ── */}
        <Section heading="Lifecycle">
          <div className={styles.lifecycleGrid}>
            <LifecycleCell label="Locked" value={formatDateTime(s.locked_at)} />
            <LifecycleCell label="Expires" value={formatDateTime(s.expires_at)} />
            {/* Label follows the status, not whichever timestamp
              * happens to be set. The cron used to write failed_at
              * when it expired a session, so this cell rendered
              * FAILED next to a status pill reading EXPIRED. A
              * timeout and a failure are different events and an
              * operator reading this at 2am should not have to
              * reconcile them. */}
            <LifecycleCell
              label={LIFECYCLE_TERMINAL_LABELS[s.status] ?? 'Confirmed'}
              value={
                s.confirmed_at
                  ? formatDateTime(s.confirmed_at)
                  : s.expired_at
                  ? formatDateTime(s.expired_at)
                  : s.failed_at
                  ? formatDateTime(s.failed_at)
                  : null
              }
              empty={s.status === 'pending' ? 'Awaiting payment' : null}
            />
          </div>
        </Section>

        {/* ── Money snapshot (skip for blocked countries) ──
          * On a confirmed session these are facts. On any other
          * status they are the quote the session was priced at and
          * no money moved, so the heading says so and the tiles are
          * muted. Rendering "+₦2,574 margin" on an unpaid session
          * invents revenue for whoever is scanning the list. */}
        {!isInactive && (
          <Section
            heading={
              isConfirmed ? 'Money snapshot' : 'Money snapshot (quoted, not settled)'
            }
          >
            <div className={styles.moneyGrid}>
              <MoneyTile
                label="User pays"
                value={formatNaira(s.amount_ngn)}
                caption={
                  isConfirmed
                    ? 'Bank transfer to virtual account'
                    : 'Quoted. No transfer received.'
                }
                muted={!isConfirmed}
              />
              <MoneyTile
                label="Card credited"
                value={formatUsd(s.amount_usd_credited)}
                caption={
                  isConfirmed
                    ? 'USD value applied on confirm'
                    : 'Would have been applied on confirm'
                }
                muted={!isConfirmed}
              />
              <MoneyTile
                label="Platform settles"
                value={formatUsd(s.amount_usd_settled)}
                caption={
                  isConfirmed
                    ? 'USDT to platform wallet'
                    : 'Would have settled to platform wallet'
                }
                accent={isConfirmed}
                muted={!isConfirmed}
              />
              <MoneyTile
                label="Remvo fee"
                value={formatUsd(s.platform_fee_usd)}
                caption={
                  isConfirmed
                    ? 'Retained from credited'
                    : 'Would have been retained'
                }
                muted={!isConfirmed}
              />
            </div>
          </Section>
        )}

        {/* ── Rate snapshot (skip for blocked) ── */}
        {!isInactive && (
          <Section heading="Rate snapshot">
            <div className={styles.fieldsGrid}>
              <FieldRow
                label="Display rate"
                value={s.display_rate ? `₦${Number(s.display_rate).toLocaleString('en-US')} per USDT` : null}
                mono
              />
              <FieldRow
                label="Effective rate"
                value={s.effective_rate_full ? Number(s.effective_rate_full).toFixed(4) : null}
                mono
                hint="Used to calculate the user's Naira amount"
              />
              <FieldRow
                label="Cost basis"
                value={s.p2p_rate_at_lock ? Number(s.p2p_rate_at_lock).toFixed(4) : null}
                mono
                hint="Operator's P2P cost when session opened"
              />
              <div className={styles.fieldRow}>
                <div className={styles.fieldLabel}>
                  {isConfirmed ? 'Gross margin' : 'Gross margin (not earned)'}
                </div>
                <div className={styles.fieldValueWrap}>
                  {margin.naira == null ? (
                    <span className={styles.fieldEmpty}>—</span>
                  ) : (
                    <>
                      <span className={marginValueClass}>
                        {margin.naira >= 0 ? '+' : '−'}
                        {formatNaira(Math.abs(margin.naira))}
                      </span>
                      <span className={styles.marginBadge}>
                        {margin.pct >= 0 ? '+' : '−'}
                        {Math.abs(margin.pct).toFixed(2)}%
                      </span>
                    </>
                  )}
                  <span className={styles.fieldHint}>
                    {!isConfirmed
                      ? 'Would have been the margin. No payment received.'
                      : marginNegative
                      ? 'Sold below cost basis. Loss on this session.'
                      : '(effective rate − cost basis) × USD credited'}
                  </span>
                </div>
              </div>
              <FieldRow
                label="Base spread"
                value={s.base_spread_pct != null ? `${s.base_spread_pct}%` : null}
                mono
              />
              <FieldRow
                label="Total spread"
                value={s.total_pct != null ? `${s.total_pct}%` : null}
                mono
                hint="Base spread plus 1% user-side fee"
              />
              <FieldRow
                label="Source"
                value={s.rate_source_stale ? `${s.rate_source} (stale)` : s.rate_source}
              />
            </div>
          </Section>
        )}

        {/* ── Country blocked note ── */}
        {isInactive && (
          <Section heading="Country status">
            <div className={styles.blockedNote}>
              <span className={styles.blockedDot} aria-hidden="true" />
              <div>
                <div className={styles.blockedHeading}>
                  Session blocked: {s.country_not_active_reason || 'paused'}
                </div>
                <div className={styles.blockedBody}>
                  This is a demand signal from <strong>{s.country_code}</strong>.
                  No virtual account was created and no money will move. Use the
                  Analytics page to track blocked-country interest by region.
                </div>
              </div>
            </div>
          </Section>
        )}

        {/* ── Session meta ── */}
        <Section heading="Session">
          <div className={styles.fieldsGrid}>
            <FieldRow
              label="Session id"
              value={s.id}
              mono
              copyable
              copyKey="session_id"
              onCopy={copy}
              copiedKey={copiedKey}
            />
            <FieldRow label="Platform" value={s.platform_id} />
            <FieldRow
              label="Platform user id"
              value={s.platform_user_id}
              mono
              copyable
              copyKey="platform_user_id"
              onCopy={copy}
              copiedKey={copiedKey}
            />
            <FieldRow label="Country" value={s.country_code} />
            <FieldRow label="Corridor" value={s.corridor_id} />
            <FieldRow label="Merchant" value={s.merchant_id} />
            <FieldRow
              label="Virtual account"
              value={
                s.virtual_account_number
                  ? `${s.virtual_account_number} · ${s.virtual_account_bank || 'Bank'}`
                  : null
              }
              mono
            />
            <FieldRow
              label="Provider reference"
              value={s.provider_reference}
              mono
              copyable={!!s.provider_reference}
              copyKey="provider_reference"
              onCopy={copy}
              copiedKey={copiedKey}
            />
            <FieldRow
              label="Callback URL"
              value={s.callback_url}
              link={s.callback_url}
            />
          </div>
        </Section>

        {/* ── Webhook deliveries ── */}
        <Section heading={`Webhook deliveries${deliveries.length ? ` (${deliveries.length})` : ''}`}>
          {deliveries.length === 0 ? (
            <div className={styles.webhookEmpty}>
              No webhooks have been queued for this session yet. Outbound webhooks fire on confirm.
            </div>
          ) : (
            <ul className={styles.webhookList}>
              {deliveries.map((d) => {
                const pillClass = WEBHOOK_PILL_CLASS[d.status] || 'webhookPillFailed';
                const replayable = d.status === 'abandoned' || d.status === 'failed';
                const rState = replayStateById[d.id];
                const phase = rState?.phase || 'idle';
                return (
                  <li key={d.id} className={styles.webhookItem}>
                    <div className={styles.webhookHead}>
                      <span className={[styles.webhookPill, styles[pillClass]].join(' ')}>
                        {d.status}
                      </span>
                      <span className={styles.webhookEvent}>{d.event_type}</span>
                      <span className={styles.webhookAttempts}>
                        {d.attempts === 1 ? '1 attempt' : `${d.attempts} attempts`}
                      </span>
                      {/* Pre-Live Alerts follow-up | inline replay */}
                      {replayable && (
                        <button
                          type="button"
                          onClick={() => handleReplay(d.id)}
                          disabled={phase === 'sending'}
                          className={[
                            styles.webhookReplayButton,
                            phase === 'confirm' && styles.webhookReplayButtonArmed,
                            phase === 'sending' && styles.webhookReplayButtonSending,
                          ].filter(Boolean).join(' ')}
                          aria-label={
                            phase === 'confirm'
                              ? `Confirm replay of delivery ${d.id}`
                              : `Replay delivery ${d.id}`
                          }
                        >
                          {phase === 'sending' && 'Replaying...'}
                          {phase === 'confirm' && 'Confirm replay'}
                          {phase !== 'sending' && phase !== 'confirm' && 'Replay'}
                        </button>
                      )}
                    </div>
                    <div className={styles.webhookMeta}>
                      <span className={styles.webhookUrl}>{d.target_url}</span>
                      {d.last_response_status != null && (
                        <span className={styles.webhookHttp}>
                          HTTP {d.last_response_status}
                        </span>
                      )}
                    </div>
                    <div className={styles.webhookFooter}>
                      <span>Created {formatDateTime(d.created_at)}</span>
                      {d.delivered_at && (
                        <span>Delivered {formatDateTime(d.delivered_at)}</span>
                      )}
                      {d.last_error && (
                        <span className={styles.webhookError}>{d.last_error}</span>
                      )}
                      {phase === 'error' && rState?.error && (
                        <span className={styles.webhookError}>
                          {rState.error}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>

        {/* ── Linked transaction ── */}
        <Section heading="Linked transaction">
          {tx ? (
            <button
              type="button"
              className={styles.transactionLink}
              onClick={() => goToTransaction(tx.id)}
            >
              <span className={styles.transactionLinkLabel}>
                Open transaction →
              </span>
              <span className={styles.transactionLinkBody}>
                <span className={styles.transactionLinkAmount}>
                  {formatUsd(tx.amount_usd_credited)}
                </span>
                <span className={styles.transactionLinkMeta}>
                  Confirmed {formatDateTime(tx.confirmed_at)}
                  {tx.settlement_batch_id ? ' · Settled' : ' · Pending settlement'}
                </span>
              </span>
            </button>
          ) : (
            <div className={styles.noTransactionNote}>
              {s.status === 'confirmed'
                ? 'Confirmed without a transaction record. This is a data integrity issue | check audit log.'
                : 'No transaction yet. A transaction is created when payment confirms.'}
            </div>
          )}
        </Section>
      </div>
    </AdminShell>
  );
}

// ─── Subcomponents ───────────────────────────────────────────────

function BackLink({ onClick }) {
  return (
    <button type="button" className={styles.backLink} onClick={onClick}>
      <span className={styles.backChevron} aria-hidden="true">
        <IconChevron size={14} />
      </span>
      Back to sessions
    </button>
  );
}

function Section({ heading, children }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionHeading}>{heading}</h2>
      <div className={styles.sectionBody}>{children}</div>
    </section>
  );
}

function MoneyTile({ label, value, caption, accent = false, muted = false }) {
  return (
    <div className={[
      styles.moneyTile,
      accent && styles.moneyTileAccent,
      muted && styles.moneyTileMuted,
    ].filter(Boolean).join(' ')}>
      <div className={styles.moneyLabel}>{label}</div>
      <div className={styles.moneyValue}>{value}</div>
      {caption && <div className={styles.moneyCaption}>{caption}</div>}
    </div>
  );
}

function LifecycleCell({ label, value, empty }) {
  return (
    <div className={styles.lifecycleCell}>
      <div className={styles.lifecycleLabel}>{label}</div>
      <div className={styles.lifecycleValue}>
        {value || <span className={styles.lifecycleEmpty}>{empty || '—'}</span>}
      </div>
    </div>
  );
}
