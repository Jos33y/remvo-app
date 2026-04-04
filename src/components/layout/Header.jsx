import { Link, useLocation } from 'react-router';
import { Logo } from '@components/ui/Logo';
import { ROUTES } from '@utils/constants';
import styles from '@styles/layout/header.module.css';

export function Header() {
  const { pathname } = useLocation();

  const navItems = [
    { to: ROUTES.PARTNERS, label: 'For platforms' },
    { to: ROUTES.AGREEMENT, label: 'Agreement' },
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
