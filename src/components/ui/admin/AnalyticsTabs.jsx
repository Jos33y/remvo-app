import { NavLink } from 'react-router';
import { adminPath } from '@app/adminRouter';
import styles from '@styles/ui/admin/analytics-tabs.module.css';

/* ──────────────────────────────────────────────────────────────────
 * AnalyticsTabs
 *
 * Vercel-style horizontal tab bar that drives the sub-route. Each
 * tab is a NavLink with `end` so only the exact match lights up.
 * Active state is a 2px bottom border + primary text colour; no
 * background fill, no pill treatment.
 *
 * Routes
 *   /analytics              | Overview
 *   /analytics/funnel       | Checkout funnel
 *   /analytics/platforms    | Platforms
 *
 * Register is neutral-only — the tabs always sit on paper under
 * the obsidian hero strip. No obsidian variant needed.
 * ────────────────────────────────────────────────────────────────── */

const TABS = [
  { to: '/analytics',           label: 'Overview',         end: true  },
  { to: '/analytics/funnel',    label: 'Checkout funnel',  end: true  },
  { to: '/analytics/platforms', label: 'Platforms',        end: true  },
];

export function AnalyticsTabs({ className }) {
  const classes = [styles.tabs, className].filter(Boolean).join(' ');

  return (
    <nav className={classes} aria-label="Analytics sections">
      <ul className={styles.list}>
        {TABS.map(tab => (
          <li key={tab.to} className={styles.item}>
            <NavLink
              to={adminPath(tab.to)}
              end={tab.end}
              className={({ isActive }) =>
                isActive
                  ? `${styles.link} ${styles.linkActive}`
                  : styles.link
              }
            >
              {tab.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
