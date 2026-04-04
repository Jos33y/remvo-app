import { Link } from 'react-router';
import { Reveal } from '@components/ui/Reveal';
import { BRAND } from '@utils/constants';
import styles from '@styles/layout/legal-page-layout.module.css';

/**
 * LegalPageLayout
 *
 * Shared layout for all legal/policy pages:
 * - Dark atmospheric hero (title, meta, optional TOC)
 * - Warm-white body for clause content
 * - Document footer with contact reference
 *
 * Props:
 *   title        : page heading (string)
 *   date         : "3 April 2026" display string
 *   dateTime     : "2026-04-03" ISO for <time> element
 *   version      : optional version badge ("v1.0")
 *   backTo       : route path for back link (optional)
 *   backLabel    : back link text (default: "Back to overview")
 *   tocItems     : optional array of { id, label } for table of contents
 *   preamble     : optional JSX or string rendered above clauses
 *   footerNote   : optional override for footer text
 *   children     : clause content
 */
export function LegalPageLayout({
  title,
  date,
  dateTime,
  version,
  backTo,
  backLabel = 'Back to overview',
  tocItems,
  preamble,
  footerNote,
  children,
}) {
  return (
    <article>
      {/* ── Dark hero: title + meta + optional TOC ── */}
      <div className={styles.hero}>
        <div className={styles.heroInner}>
          {backTo && (
            <Link to={backTo} className={styles.backLink}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
              {backLabel}
            </Link>
          )}

          <h1 className={styles.title}>{title}</h1>

          <div className={styles.metaRow}>
            <p className={styles.meta}>
              Last updated: <time dateTime={dateTime}>{date}</time>
            </p>
            {version && (
              <span className={styles.metaVersion}>{version}</span>
            )}
          </div>

          {tocItems && tocItems.length > 0 && (
            <nav className={styles.toc} aria-label="Table of contents">
              <h2 className={styles.tocTitle}>Contents</h2>
              <ol className={styles.tocList}>
                {tocItems.map(({ id, label }) => (
                  <li key={id}>
                    <a href={`#${id}`} className={styles.tocLink}>
                      {label}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          )}
        </div>
      </div>

      {/* ── Body: clauses on warm-white ── */}
      <div className={styles.body}>
        <div className={styles.bodyInner}>
          {preamble && (
            <div className={styles.preamble}>{preamble}</div>
          )}
          {children}
        </div>
      </div>

      {/* ── Document footer ── */}
      <div className={styles.docFooter}>
        <div className={styles.docFooterInner}>
          <p className={styles.footerNote}>
            {footerNote || (
              <>
                This document is reviewed periodically. The current version is
                always available at this URL. Questions should be directed
                to{' '}
                <a href={`mailto:${BRAND.EMAIL}`}>{BRAND.EMAIL}</a>.
              </>
            )}
          </p>
        </div>
      </div>
    </article>
  );
}

/**
 * Clause
 *
 * Single legal clause with gold left-border heading.
 * Wrapped in Reveal for scroll animation.
 *
 * Props:
 *   id       : anchor ID for TOC linking
 *   heading  : clause heading text (e.g. "1. Definitions")
 *   children : paragraph content
 */
export function Clause({ id, heading, children }) {
  return (
    <Reveal>
      <section id={id} className={styles.clause}>
        <h2 className={styles.clauseHeading}>{heading}</h2>
        {children}
      </section>
    </Reveal>
  );
}

/**
 * DefList / DefItem
 *
 * Definition list styling for legal terms.
 */
export function DefList({ children }) {
  return <dl className={styles.defList}>{children}</dl>;
}

export function DefItem({ term, children }) {
  return (
    <div className={styles.defItem}>
      <dt className={styles.defTerm}>{term}</dt>
      <dd className={styles.defDesc}>{children}</dd>
    </div>
  );
}
