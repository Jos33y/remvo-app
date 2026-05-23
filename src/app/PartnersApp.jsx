import { RouterProvider } from 'react-router';
import { partnersRouter } from './partnersRouter';

/* Partners chunk entry point. Lazy-loaded by App.jsx on the
 * partners.remvo.app hostname (or ?partners in dev).
 *
 * All partners-page copy (USDT, Solana, wallet, settlement) lives
 * inside this chunk and never ships to the marketing host. */
export default function PartnersApp() {
  return <RouterProvider router={partnersRouter} />;
}
