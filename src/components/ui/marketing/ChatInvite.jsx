import { openChat } from '@lib/chatBus';
import { SELL_PATHS } from '@lib/sellPaths';
import styles from '@styles/ui/marketing/chat-invite.module.css';

/* ──────────────────────────────────────────────────────────────────
 * ChatInvite (chat3): "Tell us how you sell. We'll make it easier."
 *
 * One invitation that fits every seller, from the one thinking of
 * starting to the one listing thousands a month, then one tap to say
 * which they are. Each row opens the chat with that already chosen,
 * so the first reply from a person fits them. It asks about them; it
 * never tells them what is wrong.
 * ────────────────────────────────────────────────────────────────── */

function Arrow() {
  return (
    <svg className={styles.arrow} width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
      <path d="M3 9h11M10 4.5L14.5 9 10 13.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChatInvite({ id = 'talk-heading' }) {
  return (
    <section className={styles.invite} aria-labelledby={id}>
      <div className={styles.inner}>
        <div className={styles.text}>
          <h2 id={id} className={styles.heading}>Tell us how you sell. We&apos;ll make it easier.</h2>
          <p className={styles.desc}>
            Starting out or listing thousands a month, a person at Remvo replies with what would save you the most time.
            Usually within a few hours.
          </p>
        </div>
        <div className={styles.choose}>
          <p className={styles.ask} id={`${id}-ask`}>Which sounds like you?</p>
          <ul className={styles.list} aria-labelledby={`${id}-ask`}>
            {SELL_PATHS.map((p) => (
              <li key={p.id}>
                <button type="button" className={styles.row} onClick={() => openChat({ path: p.id })}>
                  <span>{p.label}</span>
                  <Arrow />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* One line in place, for a page that already knows something about
 * the visitor (they are looking at bulk, or at prices). */
export function ChatLine({ children, action, path, hint, className = '' }) {
  return (
    <p className={`${styles.line} ${className}`}>
      {children}{' '}
      <button type="button" className={styles.lineButton} onClick={() => openChat({ path, hint })}>{action}</button>
    </p>
  );
}
