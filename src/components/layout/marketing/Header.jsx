import { Link, useLocation } from 'react-router';
import { Logo } from '@components/ui/shared/Logo';
import { ROUTES } from '@utils/constants';
import styles from '@styles/layout/marketing/header.module.css';

/* Marketing header.
 *
 * Public surface — only ever shows nav that's safe for a compliance
 * reviewer to land on. The partner-facing navigation has moved to
 * partners.remvo.app and is not linked from anywhere on remvo.app.
 *
 * Final marketing nav: Logo + Contact only.
 */
export function Header() {
  const { pathname } = useLocation();

  const navItems = [
    { to: ROUTES.CONTACT, label: 'Contact' },
  ];

  return (
    <header className={styles.header} role="banner">
      <div className={styles.inner}>
        <Logo variant="gold" size="default" />
        <nav className={styles.nav} aria-label="Primary navigation">
          {navItems.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`${styles.navLink} ${pathname === to ? styles.active : ''}`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
