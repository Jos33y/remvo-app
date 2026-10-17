import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { PageHeader } from '@components/ui/seller/PageHeader';
import { MakeListingForm, TopUpSheet } from '@components/ui/seller/parts';
import { IconAlert, IconCheck, IconExternal } from '@components/ui/seller/icons';
import { useSellerData } from '@context/SellerData';
import { CONDITION, readInput, stepsFor } from '@lib/sellerData';
import { NotEnoughCredits, PickNeeded } from '@lib/sellerJobs';
import { inputLabel } from '@lib/sellerFormat';
import { MARKETPLACE, MARKETPLACES } from '@lib/market';
import { sellerApi } from '@lib/sellerApi';
import { SELLER_ROUTES, listingPath, worldCredits, worldPath } from '@utils/constants';
import s from '@styles/pages/seller/app.module.css';
import m from '@styles/pages/seller/making.module.css';

/* ──────────────────────────────────────────────────────────────────
 * New listing, /listings/new
 *
 * A screen that covers the tabs, as a compose screen does, with a way
 * back that is always the same place. Stages:
 *
 *   enter    no input yet (opened from the + in Listings)
 *   looking  the input is being checked on Amazon; nothing is spent
 *   pick     a barcode matched more than one product: choose, free
 *   sites    (world1, from "On more eBay sites") which eBay sites to
 *            list it on, with what that costs: one site 3 credits,
 *            three 8, all seven 15. Free until Make.
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
  sites: 'Which eBay sites?',
  starting: 'Which eBay sites?',
  failed: 'This one did not work',
  short: 'Not enough credits',
};

/* A product's photo on white, as Amazon shoots them; a parcel when
 * there is none or it does not load. */
function ProductPhoto({ src, size }) {
  const [broken, setBroken] = useState(false);
  return (
    <span className={`${m.photo} ${!src || broken ? m.photoEmpty : ''}`} style={{ '--size': `${size}px` }} aria-hidden="true">
      {src && !broken ? (
        <img src={src} alt="" width={size} height={size} decoding="async" referrerPolicy="no-referrer" onError={() => setBroken(true)} />
      ) : (
        <svg viewBox="0 0 24 24" width={size * 0.4} height={size * 0.4} focusable="false">
          <path d="M12 3.5l8 4v9l-8 4-8-4v-9z M4 7.5l8 4 8-4M12 11.5v9" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}

/* Seconds since the credits were taken, so the wait is a number, not a guess. */
function Elapsed({ since }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const sec = since ? Math.max(0, Math.floor((now - since) / 1000)) : 0;
  return <span className={m.elapsed} aria-hidden="true">{Math.floor(sec / 60)}:{String(sec % 60).padStart(2, '0')}</span>;
}

export function NewListingPage() {
  const location = useLocation();
  return <NewListing key={location.key} />;
}

function NewListing() {
  const navigate = useNavigate();
  const location = useLocation();
  const raw = location.state?.raw ?? null;
  const condition = location.state?.condition ?? 'new';
  // world1: chosen in the form ("On more eBay sites"): the sites are picked once the product is known.
  const multi = Boolean(location.state?.multi);
  const { lookUp, makeListing, settings, listingCredits: LISTING, refreshAll } = useSellerData();
  const home = settings?.marketplace ?? 'US';
  const [sites, setSites] = useState(() => [home]);
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
  // The product, as soon as it is known: shown while the listing is made.
  const [product, setProduct] = useState(null);
  const [amazon, setAmazon] = useState(MARKETPLACE[settings?.marketplace ?? 'US']?.amazon ?? 'amazon.com');
  const [startedAt, setStartedAt] = useState(0);
  const started = useRef(false);

  useEffect(() => { document.title = 'Remvo | New listing'; }, []);

  function fail(message, creditsBack = false) {
    setFailure(message);
    setReturned(creditsBack);
    setStage('failed');
  }

  // Several sites: one bundle, then the page that follows them all.
  async function runWorld() {
    setStage('starting');
    try {
      const { world } = await sellerApi.createWorld({ input: input.value, ...(pick && input.kind === 'barcode' ? { asin: pick } : {}), condition, sites });
      refreshAll?.();
      navigate(worldPath(world.id), { replace: true });
    } catch (err) {
      if (err.status === 402) { setStage('short'); return; }
      fail(err.message || 'Something went wrong on our side. Try again in a minute.');
    }
  }

  async function run(read, asin = null) {
    setStage('running');
    setDone(-1);
    const t0 = Date.now();
    setStartedAt(t0);
    try {
      const job = await makeListing({ input: read.value, asin, condition }, (j) => {
        setDone(j.step - 1);
        if (j.source?.title) setProduct((p) => ({ title: j.source.title, image: j.source.image ?? p?.image ?? null, asin: p?.asin ?? asin }));
      });
      if (!job) { navigate(SELLER_ROUTES.LISTINGS, { replace: true }); return; }
      if (job.status === 'failed') { fail(job.failure, true); return; }
      navigate(listingPath(job.id), { replace: true, state: { madeIn: Math.round((Date.now() - t0) / 1000) } });
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
        if (MARKETPLACE[found.amazon]) setAmazon(MARKETPLACE[found.amazon].amazon);
        if (found.matches) { setMatches(found.matches); setPick(found.matches[0].asin); setStage('pick'); return; }
        setPick(found.product?.asin ?? null);
        if (found.product) setProduct({ title: found.product.title, image: found.product.image ?? null, asin: found.product.asin });
        if (multi) { setStage('sites'); return; }
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
              {matches.map((x) => (
                <div key={x.asin} className={m.matchWrap}>
                  <button type="button" role="radio" aria-checked={pick === x.asin} className={`${s.pack} ${s.match} ${m.match}`} onClick={() => setPick(x.asin)}>
                    <ProductPhoto src={x.image} size={64} />
                    <span className={s.packMain}>
                      <span className={s.matchTitle}>{x.title}</span>
                      <span className={`${s.small} ${s.mono}`}>{x.asin}</span>
                    </span>
                    <span className={s.radio} aria-hidden="true" />
                  </button>
                  <a className={m.view} href={`https://www.${amazon}/dp/${x.asin}`} target="_blank" rel="noopener noreferrer">
                    View on {amazon}<IconExternal size={14} /><span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </div>
              ))}
            </div>
            <div className={s.section}>
              <button type="button" className={`${s.button} ${s.primary} ${s.block}`} onClick={() => { const x = matches.find((y) => y.asin === pick); if (x) setProduct({ title: x.title, image: x.image ?? null, asin: x.asin }); if (multi) setStage('sites'); else run(input, pick); }}>
                {multi ? 'Choose the eBay sites' : `Make listing, ${LISTING} credits`}
              </button>
            </div>
          </div>
        )}

        {(stage === 'sites' || stage === 'starting') && (
          <SitesStage
            product={product}
            amazon={amazon}
            home={home}
            sites={sites}
            setSites={setSites}
            busy={stage === 'starting'}
            onMake={runWorld}
          />
        )}

        {stage === 'running' && (
          <div className={s.section}>
            <div className={m.making} aria-live="polite">
              <span className={m.bar} style={{ '--p': (done + 1) / steps.length }} aria-hidden="true" />
              <div className={m.product}>
                <ProductPhoto src={product?.image} size={72} />
                <div className={m.productText}>
                  <p className={m.productTitle}>{product?.title ?? 'Finding the product'}</p>
                  <p className={m.productMeta}>
                    {product?.asin && <span className={s.mono}>{product.asin}</span>}
                    <span>{CONDITION[condition].label}</span>
                  </p>
                </div>
                <Elapsed since={startedAt} />
              </div>
              <ol className={`${s.steps} ${m.steps}`}>
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
              {multi
                ? `${sites.length} eBay sites use ${worldCredits(sites.length)} credits and your balance is lower. Top up, then make them again from Home.`
                : `A listing uses ${LISTING} credits and your balance is lower. Top up, then make it again from Home.`}
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

/* ──────────────────────────────────────────────────────────────────
 * Which eBay sites (world1)
 *
 * The product, then the seven sites as a list to tick, the seller's
 * own site ticked first. What it costs is said beside the button and
 * changes as sites are ticked; the three bundles are named under it.
 * ────────────────────────────────────────────────────────────────── */
function SitesStage({ product, amazon, home, sites, setSites, busy, onMake }) {
  const n = sites.length;
  const toggle = (id) => setSites((x) => (x.includes(id) ? x.filter((y) => y !== id) : [...x, id]));
  const all = n === MARKETPLACES.length;
  return (
    <div className={s.section}>
      {/* What is about to be listed, and a way to check it before any credits go (world2).
          A link is not read until the listings are made, so it has no title yet: say so. */}
      {product && (
        <div className={`${s.card} ${m.chosen}`}>
          <ProductPhoto src={product.image} size={56} />
          <div className={m.productText}>
            <p className={m.productTitle}>{product.title ?? 'The product at this link'}</p>
            {product.asin && (
              <p className={m.productMeta}>
                <a className={m.view} href={`https://www.${amazon}/dp/${product.asin}`} target="_blank" rel="noopener noreferrer">
                  View on {amazon}<IconExternal size={14} /><span className="sr-only"> (opens in a new tab)</span>
                </a>
              </p>
            )}
          </div>
        </div>
      )}

      <div className={s.section}>
        <div className={s.groupHead}>
          <h2 className={s.groupTitle} id="sites-heading">List it on</h2>
          <button type="button" className={s.groupLink} onClick={() => setSites(all ? [home] : MARKETPLACES.map((x) => x.id))}>
            {all ? 'Just mine' : 'All seven'}
          </button>
        </div>
        <div className={s.packs} role="group" aria-labelledby="sites-heading">
          {MARKETPLACES.map((x) => (
            <button key={x.id} type="button" role="checkbox" aria-checked={sites.includes(x.id)} className={`${s.pack} ${m.site}`} onClick={() => toggle(x.id)}>
              <span className={m.siteCode} aria-hidden="true">{x.id}</span>
              <span className={s.packMain}>
                <span className={s.packCredits}>{x.site}</span>
                <span className={s.packSub}>{x.id === home ? 'Your site' : `${x.name}`}, in {x.lang}</span>
              </span>
              <span className={m.tick} aria-hidden="true" />
            </button>
          ))}
        </div>
        <p className={s.groupNote}>
          Each site gets its own listing: written in its language, in its categories, with its parcel service and a price from its own live listings.
        </p>
      </div>

      <div className={s.section}>
        <button type="button" className={`${s.button} ${s.primary} ${s.block}`} disabled={!n || busy} onClick={onMake}>
          {busy ? 'Starting…' : n ? `Make ${n === 1 ? 'the listing' : `${n} listings`}, ${worldCredits(n)} credits` : 'Pick at least one site'}
        </button>
        <p className={s.groupNote}>One site 3 credits, three sites 8, all seven 15. A site that does not work gives its credits back.</p>
      </div>
    </div>
  );
}
