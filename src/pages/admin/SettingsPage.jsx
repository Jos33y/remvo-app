import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { AdminShell } from '@components/layout/admin/AdminShell';
import { StatusBadge } from '@components/ui/admin/StatusBadge';
import { OperatorBadge } from '@components/ui/admin/OperatorBadge';
import { ConfirmDialog } from '@components/ui/admin/ConfirmDialog';
import { useToast } from '@components/ui/admin/ToastProvider';
import { adminPath } from '@app/adminRouter';
import { useOperatorSession } from '@context/AdminContext';
import {
  listOperators as apiListOperators,
  listInvitations as apiListInvitations,
  revokeInvitation as apiRevokeInvitation,
  revokeOperator as apiRevokeOperator,
  listPasskeys as apiListPasskeys,
  revokePasskey as apiRevokePasskey,
  fetchSettings as apiFetchSettings,
  patchSettings as apiPatchSettings,
  sendTestAlert as apiSendTestAlert,
  signOutOthers as apiSignOutOthers,
  signOutAll as apiSignOutAll,
  AuthApiError,
} from '@lib/authClient';
import { InviteOperatorDialog } from './InviteOperatorDialog';
import styles from '@styles/pages/admin/settings-page.module.css';

/* ──────────────────────────────────────────────────────────────────
 * SettingsPage
 *
 * Route: /admin/settings | register: neutral.
 *
 * Phase 7E.x wiring | every section is now backend-backed.
 *
 *   1. Operators       | live | list + invite (owner) + revoke
 *   2. Pending invites | live | revoke (owner)
 *   3. Passkeys        | live | enrol + revoke (per current operator)
 *   4. Notifications   | live | telegram chat + thresholds (owner edit)
 *   5. Security        | live | TOTP policy + auto-revoke (owner edit)
 *   6. Sign-out tools  | live | own-other-devices + everyone (owner)
 *   7. About           | static | environment + retention constants
 *
 * Owner gating for sections 4-6 is enforced on the server; the UI
 * mirrors it for accessibility (Save buttons disabled and labelled,
 * not just hidden | a non-owner is told why).
 *
 * Auth-mode awareness:
 *   - VITE_REMVO_AUTH_MODE=api  | hits real endpoints
 *   - any other value           | sections that need the API render an
 *                                 inert hint rather than crashing on
 *                                 fetch failures
 *
 * Related docs:
 *   SECTION_1_AUTH_BUILD_BRIEF.md §03.4
 *   src/lib/authClient.js (operators, invitations, passkeys, settings, sign-out)
 * ────────────────────────────────────────────────────────────────── */

const AUTH_MODE = import.meta.env.VITE_REMVO_AUTH_MODE || 'local';
const IS_API_MODE = AUTH_MODE === 'api';

const ROLE_LABELS = {
  owner: 'Owner',
  operator: 'Operator',
};

// Strict literal the operator must type to confirm a global sign-out.
// Localised? Not at launch. The token is a deliberate friction gate;
// translating it would weaken the gate by easing muscle-memory typing.
const SIGN_OUT_ALL_TOKEN = 'SIGN OUT EVERYONE';

function formatAbsolute(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatTimeAgo(iso) {
  if (!iso) return 'Never';
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function deriveInitials(displayName) {
  if (typeof displayName !== 'string' || displayName.length === 0) return '??';
  const parts = displayName.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  const single = parts[0];
  return (single[0] + (single[1] || single[0])).toUpperCase();
}

/**
 * Coerce a value-of-unknown-type to a finite number, falling back to
 * the supplied default. Postgres NUMERIC columns come over the wire
 * as strings; form inputs as strings; defaults as numbers. One helper
 * normalises all three.
 */
function toNumber(v, fallback = 0) {
  if (v === null || v === undefined || v === '') return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Map an API operator (snake_case) to the shape OperatorBadge + UI
 * row markup expects.
 */
function fromApiOperator(o) {
  return {
    id: o.id,
    email: o.email,
    displayName: o.display_name,
    avatarInitials: deriveInitials(o.display_name),
    role: o.role,
    isActive: o.is_active,
    hasPassword: o.has_password,
    hasTotp: o.has_totp,
    lastLoginAt: o.last_login_at,
    createdAt: o.created_at,
  };
}

function Section({ title, description, aside, children }) {
  return (
    <section className={styles.section}>
      <header className={styles.sectionHeader}>
        <div className={styles.sectionHeaderMain}>
          <h2 className={styles.sectionTitle}>{title}</h2>
          {description && <p className={styles.sectionDescription}>{description}</p>}
        </div>
        {aside && <div className={styles.sectionAside}>{aside}</div>}
      </header>
      <div className={styles.sectionBody}>{children}</div>
    </section>
  );
}

function Row({ label, value, hint }) {
  return (
    <div className={styles.row}>
      <div className={styles.rowLabel}>
        <span className={styles.rowLabelText}>{label}</span>
        {hint && <span className={styles.rowHint}>{hint}</span>}
      </div>
      <div className={styles.rowValue}>{value}</div>
    </div>
  );
}

/**
 * Small inline role pill. Owner gets a gold-tinted background; operator
 * a neutral one. Same height as the existing .youTag, smaller text so
 * it sits beside a name without dominating.
 */
function RoleChip({ role }) {
  const label = ROLE_LABELS[role] || role;
  const className = `${styles.roleChip} ${
    role === 'owner' ? styles.roleChipOwner : styles.roleChipOperator
  }`;
  return <span className={className}>{label}</span>;
}

/**
 * Mono-absolute + muted-relative timestamp pair. Matches the
 * CorridorDetailPage treatment so audit-style metadata reads
 * consistently across screens.
 */
function TimePair({ iso, fallback = '-' }) {
  if (!iso) {
    return <span className={styles.timePairMono}>{fallback}</span>;
  }
  return (
    <span className={styles.timePair}>
      <span className={styles.timePairMono}>{formatAbsolute(iso)}</span>
      <span className={styles.timePairMuted}>{formatTimeAgo(iso)}</span>
    </span>
  );
}

/**
 * Footer line shown at the bottom of editable sections: who saved last
 * and when. Links presentationally to OperatorBadge so the reader
 * recognises the pattern from audit log rows.
 */
function SavedAttribution({ updatedAt, updatedBy }) {
  if (!updatedAt && !updatedBy) {
    return (
      <p className={styles.savedAttribution}>
        Not yet configured.
      </p>
    );
  }
  if (!updatedBy) {
    return (
      <p className={styles.savedAttribution}>
        Last updated {formatTimeAgo(updatedAt)}.
      </p>
    );
  }
  return (
    <p className={styles.savedAttribution}>
      Last updated by <strong>{updatedBy.display_name}</strong>{' '}
      {formatTimeAgo(updatedAt)}.
    </p>
  );
}

// ══════════════════════════════════════════════════════════════════
//  Operators section
// ══════════════════════════════════════════════════════════════════

function OperatorsSection({ currentOperator, onChange }) {
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(IS_API_MODE);
  const [error, setError] = useState(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [revoking, setRevoking] = useState(false);
  const [actionError, setActionError] = useState(null);

  const isOwner = currentOperator?.role === 'owner';

  const refresh = useCallback(async () => {
    if (!IS_API_MODE) {
      setOperators([]);
      setLoading(false);
      return;
    }
    try {
      const result = await apiListOperators();
      setOperators(result.items.map(fromApiOperator));
      setError(null);
    } catch (err) {
      setError(err instanceof AuthApiError ? err.message : 'Could not load operators.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const sortedOperators = useMemo(() => {
    return [...operators].sort((a, b) => {
      // Owners first; active before revoked; then most-recent login.
      if (a.role === 'owner' && b.role !== 'owner') return -1;
      if (b.role === 'owner' && a.role !== 'owner') return 1;
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
      return new Date(b.lastLoginAt || 0).getTime() - new Date(a.lastLoginAt || 0).getTime();
    });
  }, [operators]);

  function startRevoke(op) {
    setActionError(null);
    setRevokeTarget(op);
  }

  async function confirmRevoke() {
    if (!revokeTarget) return;
    setRevoking(true);
    try {
      await apiRevokeOperator({ operatorId: revokeTarget.id });
      setRevokeTarget(null);
      await refresh();
      onChange?.();
    } catch (err) {
      setActionError(
        err instanceof AuthApiError
          ? err.message
          : 'Could not revoke this operator.'
      );
    } finally {
      setRevoking(false);
    }
  }

  function handleInviteClose(didInvite) {
    setInviteOpen(false);
    if (didInvite) onChange?.();
  }

  return (
    <>
      <Section
        title="Operators"
        description="People with access to the admin panel. Owners can invite and revoke."
        aside={
          isOwner && IS_API_MODE ? (
            <button
              type="button"
              className={styles.primaryAction}
              onClick={() => setInviteOpen(true)}
            >
              Invite operator
            </button>
          ) : null
        }
      >
        {loading && <div className={styles.actionHint}>Loading operators...</div>}

        {error && (
          <div className={styles.errorHint}>{error}</div>
        )}

        {!loading && !error && operators.length === 0 && IS_API_MODE && (
          <div className={styles.actionHint}>No operators yet.</div>
        )}

        {!loading && !IS_API_MODE && (
          <div className={styles.actionHint}>
            Operator management is available when the admin app is
            connected to the auth API.
          </div>
        )}

        {!loading && !error && sortedOperators.length > 0 && (
          <ul className={styles.operatorList}>
            {sortedOperators.map((op) => {
              const isCurrent = currentOperator && op.id === currentOperator.id;
              const canRevoke =
                isOwner &&
                IS_API_MODE &&
                op.isActive &&
                !isCurrent &&
                op.role !== 'owner';
              return (
                <li key={op.id} className={styles.operatorRow}>
                  <div className={styles.operatorIdent}>
                    <OperatorBadge operator={op} size="md" />
                    <div className={styles.operatorText}>
                      <span className={styles.operatorEmail}>{op.email}</span>
                      <span className={styles.operatorMeta}>
                        <RoleChip role={op.role} />
                        <span className={styles.operatorMetaSeparator} aria-hidden="true">|</span>
                        <span className={styles.operatorMetaText}>
                          Last seen {formatTimeAgo(op.lastLoginAt)}
                        </span>
                      </span>
                    </div>
                  </div>
                  <div className={styles.operatorActions}>
                    {isCurrent && <span className={styles.youTag}>You</span>}
                    <StatusBadge status={op.isActive ? 'active' : 'revoked'} size="sm" />
                    <button
                      type="button"
                      className={styles.smallAction}
                      disabled={!canRevoke}
                      onClick={() => canRevoke && startRevoke(op)}
                      title={
                        isCurrent
                          ? 'You cannot revoke yourself'
                          : op.role === 'owner'
                            ? 'Owners cannot be revoked'
                            : !op.isActive
                              ? 'Already revoked'
                              : !isOwner
                                ? 'Only owners can revoke'
                                : 'Revoke this operator'
                      }
                    >
                      Revoke
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {actionError && (
          <p className={styles.errorGuardrail}>{actionError}</p>
        )}
      </Section>

      {inviteOpen && (
        <InviteOperatorDialog onClose={handleInviteClose} />
      )}

      <ConfirmDialog
        isOpen={revokeTarget != null}
        title="Revoke operator access?"
        body={
          revokeTarget && (
            <>
              <strong>{revokeTarget.displayName}</strong> ({revokeTarget.email})
              {' '}will lose access immediately. All their active sessions
              will be revoked. They keep showing up here as <em>revoked</em>
              for the audit trail.
            </>
          )
        }
        confirmLabel="Revoke"
        cancelLabel="Cancel"
        confirmVariant="destructive"
        isLoading={revoking}
        onCancel={() => !revoking && setRevokeTarget(null)}
        onConfirm={confirmRevoke}
      />
    </>
  );
}

// ══════════════════════════════════════════════════════════════════
//  Pending invitations section
// ══════════════════════════════════════════════════════════════════

function InvitationsSection({ currentOperator, refreshSignal }) {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(IS_API_MODE);
  const [error, setError] = useState(null);
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [revoking, setRevoking] = useState(false);
  const [actionError, setActionError] = useState(null);

  const isOwner = currentOperator?.role === 'owner';

  const refresh = useCallback(async () => {
    if (!IS_API_MODE) {
      setLoading(false);
      return;
    }
    try {
      const result = await apiListInvitations();
      setInvitations(result.items);
      setError(null);
    } catch (err) {
      setError(err instanceof AuthApiError ? err.message : 'Could not load invitations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, refreshSignal]);

  if (!IS_API_MODE) return null;
  if (loading) {
    return (
      <Section title="Pending invitations">
        <div className={styles.actionHint}>Loading...</div>
      </Section>
    );
  }
  if (error) {
    return (
      <Section title="Pending invitations">
        <div className={styles.errorHint}>{error}</div>
      </Section>
    );
  }
  if (invitations.length === 0) {
    // Quieter UI | hide section entirely when nothing's pending.
    return null;
  }

  async function confirmRevokeInvite() {
    if (!revokeTarget) return;
    setRevoking(true);
    try {
      await apiRevokeInvitation({ invitationId: revokeTarget.id });
      setRevokeTarget(null);
      await refresh();
    } catch (err) {
      setActionError(
        err instanceof AuthApiError
          ? err.message
          : 'Could not revoke this invitation.'
      );
    } finally {
      setRevoking(false);
    }
  }

  return (
    <>
      <Section
        title="Pending invitations"
        description="Sent but not yet accepted. Invitations expire 7 days after creation."
      >
        <ul className={styles.operatorList}>
          {invitations.map((inv) => {
            const expired = new Date(inv.expires_at).getTime() < Date.now();
            return (
              <li key={inv.id} className={styles.operatorRow}>
                <div className={styles.operatorIdent}>
                  <OperatorBadge
                    operator={{
                      displayName: inv.email,
                      avatarInitials: '?',
                    }}
                    size="md"
                  />
                  <div className={styles.operatorText}>
                    <span className={styles.operatorEmail}>{inv.email}</span>
                    <span className={styles.operatorMeta}>
                      <RoleChip role={inv.role} />
                      <span className={styles.operatorMetaSeparator} aria-hidden="true">|</span>
                      <span className={styles.operatorMetaText}>
                        Sent {formatTimeAgo(inv.created_at)}
                        {expired ? ' | Expired' : ''}
                      </span>
                    </span>
                  </div>
                </div>
                <div className={styles.operatorActions}>
                  <StatusBadge
                    status={expired ? 'revoked' : 'pending'}
                    size="sm"
                  />
                  <button
                    type="button"
                    className={styles.smallAction}
                    disabled={!isOwner}
                    onClick={() => isOwner && setRevokeTarget(inv)}
                    title={isOwner ? 'Revoke this invitation' : 'Only owners can revoke'}
                  >
                    Revoke
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        {actionError && (
          <p className={styles.errorGuardrail}>{actionError}</p>
        )}
      </Section>

      <ConfirmDialog
        isOpen={revokeTarget != null}
        title="Revoke invitation?"
        body={
          revokeTarget && (
            <>
              The invitation to <strong>{revokeTarget.email}</strong> will
              be revoked. The link in their email will stop working
              immediately. You can send a fresh one any time.
            </>
          )
        }
        confirmLabel="Revoke"
        cancelLabel="Cancel"
        confirmVariant="destructive"
        isLoading={revoking}
        onCancel={() => !revoking && setRevokeTarget(null)}
        onConfirm={confirmRevokeInvite}
      />
    </>
  );
}

// ══════════════════════════════════════════════════════════════════
//  Passkeys section
// ══════════════════════════════════════════════════════════════════

function PasskeysSection({ currentOperator }) {
  const navigate = useNavigate();
  const [passkeys, setPasskeys] = useState([]);
  const [loading, setLoading] = useState(IS_API_MODE);
  const [error, setError] = useState(null);
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [revoking, setRevoking] = useState(false);
  const [actionError, setActionError] = useState(null);

  const refresh = useCallback(async () => {
    if (!IS_API_MODE) {
      setLoading(false);
      return;
    }
    try {
      const result = await apiListPasskeys();
      setPasskeys(result.items);
      setError(null);
    } catch (err) {
      setError(err instanceof AuthApiError ? err.message : 'Could not load passkeys.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // The operator must keep at least one credential. If they have a
  // password set, that counts as a credential and any single passkey
  // is revocable.
  const onlyAccessIsThisPasskey =
    passkeys.length === 1 && !currentOperator?.hasPassword;

  async function confirmRevoke() {
    if (!revokeTarget) return;
    setRevoking(true);
    try {
      await apiRevokePasskey({ passkeyId: revokeTarget.id });
      setRevokeTarget(null);
      await refresh();
    } catch (err) {
      setActionError(
        err instanceof AuthApiError
          ? err.message
          : 'Could not revoke this passkey.'
      );
    } finally {
      setRevoking(false);
    }
  }

  return (
    <>
      <Section
        title="Passkeys"
        description="WebAuthn credentials enrolled for your account. Adding a second device reduces lock-out risk."
        aside={
          IS_API_MODE ? (
            <button
              type="button"
              className={styles.secondaryAction}
              onClick={() => navigate(adminPath('/enrol'))}
            >
              Add passkey
            </button>
          ) : null
        }
      >
        {loading && <div className={styles.actionHint}>Loading passkeys...</div>}

        {error && (
          <div className={styles.errorHint}>{error}</div>
        )}

        {!loading && !error && passkeys.length === 0 && IS_API_MODE && (
          <div className={styles.actionHint}>
            No passkeys enrolled. Add one to sign in without a password.
          </div>
        )}

        {!loading && !IS_API_MODE && (
          <div className={styles.actionHint}>
            Passkey management is available when the admin app is
            connected to the auth API.
          </div>
        )}

        {!loading && !error && passkeys.length > 0 && (
          <ul className={styles.passkeyList}>
            {passkeys.map((pk) => {
              const blocked = onlyAccessIsThisPasskey;
              return (
                <li key={pk.id} className={styles.passkeyRow}>
                  <div className={styles.passkeyIdent}>
                    <span className={styles.passkeyLabel}>
                      {pk.device_label || 'Unnamed device'}
                    </span>
                    <span className={styles.passkeyMeta}>
                      <span className={styles.passkeyMetaLabel}>Added</span>
                      <TimePair iso={pk.created_at} />
                      <span className={styles.passkeyMetaSeparator} aria-hidden="true">|</span>
                      <span className={styles.passkeyMetaLabel}>Last used</span>
                      <TimePair iso={pk.last_used_at} fallback="never" />
                    </span>
                  </div>
                  <button
                    type="button"
                    className={styles.smallAction}
                    disabled={blocked}
                    onClick={() => !blocked && setRevokeTarget(pk)}
                    title={
                      blocked
                        ? 'Cannot revoke your only credential. Add a second passkey or set a password first.'
                        : 'Revoke this passkey'
                    }
                  >
                    Revoke
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {onlyAccessIsThisPasskey && passkeys.length > 0 && (
          <p className={styles.guardrail}>
            You cannot revoke your only credential. Add a second passkey
            or set a password first.
          </p>
        )}

        {actionError && (
          <p className={styles.errorGuardrail}>{actionError}</p>
        )}
      </Section>

      <ConfirmDialog
        isOpen={revokeTarget != null}
        title="Revoke passkey?"
        body={
          revokeTarget && (
            <>
              <strong>{revokeTarget.device_label || 'This passkey'}</strong>
              {' '}will stop working for sign-in immediately. You can
              re-enrol it later if you change your mind.
            </>
          )
        }
        confirmLabel="Revoke"
        cancelLabel="Cancel"
        confirmVariant="destructive"
        isLoading={revoking}
        onCancel={() => !revoking && setRevokeTarget(null)}
        onConfirm={confirmRevoke}
      />
    </>
  );
}

// ══════════════════════════════════════════════════════════════════
//  Notifications section (NEW)
// ══════════════════════════════════════════════════════════════════
//
// Owner edits, all operators read. Form state is derived from the
// shared `settings` baseline once on first non-null prop, then operates
// locally. On Save, only changed keys are sent (avoids the empty-body
// 400). After success the parent's settings cache is updated AND our
// own form is re-derived so both sections see fresh metadata.

function NotificationsSection({ settings, settingsLoading, isOwner, onUpdated }) {
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [actionError, setActionError] = useState(null);

  // Initialise once when settings first arrive. Subsequent changes
  // to props.settings (after a Security save, for instance) update
  // the baseline but do NOT clobber an in-progress edit.
  useEffect(() => {
    if (settings && form === null) {
      setForm({
        telegram_chat_id: settings.telegram_chat_id || '',
        wallet_low_threshold_usd: toNumber(settings.wallet_low_threshold_usd, 200),
        settlement_sla_hours: toNumber(settings.settlement_sla_hours, 12),
        rate_deviation_pct: toNumber(settings.rate_deviation_pct, 5),
      });
    }
  }, [settings, form]);

  // Diff against the current baseline. Empty diff => Save disabled.
  const diff = useMemo(() => {
    if (!form || !settings) return {};
    const out = {};

    const formChat = form.telegram_chat_id.trim() === '' ? null : form.telegram_chat_id.trim();
    const baseChat = settings.telegram_chat_id || null;
    if (formChat !== baseChat) out.telegram_chat_id = formChat;

    const baseThreshold = toNumber(settings.wallet_low_threshold_usd, 200);
    if (form.wallet_low_threshold_usd !== baseThreshold) {
      out.wallet_low_threshold_usd = form.wallet_low_threshold_usd;
    }

    const baseSla = toNumber(settings.settlement_sla_hours, 12);
    if (form.settlement_sla_hours !== baseSla) {
      out.settlement_sla_hours = form.settlement_sla_hours;
    }

    const baseDev = toNumber(settings.rate_deviation_pct, 5);
    if (form.rate_deviation_pct !== baseDev) {
      out.rate_deviation_pct = form.rate_deviation_pct;
    }

    return out;
  }, [form, settings]);

  const isDirty = Object.keys(diff).length > 0;
  const editable = isOwner && IS_API_MODE && !settingsLoading;

  function handleRevert() {
    if (!settings) return;
    setForm({
      telegram_chat_id: settings.telegram_chat_id || '',
      wallet_low_threshold_usd: toNumber(settings.wallet_low_threshold_usd, 200),
      settlement_sla_hours: toNumber(settings.settlement_sla_hours, 12),
      rate_deviation_pct: toNumber(settings.rate_deviation_pct, 5),
    });
    setActionError(null);
  }

  async function handleSave() {
    if (!isDirty || saving) return;
    setSaving(true);
    setActionError(null);
    try {
      const next = await apiPatchSettings(diff);
      onUpdated(next);
      // Re-init from saved baseline so the diff is empty on the next render.
      setForm({
        telegram_chat_id: next.telegram_chat_id || '',
        wallet_low_threshold_usd: toNumber(next.wallet_low_threshold_usd, 200),
        settlement_sla_hours: toNumber(next.settlement_sla_hours, 12),
        rate_deviation_pct: toNumber(next.rate_deviation_pct, 5),
      });
      toast.success('Notifications saved');
    } catch (err) {
      const message = err instanceof AuthApiError ? err.message : 'Could not save notifications.';
      setActionError(message);
      toast.error('Save failed', message);
    } finally {
      setSaving(false);
    }
  }

  /**
   * Send a test Telegram alert through the live alerter. Reports the
   * source the alerter resolved (database vs env fallback) so the
   * operator can verify their configuration intent without parsing
   * server logs.
   *
   * The alerter dedupes on dedupeKey for 15 minutes. The backend
   * generates a unique key per click so back-to-back tests both land.
   * Concurrent clicks are guarded by `testing` state.
   *
   * Save guards (isDirty) DO NOT block testing | the operator may
   * legitimately want to test the currently-saved config without
   * overwriting their in-progress edit.
   */
  async function handleTest() {
    if (testing) return;
    setTesting(true);
    try {
      const result = await apiSendTestAlert();
      if (result.ok) {
        const sourceLabel =
          result.chat_id_source === 'database' ? 'database'
            : result.chat_id_source === 'env_fallback' ? 'env fallback'
              : 'unknown';
        toast.success(
          'Test alert sent',
          `Source: ${sourceLabel}. Check your Telegram chat.`
        );
      } else if (result.chat_id_source === 'none') {
        toast.error(
          'No destination configured',
          'Set a Telegram chat ID above (or in env) and try again.'
        );
      } else {
        toast.error(
          'Send failed',
          'The alerter ran but the message was not delivered. Check API logs.'
        );
      }
    } catch (err) {
      const message = err instanceof AuthApiError ? err.message : 'Could not send test alert.';
      toast.error('Test failed', message);
    } finally {
      setTesting(false);
    }
  }

  return (
    <Section
      title="Notifications"
      description="Where operational alerts and summary reports are delivered."
    >
      {settingsLoading || form === null ? (
        <div className={styles.actionHint}>Loading notifications...</div>
      ) : (
        <>
          {!IS_API_MODE && (
            <div className={styles.actionHint}>
              Notification routing is available when the admin app is
              connected to the auth API.
            </div>
          )}

          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <label className={styles.formLabel} htmlFor="settings-telegram">
                Telegram chat ID
              </label>
              <input
                id="settings-telegram"
                type="text"
                className={`${styles.formInput} ${styles.formInputMono}`}
                value={form.telegram_chat_id}
                onChange={(e) => setForm({ ...form, telegram_chat_id: e.target.value })}
                disabled={!editable || saving}
                placeholder="-1001234567890"
                autoComplete="off"
                spellCheck={false}
              />
              <span className={styles.formHint}>
                Numeric chat ID from BotFather. Leave blank to disable Telegram alerts.
              </span>
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel} htmlFor="settings-threshold">
                Wallet low threshold (USD)
              </label>
              <input
                id="settings-threshold"
                type="number"
                min="0"
                step="0.01"
                className={`${styles.formInput} ${styles.formInputMono}`}
                value={form.wallet_low_threshold_usd}
                onChange={(e) => setForm({ ...form, wallet_low_threshold_usd: toNumber(e.target.value) })}
                disabled={!editable || saving}
              />
              <span className={styles.formHint}>
                Alert when the operating wallet balance drops below this amount.
              </span>
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel} htmlFor="settings-sla">
                Settlement SLA breach (hours)
              </label>
              <input
                id="settings-sla"
                type="number"
                min="1"
                step="1"
                className={`${styles.formInput} ${styles.formInputMono}`}
                value={form.settlement_sla_hours}
                onChange={(e) => setForm({ ...form, settlement_sla_hours: toNumber(e.target.value) })}
                disabled={!editable || saving}
              />
              <span className={styles.formHint}>
                Alert when a pending settlement batch ages past this point.
              </span>
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel} htmlFor="settings-deviation">
                Rate deviation alert (%)
              </label>
              <input
                id="settings-deviation"
                type="number"
                min="0"
                max="100"
                step="0.1"
                className={`${styles.formInput} ${styles.formInputMono}`}
                value={form.rate_deviation_pct}
                onChange={(e) => setForm({ ...form, rate_deviation_pct: toNumber(e.target.value) })}
                disabled={!editable || saving}
              />
              <span className={styles.formHint}>
                Alert when the manual rate drifts from CoinGecko by more than this.
              </span>
            </div>
          </div>

          {actionError && (
            <p className={styles.errorGuardrail}>{actionError}</p>
          )}

          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.primaryAction}
              onClick={handleSave}
              disabled={!editable || !isDirty || saving}
              title={
                !editable
                  ? 'Only owners can save notification settings'
                  : !isDirty
                    ? 'No changes to save'
                    : 'Save notification settings'
              }
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              className={styles.secondaryAction}
              onClick={handleRevert}
              disabled={!isDirty || saving}
              title={isDirty ? 'Discard unsaved changes' : 'No changes to discard'}
            >
              Revert
            </button>
            <button
              type="button"
              className={styles.secondaryAction}
              onClick={handleTest}
              disabled={!editable || testing || saving}
              title={
                !editable
                  ? 'Only owners can send test alerts'
                  : 'Send a test Telegram alert through the live alerter'
              }
            >
              {testing ? 'Sending...' : 'Send test alert'}
            </button>
            <SavedAttribution
              updatedAt={settings?.updated_at}
              updatedBy={settings?.updated_by}
            />
          </div>
        </>
      )}
    </Section>
  );
}

// ══════════════════════════════════════════════════════════════════
//  Security policy section (NEW)
// ══════════════════════════════════════════════════════════════════
//
// Owner edits, all operators read. Two real toggles:
//   require_totp_for_owners     | enabling 409s if any owner lacks TOTP
//   auto_revoke_inactive_days   | 0 disables the sweep
//
// IP allow-list is Phase 7+; not present here.
//
// The TOTP-not-ready 409 renders inline (with the offending email list)
// rather than as a toast. The user must resolve the readiness gap
// before saving; a transient toast would let them dismiss the issue.

/* PHASE_7F_S3_LAUNCH_TOGGLES_SECTION
 * Owner-edit, all-read; renders an inert hint in non-API mode.
 * Mirrors SecuritySection / NotificationsSection patterns. */
function LaunchTogglesSection({ settings, settingsLoading, isOwner, onUpdated }) {
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    if (settings && form === null) {
      setForm({
        analytics_enabled: !!settings.analytics_enabled,
        withdrawals_enabled: !!settings.withdrawals_enabled,
      });
    }
  }, [settings, form]);

  const diff = useMemo(() => {
    if (!form || !settings) return {};
    const out = {};
    if (form.analytics_enabled !== !!settings.analytics_enabled) {
      out.analytics_enabled = form.analytics_enabled;
    }
    if (form.withdrawals_enabled !== !!settings.withdrawals_enabled) {
      out.withdrawals_enabled = form.withdrawals_enabled;
    }
    return out;
  }, [form, settings]);

  const isDirty = Object.keys(diff).length > 0;
  const editable = isOwner && IS_API_MODE && !settingsLoading;

  function handleRevert() {
    if (!settings) return;
    setForm({
      analytics_enabled: !!settings.analytics_enabled,
      withdrawals_enabled: !!settings.withdrawals_enabled,
    });
    setActionError(null);
  }

  async function handleSave() {
    if (!isDirty || saving) return;
    setSaving(true);
    setActionError(null);
    try {
      const next = await apiPatchSettings(diff);
      onUpdated(next);
      setForm({
        analytics_enabled: !!next.analytics_enabled,
        withdrawals_enabled: !!next.withdrawals_enabled,
      });
      toast.success('Launch toggles saved');
    } catch (err) {
      const message = err instanceof AuthApiError ? err.message : 'Could not save launch toggles.';
      setActionError(message);
      toast.error('Save failed', message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Section
      title="Launch toggles"
      description="Enable features for operators once you've validated the data they expose."
    >
      {settingsLoading || form === null ? (
        <div className={styles.actionHint}>Loading launch toggles...</div>
      ) : (
        <>
          {!IS_API_MODE && (
            <div className={styles.actionHint}>
              Launch toggles are available when the admin app is
              connected to the auth API.
            </div>
          )}

          <div className={styles.toggleRow}>
            <div className={styles.toggleLabel}>
              <span className={styles.toggleLabelText}>Analytics</span>
              <span className={styles.toggleHint}>
                Shows the Analytics nav link and unlocks the funnel + platform dashboards.
              </span>
            </div>
            <label className={styles.toggleControl}>
              <input
                type="checkbox"
                checked={form.analytics_enabled}
                onChange={(e) => setForm({ ...form, analytics_enabled: e.target.checked })}
                disabled={!editable || saving}
                aria-label="Enable analytics"
              />
              <span className={styles.toggleSwitch} aria-hidden="true">
                <span className={styles.toggleThumb} />
              </span>
            </label>
          </div>

          <div className={styles.toggleRow}>
            <div className={styles.toggleLabel}>
              <span className={styles.toggleLabelText}>Withdrawals</span>
              <span className={styles.toggleHint}>
                Shows the Withdrawals nav link. The Monnify Disbursement integration is still wiring up; leaving off until that ships is the safe default.
              </span>
            </div>
            <label className={styles.toggleControl}>
              <input
                type="checkbox"
                checked={form.withdrawals_enabled}
                onChange={(e) => setForm({ ...form, withdrawals_enabled: e.target.checked })}
                disabled={!editable || saving}
                aria-label="Enable withdrawals"
              />
              <span className={styles.toggleSwitch} aria-hidden="true">
                <span className={styles.toggleThumb} />
              </span>
            </label>
          </div>

          {actionError && (
            <p className={styles.errorGuardrail}>{actionError}</p>
          )}

          {/* PHASE_7F_S3_HOTFIX_BUTTON_CLASSES
           * Canonical button classes (formActions / primaryAction /
           * secondaryAction). Save first, Revert second, attribution
           * footer mirrors SecuritySection so the panel reads the same.
           */}
          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.primaryAction}
              onClick={handleSave}
              disabled={!editable || !isDirty || saving}
              title={
                !editable
                  ? 'Only owners can save launch toggles'
                  : !isDirty
                    ? 'No changes to save'
                    : 'Save launch toggles'
              }
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              className={styles.secondaryAction}
              onClick={handleRevert}
              disabled={!isDirty || saving}
              title={isDirty ? 'Discard unsaved changes' : 'No changes to discard'}
            >
              Revert
            </button>
            <SavedAttribution
              updatedAt={settings?.updated_at}
              updatedBy={settings?.updated_by}
            />
          </div>
        </>
      )}
    </Section>
  );
}

function SecuritySection({ settings, settingsLoading, isOwner, onUpdated }) {
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [totpReadiness, setTotpReadiness] = useState(null);

  useEffect(() => {
    if (settings && form === null) {
      setForm({
        require_totp_for_owners: !!settings.require_totp_for_owners,
        auto_revoke_inactive_days: toNumber(settings.auto_revoke_inactive_days, 0),
      });
    }
  }, [settings, form]);

  const diff = useMemo(() => {
    if (!form || !settings) return {};
    const out = {};
    if (form.require_totp_for_owners !== !!settings.require_totp_for_owners) {
      out.require_totp_for_owners = form.require_totp_for_owners;
    }
    const baseDays = toNumber(settings.auto_revoke_inactive_days, 0);
    if (form.auto_revoke_inactive_days !== baseDays) {
      out.auto_revoke_inactive_days = form.auto_revoke_inactive_days;
    }
    return out;
  }, [form, settings]);

  const isDirty = Object.keys(diff).length > 0;
  const editable = isOwner && IS_API_MODE && !settingsLoading;

  function handleRevert() {
    if (!settings) return;
    setForm({
      require_totp_for_owners: !!settings.require_totp_for_owners,
      auto_revoke_inactive_days: toNumber(settings.auto_revoke_inactive_days, 0),
    });
    setActionError(null);
    setTotpReadiness(null);
  }

  async function handleSave() {
    if (!isDirty || saving) return;
    setSaving(true);
    setActionError(null);
    setTotpReadiness(null);
    try {
      const next = await apiPatchSettings(diff);
      onUpdated(next);
      setForm({
        require_totp_for_owners: !!next.require_totp_for_owners,
        auto_revoke_inactive_days: toNumber(next.auto_revoke_inactive_days, 0),
      });
      toast.success('Security policy saved');
    } catch (err) {
      // Special-case the TOTP-not-ready 409 so the operator sees who
      // would lock themselves out, not just a generic message.
      if (err instanceof AuthApiError && err.code === 'SETTINGS_TOTP_NOT_READY') {
        setTotpReadiness({
          ownersWithoutTotp: err.details?.owners_without_totp || [],
          ownerCount: err.details?.owner_count || 0,
          ownersWithTotp: err.details?.owners_with_totp || 0,
        });
        // Don't toast | the issue is stateful and inline-rendered.
      } else {
        const message = err instanceof AuthApiError ? err.message : 'Could not save security policy.';
        setActionError(message);
        toast.error('Save failed', message);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Section
      title="Security"
      description="Session and access controls. Editing requires owner role."
    >
      {settingsLoading || form === null ? (
        <div className={styles.actionHint}>Loading security policy...</div>
      ) : (
        <>
          {!IS_API_MODE && (
            <div className={styles.actionHint}>
              Security policy is available when the admin app is
              connected to the auth API.
            </div>
          )}

          <div className={styles.toggleRow}>
            <div className={styles.toggleLabel}>
              <span className={styles.toggleLabelText}>Require TOTP for owners</span>
              <span className={styles.toggleHint}>
                Every owner must enrol an authenticator before signing in.
                Cannot be enabled while any active owner lacks TOTP.
              </span>
            </div>
            <label className={styles.toggleControl}>
              <input
                type="checkbox"
                checked={form.require_totp_for_owners}
                onChange={(e) => {
                  setForm({ ...form, require_totp_for_owners: e.target.checked });
                  setTotpReadiness(null);
                }}
                disabled={!editable || saving}
                aria-label="Require TOTP for owners"
              />
              <span className={styles.toggleSwitch} aria-hidden="true">
                <span className={styles.toggleThumb} />
              </span>
            </label>
          </div>

          {totpReadiness && (
            <div className={styles.errorGuardrail} role="alert">
              <strong>Cannot enable yet.</strong>{' '}
              {totpReadiness.ownersWithoutTotp.length} of{' '}
              {totpReadiness.ownerCount} owner(s) have no TOTP enrolled.
              They would lock themselves out:
              <ul className={styles.totpReadinessList}>
                {totpReadiness.ownersWithoutTotp.map((email) => (
                  <li key={email}>{email}</li>
                ))}
              </ul>
              Ask each one to enrol an authenticator at <span className={styles.mono}>/admin/enrol</span> first, then try again.
            </div>
          )}

          <div className={styles.formField}>
            <label className={styles.formLabel} htmlFor="settings-auto-revoke">
              Auto-revoke inactive sessions after (days)
            </label>
            <input
              id="settings-auto-revoke"
              type="number"
              min="0"
              step="1"
              className={`${styles.formInput} ${styles.formInputMono} ${styles.formInputCompact}`}
              value={form.auto_revoke_inactive_days}
              onChange={(e) => setForm({ ...form, auto_revoke_inactive_days: toNumber(e.target.value) })}
              disabled={!editable || saving}
            />
            <span className={styles.formHint}>
              Sessions idle for this long are revoked automatically. Set to <span className={styles.mono}>0</span> to disable.
            </span>
          </div>

          {actionError && (
            <p className={styles.errorGuardrail}>{actionError}</p>
          )}

          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.primaryAction}
              onClick={handleSave}
              disabled={!editable || !isDirty || saving}
              title={
                !editable
                  ? 'Only owners can save security policy'
                  : !isDirty
                    ? 'No changes to save'
                    : 'Save security policy'
              }
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              className={styles.secondaryAction}
              onClick={handleRevert}
              disabled={!isDirty || saving}
              title={isDirty ? 'Discard unsaved changes' : 'No changes to discard'}
            >
              Revert
            </button>
            <SavedAttribution
              updatedAt={settings?.updated_at}
              updatedBy={settings?.updated_by}
            />
          </div>
        </>
      )}
    </Section>
  );
}

// ══════════════════════════════════════════════════════════════════
//  Sign-out tools section (NEW)
// ══════════════════════════════════════════════════════════════════
//
// Two operations:
//   sign-out-others | every operator. Single confirm dialog. Toast
//                     reports revoked_count. Caller's session survives.
//
//   sign-out-all    | owner only. Two-step typed confirm
//                     (must type SIGN_OUT_ALL_TOKEN exactly). On
//                     success, the calling owner's session is dead;
//                     the page navigates to /login after a brief hold
//                     so the toast count is read first.

function SignOutSection({ isOwner }) {
  const toast = useToast();
  const navigate = useNavigate();

  const [othersOpen, setOthersOpen] = useState(false);
  const [othersBusy, setOthersBusy] = useState(false);

  const [allOpen, setAllOpen] = useState(false);
  const [allBusy, setAllBusy] = useState(false);
  const [typed, setTyped] = useState('');

  // Reset the typed token whenever the dialog opens or closes so a
  // re-open never inherits a stale value.
  useEffect(() => {
    if (!allOpen) setTyped('');
  }, [allOpen]);

  async function handleOthersConfirm() {
    setOthersBusy(true);
    try {
      const result = await apiSignOutOthers();
      setOthersOpen(false);
      const count = result?.revoked_count ?? 0;
      if (count > 0) {
        toast.success(
          `Signed out ${count === 1 ? '1 device' : `${count} devices`}`,
          'Your other sessions have been revoked. This tab is unaffected.'
        );
      } else {
        toast.info('No other sessions', 'You only had this tab signed in.');
      }
    } catch (err) {
      const message = err instanceof AuthApiError ? err.message : 'Could not sign out other devices.';
      toast.error('Sign-out failed', message);
    } finally {
      setOthersBusy(false);
    }
  }

  async function handleAllConfirm() {
    if (typed !== SIGN_OUT_ALL_TOKEN) return;
    setAllBusy(true);
    try {
      const result = await apiSignOutAll();
      setAllOpen(false);
      const count = result?.revoked_count ?? 0;
      toast.success(
        `Signed out ${count === 1 ? '1 session' : `${count} sessions`}`,
        'All operators have been signed out, including this tab.'
      );
      // The session cookie is already dead. Navigate after a brief hold
      // so the count toast is legible. The login page is a public route
      // and AdminProtected won't bounce us.
      setTimeout(() => {
        navigate(adminPath('/login'));
      }, 800);
    } catch (err) {
      const message = err instanceof AuthApiError ? err.message : 'Could not sign out all sessions.';
      toast.error('Sign-out failed', message);
      setAllBusy(false);
    }
    // Note: no finally setAllBusy(false) on success | navigation pulls
    // the component down, and we don't want a flash of "ready" state
    // between success and navigation.
  }

  return (
    <>
      <Section
        title="Sign-out tools"
        description="Revoke sessions on devices other than this one. Useful after travelling or a shared screen."
      >
        <div className={styles.signOutGroup}>
          <div className={styles.signOutBlock}>
            <div className={styles.signOutCopy}>
              <span className={styles.signOutTitle}>Sign out my other devices</span>
              <span className={styles.signOutHint}>
                Ends every signed-in session for your account except this tab.
              </span>
            </div>
            <button
              type="button"
              className={styles.secondaryAction}
              onClick={() => setOthersOpen(true)}
              disabled={!IS_API_MODE || othersBusy}
              title={IS_API_MODE ? 'Open confirm dialog' : 'Available when connected to the auth API'}
            >
              Sign out others
            </button>
          </div>

          <div className={`${styles.signOutBlock} ${styles.signOutBlockNuclear}`}>
            <div className={styles.signOutCopy}>
              <span className={styles.signOutTitle}>Sign out everyone</span>
              <span className={styles.signOutHint}>
                Ends every active session for every operator. Owner-only.
                You will be signed out of this tab too.
              </span>
            </div>
            <button
              type="button"
              className={styles.dangerAction}
              onClick={() => setAllOpen(true)}
              disabled={!IS_API_MODE || !isOwner || allBusy}
              title={
                !IS_API_MODE
                  ? 'Available when connected to the auth API'
                  : !isOwner
                    ? 'Only owners can sign everyone out'
                    : 'Open the typed-confirm dialog'
              }
            >
              Sign out everyone
            </button>
          </div>
        </div>
      </Section>

      <ConfirmDialog
        isOpen={othersOpen}
        title="Sign out my other devices?"
        body="Every other signed-in session for your account will be revoked immediately. This tab will keep working."
        confirmLabel="Sign out others"
        cancelLabel="Cancel"
        confirmVariant="primary"
        isLoading={othersBusy}
        onCancel={() => !othersBusy && setOthersOpen(false)}
        onConfirm={handleOthersConfirm}
      />

      <ConfirmDialog
        isOpen={allOpen}
        title="Sign out every operator?"
        obsidianHeader
        confirmLabel={`I understand, sign out everyone`}
        cancelLabel="Cancel"
        confirmVariant="destructive"
        isLoading={allBusy}
        confirmDisabled={typed !== SIGN_OUT_ALL_TOKEN}
        onCancel={() => !allBusy && setAllOpen(false)}
        onConfirm={handleAllConfirm}
        body={
          <>
            This ends <strong>every active session</strong> across the
            whole org, including yours. Operators will be redirected to
            the login screen on their next request. This is destructive
            and not undoable.
          </>
        }
      >
        <div className={styles.typedConfirmField}>
          <label className={styles.formLabel} htmlFor="settings-typed-confirm">
            Type <span className={styles.mono}>{SIGN_OUT_ALL_TOKEN}</span> to confirm
          </label>
          <input
            id="settings-typed-confirm"
            type="text"
            className={`${styles.formInput} ${styles.formInputMono}`}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            disabled={allBusy}
            autoComplete="off"
            spellCheck={false}
            autoCapitalize="characters"
            placeholder={SIGN_OUT_ALL_TOKEN}
          />
        </div>
      </ConfirmDialog>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════
//  About section (NEW)
// ══════════════════════════════════════════════════════════════════
//
// Read-only environment + retention constants. No backend dependency.
// Build version is read from import.meta.env.VITE_BUILD_VERSION; if
// the env var isn't injected at build time it falls back to "dev".

function AboutSection() {
  const apiMode = AUTH_MODE;
  const environment = import.meta.env.MODE || 'development';
  const domain = typeof window !== 'undefined' ? window.location.hostname : 'unknown';
  const buildVersion = import.meta.env.VITE_BUILD_VERSION || 'dev';

  return (
    <Section
      title="About"
      description="Environment metadata and retention constants for this build."
    >
      <Row
        label="API mode"
        hint="Local sandbox uses seeded data; api hits the live backend."
        value={<span className={styles.mono}>{apiMode}</span>}
      />
      <Row
        label="Environment"
        hint="Vite build mode."
        value={<span className={styles.mono}>{environment}</span>}
      />
      <Row
        label="Domain"
        hint="The host serving this admin panel."
        value={<span className={styles.mono}>{domain}</span>}
      />
      <Row
        label="Build version"
        hint="Injected at build time. 'dev' on local development."
        value={<span className={styles.mono}>{buildVersion}</span>}
      />
      <Row
        label="Session lifetime"
        hint="Time before re-authentication is required."
        value={<span className={styles.mono}>8 hours rolling, 7 days max</span>}
      />
      <Row
        label="Audit retention"
        hint="How long audit entries are kept."
        value={<span className={styles.mono}>Forever</span>}
      />
    </Section>
  );
}

// ══════════════════════════════════════════════════════════════════
//  Page
// ══════════════════════════════════════════════════════════════════

export function SettingsPage() {
  const { operator: currentOperator } = useOperatorSession();
  const [refreshTick, setRefreshTick] = useState(0);

  // Shared org_settings state | one fetch, both editable sections plus
  // the SavedAttribution footers consume it. Saves in either section
  // call onUpdated, broadcasting the new baseline to the other section
  // so its footer updates without a refetch.
  const [settings, setSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(IS_API_MODE);

  const isOwner = currentOperator?.role === 'owner';

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!IS_API_MODE) {
        setSettingsLoading(false);
        return;
      }
      try {
        const next = await apiFetchSettings();
        if (!cancelled) setSettings(next);
      } catch {
        // The Notifications/Security sections render their own empty
        // states keyed off settingsLoading + settings; a top-level
        // failure here is surfaced inside those sections, not as a
        // page-level banner that would obscure operator/passkey work.
      } finally {
        if (!cancelled) setSettingsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const applySettings = useCallback((next) => {
    setSettings(next);
  }, []);

  return (
    <AdminShell pageTitle="Settings" contentRegister="neutral">
      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Settings</h1>
          <p className={styles.pageSubtitle}>
            Operator seats, security, notifications, and tools for the Remvo admin panel.
          </p>
        </header>

        <OperatorsSection
          currentOperator={currentOperator}
          onChange={() => setRefreshTick((n) => n + 1)}
        />

        <InvitationsSection
          currentOperator={currentOperator}
          refreshSignal={refreshTick}
        />

        <PasskeysSection currentOperator={currentOperator} />

        <NotificationsSection
          settings={settings}
          settingsLoading={settingsLoading}
          isOwner={isOwner}
          onUpdated={applySettings}
        />

        <SecuritySection
          settings={settings}
          settingsLoading={settingsLoading}
          isOwner={isOwner}
          onUpdated={applySettings}
        />

        {/* PHASE_7F_S3_LAUNCH_TOGGLES_MOUNT */}
        <LaunchTogglesSection
          settings={settings}
          settingsLoading={settingsLoading}
          isOwner={isOwner}
          onUpdated={applySettings}
        />

        <SignOutSection isOwner={isOwner} />

        <AboutSection />
      </div>
    </AdminShell>
  );
}
