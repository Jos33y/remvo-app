import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { PageHeader } from '@components/ui/seller/PageHeader';
import { BalanceCard, MakeListingForm, StatusPill, TopUpSheet } from '@components/ui/seller/parts';
import { IconChevronRight, IconListings } from '@components/ui/seller/icons';
import { useSellerData } from '@context/SellerData';
import { inputLabel, when } from '@lib/sellerFormat';
import { withEdits } from '@lib/sellerData';
import { SELLER_ROUTES, listingPath } from '@utils/constants';
import { Breakable } from '@components/ui/seller/Breakable';
import s from '@styles/pages/seller/app.module.css';

/* ──────────────────────────────────────────────────────────────────
 * Home
 *
 * The three things a seller opens the app for, in the order they
 * matter: what they have (balance), what they came to do (make a
 * listing), what they did last (recent listings).
 * ────────────────────────────────────────────────────────────────── */

export function JobRow({ job }) {
  const title = withEdits(job)?.title ?? inputLabel(job.input);
  return (
    <Link to={listingPath(job.id)} className={s.row}>
      <span className={s.rowMain}>
        <span className={`${s.rowTitle} ${s.rowTitleClamp}`}><Breakable text={title} /></span>
        <span className={s.rowSub}>
          <span>{when(job.createdAt)}</span>
          <StatusPill status={job.status} />
        </span>
      </span>
      <span className={s.chevron}><IconChevronRight /></span>
    </Link>
  );
}

export function SellerHomePage() {
  const { jobs } = useSellerData();
  const [topUp, setTopUp] = useState(false);
  const recent = jobs.slice(0, 4);

  useEffect(() => { document.title = 'Remvo'; }, []);

  return (
    <>
      <PageHeader title="Home" />
      <div className={s.content}>
        <div className={s.section}>
          <BalanceCard onTopUp={() => setTopUp(true)} />
        </div>

        <div className={s.section}>
          <MakeListingForm />
          <p className={s.groupNote}>
            Listing a stack? <Link to={SELLER_ROUTES.BULK} className={s.inlineLink}>Paste a column or upload a CSV</Link>, up to 500 at a time.
          </p>
        </div>

        <section className={s.section} aria-labelledby="recent-heading">
          <div className={s.groupHead}>
            <h2 id="recent-heading" className={s.groupTitle}>Recent</h2>
            {jobs.length > recent.length && <Link to={SELLER_ROUTES.LISTINGS} className={s.groupLink}>See all</Link>}
          </div>
          {recent.length ? (
            <div className={s.group}>
              {recent.map((j) => <JobRow key={j.id} job={j} />)}
            </div>
          ) : (
            <div className={s.empty}>
              <span className={s.emptyIcon}><IconListings size={28} /></span>
              <p className={s.emptyTitle}>No listings yet</p>
              <p className={s.emptyText}>Type a barcode above. Your first listing is usually back in under 30 seconds.</p>
            </div>
          )}
        </section>
      </div>
      <TopUpSheet open={topUp} onClose={() => setTopUp(false)} />
    </>
  );
}
