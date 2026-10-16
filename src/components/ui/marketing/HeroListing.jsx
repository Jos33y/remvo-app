import energizer from '@/assets/products/energizer-bts356-560.webp';
import s from '@styles/ui/marketing/hero-listing.module.css';

/* ──────────────────────────────────────────────────────────────────
 * HeroListing
 *
 * The home page's one picture: a real listing Remvo made, the same
 * Energizer speaker as the first Instagram post. Every field is as it
 * came back on 13 October 2026 (L-9GSHF4), not a mock-up.
 *
 * The site's one orchestrated moment: on load the barcode types in,
 * then the fields arrive top to bottom and the price lands last. It is
 * CSS only, so the pre-rendered page shows it with no script and
 * nothing flashes; under reduced motion everything is simply there.
 * ────────────────────────────────────────────────────────────────── */

const SPECIFICS = [
  ['Brand', 'Energizer'],
  ['Model', 'BTS356'],
  ['Type', 'Portable Speaker System'],
  ['Color', 'Beige'],
];

function BarcodeMark() {
  return (
    <svg className={s.mark} viewBox="0 0 22 16" aria-hidden="true" focusable="false">
      {[0, 2.5, 4, 6.5, 8, 10.5, 13, 14.5, 17, 19.5].map((x, i) => (
        <rect key={x} x={x} y="0" width={i % 3 === 1 ? 1 : 1.6} height="16" />
      ))}
    </svg>
  );
}

export function HeroListing() {
  return (
    <figure className={s.wrap}>
      <div className={s.scan}>
        <BarcodeMark />
        <span className={s.digits}><span className={s.type}>8 42982 10809 7</span></span>
        <span className={s.cond}>New</span>
      </div>

      <div className={s.card}>
        <div className={s.side}>
          <div className={s.photo}>
            <img src={energizer} width="237" height="560" alt="The Energizer BTS356 speaker, in beige" decoding="async" fetchPriority="high" />
          </div>
          <p className={s.time}>
            <span className={s.timeNum}>19.1</span>
            <span className={s.timeLabel}>seconds to make</span>
          </p>
        </div>

        <dl className={s.fields}>
          <div className={`${s.field} ${s.f1}`}>
            <dt>Title</dt>
            <dd className={s.title}>Energizer BTS356 Wireless Bluetooth Speaker Waterproof Magnetic Power Bank Beige</dd>
          </div>
          <div className={`${s.field} ${s.f2}`}>
            <dt>Category</dt>
            <dd>Audio Docks &amp; Mini Speakers</dd>
          </div>
          <div className={`${s.field} ${s.f3}`}>
            <dt>Item specifics</dt>
            <dd>
              <ul className={s.chips} role="list">
                {SPECIFICS.map(([k, v]) => <li key={k}><span>{k}</span> {v}</li>)}
                <li className={s.more}>and 4 more</li>
              </ul>
            </dd>
          </div>
          <div className={`${s.field} ${s.f4}`}>
            <dt>Parcel</dt>
            <dd>3 lb, USPS Ground Advantage</dd>
          </div>
          <div className={`${s.field} ${s.f5}`}>
            <dt>Price</dt>
            <dd>
              <span className={s.price}>$137.99</span>
              <span className={s.priceNote}>Middle of 9 live eBay.com listings</span>
            </dd>
          </div>
        </dl>
      </div>

      <figcaption className={s.caption}>
        A real listing Remvo made on 13 October 2026, as it came back.
      </figcaption>
    </figure>
  );
}
