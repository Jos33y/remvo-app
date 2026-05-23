import { useCallback, useEffect, useState } from 'react';
import {
  fetchCorridors,
  fetchCorridor,
  AuthApiError,
} from '@lib/authClient';

/* useCorridorsApi
 *
 * Dual-mode hook for the Corridors admin pages.
 *
 * Mock mode  | returns null. The caller falls through to useAdminData().
 * API mode   | fetches /v1/admin/corridors (list) or
 *              /v1/admin/corridors/:id (detail) and exposes the slices
 *              in the camelCase shape MockAdminProvider produces, so
 *              the existing JSX renders unchanged.
 *
 * Two entry points:
 *   useCorridorsListApi()       | for CorridorsPage
 *   useCorridorDetailApi(id)    | for CorridorDetailPage
 *
 * Refresh on window focus so an operator returning from the
 * merchants page sees fresh state. setData is exposed so mutation
 * handlers can splice fresh detail data after pause/unpause/flip
 * without a full re-fetch round trip. */

const IS_API_MODE = import.meta.env.VITE_REMVO_AUTH_MODE === 'api';

export function useCorridorsListApi() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(IS_API_MODE);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!IS_API_MODE) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchCorridors();
      setData(res);
    } catch (err) {
      if (err instanceof AuthApiError && err.status === 401) {
        setError({ status: 401, message: 'Session expired. Please sign in again.' });
        return;
      }
      setError({ status: err?.status || 0, message: err?.message || 'Could not load corridors.' });
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
    loading,
    error,
    corridors: data?.corridors || [],
    corridorMerchants: data?.corridorMerchants || [],
    refresh: load,
  };
}

export function useCorridorDetailApi(id) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(IS_API_MODE);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!IS_API_MODE) return;
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchCorridor(id);
      setData(res);
    } catch (err) {
      if (err instanceof AuthApiError && err.status === 401) {
        setError({ status: 401, message: 'Session expired. Please sign in again.' });
        return;
      }
      if (err?.status === 404) {
        setError({ status: 404, message: 'Corridor not found.' });
        return;
      }
      setError({ status: err?.status || 0, message: err?.message || 'Could not load corridor.' });
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
    loading,
    error,
    corridor: data?.corridors?.[0] || null,
    corridors: data?.corridors || [],
    corridorMerchants: data?.corridorMerchants || [],
    merchants: data?.merchants || [],
    auditLog: data?.auditLog || [],
    operators: data?.operators || [],
    refresh: load,
    setData,
  };
}
