import { motion } from 'motion/react';
import { useReducedMotion } from '@hooks/useReducedMotion';
import { easeOut } from '@utils/motion';
import { GoldRing } from './GoldRing';
import styles from '@styles/ui/denomination-grid.module.css';

/* ──────────────────────────────────────────────────────────────────
 * DenominationGrid — Phase 5 (horizontal pill row)
 *
 * REBUILT from a 2x3 obsidian card grid into a single horizontal pill
 * row. The card-as-input pattern means the RemvoCard sits above this
 * row as the protagonist; this row is a tertiary input that morphs
 * the card's dollar amount when tapped.
 *
 * Pills are obsidian on warm canvas. Active pill flips to gold-tinted
 * surface with the iridescent gold border ring. The active state is
 * communicated by the parent via `selected`, not held internally.
 *
 * Mobile: row scrolls horizontally if needed (rare — six pills fit
 * comfortably at 440px). Desktop: row centres in available width.
 *
 * @param {{
 *   denominations: number[],
 *   selected: number | null,
 *   onSelect: (amount: number) => void,
 * }} props
 * ────────────────────────────────────────────────────────────────── */

export function DenominationGrid({
  denominations = [10, 25, 50, 100, 250, 500],
  selected,
  onSelect,
}) {
  const reduced = useReducedMotion();

  return (
    <div
      className={styles.row}
      role="radiogroup"
      aria-label="Card denomination"
    >
      {denominations.map((amount) => {
        const isSelected = selected === amount;
        const className = [
          styles.pill,
          isSelected ? styles.pillSelected : '',
        ].filter(Boolean).join(' ');

        return (
          <motion.button
            key={amount}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={`${amount} dollar card`}
            className={className}
            onClick={() => onSelect(amount)}
            animate={{ y: isSelected && !reduced ? -1 : 0 }}
            transition={{ duration: 0.35, ease: easeOut }}
          >
            {isSelected && <GoldRing shape="rect" radius={12} />}
            <span className={styles.amount}>${amount}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
