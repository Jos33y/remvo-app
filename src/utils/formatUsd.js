/**
 * Format a USD amount with two decimal places and comma separators.
 *
 * @param {number} amount
 * @param {object} [options]
 * @param {boolean} [options.symbol=true] - Include the $ symbol
 * @param {boolean} [options.trimZeros=false] - Drop .00 for whole-dollar values
 * @returns {string} e.g. "$25.00", "$25", "$1,000.50"
 */
export function formatUsd(amount, { symbol = true, trimZeros = false } = {}) {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    return symbol ? '$0.00' : '0.00';
  }

  const isWhole = Number.isInteger(amount);
  const fractionDigits = trimZeros && isWhole ? 0 : 2;

  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });

  return symbol ? `$${formatted}` : formatted;
}
