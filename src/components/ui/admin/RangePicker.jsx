import { useEffect, useRef, useState } from 'react';
import { RANGE_KEYS, rangeLabel } from '@utils/analytics';
import { IconChevron } from '@components/ui/icons/IconChevron';
import { IconX } from '@components/ui/icons/IconX';
import styles from '@styles/ui/admin/range-picker.module.css';

/* ──────────────────────────────────────────────────────────────────
 * RangePicker
 *
 * Date-range selector for analytics. Three fixed ranges + a custom
 * range that expands inline into two native date inputs.
 *
 * Props
 *   value       | { key, custom }
 *                 key: one of RANGE_KEYS
 *                 custom: { from, to } (YYYY-MM-DD strings) when key === 'custom'
 *   onChange    | (next) => void
 *   register    | 'obsidian' | 'neutral' (default obsidian; hero strip)
 *
 * Behaviour
 *   - Tap Today / 7d / 30d: flips key, clears custom
 *   - Tap Custom: expands the popover below, shows date inputs
 *   - Applying a valid from + to range closes the popover and flips
 *     the value to { key: 'custom', custom: { from, to } }
 *   - Clicking outside or pressing Escape closes without applying
 *
 * Native <input type="date"> used deliberately — mobile operators
 * get iOS/Android wheel pickers, desktop operators get the native
 * calendar. No date library dependency, no surprise UX.
 * ────────────────────────────────────────────────────────────────── */

const OPTIONS = [
  { key: RANGE_KEYS.TODAY,  label: 'Today'   },
  { key: RANGE_KEYS.WEEK,   label: '7d'      },
  { key: RANGE_KEYS.MONTH,  label: '30d'     },
  { key: RANGE_KEYS.CUSTOM, label: 'Custom'  },
];

function todayIso() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function weekAgoIso() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function RangePicker({
  value = { key: RANGE_KEYS.WEEK, custom: null },
  onChange,
  register = 'obsidian',
  className,
}) {
  const [open, setOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(value.custom?.from || weekAgoIso());
  const [draftTo,   setDraftTo]   = useState(value.custom?.to   || todayIso());
  const rootRef = useRef(null);

  // Close popover on outside click + Escape
  useEffect(() => {
    if (!open) return undefined;
    function onDocClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Re-sync drafts when the custom value is set externally
  useEffect(() => {
    if (value.custom?.from) setDraftFrom(value.custom.from);
    if (value.custom?.to)   setDraftTo(value.custom.to);
  }, [value.custom?.from, value.custom?.to]);

  function handleOption(key) {
    if (key === RANGE_KEYS.CUSTOM) {
      setOpen(true);
      return;
    }
    setOpen(false);
    onChange?.({ key, custom: null });
  }

  function handleApply() {
    if (!draftFrom || !draftTo) return;
    if (new Date(draftFrom) > new Date(draftTo)) return;
    onChange?.({ key: RANGE_KEYS.CUSTOM, custom: { from: draftFrom, to: draftTo } });
    setOpen(false);
  }

  const customActive = value.key === RANGE_KEYS.CUSTOM;
  const wrapperClass = [
    styles.wrap,
    styles[`register-${register}`],
    className,
  ].filter(Boolean).join(' ');

  return (
    <div ref={rootRef} className={wrapperClass}>
      <div
        className={styles.segmented}
        role="radiogroup"
        aria-label="Date range"
      >
        {OPTIONS.map(opt => {
          const active = opt.key === value.key;
          return (
            <button
              key={opt.key}
              type="button"
              role="radio"
              aria-checked={active}
              className={`${styles.segment} ${active ? styles.segmentActive : ''}`}
              onClick={() => handleOption(opt.key)}
            >
              {opt.key === RANGE_KEYS.CUSTOM ? (
                <span className={styles.customLabel}>
                  {customActive && value.custom?.from && value.custom?.to
                    ? rangeLabel(RANGE_KEYS.CUSTOM, value.custom)
                    : opt.label}
                  <span className={styles.chev} aria-hidden="true">
                    <IconChevron size={12} direction="down" />
                  </span>
                </span>
              ) : (
                opt.label
              )}
            </button>
          );
        })}
      </div>

      {open && (
        <div className={styles.popover} role="dialog" aria-label="Custom date range">
          <div className={styles.popoverHeader}>
            <span className={styles.popoverTitle}>Custom range</span>
            <button
              type="button"
              className={styles.popoverClose}
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              <IconX size={14} />
            </button>
          </div>

          <div className={styles.fields}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>From</span>
              <input
                type="date"
                value={draftFrom}
                max={draftTo || todayIso()}
                onChange={e => setDraftFrom(e.target.value)}
                className={styles.dateInput}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>To</span>
              <input
                type="date"
                value={draftTo}
                min={draftFrom || ''}
                max={todayIso()}
                onChange={e => setDraftTo(e.target.value)}
                className={styles.dateInput}
              />
            </label>
          </div>

          <div className={styles.popoverFooter}>
            <button
              type="button"
              className={styles.applyBtn}
              onClick={handleApply}
              disabled={!draftFrom || !draftTo || new Date(draftFrom) > new Date(draftTo)}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
