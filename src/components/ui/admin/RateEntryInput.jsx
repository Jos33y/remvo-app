import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { GoldRing } from '@components/ui/shared/GoldRing';
import { ConfirmDialog } from '@components/ui/admin/ConfirmDialog';
import styles from '@styles/ui/admin/rate-entry-input.module.css';

/* ──────────────────────────────────────────────────────────────────
 * RateEntryInput
 *
 * Manual rate entry on the Rate engine screen. The load-bearing
 * daily action. Obsidian hero register.
 *
 * Owns its own sanity-bound (+/-20%) ConfirmDialog before calling
 * onSubmit, so the parent screen does not duplicate the CoinGecko
 * comparison it already passes in. Sanity bounds are enforced at
 * the admin layer per rate engine spec v2 section 10.
 *
 * Input mechanics:
 *   - inputMode="decimal" for the mobile numeric keypad
 *   - accepts digits, single decimal, commas (stripped on parse)
 *   - parse-on-keystroke to drive the live delta indicator
 *   - comma-format on blur (cursor-stable)
 *   - Enter commits from the rate input only; textarea Enter is
 *     native newline per the Phase 5 form convention
 *
 * Submit flow:
 *   1. Validate positive numeric
 *   2. Deviation check vs CoinGecko + buffer; if > 20% open confirm
 *   3. Call onSubmit(rate, notes)
 *   4. Success state for 2s, then reset to idle
 *
 * Toggle:
 *   Native switch pattern. Toggling writes rate.toggle_manual via
 *   the provider. Toggle state is driven by the manualSourceActive
 *   prop so the parent remains the source of truth.
 *
 * @param {{
 *   currentManual: { rate: number, enteredAt: string, enteredBy: number, expiresAt: string } | null,
 *   coingeckoReading: { midRate: number, bufferNaira: number, fetchedAt: string } | null,
 *   manualSourceActive: boolean,
 *   onSubmit: (rate: number, notes?: string) => Promise<void>,
 *   onToggleManual: (enabled: boolean) => Promise<void>,
 *   className?: string,
 * }} props
 * ────────────────────────────────────────────────────────────────── */

const DEVIATION_THRESHOLD = 0.20;
const SUCCESS_HOLD_MS = 2000;
const NAIRA = '₦';

// ─── Formatting helpers ───────────────────────────────────────────

function parseRate(raw) {
  if (typeof raw !== 'string') return null;
  const cleaned = raw.replace(/,/g, '').trim();
  if (cleaned === '') return null;
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function formatRate(value) {
  if (value == null || Number.isNaN(value)) return '';
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatRateShort(value) {
  if (value == null) return '';
  if (Number.isInteger(value)) return value.toLocaleString('en-US');
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatTimeAgo(iso) {
  if (!iso) return '';
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ─── Component ────────────────────────────────────────────────────

export function RateEntryInput({
  currentManual,
  coingeckoReading,
  manualSourceActive,
  onSubmit,
  onToggleManual,
  hideToggle = false,
  className = '',
}) {
  // currentManual is part of the component contract so the parent
  // (Phase B3 RateEngine screen) can pass it without props drilling
  // rebuild. This primitive renders only the entry control; the
  // parent displays the current rate as a separate summary tile.
  void currentManual;
  const uid = useId();
  const labelId = `rate-label-${uid}`;
  const inputId = `rate-input-${uid}`;
  const deltaId = `rate-delta-${uid}`;
  const errorId = `rate-error-${uid}`;

  const [raw, setRaw] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'saving' | 'saved'
  const [error, setError] = useState(null);
  const [sanityOpen, setSanityOpen] = useState(false);
  const [toggling, setToggling] = useState(false);

  const successTimerRef = useRef(null);

  useEffect(() => () => {
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
  }, []);

  // ── Derived ──

  const parsed = useMemo(() => parseRate(raw), [raw]);

  const coingeckoEffective = coingeckoReading
    ? coingeckoReading.midRate + (coingeckoReading.bufferNaira || 0)
    : null;

  const delta = (parsed != null && coingeckoEffective != null)
    ? parsed - coingeckoEffective
    : null;

  const deviationPct = (delta != null && coingeckoEffective > 0)
    ? Math.abs(delta) / coingeckoEffective
    : null;

  const outOfBounds = deviationPct != null && deviationPct > DEVIATION_THRESHOLD;

  const busy = status === 'saving' || status === 'saved';
  const canSubmit = parsed != null && !busy;

  // ── Delta display ──

  const deltaDisplay = useMemo(() => {
    if (delta == null) return null;
    const abs = Math.abs(delta);
    if (abs < 0.005) return { tone: 'neutral', text: 'at market' };
    const sign = delta > 0 ? '+' : '-';
    const suffix = delta > 0 ? 'above market' : 'below market';
    const deviationNote = outOfBounds
      ? ` (${(deviationPct * 100).toFixed(1)}% deviation, confirm on save)`
      : '';
    return {
      tone: delta > 0 ? 'above' : 'below',
      text: `${sign}${formatRate(abs)} ${suffix}${deviationNote}`,
    };
  }, [delta, deviationPct, outOfBounds]);

  // ── Handlers ──

  function handleChange(event) {
    const next = event.target.value;
    // Accept only digits, at most one decimal, commas. Reject anything else.
    if (next !== '' && !/^[\d,]*\.?\d*$/.test(next)) return;
    setRaw(next);
    if (error) setError(null);
  }

  function handleBlur() {
    if (parsed != null) setRaw(formatRate(parsed));
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (canSubmit) handleSubmitAttempt();
    }
  }

  async function runSubmit(opts = {}) {
    setStatus('saving');
    setError(null);
    try {
      await onSubmit(parsed, notes.trim() || undefined, opts);
      setStatus('saved');
      successTimerRef.current = setTimeout(() => {
        setStatus('idle');
        setRaw('');
        setNotes('');
        successTimerRef.current = null;
      }, SUCCESS_HOLD_MS);
    } catch (e) {
      setStatus('idle');
      setError((e && e.message) || 'Rate save failed. Retry, or refresh the page.');
    }
  }

  function handleSubmitAttempt() {
    if (!canSubmit) return;
    if (outOfBounds) {
      setSanityOpen(true);
      return;
    }
    runSubmit();
  }

  async function handleSanityConfirm() {
    setSanityOpen(false);
    await runSubmit({ confirmDeviation: true });
  }

  async function handleToggle() {
    if (toggling || busy) return;
    setToggling(true);
    try {
      await onToggleManual(!manualSourceActive);
    } finally {
      setToggling(false);
    }
  }

  // ── Derived display ──

  const fetchedAgo = coingeckoReading ? formatTimeAgo(coingeckoReading.fetchedAt) : '';
  const saveAriaLabel = parsed != null
    ? `Save rate ${formatRate(parsed)} naira per dollar`
    : 'Save rate';

  const inputDescribedBy = [
    deltaDisplay ? deltaId : null,
    error ? errorId : null,
  ].filter(Boolean).join(' ') || undefined;

  return (
    <>
      <section
        className={[styles.card, className].filter(Boolean).join(' ')}
        data-canvas="obsidian"
        aria-labelledby={labelId}
      >
        {/* ── Header: label + CoinGecko calibration pill ── */}

        <header className={styles.header}>
          <div className={styles.labelBlock}>
            <label id={labelId} htmlFor={inputId} className={styles.label}>
              Manual buy rate <span className={styles.labelRequired}>(Required)</span>
            </label>
          </div>

          {coingeckoReading && (
            <div
              className={styles.coingeckoPill}
              role="status"
              aria-label={`CoinGecko reading: ${formatRateShort(coingeckoReading.midRate)} naira mid-rate plus ${coingeckoReading.bufferNaira} naira buffer equals ${formatRateShort(coingeckoEffective)} naira, updated ${fetchedAgo}`}
            >
              <span className={styles.coingeckoName}>CoinGecko</span>
              <span className={styles.coingeckoValue}>
                {NAIRA}
                {formatRateShort(coingeckoReading.midRate)}
                <span className={styles.coingeckoOp}> + </span>
                {coingeckoReading.bufferNaira}
                <span className={styles.coingeckoOp}> = </span>
                <span className={styles.coingeckoEffective}>
                  {NAIRA}
                  {formatRateShort(coingeckoEffective)}
                </span>
              </span>
              <span className={styles.coingeckoAge}>updated {fetchedAgo}</span>
            </div>
          )}
        </header>

        {/* ── Input + delta ── */}

        <div className={styles.inputWrap}>
          <div className={styles.inputShell}>
            <span className={styles.inputPrefix} aria-hidden="true">{NAIRA}</span>
            <input
              id={inputId}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              className={styles.input}
              value={raw}
              onChange={handleChange}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder="0.00"
              disabled={busy}
              aria-required="true"
              aria-invalid={error ? true : undefined}
              aria-describedby={inputDescribedBy}
            />
            <GoldRing radius={10} strokeWidth={1} className={styles.inputRing} />
          </div>

          {deltaDisplay && (
            <div
              id={deltaId}
              className={[styles.delta, styles[`delta-${deltaDisplay.tone}`]].join(' ')}
              role="status"
              aria-live="polite"
            >
              {deltaDisplay.text}
            </div>
          )}

          {error && (
            <div id={errorId} className={styles.errorText} role="alert">
              {error}
            </div>
          )}
        </div>

        {/* ── Notes ── */}

        <div className={styles.notesWrap}>
          <textarea
            className={styles.notes}
            placeholder="Notes for this rate (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            disabled={busy}
            aria-label="Notes for this rate (optional)"
          />
        </div>

        {/* ── Footer: toggle + save ── */}

        <div className={styles.footer}>
          {!hideToggle && (
            <div className={styles.toggleGroup}>
              <button
                type="button"
                role="switch"
                aria-checked={manualSourceActive}
                aria-label={`Manual rate source, currently ${manualSourceActive ? 'active' : 'off'}`}
                className={[
                  styles.toggle,
                  manualSourceActive ? styles.toggleOn : styles.toggleOff,
                ].join(' ')}
                onClick={handleToggle}
                disabled={toggling || busy}
              >
                <span className={styles.toggleTrack} aria-hidden="true">
                  <span className={styles.toggleThumb} />
                </span>
                <span className={styles.toggleLabel}>
                  Manual source {manualSourceActive ? 'active' : 'off'}
                </span>
              </button>
              <span className={styles.toggleHelper}>
                {manualSourceActive
                  ? 'Turn off to fall through to CoinGecko + buffer.'
                  : 'Rate falls through to CoinGecko + buffer.'}
              </span>
            </div>
          )}

          <div className={styles.saveWrap}>
            {status === 'saved' ? (
              <div className={styles.savedBadge} role="status" aria-live="polite">
                Rate saved, active for next session init.
              </div>
            ) : (
              <button
                type="button"
                className={[
                  styles.saveButton,
                  !canSubmit ? styles.saveButtonDisabled : '',
                ].filter(Boolean).join(' ')}
                onClick={handleSubmitAttempt}
                disabled={!canSubmit}
                aria-disabled={!canSubmit || undefined}
                aria-label={saveAriaLabel}
              >
                {status === 'saving' ? 'Saving' : 'Save rate'}
              </button>
            )}
          </div>
        </div>
      </section>

      <ConfirmDialog
        isOpen={sanityOpen}
        onCancel={() => setSanityOpen(false)}
        onConfirm={handleSanityConfirm}
        title="Confirm rate deviation"
        body={
          <>
            Rate of{' '}
            <strong>
              {NAIRA}
              {formatRate(parsed)}
            </strong>{' '}
            is {delta != null && delta >= 0 ? '+' : '-'}
            {deviationPct != null ? (deviationPct * 100).toFixed(1) : '0.0'}% from market
            (CoinGecko + buffer:{' '}
            <strong>
              {NAIRA}
              {formatRate(coingeckoEffective)}
            </strong>
            ). Confirm only if you know your real P2P sourcing cost is this different.
          </>
        }
        confirmLabel="Confirm and save"
        cancelLabel="Cancel"
        confirmVariant="primary"
        obsidianHeader
      />
    </>
  );
}
