/* ──────────────────────────────────────────────────────────────────
 * lib/sellerJobs.js
 *
 * The seller's listings, from remvo-api (/v1/my/jobs). One small store
 * per signed-in account, shared by every screen through useSellerData().
 *
 *   refresh   the newest 20 (more with loadMore)
 *   watch     a job still being made is polled every second until it
 *             is ready or failed, so a seller who leaves the progress
 *             screen still sees it finish in Listings
 *   create    the credits are taken by the API; a 402 becomes
 *             NotEnoughCredits, a 409 the products to pick from
 *   edit      shown at once, saved behind; put back if the save fails
 *
 * The wallet is refreshed whenever a job is made or fails, because
 * both move credits.
 * ────────────────────────────────────────────────────────────────── */

import { sellerApi, SellerApiError } from '@lib/sellerApi';

let state = { accountId: null, status: 'idle', jobs: [], next: null, error: null };
const listeners = new Set();
// Listings deleted but still inside their Undo window: hidden from every
// list, whatever the server sends back meanwhile (see removeSoon).
const pending = new Map();
const set = (patch) => {
  const p = patch.jobs && pending.size ? { ...patch, jobs: patch.jobs.filter((j) => !pending.has(j.id)) } : patch;
  state = { ...state, ...p };
  listeners.forEach((l) => l());
};

export const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
export const getState = () => state;

const POLL_MS = 1000;
const watching = new Map();
let onMoney = () => {};

/** Called when credits may have moved (a job made, or failed and returned). */
export function onCreditsMoved(fn) { onMoney = fn; }

const finished = (j) => j.status === 'ready' || j.status === 'failed';

function put(job) {
  if (state.accountId == null) return;
  const i = state.jobs.findIndex((j) => j.id === job.id);
  const jobs = i < 0 ? [job, ...state.jobs] : state.jobs.map((j) => (j.id === job.id ? job : j));
  jobs.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
  set({ jobs });
}

let inflight = null;

export function refresh(accountId) {
  if (!accountId) return Promise.resolve();
  if (state.accountId !== accountId) {
    stopAll();
    set({ accountId, status: 'loading', jobs: [], next: null, error: null });
  }
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const page = await sellerApi.jobs();
      if (state.accountId !== accountId) return;
      // Keep any older pages already loaded; the first page replaces its own.
      const fresh = new Set(page.items.map((j) => j.id));
      const older = state.jobs.filter((j) => !fresh.has(j.id) && page.items.length && j.createdAt < page.items.at(-1).createdAt);
      set({ status: 'ready', jobs: [...page.items, ...older], next: older.length ? state.next : page.next, error: null });
      page.items.filter((j) => !finished(j)).forEach((j) => watch(j.id));
    } catch (err) {
      if (state.accountId === accountId) set({ status: state.jobs.length ? 'ready' : 'error', error: err });
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export async function loadMore() {
  if (!state.next) return;
  const page = await sellerApi.jobs(state.next);
  const have = new Set(state.jobs.map((j) => j.id));
  set({ jobs: [...state.jobs, ...page.items.filter((j) => !have.has(j.id))], next: page.next });
}

/** One job: from the store, or fetched (a link opened straight to it). */
export async function fetchJob(id) {
  const { job } = await sellerApi.job(id);
  put(job);
  if (!finished(job)) watch(job.id);
  return job;
}

/**
 * Poll a job until it is finished. Listeners on the job (the progress
 * screen) hear each step. Returns the finished job.
 */
export function watch(id, onUpdate = null) {
  let w = watching.get(id);
  if (!w) {
    w = { listeners: new Set(), promise: null, stop: false };
    watching.set(id, w);
    w.promise = (async () => {
      let misses = 0;
      for (;;) {
        if (w.stop) return null;
        try {
          const { job } = await sellerApi.job(id);
          misses = 0;
          put(job);
          w.listeners.forEach((fn) => fn(job));
          if (finished(job)) {
            if (job.status === 'failed') onMoney();
            return job;
          }
        } catch (err) {
          // A dropped connection is waited out; a job that is gone, or a session that ended, is not.
          if (err instanceof SellerApiError && (err.status === 404 || err.status === 401)) return null;
          misses += 1;
          if (misses > 30) throw err;
        }
        await new Promise((r) => setTimeout(r, POLL_MS));
      }
    })().finally(() => watching.delete(id));
  }
  if (onUpdate) w.listeners.add(onUpdate);
  return w.promise;
}

function stopAll() {
  for (const w of watching.values()) w.stop = true;
  watching.clear();
}

export class NotEnoughCredits extends Error {
  constructor(message) { super(message); this.name = 'NotEnoughCredits'; }
}

export class PickNeeded extends Error {
  constructor(matches) { super('Pick a product'); this.name = 'PickNeeded'; this.matches = matches; }
}

/** What an input is and, for a barcode, what it finds. Free. */
export const lookUp = (input, marketplace) => sellerApi.lookUp({ input, ...(marketplace ? { marketplace } : {}) });

/**
 * Make a listing. onUpdate hears the job as it goes. Resolves with the
 * finished job.
 */
export async function create({ input, asin = null, condition }, onUpdate = null) {
  let job;
  try {
    ({ job } = await sellerApi.createJob({ input, condition, ...(asin ? { asin } : {}) }));
  } catch (err) {
    if (err instanceof SellerApiError && err.code === 'not_enough_credits') throw new NotEnoughCredits(err.message);
    if (err instanceof SellerApiError && err.code === 'match_required') throw new PickNeeded(err.details?.matches ?? []);
    throw err;
  }
  put(job);
  onMoney();
  onUpdate?.(job);
  return watch(job.id, onUpdate);
}

/** Save one edit; value null puts the field back. */
export async function edit(id, field, value) {
  const before = state.jobs.find((j) => j.id === id);
  if (before) {
    const edits = { ...before.edits };
    if (value === null) delete edits[field]; else edits[field] = value;
    put({ ...before, edits });
  }
  try {
    const { job } = await sellerApi.editJob(id, field, value);
    put(job);
    return job;
  } catch (err) {
    if (before) put(before);
    throw err;
  }
}

export async function remove(id) {
  await sellerApi.deleteJob(id);
  set({ jobs: state.jobs.filter((j) => j.id !== id) });
}

/**
 * Delete with Undo: the listing leaves every list at once; commit()
 * deletes it on the server (the caller calls it when the Undo offer
 * closes), undo() puts it back where it was. If neither comes within
 * `ms` it commits on its own, and leaving the page commits at once
 * (keepalive carries the request past the unload). If the server
 * refuses, the listing comes back and onFail says so.
 */
export function removeSoon(id, ms, onFail = () => {}) {
  const job = state.jobs.find((j) => j.id === id) ?? null;
  const commit = () => {
    const p = pending.get(id);
    if (!p || p.sent) return;
    p.sent = true;
    clearTimeout(p.timer);
    sellerApi.deleteJob(id, { keepalive: true })
      .then(() => { pending.delete(id); })
      .catch((err) => {
        pending.delete(id);
        if (err.status === 404) return; // already gone
        if (job) put(job);
        onFail(err);
      });
  };
  pending.set(id, { timer: setTimeout(commit, ms), commit, sent: false });
  set({ jobs: state.jobs.filter((j) => j.id !== id) });
  return {
    commit,
    undo() {
      const p = pending.get(id);
      if (!p || p.sent) return false;
      clearTimeout(p.timer);
      pending.delete(id);
      if (job) put(job);
      return true;
    },
  };
}

/** Send every delete still waiting (the page is going away). */
export function flushDeletes() {
  for (const p of [...pending.values()]) p.commit();
}

if (typeof window !== 'undefined') window.addEventListener('pagehide', flushDeletes);

export function clear() {
  stopAll();
  set({ accountId: null, status: 'idle', jobs: [], next: null, error: null });
}
