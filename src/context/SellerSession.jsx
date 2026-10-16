import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { sellerApi } from '@lib/sellerApi';

/* ──────────────────────────────────────────────────────────────────
 * SellerSession
 *
 * Who is signed in to my.remvo.app. Asks the API once on load
 * (GET /v1/my/me); the cookie decides, never anything stored here.
 *
 *   status    'loading' | 'signedIn' | 'signedOut' | 'unreachable'
 *   account   { id, email, createdAt } or null
 *   signedIn(account)  after a link or code succeeds
 *   signOut()          clears the session on the server, then here
 *   retry()            after 'unreachable'
 *
 * 'unreachable' is kept apart from 'signedOut': a seller whose network
 * dropped should not be sent to the sign-in page as if they had been
 * signed out.
 * ────────────────────────────────────────────────────────────────── */

const SellerSessionContext = createContext(null);

export function SellerSessionProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', account: null });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, status: 'loading' }));
    try {
      const { account } = await sellerApi.me();
      setState({ status: 'signedIn', account });
    } catch (err) {
      setState({ status: err.status === 401 ? 'signedOut' : 'unreachable', account: null });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const signedIn = useCallback((account) => setState({ status: 'signedIn', account }), []);

  const signOut = useCallback(async () => {
    try { await sellerApi.signOut(); } finally {
      // left: they chose to go, so sign-in starts fresh, not back where they were.
      setState({ status: 'signedOut', account: null, left: true });
    }
  }, []);

  const value = useMemo(() => ({ ...state, signedIn, signOut, retry: load }), [state, signedIn, signOut, load]);
  return <SellerSessionContext.Provider value={value}>{children}</SellerSessionContext.Provider>;
}

export function useSellerSession() {
  const ctx = useContext(SellerSessionContext);
  if (!ctx) throw new Error('useSellerSession must be used inside SellerSessionProvider');
  return ctx;
}
