import { useEffect, useRef } from 'react';
import { NavLink } from 'react-router';
import { ADMIN_NAV_SECTIONS, adminPath } from '@app/adminRouter';
import { useReducedMotion } from '@hooks/useReducedMotion';
import { IconX } from '@components/ui/icons/IconX';
import { IconBell } from '@components/ui/icons/IconBell';
import { IconLogout } from '@components/ui/icons/IconLogout';
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
import { useAnalyticsAvailability } from '@hooks/useAnalyticsApi';
/* PHASE_7F_S3_DRAWER_HOOK_IMPORT */
import styles from '@styles/layout/admin/admin-drawer.module.css';

/* ──────────────────────────────────────────────────────────────────
 * AdminDrawer
 *
 * Mobile replacement for AdminSidebar. Slides in from the left at
 * 200ms ease-out. NavLinks use adminPath() for ?admin preservation.
 *
 * Closes on backdrop tap, Escape key, nav item tap (via AdminShell
 * location.pathname effect), or close button.
 *
 * Focus trap while open. Reduced motion replaces slide with instant.
 * ────────────────────────────────────────────────────────────────── */

const ICONS = {
  IconHome, IconLayers, IconClock, IconSettlement, IconRate, IconExport,
  IconBuilding, IconMerchant, IconCountry, IconAudit, IconCog,
};

export function AdminDrawer({ isOpen, onClose, operator }) {
  /* PHASE_7F_S3_DRAWER_HOOK_CALL */
  const availability = useAnalyticsAvailability();
  const reduced = useReducedMotion();
  const drawerRef = useRef(null);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function onKeydown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusables = drawerRef.current?.querySelectorAll(
        'a, button, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables || focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeydown);
    return () => document.removeEventListener('keydown', onKeydown);
  }, [isOpen, onClose]);

  return (
    <>
      {isOpen && (
        <div
          className={styles.backdrop}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        ref={drawerRef}
        className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ''} ${reduced ? styles.reducedMotion : ''}`}
        aria-label="Admin navigation"
        aria-hidden={!isOpen}
        inert={!isOpen ? '' : undefined}
      >
        <div className={styles.operatorCard}>
          <div className={styles.operatorAvatar} aria-hidden="true">
            {operator?.avatarInitials || '?'}
          </div>
          <div className={styles.operatorMeta}>
            <div className={styles.operatorName}>{operator?.displayName || 'Operator'}</div>
            <div className={styles.operatorEmail}>{operator?.email || ''}</div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className={styles.closeButton}
            aria-label="Close navigation menu"
            onClick={onClose}
          >
            <IconX size={20} />
          </button>
        </div>

        <nav className={styles.nav}>
          {ADMIN_NAV_SECTIONS.map(section => (
            <div key={section.key} className={styles.section}>
              <div className={styles.sectionLabel}>{section.label}</div>
              <ul className={styles.itemList}>
                {/* PHASE_7F_S3_DRAWER_GATE */}
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
                          <span className={styles.itemLabel}>{item.label}</span>
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
                      >
                        <span className={styles.itemIcon}>
                          {Icon && <Icon size={18} />}
                        </span>
                        <span className={styles.itemLabel}>{item.label}</span>
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className={styles.footer}>
          <button type="button" className={styles.footerButton} aria-label="Notifications">
            <IconBell size={18} />
            <span>Notifications</span>
          </button>
          <button type="button" className={styles.footerButton} aria-label="Log out">
            <IconLogout size={18} />
            <span>Log out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
