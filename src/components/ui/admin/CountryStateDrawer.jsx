import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { IconCheck } from '@components/ui/icons/IconCheck';
import { IconAlert } from '@components/ui/icons/IconAlert';
import { IconX } from '@components/ui/icons/IconX';
import { CountryFlag } from '@components/ui/icons/CountryFlag';
import { countryName, COUNTRY_STATUS } from '@utils/constants';
import styles from '@styles/ui/admin/country-state-drawer.module.css';

/* ──────────────────────────────────────────────────────────────────
 * CountryStateDrawer
 *
 * Right-edge slide-in drawer for editing a single country's state on
 * a given platform. Renders via createPortal at document.body so it
 * escapes the AdminShell .main { z-index: 1 } stacking context that
 * would otherwise let the header paint on top.
 *
 * Dirty-state cancel:
 *   If the operator has changed any field and tries to cancel
 *   (Cancel button, X close, Escape, backdrop click) the footer
 *   transforms to a confirmation row: "Unsaved changes" + "Keep
 *   editing" + "Discard". A second click on Discard closes; Keep
 *   editing returns to the normal footer.
 *
 *   Saving with no changes just closes silently | nothing to confirm.
 *
 * Save flow:
 *   - Submit button shows spinner
 *   - On success: parent (PlatformDetailPage) shows toast, drawer closes
 *   - On error: drawer stays open, inline error in red box
 *
 * Form fields:
 *   status (radiogroup)         | active | coming_soon | paused
 *   active_merchants (checks)   | which payment providers permitted
 *   preferred_merchant (radio)  | must be a member of active_merchants
 *   notify_email_enabled (sw)   | only meaningful when coming_soon
 *   min_amount_usd  (number)    | per-country override; blank = inherit
 *   max_amount_usd  (number)    | per-country override; blank = inherit
 *
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   countryCode: string,
 *   country: object | null,
 *   merchants: Array<{id: string, displayName: string, status: string}>,
 *   onSave: (countryCode: string, patch: object) => Promise<void>,
 * }} props
 * ────────────────────────────────────────────────────────────────── */

const STATUSES = [
  { value: 'active',      ...COUNTRY_STATUS.active },
  { value: 'coming_soon', ...COUNTRY_STATUS.coming_soon },
  { value: 'paused',      ...COUNTRY_STATUS.paused },
];

export function CountryStateDrawer({
  isOpen,
  onClose,
  countryCode,
  country,
  merchants = [],
  onSave,
}) {
  const drawerRef = useRef(null);
  const titleId = useRef(`country-drawer-title-${Math.random().toString(36).slice(2, 9)}`);
  const triggerRef = useRef(null);

  const original = useMemo(() => normaliseCountry(country), [country]);
  const [form, setForm] = useState(original);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);

  // Re-init form when drawer opens for a (possibly new) country
  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement;
      setForm(normaliseCountry(country));
      setError(null);
      setSubmitting(false);
      setConfirmingDiscard(false);
    }
  }, [isOpen, country, countryCode]);

  // Body scroll lock + initial focus
  useEffect(() => {
    if (!isOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => {
      drawerRef.current
        ?.querySelector('input, select, button:not([data-close])')
        ?.focus();
    }, 50);
    return () => {
      document.body.style.overflow = prevOverflow;
      clearTimeout(t);
    };
  }, [isOpen]);

  // Compute dirtiness once per render
  const dirty = useMemo(() => isDirty(form, original), [form, original]);

  // Escape + Tab trap
  useEffect(() => {
    if (!isOpen) return undefined;
    function handler(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (submitting) return;
        requestClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusables = drawerRef.current?.querySelectorAll(
        'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, submitting, dirty, confirmingDiscard]);

  // Return focus on close
  useEffect(() => {
    if (!isOpen && triggerRef.current instanceof HTMLElement) {
      triggerRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // ─── Close machinery ───────────────────────────────────────────

  function requestClose() {
    if (submitting) return;
    if (dirty && !confirmingDiscard) {
      setConfirmingDiscard(true);
      return;
    }
    setConfirmingDiscard(false);
    onClose();
  }

  function discardAndClose() {
    setConfirmingDiscard(false);
    onClose();
  }

  function keepEditing() {
    setConfirmingDiscard(false);
  }

  // ─── Form helpers ──────────────────────────────────────────────

  const toggleMerchant = (id) => {
    setForm((f) => {
      const exists = f.activeMerchants.includes(id);
      const nextActive = exists
        ? f.activeMerchants.filter((m) => m !== id)
        : [...f.activeMerchants, id];
      const nextPreferred =
        f.preferredMerchant === id && exists ? null : f.preferredMerchant;
      return { ...f, activeMerchants: nextActive, preferredMerchant: nextPreferred };
    });
    setConfirmingDiscard(false);
  };

  const setPreferred = (id) => {
    setForm((f) => {
      const nextActive = f.activeMerchants.includes(id)
        ? f.activeMerchants
        : [...f.activeMerchants, id];
      return { ...f, activeMerchants: nextActive, preferredMerchant: id };
    });
    setConfirmingDiscard(false);
  };

  const updateField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setConfirmingDiscard(false);
  };

  // ─── Diff + submit ─────────────────────────────────────────────

  function buildPatch() {
    const patch = {};
    if (form.status !== original.status) patch.status = form.status;

    const act = [...form.activeMerchants].sort();
    const origAct = [...original.activeMerchants].sort();
    if (act.join(',') !== origAct.join(',')) {
      patch.active_merchants = act.length === 0 ? null : act;
    }
    if (form.preferredMerchant !== original.preferredMerchant) {
      patch.preferred_merchant = form.preferredMerchant;
    }
    if (form.notifyEmailEnabled !== original.notifyEmailEnabled) {
      patch.notify_email_enabled = form.notifyEmailEnabled;
    }
    if (String(form.minAmountUsd ?? '') !== String(original.minAmountUsd ?? '')) {
      patch.min_amount_usd =
        form.minAmountUsd === '' || form.minAmountUsd == null
          ? null
          : Number(form.minAmountUsd);
    }
    if (String(form.maxAmountUsd ?? '') !== String(original.maxAmountUsd ?? '')) {
      patch.max_amount_usd =
        form.maxAmountUsd === '' || form.maxAmountUsd == null
          ? null
          : Number(form.maxAmountUsd);
    }
    return patch;
  }

  function clientValidate() {
    const min = form.minAmountUsd === '' ? null : Number(form.minAmountUsd);
    const max = form.maxAmountUsd === '' ? null : Number(form.maxAmountUsd);
    if (min != null && max != null && min >= max) {
      return 'Minimum must be less than maximum.';
    }
    if (
      form.preferredMerchant &&
      !form.activeMerchants.includes(form.preferredMerchant)
    ) {
      return 'Preferred merchant must be in the active merchants list.';
    }
    return null;
  }

  async function handleSave() {
    const v = clientValidate();
    if (v) {
      setError(v);
      return;
    }
    const patch = buildPatch();
    if (Object.keys(patch).length === 0) {
      onClose();
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSave(countryCode, patch);
      onClose();
    } catch (e) {
      setError(e?.details?.message || e?.message || 'Could not save.');
      setSubmitting(false);
    }
  }

  // ─── Render | wrapped in portal ────────────────────────────────

  const content = (
    <div className={styles.root} role="presentation">
      <div
        className={styles.backdrop}
        onClick={requestClose}
        aria-hidden="true"
      />
      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId.current}
        className={styles.drawer}
      >
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <CountryFlag code={countryCode} size={24} />
            <div>
              <h2 id={titleId.current} className={styles.title}>
                {countryName(countryCode)}
              </h2>
              <p className={styles.subtitle}>
                <span className={styles.mono}>{countryCode}</span> | per-country corridor settings
              </p>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={requestClose}
            disabled={submitting}
            aria-label="Close drawer"
            data-close
          >
            <IconX size={16} />
          </button>
        </header>

        <div className={styles.body}>
          {/* ── Status ── */}
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Status</legend>
            <div className={styles.statusGrid} role="radiogroup">
              {STATUSES.map((s) => (
                <label
                  key={s.value}
                  className={`${styles.statusOption} ${form.status === s.value ? styles.statusOptionActive : ''}`}
                >
                  <input
                    type="radio"
                    name="status"
                    value={s.value}
                    checked={form.status === s.value}
                    onChange={() => updateField('status', s.value)}
                    className={styles.statusInput}
                  />
                  <span className={styles.statusLabel}>{s.label}</span>
                  <span className={styles.statusHint}>{s.description}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* ── Merchants (only meaningful if active) ── */}
          {form.status === 'active' && (
            <fieldset className={styles.fieldset}>
              <legend className={styles.legend}>Active merchants</legend>
              <p className={styles.hint}>
                Tick the merchants permitted for this corridor. Set one as preferred.
              </p>
              <div className={styles.merchantList}>
                {merchants.length === 0 ? (
                  <p className={styles.emptyHint}>No merchants configured yet.</p>
                ) : (
                  merchants.map((m) => {
                    const checked = form.activeMerchants.includes(m.id);
                    const preferred = form.preferredMerchant === m.id;
                    return (
                      <div key={m.id} className={styles.merchantRow}>
                        <label className={styles.merchantCheck}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleMerchant(m.id)}
                          />
                          <span className={styles.merchantName}>{m.displayName || m.id}</span>
                          <span className={styles.merchantId}>{m.id}</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setPreferred(m.id)}
                          className={`${styles.preferredButton} ${preferred ? styles.preferredButtonActive : ''}`}
                          aria-pressed={preferred}
                        >
                          {preferred ? <IconCheck size={12} /> : null}
                          {preferred ? 'Preferred' : 'Set preferred'}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </fieldset>
          )}

          {/* ── Notify on activation (coming_soon only) ── */}
          {form.status === 'coming_soon' && (
            <fieldset className={styles.fieldset}>
              <legend className={styles.legend}>Waitlist</legend>
              <label className={styles.toggleRow}>
                <input
                  type="checkbox"
                  checked={form.notifyEmailEnabled}
                  onChange={(e) => updateField('notifyEmailEnabled', e.target.checked)}
                />
                <span className={styles.toggleLabel}>
                  Capture emails on the waitlist screen
                </span>
                <span className={styles.toggleHint}>
                  When this country flips to active, captured emails get a one-time launch notification.
                </span>
              </label>
            </fieldset>
          )}

          {/* ── Per-country amount overrides ── */}
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Amount limits (USD)</legend>
            <p className={styles.hint}>
              Leave blank to inherit the corridor default.
            </p>
            <div className={styles.amountRow}>
              <label className={styles.amountField}>
                <span className={styles.amountLabel}>Minimum</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  inputMode="decimal"
                  value={form.minAmountUsd ?? ''}
                  onChange={(e) => updateField('minAmountUsd', e.target.value)}
                  className={styles.amountInput}
                  placeholder="inherit"
                />
              </label>
              <label className={styles.amountField}>
                <span className={styles.amountLabel}>Maximum</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  inputMode="decimal"
                  value={form.maxAmountUsd ?? ''}
                  onChange={(e) => updateField('maxAmountUsd', e.target.value)}
                  className={styles.amountInput}
                  placeholder="inherit"
                />
              </label>
            </div>
          </fieldset>

          {/* ── Error ── */}
          {error && (
            <div className={styles.errorBox} role="alert">
              <IconAlert size={14} />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* ── Footer | swaps to confirm-discard when needed ── */}
        {confirmingDiscard ? (
          <footer className={`${styles.footer} ${styles.footerConfirm}`}>
            <span className={styles.confirmText}>
              <IconAlert size={14} />
              Unsaved changes
            </span>
            <div className={styles.confirmActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={keepEditing}
              >
                Keep editing
              </button>
              <button
                type="button"
                className={styles.discardButton}
                onClick={discardAndClose}
              >
                Discard
              </button>
            </div>
          </footer>
        ) : (
          <footer className={styles.footer}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={requestClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.saveButton}
              onClick={handleSave}
              disabled={submitting || !dirty}
              aria-busy={submitting || undefined}
            >
              {submitting ? <span className={styles.spinner} aria-hidden="true" /> : null}
              <span>{submitting ? 'Saving' : 'Save changes'}</span>
            </button>
          </footer>
        )}
      </aside>
    </div>
  );

  // Portal escapes AdminShell's stacking context. Without this, the
  // header at z-index 50 paints over the drawer regardless of the
  // drawer's internal z-index value.
  return createPortal(content, document.body);
}

// ── Helpers ─────────────────────────────────────────────────────────

function normaliseCountry(country) {
  if (!country) {
    return {
      status: 'coming_soon',
      activeMerchants: [],
      preferredMerchant: null,
      notifyEmailEnabled: false,
      minAmountUsd: '',
      maxAmountUsd: '',
    };
  }
  return {
    status: country.status || 'coming_soon',
    activeMerchants: Array.isArray(country.activeMerchants)
      ? [...country.activeMerchants]
      : Array.isArray(country.active_merchants)
        ? [...country.active_merchants]
        : [],
    preferredMerchant: country.preferredMerchant ?? country.preferred_merchant ?? null,
    notifyEmailEnabled:
      country.notifyEmailEnabled ?? country.notify_email_enabled ?? false,
    minAmountUsd:
      country.minAmountUsd ?? country.min_amount_usd ?? '',
    maxAmountUsd:
      country.maxAmountUsd ?? country.max_amount_usd ?? '',
  };
}

function isDirty(form, original) {
  if (form.status !== original.status) return true;
  if (form.notifyEmailEnabled !== original.notifyEmailEnabled) return true;
  if (form.preferredMerchant !== original.preferredMerchant) return true;
  if (String(form.minAmountUsd ?? '') !== String(original.minAmountUsd ?? '')) return true;
  if (String(form.maxAmountUsd ?? '') !== String(original.maxAmountUsd ?? '')) return true;
  const a = [...form.activeMerchants].sort().join(',');
  const b = [...original.activeMerchants].sort().join(',');
  return a !== b;
}
