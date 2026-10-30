import { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './router';
import { startHits } from '@lib/hits';

/* Marketing chunk entry point. Lazy-loaded by App.jsx on the
 * remvo.app hostname. Kept behind a default export so Vite splits it
 * into its own chunk, apart from the checkout and admin trees. */
export default function MarketingApp() {
  // analytics1: Remvo's own page views, no cookies (lib/hits.js).
  useEffect(() => startHits('site', router), []);
  return <RouterProvider router={router} />;
}
