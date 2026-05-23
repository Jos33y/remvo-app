import { NavLink } from 'react-router';
import { ADMIN_NAV_SECTIONS, adminPath } from '@app/adminRouter';
import { IconChevron } from '@components/ui/icons/IconChevron';
import { IconHome } from '@components/ui/icons/IconHome';
import { IconLayers } from '@components/ui/icons/IconLayers';
import { IconClock } from '@components/ui/icons/IconClock';
import { IconSettlement } from '@components/ui/icons/IconSettlement';
import { IconRate } from '@components/ui/icons/IconRate';
import { IconExport } from '@components/ui/icons/IconExport';
import { IconBuilding } from '@components/ui/icons/IconBuilding';
import { IconMerchant } from '@components/ui/icons/IconMerchant';
import { IconCountry } from '@components/ui/icons/IconCountry';
import { IconAudit } from '@components/ui/icons/IconAudit';
import { IconCog } from '@components/ui/icons/IconCog';
import { IconAnalytics } from '@components/ui/icons/IconAnalytics';
import { useAnalyticsAvailability } from '@hooks/useAnalyticsApi';
/* PHASE_7F_S3_SIDEBAR_HOOK_IMPORT */
import styles from '@styles/layout/admin/admin-sidebar.module.css';

/* ──────────────────────────────────────────────────────────────────
 * AdminSidebar
 *
 * Desktop-only fixed-position left column. Hidden below 1024px;
 * AdminDrawer takes over on mobile.
 *
 * NavLinks use adminPath() so ?admin is preserved in dev mode.
 * On production (admin.remvo.app), adminPath returns the path
 * unchanged because hostname handles router selection.
 * ────────────────────────────────────────────────────────────────── */

const ICONS = {
  IconHome, IconLayers, IconClock, IconSettlement, IconRate, IconExport,
  IconBuilding, IconMerchant, IconCountry, IconAudit, IconCog,
  IconAnalytics,
};

export function AdminSidebar({ collapsed, onToggleCollapse, activeRoute }) {
  /* PHASE_7F_S3_SIDEBAR_HOOK_CALL */
  const availability = useAnalyticsAvailability();
  const sidebarClass = [
    styles.sidebar,
    collapsed && styles.collapsed,
  ].filter(Boolean).join(' ');

  return (
    <aside className={sidebarClass} aria-label="Admin navigation">
      <nav className={styles.nav}>
        {ADMIN_NAV_SECTIONS.map(section => (
          <div key={section.key} className={styles.section}>
            {!collapsed && (
              <div className={styles.sectionLabel}>{section.label}</div>
            )}
            <ul className={styles.itemList}>
              {/* PHASE_7F_S3_SIDEBAR_GATE */}
              {section.items.map(item => {
                const Icon = ICONS[item.icon];
                const isExact = item.route === '/';
                const isGated =
                  (item.gateKey === 'analytics'   && !availability.analytics_enabled) ||
                  (item.gateKey === 'withdrawals' && !availability.withdrawals_enabled);

                if (isGated) {
                  return (
                    <li key={item.route}>
                      <span
                        className={`${styles.item} ${styles.itemDisabled}`}
                        aria-disabled="true"
                        role="link"
                        title={`${item.label} | not enabled. Toggle in Settings.`}
                      >
                        <span className={styles.itemIcon}>
                          {Icon && <Icon size={18} />}
                        </span>
                        {!collapsed && (
                          <span className={styles.itemLabel}>{item.label}</span>
                        )}
                      </span>
                    </li>
                  );
                }

                return (
                  <li key={item.route}>
                    <NavLink
                      to={adminPath(item.route)}
                      end={isExact}
                      className={({ isActive }) =>
                        isActive
                          ? `${styles.item} ${styles.itemActive}`
                          : styles.item
                      }
                      title={collapsed ? item.label : undefined}
                    >
                      <span className={styles.itemIcon}>
                        {Icon && <Icon size={18} />}
                      </span>
                      {!collapsed && (
                        <span className={styles.itemLabel}>{item.label}</span>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <button
        type="button"
        className={styles.collapseToggle}
        onClick={onToggleCollapse}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <span className={styles.collapseChevron} data-collapsed={collapsed}>
          <IconChevron size={16} />
        </span>
        {!collapsed && <span className={styles.collapseLabel}>Collapse</span>}
      </button>
    </aside>
  );
}
