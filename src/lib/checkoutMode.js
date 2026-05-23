/* ──────────────────────────────────────────────────────────────────
 * src/lib/checkoutMode.js
 *
 * PHASE_7F_S5_CHECKOUT_API
 *
 * Single source of truth for whether the checkout tree (pay.remvo.app)
 * runs against the real backend or the in-browser MockSessionProvider.
 *
 * Resolution order:
 *   1. VITE_REMVO_CHECKOUT_MODE | dedicated var. Lets checkout and
 *      admin be flipped independently in a shared dev .env (a
 *      designer can pin checkout to mock while admin runs live).
 *   2. VITE_REMVO_AUTH_MODE     | fallback. Going live needs NO new
 *      var | the existing .env already carries AUTH_MODE=api.
 *   3. 'local'                  | default. Keeps the ?checkout mock
 *      escape working with zero backend.
 *
 * Production pay.remvo.app sets VITE_REMVO_CHECKOUT_MODE=api
 * explicitly | self-documenting, independent of the admin deploy.
 *
 * Mirrors the AUTH_MODE pattern in MockAdminProvider.jsx. Pure
 * constant module | no React, importable anywhere (router, provider,
 * dev affordances).
 * ────────────────────────────────────────────────────────────────── */

export const CHECKOUT_MODE =
  import.meta.env.VITE_REMVO_CHECKOUT_MODE ||
  import.meta.env.VITE_REMVO_AUTH_MODE ||
  'local';

/**
 * True when the checkout tree should resolve sessions from the real
 * backend (ApiSessionProvider). False keeps the MockSessionProvider
 * dev escape.
 *
 * @type {boolean}
 */
export const IS_CHECKOUT_API = CHECKOUT_MODE === 'api';
