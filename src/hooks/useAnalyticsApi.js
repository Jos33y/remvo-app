/* ──────────────────────────────────────────────────────────────────
 * useAnalyticsApi
 *
 * PHASE_7F_S3_ANALYTICS_API
 *
 * Dual-mode hooks for the analytics screens, mirroring the
 * useMerchantsApi / useCorridorsApi pattern exactly.
 *
 *   Mock mode | hook returns null. Caller falls through to
 *               useAdminData().events for the events list, or to a
 *               sensible default for availability.
 *
 *   API mode  | hook fetches the real endpoints introduced in
 *               Phase 7F Session 2.
 *
 * Two entry points:
 *   useAnalyticsEvents({ from, to, platformId?, countryCode? })
 *     | for the three Analytics pages. Returns events list shaped
 *       identically to MockAdminProvider's events slice, so the
 *       existing compute functions (computeOverview, computeFunnel,
 *       computePlatformRollup, computeTrend) render unchanged.
 *
 *   useAnalyticsAvailability()
 *     | for AdminSidebar + AdminDrawer + LaunchTogglesSection. Used
 *       to gate the Analytics + Withdrawals nav links on the
 *       backend's analytics_enabled / withdrawals_enabled toggles.
 *
 * Refresh on window focus so an operator returning from another tab
 * sees fresh data. Identical pattern to useMerchantsApi.js.
 *
 * Range inputs
 * ------------
 * useAnalyticsEvents accepts `from` and `to` as ISO 8601 strings.
 * Callers convert epoch ms to ISO via Date#toISOString() before
 * calling. The hook treats these strings as opaque (passes them
 * directly to the API) and uses them as cache keys.
 *
 * Loading semantics
 * -----------------
 * On first mount in API mode the hook returns:
 *   { isApiMode: true, events: [], loading: true, error: null, ... }
 * which renders the existing "No sessions recorded" empty state for
 * the brief loading window. The first fetch is ~100-300ms; a
 * skeleton would only flash. Polish later if launch traffic warrants.
 *
 * Related
 * -------
 *   src/hooks/useMerchantsApi.js    | pattern reference
 *   src/lib/authClient.js           | fetchAnalyticsEvents / fetchAnalyticsAvailability
 *   src/utils/analytics.js          | event shape contract
 *   src/context/MockAdminProvider.jsx | the .events slice fallback
 * ────────────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useState } from 'react';
import {
  fetchAnalyticsEvents,
  fetchAnalyticsAvailability,
  AuthApiError,
} from '@lib/authClient';

const IS_API_MODE = import.meta.env.VITE_REMVO_AUTH_MODE === 'api';

/* ── Sensible defaults for mock mode availability ───────────────────
 *
 * In mock mode the operator is exploring the dev sandbox; the toggles
 * are not gated by a real backend they can flip. Default analytics
 * ON so the nav link works without a backend round trip. Default
 * withdrawals OFF because the WithdrawalsPage is a "coming soon" stub
 * regardless of mode | leaving the link active just leads to the stub.
 *
 * has_recent_events: true so the analytics pages render their compute
 * output rather than a "no recent data" branch.
 *
 * The mock-mode shape includes isApiMode:false so any consumer that
 * branches on isApiMode (none today, but a defensive seam for future)
 * has the signal.
 * ────────────────────────────────────────────────────────────────── */
const MOCK_AVAILABILITY = Object.freeze({
  isApiMode: false,
  analytics_enabled: true,
  withdrawals_enabled: false,
  has_recent_events: true,
  loading: false,
  error: null,
  fetched_at: null,
  cached: false,
});

/* ══════════════════════════════════════════════════════════════════
 *  useAnalyticsEvents
 *
 * @param {{ from: string, to: string, platformId?: string, countryCode?: string }} input
 *   from and to are ISO 8601 strings.
 *
 * @returns {{
 *   isApiMode: true,
 *   events: object[],
 *   truncated: boolean,
 *   loading: boolean,
 *   error: { status: number, message: string }|null,
 *   refresh: () => Promise<void>,
 *   fetched_at: string|null,
 *   cached: boolean,
 * } | null}
 * ════════════════════════════════════════════════════════════════ */

export function useAnalyticsEvents(input) {
  const from = input?.from || null;
  const to = input?.to || null;
  const platformId = input?.platformId || null;
  const countryCode = input?.countryCode || null;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(IS_API_MODE);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!IS_API_MODE) return;
    if (!from || !to) return; // guard against undefined-range mounts
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAnalyticsEvents({
        from,
        to,
        platform_id: platformId || undefined,
        country_code: countryCode || undefined,
      });
      setData(res);
    } catch (err) {
      if (err instanceof AuthApiError && err.status === 401) {
        setError({ status: 401, message: 'Session expired. Please sign in again.' });
        return;
      }
      setError({
        status: err?.status || 0,
        message: err?.message || 'Could not load analytics events.',
      });
    } finally {
      setLoading(false);
    }
    /* Dependencies are the primitive string keys. Ensures the
     * fetch re-runs only when the actual query changes, not when
     * the input object identity changes between renders. */
  }, [from, to, platformId, countryCode]);

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
    events: data?.events || [],
    truncated: Boolean(data?.truncated),
    loading,
    error,
    refresh: load,
    fetched_at: data?.fetched_at || null,
    cached: Boolean(data?.cached),
  };
}

/* ══════════════════════════════════════════════════════════════════
 *  useAnalyticsAvailability
 *
 * @returns {{
 *   isApiMode: boolean,
 *   analytics_enabled: boolean,
 *   withdrawals_enabled: boolean,
 *   has_recent_events: boolean,
 *   loading: boolean,
 *   error: { status: number, message: string }|null,
 *   fetched_at: string|null,
 *   cached: boolean,
 *   refresh?: () => Promise<void>,
 * }}
 *
 * Returns a stable mock object in non-API mode (never null) so
 * consumers can read fields unconditionally without isApiMode checks.
 * ════════════════════════════════════════════════════════════════ */

export function useAnalyticsAvailability() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(IS_API_MODE);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!IS_API_MODE) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAnalyticsAvailability();
      setData(res);
    } catch (err) {
      if (err instanceof AuthApiError && err.status === 401) {
        setError({ status: 401, message: 'Session expired. Please sign in again.' });
        return;
      }
      setError({
        status: err?.status || 0,
        message: err?.message || 'Could not load availability.',
      });
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

  if (!IS_API_MODE) {
    return MOCK_AVAILABILITY;
  }

  return {
    isApiMode: true,
    analytics_enabled: data ? Boolean(data.analytics_enabled) : false,
    withdrawals_enabled: data ? Boolean(data.withdrawals_enabled) : false,
    has_recent_events: data ? Boolean(data.has_recent_events) : false,
    loading,
    error,
    fetched_at: data?.fetched_at || null,
    cached: Boolean(data?.cached),
    refresh: load,
  };
}
