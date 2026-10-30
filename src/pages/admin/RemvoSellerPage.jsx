import { Link, useParams } from 'react-router';
import { adminPath } from '@app/adminRouter';
import { Panel, Report } from '@components/ui/admin/RemvoParts';
import { useRemvoReport } from '@hooks/useRemvoReport';
import { count, countryName, day, duration, eventName, money, moneyList, MEDIUM_NAMES, seconds, sourceName, when } from '@utils/remvoFormat';
import styles from '@styles/pages/admin/remvo.module.css';

/* ──────────────────────────────────────────────────────────────────
 * RemvoSellerPage (analytics1) | /remvo/sellers/:id
 *
 * One seller: where they came from, what they have listed and paid,
 * and everything they did, newest first: pages, steps, listings (and
 * why any failed), credits, checkouts and chats.
 * ────────────────────────────────────────────────────────────────── */

const LEDGER = { topup: 'Bought credits', refund: 'Refund', expiry: 'Credits expired', grant: 'Credits given', welcome: 'Welcome credits', bonus: 'Bonus credits', adjustment: 'Adjustment' };

function line(x) {
  switch (x.type) {
    case 'hit':
      return x.kind === 'view'
        ? { dot: '', text: <>Opened <span className={styles.mono}>{x.path}</span>{x.durationMs ? <span className={styles.small}>{duration(x.durationMs)}</span> : null}</> }
        : { dot: '', text: <>{eventName(x.name)}{x.props?.field ? `: ${x.props.field}` : ''}<span className={styles.small}>{x.path}</span></> };
    case 'job':
      return x.status === 'failed'
        ? { dot: 'dot-fail', text: <>Listing {x.ref} failed<span className={styles.small}>{x.failure ?? 'no reason'} · {x.input} · {x.marketplace}</span></> }
        : { dot: 'dot-job', text: <>Listing {x.ref} {x.status}<span className={styles.small}>{x.input} · {x.marketplace}{x.seconds != null ? ` · ${seconds(x.seconds)}` : ''}{x.batch ? ' · bulk' : ''}{x.world ? ' · several sites' : ''}{x.deleted ? ' · deleted by seller' : ''}</span></> };
    case 'ledger':
      return { dot: 'dot-money', text: <>{LEDGER[x.kind] ?? x.kind}: {x.credits > 0 ? '+' : ''}{count(x.credits)} credits{x.cents ? <span className={styles.small}>{money(Math.abs(x.cents), x.currency)}</span> : null}</> };
    case 'checkout':
      return { dot: 'dot-money', text: <>Checkout for {count(x.credits)} credits<span className={styles.small}>{money(x.cents, x.currency)} · {x.paid ? 'paid' : 'not paid'}</span></> };
    case 'chat':
      return { dot: 'dot-chat', text: <>Chat {x.ref}<span className={styles.small}>{x.page ?? ''}{x.tags?.length ? ` · ${x.tags.join(', ')}` : ''}</span></> };
    default:
      return { dot: '', text: x.type };
  }
}

export function RemvoSellerPage() {
  const { id } = useParams();
  const report = useRemvoReport(`sellers/${encodeURIComponent(id)}`);
  const s = report.data?.seller;

  return (
    <div className={styles.wrap}>
      <Link className={styles.back} to={adminPath('/remvo/sellers')}>← All sellers</Link>
      <Report report={report}>
        {s && (
          <>
            <header className={styles.header}>
              <h2 className={styles.title}>{s.name || s.email}</h2>
              <p className={styles.sub}>{s.name ? `${s.email} · ` : ''}joined {day(s.createdAt)}{s.closedAt ? `, closed ${day(s.closedAt)}` : ''}{s.team ? ' · team account' : ''}</p>
            </header>

            <Panel title="At a glance">
              <dl className={styles.facts}>
                <div><dt>Came from</dt><dd>{s.source ? `${sourceName(s.source)} (${MEDIUM_NAMES[s.medium] ?? s.medium})` : 'Not traced yet'}</dd></div>
                <div><dt>Post or landing page</dt><dd>{[s.campaign, s.landing].filter(Boolean).join(' · ') || '-'}</dd></div>
                <div><dt>Country</dt><dd>{s.country ? countryName(s.country) : '-'}</dd></div>
                <div><dt>eBay site</dt><dd>{s.marketplace ?? '-'}{s.sellerType ? `, ${s.sellerType}` : ''}</dd></div>
                <div><dt>Listings</dt><dd>{count(s.listings)}{s.failed ? `, ${count(s.failed)} failed` : ''}</dd></div>
                <div><dt>Last listing</dt><dd>{when(s.lastListingAt)}</dd></div>
                <div><dt>Spent</dt><dd>{moneyList(s.spent)}{s.topups ? `, ${count(s.topups)} top-ups` : ''}</dd></div>
                <div><dt>Credits left</dt><dd>{count(s.balance)}</dd></div>
                <div><dt>Last seen</dt><dd>{when(s.lastSeenAt)}</dd></div>
              </dl>
            </Panel>

            <Panel title="Everything they did" note="Newest first. Listings older than 90 days are deleted, so they drop off here.">
              {s.timeline.length ? (
                <ol className={styles.timeline}>
                  {s.timeline.map((x, i) => {
                    const l = line(x);
                    return (
                      <li key={`${x.type}-${x.at}-${i}`} className={styles.event}>
                        <span className={styles.eventWhen}>{when(x.at)}</span>
                        <span className={`${styles.eventDot} ${l.dot ? styles[l.dot] : ''}`} aria-hidden="true" />
                        <span className={styles.eventText}>{l.text}</span>
                      </li>
                    );
                  })}
                </ol>
              ) : <p className={`${styles.panelBody} ${styles.muted}`}>Nothing recorded yet.</p>}
            </Panel>
          </>
        )}
      </Report>
    </div>
  );
}
