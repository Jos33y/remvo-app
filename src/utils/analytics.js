/* ──────────────────────────────────────────────────────────────────
 * analytics.js | event taxonomy + aggregation
 *
 * Pure module. Exports are functions and constants only. No React,
 * no hooks, no state. Consumed by AnalyticsPage branches.
 *
 * Event model
 * -----------
 * Every checkout-side meaningful moment fires exactly one event.
 * Events are append-only, have a server-assigned id, a session id
 * that survives page reloads, a platform id, a country code, a
 * device bucket, and an occurredAt timestamp. No PII is stored; the
 * user's email (from the confirm step if present) is hashed before
 * insert. Unlimited retention per user memory.
 *
 * Phase 7 backend writes these from the session resolver + checkout
 * page mount handlers + webhook handlers. Phase 6 (this ship) reads
 * them from MockAdminProvider's data slice, which is synthesised
 * from the existing seeded transactions so the analytics screens
 * have realistic shape from the first render.
 *
 * Event schema (TypeScript-equivalent JSDoc for clarity)
 *   {
 *     id:            string,   // evt_<random>
 *     sessionId:     string,   // cs_<token>
 *     platformId:    string,   // geas
 *     corridorId:    string,   // cor_ng_dep_sol
 *     countryCode:   string,   // ISO 3166-1 alpha-2
 *     device:        'mobile' | 'desktop' | 'tablet',
 *     event:         EventType,
 *     occurredAt:    ISO8601,
 *     metadata:      object (event-specific, minimal)
 *   }
 *
 * The taxonomy below is the single source of truth. Checkout pages
 * and session resolver emit only these event types; no ad-hoc events.
 * Funnel derivation in this file depends on the ordering.
 * ────────────────────────────────────────────────────────────────── */

// ─── Event types ─────────────────────────────────────────────────
//
// Funnel ordering is the listed order. Each is a page view or a
// state transition. Renames are breaking changes — never rename
// without a migration plan.

export const EVENT_TYPES = {
  SESSION_INIT:        'session.init',        // platform hit Remvo API, session created
  CHECKOUT_OPEN:       'checkout.open',       // user landed on checkout URL
  SELECT_VIEW:         'select.view',         // SelectPage rendered
  SELECT_AMOUNT:       'select.amount',       // user picked a denomination or custom amount
  CONFIRM_VIEW:        'confirm.view',        // ConfirmPage rendered
  CONFIRM_PROCEED:     'confirm.proceed',     // user clicked "Continue to payment"
  PAYMENT_VIEW:        'payment.view',        // PaymentPage rendered
  PAYMENT_COPY:        'payment.copy',        // user copied the bank account number
  PAYMENT_WAITING:     'payment.waiting',     // 30-min window started, still waiting
  PAYMENT_CONFIRMED:   'payment.confirmed',   // PSP webhook confirmed payment
  COMPLETE_VIEW:       'complete.view',       // CompletePage rendered
  SESSION_EXPIRED:     'session.expired',     // 15-min or 30-min window lapsed
  SESSION_FAILED:      'session.failed',      // webhook / merchant failure
};

// ─── Funnel step definitions ─────────────────────────────────────
//
// The funnel is a fixed five-step ladder that maps checkout reality
// to a scannable drop-off chart. Each step corresponds to a specific
// event (or set of events) that counts a user as having reached
// that step. Drop-off between steps is the business signal.
//
// Step 1 — Session started           | SESSION_INIT
// Step 2 — Checkout opened           | CHECKOUT_OPEN (user actually loaded the URL)
// Step 3 — Payment viewed            | PAYMENT_VIEW (user reached the bank-transfer page)
// Step 4 — Payment confirmed         | PAYMENT_CONFIRMED (money received)
//
// FOUR STEPS SINCE 20 AUGUST 2026 (checklist sections C and K)
// ------------------------------------------------------------
// There used to be an 'Amount selected' step between 2 and 3,
// matching SELECT_AMOUNT or CONFIRM_VIEW. ConfirmPage was deleted
// when the two checkout screens merged, so confirm.view no longer
// fires, and select.amount only ever fired in the mock select flow
// (the API provider hardcodes checkout_mode='preset').
//
// Leaving it in place would have been worse than useless. The walk
// below breaks on the first miss because the funnel is monotonic, so
// a step that can never be hit zeroes every step beneath it: the
// funnel would have read 12/12/0/0/0 the morning section C deployed,
// with nothing actually wrong.
//
// Removing it is also the honest shape. After the merge there is no
// separate amount-selection action to measure | the platform sets the
// amount server-to-server at init and the user lands directly on the
// payment screen.
//
// COMPARING ACROSS THE BOUNDARY: historical sessions still carry
// confirm.view rows, and this ladder computes correctly over them,
// because all four remaining events existed before and after. But a
// step-3 drop measured before 20 August is not the same quantity as a
// step-3 drop after it. Treat 20 August as a boundary rather than
// reading straight across it.

export const FUNNEL_STEPS = [
  {
    key: 'session_init',
    label: 'Session started',
    description: 'Platform initialised a Remvo checkout session',
    matchEvent: EVENT_TYPES.SESSION_INIT,
  },
  {
    key: 'checkout_open',
    label: 'Checkout opened',
    description: 'User loaded the Remvo checkout URL',
    matchEvent: EVENT_TYPES.CHECKOUT_OPEN,
  },
  {
    key: 'payment_viewed',
    label: 'Payment viewed',
    description: 'User reached the bank transfer screen',
    matchEvent: EVENT_TYPES.PAYMENT_VIEW,
  },
  {
    key: 'payment_confirmed',
    label: 'Payment confirmed',
    description: 'Merchant webhook confirmed payment received',
    matchEvent: EVENT_TYPES.PAYMENT_CONFIRMED,
  },
];

// ─── Range helpers ───────────────────────────────────────────────

/**
 * Named range keys supported by the range picker + derivation.
 */
export const RANGE_KEYS = {
  TODAY: 'today',
  WEEK:  '7d',
  MONTH: '30d',
  CUSTOM: 'custom',
};

/**
 * Resolve a range key (plus optional custom start/end) into a
 * concrete {from, to, previousFrom, previousTo} window. Previous
 * window is the same duration immediately prior, used for delta
 * comparisons on the Overview screen.
 *
 * All timestamps are epoch ms for arithmetic; callers ISO-format
 * as needed for display.
 *
 * @param {string} rangeKey
 * @param {{ from?: string, to?: string }} [custom]
 * @returns {{ from: number, to: number, previousFrom: number, previousTo: number, durationMs: number }}
 */
export function resolveRange(rangeKey, custom) {
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  let from;
  let to;

  switch (rangeKey) {
    case RANGE_KEYS.TODAY: {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      from = start.getTime();
      to = now;
      break;
    }
    case RANGE_KEYS.WEEK:
      from = now - 7 * DAY;
      to = now;
      break;
    case RANGE_KEYS.MONTH:
      from = now - 30 * DAY;
      to = now;
      break;
    case RANGE_KEYS.CUSTOM: {
      if (!custom || !custom.from || !custom.to) {
        // Fallback to 7d if custom is incomplete
        from = now - 7 * DAY;
        to = now;
      } else {
        from = new Date(custom.from + 'T00:00:00').getTime();
        to = new Date(custom.to + 'T23:59:59').getTime();
      }
      break;
    }
    default:
      from = now - 7 * DAY;
      to = now;
  }

  const durationMs = to - from;
  return {
    from,
    to,
    previousFrom: from - durationMs,
    previousTo: from,
    durationMs,
  };
}

/**
 * Human label for a range key. Used for the range summary chip.
 */
export function rangeLabel(rangeKey, custom) {
  switch (rangeKey) {
    case RANGE_KEYS.TODAY: return 'Today';
    case RANGE_KEYS.WEEK:  return 'Last 7 days';
    case RANGE_KEYS.MONTH: return 'Last 30 days';
    case RANGE_KEYS.CUSTOM:
      if (custom?.from && custom?.to) {
        return `${custom.from} to ${custom.to}`;
      }
      return 'Custom range';
    default: return 'Last 7 days';
  }
}

// ─── Filtering helpers ───────────────────────────────────────────

/**
 * Filter an events array by a resolved range window.
 */
export function eventsInRange(events, { from, to }) {
  return events.filter(e => {
    const t = new Date(e.occurredAt).getTime();
    return t >= from && t <= to;
  });
}

// ─── Device attribution ──────────────────────────────────────────

/**
 * Event types that originate in the USER'S BROWSER, via
 * POST /v1/events from checkoutEventsClient.js. Their `device` is
 * computed from navigator.userAgent and is trustworthy.
 *
 * Everything absent from this set is recorded server-side and its
 * `device` is meaningless:
 *
 *   session.init      | recorded during POST /v1/checkout/initialize,
 *                       a server-to-server call from the platform's
 *                       backend. The user agent is the platform's
 *                       HTTP client, so classifyDevice returns
 *                       'desktop' for every session ever created.
 *   session.expired   | the expiry cron reads sessions.user_agent,
 *                       captured from that same request.
 *   session.failed    | recorded from the PSP webhook handler.
 *   payment.confirmed | recorded from the PSP webhook handler.
 *
 * Note that sessions.user_agent and sessions.user_ip_hash are named
 * for the user but hold the PLATFORM's values, for the same reason.
 * Worth knowing before reading them anywhere else.
 */
export const CLIENT_ORIGINATED_EVENTS = new Set([
  EVENT_TYPES.CHECKOUT_OPEN,
  EVENT_TYPES.SELECT_VIEW,
  EVENT_TYPES.SELECT_AMOUNT,
  EVENT_TYPES.CONFIRM_VIEW,
  EVENT_TYPES.CONFIRM_PROCEED,
  EVENT_TYPES.PAYMENT_VIEW,
  EVENT_TYPES.PAYMENT_COPY,
  EVENT_TYPES.PAYMENT_WAITING,
  EVENT_TYPES.COMPLETE_VIEW,
]);

/**
 * Normalise `device` across every event in a session.
 *
 * Device is a property of the session, not of each event row. One
 * user, one browser, one checkout. This reads the device from
 * browser-originated events and applies it to every event sharing
 * that sessionId, so server-recorded rows inherit the truth instead
 * of asserting 'desktop'.
 *
 * Returns a NEW array with new objects. Callers memoise on the input,
 * and mutating in place would make that memo lie.
 *
 * A session with no browser-originated events at all | the platform
 * initialised a checkout the user never opened | keeps whatever the
 * server recorded. There is nothing better to use, and those sessions
 * are exactly the ones a device filter cannot meaningfully classify.
 *
 * Where a session somehow carries two different client devices (the
 * user opened the link on a laptop and finished on a phone), the
 * earliest wins. Rare enough that consistency matters more than which
 * one is picked.
 *
 * @param {Array} events
 * @returns {Array} same events, device normalised per session
 */
export function resolveSessionDevices(events) {
  if (!Array.isArray(events) || events.length === 0) return events;

  // sessionId -> device, from the earliest client-originated event.
  const bySession = new Map();

  for (const e of events) {
    if (!CLIENT_ORIGINATED_EVENTS.has(e.event)) continue;
    if (!e.device) continue;

    const existing = bySession.get(e.sessionId);
    if (!existing) {
      bySession.set(e.sessionId, { device: e.device, at: e.occurredAt });
      continue;
    }
    if (new Date(e.occurredAt) < new Date(existing.at)) {
      bySession.set(e.sessionId, { device: e.device, at: e.occurredAt });
    }
  }

  if (bySession.size === 0) return events;

  return events.map((e) => {
    const resolved = bySession.get(e.sessionId);
    if (!resolved || resolved.device === e.device) return e;
    return { ...e, device: resolved.device };
  });
}

/**
 * Group events by their sessionId. Returns Map<sessionId, events[]>.
 * Events within each session are sorted by occurredAt ascending so
 * funnel progression reads correctly.
 */
export function groupBySession(events) {
  const map = new Map();
  for (const e of events) {
    const list = map.get(e.sessionId);
    if (list) {
      list.push(e);
    } else {
      map.set(e.sessionId, [e]);
    }
  }
  for (const list of map.values()) {
    list.sort((a, b) => new Date(a.occurredAt) - new Date(b.occurredAt));
  }
  return map;
}

// ─── Funnel derivation ───────────────────────────────────────────

/**
 * Compute funnel step counts for a given event set. Each step is
 * reached by a session if any matching event exists within that
 * session. A session that reaches step N implicitly reached 1..N-1
 * (monotonic), so we walk the ladder per session and mark the
 * furthest step reached.
 *
 * Returns an array aligned with FUNNEL_STEPS, each element:
 *   { key, label, count, pctOfStart, pctOfPrev, dropFromPrev }
 *
 * @param {Array} events
 * @returns {Array}
 */
export function computeFunnel(events) {
  const sessions = groupBySession(events);
  const counts = FUNNEL_STEPS.map(() => 0);

  for (const sessionEvents of sessions.values()) {
    const typesInSession = new Set(sessionEvents.map(e => e.event));
    for (let i = 0; i < FUNNEL_STEPS.length; i++) {
      const step = FUNNEL_STEPS[i];
      const matches = step.matchEvents || [step.matchEvent];
      const hit = matches.some(m => typesInSession.has(m));
      if (hit) counts[i] += 1;
      else break; // funnel is monotonic
    }
  }

  const start = counts[0] || 0;
  return FUNNEL_STEPS.map((step, i) => {
    const count = counts[i];
    const prev = i === 0 ? count : counts[i - 1];
    const pctOfStart = start > 0 ? (count / start) * 100 : 0;
    const pctOfPrev = prev > 0 ? (count / prev) * 100 : 0;
    const dropFromPrev = prev - count;
    return {
      key: step.key,
      label: step.label,
      description: step.description,
      count,
      pctOfStart,
      pctOfPrev,
      dropFromPrev,
    };
  });
}

// ─── Overview metrics ────────────────────────────────────────────

/**
 * Aggregate a window of events + transactions into a single summary
 * for the Overview tab's cockpit cards.
 *
 * @param {{ events: Array, transactions: Array, range: object }} input
 * @returns {{
 *   sessionsStarted: number,
 *   sessionsConfirmed: number,
 *   conversionRate: number,
 *   volumeUsd: number,
 *   volumeNaira: number,
 *   revenueUsd: number,
 *   avgSessionUsd: number,
 *   expiredCount: number,
 *   failedCount: number,
 * }}
 */
export function computeOverview({ events, transactions, range }) {
  const scopedEvents = eventsInRange(events, range);
  const scopedTxns = transactions.filter(t => {
    const t0 = new Date(t.createdAt).getTime();
    return t0 >= range.from && t0 <= range.to;
  });

  const sessions = groupBySession(scopedEvents);
  const sessionsStarted = sessions.size;
  let sessionsConfirmed = 0;
  let expiredCount = 0;
  let failedCount = 0;

  for (const list of sessions.values()) {
    const types = new Set(list.map(e => e.event));
    if (types.has(EVENT_TYPES.PAYMENT_CONFIRMED)) sessionsConfirmed++;
    if (types.has(EVENT_TYPES.SESSION_EXPIRED)) expiredCount++;
    if (types.has(EVENT_TYPES.SESSION_FAILED)) failedCount++;
  }

  const volumeUsd = scopedTxns
    .filter(t => t.status === 'confirmed')
    .reduce((sum, t) => sum + (t.amountUsdCard || 0), 0);
  const volumeNaira = scopedTxns
    .filter(t => t.status === 'confirmed')
    .reduce((sum, t) => sum + (t.userPaysNaira || 0), 0);
  const revenueUsd = scopedTxns
    .filter(t => t.status === 'confirmed')
    .reduce((sum, t) => sum + (t.platformFeeUsd || 0), 0);

  const avgSessionUsd = sessionsConfirmed > 0
    ? volumeUsd / sessionsConfirmed
    : 0;
  const conversionRate = sessionsStarted > 0
    ? (sessionsConfirmed / sessionsStarted) * 100
    : 0;

  return {
    sessionsStarted,
    sessionsConfirmed,
    conversionRate,
    volumeUsd,
    volumeNaira,
    revenueUsd,
    avgSessionUsd,
    expiredCount,
    failedCount,
  };
}

// ─── Trend series ────────────────────────────────────────────────

/**
 * Bucket events into time-bucketed counts for a trend line. Bucket
 * granularity is auto-selected based on range duration:
 *   ≤ 1 day   → 24 hourly buckets
 *   ≤ 7 days  → 7 daily buckets
 *   ≤ 31 days → 31 daily buckets
 *   > 31 days → weekly buckets
 *
 * Each bucket yields { t, count, volumeUsd }. Missing buckets are
 * zero-filled so the trend line is continuous.
 *
 * @param {object} input
 * @param {Array} input.events
 * @param {Array} input.transactions
 * @param {object} input.range       resolved range window
 * @param {string} [input.eventType] only count events matching this type
 * @returns {Array}
 */
export function computeTrend({ events, transactions, range, eventType }) {
  const HOUR = 60 * 60 * 1000;
  const DAY  = 24 * HOUR;
  const durationMs = range.to - range.from;

  let bucketMs;
  let bucketCount;
  if (durationMs <= DAY + HOUR) {
    bucketMs = HOUR;
    bucketCount = 24;
  } else if (durationMs <= 7 * DAY + HOUR) {
    bucketMs = DAY;
    bucketCount = 7;
  } else if (durationMs <= 31 * DAY + HOUR) {
    bucketMs = DAY;
    bucketCount = 31;
  } else {
    bucketMs = 7 * DAY;
    bucketCount = Math.ceil(durationMs / bucketMs);
  }

  const buckets = [];
  for (let i = 0; i < bucketCount; i++) {
    buckets.push({
      t: range.from + i * bucketMs,
      count: 0,
      volumeUsd: 0,
    });
  }

  const indexFor = (t) => {
    const idx = Math.floor((t - range.from) / bucketMs);
    if (idx < 0 || idx >= bucketCount) return -1;
    return idx;
  };

  for (const e of events) {
    if (eventType && e.event !== eventType) continue;
    const t = new Date(e.occurredAt).getTime();
    const i = indexFor(t);
    if (i >= 0) buckets[i].count += 1;
  }

  for (const txn of transactions) {
    if (txn.status !== 'confirmed') continue;
    const t = new Date(txn.createdAt).getTime();
    const i = indexFor(t);
    if (i >= 0) buckets[i].volumeUsd += (txn.amountUsdCard || 0);
  }

  return buckets;
}

// ─── Per-platform rollup ─────────────────────────────────────────

/**
 * Group metrics by platform for the Platforms tab. Each row holds
 * the platform's session count, conversion rate, volume, revenue
 * contribution, and country breakdown.
 *
 * @param {object} input
 * @param {Array} input.events
 * @param {Array} input.transactions
 * @param {Array} input.platforms    platform config array (for names)
 * @param {object} input.range
 */
export function computePlatformRollup({ events, transactions, platforms, range }) {
  const scopedEvents = eventsInRange(events, range);
  const scopedTxns = transactions.filter(t => {
    const t0 = new Date(t.createdAt).getTime();
    return t0 >= range.from && t0 <= range.to;
  });

  const byPlatform = new Map();

  function ensure(platformId) {
    let row = byPlatform.get(platformId);
    if (!row) {
      const meta = platforms.find(p => p.id === platformId);
      row = {
        platformId,
        platformName: meta?.name || platformId,
        sessionsStarted: 0,
        sessionsConfirmed: 0,
        conversionRate: 0,
        volumeUsd: 0,
        volumeNaira: 0,
        revenueUsd: 0,
        byCountry: new Map(),
      };
      byPlatform.set(platformId, row);
    }
    return row;
  }

  // Sessions + confirms from events
  const sessions = groupBySession(scopedEvents);
  for (const list of sessions.values()) {
    const first = list[0];
    if (!first) continue;
    const row = ensure(first.platformId);
    row.sessionsStarted += 1;

    const types = new Set(list.map(e => e.event));
    if (types.has(EVENT_TYPES.PAYMENT_CONFIRMED)) {
      row.sessionsConfirmed += 1;
    }

    // Country tally
    const country = first.countryCode || 'XX';
    row.byCountry.set(country, (row.byCountry.get(country) || 0) + 1);
  }

  // Volume / revenue from transactions (authoritative for money)
  for (const t of scopedTxns) {
    if (t.status !== 'confirmed') continue;
    const row = ensure(t.platformId);
    row.volumeUsd += (t.amountUsdCard || 0);
    row.volumeNaira += (t.userPaysNaira || 0);
    row.revenueUsd += (t.platformFeeUsd || 0);
  }

  // Post-process
  const rows = Array.from(byPlatform.values()).map(row => {
    row.conversionRate = row.sessionsStarted > 0
      ? (row.sessionsConfirmed / row.sessionsStarted) * 100
      : 0;
    row.byCountry = Array.from(row.byCountry.entries())
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count);
    return row;
  });

  rows.sort((a, b) => b.volumeUsd - a.volumeUsd);
  return rows;
}

// ─── Device bucketing ────────────────────────────────────────────

/**
 * Classify a user agent string into mobile / desktop / tablet. Used
 * server-side for event tagging; pure function for testability.
 */
export function classifyDevice(userAgent) {
  if (!userAgent) return 'desktop';
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet/.test(ua)) return 'tablet';
  if (/mobi|android|iphone|ipod/.test(ua)) return 'mobile';
  return 'desktop';
}

// ─── Formatters ──────────────────────────────────────────────────
//
// Kept here (not in formatUsd/formatNaira) because analytics displays
// have different precision needs: compact for cockpit cards, precise
// for tables. These never replace the existing formatters; they
// complement them for this screen only.

export function formatPercent(value, digits = 1) {
  if (value == null || Number.isNaN(value)) return '—';
  if (value >= 100) return '100%';
  return value.toFixed(digits) + '%';
}

export function formatUsdCompact(value) {
  if (value == null || Number.isNaN(value)) return '$0';
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return '$' + (value / 1_000_000).toFixed(1) + 'M';
  if (abs >= 10_000)    return '$' + (value / 1_000).toFixed(1) + 'k';
  if (abs >= 1_000)     return '$' + (value / 1_000).toFixed(2) + 'k';
  return '$' + Math.round(value).toLocaleString('en-US');
}

export function formatNairaCompact(value) {
  if (value == null || Number.isNaN(value)) return '\u20A60';
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return '\u20A6' + (value / 1_000_000).toFixed(1) + 'M';
  if (abs >= 10_000)    return '\u20A6' + (value / 1_000).toFixed(0) + 'k';
  return '\u20A6' + Math.round(value).toLocaleString('en-US');
}

/**
 * Delta comparison between current-period and previous-period values.
 *
 * Guards against the misleading case where the previous period has
 * zero or near-zero data. A naive `(current - previous) / previous`
 * produces "+3700%" from trivial bases, which looks broken rather
 * than informative. We suppress the delta in that case and surface
 * a neutral "new period" tag instead.
 *
 * The minBase parameter controls this threshold. Default is 3 —
 * below 3 prior samples, the comparison is statistically meaningless.
 * Callers comparing counts (sessions, failures) should pass 3;
 * callers comparing monetary values can pass a higher floor.
 *
 * Returns null when there is simply nothing to compare (both zero).
 *
 * @param {number} current
 * @param {number} previous
 * @param {number} [minBase=3]
 * @returns {{ sign: 'up'|'down'|'flat'|'new', text: string, pct: number|null } | null}
 */
export function formatDelta(current, previous, minBase = 3) {
  const prev = previous || 0;
  const curr = current || 0;

  // Both zero: nothing to show, not even a badge.
  if (prev === 0 && curr === 0) return null;

  // Previous below the meaningful-sample threshold. Comparing a
  // 38-session current window against a 1-session prior window
  // produces arithmetically correct but operationally useless
  // percentages. Surface "new period" instead.
  if (prev < minBase) {
    return { sign: 'new', text: 'new period', pct: null };
  }

  const delta = curr - prev;
  const pct = (delta / prev) * 100;
  if (Math.abs(pct) < 0.5) return { sign: 'flat', text: 'flat', pct: 0 };

  return {
    sign: pct > 0 ? 'up' : 'down',
    text: (pct > 0 ? '+' : '') + pct.toFixed(1) + '%',
    pct,
  };
}
