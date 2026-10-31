import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import { AdminShell } from '@components/layout/admin/AdminShell';
import { RangePicker } from '@components/ui/admin/RangePicker';
import { adminPath } from '@app/adminRouter';
import { RANGE_KEYS, resolveRange, rangeLabel } from '@utils/analytics';
import styles from '@styles/pages/admin/analytics-page.module.css';
import tabs from '@styles/ui/admin/analytics-tabs.module.css';
import own from '@styles/pages/admin/remvo.module.css';

/* ──────────────────────────────────────────────────────────────────
 * RemvoLayout (analytics1)
 *
 * admin.remvo.app/remvo: Remvo's own analytics for the eBay listing
 * tool. The same hero, range picker and tab bar as the paused
 * Analytics screens, so the admin reads as one product; the range is
 * shared by every tab through useRemvoRange().
 *
 * analytics1b: "Today", "7d" and "30d" end at now, and now moves. The
 * range is worked out again on every tab change and whenever the
 * admin comes back into view, so new visits show without a reload.
 * ────────────────────────────────────────────────────────────────── */

const RangeContext = createContext(null);

export function useRemvoRange() {
  const ctx = useContext(RangeContext);
  if (!ctx) throw new Error('useRemvoRange must be used inside RemvoLayout');
  return ctx;
}

const TABS = [
  { to: '/remvo', label: 'Overview' },
  { to: '/remvo/sources', label: 'Sources' },
  { to: '/remvo/funnel', label: 'Funnel' },
  { to: '/remvo/pages', label: 'Pages' },
  { to: '/remvo/sellers', label: 'Sellers' },
  { to: '/remvo/quality', label: 'Quality' },
];

export function RemvoLayout() {
  const [value, setValue] = useState({ key: RANGE_KEYS.WEEK, custom: null });
  const [stamp, setStamp] = useState(0);
  const { pathname } = useLocation();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setStamp(Date.now());
  }, [pathname]);

  useEffect(() => {
    const onShow = () => { if (document.visibilityState === 'visible') setStamp(Date.now()); };
    document.addEventListener('visibilitychange', onShow);
    return () => document.removeEventListener('visibilitychange', onShow);
  }, []);

  // stamp is only a trigger: a new value means "work the range out again from now".
  const range = useMemo(() => resolveRange(value.key, value.custom), [value.key, value.custom?.from, value.custom?.to, stamp]);
  const ctx = useMemo(() => ({ range, label: rangeLabel(value.key, value.custom) }), [range, value]);

  return (
    <AdminShell pageTitle="Remvo" contentRegister="neutral">
      <div className={styles.page}>
        <section className={styles.hero} aria-label="Remvo report controls">
          <div className={styles.heroInner}>
            <div className={`${styles.heroText} ${own.heroText}`}>
              <p className={styles.kicker}>Remvo</p>
              <h1 className={styles.title}>eBay listings</h1>
              <p className={styles.subtitle}>Where sellers come from, what they do in the app, and where they stop before paying.</p>
            </div>
            <div className={styles.heroControls}>
              <RangePicker value={value} onChange={setValue} register="obsidian" />
            </div>
          </div>
        </section>

        <div className={styles.tabsWrap}>
          <nav className={tabs.tabs} aria-label="Remvo reports">
            <ul className={tabs.list}>
              {TABS.map((t) => (
                <li key={t.to} className={tabs.item}>
                  <NavLink to={adminPath(t.to)} end={t.to === '/remvo'} className={({ isActive }) => (isActive ? `${tabs.link} ${tabs.linkActive}` : tabs.link)}>
                    {t.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className={styles.body}>
          <RangeContext.Provider value={ctx}>
            <Outlet />
          </RangeContext.Provider>
        </div>
      </div>
    </AdminShell>
  );
}
