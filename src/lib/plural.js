/* ──────────────────────────────────────────────────────────────────
 * Counts in copy: "1 credit", "3 credits", "1,200 listings".
 *
 * Every count a seller reads goes through here, so none can ever read
 * "1 credits" (copy style guide 4). English plurals only: the site and
 * the app are in British English.
 * ────────────────────────────────────────────────────────────────── */

const figure = new Intl.NumberFormat('en-GB');

/** The word for n: plural(1, 'credit') is "credit", plural(2, 'credit') "credits". */
export const plural = (n, one, other = `${one}s`) => (Math.abs(n) === 1 ? one : other);

/** n and its word: count(1200, 'listing') is "1,200 listings". */
export const count = (n, one, other) => `${figure.format(n)} ${plural(n, one, other)}`;

/** A count on its own, grouped: num(100350) is "100,350". */
export const num = (n) => figure.format(n);
