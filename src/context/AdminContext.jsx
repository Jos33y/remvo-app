import { createContext, useContext } from 'react';

/* ──────────────────────────────────────────────────────────────────
 * Admin contexts
 *
 * Two contexts, not one. Operator session changes (sign in, sign out)
 * are rare. Data mutations (audit log append, rate update, merchant
 * flip) are frequent. Splitting subscribers along this seam means
 * AdminHeader, AdminProtected, OperatorBadge re-render only when the
 * session changes; DataTables, Pagination, AuditLogRow re-render
 * only when data changes.
 *
 * Both contexts are populated by MockAdminProvider in Phase 6. Phase
 * 7 swaps MockAdminProvider for a real provider that reads from the
 * backend API and subscribes to WebSocket push updates. Consumers
 * of useOperatorSession / useAdminData do not change.
 *
 * Throw guards: using a hook outside the provider is a programming
 * error, not a recoverable state. The throw halts render with a
 * useful message rather than silently returning null.
 * ────────────────────────────────────────────────────────────────── */

export const OperatorSessionContext = createContext(null);
export const AdminDataContext = createContext(null);

/**
 * Operator session hook. Read the current operator and auth actions.
 *
 * `signIn(apiOperator?)` accepts an operator object from the LoginPage's
 * API response. Avoids a second /me round trip after login. In local
 * sandbox mode it falls back to the seeded operator (no arg needed).
 *
 * `bootStatus` is 'loading' in API mode until the initial /me probe
 * resolves. AdminProtected uses it to avoid a flash of /login on
 * deep-link refresh. In local mode it's 'ready' from mount.
 *
 * @returns {{
 *   operator: { id: string|number, email: string, displayName: string, avatarInitials: string, role: 'owner' | 'operator', isActive: boolean } | null,
 *   signIn: (apiOperator?: { id: string, email: string, displayName: string, role: 'owner'|'operator' }) => void,
 *   signOut: () => Promise<void>,
 *   bootStatus: 'loading' | 'ready',
 * }}
 */
export function useOperatorSession() {
  const ctx = useContext(OperatorSessionContext);
  if (!ctx) {
    throw new Error('useOperatorSession must be used within a MockAdminProvider');
  }
  return ctx;
}

/**
 * Admin data hook. Read the full mock data surface + action handlers.
 *
 * Action handlers resolve after 400-800ms simulated latency. Each
 * writes an audit entry before resolving. Callers do not need to
 * manually log; the provider guarantees attribution.
 *
 * The `events` field is the analytics event stream. During Phase 6
 * it is derived from transactions + platforms via deriveEvents() in
 * mockAnalyticsSeeds.js, memoised on those inputs. During Phase 7
 * it becomes a live subscription to the backend events table. The
 * shape stays identical so Analytics screens do not change.
 *
 * @returns {{
 *   merchants: Array,
 *   corridors: Array,
 *   corridorMerchants: Array,
 *   platforms: Array,
 *   transactions: Array,
 *   settlements: Array,
 *   rateEntries: Array,
 *   rateSources: Array,
 *   wallet: object,
 *   operators: Array,
 *   auditLog: Array,
 *   events: Array<{
 *     id: string,
 *     sessionId: string,
 *     platformId: string,
 *     corridorId: string,
 *     countryCode: string,
 *     device: 'mobile' | 'desktop' | 'tablet',
 *     event: string,
 *     occurredAt: string,
 *     metadata: object,
 *   }>,
 *   actions: {
 *     updateRate: (rate: number, notes?: string) => Promise<void>,
 *     toggleManualSource: (enabled: boolean) => Promise<void>,
 *     flipPreferredMerchant: (corridorId: string, merchantId: string) => Promise<void>,
 *     pauseCorridor: (corridorId: string, reason: string) => Promise<void>,
 *     unpauseCorridor: (corridorId: string) => Promise<void>,
 *     updateCountryState: (platformId: string, countryCode: string, newState: 'active' | 'coming_soon' | 'paused') => Promise<void>,
 *     triggerSettlementBatch: () => Promise<object>,
 *     inviteOperator: (email: string, role: 'owner' | 'operator') => Promise<void>,
 *     revokeOperator: (operatorId: number) => Promise<void>,
 *     enrolPasskey: (passkeyData: object) => Promise<void>,
 *     revokePasskey: (passkeyId: number) => Promise<void>,
 *   },
 * }}
 */
export function useAdminData() {
  const ctx = useContext(AdminDataContext);
  if (!ctx) {
    throw new Error('useAdminData must be used within a MockAdminProvider');
  }
  return ctx;
}
