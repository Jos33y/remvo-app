import { Link, useLocation } from 'react-router';
import { Logo } from '@components/ui/shared/Logo';
import { Button } from '@components/ui/shared/Button';
import { ROUTES, APP_LINKS } from '@utils/constants';
import styles from '@styles/layout/marketing/header.module.css';

/* Marketing header.
 *
 * The destinations a first-time visitor needs: what it does, the free
 * fee calculator, what it costs, who to write to. Sign in sits apart as the one action. Under
 * 640px How it works and Contact drop out of the bar; both stay in the
 * footer, and Pricing stays because it is the question people arrive
 * with.
 */
const NAV = [
  { to: ROUTES.HOW, label: 'How it works', compact: false },
  // tools2: the free fee calculator, in the bar at every width ("Calculator"
  // on a phone; its name stays "Fee calculator", which contains it).
  { to: ROUTES.FEES_US, label: 'Fee calculator', short: 'Calculator', compact: true, also: [ROUTES.FEES_UK] },
  // Under 380px there is no room for both: Pricing stays in the footer.
  { to: ROUTES.PRICING, label: 'Pricing', compact: true, roomy: true },
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
            {NAV.map(({ to, label, short, compact, roomy = false, also = [] }) => {
              const here = pathname === to || also.includes(pathname);
              return (
                <Link
                  key={to}
                  to={to}
                  aria-label={short ? label : undefined}
                  aria-current={here ? 'page' : undefined}
                  className={[
                    styles.navLink,
                    here ? styles.active : '',
                    compact ? '' : styles.wideOnly,
                    roomy ? styles.roomyOnly : '',
                  ].filter(Boolean).join(' ')}
                >
                  {short ? (
                    <>
                      <span className={styles.wideOnly}>{label}</span>
                      <span className={styles.narrowOnly}>{short}</span>
                    </>
                  ) : label}
                </Link>
              );
            })}
          </nav>
          <Button href={APP_LINKS.SIGN_IN} variant="secondary" size="small">
            Sign in
          </Button>
        </div>
      </div>
    </header>
  );
}
