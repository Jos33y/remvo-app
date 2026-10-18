import { Suspense, lazy } from 'react';
import { LoaderDismisser } from './LoaderDismisser';

/* ──────────────────────────────────────────────────────────────────
 * Hostname-based router selection + per-host code splitting.
 *
 * Each router tree is wrapped in its own *App.jsx component and
 * lazy-loaded so Vite/Rollup emits a separate chunk per host:
 *
 *   dist/assets/MarketingApp-{hash}.js  | remvo.app
 *   dist/assets/SellerApp-{hash}.js     | my.remvo.app (seller sign-in and account)
 *   dist/assets/CheckoutApp-{hash}.js   | pay.remvo.app (paused corridor)
 *   dist/assets/AdminApp-{hash}.js      | admin.remvo.app (paused corridor)
 *
 * A visitor only downloads the chunk that matches their hostname, so
 * the marketing chunk carries nothing from the paused corridor.
 *
 * partners.remvo.app was removed on 9 October 2026. Its host now
 * falls through to the marketing site until its DNS record goes.
 *
 * Dev escapes (?checkout, ?admin, ?my) still work because the
 * branch is selected before Suspense; Vite's dev server serves
 * lazy() imports the same way as production but without the chunk
 * split (modules stream on demand). No /etc/hosts required.
 *
 * The order of checks is admin -> checkout -> seller -> marketing
 * fallback. The
 * production hostname check always wins over any dev gate.
 * ────────────────────────────────────────────────────────────────── */

const MarketingApp = lazy(() => import('./MarketingApp'));
const CheckoutApp  = lazy(() => import('./CheckoutApp'));
const AdminApp     = lazy(() => import('./AdminApp'));
const SellerApp    = lazy(() => import('./SellerApp'));

function isAdminHost() {
  if (typeof window === 'undefined') return false;

  const host = window.location.hostname;
  if (host.startsWith('admin.')) return true;

  if (
    import.meta.env.DEV &&
    new URLSearchParams(window.location.search).has('admin')
  ) {
    return true;
  }

  return false;
}

function isCheckoutHost() {
  if (typeof window === 'undefined') return false;

  const host = window.location.hostname;
  if (host.startsWith('pay.')) return true;

  if (
    import.meta.env.DEV &&
    new URLSearchParams(window.location.search).has('checkout')
  ) {
    return true;
  }

  return false;
}

/* The seller app, my.remvo.app. In dev, ?my turns it on for this
 * browser and ?site turns it off again. It is remembered (localStorage)
 * rather than read once, because the sign-in email's link opens a new
 * tab at /sign-in/verify with no query string. */
const DEV_HOST_KEY = 'remvo.devHost';

function isSellerHost() {
  if (typeof window === 'undefined') return false;

  // A build for the phone app (Capacitor) is only ever the seller app:
  // inside the app the address is capacitor://localhost, not my.remvo.app.
  if (import.meta.env.VITE_APP_TARGET === 'seller') return true;

  if (window.location.hostname.startsWith('my.')) return true;

  if (import.meta.env.DEV) {
    const params = new URLSearchParams(window.location.search);
    try {
      if (params.has('my')) window.localStorage.setItem(DEV_HOST_KEY, 'my');
      if (params.has('site')) window.localStorage.removeItem(DEV_HOST_KEY);
      return window.localStorage.getItem(DEV_HOST_KEY) === 'my';
    } catch {
      return params.has('my');
    }
  }

  return false;
}

/** Which app this host runs: 'admin' | 'checkout' | 'seller' | 'marketing'. */
export function hostApp() {
  if (isAdminHost()) return 'admin';
  if (isCheckoutHost()) return 'checkout';
  if (isSellerHost()) return 'seller';
  return 'marketing';
}

const APPS = { admin: AdminApp, checkout: CheckoutApp, seller: SellerApp, marketing: MarketingApp };

/* tidy1: on my.remvo.app, anywhere but the signed-out pages, fetch the
 * signed-in screens alongside the seller app rather than after it, so
 * opening Home or a listing costs no extra wait. */
const SIGNED_OUT = /^\/(sign-in|sign-up|emails-off)(\/|$)/;
if (typeof window !== 'undefined' && hostApp() === 'seller' && !SIGNED_OUT.test(window.location.pathname)) {
  import('./loadSellerPages').then((m) => m.loadSellerPages()).catch(() => {});
}

export function App() {
  const Chosen = APPS[hostApp()];
  const routerChunk = <Chosen />;

  return (
    <Suspense fallback={null}>
      <LoaderDismisser />
      {routerChunk}
    </Suspense>
  );
}
