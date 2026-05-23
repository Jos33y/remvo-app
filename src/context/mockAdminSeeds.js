/* ──────────────────────────────────────────────────────────────────
 * Mock admin seed data
 *
 * Pure module. Every export is a function or a constant. No React,
 * no hooks, no state. Called once by MockAdminProvider on first
 * mount to populate localStorage; subsequent mounts read from
 * storage and skip generation.
 *
 * Seed state follows MERCHANT_ARCHITECTURE section 12 (day-one
 * configuration for GE-AS) exactly. Transactions and settlements
 * are generated with pseudo-random distributions matching real
 * checkout behaviour.
 *
 * Transaction status mix (73/17/10) is calibrated so the
 * Transactions screen has enough failures to visually verify the
 * error state without drowning the interface in red.
 * ────────────────────────────────────────────────────────────────── */

const DENOMINATIONS = [10, 25, 50, 100, 250];
const DENOMINATION_WEIGHTS = [0.28, 0.34, 0.20, 0.12, 0.06]; // smaller amounts more common

const STATUS_MIX = [
  { status: 'confirmed', weight: 0.73 },
  { status: 'pending',   weight: 0.17 },
  { status: 'failed',    weight: 0.10 },
];

const PLATFORMS_BANK_OPTIONS = [
  { bankName: 'Wema Bank',        accountNumber: '7123456789' },
  { bankName: 'GTBank',           accountNumber: '0123456789' },
  { bankName: 'Access Bank',      accountNumber: '0234567891' },
  { bankName: 'Zenith Bank',      accountNumber: '1234567890' },
];

// ─── Helpers ─────────────────────────────────────────────────────

function weightedPick(items, weights) {
  const roll = Math.random();
  let acc = 0;
  for (let i = 0; i < items.length; i++) {
    acc += weights[i];
    if (roll < acc) return items[i];
  }
  return items[items.length - 1];
}

function weightedPickObj(mix) {
  const roll = Math.random();
  let acc = 0;
  for (const entry of mix) {
    acc += entry.weight;
    if (roll < acc) return entry.status;
  }
  return mix[mix.length - 1].status;
}

function randomId(length = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

function hoursAgo(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

// ─── Operators ───────────────────────────────────────────────────

export function seedOperators() {
  const now = new Date().toISOString();
  return [
    {
      id: 1,
      email: 'joseey@brickdevstudios.com',
      displayName: 'Joseey',
      avatarInitials: 'J',
      role: 'owner',
      isActive: true,
      invitedAt: hoursAgo(24 * 30),
      invitedBy: null,
      firstLoginAt: hoursAgo(24 * 30),
      lastLoginAt: now,
      createdAt: hoursAgo(24 * 30),
      updatedAt: now,
    },
    {
      id: 2,
      email: 'operator-b@remvolabs.com',
      displayName: 'Operator B',
      avatarInitials: 'OB',
      role: 'operator',
      isActive: true,
      invitedAt: hoursAgo(24 * 14),
      invitedBy: 1,
      firstLoginAt: hoursAgo(24 * 14),
      lastLoginAt: hoursAgo(6),
      createdAt: hoursAgo(24 * 14),
      updatedAt: hoursAgo(6),
    },
  ];
}

// ─── Merchants ───────────────────────────────────────────────────

export function seedMerchants() {
  const now = new Date().toISOString();
  return [
    {
      id: 'kora',
      displayName: 'Kora',
      type: 'deposit',
      supportedCountries: ['NG'],
      supportedMethods: ['bank_transfer'],
      capabilities: { bank_transfer: { webhooks: true, instantConfirmation: true } },
      status: 'active',
      apiBaseUrl: 'https://api.korapay.com',
      webhookUrl: 'https://api.remvo.app/v1/webhooks/kora',
      createdAt: hoursAgo(24 * 60),
      updatedAt: now,
    },
    {
      id: 'monnify',
      displayName: 'Monnify',
      type: 'both',
      supportedCountries: ['NG'],
      supportedMethods: ['bank_transfer'],
      capabilities: { bank_transfer: { webhooks: true, instantConfirmation: true } },
      status: 'paused',
      apiBaseUrl: 'https://api.monnify.com',
      webhookUrl: 'https://api.remvo.app/v1/webhooks/monnify',
      createdAt: hoursAgo(24 * 60),
      updatedAt: now,
    },
    {
      id: 'paystack',
      displayName: 'Paystack',
      type: 'both',
      supportedCountries: ['NG'],
      supportedMethods: ['bank_transfer', 'card', 'ussd'],
      capabilities: {
        bank_transfer: { webhooks: true, instantConfirmation: true },
        card: { webhooks: true, instantConfirmation: false },
        ussd: { webhooks: true, instantConfirmation: false },
      },
      status: 'paused',
      apiBaseUrl: 'https://api.paystack.co',
      webhookUrl: 'https://api.remvo.app/v1/webhooks/paystack',
      createdAt: hoursAgo(24 * 60),
      updatedAt: now,
    },
  ];
}

// ─── Corridors ───────────────────────────────────────────────────

export function seedCorridors() {
  const now = new Date().toISOString();
  return [
    {
      id: 'cor_ng_dep_sol',
      countryCode: 'NG',
      sourceCurrency: 'NGN',
      sourceMethod: 'bank_transfer',
      destinationAsset: 'USDT',
      destinationNetwork: 'solana',
      direction: 'deposit',
      status: 'active',
      minDepositUsd: 10,
      maxDepositUsd: 1000,
      createdAt: hoursAgo(24 * 60),
      updatedAt: now,
    },
  ];
}

export function seedCorridorMerchants() {
  const now = new Date().toISOString();
  return [
    {
      id: 1,
      corridorId: 'cor_ng_dep_sol',
      merchantId: 'kora',
      status: 'active',
      isPreferred: true,
      priority: 1,
      createdBy: 1,
      createdAt: hoursAgo(24 * 60),
      updatedAt: now,
    },
    {
      id: 2,
      corridorId: 'cor_ng_dep_sol',
      merchantId: 'paystack',
      status: 'active',
      isPreferred: false,
      priority: 2,
      createdBy: 1,
      createdAt: hoursAgo(24 * 60),
      updatedAt: now,
    },
  ];
}

// ─── Platforms ───────────────────────────────────────────────────

export function seedPlatforms() {
  const now = new Date().toISOString();
  return [
    {
      id: 'geas',
      displayName: 'GE-AS',
      apiKeyRef: 'infisical://remvo/platforms/geas/api_key',
      webhookUrl: 'https://ge-as.com/api/webhooks/remvo',
      settlementMode: 'batch',
      settlementWalletSolana: '7xKp2B4fA8dMnQr5VyXwJk9LzHcTgE3NvRsUaYbCdPeF',
      skimPercent: 2.0,
      countries: {
        NG: {
          status: 'active',
          activatedAt: hoursAgo(24 * 30),
          activeMerchants: ['kora', 'paystack'],
          preferredMerchant: 'kora',
        },
        GH: { status: 'coming_soon' },
        KE: { status: 'coming_soon' },
        UG: { status: 'coming_soon' },
        ZA: { status: 'coming_soon' },
        EG: { status: 'coming_soon' },
        TZ: { status: 'coming_soon' },
        CI: { status: 'coming_soon' },
      },
      createdAt: hoursAgo(24 * 60),
      updatedAt: now,
    },
  ];
}

// ─── Rate engine ─────────────────────────────────────────────────

export function seedRateSources() {
  return [
    {
      id: 'manual',
      priority: 1,
      isActive: true,
      config: null,
      lastUsedAt: hoursAgo(4),
    },
    {
      id: 'coingecko',
      priority: 2,
      isActive: true,
      config: { bufferNaira: 50 },
      lastReading: {
        midRate: 1330.0,
        fetchedAt: new Date(Date.now() - 30 * 1000).toISOString(),
      },
      lastUsedAt: hoursAgo(2),
    },
    {
      id: 'p2p_army',
      priority: 3,
      isActive: false,
      config: null,
      lastUsedAt: null,
    },
  ];
}

export function seedRateEntries() {
  const now = Date.now();
  const H = 60 * 60 * 1000;
  const D = 24 * H;

  /* Current active entry (matches the one on the dashboard) plus
   * five historical entries so the history table has material on
   * first load. Each past entry is either expired (older than 24h
   * from enteredAt) or replaced (superseded before it expired). */
  const entries = [
    {
      id: 6,
      fiatCurrency: 'NGN',
      asset: 'USDT',
      buyRate: 1380.00,
      notes: 'Morning rate, matches Bitget P2P 08:00 trade',
      enteredBy: 1,
      enteredAt: new Date(now - 4 * H).toISOString(),
      expiresAt: new Date(now - 4 * H + D).toISOString(),
      isActive: true,
    },
    {
      id: 5,
      fiatCurrency: 'NGN',
      asset: 'USDT',
      buyRate: 1374.50,
      notes: 'Late evening, Quidax spread widened',
      enteredBy: 2,
      enteredAt: new Date(now - 18 * H).toISOString(),
      expiresAt: new Date(now - 18 * H + D).toISOString(),
      isActive: false,
    },
    {
      id: 4,
      fiatCurrency: 'NGN',
      asset: 'USDT',
      buyRate: 1368.00,
      notes: null,
      enteredBy: 1,
      enteredAt: new Date(now - 32 * H).toISOString(),
      expiresAt: new Date(now - 32 * H + D).toISOString(),
      isActive: false,
    },
    {
      id: 3,
      fiatCurrency: 'NGN',
      asset: 'USDT',
      buyRate: 1365.00,
      notes: 'Bybit P2P trend up, matched top of book',
      enteredBy: 2,
      enteredAt: new Date(now - 2 * D - 6 * H).toISOString(),
      expiresAt: new Date(now - 2 * D - 6 * H + D).toISOString(),
      isActive: false,
    },
    {
      id: 2,
      fiatCurrency: 'NGN',
      asset: 'USDT',
      buyRate: 1372.00,
      notes: 'Gate.io settlement rate',
      enteredBy: 1,
      enteredAt: new Date(now - 3 * D - 2 * H).toISOString(),
      expiresAt: new Date(now - 3 * D - 2 * H + D).toISOString(),
      isActive: false,
    },
    {
      id: 1,
      fiatCurrency: 'NGN',
      asset: 'USDT',
      buyRate: 1360.00,
      notes: 'Week open, conservative anchor',
      enteredBy: 2,
      enteredAt: new Date(now - 4 * D - 5 * H).toISOString(),
      expiresAt: new Date(now - 4 * D - 5 * H + D).toISOString(),
      isActive: false,
    },
  ];

  return entries;
}

// ─── Wallet ──────────────────────────────────────────────────────

export function seedWallet() {
  return {
    balanceUsdt: 4212.50,
    thresholdUsdt: 200,
    lastFundedAt: hoursAgo(4),
    network: 'solana',
    address: '7xKp2B4fA8dMnQr5VyXwJk9LzHcTgE3NvRsUaYbCdPeF',
  };
}

// ─── Transactions ────────────────────────────────────────────────

export function seedTransactions() {
  const transactions = [];
  const now = Date.now();

  for (let i = 0; i < 30; i++) {
    const status = weightedPickObj(STATUS_MIX);
    const denomination = weightedPick(DENOMINATIONS, DENOMINATION_WEIGHTS);
    const bank = PLATFORMS_BANK_OPTIONS[Math.floor(Math.random() * PLATFORMS_BANK_OPTIONS.length)];

    // Distribute across last 7 days, weighted toward recent
    const hoursBack = Math.floor(Math.pow(Math.random(), 1.5) * 24 * 7);
    const createdAt = new Date(now - hoursBack * 60 * 60 * 1000);

    const baseSpread = 8 + Math.random() * 2;
    const totalPct = baseSpread + 1.0;
    const p2pRate = 1380;
    const effectiveRate = p2pRate * (1 + totalPct / 100);
    const userPaysNaira = Math.ceil(denomination * effectiveRate);
    const displayRate = Math.round(effectiveRate);

    const platformFeeUsd = Number((denomination * 0.01).toFixed(2));
    const amountUsdSettled = Number((denomination - platformFeeUsd).toFixed(2));

    const merchantId = Math.random() > 0.15 ? 'kora' : 'paystack';

    let confirmedAt = null;
    let settlementBatchId = null;
    if (status === 'confirmed') {
      confirmedAt = new Date(createdAt.getTime() + (30 + Math.random() * 120) * 1000).toISOString();
      if (hoursBack > 24) {
        settlementBatchId = `bat_${randomId(6)}`;
      }
    }

    transactions.push({
      id: `txn_${randomId(8)}`,
      sessionId: `cs_${randomId(12)}`,
      reference: `RMV-${new Date(createdAt).getFullYear()}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}-${randomId(4).toUpperCase()}`,
      platformId: 'geas',
      platformUserId: `user_${randomId(6)}`,
      corridorId: 'cor_ng_dep_sol',
      merchantId,

      amountUsdCard: denomination,
      amountUsdCredited: denomination,
      amountUsdSettled,
      platformFeeUsd,

      userPaysNaira,
      p2pRateAtLock: p2pRate,
      baseSpreadPct: Number(baseSpread.toFixed(2)),
      totalPct: Number(totalPct.toFixed(2)),
      effectiveRateFull: Number(effectiveRate.toFixed(6)),
      displayRate,

      rateSource: Math.random() > 0.3 ? 'manual' : 'coingecko',
      rateSourceId: Math.random() > 0.3 ? 1 : null,
      rateSourceStale: false,

      bankName: bank.bankName,
      accountNumber: bank.accountNumber,
      accountName: 'Remvo Labs Limited',

      status,
      createdAt: createdAt.toISOString(),
      lockedAt: createdAt.toISOString(),
      expiresAt: new Date(createdAt.getTime() + 15 * 60 * 1000).toISOString(),
      paymentExpiresAt: status !== 'pending' ? new Date(createdAt.getTime() + 30 * 60 * 1000).toISOString() : null,
      confirmedAt,
      settlementBatchId,
    });
  }

  // Sort newest first
  transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return transactions;
}

// ─── Settlements ─────────────────────────────────────────────────

export function seedSettlements(transactions) {
  const settlements = [];

  // Derive batch IDs already assigned to transactions
  const assignedBatches = new Set();
  transactions.forEach(t => {
    if (t.settlementBatchId) assignedBatches.add(t.settlementBatchId);
  });

  let idx = 0;
  for (const batchId of assignedBatches) {
    const batchTxns = transactions.filter(t => t.settlementBatchId === batchId);
    if (batchTxns.length === 0) continue;

    const totalUsd = batchTxns.reduce((sum, t) => sum + t.amountUsdSettled, 0);
    const daysAgo = idx + 1;
    const triggeredAt = hoursAgo(24 * daysAgo);

    settlements.push({
      id: batchId,
      status: 'completed',
      platformId: 'geas',
      transactionCount: batchTxns.length,
      totalUsdSettled: Number(totalUsd.toFixed(2)),
      totalFeeUsd: Number((totalUsd * 0.01).toFixed(2)),
      triggeredBy: 1,
      triggeredAt,
      completedAt: new Date(new Date(triggeredAt).getTime() + 15 * 60 * 1000).toISOString(),
      solTxHash: randomId(44),
    });
    idx++;
  }

  // Ensure we have exactly 4 completed + 1 pending
  while (settlements.length < 4) {
    const filler = {
      id: `bat_${randomId(6)}`,
      status: 'completed',
      platformId: 'geas',
      transactionCount: 4 + Math.floor(Math.random() * 4),
      totalUsdSettled: Number((120 + Math.random() * 280).toFixed(2)),
      totalFeeUsd: Number((1.20 + Math.random() * 2.80).toFixed(2)),
      triggeredBy: 1,
      triggeredAt: hoursAgo(24 * (settlements.length + 1)),
      completedAt: hoursAgo(24 * (settlements.length + 1) - 0.25),
      solTxHash: randomId(44),
    };
    settlements.push(filler);
  }

  // Add the pending batch (today, not triggered yet)
  const pendingTxns = transactions.filter(t => t.status === 'confirmed' && !t.settlementBatchId);
  if (pendingTxns.length > 0) {
    const pendingTotal = pendingTxns.reduce((sum, t) => sum + t.amountUsdSettled, 0);
    settlements.push({
      id: `bat_pending_${randomId(4)}`,
      status: 'pending',
      platformId: 'geas',
      transactionCount: pendingTxns.length,
      totalUsdSettled: Number(pendingTotal.toFixed(2)),
      totalFeeUsd: Number((pendingTotal * 0.01).toFixed(2)),
      triggeredBy: null,
      triggeredAt: null,
      completedAt: null,
      solTxHash: null,
    });
  }

  settlements.sort((a, b) => {
    if (a.status === 'pending') return -1;
    if (b.status === 'pending') return 1;
    return new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime();
  });

  return settlements;
}

// ─── Audit log ───────────────────────────────────────────────────

export function seedAuditLog() {
  // Empty at go-live per MERCHANT section 12. Populated as operators
  // perform actions during the walkthrough.
  return [];
}

// ─── Full seed ───────────────────────────────────────────────────

export function generateFullSeed() {
  const transactions = seedTransactions();
  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    operators: seedOperators(),
    merchants: seedMerchants(),
    corridors: seedCorridors(),
    corridorMerchants: seedCorridorMerchants(),
    platforms: seedPlatforms(),
    rateSources: seedRateSources(),
    rateEntries: seedRateEntries(),
    wallet: seedWallet(),
    transactions,
    settlements: seedSettlements(transactions),
    auditLog: seedAuditLog(),
    nextAuditId: 1,
  };
}
