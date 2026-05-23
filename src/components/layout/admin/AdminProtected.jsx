import { Navigate, Outlet, useLocation } from 'react-router';
import { adminPath } from '@app/adminRouter';
import { useOperatorSession } from '@context/AdminContext';

/* ──────────────────────────────────────────────────────────────────
 * AdminProtected
 *
 * Layout route gate. Reads the operator from useOperatorSession()
 * rather than directly from localStorage — the provider is the
 * single source of truth for session state.
 *
 * Boot ordering matters in API mode: on a fresh page load, /me
 * hasn't resolved yet. Without the bootStatus check, we'd briefly
 * render the redirect to /login, dropping the deep-link state, then
 * /me resolves and the user is signed in but on the wrong page.
 *
 * The boot guard renders nothing until the provider has answered the
 * /me probe once. AdminShell isn't mounted yet (we haven't passed
 * through the Outlet), so the user sees only the obsidian background
 * for the ~50ms it takes for the API call. Acceptable.
 *
 * In local mode bootStatus is 'ready' immediately on mount so this
 * branch is a no-op for the dev-escape path.
 * ────────────────────────────────────────────────────────────────── */

export function AdminProtected() {
  const location = useLocation();
  const { operator, bootStatus } = useOperatorSession();

  // Don't redirect while we're still establishing whether a session
  // cookie exists. In API mode, this prevents a flash of /login on
  // hard refresh of any deep link.
  if (bootStatus === 'loading') {
    return null;
  }

  if (!operator) {
    return (
      <Navigate
        to={adminPath('/login')}
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  return <Outlet />;
}
