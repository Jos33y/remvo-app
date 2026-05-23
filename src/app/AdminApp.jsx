import { RouterProvider } from 'react-router';
import { adminRouter } from './adminRouter';
import { MockAdminProvider } from '@context/MockAdminProvider';
import { ToastProvider } from '@components/ui/admin/ToastProvider';

/* Admin chunk entry point. Lazy-loaded by App.jsx on the
 * admin.remvo.app hostname (or ?admin in dev).
 *
 * ToastProvider + MockAdminProvider live inside the lazy chunk so
 * they aren't pulled into the marketing bundle just to satisfy a
 * top-level import. Phase 7 swaps MockAdminProvider for the real
 * API-backed provider; no consumer changes required. */
export default function AdminApp() {
  return (
    <ToastProvider>
      <MockAdminProvider>
        <RouterProvider router={adminRouter} />
      </MockAdminProvider>
    </ToastProvider>
  );
}
