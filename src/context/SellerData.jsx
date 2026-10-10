import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { useSellerSession } from '@context/SellerSession';
import * as data from '@lib/sellerData';

/* ──────────────────────────────────────────────────────────────────
 * useSellerData()
 *
 * The signed-in account's credits, listings and history, bound to who
 * is signed in. Screens read from here and never from lib/sellerData
 * directly, so the switch from preview data to the API happens behind
 * this hook.
 *
 * Re-renders whenever anything changes (a listing finishes, a top-up
 * lands), through useSyncExternalStore.
 * ────────────────────────────────────────────────────────────────── */

let version = 0;
data.subscribe(() => { version += 1; });
const getVersion = () => version;

export function useSellerData() {
  const { account } = useSellerSession();
  const id = account?.id;
  const v = useSyncExternalStore(data.subscribe, getVersion, getVersion);

  const summary = useMemo(() => (id ? data.summary(id) : null), [id, v]);
  const jobs = useMemo(() => (id ? [...data.jobs(id)] : []), [id, v]);
  const history = useMemo(() => (id ? [...data.history(id)] : []), [id, v]);

  const job = useCallback((jobId) => (id ? data.job(id, jobId) : null), [id, v]);
  const lookUp = useCallback((raw) => data.lookUp(id, raw), [id]);
  const makeListing = useCallback((input, onStep) => data.makeListing(id, input, onStep), [id]);
  const deleteJob = useCallback((jobId) => data.deleteJob(id, jobId), [id]);
  const topUp = useCallback((pounds) => data.topUp(id, pounds), [id]);
  const resetPreview = useCallback(() => data.resetPreview(id), [id]);

  return { preview: data.PREVIEW, summary, jobs, history, job, lookUp, makeListing, deleteJob, topUp, resetPreview };
}
