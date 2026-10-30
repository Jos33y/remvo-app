/* ──────────────────────────────────────────────────────────────────
 * utils/remvoFormat.js (analytics1)
 *
 * Numbers for admin.remvo.app/remvo, said the same way on every page.
 * ────────────────────────────────────────────────────────────────── */

export const count = (n) => (n ?? 0).toLocaleString('en-GB');

const LOCALE = { USD: 'en-US', GBP: 'en-GB', EUR: 'en-IE', CAD: 'en-CA' };

export function money(cents, currency) {
  return new Intl.NumberFormat(LOCALE[currency] ?? 'en-GB', { style: 'currency', currency, minimumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100);
}

/** [{ currency, cents }] as "£40 · $12.50", or "None yet". */
export function moneyList(list) {
  if (!list || !list.length) return 'None yet';
  return list.filter((x) => x.cents).map((x) => money(x.cents, x.currency)).join(' · ') || 'None yet';
}

export function usd(n, digits = 2) {
  if (n == null) return '-';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
}

/** a of b as a percentage, or null when b is 0. */
export function rate(a, b) {
  return b > 0 ? (a / b) * 100 : null;
}

export function pct(v, digits = 1) {
  return v == null ? '-' : `${v.toFixed(v >= 10 || v === 0 ? 0 : digits)}%`;
}

export function seconds(s) {
  if (s == null) return '-';
  if (s < 60) return `${Math.round(s)} s`;
  const m = Math.floor(s / 60);
  return `${m} min ${Math.round(s - m * 60)} s`;
}

export function duration(ms) {
  return ms == null ? '-' : seconds(ms / 1000);
}

export function when(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function day(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* Delta against the previous window: { text, sign } for the badge. */
export function delta(now, before) {
  if (!before) return now ? { text: 'new', sign: 'new' } : null;
  const d = ((now - before) / before) * 100;
  if (Math.abs(d) < 0.5) return { text: '0%', sign: 'flat' };
  return { text: `${d > 0 ? '+' : ''}${Math.round(d)}%`, sign: d > 0 ? 'up' : 'down' };
}

const SOURCE_NAMES = {
  direct: 'Direct', google: 'Google', bing: 'Bing', duckduckgo: 'DuckDuckGo', yahoo: 'Yahoo', ecosia: 'Ecosia', yandex: 'Yandex', baidu: 'Baidu', brave: 'Brave Search',
  chatgpt: 'ChatGPT', perplexity: 'Perplexity', gemini: 'Gemini', copilot: 'Copilot', claude: 'Claude',
  tiktok: 'TikTok', instagram: 'Instagram', threads: 'Threads', facebook: 'Facebook', youtube: 'YouTube', x: 'X', linkedin: 'LinkedIn',
  reddit: 'Reddit', pinterest: 'Pinterest', telegram: 'Telegram', whatsapp: 'WhatsApp', email: 'Email', ebay: 'eBay',
};

export const sourceName = (s) => SOURCE_NAMES[s] ?? s;

export const MEDIUM_NAMES = {
  direct: 'Direct', search: 'Search', ai: 'AI assistant', social: 'Social', video: 'Video', email: 'Email', referral: 'Link', campaign: 'Tagged link', internal: 'Internal',
};

const EVENT_NAMES = {
  to_app: 'Clicked into the app', calc: 'Used the fee calculator', chat_open: 'Opened the chat', video_play: 'Played a help video',
  copy_field: 'Copied a field', copy_all: 'Copied everything', download_csv: 'Downloaded the CSV', download_drafts: 'Downloaded eBay drafts',
};

export const eventName = (n) => EVENT_NAMES[n] ?? n.replace(/_/g, ' ');

const COUNTRY = typeof Intl !== 'undefined' && Intl.DisplayNames ? new Intl.DisplayNames(['en-GB'], { type: 'region' }) : null;
export const countryName = (c) => (c ? (COUNTRY?.of(c) ?? c) : 'Unknown');
