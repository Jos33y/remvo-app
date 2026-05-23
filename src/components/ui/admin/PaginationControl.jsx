import styles from '@styles/ui/admin/pagination-control.module.css';

/* Inline chevron SVGs | self-contained so this component has zero
 * dependency on the icon set's prop shape. Prevents a wrong-import
 * regression. */
function ChevronLeft({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRight({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* PaginationControl
 *
 * Page-based navigation over a cursor-paginated dataset. Designed
 * for the audit log and any future read-heavy table where operators
 * jump backward and forward within a filtered set. Different from
 * the Sessions/Transactions load-more pattern by intent | those
 * are forward-only reconciliation walks.
 *
 * Props:
 *   page              | number | 1-based current page
 *   pageSize          | number | rows per page
 *   pageSizeOptions   | array  | default [25, 50, 100]
 *   onPageSizeChange  | (size: number) => void
 *   onPrev            | () => void | undefined when prev disabled
 *   onNext            | () => void | undefined when next disabled
 *   onJumpToFirst     | () => void | shows back-to-start link when set + page > 2
 *   itemsOnPage       | number | rows currently rendered on this page
 *   total             | number | optional, total matching rows (may lag)
 *   loading           | boolean | disables nav buttons during fetch
 *
 * Position label:
 *   When total is known: "Page 3 | 51-100 of ~3,247"
 *   When total is unknown: "Page 3 | 51-100"
 *
 * The total carries a leading tilde to signal that count is from a
 * separate endpoint and may lag the cursor walk by a row or two.
 * That's an honest UX signal, not a hedge against a buggy count.
 */
export function PaginationControl({
  page,
  pageSize,
  pageSizeOptions = [25, 50, 100],
  onPageSizeChange,
  onPrev,
  onNext,
  onJumpToFirst,
  itemsOnPage,
  total,
  loading = false,
}) {
  const startIndex = (page - 1) * pageSize + 1;
  const endIndex = startIndex + Math.max(itemsOnPage, 0) - 1;
  const range = itemsOnPage > 0 ? `${startIndex.toLocaleString()}-${endIndex.toLocaleString()}` : '0';
  const totalLabel = typeof total === 'number' ? ` of ~${total.toLocaleString()}` : '';

  const showBackToStart = typeof onJumpToFirst === 'function' && page > 2;

  return (
    <div className={styles.root} role="navigation" aria-label="Pagination">
      <div className={styles.left}>
        <label className={styles.sizeLabel}>
          <span className={styles.sizeLabelText}>Per page</span>
          <select
            className={styles.sizeSelect}
            value={pageSize}
            onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
            disabled={loading}
            aria-label="Rows per page"
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
      </div>

      <div className={styles.center}>
        <span className={styles.position} aria-live="polite">
          Page {page} <span className={styles.positionDivider}>|</span> {range}{totalLabel}
        </span>
        {showBackToStart && (
          <button
            type="button"
            className={styles.jumpLink}
            onClick={onJumpToFirst}
            disabled={loading}
          >
            Back to start
          </button>
        )}
      </div>

      <div className={styles.right}>
        <button
          type="button"
          className={styles.navBtn}
          onClick={onPrev}
          disabled={!onPrev || loading}
          aria-label="Previous page"
        >
          <ChevronLeft size={14} />
          <span>Prev</span>
        </button>
        <button
          type="button"
          className={styles.navBtn}
          onClick={onNext}
          disabled={!onNext || loading}
          aria-label="Next page"
        >
          <span>Next</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
