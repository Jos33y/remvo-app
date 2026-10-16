import { Button } from '@components/ui/shared/Button';
import { ROUTES } from '@utils/constants';
import styles from '@styles/pages/marketing/not-found.module.css';

/* An address that is not on remvo.app: the same parcel back with a
 * "Return to sender" stamp as in the app, so the site and the app
 * say it the same way. */
export function NotFoundPage() {
  return (
    <section className={styles.container} aria-labelledby="nf-heading">
      <div className={styles.content}>
        <svg className={styles.art} viewBox="0 0 200 150" aria-hidden="true" focusable="false">
          <path d="M100 30 L160 58 L100 86 L40 58 Z" fill="currentColor" opacity="0.32" />
          <path d="M40 58 L100 86 L100 136 L40 108 Z" fill="currentColor" opacity="0.18" />
          <path d="M160 58 L100 86 L100 136 L160 108 Z" fill="currentColor" opacity="0.1" />
          <path d="M70 44 L130 72 L130 82 L70 54 Z" fill="currentColor" opacity="0.22" />
          <g className={styles.stamp} transform="rotate(-10 112 94)">
            <rect x="34" y="76" width="156" height="36" rx="4" fill="var(--night-0)" fillOpacity="0.55" stroke="currentColor" strokeWidth="2.5" />
            <rect x="38.5" y="80.5" width="147" height="27" rx="2" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.6" />
            <text x="112" y="98.5" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11" fontWeight="600" letterSpacing="1" fill="currentColor">RETURN TO SENDER</text>
          </g>
        </svg>
        <h1 id="nf-heading" className={styles.heading}>No such address</h1>
        <p className={styles.body}>
          This page is not on remvo.app. The link may be old, or mistyped.
        </p>
        <div className={styles.actions}>
          <Button href={ROUTES.HOME} variant="ivory">Go to the home page</Button>
          <Button href={ROUTES.HOW} variant="secondary">How it works</Button>
        </div>
      </div>
    </section>
  );
}
