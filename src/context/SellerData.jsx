import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import { useSellerSession } from '@context/SellerSession';
import * as walletStore from '@lib/sellerWallet';
import * as jobStore from '@lib/sellerJobs';
import { sellerApi } from '@lib/sellerApi';
import { money } from '@lib/market';
import { PRICING } from '@utils/constants';

/* ──────────────────────────────────────────────────────────────────
 * useSellerData()
 *
 * Everything a signed-in screen shows, bound to who is signed in.
 * Screens read from here and never from the libraries directly.
 *
 *   Wallet    balance, history, settings and top-ups, from remvo-api
 *             (lib/sellerWallet.js); a top-up goes to Polar's checkout.
 *   Listings  from remvo-api (lib/sellerJobs.js). Making one takes the
 *             credits; a failed one gives them back.
 * ────────────────────────────────────────────────────────────────── */

// Whenever a job moves credits, the wallet is read again.
jobStore.onCreditsMoved(() => {
  const { accountId } = walletStore.getState();
  if (accountId) walletStore.refresh(accountId);
});

/** A ledger row from the API, worded for the history list. */
function labelFor(row) {
  const paid = row.amountCents != null && row.currency ? money(row.amountCents / 100, row.currency) : null;
  switch (row.kind) {
    // A 100% discount code pays nothing: say so, not "Top-up $0".
    case 'topup': return row.amountCents === 0 ? 'Top-up, free with a code' : paid ? `Top-up ${paid}` : 'Top-up';
    case 'refund': return paid ? `Refunded ${paid}` : 'Refunded';
    case 'expiry': return row.note?.startsWith('Welcome') ? 'Welcome credits expired' : 'Expired';
    case 'welcome': return 'Welcome credits';
    // A bulk run takes its credits in one line, under the batch's reference.
    case 'job': return row.note?.startsWith('B-') ? `Bulk listing ${row.note}` : row.note ? `Listing ${row.note}` : 'Listing';
    case 'job_return': return row.note ? `Returned: listing ${row.note} failed` : 'Returned: listing failed';
    case 'bonus': return row.note ?? 'Bonus credits';
    case 'grant': return 'Added by Remvo';
    default: return 'Correction';
  }
}

export function useSellerData() {
  const { account } = useSellerSession();
  const id = account?.id;
  const w = useSyncExternalStore(walletStore.subscribe, walletStore.getState, walletStore.getState);
  const js = useSyncExternalStore(jobStore.subscribe, jobStore.getState, jobStore.getState);

  // Load on sign-in, and again whenever the tab comes back (a top-up
  // finished in another tab, a listing finished while away).
  useEffect(() => { if (id) { walletStore.refresh(id); jobStore.refresh(id); } }, [id]);
  useEffect(() => {
    if (!id) return undefined;
    const onShow = () => {
      if (document.visibilityState !== 'visible') return;
      walletStore.refresh(id);
      jobStore.refresh(id);
    };
    document.addEventListener('visibilitychange', onShow);
    return () => document.removeEventListener('visibilitychange', onShow);
  }, [id]);

  const wallet = w.accountId === id ? w.wallet : null;
  const jobs = js.accountId === id ? js.jobs : [];
  // The API's figure is the one charged; the constant only fills in before it loads.
  const listingCredits = wallet?.listingCredits ?? PRICING.JOBS.LISTING.credits;

  const summary = useMemo(() => {
    if (!wallet) return null;
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    return {
      balance: wallet.balance,
      worth: wallet.worth.cents / 100,
      currency: wallet.worth.currency,
      listingsLeft: Math.floor(wallet.balance / listingCredits),
      expiresAt: wallet.expiresAt,
      welcome: wallet.welcome ?? null,
      ready: jobs.filter((j) => j.status === 'ready').length,
      thisMonth: jobs.filter((j) => j.status === 'ready' && Date.parse(j.createdAt) >= monthStart.getTime()).length,
    };
  }, [wallet, jobs, listingCredits]);

  const settings = wallet?.settings ?? null;
  const history = useMemo(
    () => (w.accountId === id ? w.history.map((r) => ({ id: r.id, at: r.at, credits: r.credits, jobId: r.jobId, label: labelFor(r) })) : []),
    [w, id]
  );

  const job = useCallback((jobId) => jobs.find((j) => j.id === jobId) ?? null, [jobs]);
  const fetchJob = useCallback((jobId) => jobStore.fetchJob(jobId), []);
  const lookUp = useCallback((raw) => jobStore.lookUp(raw), []);
  const makeListing = useCallback((input, onUpdate) => jobStore.create(input, onUpdate), []);
  const watchJob = useCallback((jobId, onUpdate) => jobStore.watch(jobId, onUpdate), []);
  const deleteJob = useCallback((jobId) => jobStore.remove(jobId), []);
  const deleteJobSoon = useCallback((jobId, ms, onFail) => jobStore.removeSoon(jobId, ms, onFail), []);
  const editJob = useCallback((jobId, field, value) => jobStore.edit(jobId, field, value), []);
  const loadMoreJobs = useCallback(() => jobStore.loadMore(), []);

  // Bulk listing. A started batch has taken credits and queued listings: both are read again.
  const checkBatch = useCallback((body) => sellerApi.checkBatch(body), []);
  const startBatch = useCallback(async (body) => {
    const { batch } = await sellerApi.startBatch(body);
    walletStore.refresh(id);
    jobStore.refresh(id);
    return batch;
  }, [id]);
  const fetchBatch = useCallback((batchId) => sellerApi.batch(batchId).then((r) => r.batch), []);
  const listBatches = useCallback(() => sellerApi.batches().then((r) => r.items), []);
  const batchFile = useCallback((batchId, format) => sellerApi.batchFile(batchId, format), []);
  const refreshAll = useCallback(() => { if (id) { walletStore.refresh(id); jobStore.refresh(id); } }, [id]);

  const topUp = useCallback((what) => walletStore.startTopUp({ ...what, currency: walletStore.getState().wallet?.settings?.currency ?? 'USD' }), []);
  const topUpStatus = useCallback((checkoutId) => walletStore.topUpStatus(checkoutId), []);
  const updateSettings = useCallback((patch) => walletStore.updateSettings(id, patch), [id]);
  const refreshWallet = useCallback(() => walletStore.refresh(id), [id]);

  return {
    walletStatus: w.accountId === id ? w.status : 'loading',
    walletError: w.accountId === id ? w.error : null,
    jobsStatus: js.accountId === id ? js.status : 'loading',
    jobsError: js.accountId === id ? js.error : null,
    moreJobs: js.accountId === id && Boolean(js.next),
    topUpsEnabled: wallet?.topUpsEnabled ?? false,
    // What is on sale now (from Polar, via the API), and the peak bonus while it runs.
    packs: wallet?.packs ?? null,
    peak: wallet?.peak ?? null,
    listingsEnabled: wallet?.listingsEnabled ?? false,
    listingCredits,
    summary, jobs, history, settings, job,
    fetchJob, lookUp, makeListing, watchJob, deleteJob, deleteJobSoon, editJob, loadMoreJobs,
    topUp, topUpStatus, updateSettings, refreshWallet,
    checkBatch, startBatch, fetchBatch, listBatches, batchFile, refreshAll,
  };
}
