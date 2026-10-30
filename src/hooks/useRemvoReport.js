/* ──────────────────────────────────────────────────────────────────
 * hooks/useRemvoReport.js (analytics1)
 *
 * One admin report for the current range: { data, loading, error,
 * reload }. Keeps the last answer on screen while the next loads, and
 * reads again when the operator comes back to the tab.
 * ────────────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchRemvo } from '@lib/remvoAdminApi';

export function useRemvoReport(path, { from, to, all = false } = {}) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const ctrl = useRef(null);

  const load = useCallback(() => {
    ctrl.current?.abort();
    const c = new AbortController();
    ctrl.current = c;
    setState((s) => ({ ...s, loading: true, error: null }));
    fetchRemvo(path, { from, to, all }, c.signal)
      .then((data) => { if (!c.signal.aborted) setState({ data, loading: false, error: null }); })
      .catch((err) => { if (err?.name !== 'AbortError') setState((s) => ({ ...s, loading: false, error: err })); });
  }, [path, from, to, all]);

  useEffect(() => {
    load();
    return () => ctrl.current?.abort();
  }, [load]);

  useEffect(() => {
    const onFocus = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onFocus);
    return () => document.removeEventListener('visibilitychange', onFocus);
  }, [load]);

  return { ...state, reload: load };
}
