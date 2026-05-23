import { Suspense, lazy, useEffect } from 'react';

/* ──────────────────────────────────────────────────────────────────
 * Hostname-based router selection + per-host code splitting.
 *
 * Each router tree is wrapped in its own *App.jsx component and
 * lazy-loaded so Vite/Rollup emits four separate chunks:
 *
 *   dist/assets/MarketingApp-{hash}.js  | remvo.app
 *   dist/assets/CheckoutApp-{hash}.js   | pay.remvo.app
 *   dist/assets/AdminApp-{hash}.js      | admin.remvo.app
 *   dist/assets/PartnersApp-{hash}.js   | partners.remvo.app
 *
 * A visitor only downloads the chunk that matches their hostname.
 * Grepping the JS served from remvo.app returns the marketing chunk
 * alone, which contains zero references to partner / settlement /
 * admin vocabulary by construction.
 *
 * Dev escapes (?checkout, ?admin, ?partners) still work because the
 * branch is selected before Suspense; Vite's dev server serves
 * lazy() imports the same way as production but without the chunk
 * split (modules stream on demand). No /etc/hosts required.
 *
 * The order of checks (admin -> checkout -> partners -> marketing
 * fallback) is unchanged from the pre-split implementation. The
 * production hostname check always wins over any dev gate.
 * ────────────────────────────────────────────────────────────────── */

const MarketingApp = lazy(() => import('./MarketingApp'));
const CheckoutApp  = lazy(() => import('./CheckoutApp'));
const AdminApp     = lazy(() => import('./AdminApp'));
const PartnersApp  = lazy(() => import('./PartnersApp'));

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

function isPartnersHost() {
  if (typeof window === 'undefined') return false;

  const host = window.location.hostname;
  if (host.startsWith('partners.')) return true;

  if (
    import.meta.env.DEV &&
    new URLSearchParams(window.location.search).has('partners')
  ) {
    return true;
  }

  return false;
}

export function App() {
  let routerChunk;
  if (isAdminHost()) {
    routerChunk = <AdminApp />;
  } else if (isCheckoutHost()) {
    routerChunk = <CheckoutApp />;
  } else if (isPartnersHost()) {
    routerChunk = <PartnersApp />;
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
