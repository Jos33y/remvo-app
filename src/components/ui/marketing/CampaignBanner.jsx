import { useEffect, useState } from 'react';
import { APP_URL } from '@utils/constants';
import styles from '@styles/ui/marketing/campaign-banner.module.css';

/* ──────────────────────────────────────────────────────────────────
 * CampaignBanner
 *
 * One line above the site header for a dated campaign. It scrolls
 * away with the page (the header below stays sticky), counts down in
 * days, and goes on its own when the campaign ends. A visitor can
 * hide it; that is remembered in this browser only, and a browser
 * that keeps nothing simply shows it again.
 *
 * The next campaign is a new entry in CAMPAIGN: an id (so a new one
 * shows even to those who hid the last), the day it is about, the day
 * it stops showing, the words, and where it goes.
 * ────────────────────────────────────────────────────────────────── */

const DEV = import.meta.env.DEV ? '?my' : '';

export const CAMPAIGN = {
  id: 'black-friday-2026',
  // Black Friday 2026. Shown up to and including the day, UK time.
  day: Date.UTC(2026, 10, 27),
  lastDay: Date.UTC(2026, 10, 27),
  name: 'Black Friday',
  line: 'Your buyers have already started.',
  action: 'List your stock now',
  actionShort: 'List now',
  href: `${APP_URL}/listings/bulk${DEV}`,
};

const DAY = 86_400_000;

/* When this build was made (vite.config.js). The pre-rendered page and
 * the browser's first render both count days from it, so they match;
 * the browser then counts from now. */
/* global __REMVO_BUILT_AT__ */
const BUILT_AT = typeof __REMVO_BUILT_AT__ === 'number' ? __REMVO_BUILT_AT__ : Date.now();
const storeKey = (id) => `remvo.banner.${id}`;

/** Whole days from today (London) to the campaign day. */
export function daysTo(day, now = Date.now()) {
  const london = new Date(new Date(now).toLocaleString('en-US', { timeZone: 'Europe/London' }));
  const today = Date.UTC(london.getFullYear(), london.getMonth(), london.getDate());
  return Math.round((day - today) / DAY);
}

/** The headline for a number of days out, and its phone length. */
export function when(name, days) {
  if (days <= 0) return `${name} is today.`;
  if (days === 1) return `${name} is tomorrow.`;
  return `${name} is in ${days} days.`;
}
export function whenShort(name, days) {
  if (days <= 0) return `${name} is today`;
  if (days === 1) return `${name} is tomorrow`;
  return `${days} days to ${name}`;
}

export function CampaignBanner({ campaign = CAMPAIGN }) {
  // Shown in the pre-rendered page, so it takes its space before any
  // script runs and nothing below it jumps. A visitor who hid it sees
  // it go once the page has loaded.
  const [hidden, setHidden] = useState(false);
  const [now, setNow] = useState(BUILT_AT);
  const days = daysTo(campaign.day, now);
  const over = daysTo(campaign.lastDay, now) < 0;

  useEffect(() => {
    setNow(Date.now());
    let dismissed = false;
    try { dismissed = window.localStorage.getItem(storeKey(campaign.id)) === '1'; } catch { /* storage blocked */ }
    setHidden(dismissed);
  }, [campaign.id]);

  if (over || hidden) return null;

  function hide() {
    setHidden(true);
    try { window.localStorage.setItem(storeKey(campaign.id), '1'); } catch { /* storage blocked */ }
  }

  return (
    <aside className={styles.banner} aria-label={`${campaign.name} notice`}>
      <div className={styles.inner}>
        <p className={styles.text}>
          <span className={styles.dot} aria-hidden="true" />
          <strong className={`${styles.when} ${styles.wide}`}>{when(campaign.name, days)}</strong>
          <strong className={`${styles.when} ${styles.narrow}`}>{whenShort(campaign.name, days)}</strong>
          <span className={`${styles.line} ${styles.wide}`}> {campaign.line}</span>
        </p>
        <a className={styles.action} href={campaign.href}>
          <span className={styles.wide}>{campaign.action}</span>
          <span className={styles.narrow}>{campaign.actionShort}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </a>
        <button type="button" className={styles.close} onClick={hide} aria-label={`Hide the ${campaign.name} notice`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
