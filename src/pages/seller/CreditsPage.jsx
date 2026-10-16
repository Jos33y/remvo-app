import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { PageHeader } from '@components/ui/seller/PageHeader';
import { BonusTag, SegmentedChoice, TopUpSheet, perListing, useOffers } from '@components/ui/seller/parts';
import { IconAlert, IconCheck, IconChevronRight } from '@components/ui/seller/icons';
import { useToast } from '@components/ui/seller/Toast';
import { useSellerData } from '@context/SellerData';
import { longDate, signed, when } from '@lib/sellerFormat';
import { count, num, plural } from '@lib/plural';
import { CURRENCIES, money } from '@lib/market';
import { PRICING, creditsFor, listingPath, listingsFor, siteUrl } from '@utils/constants';
import s from '@styles/pages/seller/app.module.css';
import c from '@styles/pages/seller/credits.module.css';

/* ──────────────────────────────────────────────────────────────────
 * Credits
 *
 * The balance, a way to add to it, and every movement: top-ups in,
 * listings out, failed listings back. A seller should be able to
 * reconcile this page against their card statement and their listings
 * without asking.
 *
 * ?topup=1 (from the marketing site's Top up, via /billing) opens the
 * top-up sheet on arrival.
 *
 * ?checkout_id=... is Polar sending the seller back after paying. The
 * credits arrive separately, by webhook, usually within seconds; the
 * page says it is waiting, checks every couple of seconds, and says
 * when they are in. If Polar is slow it says that too, plainly: the
 * payment is safe and the credits will appear here by themselves.
 * ────────────────────────────────────────────────────────────────── */

const POLL_MS = 2000;
const PATIENT_MS = 45_000;
const GIVE_UP_MS = 5 * 60_000;

function TopUpReturn({ checkoutId, onDone }) {
  const { topUpStatus, refreshWallet } = useSellerData();
  const toast = useToast();
  const [state, setState] = useState({ phase: 'waiting', credits: null });
  const started = useRef(Date.now());

  useEffect(() => {
    let stop = false;
    let timer;
    async function check() {
      try {
        const st = await topUpStatus(checkoutId);
        if (stop) return;
        if (st.status === 'credited') {
          setState({ phase: 'done', credits: st.credits });
          await refreshWallet();
          toast(`${count(st.credits, 'credit')} added`);
          return;
        }
        const waited = Date.now() - started.current;
        if (waited > GIVE_UP_MS) { setState({ phase: 'slow', credits: st.credits }); return; }
        setState({ phase: waited > PATIENT_MS ? 'slow' : 'waiting', credits: st.credits });
      } catch (err) {
        if (stop) return;
        if (err.status === 404) { setState({ phase: 'unknown', credits: null }); return; }
      }
      timer = setTimeout(check, POLL_MS);
    }
    check();
    return () => { stop = true; clearTimeout(timer); };
  }, [checkoutId]);

  const { phase, credits } = state;
  return (
    <div className={s.section}>
      <div className={`${s.notice} ${phase === 'done' ? s.noticeDone : ''} ${phase === 'unknown' ? s.noticeDanger : ''}`} role="status" aria-live="polite">
        {phase === 'done' ? <IconCheck size={20} /> : phase === 'unknown' ? <IconAlert size={20} /> : <span className={s.pulse} aria-hidden="true" />}
        <span className={s.noticeBody}>
          {phase === 'waiting' && <><strong>Payment received.</strong> Adding {credits ? count(credits, 'credit') : 'your credits'} to your balance.</>}
          {phase === 'slow' && <><strong>Payment received.</strong> Polar is taking longer than usual to confirm it. Your credits will appear here on their own; you can leave this page.</>}
          {phase === 'done' && <><strong>{count(credits, 'credit')} added.</strong> Thank you.</>}
          {phase === 'unknown' && <>We could not find that top-up on this account. If you paid, write to us and we will sort it out.</>}
        </span>
        {(phase === 'done' || phase === 'unknown') && (
          <button type="button" className={s.noticeClose} onClick={onDone}>Done</button>
        )}
      </div>
    </div>
  );
}

/* What the balance can do, said first in listings: the unit a seller
 * thinks in. Credits, their worth (gold: money) and their date follow. */
function Balance() {
  const { summary, walletStatus, refreshWallet, listingCredits } = useSellerData();
  if (!summary) {
    const failed = walletStatus === 'error';
    return (
      <section className={c.balance} aria-label="Balance" aria-busy={!failed}>
        <p className={c.eyebrow}>Balance</p>
        <p className={c.pending} role={failed ? 'alert' : 'status'}>{failed ? 'Your balance did not load.' : 'Getting your balance.'}</p>
        {failed && <button type="button" className={`${s.button} ${s.secondary}`} onClick={refreshWallet}>Try again</button>}
      </section>
    );
  }
  const { balance, worth, currency, listingsLeft, expiresAt, welcome } = summary;
  const onlyWelcome = welcome && welcome.credits === balance;
  const pct = Math.min(1, listingsLeft / 100);
  return (
    <section className={c.balance} aria-labelledby="balance-heading">
      <p className={c.eyebrow}>Balance</p>
      <h2 id="balance-heading" className={c.figure}>
        <span className={c.figureNum}>{num(listingsLeft)}</span> {plural(listingsLeft, 'listing')} left
      </h2>
      <div className={c.gauge} aria-hidden="true"><span style={{ '--p': pct }} /></div>
      <dl className={c.facts}>
        <div><dt>Credits</dt><dd className={s.mono}>{num(balance)}</dd></div>
        <div><dt>Worth</dt><dd className={c.money}>{onlyWelcome ? 'Free' : money(worth, currency)}</dd></div>
        <div><dt>{onlyWelcome ? 'Welcome credits last until' : 'Credits last until'}</dt><dd>{onlyWelcome ? longDate(welcome.expiresAt) : expiresAt ? longDate(expiresAt) : 'No date yet'}</dd></div>
      </dl>
      <p className={c.note}>
        {onlyWelcome
          ? 'Your first listing is on us. The packs below are for the rest.'
          : `${listingCredits} credits make a listing.${welcome ? ` Includes ${count(welcome.credits, 'welcome credit')}, until ${longDate(welcome.expiresAt)}.` : ''}`}
      </p>
    </section>
  );
}

/* The seller's own pace, from the last 7 days: which pack lasts them a
 * month or more, said in weeks. Honest, theirs, and only when there is
 * a pace to go by. */
function usePace(offers) {
  const { jobs, listingCredits } = useSellerData();
  return useMemo(() => {
    const week = Date.now() - 7 * 86_400_000;
    const made = jobs.filter((j) => j.status === 'ready' && Date.parse(j.createdAt) >= week).length;
    if (made < 2 || !offers.length) return null;
    const perWeek = made * listingCredits;
    const fit = offers.find((o) => o.total / perWeek >= 4) ?? offers.at(-1);
    return { made, fit, weeks: Math.floor(fit.total / perWeek) };
  }, [jobs, listingCredits, offers]);
}

/* Your own amount, as a row of its own under the packs: the way in
 * between $20 and $50, and for a seller with a sum in mind. Same price
 * per credit; the peak bonus counts here too, the volume bonus does not,
 * so an amount that matches a bonus pack says what that pack gives. */
function OwnAmount({ offers, peak, currency, ready, busy, onBuy }) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const inputId = useId();
  const hintId = useId();
  const min = PRICING.CUSTOM.min[currency];
  const max = PRICING.CUSTOM.max[currency];
  const whole = /^\d+$/.test(amount) ? Number(amount) : null;
  const credits = whole ? creditsFor(whole, currency) : 0;
  const peakBonus = peak && credits >= peak.minCredits ? Math.floor((credits * peak.percent) / 100) : 0;
  const better = whole ? offers.find((o) => o.pack.price[currency] === whole && o.volumeBonus > 0) : null;
  const symbol = CURRENCIES.find((x) => x.id === currency).symbol;

  useEffect(() => { setError(''); }, [currency]);

  function submit(e) {
    e.preventDefault();
    if (whole === null || whole < min || whole > max) {
      setError(`Enter a whole amount from ${money(min, currency)} to ${money(max, currency, { whole: true })}.`);
      return;
    }
    onBuy({ amount: whole });
  }

  let hint = `${money(min, currency)} to ${money(max, currency, { whole: true })}, whole amounts, at ${money(PRICING.CREDIT[currency], currency)} a credit.`;
  if (whole) {
    hint = `${count(credits, 'credit')}${peakBonus ? `, plus ${num(peakBonus)} peak bonus` : ''}, ${count(listingsFor(credits + peakBonus), 'listing')}.`;
    if (better) hint += ` The ${money(whole, currency, { whole: true })} pack above gives ${num(better.total)}.`;
  }

  return (
    <form className={c.own} onSubmit={submit} noValidate>
      <div className={c.ownText}>
        <label htmlFor={inputId} className={c.ownLabel}>Your own amount</label>
        {error
          ? <p id={hintId} className={`${s.fieldError} ${c.ownError}`} role="alert"><IconAlert size={16} />{error}</p>
          : <p id={hintId} className={c.ownHint} aria-live="polite">{hint}</p>}
      </div>
      <div className={c.ownControls}>
        <div className={`${s.inputWrap} ${c.ownField}`}>
          <span className={`${s.inputIcon} ${s.inputPrefix}`} aria-hidden="true">{symbol}</span>
          <input
            id={inputId}
            className={`${s.input} ${s.inputMoney}`}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            enterKeyHint="go"
            placeholder={String(PRICING.CUSTOM.min[currency] * 2)}
            value={amount}
            onChange={(e) => { setAmount(e.target.value.replace(/[^\d]/g, '').slice(0, 5)); setError(''); }}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={hintId}
          />
        </div>
        <button type="submit" className={`${s.button} ${s.secondary} ${c.ownButton}`} disabled={!ready || busy !== null}>
          {busy === 'own' ? 'Opening…' : 'Top up'}
        </button>
      </div>
    </form>
  );
}

/* The packs, on the page itself: a tap opens Polar's checkout. Each tile
 * leads with what the money makes (listings), then the credits and the
 * price of a listing. Tags sit in a row of their own on every tile, so
 * the lines of every tile line up whether a tile has a tag or not. */
function Packs() {
  const { topUp, settings, updateSettings, topUpsEnabled, summary, listingCredits } = useSellerData();
  const { offers, peak } = useOffers();
  const pace = usePace(offers);
  const currency = settings?.currency ?? 'USD';
  const [busy, setBusy] = useState(null);
  const [failure, setFailure] = useState('');
  const ready = Boolean(summary) && topUpsEnabled;

  async function buy(what, key) {
    setBusy(key); setFailure('');
    try { await topUp(what); } catch (err) { setFailure(err.message); setBusy(null); }
  }

  return (
    <section className={s.section} aria-labelledby="packs-heading">
      <div className={c.packsHead}>
        <h2 id="packs-heading" className={s.groupTitle}>Top up</h2>
        <div className={c.currency}>
          <SegmentedChoice
            label="Pay in"
            labelHidden
            options={CURRENCIES.map((x) => ({ id: x.id, label: `${x.symbol} ${x.id}` }))}
            value={currency}
            onChange={(id) => { setFailure(''); updateSettings({ currency: id }).catch((err) => setFailure(err.message)); }}
          />
        </div>
      </div>
      {peak && (
        <p className={s.peakNote}>
          <strong>Peak bonus:</strong> {peak.percent}% extra credits on top-ups of {money(PRICING.PACKS.find((p) => p.credits === peak.minCredits)?.price[currency] ?? 20, currency)} or more, until {PRICING.PEAK.lastDay}.
        </p>
      )}
      {pace && (
        <p className={c.pace}>
          You made {count(pace.made, 'listing')} in the last 7 days. The {money(pace.fit.pack.price[currency], currency)} pack lasts about {count(pace.weeks, 'week')} at that pace.
        </p>
      )}
      {summary && !topUpsEnabled && <p className={s.notice} role="status">Top-ups open soon. Nothing can be bought just yet.</p>}
      {failure && <p className={`${s.notice} ${s.noticeDanger}`} role="alert"><IconAlert size={20} /><span>{failure}</span></p>}
      <ul className={c.packs} role="list" style={{ '--n': offers.length }}>
        {offers.map((o) => {
          const price = o.pack.price[currency];
          const fits = pace?.fit.credits === o.credits;
          const each = perListing(price, o.total, listingCredits, currency);
          return (
            <li key={o.credits}>
              <button type="button" className={`${c.pack} ${o.volumeBonus || o.peakBonus ? c.packBonus : ''} ${fits ? c.packFits : ''}`} onClick={() => buy({ credits: o.credits }, o.credits)} disabled={!ready || busy !== null}
                aria-label={`Top up ${money(price, currency)}: ${count(listingsFor(o.total), 'listing')}, ${count(o.total, 'credit')}, ${each} a listing.${fits ? ' Fits your pace.' : ''} Opens Polar's secure checkout.`}>
                <span className={c.packPrice}>{money(price, currency)}</span>
                <span className={c.packTags}>
                  {fits && <span className={c.fitsTag}>Fits your pace</span>}
                  <BonusTag offer={o} />
                </span>
                <span className={c.packListings}>{count(listingsFor(o.total), 'listing')}</span>
                <span className={c.packCredits}>{count(o.total, 'credit')}</span>
                <span className={c.packEach}>{busy === o.credits ? 'Opening checkout…' : <><span className={c.packEachNum}>{each}</span> a listing</>}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <OwnAmount offers={offers} peak={peak} currency={currency} ready={ready} busy={busy} onBuy={(what) => buy(what, 'own')} />
      <ul className={c.assure} role="list">
        <li><IconCheck size={16} /> No subscription. You pay only when you top up.</li>
        <li><IconCheck size={16} /> Unused credits refunded in full within {PRICING.REFUND_DAYS} days.</li>
        <li><IconCheck size={16} /> Credits last {PRICING.EXPIRY_MONTHS} months, and every top-up extends them.</li>
        <li><IconCheck size={16} /> Checkout by Polar. You see the total, with any tax, before you pay.</li>
      </ul>
    </section>
  );
}

function groupByMonth(rows) {
  const out = [];
  for (const r of rows) {
    const d = new Date(r.at);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const label = d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    if (!out.length || out.at(-1).key !== key) out.push({ key, label, rows: [] });
    out.at(-1).rows.push(r);
  }
  return out;
}

export function CreditsPage() {
  const { history, settings } = useSellerData();
  const currency = settings?.currency ?? 'USD';
  const [params, setParams] = useSearchParams();
  const [topUp, setTopUp] = useState(params.get('topup') === '1');
  const checkoutId = params.get('checkout_id');
  const clearReturn = () => { params.delete('checkout_id'); setParams(params, { replace: true, preventScrollReset: true }); };
  const months = useMemo(() => groupByMonth(history), [history]);

  useEffect(() => { document.title = 'Remvo | Credits'; }, []);

  const closeTopUp = () => {
    setTopUp(false);
    if (params.has('topup')) { params.delete('topup'); setParams(params, { replace: true, preventScrollReset: true }); }
  };

  return (
    <>
      <PageHeader title="Credits" />
      <div className={s.content}>
        {checkoutId && <TopUpReturn key={checkoutId} checkoutId={checkoutId} onDone={clearReturn} />}

        <div className={s.section}>
          <Balance />
        </div>

        <Packs />

        <section className={s.section} aria-labelledby="how-heading">
          <div className={s.groupHead}><h2 id="how-heading" className={s.groupTitle}>How credits work</h2></div>
          <div className={s.group}>
            <div className={s.row}>
              <span className={s.rowMain}><span className={s.rowTitle}>A credit</span></span>
              <span className={`${s.rowValue} ${s.rowValueMono}`}>{money(PRICING.CREDIT[currency], currency)}</span>
            </div>
            <div className={s.row}>
              <span className={s.rowMain}><span className={s.rowTitle}>A listing</span></span>
              <span className={`${s.rowValue} ${s.rowValueMono}`}>{PRICING.JOBS.LISTING.credits} credits</span>
            </div>
            <div className={s.row}>
              <span className={s.rowMain}><span className={s.rowTitle}>Credits last</span></span>
              <span className={s.rowValue}>{PRICING.EXPIRY_MONTHS} months</span>
            </div>
            <a href={siteUrl('/credits')} className={s.row}>
              <span className={s.rowMain}><span className={s.rowTitle}>Credit terms and refunds</span></span>
              <span className={s.chevron}><IconChevronRight /></span>
            </a>
          </div>
          <p className={s.groupNote}>Every top-up extends all the credits you have bought, bonus credits included. Welcome credits last {PRICING.WELCOME.days} days. A listing that fails gives its credits back on its own.</p>
        </section>

        <section className={s.section} aria-labelledby="history-heading">
          <div className={s.groupHead}><h2 id="history-heading" className={s.groupTitle}>History</h2></div>
          {months.map((m) => (
            <div key={m.key} className={s.month}>
              <h3 className={s.monthLabel}>{m.label}</h3>
              <div className={s.group}>
                {m.rows.map((r) => {
                  const inner = (
                    <>
                      <span className={s.rowMain}>
                        <span className={s.rowTitle}>{r.label}</span>
                        <span className={s.rowSub}>{when(r.at)}</span>
                      </span>
                      <span className={`${s.rowValue} ${s.rowValueMono} ${r.credits > 0 ? s.plus : ''} ${r.kind === 'bonus' ? c.bonusValue : ''}`}>
                        {signed(r.credits)}
                      </span>
                    </>
                  );
                  return r.jobId
                    ? <Link key={r.id} to={listingPath(r.jobId)} className={s.row}>{inner}</Link>
                    : <div key={r.id} className={s.row}>{inner}</div>;
                })}
              </div>
            </div>
          ))}
        </section>
      </div>
      <TopUpSheet open={topUp} onClose={closeTopUp} />
    </>
  );
}
