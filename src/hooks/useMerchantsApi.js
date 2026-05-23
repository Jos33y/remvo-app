import { useCallback, useEffect, useState } from 'react';
import {
  fetchMerchants,
  fetchMerchant,
  AuthApiError,
} from '@lib/authClient';

/* useMerchantsApi
 *
 * Dual-mode hook for the Merchants admin pages.
 *
 * Mock mode  | returns null. The caller falls through to useAdminData().
 * API mode   | fetches /v1/admin/merchants (list) or /v1/admin/merchants/:id
 *              (detail) and exposes the slice in the camelCase shape
 *              MockAdminProvider produces, so the existing JSX renders
 *              unchanged.
 *
 * Two entry points:
 *   useMerchantsListApi()       | for MerchantsPage
 *   useMerchantDetailApi(id)    | for MerchantDetailPage
 *
 * Refresh on window focus so an operator returning from Infisical or
 * the corridors page sees fresh stats. The setData function is exposed
 * so mutation handlers can splice fresh detail data after a successful
 * pause / unpause / disable without a full re-fetch round trip. */

const IS_API_MODE = import.meta.env.VITE_REMVO_AUTH_MODE === 'api';

export function useMerchantsListApi() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(IS_API_MODE);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!IS_API_MODE) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchMerchants();
      setData(res);
    } catch (err) {
      if (err instanceof AuthApiError && err.status === 401) {
        setError({ status: 401, message: 'Session expired. Please sign in again.' });
        return;
      }
      setError({ status: err?.status || 0, message: err?.message || 'Could not load merchants.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!IS_API_MODE) return undefined;
    function onFocus() { load(); }
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [load]);

  if (!IS_API_MODE) return null;

  return {
    isApiMode: true,
    merchants: data?.merchants || [],
    corridorMerchants: data?.corridorMerchants || [],
    loading,
    error,
    refresh: load,
  };
}

export function useMerchantDetailApi(id) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(IS_API_MODE);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!IS_API_MODE || !id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchMerchant(id);
      setData(res);
    } catch (err) {
      if (err instanceof AuthApiError && err.status === 404) {
        setData({ merchants: [], corridorMerchants: [], corridors: [], auditLog: [], operators: [] });
        return;
      }
      if (err instanceof AuthApiError && err.status === 401) {
        setError({ status: 401, message: 'Session expired. Please sign in again.' });
        return;
      }
      setError({ status: err?.status || 0, message: err?.message || 'Could not load merchant.' });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!IS_API_MODE) return undefined;
    function onFocus() { load(); }
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [load]);

  if (!IS_API_MODE) return null;

  return {
    isApiMode: true,
    merchants: data?.merchants || [],
    corridorMerchants: data?.corridorMerchants || [],
    corridors: data?.corridors || [],
    auditLog: data?.auditLog || [],
    operators: data?.operators || [],
    loading,
    error,
    refresh: load,
    /* Used by mutation handlers to splice fresh detail data after
     * a successful action. The pause / unpause / disable endpoints
     * return the same detail shape, so we can replace state directly. */
    applyDetail: setData,
  };
}
