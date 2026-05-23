import { IconChevron } from '@components/ui/icons/IconChevron';
import styles from '@styles/ui/admin/audit-log-row.module.css';

/* ──────────────────────────────────────────────────────────────────
 * AuditLogRow
 *
 * Prose-first row for the audit log. Each entry reads as a natural
 * sentence attributing an action to an operator, highlighting the
 * affected entity IDs as clickable inlines, and surfacing before/
 * after state on expand.
 *
 * Used on
 *   Audit log screen                    (all rows, cursor paginated)
 *   Platform detail activity section    (filtered by platformId)
 *   Transaction detail activity timeline (filtered by sessionId)
 *
 * Shape (consumer is expected to compose this inside a <table> +
 * <tbody>): each row renders a collapsed <tr> and, when expanded,
 * an additional full-span <tr> with the before/after diff. This
 * keeps tabular semantics intact while handling variable height.
 *
 * ── Props ──
 *
 * entry             | audit log entry from MockAdminProvider
 * expanded          | boolean | whether before/after is showing
 * onToggleExpand    | () => void | required when collapsible
 * onOperatorClick   | (operatorId) => void | filter by operator
 * onEntityClick     | (entityType, entityId) => void | jump to entity
 * showDate          | default true | render the left timestamp column
 * className         | class merge on the collapsed row
 *
 * ── Accessibility ──
 *
 * Expand toggle: aria-expanded reflects state. When expanded, the
 * diff row has role="region" with aria-label describing the action.
 * Entity and operator links use <button> so screen readers announce
 * them as interactive; visual treatment makes them look like subtle
 * links without the generic underline.
 * ────────────────────────────────────────────────────────────────── */

// ─── Small inlines ───────────────────────────────────────────────

function OperatorInline({ operatorEmail, operatorId, onClick }) {
  const name = (operatorEmail?.split('@')[0]) || `Operator ${operatorId}`;
  if (!onClick) {
    return <strong className={styles.operatorStatic}>{name}</strong>;
  }
  return (
    <button
      type="button"
      className={styles.operatorLink}
      onClick={(event) => { event.stopPropagation(); onClick(operatorId); }}
    >
      {name}
    </button>
  );
}

function EntityInline({ type, id, label, onClick }) {
  const text = label || id;
  if (!onClick) {
    return <code className={styles.entityStatic}>{text}</code>;
  }
  return (
    <button
      type="button"
      className={styles.entityLink}
      onClick={(event) => { event.stopPropagation(); onClick(type, id); }}
      aria-label={`Jump to ${type} ${id}`}
    >
      <code>{text}</code>
    </button>
  );
}

// ─── Formatters for every action type ────────────────────────────

function formatRateUpdate(entry, handlers) {
  const before = entry.before?.buyRate;
  const after = entry.after?.buyRate;
  return (
    <>
      <OperatorInline {...handlers} operatorEmail={entry.operatorEmail} operatorId={entry.operatorId} />
      {' updated the rate for '}
      <EntityInline {...handlers} type="rate" id="NGN_USDT" label="NGN/USDT" />
      {before != null && <>{' from '}<code className={styles.value}>{Number(before).toFixed(2)}</code></>}
      {after != null && <>{' to '}<code className={styles.value}>{Number(after).toFixed(2)}</code></>}
    </>
  );
}

function formatRateToggle(entry, handlers) {
  const enabled = entry.after?.isActive;
  return (
    <>
      <OperatorInline {...handlers} operatorEmail={entry.operatorEmail} operatorId={entry.operatorId} />
      {enabled ? ' enabled ' : ' disabled '}
      the manual rate source.
    </>
  );
}

function formatFlipMerchant(entry, handlers) {
  const before = entry.before?.preferredMerchantId || 'none';
  const after = entry.after?.preferredMerchantId;
  return (
    <>
      <OperatorInline {...handlers} operatorEmail={entry.operatorEmail} operatorId={entry.operatorId} />
      {' flipped preferred merchant on '}
      <EntityInline {...handlers} type="corridor" id={entry.entityId} />
      {' from '}<strong className={styles.inlineStrong}>{before}</strong>
      {' to '}<strong className={styles.inlineStrong}>{after}</strong>
    </>
  );
}

function formatCorridorPause(entry, handlers) {
  const reason = entry.metadata?.reason;
  return (
    <>
      <OperatorInline {...handlers} operatorEmail={entry.operatorEmail} operatorId={entry.operatorId} />
      {' paused corridor '}
      <EntityInline {...handlers} type="corridor" id={entry.entityId} />
      {reason && (
        <>
          {'. Reason: '}
          <em className={styles.reason}>{'"'}{reason}{'"'}</em>
        </>
      )}
    </>
  );
}

function formatCorridorUnpause(entry, handlers) {
  return (
    <>
      <OperatorInline {...handlers} operatorEmail={entry.operatorEmail} operatorId={entry.operatorId} />
      {' unpaused corridor '}
      <EntityInline {...handlers} type="corridor" id={entry.entityId} />
    </>
  );
}

function formatCountryStateChange(entry, handlers) {
  const code = entry.after?.countryCode;
  const before = entry.before?.status || 'none';
  const after = entry.after?.status;
  return (
    <>
      <OperatorInline {...handlers} operatorEmail={entry.operatorEmail} operatorId={entry.operatorId} />
      {' changed country '}
      {code && <strong className={styles.inlineStrong}>{code}</strong>}
      {' on '}
      <EntityInline {...handlers} type="platform" id={entry.entityId} />
      {' from '}<strong className={styles.inlineStrong}>{before}</strong>
      {' to '}<strong className={styles.inlineStrong}>{after}</strong>
    </>
  );
}

function formatSettlementTrigger(entry, handlers) {
  const count = entry.metadata?.transactionCount ?? 0;
  const total = entry.metadata?.totalUsdSettled;
  return (
    <>
      <OperatorInline {...handlers} operatorEmail={entry.operatorEmail} operatorId={entry.operatorId} />
      {' triggered settlement batch '}
      <EntityInline {...handlers} type="settlement" id={entry.entityId} />
      {': '}
      <strong className={styles.inlineStrong}>{count} transaction{count === 1 ? '' : 's'}</strong>
      {total != null && (
        <>{', '}<strong className={styles.inlineStrong}>${Number(total).toFixed(2)} USDT</strong></>
      )}
    </>
  );
}

function formatOperatorInvite(entry, handlers) {
  return (
    <>
      <OperatorInline {...handlers} operatorEmail={entry.operatorEmail} operatorId={entry.operatorId} />
      {' invited '}
      <strong className={styles.inlineStrong}>{entry.metadata?.email}</strong>
      {' as '}
      <strong className={styles.inlineStrong}>{entry.metadata?.role}</strong>
    </>
  );
}

function formatOperatorRevoke(entry, handlers) {
  return (
    <>
      <OperatorInline {...handlers} operatorEmail={entry.operatorEmail} operatorId={entry.operatorId} />
      {' revoked access for '}
      <EntityInline {...handlers} type="operator" id={entry.entityId} label={`Operator ${entry.entityId}`} />
    </>
  );
}

function formatPasskeyEnrolled(entry, handlers) {
  const device = entry.metadata?.deviceLabel || 'unlabelled device';
  return (
    <>
      <OperatorInline {...handlers} operatorEmail={entry.operatorEmail} operatorId={entry.operatorId} />
      {' enrolled a new passkey on '}
      <strong className={styles.inlineStrong}>{device}</strong>
    </>
  );
}

function formatPasskeyRevoked(entry, handlers) {
  const passkeyId = entry.metadata?.passkeyId;
  return (
    <>
      <OperatorInline {...handlers} operatorEmail={entry.operatorEmail} operatorId={entry.operatorId} />
      {' revoked a passkey'}
      {passkeyId && (<>{' '}<code className={styles.value}>{'#'}{passkeyId}</code></>)}
    </>
  );
}

// ── Phase 7E auth surface ────────────────────────────────────────

function formatLoginPassword(entry, handlers) {
  return (
    <>
      <OperatorInline {...handlers} operatorEmail={entry.operatorEmail} operatorId={entry.operatorId} />
      {' signed in with email and a 6-digit code.'}
    </>
  );
}

function formatLoginPasskey(entry, handlers) {
  return (
    <>
      <OperatorInline {...handlers} operatorEmail={entry.operatorEmail} operatorId={entry.operatorId} />
      {' signed in with a passkey.'}
    </>
  );
}

function formatLoginFailed(entry) {
  // No actor | actor_id is null on failed sign-ins by design
  // (we never confirmed an operator). Reason lives in metadata.
  const email = entry.metadata?.email;
  const reason = entry.metadata?.reason;
  return (
    <>
      <strong className={styles.inlineStrong}>Failed sign-in</strong>
      {email && (
        <>
          {' for '}
          <code className={styles.value}>{email}</code>
        </>
      )}
      {reason && (
        <>
          {' | reason: '}
          <em className={styles.reason}>{reason.replace(/_/g, ' ')}</em>
        </>
      )}
    </>
  );
}

function formatLogout(entry, handlers) {
  return (
    <>
      <OperatorInline {...handlers} operatorEmail={entry.operatorEmail} operatorId={entry.operatorId} />
      {' signed out.'}
    </>
  );
}

function formatPasswordSet(entry, handlers) {
  const wasChange = entry.metadata?.action === 'auth.password_changed';
  return (
    <>
      <OperatorInline {...handlers} operatorEmail={entry.operatorEmail} operatorId={entry.operatorId} />
      {wasChange ? ' changed their password.' : ' set their password.'}
    </>
  );
}

function formatTotpEnrolled(entry, handlers) {
  return (
    <>
      <OperatorInline {...handlers} operatorEmail={entry.operatorEmail} operatorId={entry.operatorId} />
      {' linked an authenticator app.'}
    </>
  );
}

function formatInvitationAccepted(entry, handlers) {
  return (
    <>
      <OperatorInline {...handlers} operatorEmail={entry.operatorEmail} operatorId={entry.operatorId} />
      {' accepted their invitation.'}
    </>
  );
}

function formatInvitationRevoked(entry, handlers) {
  const targetEmail = entry.metadata?.email;
  return (
    <>
      <OperatorInline {...handlers} operatorEmail={entry.operatorEmail} operatorId={entry.operatorId} />
      {' revoked an invitation'}
      {targetEmail && (
        <>
          {' to '}
          <strong className={styles.inlineStrong}>{targetEmail}</strong>
        </>
      )}
    </>
  );
}

function formatRateSetManual(entry, handlers) {
  const buy = entry.metadata?.buyRate ?? entry.after?.buyRate;
  return (
    <>
      <OperatorInline {...handlers} operatorEmail={entry.operatorEmail} operatorId={entry.operatorId} />
      {' set a manual rate'}
      {buy != null && (
        <>
          {' of '}
          <code className={styles.value}>{Number(buy).toFixed(2)}</code>
        </>
      )}
    </>
  );
}

function formatUnknown(entry, handlers) {
  return (
    <>
      <OperatorInline {...handlers} operatorEmail={entry.operatorEmail} operatorId={entry.operatorId} />
      {' performed '}
      <code className={styles.value}>{entry.action}</code>
      {' on '}
      <EntityInline {...handlers} type={entry.entityType} id={entry.entityId} />
    </>
  );
}

const FORMATTERS = {
  // Domain (earlier phases)
  'rate.update': formatRateUpdate,
  'rate.set_manual': formatRateSetManual,
  'rate.toggle_manual': formatRateToggle,
  'corridor.flip_merchant': formatFlipMerchant,
  'corridor.pause': formatCorridorPause,
  'corridor.unpause': formatCorridorUnpause,
  'platform.update_country_state': formatCountryStateChange,
  'settlement.trigger_batch': formatSettlementTrigger,

  // Phase 7E auth surface
  'auth.login.password': formatLoginPassword,
  'auth.login.passkey': formatLoginPasskey,
  'auth.login.failed': formatLoginFailed,
  'auth.logout': formatLogout,
  'auth.password_set': formatPasswordSet,
  'auth.password_changed': formatPasswordSet,
  'auth.totp_enrolled': formatTotpEnrolled,
  'auth.passkey_enrolled': formatPasskeyEnrolled,
  'auth.passkey_revoked': formatPasskeyRevoked,

  // Operator management
  'operator.invite': formatOperatorInvite,
  'operator.invitation_accepted': formatInvitationAccepted,
  'operator.invitation_revoked': formatInvitationRevoked,
  'operator.revoke': formatOperatorRevoke,
};

// ─── Time + diff renderers ───────────────────────────────────────

function formatTimestamp(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  if (isYesterday) {
    return `Yesterday ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
  }
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) +
    ' ' + date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function renderJsonBlock(label, snapshot, compareAgainst) {
  if (snapshot == null) {
    return (
      <div className={styles.diffColumn}>
        <div className={styles.diffColumnLabel}>{label}</div>
        <div className={styles.diffNull}>(no state)</div>
      </div>
    );
  }

  const keys = Object.keys(snapshot);
  return (
    <div className={styles.diffColumn}>
      <div className={styles.diffColumnLabel}>{label}</div>
      <pre className={styles.diffJson}>
        <span className={styles.diffBrace}>{'{'}</span>
        {keys.map((key, idx) => {
          const myValue = snapshot[key];
          const otherValue = compareAgainst ? compareAgainst[key] : undefined;
          const changed = JSON.stringify(myValue) !== JSON.stringify(otherValue);
          const isLast = idx === keys.length - 1;
          return (
            <div key={key} className={changed ? styles.diffChanged : styles.diffUnchanged}>
              {'  '}
              <span className={styles.diffKey}>"{key}"</span>
              {': '}
              <span className={styles.diffVal}>{JSON.stringify(myValue)}</span>
              {!isLast && ','}
            </div>
          );
        })}
        <span className={styles.diffBrace}>{'}'}</span>
      </pre>
    </div>
  );
}

// ─── Main row ────────────────────────────────────────────────────

export function AuditLogRow({
  entry,
  expanded = false,
  onToggleExpand,
  onOperatorClick,
  onEntityClick,
  showDate = true,
  className,
}) {
  if (!entry) return null;

  const handlers = { onOperatorClick, onEntityClick };
  const formatter = FORMATTERS[entry.action] || formatUnknown;
  const sentence = formatter(entry, handlers);
  const canExpand =
    entry.before != null ||
    entry.after != null ||
    (entry.metadata && Object.keys(entry.metadata).filter(k => k !== 'requestId').length > 0);

  // Collapsed row has 3 cells by default (or 2 when showDate=false)
  const collapsedCols = (showDate ? 1 : 0) + 1 + 1;

  const handleRowClick = () => {
    if (canExpand && onToggleExpand) onToggleExpand();
  };

  return (
    <>
      <tr
        className={[styles.row, expanded && styles.rowExpanded, className].filter(Boolean).join(' ')}
        data-action={entry.action}
      >
        {showDate && (
          <td className={styles.timestampCell}>
            <time dateTime={entry.occurredAt} className={styles.timestamp}>
              {formatTimestamp(entry.occurredAt)}
            </time>
          </td>
        )}
        <td
          className={styles.proseCell}
          onClick={handleRowClick}
          style={canExpand ? { cursor: 'pointer' } : undefined}
        >
          <div className={styles.prose}>
            {sentence}
          </div>
        </td>
        <td className={styles.chevronCell}>
          {canExpand && (
            <button
              type="button"
              className={`${styles.chevronButton} ${expanded ? styles.chevronExpanded : ''}`}
              onClick={(event) => { event.stopPropagation(); onToggleExpand?.(); }}
              aria-expanded={expanded}
              aria-label={expanded ? 'Hide details' : 'Show details'}
            >
              <IconChevron size={14} />
            </button>
          )}
        </td>
      </tr>

      {expanded && canExpand && (
        <tr className={styles.diffRow}>
          <td colSpan={collapsedCols} className={styles.diffCell}>
            <div
              className={styles.diffContainer}
              role="region"
              aria-label={`Details for ${entry.action}`}
            >
              {(entry.before != null || entry.after != null) && (
                <div className={styles.diffGrid}>
                  {renderJsonBlock('Before', entry.before, entry.after)}
                  {renderJsonBlock('After', entry.after, entry.before)}
                </div>
              )}

              {entry.metadata && Object.keys(entry.metadata).filter(k => k !== 'requestId').length > 0 && (
                <div className={styles.metadataBlock}>
                  <div className={styles.metadataLabel}>Metadata</div>
                  <pre className={styles.metadataJson}>
                    {JSON.stringify(
                      Object.fromEntries(
                        Object.entries(entry.metadata).filter(([k]) => k !== 'requestId')
                      ),
                      null,
                      2
                    )}
                  </pre>
                </div>
              )}

              {entry.metadata?.requestId && (
                <div className={styles.requestId}>
                  Request ID: <code>{entry.metadata.requestId}</code>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
