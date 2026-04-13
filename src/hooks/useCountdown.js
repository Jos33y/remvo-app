import { useEffect, useState } from 'react';

/**
 * Compute remaining time from a server-issued ISO timestamp.
 *
 * Why timestamp-based instead of decrementing a counter:
 *   - Survives tab backgrounding (browsers throttle setInterval to 1Hz
 *     or slower in inactive tabs, which would drift a decrementing
 *     counter by tens of seconds over a few minutes).
 *   - Survives device sleep (counter would freeze, timestamp keeps working).
 *   - Survives client clock drift between renders.
 *   - Wall-clock difference is always correct, regardless of when the
 *     tick fires or how long the tab was inactive.
 *
 * Re-syncs immediately on visibilitychange so a backgrounded tab
 * returning to focus shows the correct time without waiting for the
 * next tick.
 *
 * @param {string|null} expiresAt - ISO 8601 timestamp, or null to disable
 * @returns {{
 *   minutes: number,
 *   seconds: number,
 *   remainingMs: number,
 *   expired: boolean,
 * }}
 */
export function useCountdown(expiresAt) {
  const [remainingMs, setRemainingMs] = useState(() => computeRemaining(expiresAt));

  useEffect(() => {
    if (!expiresAt) {
      setRemainingMs(0);
      return undefined;
    }

    // Initial sync on mount or whenever expiresAt changes
    setRemainingMs(computeRemaining(expiresAt));

    const tick = () => {
      const remaining = computeRemaining(expiresAt);
      setRemainingMs(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    };

    const interval = setInterval(tick, 1000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        setRemainingMs(computeRemaining(expiresAt));
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [expiresAt]);

  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const expired = remainingMs <= 0 && expiresAt != null;

  return { minutes, seconds, remainingMs, expired };
}

function computeRemaining(expiresAt) {
  if (!expiresAt) return 0;
  const expiry = new Date(expiresAt).getTime();
  if (Number.isNaN(expiry)) return 0;
  return Math.max(0, expiry - Date.now());
}
