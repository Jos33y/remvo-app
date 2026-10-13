import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { PageHeader } from '@components/ui/seller/PageHeader';
import { IconChevronRight, IconListings, IconPlus } from '@components/ui/seller/icons';
import { useSellerData } from '@context/SellerData';
import { MARKETPLACE } from '@lib/market';
import { JobRow } from '@pages/seller/SellerHomePage';
import { SELLER_ROUTES, batchPath } from '@utils/constants';
import { when } from '@lib/sellerFormat';
import s from '@styles/pages/seller/app.module.css';

/* ──────────────────────────────────────────────────────────────────
 * Listings
 *
 * Everything made in the last 90 days, newest first. Filter by what
 * happened, search by title or barcode. The + in the bar starts a new
 * one, as a compose button does in Mail; Bulk beside it starts many.
 * Bulk runs from the last week sit above the list, a running one with
 * how far it has got.
 * ────────────────────────────────────────────────────────────────── */

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'ready', label: 'Ready' },
  { key: 'failed', label: 'Failed' },
];

export function ListingsPage() {
  const { jobs, settings, moreJobs, loadMoreJobs, listBatches } = useSellerData();
  const [batches, setBatches] = useState([]);
  const site = MARKETPLACE[settings?.marketplace] ?? MARKETPLACE.US;
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');

  useEffect(() => { document.title = 'Remvo | Listings'; }, []);

  // Recent bulk runs; read again every few seconds while one is running.
  useEffect(() => {
    let live = true;
    let timer = null;
    const read = async () => {
      const items = await listBatches().catch(() => null);
      if (!live || !items) return;
      const week = Date.now() - 7 * 86_400_000;
      setBatches(items.filter((x) => x.status === 'running' || Date.parse(x.createdAt) > week).slice(0, 3));
      if (items.some((x) => x.status === 'running')) timer = setTimeout(read, 5000);
    };
    read();
    return () => { live = false; clearTimeout(timer); };
  }, [listBatches]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return jobs.filter((j) => (filter === 'all' || j.status === filter)
      && (!needle
        || (j.edits?.title ?? j.listing?.title ?? '').toLowerCase().includes(needle)
        || (j.source?.title ?? '').toLowerCase().includes(needle)
        || j.ref.toLowerCase().includes(needle)
        || j.input.value.includes(needle.replace(/\s/g, ''))));
  }, [jobs, filter, q]);

  return (
    <>
      <PageHeader
        title="Listings"
        action={
          <>
            <Link to={SELLER_ROUTES.BULK} className={s.textButton}>Bulk</Link>
            <Link to={SELLER_ROUTES.NEW_LISTING} className={s.iconButton} aria-label="New listing">
              <IconPlus size={26} />
            </Link>
          </>
        }
      >
        <div className={s.segmented} role="group" aria-label="Show">
          {FILTERS.map((f) => (
            <button key={f.key} type="button" className={s.segment} aria-pressed={filter === f.key} onClick={() => setFilter(f.key)}>
              {f.label}
            </button>
          ))}
        </div>
        <div className={s.search}>
          <input
            className={`${s.input} ${s.inputPlain}`}
            type="search"
            placeholder="Search titles, barcodes and references"
            aria-label="Search listings"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            enterKeyHint="search"
          />
        </div>
      </PageHeader>

      <div className={s.content}>
        {batches.length > 0 && (
          <section className={s.section} aria-labelledby="batches-heading">
            <div className={s.groupHead}><h2 id="batches-heading" className={s.groupTitle}>Bulk</h2></div>
            <div className={s.group}>
              {batches.map((x) => <BatchRow key={x.id} batch={x} />)}
            </div>
          </section>
        )}
        <div className={s.section}>
          {shown.length ? (
            <div className={s.group}>
              {shown.map((j) => <JobRow key={j.id} job={j} />)}
            </div>
          ) : (
            <div className={s.empty}>
              <span className={s.emptyIcon}><IconListings size={28} /></span>
              <p className={s.emptyTitle}>{jobs.length ? 'Nothing matches' : 'No listings yet'}</p>
              <p className={s.emptyText}>
                {jobs.length ? 'Try another word, or show all.' : `Make your first one from a barcode or an ${site.amazon} link.`}
              </p>
              {!jobs.length && (
                <Link to={SELLER_ROUTES.NEW_LISTING} className={`${s.button} ${s.primary}`}>Make a listing</Link>
              )}
            </div>
          )}
          {moreJobs && !q && filter === 'all' && (
            <div className={s.section}>
              <button
                type="button"
                className={`${s.button} ${s.secondary} ${s.block}`}
                disabled={loadingMore}
                onClick={async () => { setLoadingMore(true); try { await loadMoreJobs(); } finally { setLoadingMore(false); } }}
              >
                {loadingMore ? 'Loading' : 'Show older listings'}
              </button>
            </div>
          )}
          <p className={s.groupNote}>Listings are kept for 90 days, then deleted.</p>
        </div>
      </div>
    </>
  );
}

function BatchRow({ batch }) {
  const c = batch.counts;
  const done = c.ready + c.failed;
  const sub = batch.status === 'running'
    ? `${done} of ${batch.total} made`
    : `${c.ready} ready${c.failed ? `, ${c.failed} did not work` : ''}`;
  return (
    <Link to={batchPath(batch.id)} className={s.row}>
      <span className={s.rowMain}>
        <span className={s.rowTitle}>{batch.total} {batch.total === 1 ? 'listing' : 'listings'}</span>
        <span className={s.rowSub}>
          <span>{when(batch.createdAt)}</span>
          <span>{sub}</span>
        </span>
      </span>
      <span className={s.chevron}><IconChevronRight /></span>
    </Link>
  );
}
