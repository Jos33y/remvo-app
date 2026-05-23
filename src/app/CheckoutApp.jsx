import { RouterProvider } from 'react-router';
import { checkoutRouter } from './checkoutRouter';

/* Checkout chunk entry point. Lazy-loaded by App.jsx on the
 * pay.remvo.app hostname (or ?checkout in dev). */
export default function CheckoutApp() {
  return <RouterProvider router={checkoutRouter} />;
}
