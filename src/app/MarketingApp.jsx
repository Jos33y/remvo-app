import { RouterProvider } from 'react-router';
import { router } from './router';

/* Marketing chunk entry point. Lazy-loaded by App.jsx on the
 * remvo.app hostname. Kept behind a default export so Vite splits it
 * into its own chunk, apart from the checkout and admin trees. */
export default function MarketingApp() {
  return <RouterProvider router={router} />;
}
