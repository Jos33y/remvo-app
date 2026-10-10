import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import { useSellerSession } from '@context/SellerSession';
import * as data from '@lib/sellerData';
import * as walletStore from '@lib/sellerWallet';
import { money } from '@lib/market';
import { PRICING } from '@utils/constants';

/* ──────────────────────────────────────────────────────────────────
 * useSellerData()
 *
 * Everything a signed-in screen shows, bound to who is signed in.
 * Screens read from here and never from the libraries directly.
 *
 *   Wallet    real: balance, history, settings and top-ups come from
 *             remvo-api (lib/sellerWallet.js), and a top-up goes to
 *             Polar's checkout.
 *   Listings  preview: made up in this browser (lib/sellerData.js)
 *             until the listing engine ships. They check the real
 *             balance but never spend it.
 * ────────────────────────────────────────────────────────────────── */

let version = 0;
data.subscribe(() => { version += 1; });
const getVersion = () => version;

const LISTING = PRICING.JOBS.LISTING.credits;

/** A ledger row from the API, worded for the history list. */
function labelFor(row) {
  const paid = row.amountCents != null && row.currency ? money(row.amountCents / 100, row.currency) : null;
  switch (row.kind) {
    case 'topup': return paid ? `Top-up ${paid}` : 'Top-up';
    case 'refund': return paid ? `Refunded ${paid}` : 'Refunded';
    case 'expiry': return 'Expired';
    case 'job': return 'Listing';
    case 'job_return': return 'Returned: listing failed';
    case 'grant': return 'Added by Remvo';
    default: return 'Correction';
  }
}

export function useSellerData() {
  const { account } = useSellerSession();
  const id = account?.id;
  const v = useSyncExternalStore(data.subscribe, getVersion, getVersion);
  const w = useSyncExternalStore(walletStore.subscribe, walletStore.getState, walletStore.getState);

  // Load the wallet on sign-in, and again whenever the tab comes back
  // (a top-up finished in another tab, credits expired overnight).
  useEffect(() => { if (id) walletStore.refresh(id); }, [id]);
  useEffect(() => {
    if (!id) return undefined;
    const onShow = () => { if (document.visibilityState === 'visible') walletStore.refresh(id); };
    document.addEventListener('visibilitychange', onShow);
    return () => document.removeEventListener('visibilitychange', onShow);
  }, [id]);

  const wallet = w.accountId === id ? w.wallet : null;
  const jobs = useMemo(() => (id ? [...data.jobs(id)] : []), [id, v]);

  const summary = useMemo(() => {
    if (!wallet) return null;
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    return {
      balance: wallet.balance,
      worth: wallet.worth.cents / 100,
      currency: wallet.worth.currency,
      listingsLeft: Math.floor(wallet.balance / LISTING),
      expiresAt: wallet.expiresAt,
      ready: jobs.filter((j) => j.status === 'ready').length,
      thisMonth: jobs.filter((j) => j.status === 'ready' && Date.parse(j.createdAt) >= monthStart.getTime()).length,
    };
  }, [wallet, jobs]);

  const settings = wallet?.settings ?? null;
  const history = useMemo(
    () => (w.accountId === id ? w.history.map((r) => ({ id: r.id, at: r.at, credits: r.credits, jobId: r.jobId, label: labelFor(r) })) : []),
    [w, id]
  );

  const job = useCallback((jobId) => (id ? data.job(id, jobId) : null), [id, v]);
  const lookUp = useCallback((raw) => data.lookUp(id, raw), [id]);
  const makeListing = useCallback(async (input, onStep) => {
    const balance = walletStore.getState().wallet?.balance ?? 0;
    if (balance < LISTING) throw new data.NotEnoughCredits();
    return data.makeListing(id, { ...input, marketplace: walletStore.getState().wallet?.settings?.marketplace ?? 'US' }, onStep);
  }, [id]);
  const deleteJob = useCallback((jobId) => data.deleteJob(id, jobId), [id]);
  const editJob = useCallback((jobId, field, value) => data.editJob(id, jobId, field, value), [id]);
  const resetPreview = useCallback(() => data.resetPreview(id), [id]);

  const topUp = useCallback((what) => walletStore.startTopUp({ ...what, currency: walletStore.getState().wallet?.settings?.currency ?? 'USD' }), []);
  const topUpStatus = useCallback((checkoutId) => walletStore.topUpStatus(checkoutId), []);
  const updateSettings = useCallback((patch) => walletStore.updateSettings(id, patch), [id]);
  const refreshWallet = useCallback(() => walletStore.refresh(id), [id]);

  return {
    preview: data.PREVIEW,
    walletStatus: w.accountId === id ? w.status : 'loading',
    walletError: w.accountId === id ? w.error : null,
    topUpsEnabled: wallet?.topUpsEnabled ?? false,
    summary, jobs, history, settings, job,
    lookUp, makeListing, deleteJob, editJob, resetPreview,
    topUp, topUpStatus, updateSettings, refreshWallet,
  };
}
