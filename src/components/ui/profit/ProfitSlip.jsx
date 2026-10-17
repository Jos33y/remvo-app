import { useEffect, useId, useRef, useState } from 'react';
import { listingPrice } from '@lib/sellerFormat';
import { MARKETPLACE } from '@lib/market';
import { IconAlert } from '@components/ui/seller/icons';
import s from '@styles/pages/seller/app.module.css';
import P from '@styles/ui/profit/profit-slip.module.css';

/* ──────────────────────────────────────────────────────────────────
 * The profit slip (profit1, redrawn in tools1)
 *
 * A sum read from the top down, the answer first:
 *
 *   You keep          $49.82      36.1% margin, 70.6% return...
 *   Sold for                                         [ 108.99 ]
 *   Shipping you charge                              [ Free ]
 *   eBay fees  13.6% of $108.99, plus $0.40         −$15.22  ▸
 *   Promoted Listings                                [ None ] %
 *   Item cost                                        [ 60.00 ]
 *   Shipping you pay                                 [ None ]
 *   Other costs                                      [ None ]
 *   Profit you want   [ Add ]   Sell it for $123.96 to keep $30.00
 *
 * Until there is a cost, the answer at the top is what eBay takes
 * (and its share of the sale), so the card always answers something.
 * tools2: one card on the public page too, the price typed in the sum
 * itself, Promoted Listings, other costs and "find my price".
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
function Figure({ label, value, currency, placeholder, onSave, max = 99_999, min = 0, percent = false, wanted = false, big = false, describedBy }) {
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
    if (r.value != null && r.value < min) { setError('Enter more than 0.'); return; }
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
      <span className={`${P.box} ${big ? P.boxBig : ''} ${wanted && !text ? P.boxWanted : ''}`}>
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
 * @param {{ price?, cost?, postCost?, postCharged?, otherCost?, adRate?, target?, feeRate? }} props.values   the seller's own figures
 * @param {(field: string, value: number|null) => Promise} props.onSave
 * @param {string} props.siteName          eBay.com, eBay.co.uk...
 * @param {string} props.marketplace       US, UK...
 * @param {React.ReactNode} [props.controls]   the site, account and category, at the top of the card (public page)
 * @param {(patch: object) => void} [props.onSellerType]   answers "private or business?"
 * @param {() => void} [props.onOpenSettings]               "Change" beside the seller type
 * @param {boolean} [props.busy]           a sum is on its way
 */
export function ProfitSlip({ profit: p, values = {}, onSave, siteName, marketplace, controls = null, onSellerType, onOpenSettings, busy = false }) {
  const [open, setOpen] = useState(false);
  const [ownRate, setOwnRate] = useState(values.feeRate != null);
  const feesId = useId();
  const costHint = useId();
  if (!p) return null;
  const cur = p.currency;
  // eBay.com and eBay.ca sellers say shipping; the rest say postage.
  const post = marketplace === 'US' || marketplace === 'CA' ? 'Shipping' : 'Postage';

  const fees = p.fees ?? [];
  const paid = fees.filter((f) => !f.reclaimed);
  const reclaimed = fees.find((f) => f.reclaimed);
  const loss = p.ready && p.profit < 0;
  const order = fees.find((f) => f.key === 'order');
  const reg = fees.find((f) => f.key === 'regulatory');
  const ad = fees.find((f) => f.key === 'ad');
  const vat = fees.find((f) => f.key === 'vat' && !f.reclaimed);
  const split = p.asks || p.sellerType != null;
  const who = p.sellerType === 'business' ? `business seller${p.vatRegistered ? ', VAT registered' : ''}` : 'private seller';
  const noPrice = p.needs?.includes('price');

  // "13.6% of $108.99, plus $0.40 an order": joined by hand, because a
  // euro amount has its own comma (0,45 €).
  const parts = [
    p.rate && appliedRate(p.rate, cur),
    order && `${money(order.amount, cur)} an order`,
    reg && `${money(reg.amount, cur)} regulatory`,
    ad && `${pct(p.adRate / 100)} ad`,
    vat && 'VAT',
  ].filter(Boolean);
  const feeSub = !fees.length
    ? `None for a ${who} on ${siteName}`
    : parts.length > 1 ? `${parts.slice(0, -1).join(', ')}, plus ${parts.at(-1)}` : parts[0];

  return (
    <div className={`${s.card} ${P.slip}`} aria-busy={busy || undefined}>
      {controls && <div className={P.controls}>{controls}</div>}

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

      {/* The answer, first, always: what eBay takes until there is a cost, then what you keep. */}
      <div className={`${P.hero} ${loss ? P.heroLoss : ''}`} aria-live="polite" aria-atomic="true">
        {noPrice ? (
          <>
            <p className={P.heroLabel}>eBay takes</p>
            <p className={P.heroWaiting}>Type what it sold for.</p>
          </>
        ) : p.ready ? (
          <>
            <p className={P.heroLabel}>{loss ? 'You lose' : 'You keep'}</p>
            <p className={P.heroFigure}>{money(Math.abs(p.profit), cur)}</p>
            <p className={P.heroFacts}>
              {p.margin != null && <span><span className={P.factNum}>{pctOf(p.margin)}</span> margin</span>}
              {p.roi != null && <span><span className={P.factNum}>{pctOf(p.roi)}</span> return</span>}
              <span>eBay takes <span className={P.factNum}>{money(p.feesTotal, cur)}</span></span>
              <span>Breaks even at <span className={P.factNum}>{money(p.breakEven, cur)}</span></span>
            </p>
          </>
        ) : (
          <>
            <p className={P.heroLabel}>eBay takes</p>
            <p className={`${P.heroFigure} ${P.heroFees}`}>{money(p.feesTotal, cur)}</p>
            <p className={P.heroFacts}>
              {p.takes != null && <span><span className={P.factNum}>{pctOf(p.takes)}</span> of the sale</span>}
              <span id={costHint}>Add your item cost to see your profit.</span>
            </p>
          </>
        )}
      </div>

      <div className={P.sum}>
        {/* Money in */}
        <Row
          label="Sold for"
          sub={p.saleVat && !noPrice ? `${money(p.income, cur)} without ${Math.round(p.saleVat * 100)}% VAT${p.postCharged ? `, ${post.toLowerCase()} included` : ''}` : null}
        >
          <Figure label="Sold for" value={values.price ?? p.price ?? null} currency={cur} placeholder="Price" big wanted={noPrice} onSave={(v) => onSave('price', v)} min={0.01} />
        </Row>
        <Row label={`${post} you charge`}>
          <Figure label={`${post} you charge`} value={values.postCharged ?? null} currency={cur} placeholder="Free" onSave={(v) => onSave('postCharged', v)} />
        </Row>

        {/* Money out */}
        {!noPrice && (
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
                    <span>{f.key === 'final' && p.rate ? `${f.label}, ${appliedRate(p.rate, cur)}` : f.key === 'ad' ? `${f.label}, ${pct(p.adRate / 100)}` : f.label}</span>
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

            <Row label="Promoted Listings" sub="Your ad rate, on the whole sale">
              <Figure label="Promoted Listings ad rate" value={values.adRate ?? null} currency={cur} placeholder="None" percent max={100} onSave={(v) => onSave('adRate', v)} />
            </Row>
            <Row label="Item cost" sub={p.vatRegistered ? 'Without VAT' : null}>
              <span className={P.sign} aria-hidden="true">{MINUS}</span>
              <Figure label={p.vatRegistered ? 'Item cost, without VAT' : 'Item cost'} value={values.cost ?? null} currency={cur} placeholder="Add" wanted onSave={(v) => onSave('cost', v)} describedBy={!p.ready ? costHint : undefined} />
            </Row>
            <Row label={`${post} you pay`}>
              <span className={P.sign} aria-hidden="true">{MINUS}</span>
              <Figure label={`${post} you pay`} value={values.postCost ?? null} currency={cur} placeholder="None" onSave={(v) => onSave('postCost', v)} />
            </Row>
            <Row label="Other costs" sub="Packaging and the like">
              <span className={P.sign} aria-hidden="true">{MINUS}</span>
              <Figure label="Other costs" value={values.otherCost ?? null} currency={cur} placeholder="None" onSave={(v) => onSave('otherCost', v)} />
            </Row>
          </div>
        )}
      </div>

      {/* Find my price: the profit they want, and the price that makes it. */}
      {!noPrice && (
        <div className={P.find}>
          <Row label="Profit you want" sub={p.ready ? null : 'Add your item cost first'}>
            <Figure label="Profit you want" value={values.target ?? null} currency={cur} placeholder="Add" onSave={(v) => onSave('target', v)} />
          </Row>
          {p.ready && p.target && (
            <p className={P.findAnswer} aria-live="polite">
              {p.target.price != null
                ? <>Sell it for <span className={P.findPrice}>{money(p.target.price, cur)}</span> to keep {money(p.target.profit, cur)}.</>
                : <>No price keeps {money(p.target.profit, cur)} with these costs.</>}
            </p>
          )}
        </div>
      )}

      {p.buyer && (
        <p className={P.buyer}>
          Your buyer also pays <span className={P.factNum}>{money(p.buyer.fee, cur)}</span> Buyer Protection, so <span className={P.factNum}>{money(p.buyer.pays, cur)}</span> in all. Business sellers&apos; buyers pay no such fee, so compare your total with their price.
        </p>
      )}

      <p className={P.foot}>
        {p.abroad
          ? `Selling on ${siteName} from ${MARKETPLACE[p.abroad.from]?.site ?? 'abroad'}: ${siteName}'s business rates${p.saleVat ? ", and the buyer's VAT, which eBay collects or you owe, taken out of the price" : ''}`
          : split ? `${siteName} fees for a ${who}` : `${siteName} fees, no eBay shop`}, checked {longDay(p.checked)}.
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
