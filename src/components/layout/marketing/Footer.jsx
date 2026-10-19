import { Link } from 'react-router';
import { Logo } from '@components/ui/shared/Logo';
import { Postmark } from '@components/ui/marketing/Postmark';
import { ROUTES, BRAND } from '@utils/constants';
import styles from '@styles/layout/marketing/footer.module.css';

/* ──────────────────────────────────────────────────────────────────
 * Marketing footer (social1, redrawn)
 *
 *   REMVO  eBay listings, done for you.           [stamp][stamp][stamp]
 *          Made in Lagos for sellers everywhere.     postmarked LAGOS
 *   ─────────────────────────────────────────────────────────────────
 *   Product        Learn             Company            Legal
 *   How it works   Guides            Contact            Terms
 *   A real listing Help              support@remvo.app  Privacy
 *   Pricing        eBay fee calc     Remvo Labs Ltd     Refunds
 *   Credit terms   eBay UK fee calc  RC 9550568, Lagos
 *   ─────────────────────────────────────────────────────────────────
 *   Polar note                         Not eBay note
 *   © year Remvo Labs Limited
 *
 * Remvo's accounts elsewhere are postage stamps, as the guides are:
 * each in one of Remvo's inks with a small drawing of its own (a strip
 * of film, a photo, a thread), never the network's logo; the name and
 * handle in words. A postmark from Lagos cancels them, dated the day
 * the site was built. Every page above already ends with its own
 * action, so the footer sells with the line, not another button.
 * ────────────────────────────────────────────────────────────────── */

/* global __REMVO_BUILT_AT__ */
const BUILT = new Date(typeof __REMVO_BUILT_AT__ === 'number' ? __REMVO_BUILT_AT__ : Date.now()).toISOString().slice(0, 10);

/* The drawing on each stamp, by network. Our own pictures, in the stamp's ink. */
const ART = {
  YouTube: (
    <svg viewBox="0 0 64 40" aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="62" height="38" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {[6, 15, 24, 33, 42, 51].map((x) => <rect key={`t${x}`} x={x} y="4" width="5" height="3.5" rx="1" fill="currentColor" />)}
      {[6, 15, 24, 33, 42, 51].map((x) => <rect key={`b${x}`} x={x} y="32.5" width="5" height="3.5" rx="1" fill="currentColor" />)}
      <rect x="5" y="10.5" width="54" height="19" rx="1.5" fill="currentColor" opacity="0.22" />
      <path d="M28 14.5v11l9-5.5z" fill="currentColor" />
    </svg>
  ),
  Instagram: (
    <svg viewBox="0 0 64 40" aria-hidden="true" focusable="false">
      <rect x="13" y="2" width="38" height="36" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <rect x="17" y="6" width="30" height="22" fill="currentColor" opacity="0.22" />
      <path d="M17 28l9-9 6 6 4-4 11 7z" fill="currentColor" opacity="0.7" />
      <circle cx="41" cy="12" r="2.5" fill="currentColor" />
      <rect x="17" y="31.5" width="16" height="2" rx="1" fill="currentColor" opacity="0.6" />
    </svg>
  ),
  Threads: (
    <svg viewBox="0 0 64 40" aria-hidden="true" focusable="false">
      <path d="M4 30c8 0 10-20 20-20s8 16 0 16-6-12 6-12 12 10 30 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="4" cy="30" r="2.2" fill="currentColor" />
      <path d="M57 18l3 2-3 2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

const INK = { YouTube: 'claret', Instagram: 'lapis', Threads: 'pine' };

const handle = (url) => `@${url.replace(/\/+$/, '').split('/').pop().replace(/^@/, '')}`;

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { to: ROUTES.HOW, label: 'How it works' },
      { to: ROUTES.EXAMPLE, label: 'A real listing' },
      { to: ROUTES.PRICING, label: 'Pricing' },
      { to: ROUTES.CREDITS, label: 'Credit terms' },
    ],
  },
  {
    title: 'Learn',
    links: [
      { to: ROUTES.GUIDES, label: 'Guides' },
      { to: ROUTES.HELP, label: 'Help' },
      { to: ROUTES.FEES_US, label: 'eBay fee calculator' },
      { to: ROUTES.FEES_UK, label: 'eBay UK fee calculator' },
    ],
  },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={styles.inner}>
        <div className={styles.top}>
          <div className={styles.signoff}>
            <Logo variant="gold" size="default" />
            <p className={styles.line}>eBay listings, done for you.</p>
            <p className={styles.lineSub}>Made in Lagos, for sellers everywhere.</p>
          </div>

          <nav className={styles.follow} aria-labelledby="footer-follow">
            <h2 id="footer-follow" className={styles.colTitle}>Follow Remvo</h2>
            <ul className={styles.stamps}>
              {BRAND.SOCIAL.map((s) => (
                <li key={s.name} className={`${styles.stamp} ${styles.perforated}`} data-ink={INK[s.name]}>
                  <div className={styles.stampFace}>
                    <span className={styles.stampArt}>{ART[s.name]}</span>
                    <a href={s.url} className={styles.stampName} target="_blank" rel="noopener me">
                      {s.name}<span className="sr-only">, {handle(s.url)} (opens in a new tab)</span>
                    </a>
                    <span className={styles.stampHandle} aria-hidden="true">{handle(s.url)}</span>
                  </div>
                </li>
              ))}
            </ul>
            <Postmark className={styles.postmark} top="REMVO LABS" bottom="LAGOS" iso={BUILT} />
          </nav>
        </div>

        <div className={styles.grid}>
          {COLUMNS.map((col) => (
            <div key={col.title} className={styles.col}>
              <h2 className={styles.colTitle}>{col.title}</h2>
              <nav aria-label={`${col.title} links`}>
                {col.links.map((l) => <Link key={l.to} to={l.to} className={styles.colLink}>{l.label}</Link>)}
              </nav>
            </div>
          ))}

          <div className={styles.col}>
            <h2 className={styles.colTitle}>Company</h2>
            <Link to={ROUTES.CONTACT} className={styles.colLink}>Contact</Link>
            <a href={`mailto:${BRAND.EMAIL}`} className={styles.colLink}>{BRAND.EMAIL}</a>
            <p className={styles.companyName}>{BRAND.LEGAL_NAME}</p>
            <p className={styles.companyMeta}>RC {BRAND.RC_NUMBER}, Lagos, Nigeria</p>
          </div>

          <div className={styles.col}>
            <h2 className={styles.colTitle}>Legal</h2>
            <nav aria-label="Legal links">
              <Link to={ROUTES.TERMS} className={styles.colLink}>Terms of service</Link>
              <Link to={ROUTES.PRIVACY} className={styles.colLink}>Privacy policy</Link>
              <Link to={ROUTES.REFUNDS} className={styles.colLink}>Refund policy</Link>
            </nav>
          </div>
        </div>

        <div className={styles.notes}>
          <p className={styles.note}>
            Payments are processed by Polar, our merchant of record. Polar
            handles the sale, the receipt and any VAT or sales tax.
          </p>
          <p className={styles.note}>
            {BRAND.NAME} is independent software for eBay sellers. It is not
            made, endorsed or approved by eBay or Amazon.
          </p>
        </div>

        <p className={styles.copy}>&copy; {year} {BRAND.LEGAL_NAME}</p>
      </div>
    </footer>
  );
}
