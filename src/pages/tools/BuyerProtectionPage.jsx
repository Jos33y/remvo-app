import { useId, useRef, useState } from 'react';
import { Link } from 'react-router';
import { Button } from '@components/ui/shared/Button';
import { hit } from '@lib/hits';
import { BP_BANDS, BP_CHECKED, BP_EXAMPLES, BP_FLAT, BP_MAX, BP_SOURCE, buyerProtection, pounds, priceForTotal } from '@lib/buyerProtection';
import { APP_LINKS, ROUTES } from '@utils/constants';
import info from '@styles/pages/marketing/info-page.module.css';
import T from '@styles/pages/marketing/fee-calculator.module.css';
import B from '@styles/pages/marketing/buyer-protection.module.css';

/* ──────────────────────────────────────────────────────────────────
 * /ebay-buyer-protection-fee-calculator (seo2)
 *
 * One question, one page: what eBay.co.uk adds for Buyer Protection
 * when a UK private seller sells, and what to list at so the buyer
 * sees a round price. Google page one for this search (31 October
 * 2026) was won by a one-page site whose title is the search and whose
 * description is eBay's table; the search had no owner.
 *
 * Worked out in the browser (lib/buyerProtection.js); the page opens on
 * a real answer written in at build time, so it reads before any script.
 * ────────────────────────────────────────────────────────────────── */

const START = 2000;

function longDay(iso) {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

function toPence(text) {
  const n = Number(String(text).replace(/[£,\s]/g, ''));
  return Number.isFinite(n) && n > 0 && n <= 1000000 ? Math.round(n * 100) : null;
}

function Calculator() {
  const [mode, setMode] = useState('price');
  const [text, setText] = useState((START / 100).toFixed(2));
  const counted = useRef(false);
  const inputId = useId();
  const noteId = useId();

  const pence = toPence(text);
  const price = pence == null ? null : (mode === 'price' ? pence : priceForTotal(pence));
  const result = price == null ? null : buyerProtection(price);
  const total = result ? price + result.fee : null;

  function change(value) {
    setText(value);
    // analytics1: once per page, that someone worked a sum out.
    if (!counted.current) { counted.current = true; hit('calc', { site: 'UK', tool: 'buyer_protection' }); }
  }

  return (
    <div className={B.card}>
      <div className={B.modes} role="radiogroup" aria-label="What do you know?">
        {[['price', 'My item price'], ['total', 'The price the buyer sees']].map(([id, name]) => (
          <button key={id} type="button" role="radio" aria-checked={mode === id} className={B.mode} onClick={() => setMode(id)}>{name}</button>
        ))}
      </div>

      <label htmlFor={inputId} className={B.label}>{mode === 'price' ? 'Item price, without postage' : 'What the buyer should see, without postage'}</label>
      <div className={B.field}>
        <span className={B.currency} aria-hidden="true">£</span>
        <input
          id={inputId}
          className={B.input}
          inputMode="decimal"
          autoComplete="off"
          value={text}
          onChange={(e) => change(e.target.value)}
          aria-describedby={noteId}
        />
      </div>

      <div className={B.answer} aria-live="polite">
        {result ? (
          <>
            <p className={B.lead}>
              {mode === 'price' ? (
                <>The buyer pays <strong>{pounds(result.fee)}</strong> for Buyer Protection, so they see <strong>{pounds(total)}</strong> plus postage.</>
              ) : (
                <>List it at <strong>{pounds(price)}</strong>. Buyer Protection adds <strong>{pounds(result.fee)}</strong>, so the buyer sees <strong>{pounds(total)}</strong> plus postage.</>
              )}
            </p>
            <p className={B.keep}>You receive <strong>{pounds(price)}</strong>, the whole item price, plus the postage you charge. A sale to a buyer abroad adds eBay&apos;s 3% international fee.</p>
            <table className={`${info.table} ${B.parts}`}>
              <caption className="sr-only">How the fee is made up</caption>
              <tbody>
                <tr><th scope="row">Flat fee, each item</th><td className={info.num}>{pounds(result.flat)}</td></tr>
                {result.parts.filter((x) => x.base > 0).map((x) => (
                  <tr key={x.label}><th scope="row">{Math.round(x.rate * 100)}% of {pounds(x.base)} ({x.label.toLowerCase()})</th><td className={info.num}>{pounds(x.amount)}</td></tr>
                ))}
                <tr className={B.totalRow}><th scope="row">Buyer Protection fee</th><td className={info.num}>{pounds(result.fee)}</td></tr>
              </tbody>
            </table>
          </>
        ) : (
          <p className={B.lead}>{mode === 'total' && pence != null ? 'That is less than the smallest item with its fee. Try a higher price.' : 'Type a price in pounds, for example 25 or 24.99.'}</p>
        )}
      </div>
      <p id={noteId} className={B.note}>For UK private sellers on eBay.co.uk. Business sellers&apos; buyers pay no Buyer Protection fee.</p>
    </div>
  );
}

const FAQ = [
  ['Who pays the Buyer Protection fee?', 'The buyer. eBay adds it to the price a buyer sees when they buy from a UK private seller. The seller receives the whole item price.'],
  ['Is it charged on postage?', 'No. It is worked out on the item price only. Postage is added on top of the price with the fee.'],
  ['Do business sellers charge it?', 'No. Buyer Protection is included at no extra cost when the seller is a business. Private sellers based outside the UK do not charge it either.'],
  ['Is there a cap?', `Yes. Any part of the item price above £4,000 adds nothing, so the most the fee can be is ${pounds(BP_MAX)}.`],
  ['Which items are left out?', 'Cars, motorcycles and vehicles, classified ads and property do not have the fee.'],
  ['Is the flat fee per item or per order?', 'Per item, but charged once when a buyer takes several of the same listing.'],
];

export { FAQ as BP_FAQ };

export function BuyerProtectionPage() {
  const day = longDay(BP_CHECKED);
  return (
    <>
      <section className={info.intro} aria-labelledby="bp-heading">
        <div className={info.introInner}>
          <p className={T.kicker}>Free tool. No account.</p>
          <h1 id="bp-heading" className={info.title}>eBay Buyer Protection fee calculator</h1>
          <p className={info.lede}>
            On eBay.co.uk the buyer of a UK private seller&apos;s item pays a Buyer Protection fee: 10p, plus 7% of the price up to £20, 4% from £20 to £300 and 2% from £300 to £4,000. Type a price to see the fee, or the price to list at so the buyer sees a round number. From eBay&apos;s own page, checked {day}.
          </p>
        </div>
      </section>

      <section className={T.band} aria-label="Calculator">
        <div className={info.bandInner}>
          <Calculator />
        </div>
      </section>

      <div className={info.body}>
        <div className={info.bodyInner}>
          <section className={info.section} aria-labelledby="bp-how">
            <h2 id="bp-how" className={info.sectionHeading}>How eBay works out the fee</h2>
            <div className={info.sectionBody}>
              <p>A flat {BP_FLAT}p for each item, then a percentage of each part of the item price. Postage is not included, and any part of the price above £4,000 adds nothing.</p>
              <table className={`${info.table} ${info.after}`}>
                <thead><tr><th scope="col">Part of the item price</th><th scope="col" className={info.num}>Buyer pays</th></tr></thead>
                <tbody>
                  <tr><th scope="row">Each item</th><td className={info.num}>10p</td></tr>
                  {BP_BANDS.map((b) => <tr key={b.label}><th scope="row">{b.label}</th><td className={info.num}>{Math.round(b.rate * 100)}%</td></tr>)}
                  <tr><th scope="row">Above £4,000</th><td className={info.num}>nothing more</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className={info.section} aria-labelledby="bp-examples">
            <h2 id="bp-examples" className={info.sectionHeading}>The fee at common prices</h2>
            <div className={info.sectionBody}>
              <p>Worked out with eBay&apos;s rates. As a share of the price, the fee falls as the price rises: about 9% on a £5 item, under 5% from £100.</p>
              <table className={`${info.table} ${info.after}`}>
                <thead><tr><th scope="col">Item price</th><th scope="col" className={info.num}>Fee</th><th scope="col" className={info.num}>Buyer sees</th></tr></thead>
                <tbody>
                  {BP_EXAMPLES.map((p) => {
                    const f = buyerProtection(p).fee;
                    return <tr key={p}><th scope="row">{pounds(p)}</th><td className={info.num}>{pounds(f)}</td><td className={info.num}>{pounds(p + f)}</td></tr>;
                  })}
                </tbody>
              </table>
              <p className={`${info.muted} ${info.after}`}>eBay&apos;s own examples agree: a £5 item has a 45p fee, a £1,500 item £36.70.</p>
            </div>
          </section>

          <section className={info.section} aria-labelledby="bp-round">
            <h2 id="bp-round" className={info.sectionHeading}>Pricing so the buyer sees a round number</h2>
            <div className={info.sectionBody}>
              <p>The buyer compares the price with the fee in it, so a £20 item shows as £21.50. To have them see £20, list at {pounds(priceForTotal(2000))}: the fee is then {pounds(buyerProtection(priceForTotal(2000)).fee)}. Choose <strong>The price the buyer sees</strong> above to work out any price.</p>
            </div>
          </section>

          <section className={info.section} aria-labelledby="bp-faq">
            <h2 id="bp-faq" className={info.sectionHeading}>Questions</h2>
            <div className={info.sectionBody}>
              <div className={info.faq}>
                {FAQ.map(([q, a]) => (
                  <details key={q} className={info.faqItem}>
                    <summary className={info.faqQ}>{q}</summary>
                    <p className={info.faqA}>{a}</p>
                  </details>
                ))}
              </div>
              <p className={`${info.muted} ${info.after}`}>
                Source: <a href={BP_SOURCE} className={info.link} target="_blank" rel="noopener noreferrer">eBay.co.uk, Buyer Protection fee</a>, checked {day}. Selling as a business, or want the whole sum with your costs? Use the <Link to={ROUTES.FEES_UK} className={info.link}>eBay UK fee calculator</Link>.
              </p>
            </div>
          </section>
        </div>
      </div>

      <section className={info.close} aria-labelledby="bp-close">
        <div className={info.closeInner}>
          <div>
            <h2 id="bp-close" className={info.closeHeading}>Make the listing too.</h2>
            <p className={T.closeText}>
              Paste a product link or a barcode: Remvo fills in the title, category, item specifics, parcel and a price from live eBay listings. Your first listing is on us.
            </p>
          </div>
          <Button href={APP_LINKS.SIGN_UP} variant="ivory" size="large">Make your first listing</Button>
        </div>
      </section>
    </>
  );
}
