/* tidy1: the one way the signed-in screens are loaded, shared by the
 * app (on a signed-in address), the router (when a screen needs them)
 * and the sign-in page (in the background, once it has painted). One
 * fetch; once in, the screens are read straight from here. */
let pages = null;
let pending = null;

export const loadSellerPages = () => (pages
  ? Promise.resolve(pages)
  : (pending ??= import('./sellerPages').then((m) => { pages = m; return m; }, (err) => { pending = null; throw err; })));

/** The loaded screens, or null until they are in. */
export const sellerPages = () => pages;
