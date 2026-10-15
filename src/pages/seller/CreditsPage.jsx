import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { PageHeader } from '@components/ui/seller/PageHeader';
import { BalanceCard, TopUpSheet } from '@components/ui/seller/parts';
import { IconAlert, IconCheck, IconChevronRight } from '@components/ui/seller/icons';
import { useToast } from '@components/ui/seller/Toast';
import { useSellerData } from '@context/SellerData';
import { signed, when } from '@lib/sellerFormat';
import { count } from '@lib/plural';
import { money } from '@lib/market';
import { PRICING, listingPath, siteUrl } from '@utils/constants';
import s from '@styles/pages/seller/app.module.css';

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
  const clearReturn = () => { params.delete('checkout_id'); setParams(params, { replace: true }); };
  const months = useMemo(() => groupByMonth(history), [history]);

  useEffect(() => { document.title = 'Remvo | Credits'; }, []);

  const closeTopUp = () => {
    setTopUp(false);
    if (params.has('topup')) { params.delete('topup'); setParams(params, { replace: true }); }
  };

  return (
    <>
      <PageHeader title="Credits" />
      <div className={s.content}>
        {checkoutId && <TopUpReturn key={checkoutId} checkoutId={checkoutId} onDone={clearReturn} />}

        <div className={s.section}>
          <BalanceCard onTopUp={() => setTopUp(true)} />
        </div>

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
          <p className={s.groupNote}>Every top-up extends all the credits you have bought. Welcome credits last {PRICING.WELCOME.days} days. A listing that fails gives its credits back on its own.</p>
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
                      <span className={`${s.rowValue} ${s.rowValueMono} ${r.credits > 0 ? s.plus : ''}`}>
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
