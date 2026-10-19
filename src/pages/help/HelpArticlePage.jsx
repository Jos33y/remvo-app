import { Link, useParams } from 'react-router';
import { Button } from '@components/ui/shared/Button';
import { ChatLine } from '@components/ui/marketing/ChatInvite';
import { NotFoundPage } from '@pages/not-found/NotFoundPage';
import { HelpVideo } from '@pages/help/HelpVideo';
import { useStaticBody } from '@hooks/useStaticBody';
import { HELP, helpBySlug, helpPath, openHref, sectionOf } from '@lib/help';
import { guideBySlug, guidePath, longDate } from '@lib/guides';
import { ROUTES } from '@utils/constants';
import H from '@styles/pages/marketing/help.module.css';

/* ──────────────────────────────────────────────────────────────────
 * A help page, /help/:slug (help1)
 *
 * One task in the app. The task is the h1 and its answer sits under it
 * in a line; then the film (the video, or the app's screen until the
 * video is up); then the steps, written out so they work without
 * sound, for a screen reader, and for Google and AI tools; then the one
 * button that opens that screen in the app.
 * ────────────────────────────────────────────────────────────────── */

const BODY_ID = 'help-body';

export function HelpArticlePage() {
  const { slug } = useParams();
  const entry = helpBySlug(slug);
  const html = useStaticBody(BODY_ID, entry, entry ? helpPath(entry.slug) : '');
  if (!entry) return <NotFoundPage />;

  const section = sectionOf(entry.section);
  const related = entry.related.map(helpBySlug).filter(Boolean);
  const more = related.length ? related : HELP.filter((h) => h.section === entry.section && h.slug !== entry.slug).slice(0, 3);
  const guide = entry.guide ? guideBySlug(entry.guide) : null;

  return (
    <article className={H.page} data-topic={section.ink} aria-labelledby="help-title">
      <header className={H.head}>
        <nav className={H.crumbs} aria-label="Breadcrumb">
          <ol>
            <li><Link to={ROUTES.HELP}>Help</Link></li>
            <li aria-current="page">{entry.title}</li>
          </ol>
        </nav>
        <p className={H.eyebrow}>{section.name}</p>
        <h1 id="help-title" className={H.title}>{entry.title}</h1>
        <p className={H.lede}>{entry.short}</p>
      </header>

      <div className={H.film}>
        <HelpVideo entry={entry} priority />
      </div>

      <div className={H.column}>
        <div id={BODY_ID} data-slug={entry.slug} className={H.body} dangerouslySetInnerHTML={{ __html: html }} />

        <aside className={H.open} aria-labelledby="help-open">
          <h2 id="help-open" className={H.openHeading}>Try it now</h2>
          <Button href={openHref(entry.open)} variant="ivory" size="default">{entry.open.label}</Button>
          <ChatLine className={H.openTalk} path="other" hint={`About "${entry.title}": `} action="Ask a person.">
            Stuck on a step?
          </ChatLine>
        </aside>

        {(more.length > 0 || guide) && (
          <section className={H.more} aria-labelledby="help-more">
            <h2 id="help-more" className={H.smallHeading}>Next</h2>
            <ul className={H.moreList}>
              {more.map((h) => (
                <li key={h.slug}><a href={helpPath(h.slug)}>{h.title}</a></li>
              ))}
              {guide && (
                <li><a href={guidePath(guide.slug)}><span className={H.moreKind}>Guide</span> {guide.title}</a></li>
              )}
            </ul>
          </section>
        )}

        <p className={H.note}>
          Checked against Remvo on <time dateTime={entry.checked}>{longDate(entry.checked)}</time>. If a screen looks different, <Link to={ROUTES.CONTACT}>tell us</Link> and we will fix this page.
        </p>
      </div>
    </article>
  );
}
