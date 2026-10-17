import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router';
import { Button } from '@components/ui/shared/Button';
import { ProfitSlip, readAmount } from '@components/ui/profit/ProfitSlip';
import { workOut } from '@lib/profitApi';
import { FEE_TABLES, START, START_PROFIT, UK_BUYER_PROTECTION } from '@lib/feeTables';
import { APP_LINKS, ROUTES } from '@utils/constants';
import theme from '@styles/layout/seller/app-theme.module.css';
import s from '@styles/pages/seller/app.module.css';
import info from '@styles/pages/marketing/info-page.module.css';
import T from '@styles/pages/marketing/fee-calculator.module.css';

/* ──────────────────────────────────────────────────────────────────
 * The eBay fee calculator, free and with no account (tools1)
 *
 * /ebay-fee-calculator      eBay.com
 * /ebay-fee-calculator-uk   eBay.co.uk, private and business
 *
 * A seller who searches "what will eBay take?" gets the answer, and
 * what they keep, from the same slip and the same fee table as every
 * listing in Remvo, then one line on what Remvo does. The figures are
 * worked out by remvo-api; the page opens on a real answer written in
 * at build time (lib/feeTables.js), so it reads before any script.
 *
 * Copy: plain, dated, sourced. eBay.com page in US words (shipping),
 * eBay.co.uk page in British (postage).
 * ────────────────────────────────────────────────────────────────── */

const EBAY_FEES = {
  US: 'https://www.ebay.com/help/selling/fees-credits-invoices/selling-fees?id=4822',
  UK: 'https://www.ebay.co.uk/help/selling/fees-credits-invoices/business-selling-fees?id=4122',
};
const UK_PRIVATE = 'https://www.ebay.co.uk/help/selling/fees-credits-invoices/selling-fees?id=4822';
const UK_BP = 'https://www.ebay.co.uk/help/buying/paying-items/buyer-protection?id=5594';

const SITE = {
  US: { name: 'eBay.com', currency: 'USD', sym: '$', other: { to: ROUTES.FEES_UK, label: 'eBay.co.uk' } },
  UK: { name: 'eBay.co.uk', currency: 'GBP', sym: '£', other: { to: ROUTES.FEES_US, label: 'eBay.com' } },
};

function longDay(iso) {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/* The sum, kept in the page and worked out by remvo-api as it changes. */
function useSum(site) {
  const start = START[site];
  const [inputs, setInputs] = useState({ price: start.price, sellerType: start.sellerType, vatRegistered: false, groupKey: start.groupKey });
  const [values, setValues] = useState({});
  const [profit, setProfit] = useState(START_PROFIT[site]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const ctrl = useRef(null);
  const first = useRef(true);

  useEffect(() => {
    // The opening answer is already in the page.
    if (first.current) { first.current = false; return undefined; }
    if (inputs.price == null) return undefined;
    ctrl.current?.abort();
    const c = new AbortController();
    ctrl.current = c;
    setBusy(true);
    workOut({
      marketplace: site,
      ...(site === 'UK' ? { sellerType: inputs.sellerType, vatRegistered: inputs.sellerType === 'business' && inputs.vatRegistered } : {}),
      groupKey: inputs.groupKey,
      feeRate: values.feeRate ?? null,
      price: inputs.price,
      postCharged: values.postCharged ?? null,
      cost: values.cost ?? null,
      postCost: values.postCost ?? null,
    }, c.signal)
      .then((p) => { setProfit(p); setError(''); })
      .catch((err) => { if (err?.name !== 'AbortError') setError(err.message); })
      .finally(() => { if (ctrl.current === c) setBusy(false); });
    return () => c.abort();
  }, [site, inputs, values]);

  return { inputs, setInputs, values, setValues, profit, busy, error };
}

function PriceInput({ value, currency, sym, onChange }) {
  const id = useId();
  const errId = useId();
  const [text, setText] = useState(value == null ? '' : Number(value).toFixed(2));
  const [error, setError] = useState('');
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const commit = (raw) => {
    clearTimeout(timer.current);
    const r = readAmount(raw);
    if (r.error || r.value == null || r.value <= 0) { setError(r.value === null ? 'Enter what it sold for.' : 'Enter a price such as 24.99.'); return false; }
    setError('');
    onChange(r.value);
    return true;
  };
  return (
    <div className={T.field}>
      <label htmlFor={id} className={T.label}>Sold for</label>
      <div className={T.priceBox}>
        <span className={T.priceSym} aria-hidden="true">{sym}</span>
        <input
          id={id}
          className={`${s.input} ${s.inputMono} ${T.priceInput}`}
          inputMode="decimal"
          autoComplete="off"
          enterKeyHint="done"
          value={text}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errId : `${id}-hint`}
          onChange={(e) => {
            const v = e.target.value;
            setText(v);
            if (error) setError('');
            clearTimeout(timer.current);
            timer.current = setTimeout(() => { if (!readAmount(v).error && readAmount(v).value > 0) commit(v); }, 500);
          }}
          onBlur={(e) => { if (commit(e.target.value)) setText(Number(readAmount(e.target.value).value).toFixed(2)); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit(e.currentTarget.value); } }}
        />
      </div>
      {error
        ? <p id={errId} className={s.fieldError} role="alert">{error}</p>
        : <p id={`${id}-hint`} className={T.hint}>The item price your buyer sees{currency === 'GBP' ? ', VAT included' : ', before sales tax'}.</p>}
    </div>
  );
}

function Calculator({ site }) {
  const meta = SITE[site];
  const table = FEE_TABLES[site];
  const { inputs, setInputs, values, setValues, profit, busy, error } = useSum(site);
  const catId = useId();
  const set = (patch) => setInputs((x) => ({ ...x, ...patch }));
  const business = inputs.sellerType === 'business';

  return (
    <div className={`${theme.theme} ${T.tool}`}>
      <div className={T.panel}>
        <PriceInput value={inputs.price} currency={meta.currency} sym={meta.sym} onChange={(price) => set({ price })} />

        {table.split && (
          <div className={T.field}>
            <span className={T.label} id="acct-label">Your eBay account</span>
            <div className={`${s.segmented} ${T.segmented}`} role="radiogroup" aria-labelledby="acct-label">
              {[['private', 'Private'], ['business', 'Business']].map(([id, name]) => (
                <button key={id} type="button" role="radio" aria-checked={inputs.sellerType === id} className={s.segment} onClick={() => set({ sellerType: id })}>{name}</button>
              ))}
            </div>
            <p className={T.hint}>
              {business ? 'You buy to resell, or sell as a company.' : 'Selling your own things. New eBay accounts start as private.'}
            </p>
            {business && (
              <label className={T.check}>
                <input type="checkbox" checked={inputs.vatRegistered} onChange={(e) => set({ vatRegistered: e.target.checked })} />
                <span>Registered for VAT</span>
              </label>
            )}
          </div>
        )}

        {table.groups.length > 0 && business && (
          <div className={T.field}>
            <label htmlFor={catId} className={T.label}>Category</label>
            <select id={catId} className={`${s.input} ${T.select}`} value={inputs.groupKey} onChange={(e) => set({ groupKey: e.target.value })}>
              <option value="standard">{table.standard.label}, {table.standard.text}</option>
              {table.groups.map((g) => <option key={g.key} value={g.key}>{g.label}, {g.text}</option>)}
            </select>
            <p className={T.hint}>eBay.co.uk charges business sellers by category.</p>
          </div>
        )}

        {!table.split && (
          <p className={T.hint}>
            eBay.com charges 13.6% of the sale in most categories. Some categories differ: open eBay fees in the result to use your own rate.
          </p>
        )}

        <p className={T.other}>
          Selling on {meta.other.label}? <Link to={meta.other.to} className={T.otherLink}>{meta.other.label} fees</Link>
        </p>
      </div>

      <div className={T.result}>
        <h2 className="sr-only">The result</h2>
        <ProfitSlip
          profit={profit}
          values={values}
          onSave={async (field, value) => setValues((v) => ({ ...v, [field]: value }))}
          siteName={meta.name}
          marketplace={site}
          busy={busy}
        />
        {error && <p className={`${s.fieldError} ${T.error}`} role="alert">{error}</p>}
      </div>
    </div>
  );
}

function Faq({ items }) {
  return (
    <div className={info.faq}>
      {items.map(([q, a]) => (
        <details key={q} className={info.faqItem}>
          <summary className={info.faqQ}>{q}</summary>
          <p className={info.faqA}>{a}</p>
        </details>
      ))}
    </div>
  );
}

export const FAQ = {
  US: [
    ['Is it free?', 'Yes. No account, no email, nothing stored. The figures you type are worked out and forgotten.'],
    ['Does it count sales tax?', 'No. eBay.com charges its rate on the sales tax the buyer pays too, and that depends on the buyer’s state, so the real fee is a little higher than shown here.'],
    ['What if my category is charged differently?', 'Open eBay fees in the result and choose Use your own rate. Some categories, and an eBay shop, have their own rates.'],
    ['Where do the rates come from?', 'eBay’s own selling fees page for eBay.com, checked on the date shown. When eBay changes them, this page changes with them.'],
  ],
  UK: [
    ['Is it free?', 'Yes. No account, no email, nothing stored. The figures you type are worked out and forgotten.'],
    ['Am I a private or a business seller?', 'Your eBay account settings say which you are. New accounts start as private. If you buy things to resell them, eBay asks you to register as a business seller.'],
    ['Why do private sellers pay nothing?', 'eBay.co.uk stopped charging UK private sellers a final value fee in most categories. The buyer pays a Buyer Protection fee on top of the item price instead. Vehicles are charged differently.'],
    ['Are the fees with or without VAT?', 'eBay quotes business fees without VAT. If you are not registered for VAT you pay it on top, and this calculator adds it. If you are registered, choose Registered for VAT: the sale and the fees are then worked out without VAT.'],
    ['Where do the rates come from?', 'eBay’s own fee pages for eBay.co.uk, checked on the date shown. When eBay changes them, this page changes with them.'],
  ],
};

export function FeeCalculatorPage({ site }) {
  const meta = SITE[site];
  const table = FEE_TABLES[site];
  const day = longDay(table.checked);

  return (
    <>
      <section className={info.intro} aria-labelledby="fees-heading">
        <div className={info.introInner}>
          <p className={T.kicker}>Free tool. No account.</p>
          <h1 id="fees-heading" className={info.title}>{site === 'UK' ? 'eBay UK fee calculator' : 'eBay fee calculator'}</h1>
          <p className={info.lede}>
            {site === 'UK'
              ? 'What eBay.co.uk takes from a sale, for private and business sellers, and what you keep after your costs.'
              : 'What eBay.com takes from a sale, and what you keep after your costs.'}
            {' '}Rates from eBay&apos;s own fee pages, checked {day}.
          </p>
        </div>
      </section>

      <section className={T.band} aria-label="Calculator">
        <div className={info.bandInner}>
          <Calculator site={site} />
        </div>
      </section>

      <div className={info.body}>
        <div className={info.bodyInner}>
          {site === 'US' ? (
            <section className={info.section} aria-labelledby="how-fees">
              <h2 id="how-fees" className={info.sectionHeading}>How eBay.com fees work</h2>
              <div className={info.sectionBody}>
                <p>When an item sells, eBay.com takes a final value fee and a per-order fee. Without an eBay shop, most categories pay 13.6% of the total sale up to $7,500, and 2.35% of any part above that.</p>
                <p>The total sale is the item price, the shipping the buyer pays and the sales tax. The per-order fee is $0.30 on an order of $10 or less, and $0.40 above.</p>
                <table className={`${info.table} ${info.after}`}>
                  <thead><tr><th scope="col">Fee</th><th scope="col" className={info.num}>Rate</th></tr></thead>
                  <tbody>
                    <tr><th scope="row">Final value fee, most categories</th><td className={info.num}>13.6% to $7,500</td></tr>
                    <tr><th scope="row">On any part above $7,500</th><td className={info.num}>2.35%</td></tr>
                    <tr><th scope="row">Per order, $10 or less</th><td className={info.num}>$0.30</td></tr>
                    <tr><th scope="row">Per order, above $10</th><td className={info.num}>$0.40</td></tr>
                  </tbody>
                </table>
                <p className={`${info.muted} ${info.after}`}>
                  Some categories, an eBay shop and international sales are charged differently. Source: <a href={EBAY_FEES.US} className={info.link} target="_blank" rel="noopener noreferrer">eBay.com selling fees</a>, checked {day}.
                </p>
              </div>
            </section>
          ) : (
            <>
              <section className={info.section} aria-labelledby="private-fees">
                <h2 id="private-fees" className={info.sectionHeading}>Private sellers</h2>
                <div className={info.sectionBody}>
                  <p>A UK private seller pays no final value fee and no regulatory operating fee when an item sells, in every category but vehicles. Posting to a buyer abroad adds a 3% international fee.</p>
                  <p>The buyer pays a Buyer Protection fee on top of the item price, not the postage:</p>
                  <table className={`${info.table} ${info.after}`}>
                    <thead><tr><th scope="col">Part of the item price</th><th scope="col" className={info.num}>Buyer pays</th></tr></thead>
                    <tbody>{UK_BUYER_PROTECTION.map(([a, b]) => <tr key={a}><th scope="row">{a}</th><td className={info.num}>{b}</td></tr>)}</tbody>
                  </table>
                  <p className={`${info.muted} ${info.after}`}>
                    Sources: <a href={UK_PRIVATE} className={info.link} target="_blank" rel="noopener noreferrer">eBay.co.uk selling fees</a> and <a href={UK_BP} className={info.link} target="_blank" rel="noopener noreferrer">Buyer Protection</a>, checked {day}.
                  </p>
                </div>
              </section>
              <section className={info.section} aria-labelledby="business-fees">
                <h2 id="business-fees" className={info.sectionHeading}>Business sellers</h2>
                <div className={info.sectionBody}>
                  <p>A business seller pays a final value fee by category on the total sale (item, postage and taxes), £0.30 an order of £10 or less or £0.40 above, and a 0.35% regulatory operating fee. eBay quotes these without VAT.</p>
                  <table className={`${info.table} ${info.after} ${T.rates}`}>
                    <thead><tr><th scope="col">Category</th><th scope="col" className={info.num}>Final value fee</th></tr></thead>
                    <tbody>
                      {table.groups.map((g) => <tr key={g.key}><th scope="row">{g.label}</th><td className={info.num}>{g.text}</td></tr>)}
                      <tr><th scope="row">{table.standard.label}</th><td className={info.num}>{table.standard.text}</td></tr>
                    </tbody>
                  </table>
                  <p className={`${info.muted} ${info.after}`}>
                    Without an eBay shop. Some subcategories have their own rates. Source: <a href={EBAY_FEES.UK} className={info.link} target="_blank" rel="noopener noreferrer">eBay.co.uk business selling fees</a>, checked {day}.
                  </p>
                </div>
              </section>
            </>
          )}

          <section className={info.section} aria-labelledby="fees-faq">
            <h2 id="fees-faq" className={info.sectionHeading}>Questions</h2>
            <div className={info.sectionBody}><Faq items={FAQ[site]} /></div>
          </section>
        </div>
      </div>

      <section className={info.close} aria-labelledby="fees-close">
        <div className={info.closeInner}>
          <div>
            <h2 id="fees-close" className={info.closeHeading}>Make the listing too.</h2>
            <p className={T.closeText}>
              Remvo writes the whole eBay listing from a barcode or a product link, with this sum on every one. Your first listing is on us.
            </p>
          </div>
          <Button href={APP_LINKS.SIGN_UP} variant="ivory" size="large">Make your first listing</Button>
        </div>
      </section>
    </>
  );
}

export function FeeCalculatorUsPage() { return <FeeCalculatorPage site="US" />; }
export function FeeCalculatorUkPage() { return <FeeCalculatorPage site="UK" />; }
