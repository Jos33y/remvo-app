import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { OperatorSessionContext, AdminDataContext } from './AdminContext';
import { generateFullSeed, seedWallet } from './mockAdminSeeds';
import { deriveEvents } from './mockAnalyticsSeeds';
import * as authClient from '@lib/authClient';

/* ──────────────────────────────────────────────────────────────────
 * MockAdminProvider
 *
 * The data boundary for every admin primitive during Phase 6. Mirrors
 * the Phase 5 MockSessionProvider pattern but with a split context
 * (operator session vs admin data) so re-render cascades are scoped.
 *
 * Storage
 *   admin_dev_session       | localStorage flag, set by LoginPage
 *   admin_mock_data_v1      | localStorage JSON, full state
 *
 * Analytics events
 *   Events are NOT persisted to storage. They are derived on demand
 *   from state.transactions + state.platforms via deriveEvents(),
 *   memoised on those two inputs. This keeps events consistent with
 *   the canonical transactions slice: no drift possible, no orphan
 *   events after a __remvoResetMockData, no stale analytics when
 *   the operator replays a scenario. When Phase 7 wires the backend,
 *   the events memo is replaced with a subscription to a real
 *   events table; no consumer changes because the hook signature
 *   stays the same.
 *
 * On mount:
 *   1. Read admin_mock_data_v1. If present and version matches, use it.
 *   2. Else, call generateFullSeed() and persist.
 *   3. Read admin_dev_session. If 'true', operator = operators[0].
 *      Else, operator = null.
 *
 * On every data mutation:
 *   1. Apply the mutation optimistically to in-memory state.
 *   2. Append an audit log entry (before/after, request_id, actor).
 *   3. Persist the full state to localStorage (debounced per tick).
 *   4. Simulated latency (400-800ms) resolves before returning.
 *
 * On sign out:
 *   Clears the session flag only. Mock data persists across
 *   sessions so audit trails accumulate during walkthrough.
 *
 * Dev reset:
 *   window.__remvoResetMockData() clears both keys and reloads.
 *   Exposed only when import.meta.env.DEV.
 * ────────────────────────────────────────────────────────────────── */

const STORAGE_KEY = 'admin_mock_data_v1';
const SESSION_KEY = 'admin_dev_session';
const EXPECTED_VERSION = 1;

/**
 * Auth mode toggle.
 *   'api'   | useOperatorSession() talks to the real backend.
 *             /me on mount, real signIn payload, real signOut + redirect.
 *   else    | legacy local-storage sandbox flag. Preserves the
 *             dev escape (?admin) workflow when the API isn't running.
 *
 * Set in .env.local as VITE_REMVO_AUTH_MODE=api. Defaults to local so
 * existing dev-loop walkthroughs keep working without backend.
 */
const AUTH_MODE = import.meta.env.VITE_REMVO_AUTH_MODE || 'local';

const POLL_ME_MS = 5 * 60 * 1000;

const MIN_LATENCY_MS = 400;
const MAX_LATENCY_MS = 800;

function simulateLatency() {
  const delay = MIN_LATENCY_MS + Math.random() * (MAX_LATENCY_MS - MIN_LATENCY_MS);
  return new Promise(resolve => setTimeout(resolve, delay));
}

function requestId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function loadState() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.version !== EXPECTED_VERSION) return null;
    return hydrate(parsed);
  } catch {
    return null;
  }
}

/* Forward-compat hydration for persisted state shipped before B1.
 * Adds the wallet slice and the coingecko lastReading when missing,
 * so operators who persisted state during Phase A do not lose their
 * accumulated audit log on upgrade. Strictly additive. */
function hydrate(state) {
  let next = state;

  if (!next.wallet) {
    next = { ...next, wallet: seedWallet() };
  }

  if (next.rateSources && next.rateSources.some((s) => s.id === 'coingecko' && !s.lastReading)) {
    next = {
      ...next,
      rateSources: next.rateSources.map((s) => {
        if (s.id !== 'coingecko' || s.lastReading) return s;
        return {
          ...s,
          lastReading: {
            midRate: 1330.0,
            fetchedAt: new Date(Date.now() - 30 * 1000).toISOString(),
          },
        };
      }),
    };
  }

  return next;
}

function saveState(state) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage quota or permission issues; silently drop. The in-memory
    // state is authoritative during the session.
  }
}

function readSessionFlag() {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(SESSION_KEY) === 'true';
}

function writeSessionFlag(value) {
  if (typeof window === 'undefined') return;
  if (value) {
    window.localStorage.setItem(SESSION_KEY, 'true');
  } else {
    window.localStorage.removeItem(SESSION_KEY);
  }
}

function initialState() {
  const loaded = loadState();
  if (loaded) return loaded;
  const seed = generateFullSeed();
  saveState(seed);
  return seed;
}

// ─── Provider ────────────────────────────────────────────────────

/**
 * Compute a 2-character avatar fallback from a display name.
 * "Joseey John" → "JJ"; "Joseey" → "JO"; empty → "??".
 *
 * @param {string} displayName
 * @returns {string}
 */
function deriveInitials(displayName) {
  if (typeof displayName !== 'string' || displayName.length === 0) return '??';
  const parts = displayName.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  const single = parts[0];
  return (single[0] + (single[1] || single[0])).toUpperCase();
}

/**
 * Map an API operator to the shape the existing UI expects (avatar
 * initials, isActive). The API doesn't ship avatarInitials | we
 * derive them so the Phase 6 components work unchanged.
 *
 * @param {{ id: string, email: string, displayName: string, role: 'owner'|'operator' }} apiOp
 * @returns {{ id: string, email: string, displayName: string, avatarInitials: string, role: 'owner'|'operator', isActive: boolean }}
 */
function fromApiOperator(apiOp) {
  return {
    id: apiOp.id,
    email: apiOp.email,
    displayName: apiOp.displayName,
    avatarInitials: deriveInitials(apiOp.displayName),
    role: apiOp.role,
    isActive: true, // /me only returns the current operator who is by definition active
  };
}

export function MockAdminProvider({ children }) {
  const [state, setState] = useState(initialState);
  const [operator, setOperator] = useState(() => {
    // In API mode we ALWAYS start null and let the /me effect resolve.
    // In local mode we honour the legacy storage flag for the dev escape.
    if (AUTH_MODE === 'api') return null;
    if (!readSessionFlag()) return null;
    return state.operators.find(o => o.id === 1) || null;
  });
  // Tracks whether we've finished the initial /me probe in API mode.
  // Gates AdminProtected from redirecting to /login during the brief
  // moment between mount and first /me response.
  const [bootStatus, setBootStatus] = useState(
    AUTH_MODE === 'api' ? 'loading' : 'ready'
  );
  const stateRef = useRef(state);
  stateRef.current = state;

  // Persist on every state change
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Expose dev reset globally
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!import.meta.env.DEV) return;

    window.__remvoResetMockData = () => {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(SESSION_KEY);
      window.location.reload();
    };

    return () => {
      delete window.__remvoResetMockData;
    };
  }, []);

  // ─── /me probe + poll (API mode only) ──────────────────────────
  //
  // On mount: hit /me once. 200 populates the operator; 401 leaves
  // operator=null and AdminProtected redirects to /login. After
  // initial probe, poll every 5 minutes so a server-side revoke
  // (operator deactivated, session sweep) terminates the UI within
  // one poll window without waiting for the next user-driven request.
  //
  // The poll is a quiet network call | a 401 inside it just clears
  // operator state. The next render sees null and AdminProtected
  // takes over.
  useEffect(() => {
    if (AUTH_MODE !== 'api') return undefined;
    let cancelled = false;

    async function probe(initial) {
      try {
        const me = await authClient.fetchMe();
        if (cancelled) return;
        setOperator(fromApiOperator(me.operator));
      } catch (err) {
        if (cancelled) return;
        // 401 is the expected "not signed in" path; clear state
        // silently. Other errors (network, 5xx) leave previous state
        // alone to avoid a flicker on transient failure.
        if (err?.status === 401) {
          setOperator(null);
        }
      } finally {
        if (!cancelled && initial) setBootStatus('ready');
      }
    }

    probe(true);
    const intervalId = setInterval(() => probe(false), POLL_ME_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  // ─── Session actions ───────────────────────────────────────────

  /**
   * Sign in. Two modes:
   *
   *   API mode | LoginPage already called the auth API and got back
   *              an operator object. It passes that object here so we
   *              don't burn a second /me round trip. The cookie is
   *              already set by the server's Set-Cookie response.
   *
   *   Local mode | sandbox button. No payload | fall back to seeded
   *                operator and the legacy storage flag.
   *
   * @param {{ id: string, email: string, displayName: string, role: 'owner'|'operator' }} [apiOperator]
   */
  const signIn = useCallback((apiOperator) => {
    if (AUTH_MODE === 'api') {
      if (apiOperator) {
        setOperator(fromApiOperator(apiOperator));
      }
      return;
    }
    // Local sandbox path | unchanged.
    writeSessionFlag(true);
    const current = stateRef.current;
    const seededOperator = current.operators.find(o => o.id === 1);
    setOperator(seededOperator || null);
  }, []);

  /**
   * Sign out. In API mode hits the logout endpoint so the server
   * revokes the session row before we drop local state. Errors are
   * swallowed | the cookie's eventual expiry is the safety net.
   *
   * In local mode just clears the flag.
   *
   * @returns {Promise<void>}
   */
  const signOut = useCallback(async () => {
    if (AUTH_MODE === 'api') {
      try {
        await authClient.logout();
      } catch {
        // The cookie will expire on its own. Clearing local state
        // matters more than this network call.
      }
      setOperator(null);
      return;
    }
    writeSessionFlag(false);
    setOperator(null);
  }, []);

  // ─── Audit helper ──────────────────────────────────────────────

  const appendAudit = useCallback((action, entityType, entityId, before, after, metadata) => {
    let created = null;
    setState(prev => {
      const currentOperator = operator || { id: 0, email: 'system' };
      const entry = {
        id: prev.nextAuditId,
        occurredAt: new Date().toISOString(),
        operatorId: currentOperator.id,
        operatorEmail: currentOperator.email,
        action,
        entityType,
        entityId: String(entityId),
        before: before || null,
        after: after || null,
        metadata: { requestId: requestId(), ...(metadata || {}) },
        ipAddress: null,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      };
      created = entry;
      return {
        ...prev,
        auditLog: [entry, ...prev.auditLog],
        nextAuditId: prev.nextAuditId + 1,
      };
    });
    return created;
  }, [operator]);

  // ─── Data actions ──────────────────────────────────────────────

  const updateRate = useCallback(async (rate, notes) => {
    await simulateLatency();
    let before = null;
    let after = null;
    setState(prev => {
      const active = prev.rateEntries.find(e => e.isActive);
      before = active ? { buyRate: active.buyRate, notes: active.notes } : null;

      const enteredAt = new Date();
      const expiresAt = new Date(enteredAt.getTime() + 24 * 60 * 60 * 1000);
      const newEntry = {
        id: prev.rateEntries.length > 0 ? Math.max(...prev.rateEntries.map(e => e.id)) + 1 : 1,
        fiatCurrency: 'NGN',
        asset: 'USDT',
        buyRate: rate,
        notes: notes || null,
        enteredBy: operator?.id || 0,
        enteredAt: enteredAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
        isActive: true,
      };
      after = { buyRate: newEntry.buyRate, notes: newEntry.notes };

      return {
        ...prev,
        rateEntries: [
          newEntry,
          ...prev.rateEntries.map(e => ({ ...e, isActive: false })),
        ],
      };
    });
    appendAudit('rate.update', 'rate', 'NGN_USDT', before, after);
  }, [operator, appendAudit]);

  const toggleManualSource = useCallback(async (enabled) => {
    await simulateLatency();
    let before = null;
    let after = null;
    setState(prev => {
      const existing = prev.rateSources.find(s => s.id === 'manual');
      before = { isActive: existing?.isActive };
      after = { isActive: enabled };
      return {
        ...prev,
        rateSources: prev.rateSources.map(s =>
          s.id === 'manual' ? { ...s, isActive: enabled } : s
        ),
      };
    });
    appendAudit('rate.toggle_manual', 'rate_source', 'manual', before, after);
  }, [appendAudit]);

  const flipPreferredMerchant = useCallback(async (corridorId, merchantId) => {
    await simulateLatency();
    let before = null;
    let after = null;
    setState(prev => {
      const currentPreferred = prev.corridorMerchants.find(
        cm => cm.corridorId === corridorId && cm.isPreferred
      );
      before = { preferredMerchantId: currentPreferred?.merchantId || null };
      after = { preferredMerchantId: merchantId };
      return {
        ...prev,
        corridorMerchants: prev.corridorMerchants.map(cm => {
          if (cm.corridorId !== corridorId) return cm;
          return { ...cm, isPreferred: cm.merchantId === merchantId };
        }),
      };
    });
    appendAudit('corridor.flip_merchant', 'corridor', corridorId, before, after);
  }, [appendAudit]);

  const pauseCorridor = useCallback(async (corridorId, reason) => {
    await simulateLatency();
    let before = null;
    let after = null;
    setState(prev => {
      const corridor = prev.corridors.find(c => c.id === corridorId);
      before = { status: corridor?.status };
      after = { status: 'paused' };
      return {
        ...prev,
        corridors: prev.corridors.map(c =>
          c.id === corridorId ? { ...c, status: 'paused' } : c
        ),
      };
    });
    appendAudit('corridor.pause', 'corridor', corridorId, before, after, { reason });
  }, [appendAudit]);

  const unpauseCorridor = useCallback(async (corridorId) => {
    await simulateLatency();
    let before = null;
    let after = null;
    setState(prev => {
      const corridor = prev.corridors.find(c => c.id === corridorId);
      before = { status: corridor?.status };
      after = { status: 'active' };
      return {
        ...prev,
        corridors: prev.corridors.map(c =>
          c.id === corridorId ? { ...c, status: 'active' } : c
        ),
      };
    });
    appendAudit('corridor.unpause', 'corridor', corridorId, before, after);
  }, [appendAudit]);

  const updateCountryState = useCallback(async (platformId, countryCode, newState) => {
    await simulateLatency();
    let before = null;
    let after = null;
    setState(prev => {
      const platform = prev.platforms.find(p => p.id === platformId);
      const currentCountry = platform?.countries?.[countryCode];
      before = { countryCode, status: currentCountry?.status };
      after = { countryCode, status: newState };

      return {
        ...prev,
        platforms: prev.platforms.map(p => {
          if (p.id !== platformId) return p;
          return {
            ...p,
            countries: {
              ...p.countries,
              [countryCode]: {
                ...(p.countries?.[countryCode] || {}),
                status: newState,
                ...(newState === 'active' && !currentCountry?.activatedAt
                  ? { activatedAt: new Date().toISOString() }
                  : {}),
              },
            },
          };
        }),
      };
    });
    appendAudit('platform.update_country_state', 'platform', platformId, before, after);
  }, [appendAudit]);

  const triggerSettlementBatch = useCallback(async () => {
    await simulateLatency();
    let created = null;
    setState(prev => {
      const pendingTxns = prev.transactions.filter(
        t => t.status === 'confirmed' && !t.settlementBatchId
      );
      if (pendingTxns.length === 0) {
        created = null;
        return prev;
      }

      const batchId = `bat_${Math.random().toString(36).slice(2, 8)}`;
      const totalUsd = pendingTxns.reduce((s, t) => s + t.amountUsdSettled, 0);

      const batch = {
        id: batchId,
        status: 'completed',
        platformId: 'geas',
        transactionCount: pendingTxns.length,
        totalUsdSettled: Number(totalUsd.toFixed(2)),
        totalFeeUsd: Number((totalUsd * 0.01).toFixed(2)),
        triggeredBy: operator?.id || 0,
        triggeredAt: new Date().toISOString(),
        completedAt: new Date(Date.now() + 60 * 1000).toISOString(),
        solTxHash: Math.random().toString(36).slice(2).padEnd(44, '0').slice(0, 44),
      };
      created = batch;

      return {
        ...prev,
        settlements: [
          batch,
          ...prev.settlements.filter(s => s.status !== 'pending'),
        ],
        transactions: prev.transactions.map(t =>
          t.status === 'confirmed' && !t.settlementBatchId
            ? { ...t, settlementBatchId: batchId }
            : t
        ),
      };
    });

    if (created) {
      appendAudit('settlement.trigger_batch', 'settlement', created.id, null, {
        transactionCount: created.transactionCount,
        totalUsdSettled: created.totalUsdSettled,
      });
    }
    return created;
  }, [operator, appendAudit]);

  const inviteOperator = useCallback(async (email, role) => {
    await simulateLatency();
    let newOperatorId = null;
    setState(prev => {
      newOperatorId = Math.max(...prev.operators.map(o => o.id), 0) + 1;
      const displayName = email.split('@')[0];
      const initials = displayName.slice(0, 2).toUpperCase();
      const now = new Date().toISOString();
      return {
        ...prev,
        operators: [
          ...prev.operators,
          {
            id: newOperatorId,
            email,
            displayName,
            avatarInitials: initials,
            role,
            isActive: false,
            invitedAt: now,
            invitedBy: operator?.id || 1,
            firstLoginAt: null,
            lastLoginAt: null,
            createdAt: now,
            updatedAt: now,
          },
        ],
      };
    });
    if (newOperatorId !== null) {
      appendAudit('operator.invite', 'operator', newOperatorId, null, { email, role });
    }
  }, [operator, appendAudit]);

  const revokeOperator = useCallback(async (operatorId) => {
    await simulateLatency();
    let before = null;
    let after = null;
    setState(prev => {
      const target = prev.operators.find(o => o.id === operatorId);
      before = { isActive: target?.isActive };
      after = { isActive: false };
      return {
        ...prev,
        operators: prev.operators.map(o =>
          o.id === operatorId ? { ...o, isActive: false, updatedAt: new Date().toISOString() } : o
        ),
      };
    });
    appendAudit('operator.revoke', 'operator', operatorId, before, after);
  }, [appendAudit]);

  const enrolPasskey = useCallback(async (passkeyData) => {
    await simulateLatency();
    appendAudit('auth.passkey_enrolled', 'operator', operator?.id || 0, null, {
      deviceLabel: passkeyData?.deviceLabel || 'Unknown device',
      credentialId: passkeyData?.credentialId ? '<redacted>' : null,
    });
  }, [operator, appendAudit]);

  const revokePasskey = useCallback(async (passkeyId) => {
    await simulateLatency();
    appendAudit('auth.passkey_revoked', 'operator', operator?.id || 0, null, { passkeyId });
  }, [operator, appendAudit]);

  // ─────────────────────────────────────────────────────────────
  // Section 7 | Platform admin actions
  // ─────────────────────────────────────────────────────────────
  // ── Identity ──────────────────────────────────────────────────────

  const updatePlatformIdentity = useCallback(async (platformId, patch) => {
    await simulateLatency();
    let before = null;
    let after = null;
    setState((prev) => {
      const platform = prev.platforms.find((p) => p.id === platformId);
      if (!platform) return prev;
      const fields = ['displayName', 'webhookUrl', 'settlementMode'];
      before = pick(platform, fields);
      const next = { ...platform };
      if (patch.name !== undefined) next.displayName = patch.name;
      if (patch.webhook_url !== undefined) next.webhookUrl = patch.webhook_url;
      if (patch.settlement_mode !== undefined) next.settlementMode = patch.settlement_mode;
      next.updatedAt = new Date().toISOString();
      after = pick(next, fields);
      return {
        ...prev,
        platforms: prev.platforms.map((p) => (p.id === platformId ? next : p)),
      };
    });
    if (before) appendAudit('platform.update_identity', 'platform', platformId, before, after);
  }, [appendAudit]);

  // ── Fees ──────────────────────────────────────────────────────────

  const updatePlatformFees = useCallback(async (platformId, patch) => {
    await simulateLatency();
    let before = null;
    let after = null;
    setState((prev) => {
      const platform = prev.platforms.find((p) => p.id === platformId);
      if (!platform) return prev;
      before = { platform_fee_pct: platform.skimPercent };
      after = { platform_fee_pct: patch.platform_fee_pct };
      return {
        ...prev,
        platforms: prev.platforms.map((p) =>
          p.id === platformId
            ? { ...p, skimPercent: patch.platform_fee_pct, updatedAt: new Date().toISOString() }
            : p
        ),
      };
    });
    if (before) appendAudit('platform.update_fees', 'platform', platformId, before, after);
  }, [appendAudit]);

  // ── Settlement wallet ─────────────────────────────────────────────

  const validateSettlementWallet = useCallback(async (input) => {
    await simulateLatency();
    // Mock validation: base58 + length only. No on-chain ATA probe.
    const ok = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(input.address);
    if (!ok) {
      const err = new Error('Invalid Solana address: shape check failed');
      err.code = 'platform_invalid_wallet';
      err.status = 400;
      throw err;
    }
    // Synthesise a plausible ATA. Mock mode always reports ata_exists=true
    // so the operator can complete the flow without touching chain.
    return {
      valid: true,
      ata: input.address.slice(0, 6) + '...' + input.address.slice(-6),
      ata_exists: true,
    };
  }, []);

  const updatePlatformSettlementWallet = useCallback(async (platformId, input) => {
    await validateSettlementWallet(input);
    let before = null;
    let after = null;
    setState((prev) => {
      const platform = prev.platforms.find((p) => p.id === platformId);
      if (!platform) return prev;
      before = { settlement_wallet: platform.settlementWalletSolana };
      after = { settlement_wallet: input.address };
      return {
        ...prev,
        platforms: prev.platforms.map((p) =>
          p.id === platformId
            ? { ...p, settlementWalletSolana: input.address, updatedAt: new Date().toISOString() }
            : p
        ),
      };
    });
    if (before) appendAudit('platform.update_settlement_wallet', 'platform', platformId, before, after);
  }, [appendAudit, validateSettlementWallet]);

  // ── Country state (extended | replaces old updateCountryState) ────

  const updateCountryConfig = useCallback(async (platformId, countryCode, patch) => {
    await simulateLatency();
    let before = null;
    let after = null;
    setState((prev) => {
      const platform = prev.platforms.find((p) => p.id === platformId);
      if (!platform) return prev;
      const cc = countryCode.toUpperCase();
      const existing = platform.countries?.[cc] ?? {};

      // Apply patch with the same semantics as backend repo:
      // null deletes, undefined no-ops, anything else overwrites.
      const nextCountry = { ...existing };
      for (const [k, v] of Object.entries(patch)) {
        // Map snake_case API fields to camelCase mock fields
        const key =
          k === 'min_amount_usd' ? 'minAmountUsd' :
            k === 'max_amount_usd' ? 'maxAmountUsd' :
              k === 'active_merchants' ? 'activeMerchants' :
                k === 'preferred_merchant' ? 'preferredMerchant' :
                  k === 'notify_email_enabled' ? 'notifyEmailEnabled' :
                    k;
        if (v === null) delete nextCountry[key];
        else if (v !== undefined) nextCountry[key] = v;
      }

      if (patch.status === 'active' && !existing.activatedAt) {
        nextCountry.activatedAt = new Date().toISOString();
      }

      before = { country: cc, config: existing };
      after = { country: cc, config: nextCountry };

      return {
        ...prev,
        platforms: prev.platforms.map((p) =>
          p.id !== platformId
            ? p
            : {
              ...p,
              countries: { ...(p.countries || {}), [cc]: nextCountry },
              updatedAt: new Date().toISOString(),
            }
        ),
      };
    });
    if (before) appendAudit('platform.update_country_state', 'platform', platformId, before, after);
  }, [appendAudit]);

  // ── API key rotation ──────────────────────────────────────────────

  const rotatePlatformApiKey = useCallback(async (platformId) => {
    await simulateLatency();
    // Mock raw key. Same prefix/shape as production.
    const rawKey = `pk_live_mock_${Math.random().toString(36).slice(2, 18)}${Math.random().toString(36).slice(2, 18)}`;
    let after = null;
    setState((prev) => {
      const platform = prev.platforms.find((p) => p.id === platformId);
      if (!platform) return prev;
      const newRef = `infisical://remvo/platforms/${platformId}/api_key#${Date.now()}`;
      after = { id: platform.id, apiKeyRef: newRef };
      return {
        ...prev,
        platforms: prev.platforms.map((p) =>
          p.id === platformId
            ? { ...p, apiKeyRef: newRef, updatedAt: new Date().toISOString() }
            : p
        ),
      };
    });
    if (after) {
      appendAudit('platform.rotate_api_key', 'platform', platformId, null, {
        api_key_hash_prefix: rawKey.slice(0, 12),
      });
    }
    return { platform: after, raw_key: rawKey };
  }, [appendAudit]);

  // ── Pause / unpause / archive ─────────────────────────────────────

  const setPlatformStatus = useCallback(async (platformId, newStatus, reason) => {
    await simulateLatency();
    let before = null;
    let after = null;
    setState((prev) => {
      const platform = prev.platforms.find((p) => p.id === platformId);
      if (!platform) return prev;
      before = { status: platform.status || 'active' };
      after = { status: newStatus };
      return {
        ...prev,
        platforms: prev.platforms.map((p) =>
          p.id === platformId
            ? { ...p, status: newStatus, updatedAt: new Date().toISOString() }
            : p
        ),
      };
    });
    if (before) {
      const action =
        newStatus === 'paused' ? 'platform.pause' :
          newStatus === 'disabled' ? 'platform.archive' :
            'platform.unpause';
      appendAudit(action, 'platform', platformId, before, after, reason ? { reason } : undefined);
    }
  }, [appendAudit]);

  const pausePlatform = useCallback((platformId, reason) =>
    setPlatformStatus(platformId, 'paused', reason), [setPlatformStatus]);

  const unpausePlatform = useCallback((platformId) =>
    setPlatformStatus(platformId, 'active'), [setPlatformStatus]);

  const archivePlatform = useCallback((platformId, reason) =>
    setPlatformStatus(platformId, 'disabled', reason), [setPlatformStatus]);

  // ── Webhook test ──────────────────────────────────────────────────

  const testPlatformWebhook = useCallback(async (platformId) => {
    // Mock a 600ms successful round-trip. No state mutation, no audit.
    await new Promise((r) => setTimeout(r, 600));
    return {
      ok: true,
      status: 200,
      latency_ms: 248,
      body_preview: '{"received":true}',
      error: null,
    };
  }, []);

  // ─── Derived analytics events ──────────────────────────────────
  //
  // Not persisted. Recomputed whenever transactions or platforms
  // change, deterministic per input. Phase 7 replaces this with a
  // subscription to the real events table.

  const events = useMemo(
    () => deriveEvents(state.transactions, state.platforms),
    [state.transactions, state.platforms]
  );

  // ─── Context values ────────────────────────────────────────────

  const sessionValue = useMemo(
    () => ({ operator, signIn, signOut, bootStatus }),
    [operator, signIn, signOut, bootStatus]
  );

  const dataValue = useMemo(() => ({
    merchants: state.merchants,
    corridors: state.corridors,
    corridorMerchants: state.corridorMerchants,
    platforms: state.platforms,
    transactions: state.transactions,
    settlements: state.settlements,
    rateEntries: state.rateEntries,
    rateSources: state.rateSources,
    wallet: state.wallet,
    operators: state.operators,
    auditLog: state.auditLog,
    events,
    actions: {
      updateRate,
      toggleManualSource,
      flipPreferredMerchant,
      pauseCorridor,
      unpauseCorridor,
      updateCountryState,
      triggerSettlementBatch,
      inviteOperator,
      revokeOperator,
      enrolPasskey,
      revokePasskey,
      updatePlatformIdentity,
      updatePlatformFees,
      validateSettlementWallet,
      updatePlatformSettlementWallet,
      updateCountryConfig,
      rotatePlatformApiKey,
      pausePlatform,
      unpausePlatform,
      archivePlatform,
      testPlatformWebhook,
    },
  }), [
    state, events,
    updateRate, toggleManualSource, flipPreferredMerchant,
    pauseCorridor, unpauseCorridor, updateCountryState,
    triggerSettlementBatch, inviteOperator, revokeOperator,
    enrolPasskey, revokePasskey, updatePlatformIdentity, updatePlatformFees,
    validateSettlementWallet, updatePlatformSettlementWallet,
    updateCountryConfig, rotatePlatformApiKey, pausePlatform,
    unpausePlatform, archivePlatform, testPlatformWebhook
  ]);

  return (
    <OperatorSessionContext.Provider value={sessionValue}>
      <AdminDataContext.Provider value={dataValue}>
        {children}
      </AdminDataContext.Provider>
    </OperatorSessionContext.Provider>
  );
}

// ── pick helper ───────────────────────────────────────────────────

function pick(obj, keys) {
  const out = {};
  for (const k of keys) out[k] = obj[k];
  return out;
}
