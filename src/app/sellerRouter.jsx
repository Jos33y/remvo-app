import { createBrowserRouter, Navigate, Outlet, ScrollRestoration } from 'react-router';
import { SellerSessionProvider } from '@context/SellerSession';
import { SignInPage } from '@pages/seller/SignInPage';
import { VerifyLinkPage } from '@pages/seller/VerifyLinkPage';
import { SetPasswordPage } from '@pages/seller/SetPasswordPage';
import { EmailsOffPage } from '@pages/seller/EmailsOffPage';
import { SELLER_ROUTES } from '@utils/constants';
import { loadSellerPages, sellerPages } from './loadSellerPages';

/* tidy1: every screen behind sign-in comes from one chunk, fetched the
 * first time one is shown (or in the background from the sign-in page).
 * Until it is in, a screen suspends once; after, every screen renders
 * straight from it, with no waiting between them. SellerApp waits for
 * it before the first render on a signed-in address, so a deep link
 * shows its screen in one go. */
const screen = (name) => {
  function Screen(props) {
    const pages = sellerPages();
    if (!pages) throw loadSellerPages();
    const C = pages[name];
    return <C {...props} />;
  }
  Screen.displayName = name;
  return Screen;
};
const RequireSeller = screen('RequireSeller');
const SellerShell = screen('SellerShell');
const SellerHomePage = screen('SellerHomePage');
const ListingsPage = screen('ListingsPage');
const NewListingPage = screen('NewListingPage');
const ListingPage = screen('ListingPage');
const BulkPage = screen('BulkPage');
const WorldPage = screen('WorldPage');
const BatchPage = screen('BatchPage');
const CreditsPage = screen('CreditsPage');
const ProfilePage = screen('ProfilePage');
const SupportPage = screen('SupportPage');
const SellerNotFoundPage = screen('SellerNotFoundPage');

/* Seller router for my.remvo.app.
 *
 *   /sign-in, /sign-up           signed out: password, passkey, or open an account
 *   /sign-in/verify              the confirm-your-email link
 *   /sign-in/password            the set-or-reset-password link
 *   /                            Home: balance, make a listing, recent
 *   /listings                    every listing, filter and search
 *   /listings/new                making one (covers the tabs)
 *   /listings/:id                one listing, field by field (covers the tabs)
 *   /listings/bulk               many at once: paste a column or upload a CSV (covers the tabs)
 *   /batches/:id                 a bulk run: progress, lines, the eBay file (covers the tabs)
 *   /credits                     balance, top-up, history
 *   /profile                     account, help, legal, sign out, delete
 *   /emails-off                  turn Joseph's emails off from the link in one (no sign-in)
 *   /billing                     the marketing site's Top up: credits with the sheet open
 *
 * Scroll: a new screen opens at its top; going back (the browser's,
 * the phone's, or a back button to the screen just left) returns to
 * where that screen was scrolled. ScrollRestoration does both.
 */
/* Made when the seller app first renders (tidy1). */
export const makeSellerRouter = () => createBrowserRouter([
  {
    element: (
      <SellerSessionProvider>
        <ScrollRestoration />
        <Outlet />
      </SellerSessionProvider>
    ),
    children: [
      { path: SELLER_ROUTES.SIGN_IN, element: <SignInPage /> },
      { path: SELLER_ROUTES.SIGN_UP, element: <SignInPage /> },
      { path: SELLER_ROUTES.VERIFY, element: <VerifyLinkPage /> },
      { path: SELLER_ROUTES.SET_PASSWORD, element: <SetPasswordPage /> },
      // emails1: the link in Joseph's emails; no sign-in needed.
      { path: SELLER_ROUTES.EMAILS_OFF, element: <EmailsOffPage /> },
      {
        element: <RequireSeller />,
        children: [
          {
            element: <SellerShell />,
            children: [
              { path: SELLER_ROUTES.HOME, element: <SellerHomePage /> },
              { path: SELLER_ROUTES.LISTINGS, element: <ListingsPage /> },
              { path: SELLER_ROUTES.NEW_LISTING, element: <NewListingPage /> },
              { path: SELLER_ROUTES.BULK, element: <BulkPage /> },
              { path: SELLER_ROUTES.LISTING, element: <ListingPage /> },
              { path: SELLER_ROUTES.BATCH, element: <BatchPage /> },
              { path: SELLER_ROUTES.WORLD, element: <WorldPage /> },
              { path: SELLER_ROUTES.CREDITS, element: <CreditsPage /> },
              { path: SELLER_ROUTES.PROFILE, element: <ProfilePage /> },
              { path: SELLER_ROUTES.SUPPORT, element: <SupportPage /> },
              { path: SELLER_ROUTES.BILLING, element: <Navigate to={`${SELLER_ROUTES.CREDITS}?topup=1`} replace /> },
              // Not in Remvo: inside the app, so the tabs are still there.
              { path: '*', element: <SellerNotFoundPage /> },
            ],
          },
        ],
      },
    ],
  },
]);
