import { IconCopy } from '@components/ui/icons/IconCopy';
import { PRICING } from '@utils/constants';
import styles from '@styles/ui/marketing/listing-preview.module.css';

/* ListingPreview
 *
 * What a seller gets back from one "Make a listing" job, drawn as the
 * result screen draws it: the input on top, then each field in its
 * own row with its own copy affordance. On the marketing site it is a
 * picture of the product, so the copy icons are decorative and the
 * figure says it is an example.
 *
 * The product and figures are illustrative. Replace EXAMPLE with a
 * real job's output once the metered run has produced one.
 */

const EXAMPLE = {
  input: { kind: 'Barcode', value: '5060324512876' },
  title: 'Insulated Stainless Steel Water Bottle 750ml Double Wall Leak Proof Lid Black',
  category: 'Water Bottles',
  specifics: [
    ['Brand', 'Unbranded'],
    ['Type', 'Water Bottle'],
    ['Material', 'Stainless Steel'],
    ['Capacity', '750 ml'],
    ['Colour', 'Black'],
  ],
  parcel: { size: '28 x 10 x 10 cm', weight: '0.45 kg', band: 'Royal Mail small parcel' },
  price: { value: '£14.99', basis: 'Middle of 23 live UK listings' },
};

function Row({ label, children, mono = false }) {
  return (
    <div className={styles.row}>
      <dt className={styles.label}>{label}</dt>
      <dd className={`${styles.value} ${mono ? styles.mono : ''}`}>{children}</dd>
      <span className={styles.copy} aria-hidden="true"><IconCopy size={14} /></span>
    </div>
  );
}

export function ListingPreview() {
  const e = EXAMPLE;
  return (
    <figure className={styles.preview} aria-labelledby="listing-preview-caption">
      <div className={styles.input}>
        <span className={styles.inputKind}>{e.input.kind}</span>
        <span className={styles.inputValue}>{e.input.value}</span>
        <span className={styles.cost}>{PRICING.JOBS.LISTING.credits} credits</span>
      </div>

      <dl className={styles.fields}>
        <Row label="Title">
          {e.title}
          <span className={styles.count}>{e.title.length}/80</span>
        </Row>
        <Row label="Category">{e.category}</Row>
        <Row label="Item specifics">
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
          <span className={styles.sub}>{e.parcel.band}</span>
        </Row>
        <Row label="Price" mono>
          <span className={styles.price}>{e.price.value}</span>
          <span className={styles.sub}>{e.price.basis}</span>
        </Row>
      </dl>

      <figcaption id="listing-preview-caption" className={styles.caption}>
        Example result. The product and figures are illustrative.
      </figcaption>
    </figure>
  );
}
