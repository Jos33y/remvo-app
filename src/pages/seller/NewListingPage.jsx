import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { PageHeader } from '@components/ui/seller/PageHeader';
import { MakeListingForm, TopUpSheet } from '@components/ui/seller/parts';
import { IconAlert, IconCheck } from '@components/ui/seller/icons';
import { useSellerData } from '@context/SellerData';
import { CONDITION, readInput, stepsFor } from '@lib/sellerData';
import { NotEnoughCredits, PickNeeded } from '@lib/sellerJobs';
import { inputLabel } from '@lib/sellerFormat';
import { SELLER_ROUTES, listingPath } from '@utils/constants';
import s from '@styles/pages/seller/app.module.css';

/* ──────────────────────────────────────────────────────────────────
 * New listing, /listings/new
 *
 * A screen that covers the tabs, as a compose screen does, with a way
 * back that is always the same place. Stages:
 *
 *   enter    no input yet (opened from the + in Listings)
 *   looking  the input is being checked on Amazon; nothing is spent
 *   pick     a barcode matched more than one product: choose, free
 *   running  credits taken; each step ticks as the API reports it.
 *            Never a spinner: the seller sees what is happening, in
 *            words. Leaving is fine: the listing carries on and turns
 *            up in Listings.
 *   failed   what went wrong, and whether any credits moved
 *   short    not enough credits, and a way to top up without leaving
 *
 * On success it replaces itself with the listing, so Back from the
 * listing goes to Listings, not to a finished progress screen.
 * ────────────────────────────────────────────────────────────────── */

/* Each navigation here is a fresh attempt: trying again from the
 * failure screen navigates to this same path, so the page is keyed on
 * the navigation, not the path. */
const HEADINGS = {
  running: 'Making your listing',
  pick: 'Which product?',
  failed: 'This one did not work',
  short: 'Not enough credits',
};

export function NewListingPage() {
  const location = useLocation();
  return <NewListing key={location.key} />;
}

function NewListing() {
  const navigate = useNavigate();
  const location = useLocation();
  const raw = location.state?.raw ?? null;
  const condition = location.state?.condition ?? 'new';
  const { lookUp, makeListing, settings, listingCredits: LISTING } = useSellerData();
  const steps = stepsFor(settings?.marketplace);

  const [stage, setStage] = useState(raw ? 'looking' : 'enter');
  const [input, setInput] = useState(null);
  const [matches, setMatches] = useState(null);
  const [pick, setPick] = useState(null);
  const [done, setDone] = useState(-1);
  const [failure, setFailure] = useState('');
  // Whether credits were taken and given back, or never taken: the failure screen says which.
  const [returned, setReturned] = useState(false);
  const [topUp, setTopUp] = useState(false);
  const started = useRef(false);

  useEffect(() => { document.title = 'Remvo | New listing'; }, []);

  function fail(message, creditsBack = false) {
    setFailure(message);
    setReturned(creditsBack);
    setStage('failed');
  }

  async function run(read, asin = null) {
    setStage('running');
    setDone(-1);
    try {
      const job = await makeListing({ input: read.value, asin, condition }, (j) => setDone(j.step - 1));
      if (!job) { navigate(SELLER_ROUTES.LISTINGS, { replace: true }); return; }
      if (job.status === 'failed') { fail(job.failure, true); return; }
      navigate(listingPath(job.id), { replace: true });
    } catch (err) {
      if (err instanceof NotEnoughCredits) { setStage('short'); return; }
      if (err instanceof PickNeeded) { setMatches(err.matches); setPick(err.matches[0]?.asin ?? null); setStage('pick'); return; }
      fail(err.message || 'Something went wrong on our side. Try again in a minute.');
    }
  }

  useEffect(() => {
    if (!raw || started.current) return;
    started.current = true;
    (async () => {
      const read = readInput(raw);
      if (read.error) { fail(read.error); return; }
      setInput(read);
      try {
        const found = await lookUp(read.value);
        if (found.matches) { setMatches(found.matches); setPick(found.matches[0].asin); setStage('pick'); return; }
        setPick(found.product?.asin ?? null);
        run(read, read.kind === 'barcode' ? found.product?.asin : null);
      } catch (err) {
        fail(err.message);
      }
    })();
  }, [raw]);

  return (
    <>
      {/* The large title is what is happening now; it shrinks into the bar on scroll, like every tab. */}
      <PageHeader title={HEADINGS[stage] ?? 'New listing'} back={SELLER_ROUTES.LISTINGS} backLabel="Listings">
        {input && (
          <p className={s.jobMeta}>
            <span className={s.mono}>{inputLabel(input)}</span>
            <span>{CONDITION[condition].label}</span>
          </p>
        )}
      </PageHeader>
      <div className={s.content}>
        {stage === 'enter' && (
          <div className={s.section}><MakeListingForm autoFocus /></div>
        )}

        {stage === 'looking' && (
          <div className={s.section}>
            <div className={s.card}>
              <ol className={s.steps}>
                <li className={`${s.step} ${s.stepNow}`}><span className={s.stepMark} /> Looking it up</li>
              </ol>
            </div>
            <p className={s.groupNote}>Nothing is spent until you see the steps below start.</p>
          </div>
        )}

        {stage === 'pick' && (
          <div className={s.section}>
            <p className={`${s.groupNote} ${s.lead}`}>
              Amazon lists more than one product for this barcode. Choose the one you sell. Nothing is spent yet.
            </p>
            <div className={s.packs} role="radiogroup" aria-label="Products for this barcode">
              {matches.map((m) => (
                <button key={m.asin} type="button" role="radio" aria-checked={pick === m.asin} className={`${s.pack} ${s.match}`} onClick={() => setPick(m.asin)}>
                  <span className={s.matchImage} aria-hidden="true">
                    {m.image && <img src={m.image} alt="" width={56} height={56} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.hidden = true; }} />}
                  </span>
                  <span className={s.packMain}>
                    <span className={s.matchTitle}>{m.title}</span>
                    <span className={`${s.small} ${s.mono}`}>{m.asin}</span>
                  </span>
                  <span className={s.radio} aria-hidden="true" />
                </button>
              ))}
            </div>
            <div className={s.section}>
              <button type="button" className={`${s.button} ${s.primary} ${s.block}`} onClick={() => run(input, pick)}>
                Make listing, {LISTING} credits
              </button>
            </div>
          </div>
        )}

        {stage === 'running' && (
          <div className={s.section}>
            <div className={s.card} aria-live="polite">
              <ol className={s.steps}>
                {steps.map((label, i) => {
                  const state = i <= done ? s.stepDone : i === done + 1 ? s.stepNow : '';
                  return (
                    <li key={label} className={`${s.step} ${state}`}>
                      <span className={s.stepMark}>{i <= done && <IconCheck size={14} />}</span>
                      {label}
                      {i <= done && <span className="sr-only">, done</span>}
                    </li>
                  );
                })}
              </ol>
            </div>
            <p className={s.groupNote}>
              {LISTING} credits are taken. If this does not finish, they come straight back. You can leave this screen;
              the listing carries on and appears in Listings.
            </p>
          </div>
        )}

        {stage === 'failed' && (
          <div className={s.section}>
            <div className={`${s.notice} ${s.noticeDanger}`} role="alert">
              <IconAlert size={20} />
              <span>{failure}</span>
            </div>
            {input && <p className={s.groupNote}>{returned ? `The ${LISTING} credits went back to your balance.` : 'No credits were used.'}</p>}
            <div className={s.section}><MakeListingForm autoFocus /></div>
          </div>
        )}

        {stage === 'short' && (
          <div className={s.section}>
            <div className={s.notice}>
              A listing uses {LISTING} credits and your balance is lower. Top up, then make it again from Home.
            </div>
            <div className={s.section}>
              <button type="button" className={`${s.button} ${s.primary} ${s.block}`} onClick={() => setTopUp(true)}>Top up</button>
            </div>
          </div>
        )}
      </div>
      <TopUpSheet open={topUp} onClose={() => setTopUp(false)} />
    </>
  );
}
