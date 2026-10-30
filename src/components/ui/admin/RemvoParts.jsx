import styles from '@styles/pages/admin/remvo.module.css';

/* ──────────────────────────────────────────────────────────────────
 * RemvoParts (analytics1): the small pieces every Remvo report uses.
 * ────────────────────────────────────────────────────────────────── */

export function Delta({ d }) {
  if (!d) return null;
  const label = d.sign === 'new' ? 'Nothing in the previous period to compare with' : `Against the previous period: ${d.text}`;
  return <span className={`${styles.delta} ${styles[`delta-${d.sign}`]}`} aria-label={label}>{d.text}</span>;
}

/** Loading, error and empty states for a report; renders children when there is data. */
export function Report({ report, empty, emptyText = 'Nothing recorded in this range yet.', children }) {
  if (report.error && !report.data) {
    return <p className={`${styles.state} ${styles.error}`} role="alert">{report.error.message}</p>;
  }
  if (!report.data) {
    return <div className={styles.loadingBar} role="status" aria-label="Loading the report" />;
  }
  return (
    <>
      {report.loading && <div className={styles.loadingBar} role="status" aria-label="Updating" />}
      {report.error && <p className={`${styles.state} ${styles.error}`} role="alert">{report.error.message}</p>}
      {empty ? <p className={styles.state}>{emptyText}</p> : children}
    </>
  );
}

export function Panel({ title, note, children, className }) {
  return (
    <section className={[styles.panel, className].filter(Boolean).join(' ')} aria-label={title}>
      <header className={styles.panelHead}>
        <h3 className={styles.panelTitle}>{title}</h3>
        {note && <p className={styles.panelNote}>{note}</p>}
      </header>
      {children}
    </section>
  );
}

/** A share of the whole, one bar per row. */
export function Bars({ rows, gold = false, format = (n) => n.toLocaleString('en-GB') }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className={styles.bars}>
      {rows.map((r) => (
        <li key={r.key} className={styles.barRow}>
          <span className={styles.barName} title={r.label}>{r.label}</span>
          <span className={styles.barNum}>{format(r.value)}</span>
          <span className={styles.barTrack} aria-hidden="true">
            <span className={`${styles.barFill} ${gold ? styles.barGold : ''}`} style={{ width: `${(r.value / max) * 100}%`, display: 'block' }} />
          </span>
        </li>
      ))}
    </ul>
  );
}

export function Toggle({ options, value, onChange, label }) {
  return (
    <div className={styles.toggle} role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  );
}
