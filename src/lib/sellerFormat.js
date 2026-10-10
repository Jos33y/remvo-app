/* Formatting for the seller app. British English, pounds, dates the
 * way people say them. One place, so every screen reads alike. */

const gbp = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });

export const pounds = (n) => gbp.format(n);
export const penceAsPounds = (p) => gbp.format(p / 100);
export const credits = (n) => `${n} ${Math.abs(n) === 1 ? 'credit' : 'credits'}`;
export const signed = (n) => (n > 0 ? `+${n}` : `${n}`).replace('-', '−');

export const longDate = (iso) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

/** "Today, 14:05", "Yesterday", "Tue", "3 Oct". How a list of recent things reads. */
export function when(iso, now = Date.now()) {
  const d = new Date(iso);
  const start = new Date(now); start.setHours(0, 0, 0, 0);
  const diff = (start.getTime() - new Date(d).setHours(0, 0, 0, 0)) / 86_400_000;
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  if (diff <= 0) return `Today, ${time}`;
  if (diff === 1) return `Yesterday, ${time}`;
  if (diff < 7) return d.toLocaleDateString('en-GB', { weekday: 'long' });
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', ...(d.getFullYear() !== new Date(now).getFullYear() ? { year: 'numeric' } : {}) });
}

/** "5012 3456 7890 0", grouped the way it is printed on a box. */
export const barcode = (v) => String(v).replace(/(\d{4})(?=\d)/g, '$1 ');

export const inputLabel = (input) => (input.kind === 'barcode' ? barcode(input.value) : input.value.replace(/^https:\/\/www\./, ''));
