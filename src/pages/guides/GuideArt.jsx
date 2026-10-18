import A from '@styles/pages/marketing/guide-art.module.css';

/* ──────────────────────────────────────────────────────────────────
 * A guide's cover picture, by topic (guides1b)
 *
 * Drawn for Remvo, in the postage world: no stock art, no icons from a
 * set. Each topic gets its own picture as guides on it arrive; until
 * then a topic shows the signature, a barcode whose stripes become the
 * lines of a listing. Decoration only: hidden from screen readers.
 *
 * bulk    a spreadsheet whose rows become a sheet of stamps: each row a
 *         listing, the made ones perforated ivory, the rest waiting.
 *
 * Motion: once, on arrival (the rows light, the stamps land in order);
 * none under reduced motion, where the finished picture is shown.
 * ────────────────────────────────────────────────────────────────── */

const ROWS = [
  [64, 40, 28],
  [52, 46, 22],
  [70, 34, 30],
  [48, 42, 26],
  [60, 38, 24],
  [56, 44, 28],
];
const COLS = [60, 140, 208]; // x of columns A, B, C

// The stamp sheet: 3 x 3, the first six made, one being made, two waiting.
const STAMPS = Array.from({ length: 9 }, (_, i) => ({
  x: 300 + (i % 3) * 68,
  y: 58 + Math.floor(i / 3) * 80,
  state: i < 6 ? 'made' : i === 6 ? 'making' : 'waiting',
  i,
}));

function Stamp({ x, y, state, i }) {
  if (state === 'waiting') {
    return <rect x={x} y={y} width="60" height="72" rx="3" className={A.waiting} />;
  }
  return (
    <g className={state === 'made' ? A.made : A.making} style={{ '--i': i }}>
      {/* Paper, its perforated edge drawn as the night showing through round holes. */}
      <rect x={x} y={y} width="60" height="72" rx="1.5" className={A.paper} />
      <rect x={x} y={y} width="60" height="72" rx="1.5" className={A.holes} />
      <rect x={x + 7} y={y + 7} width="46" height="58" rx="2" className={A.inner} />
      <rect x={x + 13} y={y + 15} width="34" height="3.5" rx="1.75" className={A.line} />
      <rect x={x + 13} y={y + 23} width="26" height="3.5" rx="1.75" className={A.line} />
      <rect x={x + 13} y={y + 31} width="30" height="3.5" rx="1.75" className={A.lineSoft} />
      <rect x={x + 13} y={y + 50} width="16" height="5" rx="2.5" className={A.price} />
    </g>
  );
}

function Bulk() {
  return (
    <svg className={A.art} viewBox="0 0 520 340" aria-hidden="true" focusable="false">
      {/* The spreadsheet */}
      <rect x="16" y="36" width="244" height="268" rx="14" className={A.sheet} />
      <line x1="16" y1="70" x2="260" y2="70" className={A.rule} />
      <line x1="44" y1="36" x2="44" y2="304" className={A.rule} />
      {['A', 'B', 'C'].map((c, i) => (
        <text key={c} x={COLS[i]} y="58" className={A.letter}>{c}</text>
      ))}
      {ROWS.map((row, r) => {
        const y = 92 + r * 36;
        return (
          <g key={r} className={A.row} style={{ '--r': r }}>
            <text x="30" y={y + 4} className={A.num} textAnchor="middle">{r + 1}</text>
            {row.map((w, c) => (
              <rect key={c} x={COLS[c] - 4} y={y - 3} width={w} height="6" rx="3" className={c === 0 ? A.cellStrong : A.cell} />
            ))}
            {r < 5 && <line x1="16" y1={y + 18} x2="260" y2={y + 18} className={A.ruleSoft} />}
          </g>
        );
      })}

      {/* The route from row to stamp */}
      <path d="M 262 170 C 278 170, 280 170, 292 170" className={A.route} />
      <path d="M 286 164 L 293 170 L 286 176" className={A.arrow} />

      {/* The sheet of stamps, on its backing: the holes show the backing through */}
      <rect x="292" y="50" width="212" height="248" rx="10" className={A.backing} />
      {STAMPS.map((s) => <Stamp key={s.i} {...s} />)}
    </svg>
  );
}

function Signature() {
  // A barcode whose stripes become the lines of a listing.
  const stripes = [0, 6, 10, 18, 22, 30, 34, 38, 46, 52, 56, 64, 70, 74, 82, 88];
  return (
    <svg className={A.art} viewBox="0 0 520 340" aria-hidden="true" focusable="false">
      <rect x="40" y="70" width="170" height="200" rx="14" className={A.sheet} />
      {stripes.map((x, i) => (
        <rect key={x} x={78 + x} y="110" width={i % 3 === 0 ? 4 : 2} height="120" className={A.stripe} />
      ))}
      <path d="M 222 170 C 246 170, 250 170, 270 170" className={A.route} />
      <path d="M 264 164 L 271 170 L 264 176" className={A.arrow} />
      <rect x="284" y="70" width="200" height="200" rx="14" className={A.sheet} />
      {[150, 120, 136, 96].map((w, i) => (
        <rect key={i} x="308" y={104 + i * 28} width={w} height="7" rx="3.5" className={i === 0 ? A.cellStrong : A.cell} />
      ))}
      <rect x="308" y="226" width="56" height="10" rx="5" className={A.price} />
    </svg>
  );
}

export function GuideArt({ topic }) {
  return topic === 'bulk' ? <Bulk /> : <Signature />;
}
