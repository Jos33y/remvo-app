import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useSession } from '@context/SessionContext';
import { useReducedMotion } from '@hooks/useReducedMotion';
import { CheckoutShell } from '@components/layout/checkout/CheckoutShell';
import { GoldRing } from '@components/ui/shared/GoldRing';
import { IconClock } from '@components/ui/icons/IconClock';
import { IconCheck } from '@components/ui/icons/IconCheck';
import { CountryFlag } from '@components/ui/icons/CountryFlag';
import { staggerParent, reveal } from '@utils/motion';
import edgeStyles from '@styles/pages/checkout/edge-page.module.css';
import styles from '@styles/pages/checkout/country-coming-soon-page.module.css';

/* ──────────────────────────────────────────────────────────────────
 * CountryComingSoonPage — Phase 6 (checkout) + Phase 7A (real POST)
 *
 * Phase 7A change:
 *   - The mock 900ms setTimeout is replaced with a real POST to
 *     ${VITE_REMVO_API_BASE}/v1/country-interest
 *   - 429 responses render as "Too many requests. Try again in a
 *     minute."
 *   - Any other non-2xx renders "Could not save your email. Try again."
 *   - Network failures render the same generic message
 *   - Inline error text appears above the submit button, 13px,
 *     register-appropriate (rgba warm-white red), fades to null
 *     after 5s OR as soon as the user edits the email field
 *
 * Later change: the POST body is now { session_id, email }.
 *   platform_id and country_code used to be sent from here and taken
 *   at face value by the API, which had no auth on that endpoint.
 *   Anyone could attribute signups to any platform and queue
 *   arbitrary addresses to be emailed on activation. The server now
 *   derives both from the session row, so the session id is the
 *   credential and nothing in the body is trusted but the email.
 *
 * Session shape expected:
 *   status: 'country_not_active'
 *   reason: 'coming_soon' | 'paused'
 *   country: string              (display name)
 *   country_code: string         (ISO-3166-1 alpha-2, display only)
 *   notify_enabled: boolean
 *   platform_name: string
 *   callback_url: string
 * ────────────────────────────────────────────────────────────────── */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ERROR_DISMISS_MS = 5000;

const API_BASE = import.meta.env.VITE_REMVO_API_BASE || '';

const COPY = {
  coming_soon: {
    headline: (country) => `Remvo is expanding to ${country} soon`,
    subheadWithNotify: (country) =>
      `Deposits are not available in ${country} yet. Leave your email and we will let you know the moment we launch.`,
    subheadNoNotify: (country, platform) =>
      `Deposits are not available in ${country} yet. Return to ${platform} to continue, and check back soon.`,
    submitLabel: 'Notify me',
    successLead: (country) =>
      `We will email you the moment Remvo launches in ${country}.`,
  },
  paused: {
    headline: (country) => `Remvo is temporarily unavailable in ${country}`,
    subheadWithNotify: (country) =>
      `Deposits from ${country} are paused right now. Leave your email and we will let you know the moment they resume.`,
    subheadNoNotify: (country, platform) =>
      `Deposits from ${country} are paused right now. Try again shortly, or return to ${platform} to continue.`,
    submitLabel: 'Notify me when available',
    successLead: (country) =>
      `We will email you the moment deposits resume in ${country}.`,
  },
};

export function CountryComingSoonPage() {
  const { session } = useSession();
  const reduced = useReducedMotion();

  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [error, setError] = useState(null);

  // Auto-dismiss the error after 5 seconds. Cleanup cancels the
  // timer if the user edits the field or submits again before it
  // fires, so the message doesn't ghost on screen during a retry.
  useEffect(() => {
    if (!error) return undefined;
    const timer = setTimeout(() => setError(null), ERROR_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [error]);

  if (!session) return null;

  const reason = session.reason === 'paused' ? 'paused' : 'coming_soon';
  const country = session.country ?? 'your region';
  const countryCode = session.country_code ?? null;
  const platformName = session.platform_name ?? 'the platform';

  // The session id is the credential for the signup POST. Prefer it
  // off the session object; fall back to the checkout URL, which is
  // always /cs_<id> on this route. The fallback can be dropped once
  // SessionContext is confirmed to expose it in every provider.
  const sessionId =
    session.session_id ??
    session.id ??
    window.location.pathname.match(/cs_[A-Za-z0-9_-]+/)?.[0] ??
    null;
  const notifyEnabled = Boolean(session.notify_enabled);
  const copy = COPY[reason];

  const initial = reduced ? false : 'hidden';
  const isSubmitting = status === 'submitting';
  const isSuccess = status === 'success';
  const emailValid = EMAIL_RE.test(email);
  const submitDisabled = !emailValid || isSubmitting;

  const handleReturn = () => {
    if (session.callback_url) window.location.href = session.callback_url;
  };

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
    // Clear any stale error as soon as the user edits | the error is
    // about the last submit, not the next one.
    if (error) setError(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitDisabled) return;
    if (!sessionId) {
      setError('We could not identify this checkout. Try refreshing.');
      return;
    }

    setStatus('submitting');
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/v1/country-interest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, email }),
      });

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error('Too many requests. Try again in a minute.');
        }
        throw new Error('Could not save your email. Try again.');
      }

      setSubmittedEmail(email);
      setStatus('success');
    } catch (err) {
      setError(err.message || 'Could not save your email. Try again.');
      setStatus('idle');
    }
  };

  const subhead = notifyEnabled
    ? copy.subheadWithNotify(country)
    : copy.subheadNoNotify(country, platformName);

  return (
    <CheckoutShell canvas="obsidian" platformName={session.platform_name}>
      <motion.div
        className={edgeStyles.content}
        variants={staggerParent}
        initial={initial}
        animate="visible"
      >
        <motion.div
          className={`${edgeStyles.iconWrap} ${edgeStyles.warning}`}
          variants={reveal}
        >
          <span className={edgeStyles.iconGlyph}>
            <IconClock size={28} />
          </span>
        </motion.div>

        <motion.div className={styles.countryChip} variants={reveal}>
          <span className={styles.countryFlag}>
            <CountryFlag code={countryCode} title={country} size={18} />
          </span>
          <span className={styles.countryName}>{country}</span>
        </motion.div>

        <motion.div className={edgeStyles.textBlock} variants={reveal}>
          <h1 className={edgeStyles.headline}>{copy.headline(country)}</h1>
          <p className={edgeStyles.subhead}>{subhead}</p>
        </motion.div>

        {notifyEnabled && !isSuccess && (
          <motion.form
            className={styles.notifyForm}
            variants={reveal}
            onSubmit={handleSubmit}
            noValidate
          >
            <label htmlFor="notify-email" className={styles.fieldLabel}>
              Email address
            </label>
            <input
              id="notify-email"
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              spellCheck={false}
              autoCapitalize="off"
              placeholder="you@example.com"
              value={email}
              onChange={handleEmailChange}
              disabled={isSubmitting}
              className={styles.emailInput}
              aria-invalid={email.length > 0 && !emailValid}
              aria-describedby="notify-email-hint"
            />

            {error && (
              <p
                className={styles.errorMessage}
                role="alert"
                aria-live="polite"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              className={styles.submitButton}
              disabled={submitDisabled}
              aria-busy={isSubmitting}
            >
              <span className={styles.submitLabel}>
                {isSubmitting ? 'Sending' : copy.submitLabel}
              </span>
            </button>
            <span id="notify-email-hint" className={styles.srOnly}>
              We will only use your email to notify you when Remvo is
              available in {country}.
            </span>
          </motion.form>
        )}

        {notifyEnabled && isSuccess && (
          <motion.div
            className={styles.successBlock}
            variants={reveal}
            role="status"
            aria-live="polite"
          >
            <span className={styles.successIcon}>
              <IconCheck size={16} />
            </span>
            <div className={styles.successText}>
              <p className={styles.successLead}>{copy.successLead(country)}</p>
              <p className={styles.successEmail}>{submittedEmail}</p>
            </div>
          </motion.div>
        )}

        <motion.div className={edgeStyles.ctaBlock} variants={reveal}>
          {!notifyEnabled ? (
            <button
              type="button"
              className={edgeStyles.cta}
              onClick={handleReturn}
            >
              <GoldRing shape="rect" radius={14} />
              <span className={edgeStyles.ctaLabel}>
                Return to {platformName}
              </span>
            </button>
          ) : (
            <button
              type="button"
              className={edgeStyles.secondaryLink}
              onClick={handleReturn}
            >
              Return to {platformName}
            </button>
          )}
        </motion.div>
      </motion.div>
    </CheckoutShell>
  );
}
