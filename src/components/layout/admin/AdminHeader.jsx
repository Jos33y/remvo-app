import { useEffect, useRef, useState } from 'react';
import { Logo } from '@components/ui/shared/Logo';
import { adminPath } from '@app/adminRouter';
import { useOperatorSession } from '@context/AdminContext';
import { IconBell } from '@components/ui/icons/IconBell';
import { IconHamburger } from '@components/ui/icons/IconHamburger';
import { IconLogout } from '@components/ui/icons/IconLogout';
import styles from '@styles/layout/admin/admin-header.module.css';
import menuStyles from '@styles/layout/admin/admin-header-menu.module.css';

/* ──────────────────────────────────────────────────────────────────
 * AdminHeader
 *
 * Obsidian strip across the top. Fixed at 64px height, full-width.
 *
 * Layout
 *   Left      | Logo mark only (size="large", 36px wide, no
 *               wordmark). In a 64px header without a wordmark the
 *               large preset fills the vertical space properly.
 *               Page title sits 12px to the right as a visible h1.
 *   Right     | Environment pill (desktop), notification bell,
 *               operator avatar with dropdown menu, hamburger (mobile).
 *
 * Avatar dropdown
 *   Opens on click; closes on Escape, outside click, item tap, or
 *   route nav (handled by AdminShell unmounting the header on
 *   redirect). Anchors to the avatar button and portals visually via
 *   absolute positioning inside the header. No portal to body because
 *   the header already sits above content stacking.
 *
 *   Items
 *     - Operator identity block (name + email)
 *     - Sign out          | routes to /login via signOut()
 *     - Reset mock data   | dev-only; calls window.__remvoResetMockData()
 * ────────────────────────────────────────────────────────────────── */

export function AdminHeader({
  pageTitle,
  operator,
  environment,
  notificationCount = 0,
  onHamburgerTap,
  showHamburger = true,
}) {
  const { signOut } = useOperatorSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const avatarRef = useRef(null);

  // Close on outside click + Escape
  useEffect(() => {
    if (!menuOpen) return;

    function handlePointer(event) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        avatarRef.current &&
        !avatarRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    }
    function handleKey(event) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        avatarRef.current?.focus();
      }
    }

    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('touchstart', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('touchstart', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [menuOpen]);

  function handleSignOut() {
    setMenuOpen(false);
    signOut();
  }

  function handleResetMockData() {
    setMenuOpen(false);
    if (typeof window !== 'undefined' && typeof window.__remvoResetMockData === 'function') {
      window.__remvoResetMockData();
    }
  }

  const envPillClass = environment === 'production'
    ? `${styles.envPill} ${styles.envPillProduction}`
    : `${styles.envPill} ${styles.envPillSandbox}`;

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <Logo
          href={adminPath('/')}
          variant="gold"
          size="large"
          tone="white"
          showWordmark={false}
        />
        {pageTitle && (
          <h1 className={styles.pageTitle}>
            {pageTitle}
          </h1>
        )}
      </div>

      <div className={styles.right}>
        <span className={envPillClass} aria-label={`Environment: ${environment}`}>
          {environment === 'production' ? 'PRODUCTION' : 'SANDBOX'}
        </span>

        <button
          type="button"
          className={styles.iconButton}
          aria-label={
            notificationCount > 0
              ? `Notifications, ${notificationCount} unread`
              : 'Notifications'
          }
        >
          <IconBell size={18} />
          {notificationCount > 0 && <span className={styles.unreadDot} aria-hidden="true" />}
        </button>

        {operator && (
          <div className={menuStyles.avatarWrap}>
            <button
              ref={avatarRef}
              type="button"
              className={styles.avatar}
              aria-label={`${operator.displayName} account menu`}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(v => !v)}
            >
              {operator.avatarInitials}
            </button>

            {menuOpen && (
              <div
                ref={menuRef}
                className={menuStyles.menu}
                role="menu"
                aria-label="Operator menu"
              >
                <div className={menuStyles.identity}>
                  <span className={menuStyles.identityName}>{operator.displayName}</span>
                  {operator.email && (
                    <span className={menuStyles.identityEmail}>{operator.email}</span>
                  )}
                </div>

                <div className={menuStyles.divider} role="separator" />

                <button
                  type="button"
                  role="menuitem"
                  className={menuStyles.item}
                  onClick={handleSignOut}
                >
                  <IconLogout size={16} />
                  <span>Sign out</span>
                </button>

                {import.meta.env.DEV && (
                  <>
                    <div className={menuStyles.divider} role="separator" />
                    <button
                      type="button"
                      role="menuitem"
                      className={`${menuStyles.item} ${menuStyles.itemMuted}`}
                      onClick={handleResetMockData}
                    >
                      <span>Reset mock data</span>
                      <span className={menuStyles.kbd}>dev</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {showHamburger && (
          <button
            type="button"
            className={styles.hamburger}
            aria-label="Open navigation menu"
            onClick={onHamburgerTap}
          >
            <IconHamburger size={20} />
          </button>
        )}
      </div>
    </header>
  );
}
