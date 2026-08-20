import { useEffect, useRef, useState } from 'react';
import { SessionContext } from './SessionContext';
import { generateReference } from '@utils/generateReference';

const MOCK_P2P_RATE = 1380;
const USER_FEE_PCT = 1.0;
const PLATFORM_FEE_PCT = 1.0;

const SESSION_LOCK_MS = 15 * 60 * 1000;
const PAYMENT_WINDOW_MS = 30 * 60 * 1000;
const PASSIVE_CHECK_MS = 5000;
const CONFIRM_DELAY_MS = 3000;

function rollSpreadPct() {
  const raw = 8 + Math.random() * 2;
  return Math.round(raw * 100) / 100;
}

function computeRateFields(amountUsdCard) {
  const baseSpreadPct = rollSpreadPct();
  const totalPct = baseSpreadPct + USER_FEE_PCT;
  const effectiveRateFull = MOCK_P2P_RATE * (1 + totalPct / 100);
  const userPaysNaira = Math.ceil(amountUsdCard * effectiveRateFull);
  const displayRate = Math.round(effectiveRateFull);

  const platformFeeUsd = Number(
    (amountUsdCard * (PLATFORM_FEE_PCT / 100)).toFixed(2)
  );
  const amountUsdSettled = Number(
    (amountUsdCard - platformFeeUsd).toFixed(2)
  );

  return {
    base_spread_pct: baseSpreadPct,
    total_pct: totalPct,
    effective_rate_full: effectiveRateFull,
    display_rate: displayRate,
    user_pays_naira: userPaysNaira,
    amount_usd_card: amountUsdCard,
    amount_usd_credited: amountUsdCard,
    amount_usd_settled: amountUsdSettled,
    platform_fee_usd: platformFeeUsd,
  };
}

function buildBaseSession({ token, mode = 'preset', amountUsdCard = 25 }) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_LOCK_MS);

  return {
    session_id: token,
    status: 'pending',
    checkout_mode: mode,
    platform_name: 'GE-AS',
    platform_logo_url: null,

    ...computeRateFields(amountUsdCard),

    bank_name: 'Wema Bank',
    account_number: '7123456789',
    account_name: 'Remvo Labs Limited',
    /* Matches the API provider's shape so the trust footer renders in
     * ?checkout dev mode too. */
    processor: 'paystack',

    locked_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
    payment_expires_at: null,

    reference: generateReference(),
    callback_url: 'https://ge-as.com/deposit/complete',

    completed_in_session: false,
    confirmed_at: null,
  };
}

/* ──────────────────────────────────────────────────────────────────
 * buildCountryNotActiveSession
 *
 * Phase 6 (checkout extension) — fixtures for CountryComingSoonPage.
 * Mirrors the shape documented in PHASE_6_ADMIN_SCREEN_SKETCH_v4_PATCH
 * Patch 6. All payment fields are stripped because no checkout flow
 * is possible; only the fields CountryComingSoonPage reads are kept.
 *
 * country_code is an ISO-3166-1 alpha-2 string used by CountryFlag
 * to render the right glyph; the human-readable country string is
 * independent for display flexibility.
 * ────────────────────────────────────────────────────────────────── */
function buildCountryNotActiveSession({
  token,
  reason,
  country,
  countryCode,
  notifyEnabled,
}) {
  return {
    session_id: token,
    status: 'country_not_active',
    reason,
    country,
    country_code: countryCode,
    notify_enabled: notifyEnabled,
    platform_name: 'GE-AS',
    platform_logo_url: null,
    platform_id: 'geas',
    callback_url: 'https://ge-as.com/deposit/complete',
  };
}

function resolveToken(token) {
  if (!token || !token.startsWith('cs_')) {
    return {
      ...buildBaseSession({ token: token || 'invalid' }),
      status: 'invalid',
    };
  }

  switch (token) {
    case 'cs_test_select':
      return buildBaseSession({ token, mode: 'select', amountUsdCard: 0 });
    case 'cs_test_preset':
      return buildBaseSession({ token, mode: 'preset', amountUsdCard: 100 });
    case 'cs_test_expired':
      return { ...buildBaseSession({ token }), status: 'expired' };
    case 'cs_test_completed': {
      const base = buildBaseSession({ token });
      return {
        ...base,
        status: 'completed',
        completed_in_session: false,
        confirmed_at: new Date().toISOString(),
      };
    }
    case 'cs_test_invalid':
      return { ...buildBaseSession({ token }), status: 'invalid' };

    /* ── Country-not-active fixtures (Phase 6 checkout extension) ── */
    case 'cs_test_coming_soon':
      return buildCountryNotActiveSession({
        token,
        reason: 'coming_soon',
        country: 'Ghana',
        countryCode: 'GH',
        notifyEnabled: true,
      });
    case 'cs_test_coming_soon_no_notify':
      return buildCountryNotActiveSession({
        token,
        reason: 'coming_soon',
        country: 'Kenya',
        countryCode: 'KE',
        notifyEnabled: false,
      });
    case 'cs_test_paused':
      return buildCountryNotActiveSession({
        token,
        reason: 'paused',
        country: 'Uganda',
        countryCode: 'UG',
        notifyEnabled: true,
      });
    case 'cs_test_paused_no_notify':
      return buildCountryNotActiveSession({
        token,
        reason: 'paused',
        country: 'Tanzania',
        countryCode: 'TZ',
        notifyEnabled: false,
      });
    case 'cs_test_coming_soon_za':
      return buildCountryNotActiveSession({
        token,
        reason: 'coming_soon',
        country: 'South Africa',
        countryCode: 'ZA',
        notifyEnabled: true,
      });
    case 'cs_test_coming_soon_eg':
      return buildCountryNotActiveSession({
        token,
        reason: 'coming_soon',
        country: 'Egypt',
        countryCode: 'EG',
        notifyEnabled: true,
      });
    case 'cs_test_coming_soon_ci':
      return buildCountryNotActiveSession({
        token,
        reason: 'coming_soon',
        country: "Cote d'Ivoire",
        countryCode: 'CI',
        notifyEnabled: true,
      });

    default:
      return buildBaseSession({ token, mode: 'preset', amountUsdCard: 25 });
  }
}

export function MockSessionProvider({ token, children }) {
  const [session, setSession] = useState(() => resolveToken(token));
  const confirmTimerRef = useRef(null);

  useEffect(() => {
    setSession(resolveToken(token));
  }, [token]);

  useEffect(() => {
    return () => {
      if (confirmTimerRef.current) {
        clearTimeout(confirmTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!session || (session.status !== 'pending' && session.status !== 'processing')) {
      return undefined;
    }

    const interval = setInterval(() => {
      setSession((prev) => {
        if (!prev) return prev;
        if (prev.status !== 'pending' && prev.status !== 'processing') return prev;

        const now = Date.now();

        if (
          prev.payment_expires_at &&
          new Date(prev.payment_expires_at).getTime() <= now
        ) {
          return { ...prev, status: 'expired' };
        }

        if (
          prev.expires_at &&
          new Date(prev.expires_at).getTime() <= now
        ) {
          return { ...prev, status: 'expired' };
        }

        return prev;
      });
    }, PASSIVE_CHECK_MS);

    return () => clearInterval(interval);
  }, [session?.status]);

  const mockConfirmPayment = () => {
    setSession((prev) => {
      if (!prev || prev.status !== 'pending') return prev;
      return { ...prev, status: 'processing' };
    });

    if (confirmTimerRef.current) {
      clearTimeout(confirmTimerRef.current);
    }

    confirmTimerRef.current = setTimeout(() => {
      setSession((prev) => {
        if (!prev || prev.status !== 'processing') return prev;
        return {
          ...prev,
          status: 'completed',
          completed_in_session: true,
          confirmed_at: new Date().toISOString(),
        };
      });
      confirmTimerRef.current = null;
    }, CONFIRM_DELAY_MS);
  };

  const mockExpireSession = () => {
    setSession((prev) => (prev ? { ...prev, status: 'expired' } : prev));
  };

  const mockResetSession = () => {
    if (confirmTimerRef.current) {
      clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = null;
    }
    setSession(resolveToken(token));
  };

  const startPaymentWindow = () => {
    setSession((prev) => {
      if (!prev || prev.payment_expires_at) return prev;
      const expiry = new Date(Date.now() + PAYMENT_WINDOW_MS);
      return { ...prev, payment_expires_at: expiry.toISOString() };
    });
  };

  /**
   * Lock in the user's chosen amount on the SelectPage. Recomputes
   * rate fields and flips checkout_mode to 'preset' so SessionResolver
   * routes to ConfirmPage on next render.
   */
  const mockSelectAmount = (amountUsd) => {
    setSession((prev) => {
      if (!prev || prev.status !== 'pending') return prev;
      return {
        ...prev,
        ...computeRateFields(amountUsd),
      };
    });
  };

  /**
   * Reverse of mockSelectAmount: clears the chosen amount and flips
   * checkout_mode back to 'select' so SessionResolver routes back to
   * SelectPage. Triggered by "Change amount" on ConfirmPage.
   */
  const mockResetToSelectMode = () => {
    setSession((prev) => {
      if (!prev || prev.status !== 'pending') return prev;
      return {
        ...prev,
        ...computeRateFields(0),
        checkout_mode: 'select',
      };
    });
  };

  const value = {
    session,
    mockConfirmPayment,
    mockExpireSession,
    mockResetSession,
    startPaymentWindow,
    mockSelectAmount,
    mockResetToSelectMode,
  };

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}
