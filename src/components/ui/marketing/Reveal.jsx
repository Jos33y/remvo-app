/* Reveal
 *
 * Until site1 (October 2026) every marketing section rose into view as
 * it was scrolled to. The site now has one moment only, the real
 * listing arriving in the home page's hero, so sections simply sit
 * where they are: in the HTML, to Google, and on every screen. Kept as
 * a plain wrapper so the pages that use it need no change.
 */
export function Reveal({ children, className }) {
  return className ? <div className={className}>{children}</div> : <div>{children}</div>;
}
