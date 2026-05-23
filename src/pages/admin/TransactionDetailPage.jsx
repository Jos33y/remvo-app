import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { AdminShell } from '@components/layout/admin/AdminShell';
import { EmptyState } from '@components/ui/admin/EmptyState';
import { IconLayers } from '@components/ui/icons/IconLayers';
import { IconChevron } from '@components/ui/icons/IconChevron';
import { IconCheck } from '@components/ui/icons/IconCheck';
import { useAdminData } from '@context/AdminContext';
import { adminPath } from '@app/adminRouter';
import {
  fetchTransactionDetail,
  AuthApiError,
} from '@lib/authClient';
import styles from '@styles/pages/admin/transaction-detail-page.module.css';

/* ──────────────────────────────────────────────────────────────────
 * TransactionDetailPage
 *
 * Route: /admin/transactions/:id | register: neutral.
 *
 * Five sections:
 *
 *   1. Header           | reference, status, amount, "Back to list"
 *   2. Money flow       | what the user paid, what got credited,
 *                         what the platform got, fees broken out
 *   3. Rate snapshot    | display rate, source, full effective
 *                         rate, base + total spread (audit material)
 *   4. Session lineage  | session id (copy), platform user, virtual
 *                         account, country, callback url, locked_at,
 *                         confirmed_at, expires_at
 *   5. Settlement state | batch id (copy), settled_at, sol tx hash
 *                         (link to Solscan when present)
 *
 * Webhook delivery section is deferred to Section 7 | the data
 * exists on the API (webhooks/repo.js .listForSession) but the
 * frontend wiring is owned by the webhook deliveries replay screen.
 *
 * Auth-mode awareness: in mock mode we resolve from
 * useAdminData().transactions; in API mode we fetch from the
 * detail endpoint which includes the joined session row.
 *
 * Related docs:
 *   src/modules/transactions/adminRoutes.js (GET /transactions/:id)
 *   src/lib/authClient.js
 * ────────────────────────────────────────────────────────────────── */

const AUTH_MODE = import.meta.env.VITE_REMVO_AUTH_MODE || 'local';
const IS_API_MODE = AUTH_MODE === 'api';

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
  if (!Number.isFinite(n)) return '\u20A60';
  return '\u20A6' + Math.trunc(n).toLocaleString('en-US');
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

// ─── Copy-to-clipboard hook ──────────────────────────────────────
//
// Returns [copiedKey, copy(value, key)] | only one key shows
// "Copied" at a time, clears after 1.5s.

function useCopyToClipboard() {
  const [copiedKey, setCopiedKey] = useState(null);
  const copy = useCallback(async (value, key) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // execCommand fallback for non-secure contexts
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

export function TransactionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const mockData = useAdminData();
  const [copiedKey, copy] = useCopyToClipboard();

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(IS_API_MODE);
  const [error, setError] = useState(null);

  // ─── Fetch ──

  useEffect(() => {
    if (!IS_API_MODE) return undefined;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchTransactionDetail(id)
      .then((result) => {
        if (cancelled) return;
        setDetail(result);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoading(false);
        if (err instanceof AuthApiError && err.status === 404) {
          setError({ kind: 'not_found' });
        } else {
          setError({
            kind: 'other',
            message: err instanceof AuthApiError ? err.message : 'Could not load this transaction.',
          });
        }
      });
    return () => { cancelled = true; };
  }, [id]);

  // ─── Mock fallback ──

  const mockDetail = useMemo(() => {
    if (IS_API_MODE) return null;
    const t = mockData.transactions.find((row) => String(row.id) === String(id));
    if (!t) return null;
    return {
      transaction: {
        id: t.id,
        session_id: t.sessionId,
        platform_id: t.platformId,
        amount_usd_credited: String(t.amountUsdCredited),
        amount_usd_settled: String(t.amountUsdSettled),
        platform_fee_usd: String(t.platformFeeUsd),
        amount_ngn: String(t.userPaysNaira),
        settlement_batch_id: t.settlementBatchId,
        settled_at: null,
        sol_tx_hash: null,
        confirmed_at: t.confirmedAt || t.createdAt,
        created_at: t.createdAt,
      },
      session: {
        id: t.sessionId,
        platform_id: t.platformId,
        platform_user_id: t.platformUserId,
        merchant_id: t.merchantId,
        corridor_id: t.corridorId,
        public_reference: t.reference,
        card_value_usd: String(t.amountUsdCard),
        amount_usd_credited: String(t.amountUsdCredited),
        amount_usd_settled: String(t.amountUsdSettled),
        platform_fee_usd: String(t.platformFeeUsd),
        amount_ngn: String(t.userPaysNaira),
        display_rate: t.displayRate,
        effective_rate_full: String(t.effectiveRateFull),
        p2p_rate_at_lock: String(t.p2pRateAtLock),
        base_spread_pct: String(t.baseSpreadPct),
        total_pct: String(t.totalPct),
        rate_source: t.rateSource,
        rate_source_id: t.rateSourceId,
        rate_source_stale: !!t.rateSourceStale,
        country_code: 'NG',
        callback_url: 'https://ge-as.com/deposit/complete',
        virtual_account_number: t.accountNumber,
        virtual_account_bank: t.bankName,
        monnify_reference: null,
        locked_at: t.lockedAt,
        expires_at: t.expiresAt,
        confirmed_at: t.confirmedAt,
        failed_at: null,
        created_at: t.createdAt,
      },
    };
  }, [mockData.transactions, id]);

  const displayed = IS_API_MODE ? detail : mockDetail;

  function goBack() {
    navigate(adminPath('/transactions'));
  }

  // ─── Loading / error states ──

  if (loading) {
    return (
      <AdminShell pageTitle="Transaction" contentRegister="neutral">
        <div className={styles.page}>
          <BackLink onClick={goBack} />
          <div className={styles.loadingBlock}>Loading transaction...</div>
        </div>
      </AdminShell>
    );
  }

  if (error?.kind === 'not_found' || (!IS_API_MODE && !mockDetail)) {
    return (
      <AdminShell pageTitle="Transaction" contentRegister="neutral">
        <div className={styles.page}>
          <BackLink onClick={goBack} />
          <EmptyState
            icon={<IconLayers size={24} />}
            heading="Transaction not found"
            body="This id doesn't match any transaction. It may have been removed or the link is wrong."
          />
        </div>
      </AdminShell>
    );
  }

  if (error) {
    return (
      <AdminShell pageTitle="Transaction" contentRegister="neutral">
        <div className={styles.page}>
          <BackLink onClick={goBack} />
          <EmptyState
            icon={<IconLayers size={24} />}
            heading="Could not load this transaction"
            body={error.message}
          />
        </div>
      </AdminShell>
    );
  }

  if (!displayed) return null;

  const { transaction: tx, session: s } = displayed;
  const isSettled = !!tx.settlement_batch_id;
  const solscanUrl = tx.sol_tx_hash
    ? `https://solscan.io/tx/${tx.sol_tx_hash}`
    : null;

  return (
    <AdminShell pageTitle={`Transaction ${s?.public_reference || tx.id}`} contentRegister="neutral">
      <div className={styles.page}>
        <BackLink onClick={goBack} />

        {/* ── Header ── */}
        <header className={styles.header}>
          <div className={styles.headerMain}>
            <span className={styles.headerEyebrow}>Reference</span>
            <h1 className={styles.headerTitle}>
              {s?.public_reference || `Transaction #${tx.id}`}
            </h1>
            <div className={styles.headerSub}>
              Confirmed {formatDateTime(tx.confirmed_at)}
            </div>
          </div>
          <div className={styles.headerStatus}>
            <span
              className={[
                styles.statusPill,
                isSettled ? styles.statusPillSettled : styles.statusPillPending,
              ].join(' ')}
            >
              {isSettled ? 'Settled' : 'Pending settlement'}
            </span>
            <div className={styles.headerAmount}>
              <span className={styles.headerAmountValue}>
                {formatUsd(tx.amount_usd_credited)}
              </span>
              <span className={styles.headerAmountFiat}>
                {formatNaira(tx.amount_ngn)} paid
              </span>
            </div>
          </div>
        </header>

        {/* ── Money flow ── */}
        <Section heading="Money flow">
          <div className={styles.moneyGrid}>
            <MoneyTile
              label="User paid"
              value={formatNaira(tx.amount_ngn)}
              caption="Bank transfer to virtual account"
            />
            <MoneyTile
              label="Card credited"
              value={formatUsd(tx.amount_usd_credited)}
              caption="USD value applied to user balance"
            />
            <MoneyTile
              label="Platform settled"
              value={formatUsd(tx.amount_usd_settled)}
              caption="USDT to be sent to platform wallet"
              accent
            />
            <MoneyTile
              label="Remvo fee"
              value={formatUsd(tx.platform_fee_usd)}
              caption="Retained from credited amount"
            />
          </div>
        </Section>

        {/* ── Rate snapshot ── */}
        {s && (() => {
          // Margin numbers, computed once per render. Mirrors the
          // CSV computation in api adminRoutes.js so the on-screen
          // value never drifts from the exported one.
          const eff = s.effective_rate_full == null ? null : Number(s.effective_rate_full);
          const cost = s.p2p_rate_at_lock == null ? null : Number(s.p2p_rate_at_lock);
          const credited = tx.amount_usd_credited == null ? null : Number(tx.amount_usd_credited);
          let marginNaira = null;
          let marginPct = null;
          if (eff != null && cost != null && credited != null && cost > 0) {
            marginNaira = (eff - cost) * credited;
            marginPct = ((eff - cost) / cost) * 100;
          }
          const marginNegative = marginNaira != null && marginNaira < 0;
          const marginValueClass = [
            styles.fieldValue,
            styles.fieldValueMono,
            styles.marginValueLg,
            marginNegative ? styles.marginValueNeg : styles.marginValuePos,
          ].join(' ');

          return (
          <Section heading="Rate snapshot">
            <div className={styles.fieldsGrid}>
              <FieldRow
                label="Display rate"
                value={s.display_rate ? `\u20A6${Number(s.display_rate).toLocaleString('en-US')} per USDT` : null}
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
                <div className={styles.fieldLabel}>Gross margin</div>
                <div className={styles.fieldValueWrap}>
                  {marginNaira == null ? (
                    <span className={styles.fieldEmpty}>\u2014</span>
                  ) : (
                    <>
                      <span className={marginValueClass}>
                        {marginNaira >= 0 ? '+' : '\u2212'}
                        {formatNaira(Math.abs(marginNaira))}
                      </span>
                      <span className={styles.marginBadge}>
                        {marginPct >= 0 ? '+' : '\u2212'}
                        {Math.abs(marginPct).toFixed(2)}%
                      </span>
                    </>
                  )}
                  <span className={styles.fieldHint}>
                    {marginNegative
                      ? 'Sold below cost basis. Loss on this transaction.'
                      : '(effective rate \u2212 cost basis) \u00D7 USD credited'}
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
                value={
                  s.rate_source_stale
                    ? `${s.rate_source} (stale)`
                    : s.rate_source
                }
              />
            </div>
          </Section>
          );
        })()}

        {/* ── Session lineage ── */}
        {s && (
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
              <FieldRow
                label="Platform"
                value={s.platform_id}
              />
              <FieldRow
                label="Platform user id"
                value={s.platform_user_id}
                mono
                copyable
                copyKey="platform_user_id"
                onCopy={copy}
                copiedKey={copiedKey}
              />
              <FieldRow
                label="Country"
                value={s.country_code}
              />
              <FieldRow
                label="Corridor"
                value={s.corridor_id}
              />
              <FieldRow
                label="Merchant"
                value={s.merchant_id}
              />
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
                label="Monnify reference"
                value={s.monnify_reference}
                mono
              />
              <FieldRow
                label="Locked at"
                value={formatDateTime(s.locked_at)}
                mono
              />
              <FieldRow
                label="Confirmed at"
                value={formatDateTime(s.confirmed_at)}
                mono
              />
              <FieldRow
                label="Callback URL"
                value={s.callback_url}
                link={s.callback_url}
              />
            </div>
          </Section>
        )}

        {/* ── Settlement state ── */}
        <Section heading="Settlement">
          {isSettled ? (
            <div className={styles.fieldsGrid}>
              <FieldRow
                label="Batch id"
                value={tx.settlement_batch_id}
                mono
                copyable
                copyKey="batch_id"
                onCopy={copy}
                copiedKey={copiedKey}
              />
              <FieldRow
                label="Settled at"
                value={formatDateTime(tx.settled_at)}
                mono
              />
              <FieldRow
                label="Solana transaction"
                value={tx.sol_tx_hash ? shortHash(tx.sol_tx_hash) : null}
                mono
                link={solscanUrl}
                hint={solscanUrl ? 'View on Solscan' : null}
              />
            </div>
          ) : (
            <div className={styles.pendingSettleNote}>
              <span className={styles.pendingSettleDot} aria-hidden="true" />
              This transaction has not yet been included in a settlement batch.
              The operator triggers settlements from the Dashboard once funds are
              ready in the hot wallet.
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
      Back to transactions
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

function MoneyTile({ label, value, caption, accent = false }) {
  return (
    <div className={[styles.moneyTile, accent && styles.moneyTileAccent].filter(Boolean).join(' ')}>
      <div className={styles.moneyLabel}>{label}</div>
      <div className={styles.moneyValue}>{value}</div>
      {caption && <div className={styles.moneyCaption}>{caption}</div>}
    </div>
  );
}
