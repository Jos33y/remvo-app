import { useMemo, useState } from 'react';
import styles from '@styles/ui/admin/trend-line.module.css';

/* ──────────────────────────────────────────────────────────────────
 * TrendLine — hand-authored SVG line chart
 *
 * Single series, variable bucket count (24 hourly, 7/31 daily, or
 * weekly depending on range). Renders as SVG so it is sharp on any
 * DPI, animates natively, and carries no library weight.
 *
 * Features
 *   - Stroke path + soft area fill under the curve
 *   - Three horizontal gridlines (25% / 50% / 75% of max) + baseline
 *   - X-axis tick labels (up to 5 evenly spaced) rendered as HTML
 *     so text stays crisp regardless of viewBox scaling
 *   - Peak value annotation at the curve's highest point
 *   - Hoverable column hitzones for tooltip
 *   - Responsive width via viewBox + preserveAspectRatio
 *
 * Props
 *   data        | [{ t: ms, count: number, volumeUsd: number }]
 *   valueKey    | 'count' | 'volumeUsd' (default 'count')
 *   height      | number (px, default 160)
 *   label       | string (aria + tooltip header prefix)
 *   yFormat     | (value) => string  (tooltip + peak label)
 *   xFormat     | (t) => string      (tooltip x + tick labels)
 *   xTickFormat | (t) => string      (optional, shorter variant for ticks)
 *   tone        | 'gold' | 'success' | 'info' (default 'gold')
 *   register    | 'obsidian' | 'neutral' (default 'obsidian')
 *   showPeak    | boolean (default true) — shows peak value marker
 *
 * The viewBox is fixed at 1000x320; the container CSS handles
 * responsive scaling. Text labels live in an HTML overlay, not
 * inside the SVG, so they stay crisp and accessible.
 * ────────────────────────────────────────────────────────────────── */

const VIEW_W = 1000;
const VIEW_H = 320;
const PAD_X  = 8;
const PAD_TOP = 28;       // extra room for peak label
const PAD_BOTTOM = 24;

const MAX_TICKS = 5;

export function TrendLine({
  data = [],
  valueKey = 'count',
  height = 160,
  label = 'Trend',
  yFormat,
  xFormat,
  xTickFormat,
  tone = 'gold',
  register = 'obsidian',
  showPeak = true,
  className,
}) {
  const [hoverIdx, setHoverIdx] = useState(null);

  const { points, max, peakIdx, areaPath, linePath } = useMemo(() => {
    if (!data || data.length === 0) {
      return { points: [], max: 0, peakIdx: -1, areaPath: '', linePath: '' };
    }

    const values = data.map(d => Number(d[valueKey]) || 0);
    const rawMax = Math.max(...values);
    const computedMax = rawMax === 0 ? 1 : rawMax;

    const innerW = VIEW_W - PAD_X * 2;
    const innerH = VIEW_H - PAD_TOP - PAD_BOTTOM;

    const pts = data.map((d, i) => {
      const ratio = data.length > 1 ? i / (data.length - 1) : 0.5;
      const x = PAD_X + ratio * innerW;
      const v = Number(d[valueKey]) || 0;
      const y = PAD_TOP + innerH - (v / computedMax) * innerH;
      return { x, y, raw: d };
    });

    // Peak: first occurrence of the max (break ties toward earliest
    // so the annotation sits on the left side of any plateau).
    let pIdx = -1;
    if (rawMax > 0) {
      for (let i = 0; i < values.length; i++) {
        if (values[i] === rawMax) { pIdx = i; break; }
      }
    }

    // Build line path (catmull-rom → cubic bezier, smooth but honest)
    let line = '';
    let area = '';
    if (pts.length === 1) {
      const p = pts[0];
      line = `M ${p.x} ${p.y}`;
      area = `M ${p.x} ${VIEW_H - PAD_BOTTOM} L ${p.x} ${p.y}`;
    } else {
      line = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i - 1] || pts[i];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[i + 2] || p2;
        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;
        line += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
      }
      area =
        `M ${pts[0].x} ${VIEW_H - PAD_BOTTOM} ` +
        `L ${pts[0].x} ${pts[0].y} ` +
        line.slice(line.indexOf('C')) +
        ` L ${pts[pts.length - 1].x} ${VIEW_H - PAD_BOTTOM} Z`;
    }

    return { points: pts, max: rawMax, peakIdx: pIdx, areaPath: area, linePath: line };
  }, [data, valueKey]);

  // X-axis ticks: evenly spaced across the data length, max 5, always
  // including first and last samples. Indices only; formatting happens
  // at render time so xTickFormat / xFormat / toLocaleString each get
  // a chance in priority order.
  const tickIndices = useMemo(() => {
    if (!data || data.length === 0) return [];
    if (data.length <= MAX_TICKS) return data.map((_, i) => i);
    const step = (data.length - 1) / (MAX_TICKS - 1);
    const ticks = [];
    for (let i = 0; i < MAX_TICKS; i++) {
      ticks.push(Math.round(i * step));
    }
    return ticks;
  }, [data]);

  const hoverPoint = hoverIdx != null ? points[hoverIdx] : null;
  const hoverData  = hoverIdx != null ? data[hoverIdx] : null;

  const gridY = [0.25, 0.5, 0.75].map(r => PAD_TOP + r * (VIEW_H - PAD_TOP - PAD_BOTTOM));

  const wrapperClass = [
    styles.wrap,
    styles[`tone-${tone}`],
    styles[`register-${register}`],
    className,
  ].filter(Boolean).join(' ');

  const fmtY = (v) => yFormat ? yFormat(v) : Number(v || 0).toLocaleString('en-US');
  const fmtX = (t) => xFormat ? xFormat(t) : new Date(t).toLocaleString();
  const fmtTick = (t) => xTickFormat ? xTickFormat(t)
    : xFormat ? xFormat(t)
    : new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const empty = !data || data.length === 0 || max === 0;
  const peakPoint = peakIdx >= 0 ? points[peakIdx] : null;
  const peakData  = peakIdx >= 0 ? data[peakIdx] : null;

  return (
    <div
      className={wrapperClass}
      style={{ height: `${height}px` }}
      role="img"
      aria-label={label}
    >
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="none"
        className={styles.svg}
      >
        {/* Gridlines */}
        {gridY.map((y, i) => (
          <line
            key={i}
            x1={PAD_X}
            x2={VIEW_W - PAD_X}
            y1={y}
            y2={y}
            className={styles.gridline}
          />
        ))}
        <line
          x1={PAD_X}
          x2={VIEW_W - PAD_X}
          y1={VIEW_H - PAD_BOTTOM}
          y2={VIEW_H - PAD_BOTTOM}
          className={styles.baseline}
        />

        {!empty && (
          <>
            <path d={areaPath} className={styles.area} />
            <path d={linePath} className={styles.line} />

            {/* Peak marker dot (visual only; value rendered in HTML overlay below) */}
            {showPeak && peakPoint && (
              <circle
                cx={peakPoint.x}
                cy={peakPoint.y}
                r="4"
                className={styles.peakDot}
              />
            )}

            {/* Hover marker */}
            {hoverPoint && (
              <>
                <line
                  x1={hoverPoint.x}
                  x2={hoverPoint.x}
                  y1={PAD_TOP}
                  y2={VIEW_H - PAD_BOTTOM}
                  className={styles.hoverLine}
                />
                <circle
                  cx={hoverPoint.x}
                  cy={hoverPoint.y}
                  r="5"
                  className={styles.hoverDot}
                />
              </>
            )}

            {points.map((p, i) => {
              const zoneW = VIEW_W / points.length;
              const zoneX = i * zoneW;
              return (
                <rect
                  key={i}
                  x={zoneX}
                  y={0}
                  width={zoneW}
                  height={VIEW_H}
                  className={styles.hitzone}
                  onMouseEnter={() => setHoverIdx(i)}
                  onMouseLeave={() => setHoverIdx(null)}
                  onFocus={() => setHoverIdx(i)}
                  onBlur={() => setHoverIdx(null)}
                  tabIndex={-1}
                />
              );
            })}
          </>
        )}
      </svg>

      {/* ── HTML overlay: axis labels + peak annotation ──
       * Rendered as real HTML (not SVG <text>) so font rendering is
       * crisp regardless of viewBox scaling. Positions use percentages
       * mapped from SVG-space points. */}

      {!empty && showPeak && peakPoint && peakData && (
        <div
          className={styles.peakLabel}
          style={{ left: `${(peakPoint.x / VIEW_W) * 100}%` }}
        >
          <span className={styles.peakValue}>{fmtY(peakData[valueKey])}</span>
        </div>
      )}

      {!empty && tickIndices.length > 0 && (
        <div className={styles.ticks} aria-hidden="true">
          {tickIndices.map((idx, i) => {
            const p = points[idx];
            if (!p) return null;
            const align = i === 0 ? 'start'
              : i === tickIndices.length - 1 ? 'end'
              : 'center';
            return (
              <span
                key={idx}
                className={`${styles.tick} ${styles[`tick-${align}`]}`}
                style={{ left: `${(p.x / VIEW_W) * 100}%` }}
              >
                {fmtTick(data[idx].t)}
              </span>
            );
          })}
        </div>
      )}

      {empty && (
        <div className={styles.empty}>No data in range</div>
      )}

      {hoverPoint && hoverData && (
        <div
          className={styles.tooltip}
          style={{ left: `${(hoverPoint.x / VIEW_W) * 100}%` }}
        >
          <div className={styles.tooltipTime}>{fmtX(hoverData.t)}</div>
          <div className={styles.tooltipValue}>{fmtY(hoverData[valueKey])}</div>
        </div>
      )}
    </div>
  );
}
