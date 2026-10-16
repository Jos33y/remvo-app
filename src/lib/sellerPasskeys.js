/* ──────────────────────────────────────────────────────────────────
 * lib/sellerPasskeys.js
 *
 * Passkeys for sellers, through @simplewebauthn/browser:
 *
 *   passkeysSupported()      this browser can make and use passkeys
 *   autofillSupported()      it can also offer them in the email field's
 *                            own suggestions (no button needed)
 *   signInWithPasskey(opts)  { account } on success, null if the seller
 *                            closed the prompt
 *   addPasskey()             the saved passkey, or null if closed
 *
 * A closed prompt is not an error: the seller changed their mind.
 * ────────────────────────────────────────────────────────────────── */

import {
  browserSupportsWebAuthn,
  browserSupportsWebAuthnAutofill,
  startAuthentication,
  startRegistration,
  WebAuthnAbortService,
} from '@simplewebauthn/browser';
import { sellerApi, SellerApiError } from '@lib/sellerApi';

export const passkeysSupported = () => {
  try { return browserSupportsWebAuthn(); } catch { return false; }
};

export async function autofillSupported() {
  try { return passkeysSupported() && (await browserSupportsWebAuthnAutofill()); } catch { return false; }
}

const cancelled = (err) => err?.name === 'NotAllowedError' || err?.name === 'AbortError' || err?.code === 'ERROR_CEREMONY_ABORTED';

/** Stop a waiting autofill prompt (before a button starts its own). */
export const stopPasskeyPrompt = () => { try { WebAuthnAbortService.cancelCeremony(); } catch { /* none running */ } };

/**
 * @param {{ autofill?: boolean }} [opts]
 * @returns {Promise<{ account: object }|null>}
 */
export async function signInWithPasskey({ autofill = false } = {}) {
  const { challengeId, options } = await sellerApi.passkeySignInStart();
  let credential;
  try {
    credential = await startAuthentication({ optionsJSON: options, useBrowserAutofill: autofill });
  } catch (err) {
    if (cancelled(err)) return null;
    throw new SellerApiError(0, 'passkey', 'That passkey did not work. Try again, or sign in with your password.');
  }
  return sellerApi.passkeySignInFinish(challengeId, credential);
}

/** @returns {Promise<object|null>} the passkey as listed in Profile */
export async function addPasskey() {
  const { challengeId, options } = await sellerApi.passkeyAddStart();
  let credential;
  try {
    credential = await startRegistration({ optionsJSON: options });
  } catch (err) {
    if (cancelled(err)) return null;
    if (err?.name === 'InvalidStateError') {
      throw new SellerApiError(0, 'passkey', 'This device already has a passkey for your account.');
    }
    throw new SellerApiError(0, 'passkey', 'The passkey was not added. Try again.');
  }
  const { passkey } = await sellerApi.passkeyAddFinish(challengeId, credential);
  return passkey;
}
