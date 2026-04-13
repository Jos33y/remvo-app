import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router';

/**
 * Navigation helper that preserves the current query string on every
 * navigate call. Exists because the `?checkout` dev escape in App.jsx
 * must survive across route transitions; without it, a navigate from
 * `/cs_test_preset/pay?checkout` to `/cs_test_preset/complete` strips
 * the query string and the marketing router takes over on the next
 * render.
 *
 * In production there is no query string, so preserving it is a no-op.
 *
 * Usage:
 *   const checkoutNavigate = useCheckoutNavigate();
 *   checkoutNavigate(`/${token}/pay`);
 *   checkoutNavigate(`/${token}/complete`, { replace: true });
 *
 * @returns {(pathname: string, options?: { replace?: boolean }) => void}
 */
export function useCheckoutNavigate() {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(
    (pathname, options = {}) => {
      navigate(
        { pathname, search: location.search },
        options
      );
    },
    [navigate, location.search]
  );
}
