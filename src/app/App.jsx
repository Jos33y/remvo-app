import { Suspense, lazy, useEffect } from 'react';

/* ──────────────────────────────────────────────────────────────────
 * Hostname-based router selection + per-host code splitting.
 *
 * Each router tree is wrapped in its own *App.jsx component and
 * lazy-loaded so Vite/Rollup emits a separate chunk per host:
 *
 *   dist/assets/MarketingApp-{hash}.js  | remvo.app
 *   dist/assets/CheckoutApp-{hash}.js   | pay.remvo.app (paused corridor)
 *   dist/assets/AdminApp-{hash}.js      | admin.remvo.app (paused corridor)
 *
 * A visitor only downloads the chunk that matches their hostname, so
 * the marketing chunk carries nothing from the paused corridor.
 *
 * partners.remvo.app was removed on 9 October 2026. Its host now
 * falls through to the marketing site until its DNS record goes.
 *
 * Dev escapes (?checkout, ?admin) still work because the
 * branch is selected before Suspense; Vite's dev server serves
 * lazy() imports the same way as production but without the chunk
 * split (modules stream on demand). No /etc/hosts required.
 *
 * The order of checks (admin -> checkout -> marketing fallback) is
 * unchanged from the pre-split implementation. The
 * production hostname check always wins over any dev gate.
 * ────────────────────────────────────────────────────────────────── */

const MarketingApp = lazy(() => import('./MarketingApp'));
const CheckoutApp  = lazy(() => import('./CheckoutApp'));
const AdminApp     = lazy(() => import('./AdminApp'));

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

export function App() {
  let routerChunk;
  if (isAdminHost()) {
    routerChunk = <AdminApp />;
  } else if (isCheckoutHost()) {
    routerChunk = <CheckoutApp />;
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
