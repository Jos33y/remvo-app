import { Link, useLocation } from 'react-router';
import { Logo } from '@components/ui/shared/Logo';
import { Button } from '@components/ui/shared/Button';
import { ROUTES, APP_LINKS } from '@utils/constants';
import styles from '@styles/layout/marketing/header.module.css';

/* Marketing header.
 *
 * Three destinations a first-time visitor needs: what it does, what it
 * costs, who to write to. Sign in sits apart as the one action. Under
 * 640px How it works and Contact drop out of the bar; both stay in the
 * footer, and Pricing stays because it is the question people arrive
 * with.
 */
const NAV = [
  { to: ROUTES.HOW, label: 'How it works', compact: false },
  { to: ROUTES.PRICING, label: 'Pricing', compact: true },
  { to: ROUTES.CONTACT, label: 'Contact', compact: false },
];

export function Header() {
  const { pathname } = useLocation();

  return (
    <header className={styles.header} role="banner">
      <div className={styles.inner}>
        <Logo variant="gold" size="default" />
        <div className={styles.right}>
          <nav className={styles.nav} aria-label="Primary navigation">
            {NAV.map(({ to, label, compact }) => (
              <Link
                key={to}
                to={to}
                aria-current={pathname === to ? 'page' : undefined}
                className={[
                  styles.navLink,
                  pathname === to ? styles.active : '',
                  compact ? '' : styles.wideOnly,
                ].filter(Boolean).join(' ')}
              >
                {label}
              </Link>
            ))}
          </nav>
          <Button href={APP_LINKS.SIGN_IN} variant="secondary" size="small">
            Sign in
          </Button>
        </div>
      </div>
    </header>
  );
}
