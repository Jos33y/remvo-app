import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { PageHeader } from '@components/ui/seller/PageHeader';
import { BalanceCard, MakeListingForm, StatusPill, TopUpSheet } from '@components/ui/seller/parts';
import { IconChevronRight, IconListings } from '@components/ui/seller/icons';
import { useSellerData } from '@context/SellerData';
import { useSellerSession } from '@context/SellerSession';
import { PasswordSheet } from '@components/ui/seller/AccountSheets';
import { useToast } from '@components/ui/seller/Toast';
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

const LATER_KEY = 'remvo.passwordLater';
const saidLater = () => { try { return sessionStorage.getItem(LATER_KEY) === '1'; } catch { return false; } };

/* Sellers from before 16 October have no password. Asked here, once a
 * visit, until they set one: then the browser can sign them in. */
function PasswordPrompt() {
  const { account } = useSellerSession();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [later, setLater] = useState(saidLater);
  if (!account || account.hasPassword || later) return null;
  const notNow = () => { try { sessionStorage.setItem(LATER_KEY, '1'); } catch { /* private mode */ } setLater(true); };
  return (
    <div className={s.section}>
      <section className={s.promptCard} aria-labelledby="password-prompt">
        <h2 id="password-prompt" className={s.promptTitle}>Set a password</h2>
        <p className={s.promptText}>Remvo now signs you in with a password your browser can save and fill in, on any device. It takes a moment.</p>
        <div className={s.promptActions}>
          <button type="button" className={`${s.button} ${s.primary}`} onClick={() => setOpen(true)}>Set a password</button>
          <button type="button" className={`${s.button} ${s.secondary}`} onClick={notNow}>Not now</button>
        </div>
      </section>
      <PasswordSheet open={open} onClose={() => setOpen(false)} onSaved={toast} />
    </div>
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

        <PasswordPrompt />

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
