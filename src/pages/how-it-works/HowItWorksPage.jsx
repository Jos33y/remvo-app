import { useEffect } from 'react';
import { Link } from 'react-router';
import { Reveal } from '@components/ui/marketing/Reveal';
import { Button } from '@components/ui/shared/Button';
import { ROUTES, APP_LINKS, PRICING } from '@utils/constants';
import styles from '@styles/pages/marketing/info-page.module.css';

const FIELDS = [
  ['Title', 'Up to 80 characters, the limit eBay takes, in the words buyers search with for this product.'],
  ['Description', 'What it is, its key features, what is in the box, its size and weight, and anything a buyer should know. Plain text, ready to paste.'],
  ['Category', 'The eBay UK category it belongs in.'],
  ['Item specifics', 'Every detail that category asks for, filled from the product, in the values eBay accepts. Anything the product does not tell us is left empty for you rather than guessed.'],
  ['Parcel', 'Size and packed weight, and the Royal Mail parcel it fits.'],
  ['Price', 'A price set from what the same product sells for on eBay UK today, with how many listings it was taken from.'],
];

function Section({ heading, children }) {
  return (
    <Reveal>
      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>{heading}</h2>
        <div className={styles.sectionBody}>{children}</div>
      </section>
    </Reveal>
  );
}

export function HowItWorksPage() {
  useEffect(() => {
    document.title = 'Remvo | How it works';
  }, []);

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
              how the same product is listed on eBay UK, and writes every field
              eBay asks for. You check it and publish it.
            </p>
          </Reveal>
        </div>
      </section>

      <div className={styles.body}>
        <div className={styles.bodyInner}>
          <Section heading="What you give it">
            <p>
              The barcode from the box, the 8 to 14 digits under the stripes, or
              the link to the product on Amazon UK.
            </p>
            <p className={styles.muted}>
              If a barcode matches more than one product, you see them and pick
              yours before any credits are used.
            </p>
          </Section>

          <Section heading="What comes back">
            <dl className={styles.fields}>
              {FIELDS.map(([term, desc]) => (
                <div key={term} className={styles.field}>
                  <dt className={styles.fieldTerm}>{term}</dt>
                  <dd className={styles.fieldDesc}>{desc}</dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section heading="How you use it">
            <p>
              Each field has its own copy button. Copy them into eBay as you
              create the listing, or download the whole listing as a file.
            </p>
            <p className={styles.muted}>
              Read it before you publish. You know your stock; Remvo only knows
              what the product page and the market say.
            </p>
          </Section>

          <Section heading="What Remvo never does">
            <ul className={styles.list}>
              <li>Post, change or end anything on your eBay account.</li>
              <li>Ask for your eBay password or connect to your eBay account.</li>
              <li>Use your listings for anyone else, or sell your data.</li>
            </ul>
          </Section>

          <Section heading="When a job fails">
            <p>
              If Remvo cannot produce the listing, the credits go straight back
              to your balance. Nothing to ask for.
            </p>
          </Section>

          <Section heading="What happens to your listings">
            <p>
              Each job is kept for {PRICING.RESULT_DAYS} days so you can come
              back to it, then deleted. You can delete any job sooner.
            </p>
            <p className={styles.muted}>
              The detail is in the <Link to={ROUTES.PRIVACY} className={styles.link}>privacy policy</Link>.
            </p>
          </Section>
        </div>
      </div>

      <section className={styles.close} aria-label="Get started">
        <div className={styles.closeInner}>
          <p className={styles.closeHeading}>
            {PRICING.JOBS.LISTING.credits} credits a listing, from a £5 top-up.
          </p>
          <Button href={APP_LINKS.SIGN_IN} variant="primary" size="large">
            Make your first listing
          </Button>
        </div>
      </section>
    </>
  );
}
