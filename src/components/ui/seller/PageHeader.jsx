import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { cameFrom } from '@lib/sellerTrail';
import { IconChevronLeft } from '@components/ui/seller/icons';
import styles from '@styles/ui/seller/page-header.module.css';

/* ──────────────────────────────────────────────────────────────────
 * PageHeader
 *
 * The iOS navigation bar: a large title in the page, and a slim bar
 * above it that is see-through until content scrolls beneath, then
 * takes a material and shows the title small. The large title is
 * watched with an IntersectionObserver, so the bar changes on the
 * frame the title leaves, not on a scroll handler.
 *
 *   title    the page's name
 *   back     a path (or -1) for a back button; omit on tab roots
 *   backLabel  the back button's text, the screen it returns to
 *   action   a node for the right side of the bar
 *   large    false for detail pages, which use only the small bar
 *   quiet    no large title, but the bar stays clear until content
 *            scrolls under it (Home, whose first figure is its title)
 * ────────────────────────────────────────────────────────────────── */

export function PageHeader({ title, back, backLabel = 'Back', action, large = true, quiet = false, children }) {
  const navigate = useNavigate();
  const sentinel = useRef(null);
  const [scrolled, setScrolled] = useState(!large && !quiet);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return undefined;
    // Without a large title the small one is the page's name: always shown.
    const io = new IntersectionObserver(([e]) => setScrolled((!large && !quiet) || !e.isIntersecting), {
      rootMargin: `-${44 + 1}px 0px 0px 0px`,
    });
    io.observe(el);
    return () => io.disconnect();
  }, [large, quiet]);

  // Back to the screen just left goes back in history, so it opens where
  // it was scrolled; otherwise the named screen opens fresh, at its top.
  const goBack = () => (back === -1 || cameFrom(back) ? navigate(-1) : navigate(back));

  return (
    <>
      <div className={`${styles.bar} ${scrolled ? styles.barScrolled : ''}`}>
        <div className={styles.barInner}>
          <div className={styles.side}>
            {back !== undefined && (
              <button type="button" className={styles.back} onClick={goBack}>
                <IconChevronLeft size={24} />
                <span>{backLabel}</span>
              </button>
            )}
          </div>
          <p className={`${styles.smallTitle} ${scrolled ? styles.smallTitleOn : ''}`} aria-hidden={large || quiet ? !scrolled : undefined}>
            {title}
          </p>
          <div className={`${styles.side} ${styles.sideRight}`}>{action}</div>
        </div>
      </div>
      <div ref={sentinel} className={styles.sentinel} aria-hidden="true" />
      {large && !quiet ? (
        <header className={styles.large}>
          <h1 className={styles.largeTitle}>{title}</h1>
          {children}
        </header>
      ) : (
        <h1 className="sr-only">{title}</h1>
      )}
    </>
  );
}
