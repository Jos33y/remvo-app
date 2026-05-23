import { createBrowserRouter, Navigate, Outlet, useParams } from 'react-router';
import { MockSessionProvider } from '@context/MockSessionProvider';
import { ApiSessionProvider } from '@context/ApiSessionProvider';
import { IS_CHECKOUT_API } from '@lib/checkoutMode';
import { SessionResolver } from '@pages/checkout/SessionResolver';
import { PaymentPage } from '@pages/checkout/PaymentPage';
import { LandingPage } from '@pages/checkout/LandingPage';

/* ──────────────────────────────────────────────────────────────────
 * Checkout Router
 *
 * /                  -> LandingPage  (no session, brand presence)
 * /:token            -> SessionResolver (routes by status)
 * /:token/pay        -> PaymentPage    (payment window lifecycle)
 * /:token/complete   -> SessionResolver (post-payment routing)
 * *                  -> redirect to /
 *
 * PHASE_7F_S5_CHECKOUT_API
 *
 * SessionProviderLayout wraps every token-scoped route in a session
 * provider so each token has its own session lifecycle. LandingPage
 * is unwrapped because it has no session.
 *
 * The provider is chosen ONCE at module load by IS_CHECKOUT_API:
 *   api    -> ApiSessionProvider   | resolves + polls the real
 *             backend (GET /v1/checkout/session/:id)
 *   else   -> MockSessionProvider  | the in-browser ?checkout dev
 *             escape, unchanged
 * Both satisfy the same SessionContext, so every page below is
 * provider-agnostic. See src/lib/checkoutMode.js.
 *
 * The /:token element stays mounted across the index <-> /pay <->
 * /complete child routes, so the provider (and its poll) persists
 * seamlessly through the checkout walk. Only a different :token
 * remounts it.
 * ────────────────────────────────────────────────────────────────── */

const SessionProvider = IS_CHECKOUT_API
  ? ApiSessionProvider
  : MockSessionProvider;

function SessionProviderLayout() {
  const { token } = useParams();
  return (
    <SessionProvider token={token}>
      <Outlet />
    </SessionProvider>
  );
}

export const checkoutRouter = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/:token',
    element: <SessionProviderLayout />,
    children: [
      { index: true, element: <SessionResolver /> },
      { path: 'pay', element: <PaymentPage /> },
      { path: 'complete', element: <SessionResolver /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
