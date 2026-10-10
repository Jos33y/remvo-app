import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { PageHeader } from '@components/ui/seller/PageHeader';
import { IconListings, IconPlus } from '@components/ui/seller/icons';
import { useSellerData } from '@context/SellerData';
import { JobRow } from '@pages/seller/SellerHomePage';
import { SELLER_ROUTES } from '@utils/constants';
import s from '@styles/pages/seller/app.module.css';

/* ──────────────────────────────────────────────────────────────────
 * Listings
 *
 * Everything made in the last 90 days, newest first. Filter by what
 * happened, search by title or barcode. The + in the bar starts a new
 * one, as a compose button does in Mail.
 * ────────────────────────────────────────────────────────────────── */

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'ready', label: 'Ready' },
  { key: 'failed', label: 'Failed' },
];

export function ListingsPage() {
  const { jobs } = useSellerData();
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');

  useEffect(() => { document.title = 'Remvo | Listings'; }, []);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return jobs.filter((j) => (filter === 'all' || j.status === filter)
      && (!needle || (j.listing?.title ?? '').toLowerCase().includes(needle) || j.input.value.includes(needle.replace(/\s/g, ''))));
  }, [jobs, filter, q]);

  return (
    <>
      <PageHeader
        title="Listings"
        action={
          <Link to={SELLER_ROUTES.NEW_LISTING} className={s.iconButton} aria-label="New listing">
            <IconPlus size={26} />
          </Link>
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
            placeholder="Search titles and barcodes"
            aria-label="Search listings"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            enterKeyHint="search"
          />
        </div>
      </PageHeader>

      <div className={s.content}>
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
                {jobs.length ? 'Try another word, or show all.' : 'Make your first one from a barcode or an Amazon UK link.'}
              </p>
              {!jobs.length && (
                <Link to={SELLER_ROUTES.NEW_LISTING} className={`${s.button} ${s.primary}`}>Make a listing</Link>
              )}
            </div>
          )}
          <p className={s.groupNote}>Listings are kept for 90 days, then deleted.</p>
        </div>
      </div>
    </>
  );
}
