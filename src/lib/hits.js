/* ──────────────────────────────────────────────────────────────────
 * lib/hits.js (analytics1)
 *
 * Remvo's own analytics, for remvo.app and my.remvo.app. No cookies,
 * nothing kept on the device: everything here lives in memory for the
 * life of the tab.
 *
 *   startHits('site' | 'app', router)  once, in the app's root
 *   hit('copy_field', { field: 'Title' }) an app or site step
 *
 * What is sent: the page's path (never its query string), where this
 * tab's visit came from (?ref=, utm_ tags, the referring site), the
 * time spent on each page, and named steps. The server adds a daily
 * visitor hash, the country and the device; it never stores the IP.
 *
 * From the site into the app: links to my.remvo.app carry where the
 * visit came from (src, rh) and the page it began on (lp), so a
 * sign-up is credited to the TikTok post or the guide that brought it.
 *
 * Nothing is sent when the browser asks not to be tracked (Global
 * Privacy Control or Do Not Track), from automated browsers, or in
 * development unless VITE_HITS=1.
 * ────────────────────────────────────────────────────────────────── */

const ROOT = (import.meta.env.VITE_API_URL
  ?? (import.meta.env.DEV ? 'http://localhost:8080' : 'https://api.remvo.app')).replace(/\/+$/, '');

const APP_HOST = /(^|\.)my\.remvo\.app$/;
const MAX_QUEUE = 20;

let state = null;

function token(prefix) {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return `${prefix}_${Array.from(bytes, (b) => 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_'[b & 63]).join('')}`;
}

function allowed() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  if (import.meta.env.DEV && import.meta.env.VITE_HITS !== '1') return false;
  if (navigator.webdriver) return false;
  if (navigator.globalPrivacyControl === true || navigator.doNotTrack === '1' || window.doNotTrack === '1') return false;
  return true;
}

const short = (v, n) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, n) : null);

/* Where this tab's visit began. In the app, the site's link says. */
function startOf(app) {
  const q = new URLSearchParams(window.location.search);
  const start = {
    ref: short(q.get(app === 'app' ? 'src' : 'ref'), 80) ?? (app === 'app' ? short(q.get('ref'), 80) : null),
    utmSource: short(q.get('utm_source'), 60),
    utmMedium: short(q.get('utm_medium'), 30),
    utmCampaign: short(q.get('utm_campaign'), 80),
    utmContent: short(q.get('utm_content'), 80),
    referrer: short(document.referrer, 300),
    landing: window.location.pathname.slice(0, 300),
  };
  if (app === 'app') {
    const rh = short(q.get('rh'), 120);
    const lp = short(q.get('lp'), 300);
    if (rh && /^[a-z0-9.-]+$/i.test(rh)) start.referrer = `https://${rh}/`;
    if (lp && lp.startsWith('/')) start.landing = lp;
  }
  // The app's own support reference uses ?ref= too (C-XXXX); never a source.
  if (start.ref && /^C-[A-Z0-9]+$/.test(start.ref)) start.ref = null;
  for (const k of Object.keys(start)) if (start[k] == null) delete start[k];
  return start;
}

function send(useBeacon) {
  if (!state || !state.queue.length) return;
  const hits = state.queue.splice(0, MAX_QUEUE);
  // The tab's start goes with every send: a beacon may arrive before the first fetch.
  const body = JSON.stringify({ app: state.app, tab: state.tab, start: state.start, hits });
  const url = state.app === 'app' ? `${ROOT}/v1/my/hits` : `${ROOT}/v1/hits`;
  try {
    if (useBeacon && navigator.sendBeacon && navigator.sendBeacon(url, new Blob([body], { type: 'text/plain' }))) {
      if (state.queue.length) send(useBeacon);
      return;
    }
    fetch(url, { method: 'POST', body, headers: { 'content-type': 'text/plain' }, credentials: 'include', keepalive: true, mode: 'cors' }).catch(() => {});
  } catch { /* analytics never breaks a page */ }
  if (state.queue.length) send(useBeacon);
}

function schedule() {
  if (!state || state.timer) return;
  state.timer = setTimeout(() => { state.timer = null; send(false); }, 1500);
}

/* Time on the current page, counting only while the tab is visible. */
function visibleMs() {
  const v = state.view;
  if (!v) return 0;
  return Math.round(v.visibleMs + (v.shownAt != null ? performance.now() - v.shownAt : 0));
}

function leave() {
  const v = state.view;
  if (!v) return;
  const ms = visibleMs();
  if (ms > 0) state.queue.push({ kind: 'leave', key: v.key, ms });
  state.view = null;
}

function view(path) {
  if (!state) return;
  const p = (path || '/').slice(0, 300);
  if (state.view?.path === p) return;
  leave();
  const key = token('v');
  state.view = { key, path: p, visibleMs: 0, shownAt: document.visibilityState === 'visible' ? performance.now() : null };
  state.queue.push({ kind: 'view', path: p, key });
  schedule();
}

/** A named step: copy_field, to_app, calc, chat_open, video_play... */
export function hit(name, props) {
  if (!state || !/^[a-z][a-z0-9_]{1,39}$/.test(name)) return;
  const clean = {};
  if (props) {
    for (const [k, v] of Object.entries(props).slice(0, 8)) {
      if (!/^[a-z][a-zA-Z0-9_]{0,23}$/.test(k)) continue;
      if (typeof v === 'string') clean[k] = v.slice(0, 80);
      else if (typeof v === 'number' && Number.isFinite(v)) clean[k] = v;
      else if (typeof v === 'boolean') clean[k] = v;
    }
  }
  state.queue.push({ kind: 'event', name, path: (state.view?.path || window.location.pathname).slice(0, 300), ...(Object.keys(clean).length ? { props: clean } : {}) });
  schedule();
}

/* Site only: links into the app carry this visit's source and landing page. */
function decorate(e) {
  const a = e.target instanceof Element ? e.target.closest('a[href]') : null;
  if (!a) return;
  let url;
  try { url = new URL(a.href, window.location.href); } catch { return; }
  if (!APP_HOST.test(url.hostname) && !(import.meta.env.DEV && url.searchParams.has('my'))) return;
  const s = state.start;
  const src = s.ref ?? s.utmSource ?? null;
  if (src && !url.searchParams.has('src')) url.searchParams.set('src', s.utmCampaign && !s.ref ? `${src}.${s.utmCampaign}` : src);
  let rh = null;
  try { rh = s.referrer ? new URL(s.referrer).hostname.replace(/^www\./, '') : null; } catch { rh = null; }
  if (rh && !/(^|\.)remvo\.app$/.test(rh) && !url.searchParams.has('rh')) url.searchParams.set('rh', rh);
  if (s.landing && !url.searchParams.has('lp')) url.searchParams.set('lp', s.landing);
  a.href = url.toString();
  hit('to_app', { to: url.pathname.slice(0, 80) });
  send(true);
}

/**
 * @param {'site'|'app'} app
 * @param {{ state: { location: { pathname: string } }, subscribe: Function }} router  a react-router data router
 * @returns {() => void} a no-op: it runs for the life of the page
 */
export function startHits(app, router) {
  if (state || !allowed()) return () => {};
  state = { app, tab: token('t'), start: startOf(app), queue: [], view: null, timer: null };

  view(router?.state?.location?.pathname ?? window.location.pathname);
  const unsubscribe = router?.subscribe?.((s) => view(s.location.pathname)) ?? (() => {});

  const onVisibility = () => {
    const v = state.view;
    if (document.visibilityState === 'hidden') {
      if (v && v.shownAt != null) { v.visibleMs += performance.now() - v.shownAt; v.shownAt = null; }
      // A phone may never come back to this tab: send the time so far.
      if (v) state.queue.push({ kind: 'leave', key: v.key, ms: Math.round(v.visibleMs) });
      send(true);
    } else if (v && v.shownAt == null) {
      v.shownAt = performance.now();
    }
  };
  const onHide = () => { leave(); send(true); };
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', onHide);
  if (app === 'site') {
    document.addEventListener('click', decorate, true);
    document.addEventListener('auxclick', decorate, true);
  }

  // Analytics lives as long as the page. React's development double
  // mount calls the cleanup and starts again; keeping the listeners
  // makes that harmless.
  void unsubscribe;
  return () => {};
}
