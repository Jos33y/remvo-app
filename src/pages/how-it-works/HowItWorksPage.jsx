import { Link } from 'react-router';
import { Reveal } from '@components/ui/marketing/Reveal';
import { Button } from '@components/ui/shared/Button';
import { useMarket } from '@hooks/useMarket';
import { MARKETPLACES, money } from '@lib/market';
import { ROUTES, APP_LINKS, BRAND, PRICING, creditsCost } from '@utils/constants';
import styles from '@styles/pages/marketing/info-page.module.css';

const FIELDS = [
  ['Title', 'Up to 80 characters, the limit eBay takes, in the words buyers on your eBay site search with for this product.'],
  ['Description', 'What it is, its key features, what is in the box, its size and weight, and anything a buyer should know. Plain text, ready to paste.'],
  ['Category', 'The category it belongs in on your eBay site.'],
  ['Item specifics', 'Every detail that category asks for, filled from the product, in the values eBay accepts. Anything the product does not tell us is left empty for you rather than guessed.'],
  ['Parcel', 'Size and packed weight, and the parcel service it fits where you post from.'],
  ['Price', 'A price set from what the same product sells for on your eBay site today, with how many listings it was taken from.'],
];

/* Answers to what a seller asks before paying anything. Each one is
 * true of the product as built; nothing here is a plan. */
function faq(currency) {
  return [
    {
      q: 'What if my barcode is not on Amazon?',
      a: 'The job stops, the credits go straight back to your balance, and you can try the product link instead. Nothing is charged for a product we cannot find.',
    },
    {
      q: 'What about sizes and colours?',
      a: 'One listing per barcode. Each size or colour usually has its own barcode, so give each one in turn. Listings with several variations in one are not made yet.',
    },
    {
      q: 'Can I list used items?',
      a: 'Yes, if they have a barcode. Choose the condition (New, New other or Used) before you start, and the listing is written for it. Vintage, handmade and one-off items without a barcode are not something Remvo does.',
    },
    {
      q: 'Can I change the listing before I copy it?',
      a: 'Yes. Every field can be edited in Remvo, and your version is what gets copied and downloaded. You can put any field back to how Remvo wrote it.',
    },
    {
      q: 'Can I list a whole spreadsheet?',
      a: 'Yes, up to 500 lines at a time. Paste the barcode column or upload the file saved as a CSV. Remvo checks every line for free and tells you what will run and what it will cost before anything is spent. When the listings are made you get an email, an eBay drafts file to upload in Seller Hub, and a full file with every field.',
    },
    {
      q: 'Does it add photos?',
      a: 'No. You add your own photos in eBay, as you do now. Remvo writes everything else.',
    },
    {
      q: 'Can it publish to eBay for me?',
      a: 'Not yet. You copy the fields in, or upload the drafts file in Seller Hub and add photos there. Remvo never needs your eBay login.',
    },
    {
      q: 'Which language is the listing in?',
      a: 'The language of your eBay site: English for the US, Canada and the UK, German for eBay.de, French for eBay.fr, Italian for eBay.it and Spanish for eBay.es.',
    },
    {
      q: 'What happens to my data?',
      a: `Each listing is kept for ${PRICING.RESULT_DAYS} days so you can come back to it, then deleted. You can delete any listing sooner. We never use your listings for anyone else.`,
    },
    {
      q: 'Which currency do I pay in?',
      a: `US dollars, euros or pounds. You choose; we suggest one from where you are. A listing costs ${money(creditsCost(PRICING.JOBS.LISTING.credits, currency), currency)} in the currency you have picked.`,
    },
  ];
}

function Section({ heading, children, id }) {
  return (
    <Reveal>
      <section className={styles.section} aria-labelledby={id}>
        <h2 id={id} className={styles.sectionHeading}>{heading}</h2>
        <div className={styles.sectionBody}>{children}</div>
      </section>
    </Reveal>
  );
}

export function HowItWorksPage() {
  const { currency } = useMarket();


  const perListing = money(creditsCost(PRICING.JOBS.LISTING.credits, currency), currency);
  const from = money(PRICING.PACKS[0].price[currency], currency);

  return (
    <>
      <section className={styles.intro} aria-labelledby="how-heading">
        <div className={styles.introInner}>
          <Reveal>
            <span className={styles.label}>How it works</span>
            <h1 id="how-heading" className={styles.title}>
              One product in. One finished eBay listing out.
            </h1>
            <p className={styles.lede}>
              You give Remvo a product you sell. It reads the product, looks at
              how the same product is listed on your eBay site, and writes every
              field eBay asks for, in that site&apos;s language. You check it and
              publish it.
            </p>
          </Reveal>
        </div>
      </section>

      <div className={styles.body}>
        <div className={styles.bodyInner}>
          <Section heading="What you give it" id="give">
            <p>
              The barcode from the box, the 8 to 14 digits under the stripes, or
              the link to the product on Amazon. Then its condition: New, New
              other (open box) or Used.
            </p>
            <p className={styles.muted}>
              If a barcode matches more than one product, you see them and pick
              yours before any credits are used.
            </p>
          </Section>

          <Section heading="Who it is for" id="for">
            <ul className={styles.list}>
              <li>Sellers of products with a barcode: wholesale, retail arbitrage, overstock, returns.</li>
              <li>Anyone listing the same kind of thing week after week, who would rather check a listing than type one.</li>
            </ul>
            <p className={`${styles.after}`}>
              <strong>Not for vintage, handmade or one-off items.</strong> Without
              a barcode or a product page there is nothing reliable to read, and
              we would rather tell you now than take your money finding out.
            </p>
          </Section>

          <Section heading="Your eBay site" id="sites">
            <p>
              Choose the eBay site you sell on. The listing is written in its
              language, in its categories, with its parcel services and a price
              from its live listings.
            </p>
            <table className={`${styles.table} ${styles.after}`}>
              <thead>
                <tr>
                  <th scope="col">eBay site</th>
                  <th scope="col">Language</th>
                  <th scope="col">Parcel</th>
                </tr>
              </thead>
              <tbody>
                {MARKETPLACES.map((m) => (
                  <tr key={m.id}>
                    <th scope="row">{m.site}</th>
                    <td>{m.lang}</td>
                    <td>{m.carrier}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className={`${styles.muted} ${styles.after}`}>
              Selling from somewhere else, such as Ireland, Portugal or the
              Netherlands? Pick the eBay site your buyers use.
            </p>
          </Section>

          <Section heading="What comes back" id="back">
            <dl className={styles.fields}>
              {FIELDS.map(([term, desc]) => (
                <div key={term} className={styles.field}>
                  <dt className={styles.fieldTerm}>{term}</dt>
                  <dd className={styles.fieldDesc}>{desc}</dd>
                </div>
              ))}
            </dl>
            <p className={`${styles.after}`}>
              <Link to={ROUTES.EXAMPLE} className={styles.link}>See one in full</Link>: a real listing, every field as it came back.
            </p>
          </Section>

          <Section heading="How you use it" id="use">
            <p>
              Read it, change anything you want, then copy each field into eBay
              as you create the listing, or download the whole listing as a file.
            </p>
            <p className={styles.muted}>
              Read it before you publish. You know your stock; Remvo only knows
              what the product page and the market say.
            </p>
          </Section>

          <Section heading="In bulk" id="bulk">
            <p>
              Paste a column of barcodes or upload your spreadsheet, up to 500 lines. Remvo checks every
              line for free and tells you what will run and what it will cost. Start, and get on with
              something else: you get an email when they are done.
            </p>
            <ul className={`${styles.list} ${styles.after}`}>
              <li>One listing at a time, about 20 seconds each, so 300 lines take about 100 minutes.</li>
              <li>A line that does not work gives its credits back.</li>
              <li>Where a barcode finds more than one product, the product on its own is taken over bundles, and the line is marked for you to check.</li>
              <li>An eBay drafts file to upload in Seller Hub, with the title, category, condition, price and description. eBay&apos;s drafts file has no room for item specifics, so they come in a second, full file, to fill in on each draft.</li>
            </ul>
          </Section>

          <Section heading="What Remvo never does" id="never">
            <ul className={styles.list}>
              <li>Post, change or end anything on your eBay account.</li>
              <li>Ask for your eBay password or connect to your eBay account.</li>
              <li>Use your listings for anyone else, or sell your data.</li>
            </ul>
          </Section>

          <Section heading="When a job fails" id="fails">
            <p>
              If Remvo cannot produce the listing, the credits go straight back
              to your balance. Nothing to ask for.
            </p>
          </Section>

          <Section heading="Questions" id="faq">
            <div className={styles.faq}>
              {faq(currency).map((f) => (
                <details key={f.q} className={styles.faqItem}>
                  <summary className={styles.faqQ}>{f.q}</summary>
                  <p className={styles.faqA}>{f.a}</p>
                </details>
              ))}
            </div>
            <p className={`${styles.muted} ${styles.after}`}>
              Anything else: <a href={`mailto:${BRAND.EMAIL}`} className={styles.link}>{BRAND.EMAIL}</a>.
              The detail on data is in the <Link to={ROUTES.PRIVACY} className={styles.link}>privacy policy</Link>.
            </p>
          </Section>
        </div>
      </div>

      <section className={styles.close} aria-label="Get started">
        <div className={styles.closeInner}>
          <p className={styles.closeHeading}>
            {perListing} a listing, from a {from} top‑up.
          </p>
          <Button href={APP_LINKS.SIGN_UP} variant="primary" size="large">
            Make your first listing
          </Button>
        </div>
      </section>
    </>
  );
}
