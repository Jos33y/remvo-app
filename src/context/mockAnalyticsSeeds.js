import { EVENT_TYPES } from '@utils/analytics';

/* ──────────────────────────────────────────────────────────────────
 * mockAnalyticsSeeds
 *
 * Pure module. Derives a realistic event stream from the seeded
 * transactions (mockAdminSeeds.seedTransactions), enriched with
 * extra sessions that never converted so the funnel + conversion
 * rate have material to read. No new storage key: this runs on
 * demand from MockAdminProvider's useMemo on the transactions +
 * platforms slice.
 *
 * Why synthesise rather than persist
 * ----------------------------------
 * In Phase 7, events will be written by the checkout flow itself
 * (session init on the backend + page mount handlers on the client)
 * and persisted to the events table. During Phase 6, persisting
 * synthetic events to localStorage would create drift: every
 * seedTransactions run (or a __remvoResetMockData call) would leave
 * orphan events and a stale funnel. Deriving events from the
 * canonical transactions slice keeps them consistent by construction.
 *
 * Event shape
 * -----------
 *   {
 *     id, sessionId, platformId, corridorId, countryCode, device,
 *     event (EventType), occurredAt (ISO), metadata (object)
 *   }
 *
 * Funnel realism is calibrated so the synthetic stream reads the way
 * a real Nigerian-corridor-first B2B onramp looks: ~90% of started
 * sessions open checkout, ~65% select an amount, ~50% view payment,
 * ~70% of those who reach payment actually confirm. These drop-offs
 * produce a funnel that highlights the payment-view-to-confirm step
 * as the biggest leak, which matches real fintech checkout data.
 * ────────────────────────────────────────────────────────────────── */

// ─── Tunables ────────────────────────────────────────────────────
//
// Drop-off rates at each step. These are the probabilities a session
// ADVANCES past the given gate. Calibrated to realistic African
// onramp data; adjust if the funnel looks unrealistic.

const GATE_CHECKOUT_OPEN     = 0.92;  // 92% who start, land on checkout
const GATE_SELECT_AMOUNT     = 0.72;  // 72% pick an amount (among select-mode)
const GATE_CONFIRM_PROCEED   = 0.78;  // 78% click Continue to payment
const GATE_PAYMENT_VIEW      = 0.90;  // 90% reach payment (small tech drops)
const GATE_PAYMENT_CONFIRMED = 0.70;  // 70% actually pay

const DEVICE_MIX = [
  { device: 'mobile',  weight: 0.78 },
  { device: 'desktop', weight: 0.17 },
  { device: 'tablet',  weight: 0.05 },
];

// Country mix for NG-first launch (Nigeria dominant, small GH/KE
// coming_soon landings that short-circuit after CHECKOUT_OPEN via
// country_not_active). This matches the v4 Patch 6 reality.
const COUNTRY_MIX = [
  { code: 'NG', weight: 0.82, active: true },
  { code: 'GH', weight: 0.07, active: false }, // coming_soon
  { code: 'KE', weight: 0.05, active: false }, // coming_soon
  { code: 'UG', weight: 0.03, active: false }, // coming_soon
  { code: 'ZA', weight: 0.02, active: false }, // coming_soon
  { code: 'TZ', weight: 0.01, active: false }, // coming_soon
];

// Extra synthetic sessions per real transaction. The seeded
// transactions represent paying users; real checkout has many more
// session-starts that never pay. Multiplier keeps the funnel shape
// realistic without ballooning memory.
const EXTRA_SESSIONS_PER_TXN = 1.4;

// ─── Deterministic RNG ───────────────────────────────────────────
//
// mulberry32 seeded with a hash of the seed transactions count +
// first transaction id. Keeps events stable across renders (important
// because React's useMemo re-runs on any dep change) while letting
// the stream change when the underlying data changes.

function mulberry32(seed) {
  return function rng() {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(transactions) {
  const anchor = transactions.length > 0 ? transactions[0].id : 'empty';
  let h = 0;
  const s = `${transactions.length}|${anchor}`;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return h || 1;
}

// ─── Helpers ─────────────────────────────────────────────────────

function weighted(rng, entries) {
  const roll = rng();
  let acc = 0;
  for (const entry of entries) {
    acc += entry.weight;
    if (roll < acc) return entry;
  }
  return entries[entries.length - 1];
}

function pad(n) {
  return n.toString(36).padStart(6, '0');
}

function randomId(rng, prefix) {
  const a = Math.floor(rng() * 1e9);
  const b = Math.floor(rng() * 1e6);
  return `${prefix}_${pad(a)}${pad(b)}`.slice(0, prefix.length + 14);
}

function mkEvent(rng, {
  sessionId, platformId, corridorId, countryCode, device,
  event, occurredAt, metadata,
}) {
  return {
    id: `evt_${randomId(rng, 'ev').slice(4)}`,
    sessionId,
    platformId,
    corridorId,
    countryCode,
    device,
    event,
    occurredAt,
    metadata: metadata || {},
  };
}

// ─── Core derivation ─────────────────────────────────────────────

/**
 * Build the full event stream from seeded transactions.
 *
 * Strategy
 * --------
 * 1. For every real transaction, emit the full happy-path event
 *    sequence (session.init → checkout.open → ... → complete.view)
 *    with timestamps clustered around the transaction's createdAt.
 *    This guarantees analytics aligns exactly with the transactions
 *    list (same session ids, same timings).
 *
 * 2. Generate additional "ghost" sessions that drop off at various
 *    stages. These are the sessions that never became transactions:
 *    expired, failed, or abandoned. Without them the funnel would
 *    show 100% conversion everywhere, which is unreal.
 *
 * 3. Generate a handful of country_not_active sessions (Ghana, Kenya,
 *    Uganda landings that got the coming_soon screen). These only
 *    fire SESSION_INIT + CHECKOUT_OPEN, matching the real flow.
 *
 * All events are deterministic given the same transactions input.
 *
 * @param {Array} transactions  seeded transactions
 * @param {Array} platforms     seeded platforms (for default platform id)
 * @returns {Array} events
 */
export function deriveEvents(transactions, platforms) {
  if (!Array.isArray(transactions) || transactions.length === 0) return [];

  const rng = mulberry32(hashSeed(transactions));
  const events = [];
  const defaultPlatformId = platforms?.[0]?.id || 'geas';

  // ── Pass 1: happy path + failure path for every real transaction
  for (const txn of transactions) {
    const sessionId = txn.sessionId;
    const platformId = txn.platformId || defaultPlatformId;
    const corridorId = txn.corridorId || 'cor_ng_dep_sol';
    const { device } = weighted(rng, DEVICE_MIX);

    // Nigerian transactions are the overwhelming majority; country
    // derives from the transaction's corridor (all seeded are NG).
    const countryCode = 'NG';

    const created = new Date(txn.createdAt).getTime();

    // session.init fires ~2-6 seconds before createdAt (platform
    // API call → user redirect → first page load)
    const initAt   = created - (2000 + rng() * 4000);
    const openAt   = created - (500 + rng() * 1500);
    const selectAt = created + (1500 + rng() * 3000);
    const confirmViewAt  = created + (4000 + rng() * 6000);
    const confirmProceedAt = confirmViewAt + (1500 + rng() * 3500);
    const payViewAt  = confirmProceedAt + (500 + rng() * 1500);

    const base = {
      sessionId, platformId, corridorId, countryCode, device,
    };

    events.push(mkEvent(rng, {
      ...base,
      event: EVENT_TYPES.SESSION_INIT,
      occurredAt: new Date(initAt).toISOString(),
      metadata: { amountUsd: txn.amountUsdCard },
    }));

    events.push(mkEvent(rng, {
      ...base,
      event: EVENT_TYPES.CHECKOUT_OPEN,
      occurredAt: new Date(openAt).toISOString(),
    }));

    // If this was a "select" mode session (amount not preset) there
    // is a SELECT_VIEW then SELECT_AMOUNT. In seed data preset is
    // more common, but mix a few in for realism.
    if (rng() < 0.35) {
      events.push(mkEvent(rng, {
        ...base,
        event: EVENT_TYPES.SELECT_VIEW,
        occurredAt: new Date(created + rng() * 500).toISOString(),
      }));
      events.push(mkEvent(rng, {
        ...base,
        event: EVENT_TYPES.SELECT_AMOUNT,
        occurredAt: new Date(selectAt).toISOString(),
        metadata: { amountUsd: txn.amountUsdCard },
      }));
    }

    events.push(mkEvent(rng, {
      ...base,
      event: EVENT_TYPES.CONFIRM_VIEW,
      occurredAt: new Date(confirmViewAt).toISOString(),
    }));

    events.push(mkEvent(rng, {
      ...base,
      event: EVENT_TYPES.CONFIRM_PROCEED,
      occurredAt: new Date(confirmProceedAt).toISOString(),
    }));

    events.push(mkEvent(rng, {
      ...base,
      event: EVENT_TYPES.PAYMENT_VIEW,
      occurredAt: new Date(payViewAt).toISOString(),
    }));

    // Copy-account-number is a strong commit signal; fires for most
    // who reach payment view, not all (some memorise visually).
    if (rng() < 0.85) {
      events.push(mkEvent(rng, {
        ...base,
        event: EVENT_TYPES.PAYMENT_COPY,
        occurredAt: new Date(payViewAt + 2000 + rng() * 8000).toISOString(),
      }));
    }

    // Terminal state matches the transaction's actual status.
    if (txn.status === 'confirmed') {
      const waitingAt = payViewAt + 5000 + rng() * 20000;
      events.push(mkEvent(rng, {
        ...base,
        event: EVENT_TYPES.PAYMENT_WAITING,
        occurredAt: new Date(waitingAt).toISOString(),
      }));
      const confirmedAt = txn.confirmedAt
        ? new Date(txn.confirmedAt).getTime()
        : waitingAt + 30000 + rng() * 120000;
      events.push(mkEvent(rng, {
        ...base,
        event: EVENT_TYPES.PAYMENT_CONFIRMED,
        occurredAt: new Date(confirmedAt).toISOString(),
        metadata: {
          amountUsd: txn.amountUsdCard,
          amountNgn: txn.userPaysNaira,
          reference: txn.reference,
        },
      }));
      events.push(mkEvent(rng, {
        ...base,
        event: EVENT_TYPES.COMPLETE_VIEW,
        occurredAt: new Date(confirmedAt + 500 + rng() * 1500).toISOString(),
      }));
    } else if (txn.status === 'failed') {
      events.push(mkEvent(rng, {
        ...base,
        event: EVENT_TYPES.SESSION_FAILED,
        occurredAt: new Date(payViewAt + 60000 + rng() * 300000).toISOString(),
        metadata: { reason: 'webhook_timeout' },
      }));
    } else {
      // pending — still waiting, last event is waiting screen
      events.push(mkEvent(rng, {
        ...base,
        event: EVENT_TYPES.PAYMENT_WAITING,
        occurredAt: new Date(payViewAt + 5000 + rng() * 20000).toISOString(),
      }));
    }
  }

  // ── Pass 2: ghost sessions (drop-off stories with no transaction)
  const ghostCount = Math.round(transactions.length * EXTRA_SESSIONS_PER_TXN);
  const txnWindow = transactions.map(t => new Date(t.createdAt).getTime());
  const windowMin = Math.min(...txnWindow);
  const windowMax = Math.max(...txnWindow);

  for (let i = 0; i < ghostCount; i++) {
    const sessionId = `cs_${randomId(rng, 'cs')}`;
    const occurredAt0 = windowMin + rng() * (windowMax - windowMin);
    const { device } = weighted(rng, DEVICE_MIX);
    const { code: countryCode, active } = weighted(rng, COUNTRY_MIX);

    const base = {
      sessionId,
      platformId: defaultPlatformId,
      corridorId: 'cor_ng_dep_sol',
      countryCode,
      device,
    };

    events.push(mkEvent(rng, {
      ...base,
      event: EVENT_TYPES.SESSION_INIT,
      occurredAt: new Date(occurredAt0).toISOString(),
    }));

    // Inactive country sessions short-circuit after CHECKOUT_OPEN —
    // this is the CountryComingSoonPage path. They never reach select.
    if (!active) {
      if (rng() < GATE_CHECKOUT_OPEN) {
        events.push(mkEvent(rng, {
          ...base,
          event: EVENT_TYPES.CHECKOUT_OPEN,
          occurredAt: new Date(occurredAt0 + 1500 + rng() * 3000).toISOString(),
          metadata: { status: 'country_not_active' },
        }));
      }
      continue;
    }

    if (rng() >= GATE_CHECKOUT_OPEN) continue;
    const openAt = occurredAt0 + 1500 + rng() * 3000;
    events.push(mkEvent(rng, {
      ...base,
      event: EVENT_TYPES.CHECKOUT_OPEN,
      occurredAt: new Date(openAt).toISOString(),
    }));

    // select mode (about a third)
    let lastAt = openAt;
    if (rng() < 0.35) {
      events.push(mkEvent(rng, {
        ...base,
        event: EVENT_TYPES.SELECT_VIEW,
        occurredAt: new Date(openAt + 500).toISOString(),
      }));
      if (rng() >= GATE_SELECT_AMOUNT) continue;
      lastAt = openAt + 3000 + rng() * 8000;
      events.push(mkEvent(rng, {
        ...base,
        event: EVENT_TYPES.SELECT_AMOUNT,
        occurredAt: new Date(lastAt).toISOString(),
      }));
    }

    // confirm view (always, preset mode skips select)
    lastAt = lastAt + 1000 + rng() * 3000;
    events.push(mkEvent(rng, {
      ...base,
      event: EVENT_TYPES.CONFIRM_VIEW,
      occurredAt: new Date(lastAt).toISOString(),
    }));

    if (rng() >= GATE_CONFIRM_PROCEED) continue;
    lastAt = lastAt + 2000 + rng() * 5000;
    events.push(mkEvent(rng, {
      ...base,
      event: EVENT_TYPES.CONFIRM_PROCEED,
      occurredAt: new Date(lastAt).toISOString(),
    }));

    if (rng() >= GATE_PAYMENT_VIEW) continue;
    lastAt = lastAt + 500 + rng() * 1500;
    events.push(mkEvent(rng, {
      ...base,
      event: EVENT_TYPES.PAYMENT_VIEW,
      occurredAt: new Date(lastAt).toISOString(),
    }));

    if (rng() < 0.55) {
      events.push(mkEvent(rng, {
        ...base,
        event: EVENT_TYPES.PAYMENT_COPY,
        occurredAt: new Date(lastAt + 2000 + rng() * 8000).toISOString(),
      }));
    }

    // Ghost sessions that "should have" confirmed but are counted as
    // drops by not firing PAYMENT_CONFIRMED — the final gate.
    if (rng() >= GATE_PAYMENT_CONFIRMED) {
      // expired drop-off
      events.push(mkEvent(rng, {
        ...base,
        event: EVENT_TYPES.SESSION_EXPIRED,
        occurredAt: new Date(lastAt + 30 * 60 * 1000).toISOString(),
      }));
    } else {
      // a ghost that actually paid but was lost to cleanup — rare
      events.push(mkEvent(rng, {
        ...base,
        event: EVENT_TYPES.PAYMENT_CONFIRMED,
        occurredAt: new Date(lastAt + 20000 + rng() * 60000).toISOString(),
      }));
    }
  }

  // Sort ascending by time (natural reading order for charts)
  events.sort((a, b) => new Date(a.occurredAt) - new Date(b.occurredAt));
  return events;
}
