import s from '@styles/ui/seller/week-stacks.module.css';

/* ──────────────────────────────────────────────────────────────────
 * WeekStacks
 *
 * The last seven days as seven stacks of parcels, one parcel per
 * listing made that day, drawn isometric like the Remvo mark. A day
 * with nothing is a bare floor tile. Listings that did not work sit
 * on top as empty outlines in oxide (their credits went back).
 *
 * The stacks build up once when Home opens, oldest day first: the one
 * moment of motion on Home. Reduced motion: they are simply there.
 *
 *   days   [{ date: 'YYYY-MM-DD', ready, failed }] x 7, today last
 * ────────────────────────────────────────────────────────────────── */

const W = 30;       // a parcel's width
const H = 9;        // how much each parcel adds to the stack
const SHOWN = 9;    // parcels drawn before "+n"
const TOP = W / 4;  // the top face's half-height

function Parcel({ x, y, failed, i }) {
  const top = `M${x} ${y} l${W / 2} ${-TOP} l${W / 2} ${TOP} l${-W / 2} ${TOP} Z`;
  const left = `M${x} ${y} l${W / 2} ${TOP} v${H} l${-W / 2} ${-TOP} Z`;
  const right = `M${x + W} ${y} l${-W / 2} ${TOP} v${H} l${W / 2} ${-TOP} Z`;
  return (
    <g className={`${s.parcel} ${failed ? s.failed : ''}`} style={{ '--i': i }}>
      <path d={left} className={s.left} />
      <path d={right} className={s.right} />
      <path d={top} className={s.top} />
      {!failed && <path d={`M${x + W / 4} ${y - TOP / 2} l${W / 2} ${TOP}`} className={s.tape} />}
    </g>
  );
}

const day = (iso) => new Date(`${iso}T12:00:00`);
const short = (iso) => day(iso).toLocaleDateString('en-GB', { weekday: 'short' }).slice(0, 1);
const long = (iso) => day(iso).toLocaleDateString('en-GB', { weekday: 'long' });

export function WeekStacks({ days }) {
  // As tall as the week's tallest day (at least two parcels), so a
  // quiet week is not a tall empty box.
  const tallest = Math.max(2, ...days.map((d) => Math.min(d.ready + d.failed, SHOWN)));
  const height = TOP * 2 + tallest * H + (days.some((d) => d.ready + d.failed > SHOWN) ? 16 : 4);
  const describe = days.map((d, i) => `${i === days.length - 1 ? 'today' : long(d.date)} ${d.ready}${d.failed ? `, ${d.failed} did not work` : ''}`).join('; ');
  let order = 0;
  return (
    <figure className={s.week}>
      <div className={s.columns} role="img" aria-label={`Listings made, last 7 days: ${describe}`}>
        {days.map((d, col) => {
          const total = d.ready + d.failed;
          const shown = Math.min(total, SHOWN);
          const today = col === days.length - 1;
          return (
            <div key={d.date} className={`${s.column} ${today ? s.today : ''}`}>
              <svg viewBox={`-2 ${-height + TOP * 2} ${W + 4} ${height}`} className={s.stack} aria-hidden="true" focusable="false">
                <path d={`M0 ${TOP} l${W / 2} ${-TOP} l${W / 2} ${TOP} l${-W / 2} ${TOP} Z`} className={s.floor} />
                {Array.from({ length: shown }, (_, k) => {
                  const failed = k >= Math.min(d.ready, shown);
                  order += 1;
                  return <Parcel key={k} x={0} y={TOP - (k + 1) * H} failed={failed} i={order} />;
                })}
                {total > SHOWN && (
                  <text x={W / 2} y={TOP - SHOWN * H - TOP - 6} textAnchor="middle" className={s.more}>+{total - SHOWN}</text>
                )}
              </svg>
              <span className={s.count}>{total || ''}</span>
              <span className={s.label}>{today ? 'Today' : short(d.date)}</span>
            </div>
          );
        })}
      </div>
    </figure>
  );
}
