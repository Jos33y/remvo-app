import { useId } from 'react';
import { IconCopy } from '@components/ui/icons/IconCopy';
import { useMarket } from '@hooks/useMarket';
import { MARKETPLACES } from '@lib/market';
import { PRICING } from '@utils/constants';
import styles from '@styles/ui/marketing/listing-preview.module.css';

/* ListingPreview
 *
 * What a seller gets back from one "Make a listing" job, drawn as the
 * result screen draws it: the input on top, then each field in its
 * own row with its own copy affordance.
 *
 * It follows the visitor's marketplace, because that is the point: a
 * seller on eBay.de sees a German listing, the DHL parcel and a price
 * in euros; a seller on eBay.com sees inches, pounds and USPS. Field
 * labels stay in English (they are our interface); values are in the
 * marketplace's language, as the real job writes them.
 *
 * The product and figures are illustrative, and the caption says so.
 * The help pages carry the real walkthroughs.
 */


const EXAMPLES = {
  US: {
    barcode: '860004512875',
    title: 'Insulated Stainless Steel Water Bottle 25 oz Double Wall Leak Proof Lid Black',
    category: 'Water Bottles',
    specifics: [['Brand', 'Unbranded'], ['Type', 'Water Bottle'], ['Material', 'Stainless Steel'], ['Capacity', '25 oz'], ['Color', 'Black']],
    parcel: { size: '11 x 4 x 4 in', weight: '1 lb' },
    price: '$19.99',
    listings: 27,
  },
  CA: {
    barcode: '628244512877',
    title: 'Insulated Stainless Steel Water Bottle 750 ml Double Wall Leak Proof Lid Black',
    category: 'Water Bottles',
    specifics: [['Brand', 'Unbranded'], ['Type', 'Water Bottle'], ['Material', 'Stainless Steel'], ['Capacity', '750 ml'], ['Colour', 'Black']],
    parcel: { size: '28 x 10 x 10 cm', weight: '0.45 kg' },
    price: 'C$24.99',
    listings: 14,
  },
  UK: {
    barcode: '5060324512875',
    title: 'Insulated Stainless Steel Water Bottle 750ml Double Wall Leak Proof Lid Black',
    category: 'Water Bottles',
    specifics: [['Brand', 'Unbranded'], ['Type', 'Water Bottle'], ['Material', 'Stainless Steel'], ['Capacity', '750 ml'], ['Colour', 'Black']],
    parcel: { size: '28 x 10 x 10 cm', weight: '0.45 kg' },
    price: '£14.99',
    listings: 23,
  },
  DE: {
    barcode: '4006384512876',
    title: 'Edelstahl Trinkflasche 750 ml Doppelwandig Isoliert Auslaufsicher Schwarz',
    category: 'Trinkflaschen',
    specifics: [['Marke', 'Markenlos'], ['Produktart', 'Trinkflasche'], ['Material', 'Edelstahl'], ['Fassungsvermögen', '750 ml'], ['Farbe', 'Schwarz']],
    parcel: { size: '28 x 10 x 10 cm', weight: '0,45 kg' },
    price: '16,99 €',
    listings: 19,
  },
  FR: {
    barcode: '3760144512872',
    title: 'Gourde Isotherme Inox 750 ml Double Paroi Étanche Noire',
    category: 'Gourdes',
    specifics: [['Marque', 'Sans marque'], ['Type', 'Gourde'], ['Matière', 'Acier inoxydable'], ['Capacité', '750 ml'], ['Couleur', 'Noir']],
    parcel: { size: '28 x 10 x 10 cm', weight: '0,45 kg' },
    price: '17,99 €',
    listings: 16,
  },
  IT: {
    barcode: '8052904512877',
    title: 'Borraccia Termica Acciaio Inox 750 ml Doppia Parete a Tenuta Nera',
    category: 'Borracce',
    specifics: [['Marca', 'Senza marca'], ['Tipo', 'Borraccia'], ['Materiale', 'Acciaio inossidabile'], ['Capacità', '750 ml'], ['Colore', 'Nero']],
    parcel: { size: '28 x 10 x 10 cm', weight: '0,45 kg' },
    price: '15,99 €',
    listings: 12,
  },
  ES: {
    barcode: '8421734512874',
    title: 'Botella Térmica Acero Inoxidable 750 ml Doble Pared Antigoteo Negra',
    category: 'Botellas y cantimploras',
    specifics: [['Marca', 'Sin marca'], ['Tipo', 'Botella'], ['Material', 'Acero inoxidable'], ['Capacidad', '750 ml'], ['Color', 'Negro']],
    parcel: { size: '28 x 10 x 10 cm', weight: '0,45 kg' },
    price: '16,49 €',
    listings: 11,
  },
};

function Row({ label, children, mono = false, lang }) {
  return (
    <div className={styles.row}>
      <dt className={styles.label}>{label}</dt>
      <dd className={`${styles.value} ${mono ? styles.mono : ''}`} lang={lang}>{children}</dd>
      <span className={styles.copy} aria-hidden="true"><IconCopy size={14} /></span>
    </div>
  );
}

export function ListingPreview() {
  const { marketplace, site, setMarketplace } = useMarket();
  const e = EXAMPLES[marketplace] ?? EXAMPLES.US;
  const selectId = useId();
  const lang = site.langCode === 'en' ? undefined : site.langCode;

  return (
    <figure className={styles.preview} aria-labelledby="listing-preview-caption">
      <div className={styles.bar}>
        <label htmlFor={selectId} className={styles.barLabel}>Listing for</label>
        <span className={styles.selectWrap}>
          <select
            id={selectId}
            className={styles.select}
            value={marketplace}
            onChange={(ev) => setMarketplace(ev.target.value)}
          >
            {MARKETPLACES.map((m) => <option key={m.id} value={m.id}>{m.site}</option>)}
          </select>
          <svg className={styles.chevron} width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span className={styles.cost}>{PRICING.JOBS.LISTING.credits} credits</span>
      </div>

      <div className={styles.input}>
        <span className={styles.inputKind}>Barcode</span>
        <span className={styles.inputValue}>{e.barcode}</span>
        <span className={styles.condition}>New</span>
      </div>

      <dl className={styles.fields}>
        <Row label="Title" lang={lang}>
          {e.title}
          <span className={styles.count} lang="en">{e.title.length}/80</span>
        </Row>
        <Row label="Category" lang={lang}>{e.category}</Row>
        <Row label="Item specifics" lang={lang}>
          <span className={styles.specifics}>
            {e.specifics.map(([k, v]) => (
              <span key={k} className={styles.specific}>
                <span className={styles.specificKey}>{k}</span> {v}
              </span>
            ))}
          </span>
        </Row>
        <Row label="Parcel" mono>
          {e.parcel.size} <span className={styles.sep}>|</span> {e.parcel.weight}
          <span className={styles.sub} lang="en">{site.carrier}</span>
        </Row>
        <Row label="Price" mono>
          <span className={styles.price}>{e.price}</span>
          <span className={styles.sub} lang="en">Middle of {e.listings} live {site.site} listings</span>
        </Row>
      </dl>

      <figcaption id="listing-preview-caption" className={styles.caption}>
        Example result for {site.site}, written in {site.lang}. The product and figures are illustrative.
      </figcaption>
    </figure>
  );
}
