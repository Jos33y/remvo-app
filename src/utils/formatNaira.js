/**
 * Format a Naira amount as a whole-number string with comma separators.
 *
 * Always returns an integer representation. No kobo, ever. Per
 * remvo_rate_engine_spec.md section 05: kobo on user transfer amounts
 * is a structuring flag for Nigerian transaction monitoring on repeat
 * transfers to the same settlement account.
 *
 * Truncates rather than rounds because the rate engine has already
 * applied ceil() upstream. By the time a number reaches this function
 * it is expected to be an integer; the truncation here is defensive.
 *
 * @param {number} amount - Naira amount as a (whole) number
 * @param {object} [options]
 * @param {boolean} [options.symbol=true] - Include the ₦ symbol
 * @returns {string} e.g. "₦38,068" or "38,068"
 */
export function formatNaira(amount, { symbol = true } = {}) {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    return symbol ? '₦0' : '0';
  }

  const integer = Math.trunc(amount);
  const formatted = integer.toLocaleString('en-NG', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });

  return symbol ? `₦${formatted}` : formatted;
}
