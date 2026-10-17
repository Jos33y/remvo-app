import { useEffect, useId, useRef, useState } from 'react';
import { listingPrice } from '@lib/sellerFormat';
import { IconAlert } from '@components/ui/seller/icons';
import s from '@styles/pages/seller/app.module.css';
import P from '@styles/pages/seller/profit.module.css';

/* ──────────────────────────────────────────────────────────────────
 * What you keep (profit1)
 *
 * A pay slip for one listing: the seller types what the item cost them
 * and what posting it costs, and the slip reads down from the sale,
 * less each of eBay's fees by name, less their cost and postage, to
 * what they keep, with the margin and the lowest price that breaks
 * even. Free, and never sent to eBay.
 *
 * The figures are worked out by remvo-api from eBay's own fee pages
 * (one table, so the slip, the batch page and the CSV always agree).
 * A figure is saved as the seller pauses typing, or leaves the box,
 * and the slip follows.
 *
 * On eBay.co.uk, .de, .fr, .it and .es the fees depend on whether the
 * eBay account is private or business. Until the seller says, the slip
 * counts private fees (eBay's default for a new account) and asks.
 * ────────────────────────────────────────────────────────────────── */

const SAVE_AFTER_MS = 700;

const minus = '−';
const money = (v, currency) => (v < 0 ? `${minus}${listingPrice(-v, currency)}` : listingPrice(v, currency));
const pct = (v) => `${v < 0 ? minus : ''}${Math.abs(Number(v)).toLocaleString('en-GB', { maximumFractionDigits: 1 })}%`;

/* What a seller types, as a number: 12.50 or 12,50. null for an empty box. */
export function readAmount(text) {
  const t = String(text ?? '').trim().replace(/^[£$€]\s*|\s*[£$€]$/g, '');
  if (!t) return { value: null };
  if (!/^\d{1,5}([.,]\d{1,2})?$/.test(t)) return { error: 'Enter an amount such as 12.50.' };
  return { value: Number(t.replace(',', '.')) };
}

/* A saved figure as the seller would type it on their site: 9.50, or 9,50 in euros. */
const show = (v, currency) => (v == null ? '' : currency === 'EUR' ? Number(v).toFixed(2).replace('.', ',') : Number(v).toFixed(2));

/* One figure the seller types. Saves itself after a pause, or on Enter or leaving the box. */
function Amount({ label, hint, value, currency, placeholder, onSave, max = 99_999, suffix = null }) {
  const id = useId();
  const errId = useId();
  const [text, setText] = useState(() => (suffix ? (value == null ? '' : String(value)) : show(value, currency)));
  const [error, setError] = useState('');
  const timer = useRef(null);
  const last = useRef(value ?? null);

  // The saved value changed elsewhere (put back, another tab): show it, unless mid-edit.
  useEffect(() => {
    if (document.activeElement?.id !== id) setText(suffix ? (value == null ? '' : String(value)) : show(value, currency));
    last.current = value ?? null;
  }, [value, id, currency, suffix]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const shown = (v) => (suffix ? (v == null ? '' : String(v)) : show(v, currency));

  async function commit(raw, { leaving = false } = {}) {
    clearTimeout(timer.current);
    const r = readAmount(raw);
    if (r.error || (r.value != null && r.value > max)) { setError(r.error ?? `That is more than ${max}.`); return; }
    setError('');
    // Leaving the box: write the figure the way the site does (9,5 becomes 9.50 on eBay.co.uk).
    if (leaving) setText(shown(r.value));
    if (r.value === last.current) return;
    last.current = r.value;
    try {
      await onSave(r.value);
    } catch (err) {
      setError(err?.message || 'That did not save. Try again.');
    }
  }

  // Where the site writes it: $9.50 and £9.50 before, 9,50 € after.
  // An empty box that reads "Free" carries no currency mark.
  const bare = !text && Number.isNaN(Number(String(placeholder).replace(',', '.')));
  const sym = bare ? null : { USD: '$', CAD: 'C$', GBP: '£' }[currency] ?? null;
  const after = bare ? null : suffix ?? (currency === 'EUR' ? '€' : null);
  return (
    <div className={P.amount}>
      <label htmlFor={id} className={P.amountLabel}>{label}</label>
      <div className={P.amountBox}>
        {!after && sym && <span className={P.amountSym} aria-hidden="true">{sym}</span>}
        <input
          id={id}
          className={`${s.input} ${s.inputPlain} ${s.inputMono} ${P.amountInput} ${!after && sym ? P.withSym : ''} ${after ? P.withSuffix : ''}`}
          inputMode="decimal"
          autoComplete="off"
          enterKeyHint="done"
          value={text}
          placeholder={placeholder}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={[error ? errId : null, hint ? `${id}-hint` : null].filter(Boolean).join(' ') || undefined}
          onChange={(e) => {
            const v = e.target.value;
            setText(v);
            if (error) setError('');
            clearTimeout(timer.current);
            timer.current = setTimeout(() => { if (!readAmount(v).error) commit(v); }, SAVE_AFTER_MS);
          }}
          onBlur={(e) => commit(e.target.value, { leaving: true })}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit(e.currentTarget.value); } }}
        />
        {after && <span className={P.amountSuffix} aria-hidden="true">{after}</span>}
      </div>
      {hint && <p id={`${id}-hint`} className={P.amountHint}>{hint}</p>}
      {error && <p id={errId} className={s.fieldError}><IconAlert size={16} />{error}</p>}
    </div>
  );
}

function Line({ label, value, currency, sub = null, strong = false, note = null }) {
  return (
    <div className={`${P.line} ${strong ? P.lineStrong : ''}`}>
      <dt>
        {label}
        {note && <span className={P.lineNote}>{note}</span>}
      </dt>
      <dd>{sub != null ? money(-value, currency) : money(value, currency)}</dd>
    </div>
  );
}

export function ProfitCard({ job, profit, site, onSave, onSellerType, onOpenSettings }) {
  const e = job.edits ?? {};
  const [ownRate, setOwnRate] = useState(e.feeRate != null);
  const p = profit;
  if (!p) return null;
  const cur = p.currency;
  const split = p.vatRate != null || p.asks || p.sellerType === 'private';
  const who = p.sellerType === 'business'
    ? `business seller${p.vatRegistered ? ', VAT registered' : ''}`
    : 'private seller';

  if (p.needs?.includes('price')) {
    return (
      <section className={P.section} aria-labelledby="profit-heading">
        <div className={s.groupHead}><h2 id="profit-heading" className={s.groupTitle}>What you keep</h2></div>
        <div className={`${s.card} ${P.slip}`}>
          <p className={P.empty}>Set a price first. The fees and what you keep are worked out from it.</p>
        </div>
      </section>
    );
  }

  const fees = p.fees ?? [];
  const reclaimed = fees.find((f) => f.key === 'vat' && f.reclaimed);
  const loss = p.ready && p.profit < 0;

  return (
    <section className={P.section} aria-labelledby="profit-heading">
      <div className={`${s.groupHead} ${P.head}`}>
        <h2 id="profit-heading" className={s.groupTitle}>What you keep</h2>
        <span className={P.headNote}>Free. Never sent to eBay.</span>
      </div>

      <div className={`${s.card} ${P.slip}`}>
        {p.asks && (
          <div className={P.ask} role="group" aria-labelledby="profit-ask">
            <p id="profit-ask" className={P.askText}>
              <strong>Is your {site.site} account private or business?</strong>
              {' '}These are private seller fees, eBay&apos;s default for a new account.
            </p>
            <div className={P.askButtons}>
              <button type="button" className={`${s.button} ${s.secondary} ${P.askButton}`} onClick={() => onSellerType({ sellerType: 'private' })}>Private</button>
              <button type="button" className={`${s.button} ${s.secondary} ${P.askButton}`} onClick={() => onSellerType({ sellerType: 'business' })}>Business</button>
            </div>
          </div>
        )}

        <div className={P.amounts}>
          <Amount
            label={p.vatRegistered ? 'Item cost, without VAT' : 'Item cost'}
            value={e.cost ?? null}
            currency={cur}
            placeholder={cur === 'EUR' ? '0,00' : '0.00'}
            onSave={(v) => onSave('cost', v)}
          />
          <Amount
            label="Postage you pay"
            value={e.postCost ?? null}
            currency={cur}
            placeholder={cur === 'EUR' ? '0,00' : '0.00'}
            onSave={(v) => onSave('postCost', v)}
          />
          <Amount
            label="Postage you charge"
            value={e.postCharged ?? null}
            currency={cur}
            placeholder="Free"
            onSave={(v) => onSave('postCharged', v)}
          />
        </div>

        <dl className={P.ledger}>
          {p.vatRegistered ? (
            <Line
              label={`Sale${p.postCharged ? ', with postage' : ''}, without VAT`}
              note={`${money(p.price + (p.postCharged ?? 0), cur)} less ${Math.round(p.vatRate * 100)}% VAT`}
              value={p.income}
              currency={cur}
            />
          ) : (
            <Line label={p.postCharged ? 'Sale, with postage' : 'Sale'} value={p.price + (p.postCharged ?? 0)} currency={cur} />
          )}
          {fees.length === 0 && (
            <div className={P.line}>
              <dt>eBay fees<span className={P.lineNote}>None for a {who} on {site.site}</span></dt>
              <dd>{money(0, cur)}</dd>
            </div>
          )}
          {fees.filter((f) => !f.reclaimed).map((f) => (
            <Line
              key={f.key}
              label={f.label}
              note={f.key === 'final' && p.rate ? p.rate.text : null}
              value={f.amount}
              currency={cur}
              sub
            />
          ))}
          {p.ready && <Line label="Item cost" value={p.cost} currency={cur} sub />}
          {p.ready && p.postCost > 0 && <Line label="Postage you pay" value={p.postCost} currency={cur} sub />}
        </dl>

        <div className={`${P.total} ${loss ? P.totalLoss : ''}`} aria-live="polite" aria-atomic="true">
          {p.ready ? (
            <>
              <p className={P.totalLabel}>{loss ? 'You lose' : 'You keep'}</p>
              <p className={P.totalFigure}>{money(loss ? -p.profit : p.profit, cur)}</p>
              <p className={P.totalFacts}>
                {p.margin != null && <span><span className={P.factLabel}>Margin</span> {pct(p.margin)}</span>}
                <span><span className={P.factLabel}>Breaks even at</span> {money(p.breakEven, cur)}</span>
              </p>
            </>
          ) : (
            <>
              <p className={P.totalLabel}>You keep</p>
              <p className={P.totalWaiting}>Add the item cost to see it.</p>
              <p className={P.totalFacts}><span><span className={P.factLabel}>eBay fees</span> {money(p.feesTotal, cur)}</span></p>
            </>
          )}
        </div>

        {p.buyer && (
          <p className={P.buyer}>
            The buyer pays <span className={P.mono}>{money(p.buyer.fee, cur)}</span> Buyer Protection on top, so <span className={P.mono}>{money(p.buyer.pays, cur)}</span> in all.
            {' '}Buyers pay no such fee to business sellers, so compare your total with their price.
          </p>
        )}

        <div className={P.rate}>
          {fees.length > 0 && p.rate && (
            ownRate ? (
              <div className={P.ownRate}>
                <Amount
                  label="Your final value fee rate"
                  hint="For a category charged differently, or a shop rate."
                  value={e.feeRate ?? null}
                  currency={cur}
                  placeholder={p.rate.own ? '' : p.rate.text.split('%')[0]}
                  suffix="%"
                  max={30}
                  onSave={(v) => onSave('feeRate', v)}
                />
                <button type="button" className={P.textButton} onClick={async () => { await onSave('feeRate', null); setOwnRate(false); }}>Use eBay&apos;s rate</button>
              </div>
            ) : (
              <p className={P.rateText}>
                {p.rate.matched ? `The ${lower(p.rate.label)} rate.` : `The ${lower(p.rate.label)} rate. Your category may differ.`}
                {' '}<button type="button" className={P.textButton} onClick={() => setOwnRate(true)}>Use your own rate</button>
              </p>
            )
          )}
          <p className={P.small}>
            {split ? `${site.site} fees for a ${who}` : `${site.site} fees, with no eBay shop`}, from eBay&apos;s fee pages on {longDay(p.checked)}.
            {split && <> <button type="button" className={P.textButton} onClick={onOpenSettings}>Change</button></>}
          </p>
          {reclaimed && <p className={P.small}>The {money(reclaimed.amount, cur)} VAT on these fees is yours to reclaim, so it is not counted.</p>}
          <p className={P.small}>{notCounted(job.marketplace)}</p>
        </div>
      </div>
    </section>
  );
}

const lower = (t) => t.charAt(0).toLowerCase() + t.slice(1);

function longDay(iso) {
  const d = new Date(`${iso}T12:00:00Z`);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

function notCounted(marketplace) {
  if (marketplace === 'US' || marketplace === 'CA') return 'Not counted: eBay also takes its rate on any sales tax the buyer pays, and shop, Top Rated and international rates differ.';
  return 'Not counted: shop, Top Rated and international rates, which differ.';
}
