import { useState, useCallback } from 'react';
import { useParams } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';

import { useSession } from '@context/SessionContext';
import { useCheckoutNavigate } from '@hooks/useCheckoutNavigate';
import { useReducedMotion } from '@hooks/useReducedMotion';

import { CheckoutShell } from '@components/layout/CheckoutShell';
import { GoldRing } from '@components/ui/GoldRing';
import { RemvoCard } from '@components/ui/RemvoCard';
import { DenominationGrid } from '@components/ui/DenominationGrid';
import { DevSimulateButton } from '@components/ui/DevSimulateButton';

import { formatNaira } from '@utils/formatNaira';
import { staggerParent, reveal, easeOut } from '@utils/motion';

import styles from '@styles/pages/select-page.module.css';

const DENOMINATIONS = [10, 25, 50, 100, 250, 500];
const DEFAULT_AMOUNT = 25;
const MIN_USD = 10;
const MAX_USD = 1000;

function estimateNaira(usd, session) {
  if (!usd || usd <= 0) return null;
  const rate = session?.effective_rate_full ?? session?.display_rate ?? 1500;
  return Math.ceil(usd * rate);
}

/* ──────────────────────────────────────────────────────────────────
 * SelectPage — Phase 5 (card-as-input on obsidian void)
 *
 * SPEC DEVIATION (intentional, documented April 12 2026):
 * The original PHASE_5_SCREEN_SPECS.md placed SelectPage on warm
 * canvas as "the approachable entry point." That framing was written
 * before the obsidian vocabulary was proven on Confirm/Pay/Complete.
 * Putting SelectPage on warm paper would break the four-beat visual
 * continuity of the flow — user starts warm, then the world goes
 * dark on commit. That reads as a register break, not a transition.
 *
 * SelectPage now lives on obsidian like the rest of the premium
 * flow. Card-as-input is the protagonist, the void is the stage.
 * The "approachable" register is carried by the card visual itself
 * being recognisable and the pill row being friendly to tap, not
 * by the canvas tone.
 *
 * Single source of truth: inputValue. Tapping a pill writes the
 * amount into inputValue. Typing into the input updates inputValue
 * directly. The pill row reflects which (if any) denomination
 * matches inputValue. The card amount is derived from inputValue.
 * The card stays mounted at all times — only the dollar text
 * inside re-renders via React reconciliation, no flash, no remount.
 * ────────────────────────────────────────────────────────────────── */

export function SelectPage() {
  const { token } = useParams();
  const checkoutNavigate = useCheckoutNavigate();
  const { session, mockSelectAmount } = useSession();
  const reduced = useReducedMotion();

  const [inputValue, setInputValue] = useState(String(DEFAULT_AMOUNT));

  const numericValue = inputValue ? parseInt(inputValue, 10) : 0;
  const isValid = numericValue >= MIN_USD && numericValue <= MAX_USD;
  const canContinue = isValid;

  const handleDenomSelect = useCallback((value) => {
    setInputValue(String(value));
  }, []);

  const handleInputChange = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setInputValue(raw);
  };

  const handleContinue = () => {
    if (!canContinue) return;
    mockSelectAmount(numericValue);
    checkoutNavigate(`/${token}`);
  };

  const handleCancel = () => {
    if (session?.callback_url) window.location.href = session.callback_url;
  };

  if (!session) return null;

  const initial = reduced ? false : 'hidden';
  const nairaEstimate = isValid ? estimateNaira(numericValue, session) : null;
  const ratePerDollar = session?.display_rate ?? 1500;

  const cardAmount = isValid ? numericValue : DEFAULT_AMOUNT;
  const selectedDenom = DENOMINATIONS.includes(numericValue) ? numericValue : null;

  const showError = inputValue && !isValid;
  const errorMsg = numericValue > 0 && numericValue < MIN_USD
    ? `Minimum is $${MIN_USD}.`
    : numericValue > MAX_USD
      ? `Maximum is $${MAX_USD.toLocaleString()}.`
      : null;

  return (
    <CheckoutShell wide canvas="obsidian" platformName={session.platform_name}>
      <motion.div
        className={styles.content}
        variants={staggerParent}
        initial={initial}
        animate="visible"
      >
        <motion.div className={styles.headerBlock} variants={reveal}>
          <h1 className={styles.heading}>Select a card</h1>
          <p className={styles.subhead}>
            Choose a denomination or enter a custom amount.
          </p>
        </motion.div>

        {/* Card stays mounted. React reconciliation updates the dollar
            text in place. No AnimatePresence wrapping the card. */}
        <motion.div className={styles.cardBlock} variants={reveal}>
          <RemvoCard
            amount={cardAmount}
            reference={session.reference}
            state="default"
          />

          <AnimatePresence mode="wait">
            {nairaEstimate && (
              <motion.div
                key={nairaEstimate}
                className={styles.amountBlock}
                initial={reduced ? false : { opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0 }}
                transition={{ duration: 0.25, ease: easeOut }}
              >
                <div className={styles.amountValue}>{formatNaira(nairaEstimate)}</div>
                <div className={styles.amountRate}>at {formatNaira(ratePerDollar)} per dollar</div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div variants={reveal}>
          <DenominationGrid
            denominations={DENOMINATIONS}
            selected={selectedDenom}
            onSelect={handleDenomSelect}
          />
        </motion.div>

        <motion.div className={styles.customBlock} variants={reveal}>
          <div className={styles.dividerRow}>
            <span className={styles.dividerLine} aria-hidden="true" />
            <span className={styles.dividerLabel}>or enter a custom amount</span>
            <span className={styles.dividerLine} aria-hidden="true" />
          </div>

          <div className={styles.inputWrap}>
            <span className={styles.inputPrefix} aria-hidden="true">$</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className={styles.input}
              placeholder="Enter amount"
              value={inputValue}
              onChange={handleInputChange}
              aria-label="Dollar amount"
              aria-describedby={showError ? 'select-input-error' : undefined}
              aria-invalid={showError ? 'true' : 'false'}
            />
          </div>

          {showError && errorMsg && (
            <p id="select-input-error" className={styles.inputHint} role="alert">
              {errorMsg}
            </p>
          )}
        </motion.div>

        <motion.div className={styles.ctaBlock} variants={reveal}>
          <button
            type="button"
            className={styles.cta}
            onClick={handleContinue}
            disabled={!canContinue}
          >
            <GoldRing shape="rect" radius={14} />
            <span className={styles.ctaLabel}>
            {canContinue
              ? `Continue with ${formatNaira(nairaEstimate)}`
              : 'Continue'}
          </span>
          </button>

          <div className={styles.secondaryLinks}>
            <button
              type="button"
              className={styles.secondaryLink}
              onClick={handleCancel}
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </motion.div>

      <DevSimulateButton />
    </CheckoutShell>
  );
}
