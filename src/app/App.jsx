import { Suspense, lazy, useEffect } from 'react';

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

/* Signals main.jsx that the lazy chunk has mounted, so the
 * app-loader element in index.html can fade out. Lives inside the
 * Suspense boundary so its useEffect fires only AFTER the chunk
 * resolves and renders real content. main.jsx coordinates this
 * with the fonts.ready signal so the loader dismisses only when
 * BOTH conditions are met. */
function LoaderDismisser() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      typeof window.__remvoSignalAppMounted === 'function'
    ) {
      window.__remvoSignalAppMounted();
    }
  }, []);
  return null;
}

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

export function App() {
  let routerChunk;
  if (isAdminHost()) {
    routerChunk = <AdminApp />;
  } else if (isCheckoutHost()) {
    routerChunk = <CheckoutApp />;
  } else if (isSellerHost()) {
    routerChunk = <SellerApp />;
  } else {
    routerChunk = <MarketingApp />;
  }

  return (
    <Suspense fallback={null}>
      <LoaderDismisser />
      {routerChunk}
    </Suspense>
  );
}
