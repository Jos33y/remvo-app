import { useLocation } from 'react-router';
import styles from '@styles/ui/admin/admin-screen-stub.module.css';

/* ──────────────────────────────────────────────────────────────────
 * AdminScreenStub
 *
 * Placeholder rendered by every skeleton page in Phase 6 Session
 * A1. Removed entirely as each real screen lands in subsequent
 * sessions.
 *
 * Layout
 *   Title     | the screen's intended page title
 *   Phase     | "Building this screen | Session ?? | Phase ?"
 *   Route     | the resolved pathname in IBM Plex Mono
 *
 * The stub uses --type-h1 + body so each skeleton page reads as
 * intentional during the A1 walkthrough, not as a 404 or a
 * regression.
 * ────────────────────────────────────────────────────────────────── */

export function AdminScreenStub({ title, sessionLabel, phaseLabel, body }) {
  const location = useLocation();
  return (
    <div className={styles.stub}>
      <div className={styles.inner}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.phase}>
          Building this screen{sessionLabel ? ` | ${sessionLabel}` : ''}
          {phaseLabel ? ` | ${phaseLabel}` : ''}
        </p>
        {body && <p className={styles.body}>{body}</p>}
        <code className={styles.route}>{location.pathname}</code>
      </div>
    </div>
  );
}
