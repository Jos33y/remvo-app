import { useCallback, useEffect, useMemo, useRef } from 'react';
import { IconSort } from '@components/ui/icons/IconSort';
import { IconChevron } from '@components/ui/icons/IconChevron';
import { SkeletonBlock } from '@components/ui/shared/SkeletonBlock';
import { EmptyState } from '@components/ui/admin/EmptyState';
import { Pagination } from '@components/ui/admin/Pagination';
import styles from '@styles/ui/admin/data-table.module.css';

/* ──────────────────────────────────────────────────────────────────
 * DataTable
 *
 * The workhorse primitive for every tabular admin surface.
 * Used by: Transactions, Settlements, Audit log, Platforms, Corridors,
 * Merchants, Operators, Transaction detail webhook log, RateEngine history.
 *
 * ── API ──
 *
 * columns       | Column[]
 *   key         | unique column key; also used to access row data by default
 *   header      | string | column header text
 *   width       | optional fixed width (px or string)
 *   align       | 'left' (default) | 'right' | 'center'
 *   sortable    | default false
 *   priority    | 'primary' | 'secondary' (default) | 'hidden' | controls mobile cards reflow
 *   renderer    | optional (value, row, rowIndex) => ReactNode
 *   headerClass | optional class addition
 *   cellClass   | optional class addition
 *
 * rows          | any[] — row shape accessed via column.key unless renderer provided
 * getRowKey     | (row) => string — defaults to row.id
 *
 * density       | 'compact' | 'default' | 'comfortable'
 * sortState     | { key, direction: 'asc' | 'desc' } | null
 * onSortChange  | (key, direction) => void
 *
 * selectable    | boolean
 * selectedKeys  | Set<string>
 * onSelectionChange | (nextSet) => void
 *
 * onRowClick    | (row) => void — enables row interactivity and keyboard nav
 *
 * loading       | boolean — replaces body with skeleton rows
 * skeletonRowCount | default 5
 *
 * emptyState    | { icon, heading, body, action } — rendered inside tbody when rows is empty
 *
 * pagination    | PaginationProps — when provided, DataTable renders Pagination below
 *
 * stickyHeader  | default true
 * mobileReflow  | 'sticky' (default) | 'cards' — determines mobile strategy
 *
 * ariaLabel     | accessible name for the table element
 * className     | outer wrap class merge
 *
 * ── Behaviour ──
 *
 * Sort: click a sortable header to toggle asc → desc. Clicking a different
 * column sorts it asc. Consumer owns sort state.
 *
 * Selection: header checkbox is tri-state (none / indeterminate / all).
 * Row checkbox toggles selection without firing onRowClick. Clicking the row
 * (outside the checkbox) fires onRowClick.
 *
 * Keyboard: Arrow Up/Down moves focus between rows when rows are interactive
 * (onRowClick set or selectable). Enter fires onRowClick. Space toggles
 * selection. Home/End jump to first/last.
 *
 * Mobile sticky: table remains tabular with horizontal scroll; first column
 * becomes position: sticky. Consumers with only 3-5 columns should use this.
 *
 * Mobile cards: each row renders as a stacked card. `priority: 'primary'`
 * columns show collapsed; `priority: 'secondary'` show expanded; `priority:
 * 'hidden'` never show. Cards never show `aria-hidden` checkboxes; selection
 * is desktop-only until a specific mobile selection UI is designed.
 * ────────────────────────────────────────────────────────────────── */

const DEFAULT_SKELETON_WIDTHS = ['80%', '65%', '70%', '55%', '72%', '60%', '68%', '50%'];

function defaultGetRowKey(row) {
  return row?.id;
}

function getValue(row, key) {
  if (row == null) return undefined;
  return row[key];
}

export function DataTable({
  columns = [],
  rows = [],
  getRowKey = defaultGetRowKey,
  density = 'default',
  sortState = null,
  onSortChange,
  selectable = false,
  selectedKeys,
  onSelectionChange,
  onRowClick,
  loading = false,
  skeletonRowCount = 5,
  emptyState,
  pagination,
  stickyHeader = true,
  mobileReflow = 'sticky',
  ariaLabel,
  className,
}) {
  const tableRef = useRef(null);

  // ─── Selection helpers ───────────────────────────────────────

  const selected = selectedKeys instanceof Set ? selectedKeys : new Set();

  const allVisibleSelected = rows.length > 0 && rows.every(r => selected.has(getRowKey(r)));
  const someVisibleSelected = rows.some(r => selected.has(getRowKey(r)));
  const headerCheckboxState = allVisibleSelected
    ? 'checked'
    : (someVisibleSelected ? 'indeterminate' : 'unchecked');

  const toggleAll = useCallback(() => {
    if (!onSelectionChange) return;
    const next = new Set(selected);
    if (allVisibleSelected) {
      rows.forEach(r => next.delete(getRowKey(r)));
    } else {
      rows.forEach(r => next.add(getRowKey(r)));
    }
    onSelectionChange(next);
  }, [rows, selected, allVisibleSelected, getRowKey, onSelectionChange]);

  const toggleOne = useCallback((rowKey) => {
    if (!onSelectionChange) return;
    const next = new Set(selected);
    if (next.has(rowKey)) {
      next.delete(rowKey);
    } else {
      next.add(rowKey);
    }
    onSelectionChange(next);
  }, [selected, onSelectionChange]);

  // ─── Sort helper ─────────────────────────────────────────────

  const handleHeaderSort = useCallback((column) => {
    if (!column.sortable || !onSortChange) return;
    const currentKey = sortState?.key;
    const currentDir = sortState?.direction;
    if (currentKey === column.key) {
      onSortChange(column.key, currentDir === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(column.key, 'asc');
    }
  }, [sortState, onSortChange]);

  // ─── Keyboard navigation ─────────────────────────────────────
  //
  // Arrow Up/Down move focus between interactive rows within this table.
  // Home/End jump to first/last. Enter fires onRowClick if the currently
  // focused row is a data row. Space toggles selection on focused row.

  const handleTableKeyDown = useCallback((event) => {
    const isInteractive = Boolean(onRowClick || selectable);
    if (!isInteractive) return;

    const target = event.target;
    if (!tableRef.current || !(target instanceof HTMLElement)) return;

    // Only handle keys when a row is the active target (not a cell input/button)
    const currentRow = target.closest('tr[data-interactive="true"]');
    if (!currentRow) return;

    const allRows = Array.from(
      tableRef.current.querySelectorAll('tr[data-interactive="true"]')
    );
    if (allRows.length === 0) return;

    const currentIndex = allRows.indexOf(currentRow);
    let nextIndex = currentIndex;

    switch (event.key) {
      case 'ArrowDown':
        nextIndex = Math.min(currentIndex + 1, allRows.length - 1);
        break;
      case 'ArrowUp':
        nextIndex = Math.max(currentIndex - 1, 0);
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = allRows.length - 1;
        break;
      case 'Enter': {
        if (target === currentRow && onRowClick) {
          event.preventDefault();
          const rowKey = currentRow.getAttribute('data-row-key');
          const row = rows.find(r => String(getRowKey(r)) === rowKey);
          if (row) onRowClick(row);
        }
        return;
      }
      case ' ':
      case 'Spacebar': {
        if (target === currentRow && selectable) {
          event.preventDefault();
          const rowKey = currentRow.getAttribute('data-row-key');
          if (rowKey) toggleOne(rowKey);
        }
        return;
      }
      default:
        return;
    }

    if (nextIndex !== currentIndex) {
      event.preventDefault();
      allRows[nextIndex]?.focus();
    }
  }, [onRowClick, rows, selectable, getRowKey, toggleOne]);

  // ─── Filter visible columns (by priority for card reflow) ────
  //
  // All columns render in the table markup. For card reflow, we
  // still render them all in the table; the cards block shows only
  // non-hidden columns with priority ordering.

  const cardColumns = useMemo(() => {
    return columns.filter(c => c.priority !== 'hidden');
  }, [columns]);

  const primaryCardColumns = useMemo(() => {
    return cardColumns.filter(c => c.priority === 'primary');
  }, [cardColumns]);

  const secondaryCardColumns = useMemo(() => {
    return cardColumns.filter(c => c.priority !== 'primary');
  }, [cardColumns]);

  // ─── Header checkbox indeterminate ref ───────────────────────

  const headerCheckboxRef = useRef(null);
  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = headerCheckboxState === 'indeterminate';
    }
  }, [headerCheckboxState]);

  // ─── Renderers ───────────────────────────────────────────────

  function renderCellContent(column, row, rowIndex) {
    const value = getValue(row, column.key);
    if (column.renderer) {
      return column.renderer(value, row, rowIndex);
    }
    if (value === undefined || value === null || value === '') {
      return <span className={styles.emptyValue}>—</span>;
    }
    return value;
  }

  function renderSortChevron(column) {
    if (!column.sortable) return null;
    const isActive = sortState?.key === column.key;
    const direction = isActive ? sortState.direction : null;
    return (
      <span className={`${styles.sortChevron} ${isActive ? styles.sortChevronActive : ''}`} aria-hidden="true">
        <IconSort size={12} direction={direction} />
      </span>
    );
  }

  // ─── DOM ─────────────────────────────────────────────────────

  const containerClasses = [
    styles.container,
    mobileReflow === 'cards' && styles.mobileCards,
    mobileReflow === 'sticky' && styles.mobileSticky,
    className,
  ].filter(Boolean).join(' ');

  const tableClasses = [
    styles.table,
    styles[`density-${density}`],
    stickyHeader && styles.stickyHeader,
  ].filter(Boolean).join(' ');

  const effectiveColSpan = columns.length + (selectable ? 1 : 0);

  return (
    <div className={containerClasses}>
      <div className={styles.tableWrap}>
        <table
          ref={tableRef}
          className={tableClasses}
          role="table"
          aria-label={ariaLabel}
          aria-busy={loading || undefined}
          onKeyDown={handleTableKeyDown}
        >
          <thead className={styles.thead}>
            <tr className={styles.headerRow}>
              {selectable && (
                <th className={`${styles.th} ${styles.selectCell}`} scope="col">
                  <label className={styles.checkboxLabel}>
                    <span className={styles.srOnly}>
                      {allVisibleSelected ? 'Deselect all rows' : 'Select all rows'}
                    </span>
                    <input
                      ref={headerCheckboxRef}
                      type="checkbox"
                      className={styles.checkbox}
                      checked={headerCheckboxState === 'checked'}
                      onChange={toggleAll}
                    />
                  </label>
                </th>
              )}
              {columns.map(column => {
                const isActiveSort = sortState?.key === column.key;
                const ariaSort = isActiveSort
                  ? (sortState.direction === 'asc' ? 'ascending' : 'descending')
                  : (column.sortable ? 'none' : undefined);

                const thClasses = [
                  styles.th,
                  styles[`align-${column.align || 'left'}`],
                  column.sortable && styles.sortable,
                  isActiveSort && styles.sortActive,
                  column.headerClass,
                ].filter(Boolean).join(' ');

                const style = column.width ? { width: column.width, minWidth: column.width } : undefined;

                if (column.sortable) {
                  return (
                    <th key={column.key} className={thClasses} scope="col" style={style} aria-sort={ariaSort}>
                      <button
                        type="button"
                        className={styles.sortButton}
                        onClick={() => handleHeaderSort(column)}
                      >
                        <span>{column.header}</span>
                        {renderSortChevron(column)}
                      </button>
                    </th>
                  );
                }

                return (
                  <th key={column.key} className={thClasses} scope="col" style={style}>
                    {column.header}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className={styles.tbody}>
            {loading ? (
              Array.from({ length: skeletonRowCount }).map((_, rowIdx) => (
                <tr key={`sk-${rowIdx}`} className={styles.row} aria-hidden="true">
                  {selectable && (
                    <td className={`${styles.td} ${styles.selectCell}`}>
                      <SkeletonBlock variant="text" width={14} />
                    </td>
                  )}
                  {columns.map((column, colIdx) => (
                    <td key={column.key} className={`${styles.td} ${styles[`align-${column.align || 'left'}`]}`}>
                      <SkeletonBlock
                        variant="text"
                        width={DEFAULT_SKELETON_WIDTHS[colIdx % DEFAULT_SKELETON_WIDTHS.length]}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr className={styles.emptyRow}>
                <td colSpan={effectiveColSpan} className={styles.emptyCell}>
                  <div aria-live="polite">
                    {emptyState ? (
                      <EmptyState
                        icon={emptyState.icon}
                        heading={emptyState.heading}
                        body={emptyState.body}
                        action={emptyState.action}
                        density="table"
                      />
                    ) : (
                      <EmptyState
                        heading="No results"
                        body="Adjust filters or search to see different results."
                        density="table"
                      />
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row, rowIndex) => {
                const rowKey = getRowKey(row);
                const isSelected = selected.has(rowKey);
                const isInteractive = Boolean(onRowClick || selectable);
                const rowClasses = [
                  styles.row,
                  isSelected && styles.rowSelected,
                  isInteractive && styles.rowInteractive,
                ].filter(Boolean).join(' ');

                const handleClick = (event) => {
                  // Don't fire row click when the user clicked the checkbox cell
                  if (event.target.closest(`.${styles.selectCell}`)) return;
                  if (onRowClick) onRowClick(row);
                };

                return (
                  <tr
                    key={rowKey}
                    className={rowClasses}
                    data-row-key={String(rowKey)}
                    data-interactive={isInteractive ? 'true' : undefined}
                    tabIndex={isInteractive ? 0 : undefined}
                    onClick={isInteractive ? handleClick : undefined}
                  >
                    {selectable && (
                      <td className={`${styles.td} ${styles.selectCell}`}>
                        <label className={styles.checkboxLabel}>
                          <span className={styles.srOnly}>
                            {isSelected ? 'Deselect row' : 'Select row'}
                          </span>
                          <input
                            type="checkbox"
                            className={styles.checkbox}
                            checked={isSelected}
                            onChange={() => toggleOne(rowKey)}
                            onClick={(event) => event.stopPropagation()}
                          />
                        </label>
                      </td>
                    )}
                    {columns.map(column => (
                      <td
                        key={column.key}
                        className={[
                          styles.td,
                          styles[`align-${column.align || 'left'}`],
                          column.cellClass,
                        ].filter(Boolean).join(' ')}
                      >
                        <div className={styles.cellInner}>
                          {renderCellContent(column, row, rowIndex)}
                        </div>
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Mobile cards reflow — alternate DOM shown only at mobile width
          * via CSS, for tables with 6+ columns that don't fit on a 390px
          * viewport even with horizontal scroll + sticky first column. */}
        {mobileReflow === 'cards' && !loading && rows.length > 0 && (
          <ul className={styles.mobileCardList} aria-label={ariaLabel ? `${ariaLabel} (mobile)` : undefined}>
            {rows.map((row, rowIndex) => {
              const rowKey = getRowKey(row);
              const isInteractive = Boolean(onRowClick);
              return (
                <li
                  key={`card-${rowKey}`}
                  className={`${styles.mobileCard} ${isInteractive ? styles.mobileCardInteractive : ''}`}
                  onClick={isInteractive ? () => onRowClick(row) : undefined}
                  tabIndex={isInteractive ? 0 : undefined}
                  role={isInteractive ? 'button' : undefined}
                  onKeyDown={(event) => {
                    if (!isInteractive) return;
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onRowClick(row);
                    }
                  }}
                >
                  {primaryCardColumns.length > 0 && (
                    <div className={styles.mobileCardPrimary}>
                      {primaryCardColumns.map(column => (
                        <div key={column.key} className={styles.mobileCardField}>
                          <span className={styles.mobileCardLabel}>{column.header}</span>
                          <span className={styles.mobileCardValue}>
                            {renderCellContent(column, row, rowIndex)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {secondaryCardColumns.length > 0 && (
                    <div className={styles.mobileCardSecondary}>
                      {secondaryCardColumns.map(column => (
                        <div key={column.key} className={styles.mobileCardField}>
                          <span className={styles.mobileCardLabel}>{column.header}</span>
                          <span className={styles.mobileCardValue}>
                            {renderCellContent(column, row, rowIndex)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {isInteractive && (
                    <span className={styles.mobileCardChevron} aria-hidden="true">
                      <IconChevron size={14} />
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {/* Mobile cards empty state */}
        {mobileReflow === 'cards' && !loading && rows.length === 0 && (
          <div className={styles.mobileCardEmpty} aria-live="polite">
            <EmptyState
              icon={emptyState?.icon}
              heading={emptyState?.heading || 'No results'}
              body={emptyState?.body || 'Adjust filters or search to see different results.'}
              action={emptyState?.action}
              density="section"
            />
          </div>
        )}
      </div>

      {pagination && (
        <Pagination {...pagination} />
      )}
    </div>
  );
}
