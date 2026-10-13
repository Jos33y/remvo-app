import { useEffect } from 'react';
import { NavLink, useLocation, useOutlet } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { Logo } from '@components/ui/shared/Logo';
import { ToastProvider } from '@components/ui/seller/Toast';
import { IconHome, IconListings, IconCredits, IconProfile, IconSupport } from '@components/ui/seller/icons';
import { useSupportUnread } from '@hooks/useSupportUnread';
import { useSellerSession } from '@context/SellerSession';
import { move, fade, useReducedMotion } from '@lib/sellerMotion';
import { SELLER_ROUTES } from '@utils/constants';
import theme from '@styles/layout/seller/app-theme.module.css';
import styles from '@styles/layout/seller/seller-shell.module.css';

/* ──────────────────────────────────────────────────────────────────
 * SellerShell
 *
 * The app frame. On a phone: content edge to edge, a translucent tab
 * bar along the bottom above the home indicator. From 900px: the same
 * same places in a rail on the left, content in a reading column.
 *
 * Tabs are the places a seller goes. Support is one of them, in plain
 * sight from the first visit: before anyone buys a credit they look for
 * a way to reach a person. A reply they have not seen puts a count on
 * it. Making a listing is not a place but an action, so it lives on
 * Home and in the Listings bar.
 *
 * Screens that cover the tabs (making a listing, a listing's detail)
 * set hideTabs via the route handle, as an iOS pushed or modal screen
 * does, so a phone screen is never short of room for the work.
 * ────────────────────────────────────────────────────────────────── */

export const TABS = [
  { to: SELLER_ROUTES.HOME, label: 'Home', Icon: IconHome, end: true },
  { to: SELLER_ROUTES.LISTINGS, label: 'Listings', Icon: IconListings },
  { to: SELLER_ROUTES.CREDITS, label: 'Credits', Icon: IconCredits },
  { to: SELLER_ROUTES.SUPPORT, label: 'Support', Icon: IconSupport },
  { to: SELLER_ROUTES.PROFILE, label: 'Profile', Icon: IconProfile },
];

function TabLink({ to, label, Icon, end, variant, badge = 0 }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => `${styles[variant]} ${isActive ? styles.active : ''}`}
      aria-label={badge ? `${label}, ${badge} new ${badge === 1 ? 'reply' : 'replies'}` : undefined}
    >
      {({ isActive }) => (
        <>
          <span className={styles.iconWrap}>
            <Icon size={variant === 'tab' ? 26 : 22} filled={isActive} />
            {badge > 0 && <span className={styles.badge} aria-hidden="true">{badge > 9 ? '9+' : badge}</span>}
          </span>
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
}

export function SellerShell() {
  const location = useLocation();
  // The element, not <Outlet />: an exiting page must keep showing
  // itself, not the page being navigated to.
  const outlet = useOutlet();
  const { account } = useSellerSession();
  const reduced = useReducedMotion();
  const covered = /^\/(listings\/[^/]+|batches\/[^/]+)$/.test(location.pathname);
  // Support is a chat: the box to write in sits just above the tabs, with no padding under it.
  const flush = location.pathname === SELLER_ROUTES.SUPPORT;
  const unread = useSupportUnread({ enabled: Boolean(account), onSupport: flush });

  // iOS Safari only shows :active on touch when a touch listener exists.
  useEffect(() => {
    const noop = () => {};
    document.addEventListener('touchstart', noop, { passive: true });
    return () => document.removeEventListener('touchstart', noop);
  }, []);

  const pageMotion = reduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: fade }
    : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0, transition: move }, exit: { opacity: 0, transition: { duration: 0.1 } } };

  return (
    <ToastProvider>
      <div className={`${theme.theme} ${styles.app} ${covered ? styles.covered : ''} ${flush ? styles.flush : ''}`}>
        <a href="#seller-main" className="skip-link">Skip to content</a>

        <aside className={styles.rail} aria-label="Remvo">
          <div className={styles.railBrand}><Logo variant="gold" size="default" href={SELLER_ROUTES.HOME} /></div>
          <nav className={styles.railNav} aria-label="Main">
            {TABS.map((t) => <TabLink key={t.to} {...t} variant="railItem" badge={t.to === SELLER_ROUTES.SUPPORT ? unread : 0} />)}
          </nav>
          <div className={styles.railFoot}>
            <span className={styles.railEmail} title={account?.email}>{account?.email}</span>
          </div>
        </aside>

        <main id="seller-main" className={styles.main}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={location.pathname} className={styles.page} {...pageMotion}>
              {outlet}
            </motion.div>
          </AnimatePresence>
        </main>

        <nav className={styles.tabbar} aria-label="Main">
          {TABS.map((t) => <TabLink key={t.to} {...t} variant="tab" badge={t.to === SELLER_ROUTES.SUPPORT ? unread : 0} />)}
        </nav>
      </div>
    </ToastProvider>
  );
}
