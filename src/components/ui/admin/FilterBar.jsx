import { useEffect, useRef, useState } from 'react';
import { IconSearch } from '@components/ui/icons/IconSearch';
import { IconX } from '@components/ui/icons/IconX';
import { IconExport } from '@components/ui/icons/IconExport';
import styles from '@styles/ui/admin/filter-bar.module.css';

/* ──────────────────────────────────────────────────────────────────
 * FilterBar
 *
 * Row above a DataTable. Holds search, filter pills, density toggle,
 * and optional export affordance.
 *
 * Search input debounces to 200ms before firing onSearchChange. The
 * Enter key submits immediately, bypassing debounce, for power users
 * who type fast and want instant feedback.
 *
 * Filter pills are emitted by the parent; each pill has a label and
 * a key. Clicking the X removes the pill via onFilterRemove(key).
 * Clicking "Clear all" removes every pill.
 *
 * Density toggle appears on >=720px viewports only. Mobile-first
 * rationale: operators doing support lookup on WhatsApp on mobile
 * do not adjust density; desktop operators running reconciliation
 * do. The toggle is hidden, not shrunk, on mobile.
 *
 * Props
 *   searchValue          | current search string
 *   onSearchChange       | (next: string) => void
 *   searchPlaceholder    | default 'Search'
 *   autoFocusSearch      | default false
 *   filters              | [{ key, label, value }]
 *   onFilterRemove       | (key) => void
 *   onClearAll           | () => void
 *   onExport             | optional | () => void (renders export button when set)
 *   density              | optional 'compact' | 'default' | 'comfortable'
 *   onDensityChange      | optional (density) => void
 *   className            | class merge
 * ────────────────────────────────────────────────────────────────── */

const DEBOUNCE_MS = 200;

export function FilterBar({
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search',
  autoFocusSearch = false,
  filters = [],
  onFilterRemove,
  onClearAll,
  onExport,
  density,
  onDensityChange,
  className,
}) {
  const [local, setLocal] = useState(searchValue);
  const debounceRef = useRef(null);

  // Sync when parent resets search externally
  useEffect(() => {
    setLocal(searchValue);
  }, [searchValue]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function handleChange(event) {
    const next = event.target.value;
    setLocal(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onSearchChange?.(next);
    }, DEBOUNCE_MS);
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (debounceRef.current) clearTimeout(debounceRef.current);
      onSearchChange?.(local);
    }
  }

  function handleClearSearch() {
    setLocal('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    onSearchChange?.('');
  }

  const classes = [styles.wrap, className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <div className={styles.searchCell}>
        <span className={styles.searchIcon} aria-hidden="true">
          <IconSearch size={14} />
        </span>
        <input
          type="search"
          className={styles.searchInput}
          placeholder={searchPlaceholder}
          value={local}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          autoFocus={autoFocusSearch}
          aria-label="Search"
        />
        {local && (
          <button
            type="button"
            className={styles.searchClear}
            onClick={handleClearSearch}
            aria-label="Clear search"
          >
            <IconX size={12} />
          </button>
        )}
      </div>

      {filters.length > 0 && (
        <div className={styles.filterPills} role="group" aria-label="Active filters">
          {filters.map(filter => (
            <span key={filter.key} className={styles.pill}>
              <span className={styles.pillLabel}>{filter.label}</span>
              {filter.value && (
                <span className={styles.pillValue}>{filter.value}</span>
              )}
              {onFilterRemove && (
                <button
                  type="button"
                  className={styles.pillRemove}
                  onClick={() => onFilterRemove(filter.key)}
                  aria-label={`Remove ${filter.label} filter`}
                >
                  <IconX size={10} />
                </button>
              )}
            </span>
          ))}
          {filters.length > 0 && onClearAll && (
            <button
              type="button"
              className={styles.clearAll}
              onClick={onClearAll}
            >
              Clear all
            </button>
          )}
        </div>
      )}

      <div className={styles.trailing}>
        {onDensityChange && density && (
          <div className={styles.densityGroup} role="radiogroup" aria-label="Table density">
            {['compact', 'default', 'comfortable'].map(option => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={density === option}
                className={`${styles.densityButton} ${density === option ? styles.densityButtonActive : ''}`}
                onClick={() => onDensityChange(option)}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
        )}

        {onExport && (
          <button
            type="button"
            className={styles.exportButton}
            onClick={onExport}
          >
            <IconExport size={14} />
            <span>Export</span>
          </button>
        )}
      </div>
    </div>
  );
}
