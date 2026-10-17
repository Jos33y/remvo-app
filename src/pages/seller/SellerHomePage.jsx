import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { PageHeader } from '@components/ui/seller/PageHeader';
import { MakeListingForm, StatusPill, TopUpSheet } from '@components/ui/seller/parts';
import { IconChevronRight } from '@components/ui/seller/icons';
import { WeekStacks } from '@components/ui/seller/WeekStacks';
import { useSellerData } from '@context/SellerData';
import { inputLabel, when } from '@lib/sellerFormat';
import { withEdits } from '@lib/sellerData';
import { sellerApi } from '@lib/sellerApi';
import { count, num, plural } from '@lib/plural';
import { ROUTES, SELLER_ROUTES, listingPath, siteUrl, supportPath } from '@utils/constants';
import { Breakable } from '@components/ui/seller/Breakable';
import '@styles/base/instrument-serif.css';
import s from '@styles/pages/seller/app.module.css';
import h from '@styles/pages/seller/home.module.css';

/* ──────────────────────────────────────────────────────────────────
 * Home
 *
 * Results first. What the seller's week came to (listings ready, the
 * stock they add up to, seven stacks of parcels), then the one thing
 * they came to do (a barcode), what they have to do it with (one line
 * of balance), and what they made last, with the product's photo.
 *
 * Phone: one column in that order. From 900px: the week and the recent
 * listings on the left, the barcode, balance and bulk on the right.
 * No greeting and no card: the work is the welcome.
 * ────────────────────────────────────────────────────────────────── */

// ── A product's photo, or a parcel where there is none (also on a batch's lines) ──

export function Thumb({ src }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) {
    return (
      <span className={`${h.thumb} ${h.thumbEmpty}`} aria-hidden="true">
        <svg viewBox="0 0 24 24" width="22" height="22" focusable="false">
          <path d="M12 3.5l8 4v9l-8 4-8-4v-9z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M4 7.5l8 4 8-4M12 11.5v9" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  return (
    <span className={h.thumb} aria-hidden="true">
      <img src={src} alt="" width="48" height="48" loading="lazy" decoding="async" onError={() => setBroken(true)} />
    </span>
  );
}

export function JobRow({ job }) {
  const title = withEdits(job)?.title ?? job.source?.title ?? inputLabel(job.input);
  return (
    <Link to={listingPath(job.id)} className={`${s.row} ${h.jobRow}`}>
      <Thumb src={job.source?.image} />
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

// ── The week ──

// Whole units on Home: "$1,284 of stock". Each site's own way of writing it.
const WHOLE = {
  USD: (n) => `$${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n)}`,
  CAD: (n) => `C$${new Intl.NumberFormat('en-CA', { maximumFractionDigits: 0 }).format(n)}`,
  GBP: (n) => `£${new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 }).format(n)}`,
  EUR: (n) => `${new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }).format(n)} €`,
};
const whole = (n, currency) => (WHOLE[currency] ?? WHOLE.USD)(Math.round(n));

const zone = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return undefined; } };

function useWeek(finished) {
  const [week, setWeek] = useState({ status: 'loading', data: null });
  useEffect(() => {
    let live = true;
    sellerApi.summary(zone())
      .then((data) => { if (live) setWeek({ status: 'ready', data }); })
      .catch(() => { if (live) setWeek((w) => (w.data ? w : { status: 'error', data: null })); });
    return () => { live = false; };
    // A listing finishing changes the week: ask again.
  }, [finished]);
  return week;
}

function Week({ finished }) {
  const { status, data } = useWeek(finished);

  // Loading keeps the hero's shape, so nothing below it moves.
  if (status !== 'ready') {
    return (
      <section className={h.week} aria-labelledby="week-heading" aria-busy={status === 'loading'}>
        <p className={h.eyebrow}>This week</p>
        <h2 id="week-heading" className={`${h.headline} ${h.headlinePending}`}>
          {status === 'error' ? 'Your week did not load.' : 'Adding up your week.'}
        </h2>
        <div className={h.stacksPending} aria-hidden="true" />
      </section>
    );
  }

  const { week, days, allTime } = data;
  const [first, ...others] = week.value;
  const fresh = allTime.ready === 0 && week.failed === 0;
  let headline;
  let sub = null;
  if (week.ready > 0) {
    headline = <><span className={h.figure}>{num(week.ready)}</span> {plural(week.ready, 'listing')} ready</>;
    if (first) {
      sub = (
        <>
          <span className={h.money}>{whole(first.total, first.currency)}</span> of stock
          {others.length > 0 && <span className={h.moneyMore}>, and {others.map((v) => whole(v.total, v.currency)).join(', ')}</span>}
        </>
      );
    }
  } else if (allTime.ready > 0) {
    headline = 'A fresh week.';
    sub = <>{count(allTime.ready, 'listing')} made so far. The next one starts with a barcode.</>;
  } else {
    headline = 'Your first listing is 20 seconds away.';
    sub = <>Paste a barcode or a product link into Make a listing. Title, specifics, parcel and price come back together.</>;
  }

  return (
    <section className={h.week} aria-labelledby="week-heading">
      <p className={h.eyebrow}>{fresh ? 'Start here' : 'This week'}</p>
      <h2 id="week-heading" className={h.headline}>{headline}</h2>
      {sub && <p className={h.sub}>{sub}</p>}
      {/* Nothing made yet: see one first, or have a person walk them through it (chat3). */}
      {fresh && (
        <p className={h.help}>
          <a href={siteUrl(ROUTES.EXAMPLE)} target="_blank" rel="noopener noreferrer">See a real listing</a> first, or{' '}
          <Link to={supportPath('first')}>ask a person to walk you through it</Link>.
        </p>
      )}
      {week.failed > 0 && (
        <p className={h.failedNote}>{count(week.failed, 'listing')} did not work. Those credits went back.</p>
      )}
      {/* Nothing made yet: no empty chart, the barcode comes straight up. */}
      {!fresh && (
        <div className={h.stacks}>
          <WeekStacks days={days} />
        </div>
      )}
    </section>
  );
}

// ── Balance, on one line ──

function BalanceLine({ onTopUp }) {
  const { summary, walletStatus, refreshWallet, jobs } = useSellerData();
  if (!summary) {
    const failed = walletStatus === 'error';
    return (
      <div className={h.balance} aria-busy={!failed}>
        <p className={h.balanceText} role={failed ? 'alert' : 'status'}>
          {failed ? 'Your balance did not load.' : 'Getting your balance.'}
        </p>
        {failed && <button type="button" className={h.balanceButton} onClick={refreshWallet}>Try again</button>}
      </div>
    );
  }
  const { balance, listingsLeft, welcome } = summary;
  const onlyWelcome = welcome && welcome.credits === balance;
  const empty = listingsLeft === 0;
  return (
    <div className={`${h.balance} ${empty ? h.balanceEmpty : ''}`}>
      <Link to={SELLER_ROUTES.CREDITS} className={h.balanceText}>
        {empty ? (
          <>{balance > 0 && <><span className={h.balanceFigure}>{num(balance)}</span> {plural(balance, 'credit')}. </>}Top up to make your {jobs.length ? 'next' : 'first'} listing.</>
        ) : onlyWelcome ? (
          <><span className={h.balanceFigure}>{num(balance)}</span> welcome {plural(balance, 'credit')}: your first listing is on us.</>
        ) : (
          <><span className={h.balanceFigure}>{num(balance)}</span> {plural(balance, 'credit')}, enough for {count(listingsLeft, 'listing')}</>
        )}
      </Link>
      <button type="button" className={`${h.balanceButton} ${empty ? h.balanceButtonMain : ''}`} onClick={onTopUp}>Top up</button>
    </div>
  );
}

// ── Nothing made yet: the shape of what is coming ──

function GhostRows() {
  return (
    <div className={h.ghost}>
      <div className={s.group} aria-hidden="true">
        {[0.62, 0.48, 0.55].map((w, i) => (
          <div key={w} className={`${s.row} ${h.jobRow} ${h.ghostRow}`} style={{ '--w': w, '--i': i }}>
            <span className={`${h.thumb} ${h.thumbEmpty}`}>
              <svg viewBox="0 0 24 24" width="22" height="22" focusable="false">
                <path d="M12 3.5l8 4v9l-8 4-8-4v-9z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                <path d="M4 7.5l8 4 8-4M12 11.5v9" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
              </svg>
            </span>
            <span className={s.rowMain}>
              <span className={h.ghostLine} />
              <span className={`${h.ghostLine} ${h.ghostShort}`} />
            </span>
          </div>
        ))}
      </div>
      <p className={h.ghostNote}>Each listing lands here with its product photo, newest first.</p>
    </div>
  );
}

// ── The screen ──

export function SellerHomePage() {
  const { jobs } = useSellerData();
  const [topUp, setTopUp] = useState(false);
  const recent = jobs.slice(0, 5);
  const finished = jobs.filter((j) => j.status === 'ready' || j.status === 'failed').length;

  useEffect(() => { document.title = 'Remvo'; }, []);

  return (
    <>
      <PageHeader title="Home" quiet />
      <div className={`${s.content} ${h.home}`}>
        <div className={h.weekArea}>
          <Week finished={finished} />
        </div>

        <div className={h.actArea}>
          <MakeListingForm hero />
          <BalanceLine onTopUp={() => setTopUp(true)} />
          <Link to={SELLER_ROUTES.BULK} className={h.stack}>
            <span className={h.stackArt} aria-hidden="true">
              <svg viewBox="0 0 40 40" width="40" height="40" focusable="false">
                <rect x="9" y="5" width="22" height="28" rx="3" transform="rotate(-9 20 19)" />
                <rect x="9" y="6" width="22" height="28" rx="3" transform="rotate(5 20 20)" />
                <rect x="9" y="7" width="22" height="28" rx="3" />
                <path d="M14 14v9M17 14v9M19 14v9M22.5 14v9M25 14v9M27 14v9" />
              </svg>
            </span>
            <span className={h.stackMain}>
              <span className={h.stackTitle}>Got a stack?</span>
              <span className={h.stackText}>Paste a column or upload a CSV, up to 500 at a time.</span>
            </span>
            <span className={h.stackChevron}><IconChevronRight /></span>
          </Link>
        </div>

        <section className={h.recentArea} aria-labelledby="recent-heading">
          <div className={s.groupHead}>
            <h2 id="recent-heading" className={s.groupTitle}>Recent</h2>
            {jobs.length > recent.length && <Link to={SELLER_ROUTES.LISTINGS} className={s.groupLink}>See all</Link>}
          </div>
          {recent.length ? (
            <div className={s.group}>
              {recent.map((j) => <JobRow key={j.id} job={j} />)}
            </div>
          ) : (
            <GhostRows />
          )}
        </section>
      </div>
      <TopUpSheet open={topUp} onClose={() => setTopUp(false)} />
    </>
  );
}
