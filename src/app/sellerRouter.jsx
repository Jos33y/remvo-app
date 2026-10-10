import { createBrowserRouter, Outlet } from 'react-router';
import { SellerSessionProvider } from '@context/SellerSession';
import { RequireSeller } from '@components/layout/seller/RequireSeller';
import { SellerShell } from '@components/layout/seller/SellerShell';
import { SignInPage } from '@pages/seller/SignInPage';
import { VerifyLinkPage } from '@pages/seller/VerifyLinkPage';
import { SellerHomePage } from '@pages/seller/SellerHomePage';
import { SellerNotFoundPage } from '@pages/seller/SellerNotFoundPage';
import { SELLER_ROUTES } from '@utils/constants';

/* Seller router for my.remvo.app.
 *
 *   /sign-in          email, then the code
 *   /sign-in/verify   where the emailed link lands (#t=token)
 *   /                 signed-in home; the dashboard grows here
 *
 * The session provider sits above every route so the sign-in pages
 * can send an already signed-in seller straight home.
 */
export const sellerRouter = createBrowserRouter([
  {
    element: (
      <SellerSessionProvider>
        <Outlet />
      </SellerSessionProvider>
    ),
    children: [
      { path: SELLER_ROUTES.SIGN_IN, element: <SignInPage /> },
      { path: SELLER_ROUTES.VERIFY, element: <VerifyLinkPage /> },
      {
        element: <RequireSeller />,
        children: [
          {
            element: <SellerShell />,
            children: [{ path: SELLER_ROUTES.HOME, element: <SellerHomePage /> }],
          },
        ],
      },
      { path: '*', element: <SellerNotFoundPage /> },
    ],
  },
]);
