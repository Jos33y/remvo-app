import { useEffect } from 'react';
import { Outlet } from 'react-router';
import { ScrollToTop } from '@components/layout/shared/ScrollToTop';
import { PartnersHeader } from './PartnersHeader';
import { PartnersFooter } from './PartnersFooter';
import styles from '@styles/layout/partners/partners-shell.module.css';

/* ──────────────────────────────────────────────────────────────────
 * PartnersShell — wraps every page on partners.remvo.app.
 *
 * Two things separate this from PageShell:
 *   1. Injects <meta name="robots" content="noindex,nofollow"> at
 *      mount so search engines never index the integration surface.
 *      Imperative DOM manipulation (rather than React 19 metadata
 *      hoisting) so behaviour is identical across navigations and
 *      cleanly removed if the user backs out into another router
 *      via the ?partners dev escape.
 *   2. Uses a minimal header (logo only) and a minimal footer
 *      (legal mark only) appropriate for a private B2B surface.
 *
 * The body is warm-white (matches the marketing pages, not the
 * checkout obsidian) because partners is content territory.
 * ────────────────────────────────────────────────────────────────── */

export function PartnersShell() {
  useEffect(() => {
    const robotsMeta = document.createElement('meta');
    robotsMeta.name = 'robots';
    robotsMeta.content = 'noindex,nofollow';
    document.head.appendChild(robotsMeta);

    const googlebotMeta = document.createElement('meta');
    googlebotMeta.name = 'googlebot';
    googlebotMeta.content = 'noindex,nofollow';
    document.head.appendChild(googlebotMeta);

    return () => {
      robotsMeta.remove();
      googlebotMeta.remove();
    };
  }, []);

  return (
    <div className={styles.shell}>
      <ScrollToTop />
      <a href="#partners-main" className="skip-link">
        Skip to content
      </a>
      <PartnersHeader />
      <main id="partners-main" className={styles.main}>
        <Outlet />
      </main>
      <PartnersFooter />
    </div>
  );
}
