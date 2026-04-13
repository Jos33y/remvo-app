import { useLocation, Outlet } from 'react-router';
import { useEffect, useRef, useState } from 'react';
import styles from '@styles/layout/checkout-shell.module.css';

/* Sits inside CheckoutShell. Watches location. On route change,
 * marks the outgoing screen .leaving, then swaps and marks the
 * incoming screen .entering. ~80 lines, pure CSS, no library.
 *
 * Total transition: 700ms (matches durFocusPull in motion.js). */
export function FocusPullOutlet() {
  const location = useLocation();
  const [displayed, setDisplayed] = useState(location);
  const [phase, setPhase] = useState('idle');
  const timer = useRef(null);

  useEffect(() => {
    if (location.pathname === displayed.pathname) return;
    setPhase('leaving');
    timer.current = setTimeout(() => {
      setDisplayed(location);
      setPhase('entering');
      timer.current = setTimeout(() => setPhase('idle'), 700);
    }, 350);
    return () => clearTimeout(timer.current);
  }, [location, displayed.pathname]);

  const cls =
    phase === 'leaving' ? styles.screenLeaving :
    phase === 'entering' ? styles.screenEntering : '';

  return (
    <div className={`${styles.focusOutlet} ${cls}`} key={displayed.pathname}>
      <Outlet />
    </div>
  );
}
