/**
 * Generate a Remvo transaction reference.
 *
 * Format: RMV-YYYY-NNNN-XXXX
 *   - YYYY: current year
 *   - NNNN: zero-padded sequence number (random in mock, server counter in production)
 *   - XXXX: random uppercase hex (4 chars) for collision resistance
 *
 * Example: RMV-2026-0031-7A4F
 *
 * In production this lives server-side with a real sequence counter
 * scoped per platform per day. The mock version is for visual realism
 * on the checkout screens during Phase 1-7 development.
 *
 * @returns {string}
 */
export function generateReference() {
  const year = new Date().getFullYear();

  const sequence = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');

  const hex = Math.floor(Math.random() * 0xffff)
    .toString(16)
    .toUpperCase()
    .padStart(4, '0');

  return `RMV-${year}-${sequence}-${hex}`;
}
