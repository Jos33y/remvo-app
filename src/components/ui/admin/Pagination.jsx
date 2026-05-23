import { IconChevron } from '@components/ui/icons/IconChevron';
import styles from '@styles/ui/admin/pagination.module.css';

/* ──────────────────────────────────────────────────────────────────
 * Pagination
 *
 * Traditional page-based pagination for admin tables. Layout matches
 * VOCABULARY section 05:
 *
 *   [ Showing 1-50 of 1,247 ]   [ < Prev ]  [ 1 2 3 … 25 ]  [ Next > ]   [ Per page: 50 ]
 *
 * Mobile reflow: range summary stacks above the controls; per-page
 * selector tucks into the footer below.
 *
 * Props
 *   totalItems       | total row count in the dataset
 *   pageSize         | rows per page
 *   currentPage      | 1-indexed
 *   onPageChange     | (nextPage) => void
 *   onPageSizeChange | (nextSize) => void (optional)
 *   pageSizeOptions  | default [25, 50, 100]
 *   className        | class merge
 *
 * Accessibility
 *   Wrapped in a <nav aria-label="Pagination">. Current page has
 *   aria-current="page". Prev/Next buttons disabled on boundaries.
 * ────────────────────────────────────────────────────────────────── */

const DEFAULT_PAGE_SIZE_OPTIONS = [25, 50, 100];

function buildPageList(current, total) {
  // Always show: first, last, current, one on each side of current, with
  // ellipses for gaps. Small-total fast path: show all pages.
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = new Set([1, total, current, current - 1, current + 1]);
  // Pad the window when near the boundaries so we always show 5 numeric pages
  if (current <= 3) { pages.add(2); pages.add(3); pages.add(4); }
  if (current >= total - 2) { pages.add(total - 1); pages.add(total - 2); pages.add(total - 3); }

  const sorted = [...pages]
    .filter(p => p >= 1 && p <= total)
    .sort((a, b) => a - b);

  const withEllipses = [];
  sorted.forEach((page, idx) => {
    if (idx > 0 && page - sorted[idx - 1] > 1) {
      withEllipses.push('ellipsis');
    }
    withEllipses.push(page);
  });
  return withEllipses;
}

export function Pagination({
  totalItems,
  pageSize,
  currentPage,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  className,
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.max(1, Math.min(currentPage, totalPages));
  const rangeStart = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, totalItems);

  const pages = buildPageList(safePage, totalPages);
  const canGoPrev = safePage > 1;
  const canGoNext = safePage < totalPages;

  const classes = [styles.wrap, className].filter(Boolean).join(' ');

  return (
    <nav className={classes} aria-label="Pagination">
      <div className={styles.summary}>
        {totalItems === 0 ? (
          <span>No results</span>
        ) : (
          <span>
            Showing <strong>{rangeStart.toLocaleString()}</strong>–<strong>{rangeEnd.toLocaleString()}</strong>
            {' of '}<strong>{totalItems.toLocaleString()}</strong>
          </span>
        )}
      </div>

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.navButton}
          onClick={() => canGoPrev && onPageChange(safePage - 1)}
          disabled={!canGoPrev}
          aria-label="Previous page"
        >
          <IconChevron size={14} className={styles.chevronPrev} />
          <span>Prev</span>
        </button>

        <ul className={styles.pageList}>
          {pages.map((p, idx) => {
            if (p === 'ellipsis') {
              return (
                <li key={`ellipsis-${idx}`} className={styles.ellipsis} aria-hidden="true">
                  …
                </li>
              );
            }
            const isCurrent = p === safePage;
            return (
              <li key={p}>
                <button
                  type="button"
                  className={`${styles.pageButton} ${isCurrent ? styles.pageButtonActive : ''}`}
                  onClick={() => onPageChange(p)}
                  aria-current={isCurrent ? 'page' : undefined}
                  aria-label={isCurrent ? `Page ${p}, current page` : `Go to page ${p}`}
                >
                  {p}
                </button>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          className={styles.navButton}
          onClick={() => canGoNext && onPageChange(safePage + 1)}
          disabled={!canGoNext}
          aria-label="Next page"
        >
          <span>Next</span>
          <IconChevron size={14} className={styles.chevronNext} />
        </button>
      </div>

      {onPageSizeChange && (
        <div className={styles.pageSize}>
          <label htmlFor="pagination-size" className={styles.pageSizeLabel}>
            Per page
          </label>
          <select
            id="pagination-size"
            className={styles.pageSizeSelect}
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
          >
            {pageSizeOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      )}
    </nav>
  );
}
