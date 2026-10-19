import { useId, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ChatLine } from '@components/ui/marketing/ChatInvite';
import { HELP, HELP_SECTIONS, helpPath } from '@lib/help';
import { ROUTES } from '@utils/constants';
import H from '@styles/pages/marketing/help.module.css';

/* ──────────────────────────────────────────────────────────────────
 * Help, /help (help1)
 *
 * Every task in Remvo, by section, in the order a new seller meets
 * them. Each task is a frame from its film: the app's own screen, the
 * running time when its video is up, the task and its one-line answer.
 * A box at the top narrows the list as you type. The whole frame is
 * the link, and it reloads the page on purpose, as with guides: each
 * help page is its own finished HTML page.
 * ────────────────────────────────────────────────────────────────── */

const stepsLabel = (h) => {
  const n = h.headings.filter((x) => x.n).length;
  return `${n} ${n === 1 ? 'step' : 'steps'}`;
};

const fold = (s) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9 ]+/g, ' ');

export function HelpPage() {
  const [query, setQuery] = useState('');
  const searchId = useId();
  const countId = useId();
  const words = fold(query).split(/\s+/).filter(Boolean);
  const shown = useMemo(
    () => HELP.filter((h) => { const text = fold(`${h.title} ${h.short} ${h.description}`); return words.every((w) => text.includes(w)); }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [words.join(' ')]
  );
  const anyVideo = HELP.some((h) => h.video);

  return (
    <div className={H.desk}>
      <div className={H.deskInner}>
        <header className={H.deskHead}>
          <h1 className={H.title}>Help</h1>
          <p className={H.lede}>
            {anyVideo
              ? 'Everything in Remvo, one task at a time: a short video, and the steps written out under it.'
              : 'Everything in Remvo, one task at a time, with the steps written out.'}
          </p>
          <div className={H.search} role="search">
            <label htmlFor={searchId} className={H.searchLabel}>What do you want to do?</label>
            <input
              id={searchId}
              type="search"
              className={H.searchInput}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Scan a barcode, buy credits…"
              autoComplete="off"
              enterKeyHint="search"
              aria-describedby={countId}
            />
            <p id={countId} className={H.searchCount} aria-live="polite">
              {words.length ? `${shown.length} of ${HELP.length} ${HELP.length === 1 ? 'task' : 'tasks'}` : ''}
            </p>
          </div>
        </header>

        {HELP_SECTIONS.map((section) => {
          const items = shown.filter((h) => h.section === section.id);
          if (!items.length) return null;
          return (
            <section key={section.id} className={H.shelf} data-topic={section.ink} aria-labelledby={`help-${section.id}`}>
              <h2 id={`help-${section.id}`} className={H.shelfTitle}>{section.name}</h2>
              <ol className={H.frames}>
                {items.map((h) => (
                  <li key={h.slug} className={H.frame}>
                    <div className={H.frameStrip}>
                      <div className={H.frameScreen}>
                        <img src={h.poster} alt="" width="1280" height="720" loading="lazy" decoding="async" />
                        {h.video && <span className={H.frameTime}><span className="sr-only">Video, </span>{h.duration}</span>}
                      </div>
                    </div>
                    <h3 className={H.frameTitle}><a href={helpPath(h.slug)}>{h.title}</a></h3>
                    <p className={H.frameMeta}>
                      {h.video ? `Video and ${stepsLabel(h)}` : stepsLabel(h)}
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          );
        })}

        {words.length > 0 && shown.length === 0 && (
          <p className={H.none}>
            Nothing matches “{query.trim()}”. Try one word, such as <button type="button" className={H.inlineButton} onClick={() => setQuery('scan')}>scan</button> or <button type="button" className={H.inlineButton} onClick={() => setQuery('credits')}>credits</button>, or ask us below.
          </p>
        )}

        <div className={H.deskFoot}>
          <ChatLine path="other" hint="What are you trying to do in Remvo?" action="Ask a person.">
            Can’t find it?
          </ChatLine>
          <p className={H.deskNote}>
            Questions about selling on eBay itself, not about Remvo, are in the <Link to={ROUTES.GUIDES}>guides</Link>. You can also <Link to={ROUTES.CONTACT}>write to us</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
