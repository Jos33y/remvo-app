import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { AdminShell } from '@components/layout/admin/AdminShell';
import { EmptyState } from '@components/ui/admin/EmptyState';
import { IconSettlement } from '@components/ui/icons/IconSettlement';
import { IconChevron } from '@components/ui/icons/IconChevron';
import { IconCheck } from '@components/ui/icons/IconCheck';
import { useAdminData } from '@context/AdminContext';
import { adminPath } from '@app/adminRouter';
import { fetchSettlementDetail, AuthApiError } from '@lib/authClient';
import styles from '@styles/pages/admin/settlement-batch-detail-page.module.css';

/* ──────────────────────────────────────────────────────────────────
 * SettlementBatchDetailPage
 *
 * Route: /admin/settlements/:id | register: neutral.
 *
 * Six sections:
 *   1. Header        | batch id (mono), status pill, triggered timestamp
 *   2. Outcome card  | total settled, transactions, platforms
 *   3. Per-platform  | one card per platform (wallet, amount, hash, error)
 *   4. Lifecycle     | triggered, settled, by operator
 *   5. Failure note  | only when status='failed' (error_message)
 *   6. Transactions  | every claimed transaction, click-through to detail
 *
 * In API mode, fetches /v1/admin/settlements/:id and renders the
 * batch + per-platform JSONB + claimed transactions. In mock mode,
 * resolves from useAdminData().settlements (keeps the original
 * sandbox demo working).
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

const STATUS_PILL_CLASS = {
  sending: 'statusPillPending',
  settled: 'statusPillSettled',
  failed: 'statusPillFailed',
};

const STATUS_LABEL = {
  sending: 'Sending',
  settled: 'Settled',
  failed: 'Failed',
};

// ─── Copy hook ───────────────────────────────────────────────────

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

// ─── Page ────────────────────────────────────────────────────────

export function SettlementBatchDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const mockData = useAdminData();
  const [copiedKey, copy] = useCopyToClipboard();

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(IS_API_MODE);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!IS_API_MODE) return undefined;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchSettlementDetail(id)
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
            message: err instanceof AuthApiError ? err.message : 'Could not load this batch.',
          });
        }
      });
    return () => { cancelled = true; };
  }, [id]);

  // ─── Mock fallback ──

  const mockDetail = useMemo(() => {
    if (IS_API_MODE) return null;
    const batch = mockData.settlements.find((s) => s.id === id);
    if (!batch) return null;
    const txns = mockData.transactions.filter((t) => t.settlementBatchId === id);
    return {
      batch: {
        id: batch.id,
        status: batch.status === 'completed' ? 'settled' : batch.status,
        total_usdt: String(batch.totalUsdSettled),
        transaction_count: batch.transactionCount,
        platform_count: new Set(txns.map((t) => t.platformId)).size || 1,
        per_platform: {},
        sol_tx_hash: batch.solTxHash || null,
        triggered_by: batch.triggeredBy,
        triggered_by_email: null,
        triggered_at: batch.triggeredAt,
        settled_at: batch.completedAt || null,
        error_message: null,
      },
      transactions: txns.map((t) => ({
        id: t.id,
        platform_id: t.platformId,
        public_reference: t.reference,
        amount_usd_credited: String(t.amountUsdCredited),
        amount_usd_settled: String(t.amountUsdSettled),
        amount_ngn: String(t.userPaysNaira),
        sol_tx_hash: batch.solTxHash || null,
        confirmed_at: t.confirmedAt || t.createdAt,
        platform_user_id: t.platformUserId,
      })),
    };
  }, [mockData, id]);

  const displayed = IS_API_MODE ? detail : mockDetail;

  function goBack() {
    navigate(adminPath('/settlements'));
  }

  // ─── States ──

  if (loading) {
    return (
      <AdminShell pageTitle="Settlement batch" contentRegister="neutral">
        <div className={styles.page}>
          <BackLink onClick={goBack} />
          <div className={styles.loadingBlock}>Loading batch...</div>
        </div>
      </AdminShell>
    );
  }

  if (error?.kind === 'not_found' || (!IS_API_MODE && !mockDetail)) {
    return (
      <AdminShell pageTitle="Settlement batch" contentRegister="neutral">
        <div className={styles.page}>
          <BackLink onClick={goBack} />
          <EmptyState
            icon={<IconSettlement size={24} />}
            heading="Batch not found"
            body={`No settlement batch matches ID "${id}".`}
          />
        </div>
      </AdminShell>
    );
  }

  if (error) {
    return (
      <AdminShell pageTitle="Settlement batch" contentRegister="neutral">
        <div className={styles.page}>
          <BackLink onClick={goBack} />
          <EmptyState
            icon={<IconSettlement size={24} />}
            heading="Could not load this batch"
            body={error.message}
          />
        </div>
      </AdminShell>
    );
  }

  if (!displayed) return null;

  const { batch, transactions } = displayed;
  const statusClass = STATUS_PILL_CLASS[batch.status] || 'statusPillFailed';
  const statusLabel = STATUS_LABEL[batch.status] || batch.status;
  const perPlatformEntries = Object.entries(batch.per_platform || {});
  const solscanUrl = batch.sol_tx_hash ? `https://solscan.io/tx/${batch.sol_tx_hash}` : null;

  return (
    <AdminShell pageTitle={`Settlement ${batch.id}`} contentRegister="neutral">
      <div className={styles.page}>
        <BackLink onClick={goBack} />

        {/* ── Header ── */}
        <header className={styles.header}>
          <div className={styles.headerMain}>
            <span className={styles.headerEyebrow}>Batch</span>
            <h1 className={styles.headerTitle}>{batch.id}</h1>
            <div className={styles.headerSub}>
              Triggered {formatDateTime(batch.triggered_at)}
            </div>
          </div>
          <div className={styles.headerStatus}>
            <span className={[styles.statusPill, styles[statusClass]].join(' ')}>
              {statusLabel}
            </span>
            <div className={styles.headerAmount}>
              <span className={styles.headerAmountValue}>
                {formatUsd(batch.total_usdt)}
              </span>
              <span className={styles.headerAmountFiat}>
                {batch.transaction_count} {batch.transaction_count === 1 ? 'transaction' : 'transactions'}
                {batch.platform_count > 1 ? ` · ${batch.platform_count} platforms` : ''}
              </span>
            </div>
          </div>
        </header>

        {/* ── Outcome stats ── */}
        <Section heading="Outcome">
          <div className={styles.outcomeGrid}>
            <OutcomeTile
              label="Total settled"
              value={formatUsd(batch.total_usdt)}
              caption="USDT disbursed across all platforms"
              accent
            />
            <OutcomeTile
              label="Transactions"
              value={String(batch.transaction_count)}
              caption="Confirmed deposits in this batch"
            />
            <OutcomeTile
              label="Platforms"
              value={String(batch.platform_count)}
              caption="Distinct destination wallets"
            />
          </div>
        </Section>

        {/* ── Failure note (only on failed) ── */}
        {batch.status === 'failed' && batch.error_message && (
          <Section heading="Failure">
            <div className={styles.failureNote}>
              <span className={styles.failureDot} aria-hidden="true" />
              <div>
                <div className={styles.failureHeading}>Solana send failed</div>
                <div className={styles.failureBody}>{batch.error_message}</div>
                <div className={styles.failureHint}>
                  Transactions for failed platforms have been returned to the pending pool. Retry from the Dashboard once the underlying issue is resolved.
                </div>
              </div>
            </div>
          </Section>
        )}

        {/* ── Per-platform breakdown ── */}
        {perPlatformEntries.length > 0 && (
          <Section heading="Per platform">
            <div className={styles.platformList}>
              {perPlatformEntries.map(([platformId, p]) => {
                const succeeded = !!p.sol_tx_hash;
                const platformSolscan = p.sol_tx_hash
                  ? `https://solscan.io/tx/${p.sol_tx_hash}`
                  : null;
                return (
                  <div key={platformId} className={styles.platformCard}>
                    <div className={styles.platformHead}>
                      <span className={styles.platformId}>{platformId}</span>
                      <span
                        className={[
                          styles.platformPill,
                          succeeded
                            ? styles.platformPillSettled
                            : styles.platformPillFailed,
                        ].join(' ')}
                      >
                        {succeeded ? 'Settled' : 'Failed'}
                      </span>
                    </div>
                    <div className={styles.platformGrid}>
                      <div className={styles.platformField}>
                        <span className={styles.platformFieldLabel}>Amount</span>
                        <span className={styles.platformFieldMono}>
                          {formatUsd(p.amount_usdt)}
                        </span>
                      </div>
                      <div className={styles.platformField}>
                        <span className={styles.platformFieldLabel}>Transactions</span>
                        <span className={styles.platformFieldMono}>
                          {p.transaction_count}
                        </span>
                      </div>
                      <div className={styles.platformField}>
                        <span className={styles.platformFieldLabel}>Wallet</span>
                        <span className={styles.platformFieldMono} title={p.wallet}>
                          {shortHash(p.wallet)}
                        </span>
                      </div>
                      {p.sol_tx_hash && (
                        <div className={styles.platformField}>
                          <span className={styles.platformFieldLabel}>Solana tx</span>
                          <a
                            href={platformSolscan}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.platformLink}
                            title={p.sol_tx_hash}
                          >
                            {shortHash(p.sol_tx_hash)} <span aria-hidden="true">↗</span>
                          </a>
                        </div>
                      )}
                      {p.error && (
                        <div className={styles.platformErrorRow}>
                          <span className={styles.platformFieldLabel}>Error</span>
                          <span className={styles.platformError}>{p.error}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* ── Lifecycle / metadata ── */}
        <Section heading="Lifecycle">
          <div className={styles.fieldsGrid}>
            <FieldRow label="Triggered" value={formatDateTime(batch.triggered_at)} mono />
            <FieldRow
              label="Triggered by"
              value={
                batch.triggered_by_email
                  ? `${batch.triggered_by_email}`
                  : batch.triggered_by
              }
            />
            <FieldRow label="Settled" value={formatDateTime(batch.settled_at)} mono />
            {batch.sol_tx_hash && (
              <FieldRow
                label="Solana tx"
                value={shortHash(batch.sol_tx_hash)}
                mono
                link={solscanUrl}
                hint={solscanUrl ? 'View on Solscan' : null}
              />
            )}
            <FieldRow
              label="Batch id"
              value={batch.id}
              mono
              copyable
              copyKey="batch_id"
              onCopy={copy}
              copiedKey={copiedKey}
            />
          </div>
        </Section>

        {/* ── Transactions in batch ── */}
        <Section heading={`Transactions (${transactions.length})`}>
          {transactions.length === 0 ? (
            <div className={styles.emptyTxns}>
              No transactions attached to this batch.
            </div>
          ) : (
            <div className={styles.txnsTableWrap}>
              <table className={styles.txnsTable} aria-label="Transactions in batch">
                <thead className={styles.txnsThead}>
                  <tr>
                    <th scope="col" className={styles.txnsTh}>Reference</th>
                    <th scope="col" className={styles.txnsTh} style={{ width: '108px' }}>Platform</th>
                    <th scope="col" className={`${styles.txnsTh} ${styles.txnsThRight}`} style={{ width: '120px' }}>USD</th>
                    <th scope="col" className={`${styles.txnsTh} ${styles.txnsThRight}`} style={{ width: '128px' }}>Naira</th>
                    <th scope="col" className={styles.txnsTh} style={{ width: '152px' }}>Confirmed</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr
                      key={t.id}
                      className={styles.txnsRow}
                      tabIndex={0}
                      onClick={() =>
                        navigate(adminPath(`/transactions/${encodeURIComponent(t.id)}`))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          navigate(adminPath(`/transactions/${encodeURIComponent(t.id)}`));
                        }
                      }}
                    >
                      <td className={styles.txnsTd}>
                        <div className={styles.txnsRefBlock}>
                          <span className={styles.txnsRef}>{t.public_reference}</span>
                          {t.platform_user_id && (
                            <span className={styles.txnsUser}>{t.platform_user_id}</span>
                          )}
                        </div>
                      </td>
                      <td className={styles.txnsTd}>
                        <span className={styles.txnsChip}>{t.platform_id}</span>
                      </td>
                      <td className={`${styles.txnsTd} ${styles.txnsTdRight}`}>
                        <span className={styles.txnsMono}>
                          {formatUsd(t.amount_usd_settled)}
                        </span>
                      </td>
                      <td className={`${styles.txnsTd} ${styles.txnsTdRight}`}>
                        <span className={styles.txnsMono}>
                          {formatNaira(t.amount_ngn)}
                        </span>
                      </td>
                      <td className={styles.txnsTd}>
                        <span className={styles.txnsTime}>
                          {formatDateTime(t.confirmed_at)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
      Back to settlements
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

function OutcomeTile({ label, value, caption, accent = false }) {
  return (
    <div className={[styles.outcomeTile, accent && styles.outcomeTileAccent].filter(Boolean).join(' ')}>
      <div className={styles.outcomeLabel}>{label}</div>
      <div className={styles.outcomeValue}>{value}</div>
      {caption && <div className={styles.outcomeCaption}>{caption}</div>}
    </div>
  );
}

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
          <span className={valueClass}>
            {value || <span className={styles.fieldEmpty}>—</span>}
          </span>
        )}
        {copyable && value && (
          <button
            type="button"
            className={[styles.copyButton, isCopied && styles.copyButtonActive].filter(Boolean).join(' ')}
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
