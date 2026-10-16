import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate, useOutlet } from 'react-router';
import { Logo } from '@components/ui/shared/Logo';
import { ToastProvider } from '@components/ui/seller/Toast';
import { IconHome, IconListings, IconCredits, IconProfile, IconSignOut, IconSupport } from '@components/ui/seller/icons';
import { useSupportUnread } from '@hooks/useSupportUnread';
import { useThemeColor } from '@hooks/useThemeColor';
import { count } from '@lib/plural';
import { note } from '@lib/sellerTrail';
import { useSellerSession } from '@context/SellerSession';
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

/* The account at the foot of the rail: who is signed in, a way to their
 * profile, and signing out one click away rather than at the bottom of
 * Profile. Phones keep it in Profile, where the tab bar leads. */
function RailAccount() {
  const { account, signOut } = useSellerSession();
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);
  if (!account) return null;
  const name = account.name || 'Your account';
  async function leave() {
    setLeaving(true);
    await signOut();
    navigate(SELLER_ROUTES.SIGN_IN, { replace: true });
  }
  return (
    <div className={styles.railFoot}>
      <Link to={SELLER_ROUTES.PROFILE} className={styles.account} title={account.email}>
        <span className={styles.accountInitial} aria-hidden="true">{(account.name || account.email).charAt(0).toUpperCase()}</span>
        <span className={styles.accountText}>
          <span className={styles.accountName}>{name}</span>
          <span className={styles.accountEmail}>{account.email}</span>
        </span>
      </Link>
      <button type="button" className={styles.signOut} onClick={leave} disabled={leaving}>
        <IconSignOut size={18} />
        {leaving ? 'Signing out…' : 'Sign out'}
      </button>
    </div>
  );
}

// Screens that use a laptop's width: Home, a listing (two panes), Bulk
// (the sheet beside the verdict) and a batch (the sheet of stamps).
const WIDE = /^\/(?:$|listings\/(?!new$)[^/]+$|batches\/[^/]+$)/;

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
      aria-label={badge ? `${label}, ${count(badge, 'new reply', 'new replies')}` : undefined}
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
  const outlet = useOutlet();
  const { account } = useSellerSession();
  const covered = /^\/(listings\/[^/]+|batches\/[^/]+)$/.test(location.pathname);
  // Support is a chat: the box to write in sits just above the tabs, with no padding under it.
  const flush = location.pathname === SELLER_ROUTES.SUPPORT;
  const unread = useSupportUnread({ enabled: Boolean(account), onSupport: flush });
  // The bars' own colour (app-theme.module.css --app-bar-solid). Dark only.
  useThemeColor('#18181C', '#18181C');

  // The night under the app too: iOS overscroll and short screens show
  // the page behind, which is the marketing site's warm white otherwise.
  useEffect(() => {
    const { documentElement: root, body } = document;
    const was = [root.style.backgroundColor, root.style.colorScheme, body.style.backgroundColor];
    root.style.backgroundColor = '#141418';
    root.style.colorScheme = 'dark';
    body.style.backgroundColor = '#141418';
    return () => { [root.style.backgroundColor, root.style.colorScheme, body.style.backgroundColor] = was; };
  }, []);

  // Where each screen sits in history, for the back buttons (lib/sellerTrail.js).
  useEffect(() => { note(location.pathname); }, [location.key, location.pathname]);

  // iOS Safari only shows :active on touch when a touch listener exists.
  useEffect(() => {
    const noop = () => {};
    document.addEventListener('touchstart', noop, { passive: true });
    return () => document.removeEventListener('touchstart', noop);
  }, []);

  return (
    <ToastProvider>
      <div className={`${theme.theme} ${styles.app} ${covered ? styles.covered : ''} ${flush ? styles.flush : ''}`}>
        <a href="#seller-main" className="skip-link">Skip to content</a>

        <aside className={styles.rail} aria-label="Remvo">
          <div className={styles.railBrand}><Logo variant="gold" size="default" href={SELLER_ROUTES.HOME} /></div>
          <nav className={styles.railNav} aria-label="Main">
            {TABS.map((t) => <TabLink key={t.to} {...t} variant="railItem" badge={t.to === SELLER_ROUTES.SUPPORT ? unread : 0} />)}
          </nav>
          <RailAccount />
        </aside>

        <main id="seller-main" className={styles.main}>
          {/* Tabs change at once (motion spec 8): no fade, no wait for the
            * old page to leave. A pushed screen (a listing, a batch) rises
            * in briefly so the eye follows where it came from. */}
          <div key={location.pathname} className={`${styles.page} ${covered ? styles.pushIn : ''} ${WIDE.test(location.pathname) ? styles.pageWide : ''}`}>
            {outlet}
          </div>
        </main>

        <nav className={styles.tabbar} aria-label="Main">
          {TABS.map((t) => <TabLink key={t.to} {...t} variant="tab" badge={t.to === SELLER_ROUTES.SUPPORT ? unread : 0} />)}
        </nav>
      </div>
    </ToastProvider>
  );
}
