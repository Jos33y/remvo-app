import { useEffect, useId, useRef, useState } from 'react';
import { listingPrice } from '@lib/sellerFormat';
import { IconAlert } from '@components/ui/seller/icons';
import s from '@styles/pages/seller/app.module.css';
import P from '@styles/ui/profit/profit-slip.module.css';

/* ──────────────────────────────────────────────────────────────────
 * The profit slip (profit1, redrawn in tools1)
 *
 * A sum read from the top down, the answer first:
 *
 *   You keep          $49.82      36.1% margin, even at $80.32
 *   Sale                                              $108.99
 *   Postage you charge                               [ Free ]
 *   eBay fees  13.6% of $108.99, plus $0.40         −$15.22  ▸
 *   Item cost                                        [ 60.00 ]
 *   Postage you pay                                  [ None ]
 *
 * Money in, then money out. The figures a seller types are lines in
 * the sum, not a form above it, and an empty one says what it wants
 * (Add, None, Free) rather than showing a zero that looks entered.
 * eBay's fees are one line; the breakdown, the rate rule and "use your
 * own rate" open from it.
 *
 * The same slip is on a listing in the app (figures saved to the
 * listing) and on remvo.app's fee calculator (figures kept in the
 * page). Both send the figures to remvo-api, which works the sum out
 * from one fee table, so the two always agree.
 * ────────────────────────────────────────────────────────────────── */

const SAVE_AFTER_MS = 600;
const MINUS = '−';

export const money = (v, currency) => (v < 0 ? `${MINUS}${listingPrice(-v, currency)}` : listingPrice(v, currency));
const out = (v, currency) => `${MINUS}${listingPrice(Math.abs(v), currency)}`;
const pct = (r) => `${Number((r * 100).toFixed(2))}%`;
const pctOf = (v) => `${v < 0 ? MINUS : ''}${Math.abs(Number(v)).toLocaleString('en-GB', { maximumFractionDigits: 1 })}%`;

/* What a seller types, as a number: 12.50 or 12,50. null for an empty box. */
export function readAmount(text) {
  const t = String(text ?? '').trim().replace(/^[£$€]\s*|\s*[£$€]$/g, '');
  if (!t) return { value: null };
  if (!/^\d{1,5}([.,]\d{1,2})?$/.test(t)) return { error: 'Enter an amount such as 12.50.' };
  return { value: Number(t.replace(',', '.')) };
}

/* A saved figure as the seller types it on their site: 9.50, or 9,50 in euros. */
const shown = (v, currency, plain) => {
  if (v == null) return '';
  if (plain) return String(v);
  return currency === 'EUR' ? Number(v).toFixed(2).replace('.', ',') : Number(v).toFixed(2);
};

/* "13.6% of $108.99", or "13.6% of the first $7,500, 2.35% of the rest":
 * only the bands this sale reaches, never the whole rule. */
const whole = (v, currency) => listingPrice(v, currency).replace(/[.,]00(?=\D*$)/, '');

export function appliedRate(rate, currency) {
  const bands = rate?.bands ?? [];
  if (!bands.length) return '';
  if (bands.length === 1) return `${pct(bands[0][1])} of ${listingPrice(rate.base, currency)}`;
  return bands.map(([upTo, r], i) => {
    if (i === 0) return `${pct(r)} of the first ${whole(upTo, currency)}`;
    if (upTo == null) return `${pct(r)} of the rest`;
    return `${pct(r)} up to ${whole(upTo, currency)}`;
  }).join(', ');
}

/* A figure typed into the sum. Saves after a pause, on Enter, or on leaving the box. */
function Figure({ label, value, currency, placeholder, onSave, max = 99_999, percent = false, wanted = false, describedBy }) {
  const id = useId();
  const errId = useId();
  const [text, setText] = useState(() => shown(value, currency, percent));
  const [error, setError] = useState('');
  const timer = useRef(null);
  const last = useRef(value ?? null);

  useEffect(() => {
    if (document.activeElement?.id !== id) setText(shown(value, currency, percent));
    last.current = value ?? null;
  }, [value, id, currency, percent]);
  useEffect(() => () => clearTimeout(timer.current), []);

  async function commit(raw, leaving = false) {
    clearTimeout(timer.current);
    const r = readAmount(raw);
    if (r.error || (r.value != null && r.value > max)) { setError(r.error ?? `Up to ${max}.`); return; }
    setError('');
    if (leaving) setText(shown(r.value, currency, percent));
    if (r.value === last.current) return;
    last.current = r.value;
    try {
      await onSave(r.value);
    } catch (err) {
      setError(err?.message || 'That did not save. Try again.');
    }
  }

  // The currency mark only beside a figure: an empty box reads Add, None or Free.
  const sym = text && !percent ? { USD: '$', CAD: 'C$', GBP: '£' }[currency] : null;
  const after = text ? (percent ? '%' : currency === 'EUR' ? '€' : null) : null;
  return (
    <span className={P.figure}>
      <label htmlFor={id} className="sr-only">{label}</label>
      <span className={`${P.box} ${wanted && !text ? P.boxWanted : ''}`}>
        {sym && <span className={P.sym} aria-hidden="true">{sym}</span>}
        <input
          id={id}
          className={P.input}
          inputMode="decimal"
          autoComplete="off"
          enterKeyHint="done"
          value={text}
          placeholder={placeholder}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={[error ? errId : null, describedBy].filter(Boolean).join(' ') || undefined}
          onChange={(e) => {
            const v = e.target.value;
            setText(v);
            if (error) setError('');
            clearTimeout(timer.current);
            timer.current = setTimeout(() => { if (!readAmount(v).error) commit(v); }, SAVE_AFTER_MS);
          }}
          onBlur={(e) => commit(e.target.value, true)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit(e.currentTarget.value, true); } }}
        />
        {after && <span className={P.after} aria-hidden="true">{after}</span>}
      </span>
      {error && <span id={errId} className={P.error} role="alert"><IconAlert size={14} />{error}</span>}
    </span>
  );
}

function Row({ label, sub = null, children, className = '' }) {
  return (
    <div className={`${P.row} ${className}`}>
      <span className={P.rowLabel}>
        {label}
        {sub && <span className={P.rowSub}>{sub}</span>}
      </span>
      <span className={P.rowValue}>{children}</span>
    </div>
  );
}

/**
 * @param {object} props
 * @param {object} props.profit            remvo-api's answer (modules/profit/calc.js)
 * @param {{ cost?, postCost?, postCharged?, feeRate? }} props.values   the seller's own figures
 * @param {(field: string, value: number|null) => Promise} props.onSave
 * @param {string} props.siteName          eBay.com, eBay.co.uk...
 * @param {string} props.marketplace       US, UK...
 * @param {(patch: object) => void} [props.onSellerType]   answers "private or business?"
 * @param {() => void} [props.onOpenSettings]               "Change" beside the seller type
 * @param {boolean} [props.busy]           a sum is on its way
 */
export function ProfitSlip({ profit: p, values = {}, onSave, siteName, marketplace, onSellerType, onOpenSettings, busy = false }) {
  const [open, setOpen] = useState(false);
  const [ownRate, setOwnRate] = useState(values.feeRate != null);
  const feesId = useId();
  const costHint = useId();
  if (!p) return null;
  const cur = p.currency;
  // eBay.com and eBay.ca sellers say shipping; the rest say postage.
  const post = marketplace === 'US' || marketplace === 'CA' ? 'Shipping' : 'Postage';

  if (p.needs?.includes('price')) {
    return (
      <div className={`${s.card} ${P.slip}`}>
        <p className={P.empty}>Set a price first. The fees and what you keep are worked out from it.</p>
      </div>
    );
  }

  const fees = p.fees ?? [];
  const paid = fees.filter((f) => !f.reclaimed);
  const reclaimed = fees.find((f) => f.reclaimed);
  const loss = p.ready && p.profit < 0;
  const order = fees.find((f) => f.key === 'order');
  const reg = fees.find((f) => f.key === 'regulatory');
  const vat = fees.find((f) => f.key === 'vat' && !f.reclaimed);
  const split = p.asks || p.sellerType != null;
  const who = p.sellerType === 'business' ? `business seller${p.vatRegistered ? ', VAT registered' : ''}` : 'private seller';

  // "13.6% of $108.99, plus $0.40 an order": joined by hand, because a
  // euro amount has its own comma (0,45 €).
  const parts = [appliedRate(p.rate, cur), order && `${money(order.amount, cur)} an order`, reg && `${money(reg.amount, cur)} regulatory`, vat && 'VAT'].filter(Boolean);
  const feeSub = !fees.length
    ? `None for a ${who} on ${siteName}`
    : parts.length > 1 ? `${parts.slice(0, -1).join(', ')}, plus ${parts.at(-1)}` : parts[0];

  return (
    <div className={`${s.card} ${P.slip}`} aria-busy={busy || undefined}>
      {p.asks && onSellerType && (
        <div className={P.ask} role="group" aria-labelledby="profit-ask">
          <p id="profit-ask" className={P.askText}>
            <strong>Is your {siteName} account private or business?</strong>
            {' '}These are private seller fees, eBay&apos;s default for a new account.
          </p>
          <div className={P.askButtons}>
            <button type="button" className={`${s.button} ${s.secondary} ${P.askButton}`} onClick={() => onSellerType({ sellerType: 'private' })}>Private</button>
            <button type="button" className={`${s.button} ${s.secondary} ${P.askButton}`} onClick={() => onSellerType({ sellerType: 'business' })}>Business</button>
          </div>
        </div>
      )}

      {/* The answer, first. */}
      <div className={`${P.hero} ${loss ? P.heroLoss : ''}`} aria-live="polite" aria-atomic="true">
        {p.ready ? (
          <>
            <p className={P.heroLabel}>{loss ? 'You lose' : 'You keep'}</p>
            <p className={P.heroFigure}>{money(Math.abs(p.profit), cur)}</p>
            <p className={P.heroFacts}>
              {p.margin != null && <span><span className={P.factNum}>{pctOf(p.margin)}</span> margin</span>}
              <span>Breaks even at <span className={P.factNum}>{money(p.breakEven, cur)}</span></span>
            </p>
          </>
        ) : (
          <>
            <p className={P.heroLabel}>You keep</p>
            <p className={P.heroWaiting} id={costHint}>Add your item cost to see what you keep.</p>
            <p className={P.heroFacts}><span>eBay takes <span className={P.factNum}>{money(p.feesTotal, cur)}</span></span></p>
          </>
        )}
      </div>

      <div className={P.sum}>
        {/* Money in */}
        {/* VAT registered: the sale as kept, postage in it, VAT out of it. */}
        <Row
          label={p.vatRegistered ? 'Sale, without VAT' : 'Sale'}
          sub={p.vatRegistered ? `${money(p.price, cur)}${p.postCharged ? ` and ${money(p.postCharged, cur)} ${post.toLowerCase()}` : ''}, less ${Math.round(p.vatRate * 100)}% VAT` : null}
        >
          <span className={P.amount}>{money(p.vatRegistered ? p.income : p.price, cur)}</span>
        </Row>
        <Row label={`${post} you charge`} sub={p.vatRegistered && p.postCharged ? 'In the sale above' : null}>
          <Figure label={`${post} you charge`} value={values.postCharged ?? null} currency={cur} placeholder="Free" onSave={(v) => onSave('postCharged', v)} />
        </Row>

        {/* Money out */}
        <div className={P.out}>
          {fees.length > 0 ? (
            <button type="button" className={`${P.row} ${P.feesRow}`} aria-expanded={open} aria-controls={feesId} onClick={() => setOpen((o) => !o)}>
              <span className={P.rowLabel}>
                eBay fees
                <span className={P.rowSub}>{feeSub}</span>
              </span>
              <span className={P.rowValue}>
                <span className={P.amount}>{out(p.feesTotal, cur)}</span>
                <span className={`${P.chev} ${open ? P.chevOpen : ''}`} aria-hidden="true" />
              </span>
            </button>
          ) : (
            <Row label="eBay fees" sub={feeSub}><span className={P.amount}>{money(0, cur)}</span></Row>
          )}

          {fees.length > 0 && (
            <div id={feesId} className={P.breakdown} hidden={!open}>
              {paid.map((f) => (
                <div key={f.key} className={P.subRow}>
                  <span>{f.key === 'final' ? `${f.label}, ${appliedRate(p.rate, cur)}` : f.label}</span>
                  <span className={P.amount}>{out(f.amount, cur)}</span>
                </div>
              ))}
              {reclaimed && <p className={P.note}>The {money(reclaimed.amount, cur)} VAT on these fees is yours to reclaim, so it is not counted.</p>}
              {p.rate && (ownRate ? (
                <div className={P.ownRate}>
                  <span className={P.ownLabel}>Your final value fee rate</span>
                  <Figure label="Your final value fee rate" value={values.feeRate ?? null} currency={cur} placeholder={String(Number((p.rate.bands?.[0]?.[1] ?? 0) * 100).toFixed(1)).replace(/\.0$/, '')} percent max={30} onSave={(v) => onSave('feeRate', v)} />
                  <button type="button" className={P.link} onClick={async () => { await onSave('feeRate', null); setOwnRate(false); }}>Use eBay&apos;s rate</button>
                </div>
              ) : (
                <p className={P.note}>
                  {p.rate.matched ? `eBay's rate for ${lower(p.rate.label)}: ${p.rate.text}.` : `eBay's rate for most categories, ${p.rate.text}. Yours may differ.`}
                  {' '}<button type="button" className={P.link} onClick={() => setOwnRate(true)}>Use your own rate</button>
                </p>
              ))}
            </div>
          )}

          <Row label="Item cost" sub={p.vatRegistered ? 'Without VAT' : null} className={!p.ready ? P.rowWanted : ''}>
            <span className={P.sign} aria-hidden="true">{MINUS}</span>
            <Figure label={p.vatRegistered ? 'Item cost, without VAT' : 'Item cost'} value={values.cost ?? null} currency={cur} placeholder="Add" wanted onSave={(v) => onSave('cost', v)} describedBy={!p.ready ? costHint : undefined} />
          </Row>
          <Row label={`${post} you pay`}>
            <span className={P.sign} aria-hidden="true">{MINUS}</span>
            <Figure label={`${post} you pay`} value={values.postCost ?? null} currency={cur} placeholder="None" onSave={(v) => onSave('postCost', v)} />
          </Row>
        </div>
      </div>

      {p.buyer && (
        <p className={P.buyer}>
          Your buyer also pays <span className={P.factNum}>{money(p.buyer.fee, cur)}</span> Buyer Protection, so <span className={P.factNum}>{money(p.buyer.pays, cur)}</span> in all. Business sellers&apos; buyers pay no such fee, so compare your total with their price.
        </p>
      )}

      <p className={P.foot}>
        {split ? `${siteName} fees for a ${who}` : `${siteName} fees, no eBay shop`}, checked {longDay(p.checked)}.
        {split && onOpenSettings && <> <button type="button" className={P.link} onClick={onOpenSettings}>Change</button></>}
        {' '}Not counted: {marketplace === 'US' || marketplace === 'CA' ? 'the fee on sales tax, shop and Top Rated rates.' : 'shop, Top Rated and international rates.'}
      </p>
    </div>
  );
}

const lower = (t) => t.charAt(0).toLowerCase() + t.slice(1);

function longDay(iso) {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}
