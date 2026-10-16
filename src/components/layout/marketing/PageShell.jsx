import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { Header } from '@components/layout/marketing/Header';
import { Footer } from '@components/layout/marketing/Footer';
import { ScrollToTop } from '@components/layout/shared/ScrollToTop';
import { SiteChat } from '@components/ui/support/SiteChat';
import { CampaignBanner } from '@components/ui/marketing/CampaignBanner';
import { canonical, pageMeta } from '@lib/seo';
import '@styles/base/instrument-serif.css';
import styles from '@styles/layout/marketing/page-shell.module.css';

/* The page's title, description and canonical address, from lib/seo.js.
 * The build writes them into each page's HTML; this keeps them right
 * when a visitor moves between pages without a reload. */
function useHead() {
  const { pathname } = useLocation();
  useEffect(() => {
    const meta = pageMeta(pathname);
    const set = (selector, attr, value) => document.querySelector(selector)?.setAttribute(attr, value);
    document.title = meta.title;
    set('meta[name="description"]', 'content', meta.description);
    set('meta[property="og:title"]', 'content', meta.title);
    set('meta[property="og:description"]', 'content', meta.description);
    set('meta[property="og:url"]', 'content', canonical(pathname));
    set('meta[name="twitter:title"]', 'content', meta.title);
    set('meta[name="twitter:description"]', 'content', meta.description);
    set('link[rel="canonical"]', 'href', canonical(pathname));
  }, [pathname]);
}

export function PageShell() {
  useHead();
  return (
    <div className={styles.shell}>
      <ScrollToTop />
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <CampaignBanner />
      <Header />
      <main id="main-content" className={styles.main}>
        <Outlet />
      </main>
      <Footer />
      <SiteChat />
    </div>
  );
}
