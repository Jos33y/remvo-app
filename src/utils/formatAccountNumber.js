/**
 * Format a Nigerian NUBAN account number for visual scanning.
 *
 * Returns the digits grouped 3-4-3, e.g. "712 3456 789".
 * Falls back to the raw string if the input is not exactly 10 digits
 * (so unusual or future formats render unchanged rather than being
 * sliced incorrectly).
 *
 * IMPORTANT: this function is for DISPLAY only. The clipboard
 * payload must always be the raw digit string so the user pastes
 * a parseable value into their bank app.
 *
 * @param {string|number} input
 * @returns {string} e.g. "712 3456 789"
 */
export function formatAccountNumber(input) {
  if (input == null) return '';
  const digits = String(input).replace(/\D/g, '');
  if (digits.length !== 10) return digits;
  return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`;
}

/**
 * Strip a formatted account number back to raw digits, for clipboard
 * payloads or any place that needs the canonical machine value.
 *
 * @param {string} input
 * @returns {string}
 */
export function rawAccountNumber(input) {
  if (input == null) return '';
  return String(input).replace(/\D/g, '');
}
