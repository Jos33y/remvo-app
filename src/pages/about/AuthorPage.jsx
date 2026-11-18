import { Link } from 'react-router';
import { AUTHOR, ROUTES } from '@utils/constants';
import info from '@styles/pages/marketing/info-page.module.css';

/* ──────────────────────────────────────────────────────────────────
 * /about/joseph-lagbalu (seo2)
 *
 * The person behind the guides and calculators. Every guide's byline
 * links here, and the guides' structured data names this page, so a
 * reader and a search engine can see who checked the facts. Public,
 * verifiable facts only (AUTHOR in utils/constants.js).
 * ────────────────────────────────────────────────────────────────── */

export function AuthorPage() {
  return (
    <>
      <section className={info.intro} aria-labelledby="author-heading">
        <div className={info.introInner}>
          <h1 id="author-heading" className={info.title}>{AUTHOR.NAME}</h1>
          <p className={info.lede}>{AUTHOR.ROLE}</p>
        </div>
      </section>

      <div className={info.body}>
        <div className={info.bodyInner}>
          <section className={info.section} aria-labelledby="author-about">
            <h2 id="author-about" className={info.sectionHeading}>About</h2>
            <div className={info.sectionBody}>
              {AUTHOR.BIO.map((p) => <p key={p}>{p}</p>)}
            </div>
          </section>

          <section className={info.section} aria-labelledby="author-checks">
            <h2 id="author-checks" className={info.sectionHeading}>How the guides are checked</h2>
            <div className={info.sectionBody}>
              <p>Every fee, limit and step on Remvo&apos;s guides and calculators comes from eBay&apos;s own help pages, or from a real listing made in Remvo, and is listed under Sources with the day it was checked. When eBay changes something, the page changes and its date moves.</p>
              <p>Read the <Link to={ROUTES.GUIDES} className={info.link}>guides</Link>, or spot something out of date and <Link to={ROUTES.CONTACT} className={info.link}>tell us</Link>.</p>
            </div>
          </section>

          <section className={info.section} aria-labelledby="author-links">
            <h2 id="author-links" className={info.sectionHeading}>Elsewhere</h2>
            <div className={info.sectionBody}>
              <ul>
                {AUTHOR.LINKS.map(([label, href]) => (
                  <li key={href}><a href={href} className={info.link} target="_blank" rel="noopener noreferrer me">{label}</a></li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
