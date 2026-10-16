/* ──────────────────────────────────────────────────────────────────
 * lib/sellerTrail.js
 *
 * Which path sits at each place in this tab's history, so a back
 * button can tell whether the screen it names is the one the seller
 * just came from. When it is, the button goes back in history (and
 * the list comes back where it was scrolled); when it is not (a link
 * opened straight onto a listing), it opens that screen fresh.
 *
 * Positions come from react-router's own history index
 * (window.history.state.idx), so the browser's and the phone's back
 * and forward keep it right.
 * ────────────────────────────────────────────────────────────────── */

const trail = new Map();

const position = () => (typeof window !== 'undefined' ? window.history.state?.idx : undefined);

/** Called on every page change (SellerShell). */
export function note(pathname) {
  const idx = position();
  if (Number.isInteger(idx)) trail.set(idx, pathname);
}

/** True when the entry just behind this one in history is `pathname`. */
export function cameFrom(pathname) {
  const idx = position();
  return Number.isInteger(idx) && idx > 0 && trail.get(idx - 1) === pathname;
}
