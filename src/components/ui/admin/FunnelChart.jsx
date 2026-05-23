import styles from '@styles/ui/admin/funnel-chart.module.css';

/* ──────────────────────────────────────────────────────────────────
 * FunnelChart — horizontal step bars with drop-off labels
 *
 * A purpose-built funnel primitive. Each step renders as a horizontal
 * bar whose width is the % of the FIRST step's count (absolute
 * conversion from top). Between each pair of steps, a drop-off row
 * shows the conversion rate from the previous step + the count lost.
 *
 * Props
 *   steps       | output of computeFunnel(): [{ key, label, description, count, pctOfStart, pctOfPrev, dropFromPrev }]
 *   register    | 'obsidian' | 'neutral' (default 'neutral')
 *
 * Design rules
 *   - Bar fill uses the gold accent; never a gradient, never an
 *     animated stripe. Width is the data.
 *   - Count is rendered in IBM Plex Mono (financial figure).
 *   - Drop-off rows are muted text, right-aligned; they are the
 *     subtle business signal, not the hero.
 *   - Keyboard + screen reader: steps are semantic <li>, aria
 *     labels include step + count + % for non-visual parsing.
 * ────────────────────────────────────────────────────────────────── */

function formatPct(value, digits = 1) {
  if (value == null || Number.isNaN(value)) return '—';
  if (value >= 100) return '100%';
  return value.toFixed(digits) + '%';
}

export function FunnelChart({
  steps = [],
  register = 'neutral',
  className,
}) {
  if (!steps || steps.length === 0) {
    return null;
  }

  const wrapperClass = [
    styles.wrap,
    styles[`register-${register}`],
    className,
  ].filter(Boolean).join(' ');

  return (
    <ol className={wrapperClass} aria-label="Conversion funnel">
      {steps.map((step, i) => {
        const isFirst = i === 0;
        const isLast  = i === steps.length - 1;
        const prevStep = i > 0 ? steps[i - 1] : null;

        const dropPct = prevStep && prevStep.count > 0
          ? 100 - step.pctOfPrev
          : 0;

        return (
          <li key={step.key} className={styles.stepWrap}>
            {/* Drop-off indicator between this step and the previous */}
            {!isFirst && prevStep && step.dropFromPrev > 0 && (
              <div
                className={styles.dropRow}
                aria-label={
                  `${step.dropFromPrev} sessions dropped off, ` +
                  `${formatPct(dropPct)} drop`
                }
              >
                <span className={styles.dropBracket} aria-hidden="true" />
                <span className={styles.dropText}>
                  <span className={styles.dropPct}>-{formatPct(dropPct)}</span>
                  <span className={styles.dropCount}>
                    {step.dropFromPrev.toLocaleString('en-US')} dropped
                  </span>
                </span>
              </div>
            )}

            <div
              className={styles.step}
              aria-label={
                `Step ${i + 1}: ${step.label}. ${step.count} sessions. ` +
                `${formatPct(step.pctOfStart)} of top of funnel.`
              }
            >
              <div className={styles.stepHeader}>
                <div className={styles.stepTitleGroup}>
                  <span className={styles.stepIndex}>{i + 1}</span>
                  <div className={styles.stepText}>
                    <span className={styles.stepLabel}>{step.label}</span>
                    <span className={styles.stepDescription}>
                      {step.description}
                    </span>
                  </div>
                </div>
                <div className={styles.stepFigures}>
                  <span className={styles.stepCount}>
                    {step.count.toLocaleString('en-US')}
                  </span>
                  <span className={styles.stepPct}>
                    {isFirst ? 'Top of funnel' : formatPct(step.pctOfStart)}
                  </span>
                </div>
              </div>

              <div
                className={styles.barTrack}
                role="presentation"
              >
                <div
                  className={styles.barFill}
                  style={{ width: `${Math.max(step.pctOfStart, 2)}%` }}
                />
              </div>
            </div>

            {/* Final-step trailing summary */}
            {isLast && !isFirst && (
              <div className={styles.conclusion}>
                End-to-end conversion: <strong>{formatPct(step.pctOfStart)}</strong>
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
