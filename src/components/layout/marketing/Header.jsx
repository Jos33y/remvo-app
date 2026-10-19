import { Link, useLocation } from 'react-router';
import { Logo } from '@components/ui/shared/Logo';
import { Button } from '@components/ui/shared/Button';
import { ROUTES, APP_LINKS } from '@utils/constants';
import styles from '@styles/layout/marketing/header.module.css';

/* Marketing header.
 *
 * The destinations a first-time visitor needs: what it does, the free
 * fee calculator, the guides, what it costs, and help. Sign in sits apart as the one action. Under
 * 640px How it works and Help drop out of the bar; both stay in the
 * footer, and Pricing stays because it is the question people arrive
 * with.
 */
const NAV = [
  { to: ROUTES.HOW, label: 'How it works', compact: false },
  // tools2: the free fee calculator, in the bar at every width ("Calculator"
  // on a phone; its name stays "Fee calculator", which contains it).
  { to: ROUTES.FEES_US, label: 'Fee calculator', short: 'Calculator', compact: true, also: [ROUTES.FEES_UK] },
  // Under 380px there is no room for both: Pricing stays in the footer.
  // guides1: on wide screens; on a phone it is in the footer.
  { to: ROUTES.GUIDES, label: 'Guides', compact: false, prefix: true },
  { to: ROUTES.PRICING, label: 'Pricing', compact: true, roomy: true },
  // help1: Help takes Contact's place; the help pages and the footer
  // both lead to Contact, and Help answers more of what people came for.
  { to: ROUTES.HELP, label: 'Help', compact: false, prefix: true },
];

export function Header() {
  const { pathname } = useLocation();

  return (
    <header className={styles.header} role="banner">
      <div className={styles.inner}>
        <Logo variant="gold" size="default" />
        <div className={styles.right}>
          <nav className={styles.nav} aria-label="Primary navigation">
            {NAV.map(({ to, label, short, compact, roomy = false, also = [], prefix = false }) => {
              const here = pathname === to || also.includes(pathname) || (prefix && pathname.startsWith(`${to}/`));
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
