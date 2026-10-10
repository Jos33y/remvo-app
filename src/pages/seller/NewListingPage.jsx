import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { PageHeader } from '@components/ui/seller/PageHeader';
import { MakeListingForm, TopUpSheet } from '@components/ui/seller/parts';
import { IconAlert, IconCheck } from '@components/ui/seller/icons';
import { useSellerData } from '@context/SellerData';
import { CONDITION, NotEnoughCredits, stepsFor } from '@lib/sellerData';
import { inputLabel } from '@lib/sellerFormat';
import { PRICING, SELLER_ROUTES, listingPath } from '@utils/constants';
import s from '@styles/pages/seller/app.module.css';

/* ──────────────────────────────────────────────────────────────────
 * New listing, /listings/new
 *
 * A screen that covers the tabs, as a compose screen does, with a way
 * back that is always the same place. Stages:
 *
 *   enter    no input yet (opened from the + in Listings)
 *   looking  the input is being checked; nothing is spent
 *   pick     a barcode matched more than one product: choose, free
 *   running  credits reserved; each step ticks as it finishes. Never a
 *            spinner: the seller sees what is happening, in words.
 *   failed   what went wrong, and that the credits are back
 *   short    not enough credits, and a way to top up without leaving
 *
 * On success it replaces itself with the listing, so Back from the
 * listing goes to Listings, not to a finished progress screen.
 * ────────────────────────────────────────────────────────────────── */

const LISTING = PRICING.JOBS.LISTING.credits;

/* Each navigation here is a fresh attempt: trying again from the
 * failure screen navigates to this same path, so the page is keyed on
 * the navigation, not the path. */
export function NewListingPage() {
  const location = useLocation();
  return <NewListing key={location.key} />;
}

function NewListing() {
  const navigate = useNavigate();
  const location = useLocation();
  const raw = location.state?.raw ?? null;
  const condition = location.state?.condition ?? 'new';
  const { lookUp, makeListing, settings } = useSellerData();
  const steps = stepsFor(settings?.marketplace);

  const [stage, setStage] = useState(raw ? 'looking' : 'enter');
  const [input, setInput] = useState(null);
  const [matches, setMatches] = useState(null);
  const [pick, setPick] = useState(null);
  const [done, setDone] = useState(-1);
  const [failure, setFailure] = useState('');
  const [topUp, setTopUp] = useState(false);
  const started = useRef(false);

  useEffect(() => { document.title = 'Remvo | New listing'; }, []);

  async function run(read, matchKey = null) {
    setStage('running');
    setDone(-1);
    try {
      const job = await makeListing({ kind: read.kind, value: read.value, matchKey, condition }, (i) => setDone(i));
      if (job.status === 'failed') { setFailure(job.failure); setStage('failed'); return; }
      navigate(listingPath(job.id), { replace: true });
    } catch (err) {
      if (err instanceof NotEnoughCredits) { setStage('short'); return; }
      setFailure('Something went wrong on our side. Your credits are back. Try again in a minute.');
      setStage('failed');
    }
  }

  useEffect(() => {
    if (!raw || started.current) return;
    started.current = true;
    (async () => {
      const read = await lookUp(raw);
      if (read.error) { setFailure(read.error); setStage('failed'); return; }
      setInput(read);
      if (read.matches) { setMatches(read.matches); setPick(read.matches[0].key); setStage('pick'); return; }
      run(read);
    })();
  }, [raw]);

  const running = stage === 'running';

  return (
    <>
      <PageHeader
        title="New listing"
        back={running ? undefined : SELLER_ROUTES.LISTINGS}
        backLabel="Listings"
        large={false}
      />
      <div className={s.content}>
        <div className={s.jobHead}>
          <h2 className={s.jobTitle}>
            {stage === 'running' ? 'Making your listing' : stage === 'pick' ? 'Which product?' : stage === 'failed' ? 'This one did not work' : stage === 'short' ? 'Not enough credits' : 'New listing'}
          </h2>
          {input && (
            <p className={s.jobMeta}>
              <span className={s.mono}>{inputLabel(input)}</span>
              <span>{CONDITION[condition].label}</span>
            </p>
          )}
        </div>

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
                <button key={m.key} type="button" role="radio" aria-checked={pick === m.key} className={s.pack} onClick={() => setPick(m.key)}>
                  <span className={s.packMain}><span className={s.packCredits}>{m.title}</span></span>
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
              {LISTING} credits are set aside. If this does not finish, they come straight back.
            </p>
          </div>
        )}

        {stage === 'failed' && (
          <div className={s.section}>
            <div className={`${s.notice} ${s.noticeDanger}`} role="alert">
              <IconAlert size={20} />
              <span>{failure}</span>
            </div>
            {input && <p className={s.groupNote}>No credits were used.</p>}
            <div className={s.section}><MakeListingForm autoFocus /></div>
          </div>
        )}

        {stage === 'short' && (
          <div className={s.section}>
            <div className={s.notice}>
              A listing uses {LISTING} credits and your balance is lower. Top up, then it runs straight away.
            </div>
            <div className={s.section}>
              <button type="button" className={`${s.button} ${s.primary} ${s.block}`} onClick={() => setTopUp(true)}>Top up</button>
            </div>
          </div>
        )}
      </div>
      <TopUpSheet open={topUp} onClose={() => { setTopUp(false); if (stage === 'short' && input) run(input, pick); }} />
    </>
  );
}
