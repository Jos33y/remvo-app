import { RouterProvider } from 'react-router';
import { router as marketingRouter } from './router';
import { checkoutRouter } from './checkoutRouter';

/**
 * Hostname-based router selection.
 *
 * In production, pay.remvo.app and remvo.app share a single deployment.
 * The host prefix determines which router tree mounts. Decision is made
 * once at mount, never re-evaluated, so navigation cost is zero.
 *
 * The dev escape (?checkout) lets us preview the checkout tree from
 * localhost without touching /etc/hosts. Vite tree-shakes the entire
 * branch out of production builds via import.meta.env.DEV, so this
 * cannot be triggered on remvo.app or pay.remvo.app even if a query
 * param is appended.
 */
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
  const router = isCheckoutHost() ? checkoutRouter : marketingRouter;
  return <RouterProvider router={router} />;
}
