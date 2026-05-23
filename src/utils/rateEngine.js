/* ──────────────────────────────────────────────────────────────────
 * rateEngine
 *
 * Pure helpers for the Phase 6 rate engine. Source-priority chain
 * per remvo_rate_engine_spec_v2.md §03, and pending-batch derivation
 * for the settlement trigger on the Dashboard cockpit.
 *
 * No React, no hooks. Callers wrap in useMemo when they need stable
 * references. When P2P.Army is reactivated in Phase 7+, its
 * resolution slot is marked below with a single insertion point.
 * ────────────────────────────────────────────────────────────────── */

const LAST_KNOWN_WINDOW_MINUTES = 30;

/**
 * Resolve the current buy rate through the v2 priority chain.
 *
 * Returns null only when every source is exhausted. Callers treat
 * null as a hard block: no new session init until a source resolves.
 *
 * @param {{
 *   rateSources: Array<{
 *     id: string,
 *     priority: number,
 *     isActive: boolean,
 *     config?: { bufferNaira?: number },
 *     lastReading?: { midRate: number, fetchedAt: string },
 *   }>,
 *   rateEntries: Array<{
 *     id: number,
 *     buyRate: number,
 *     enteredBy: number,
 *     enteredAt: string,
 *     expiresAt: string,
 *     isActive: boolean,
 *     notes: string | null,
 *   }>,
 * }} state
 * @returns {
 *   { rate: number, source: 'manual', sourceId: number, stale: false, enteredAt: string, enteredBy: number, expiresAt: string } |
 *   { rate: number, source: 'coingecko', midRate: number, bufferNaira: number, fetchedAt: string, stale: false } |
 *   { rate: number, source: 'last_known', sourceId: number, stale: true, enteredAt: string } |
 *   null
 * }
 */
export function getCurrentBuyRate(state) {
  const { rateSources, rateEntries } = state;
  const now = Date.now();

  const manualSource = rateSources.find((s) => s.id === 'manual' && s.isActive);
  const activeEntry = rateEntries.find((e) => e.isActive);

  // Priority 1 | manual. Source must be active AND a non-expired entry must exist.
  if (manualSource && activeEntry) {
    const expiresAt = new Date(activeEntry.expiresAt).getTime();
    if (expiresAt > now) {
      return {
        rate: activeEntry.buyRate,
        source: 'manual',
        sourceId: activeEntry.id,
        stale: false,
        enteredAt: activeEntry.enteredAt,
        enteredBy: activeEntry.enteredBy,
        expiresAt: activeEntry.expiresAt,
      };
    }
  }

  // Priority 2 | CoinGecko + buffer.
  const gecko = rateSources.find((s) => s.id === 'coingecko' && s.isActive);
  if (gecko && gecko.lastReading && typeof gecko.lastReading.midRate === 'number') {
    const buffer =
      gecko.config && typeof gecko.config.bufferNaira === 'number'
        ? gecko.config.bufferNaira
        : 0;
    return {
      rate: gecko.lastReading.midRate + buffer,
      source: 'coingecko',
      midRate: gecko.lastReading.midRate,
      bufferNaira: buffer,
      fetchedAt: gecko.lastReading.fetchedAt,
      stale: false,
    };
  }

  // Priority 3 | P2P.Army. Configured-but-disabled at launch.
  // Reactivation is a single-line insertion here; the spec keeps this
  // position reserved so the ordering does not shift in Phase 7+.

  // Priority 4 | last known manual entry within the 30-minute staleness window.
  if (activeEntry) {
    const ageMinutes = (now - new Date(activeEntry.enteredAt).getTime()) / 60000;
    if (ageMinutes < LAST_KNOWN_WINDOW_MINUTES) {
      return {
        rate: activeEntry.buyRate,
        source: 'last_known',
        sourceId: activeEntry.id,
        stale: true,
        enteredAt: activeEntry.enteredAt,
      };
    }
  }

  return null;
}

/**
 * Derive the pending-settlement batch from transactions + platforms.
 *
 * Returns null when nothing is pending. The `nextScheduledAt` field
 * is null at launch (manual trigger only); when the auto-settlement
 * cron ships in Phase 7+, this field carries the next scheduled ISO
 * timestamp per platform without changing the caller contract.
 *
 * @param {{
 *   transactions: Array<{
 *     status: string,
 *     platformId: string,
 *     amountUsdSettled: number,
 *     settlementBatchId: string | null,
 *   }>,
 *   platforms: Array<{ id: string, displayName: string }>,
 * }} state
 * @returns {
 *   { platforms: Array<{ id: string, name: string, usdtOwed: number, transactionCount: number }>, total: number, nextScheduledAt: string | null } |
 *   null
 * }
 */
export function getPendingBatch(state) {
  const { transactions, platforms } = state;

  const pending = transactions.filter(
    (t) => t.status === 'confirmed' && !t.settlementBatchId
  );
  if (pending.length === 0) return null;

  const byPlatform = new Map();
  for (const txn of pending) {
    const existing = byPlatform.get(txn.platformId);
    if (existing) {
      existing.usdtOwed += txn.amountUsdSettled || 0;
      existing.transactionCount += 1;
    } else {
      byPlatform.set(txn.platformId, {
        id: txn.platformId,
        usdtOwed: txn.amountUsdSettled || 0,
        transactionCount: 1,
      });
    }
  }

  const platformRows = Array.from(byPlatform.values()).map((row) => {
    const platform = platforms.find((p) => p.id === row.id);
    return {
      id: row.id,
      name: platform ? platform.displayName : row.id,
      usdtOwed: Number(row.usdtOwed.toFixed(2)),
      transactionCount: row.transactionCount,
    };
  });

  platformRows.sort((a, b) => b.usdtOwed - a.usdtOwed);

  const total = platformRows.reduce((sum, p) => sum + p.usdtOwed, 0);

  return {
    platforms: platformRows,
    total: Number(total.toFixed(2)),
    nextScheduledAt: null,
  };
}
