import { useState, useEffect } from 'react';
import { useLocation } from 'react-router';
import { ScrollToTop } from '@components/layout/shared/ScrollToTop';
import { VaultWatermark } from '@components/ui/shared/VaultWatermark';
import { AdminHeader } from '@components/layout/admin/AdminHeader';
import { AdminSidebar } from '@components/layout/admin/AdminSidebar';
import { AdminDrawer } from '@components/layout/admin/AdminDrawer';
import { useOperatorSession } from '@context/AdminContext';
import styles from '@styles/layout/admin/admin-shell.module.css';

/* ──────────────────────────────────────────────────────────────────
 * AdminShell
 *
 * Layout for every admin screen. When nav={true} (default):
 * header at the top, sidebar on the left at desktop widths,
 * drawer pattern on mobile via the header hamburger.
 *
 * When nav={false} (login, enrol, invite accept): no header,
 * no sidebar, no drawer. The page owns the full viewport. This
 * matches SCREEN_SPECS section 03.1 which specifies login as a
 * full-viewport obsidian surface with only the centred card.
 *
 * Props
 *   children          | the page content
 *   pageTitle         | sets <title>; shown in header when nav=true
 *   contentRegister   | 'obsidian' | 'neutral'. Default 'neutral'.
 *   nav               | boolean. Default true.
 *
 * Phase 6 A2: operator is read from useOperatorSession(). The
 * Phase 6 A1 hardcoded DEV_OPERATOR constant is removed. AdminHeader
 * and AdminDrawer receive the operator as a prop so their APIs do
 * not change.
 * ────────────────────────────────────────────────────────────────── */

const SIDEBAR_COLLAPSED_KEY = 'admin_sidebar_collapsed';

function readCollapsed() {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
}

export function AdminShell({
  children,
  pageTitle,
  contentRegister = 'neutral',
  nav = true,
}) {
  const location = useLocation();
  const { operator } = useOperatorSession();
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (pageTitle) {
      document.title = `${pageTitle} | Remvo Admin`;
    } else {
      document.title = 'Remvo Admin';
    }
  }, [pageTitle]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [drawerOpen]);

  function toggleCollapse() {
    const next = !collapsed;
    setCollapsed(next);
    window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
  }

  const shellClass = [
    styles.shell,
    !nav && styles.shellNoNav,
    collapsed && styles.shellCollapsed,
  ].filter(Boolean).join(' ');

  return (
    <div className={shellClass} data-canvas={contentRegister}>
      <ScrollToTop />
      <a href="#admin-main" className="skip-link">Skip to content</a>

      {contentRegister === 'obsidian' && <VaultWatermark size="default" />}

      {/* Header, sidebar, and drawer only render when nav=true.
       * Unauthenticated screens (login, enrol, invite) get a clean
       * full-viewport canvas with no chrome. */}
      {nav && (
        <AdminHeader
          pageTitle={pageTitle}
          operator={operator}
          environment={import.meta.env.MODE === 'production' ? 'production' : 'sandbox'}
          notificationCount={0}
          onHamburgerTap={() => setDrawerOpen(true)}
          showHamburger={nav}
        />
      )}

      {nav && (
        <AdminSidebar
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
          activeRoute={location.pathname}
        />
      )}

      {nav && (
        <AdminDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          operator={operator}
          activeRoute={location.pathname}
        />
      )}

      <main id="admin-main" className={styles.main}>
        {children}
      </main>
    </div>
  );
}
