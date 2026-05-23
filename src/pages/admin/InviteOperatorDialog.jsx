import { useState } from 'react';
import { ConfirmDialog } from '@components/ui/admin/ConfirmDialog';
import { inviteOperator as apiInviteOperator, AuthApiError } from '@lib/authClient';
import styles from '@styles/pages/admin/invite-operator-dialog.module.css';

/* ──────────────────────────────────────────────────────────────────
 * InviteOperatorDialog
 *
 * Owner-only modal for inviting a new operator. Fields:
 *   - email     | RFC-shape pre-check, server is the authority
 *   - role      | radio | "operator" (default) or "owner"
 *
 * Submits POST /v1/admin/operators. On success the dialog closes
 * with onClose(true) so the parent refreshes its pending-invitations
 * list. On failure we surface the API error inline (e.g. "already
 * invited", "already an operator").
 *
 * Backend behaviour:
 *   - generates a 7-day invitation token
 *   - sends an email via Resend
 *   - if email send fails, the invitation row is rolled back so we
 *     never have a "ghost" invitation no one received
 *   - audit row is written attributed to the inviting operator
 *
 * Why nest inside ConfirmDialog rather than build a separate Modal:
 * ConfirmDialog already handles the desktop modal + mobile bottom-
 * sheet routing, focus management, escape-to-cancel, backdrop click,
 * and reduced-motion. Reusing it gives us all that for free; we just
 * own the form fields in the children slot.
 *
 * Related docs:
 *   src/lib/authClient.js (inviteOperator)
 *   src/modules/auth/service.js (inviteOperator: email-send rollback)
 * ────────────────────────────────────────────────────────────────── */

const ROLES = [
  {
    value: 'operator',
    title: 'Operator',
    description: 'Can do everything except manage other operators.',
  },
  {
    value: 'owner',
    title: 'Owner',
    description: 'Full access. Can invite and revoke operators.',
  },
];

export function InviteOperatorDialog({ onClose }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('operator');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  function validate() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return 'Enter an email address.';
    // Light RFC-shape check | server has the authoritative validator.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return 'That email looks invalid.';
    }
    return null;
  }

  async function handleConfirm() {
    if (submitting) return;
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await apiInviteOperator({
        email: email.trim().toLowerCase(),
        role,
      });
      onClose(true);
    } catch (err) {
      // The auth API surfaces these as 4xx with sane copy:
      //   - 'email_already_invited'
      //   - 'email_already_operator'
      //   - validation errors on email
      setError(
        err instanceof AuthApiError
          ? err.message
          : 'Could not send the invitation. Try again.'
      );
      setSubmitting(false);
    }
  }

  function handleCancel() {
    if (submitting) return;
    onClose(false);
  }

  return (
    <ConfirmDialog
      isOpen
      title="Invite operator"
      body="They'll get an email with a 7-day link to set up their authenticator and password."
      confirmLabel={submitting ? 'Sending invitation' : 'Send invitation'}
      cancelLabel="Cancel"
      confirmVariant="primary"
      isLoading={submitting}
      onCancel={handleCancel}
      onConfirm={handleConfirm}
    >
      <div className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="invite-email">
            Email
          </label>
          <input
            id="invite-email"
            type="email"
            className={styles.input}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError(null);
            }}
            placeholder="they@example.com"
            autoComplete="off"
            inputMode="email"
            spellCheck={false}
            disabled={submitting}
            autoFocus
          />
        </div>

        <div className={styles.field}>
          <span className={styles.label}>Role</span>
          <div className={styles.roleRow} role="radiogroup" aria-label="Role">
            {ROLES.map((opt) => {
              const active = role === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  className={`${styles.roleOption} ${active ? styles.roleOptionActive : ''}`}
                  onClick={() => !submitting && setRole(opt.value)}
                  disabled={submitting}
                >
                  <span className={styles.roleOptionTitle}>{opt.title}</span>
                  <span className={styles.roleOptionDescription}>{opt.description}</span>
                </button>
              );
            })}
          </div>
        </div>

        {error ? (
          <p className={styles.error} role="alert">{error}</p>
        ) : (
          <p className={styles.note}>
            They'll need a phone for the authenticator app and a passkey-
            capable device.
          </p>
        )}
      </div>
    </ConfirmDialog>
  );
}
