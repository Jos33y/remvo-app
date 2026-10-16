import { Link } from 'react-router';
import { SELLER_ROUTES } from '@utils/constants';
import s from '@styles/pages/seller/app.module.css';
import n from '@styles/ui/seller/not-here.module.css';

/* ──────────────────────────────────────────────────────────────────
 * NotHere
 *
 * What a seller sees where something is missing: an address that is
 * not in Remvo, a listing deleted or past its 90 days. A parcel back
 * with a "Return to sender" stamp across it, in oxide; one plain line
 * of why, and the way back. Drawn in the app's own isometric style.
 * ────────────────────────────────────────────────────────────────── */

export function NotHere({ title, text, heading = 'h2', home = true }) {
  const H = heading;
  return (
    <div className={n.wrap}>
      <svg className={n.art} viewBox="0 0 200 150" aria-hidden="true" focusable="false">
        {/* The parcel */}
        <path d="M100 30 L160 58 L100 86 L40 58 Z" fill="currentColor" opacity="0.32" />
        <path d="M40 58 L100 86 L100 136 L40 108 Z" fill="currentColor" opacity="0.18" />
        <path d="M160 58 L100 86 L100 136 L160 108 Z" fill="currentColor" opacity="0.1" />
        <path d="M70 44 L130 72 L130 82 L70 54 Z" fill="currentColor" opacity="0.22" />
        {/* The stamp */}
        <g className={n.stamp} transform="rotate(-10 112 94)">
          <rect x="34" y="76" width="156" height="36" rx="4" fill="var(--night-0)" fillOpacity="0.55" stroke="currentColor" strokeWidth="2.5" />
          <rect x="38.5" y="80.5" width="147" height="27" rx="2" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.6" />
          <text x="112" y="98.5" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11" fontWeight="600" letterSpacing="1" fill="currentColor">RETURN TO SENDER</text>
        </g>
      </svg>
      <H className={n.title}>{title}</H>
      <p className={n.text}>{text}</p>
      {home && (
        <div className={n.actions}>
          <Link to={SELLER_ROUTES.HOME} className={`${s.button} ${s.primary}`}>Go to Home</Link>
          <Link to={SELLER_ROUTES.LISTINGS} className={`${s.button} ${s.secondary}`}>Your listings</Link>
        </div>
      )}
    </div>
  );
}
