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
 * drafts  a fanned stack of drafts, one field still missing, and a
 *         postmark landing on the top one: LISTED.
 * pallet  a returns pallet in isometric, boxes coming off it into three
 *         graded stacks (NEW, OPEN BOX, PARTS), a route from the barcode.
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

/* drafts: a fanned stack of drafts, still marked DRAFT with a dashed
 * edge, and a postmark coming down on the top one: LISTED. */
function Drafts() {
  const cards = [
    { x: 92, y: 96, r: -9 },
    { x: 118, y: 84, r: -3 },
    { x: 146, y: 76, r: 3 },
  ];
  return (
    <svg className={A.art} viewBox="0 0 520 340" aria-hidden="true" focusable="false">
      {cards.map((c, i) => {
        const top = i === cards.length - 1;
        return (
          <g key={i} transform={`rotate(${c.r} ${c.x + 110} ${c.y + 120})`} className={top ? A.draftTop : A.draftUnder}>
            <rect x={c.x} y={c.y} width="220" height="240" rx="10" className={top ? A.draftPaper : A.draftPaperUnder} />
            {top && (
              <>
                <rect x={c.x + 18} y={c.y + 20} width="64" height="64" rx="6" className={A.draftPhoto} />
                <rect x={c.x + 96} y={c.y + 26} width="104" height="7" rx="3.5" className={A.line} />
                <rect x={c.x + 96} y={c.y + 42} width="84" height="7" rx="3.5" className={A.line} />
                <rect x={c.x + 96} y={c.y + 58} width="94" height="7" rx="3.5" className={A.lineSoft} />
                {[0, 1, 2, 3].map((k) => (
                  <g key={k}>
                    <rect x={c.x + 18} y={c.y + 106 + k * 26} width="54" height="6" rx="3" className={A.lineSoft} />
                    {k !== 1 && <rect x={c.x + 86} y={c.y + 106 + k * 26} width={70 + ((k * 13) % 40)} height="6" rx="3" className={A.line} />}
                    {k === 1 && <rect x={c.x + 86} y={c.y + 103} width="70" height="12" rx="3" className={A.missing} />}
                  </g>
                ))}
                <rect x={c.x + 18} y={c.y + 210} width="44" height="9" rx="4.5" className={A.price} />
                <text x={c.x + 202} y={c.y + 218} textAnchor="end" className={A.draftWord}>DRAFT</text>
              </>
            )}
          </g>
        );
      })}

      {/* The postmark, landing on the top draft */}
      <g className={A.stampDown}>
        <g transform="rotate(-14 386 214)">
          <circle cx="386" cy="214" r="62" className={A.markRing} />
          <circle cx="386" cy="214" r="46" className={A.markRingInner} />
          <text x="386" y="210" textAnchor="middle" className={A.markWord}>LISTED</text>
          <text x="386" y="228" textAnchor="middle" className={A.markSmall}>REMVO</text>
          <path d="M 300 196 h 26 M 300 206 h 26 M 300 216 h 26 M 446 196 h 26 M 446 206 h 26 M 446 216 h 26" className={A.markLines} />
        </g>
      </g>
    </svg>
  );
}

/* pallet: a returns pallet in isometric, the vault mark's style, with
 * boxes coming off it into three graded stacks: NEW, OPEN BOX, PARTS.
 * A dotted route runs from the box with the barcode to the stacks. */
const ISO = { x: 0.866, y: 0.5 };
const pt = (ox, oy, x, y, z) => [ox + (x - y) * ISO.x, oy + (x + y) * ISO.y - z];
const pts = (list) => list.map((p) => p.join(',')).join(' ');

function IsoBox({ ox, oy, x, y, z = 0, w, d, h, tone = 'box', i = 0, label }) {
  const P = (a, b, c) => pt(ox, oy, a, b, c);
  const top = [P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)];
  const left = [P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)];
  const right = [P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)];
  return (
    <g className={tone === 'slat' ? undefined : A.boxDrop} style={{ '--i': i }}>
      <polygon points={pts(left)} className={A[`${tone}L`]} />
      <polygon points={pts(right)} className={A[`${tone}R`]} />
      <polygon points={pts(top)} className={A[`${tone}T`]} />
      {tone === 'box' && <polyline points={pts([P(x + w / 2, y, z + h), P(x + w / 2, y + d, z + h)])} className={A.tape} />}
      {label && (() => {
        // A barcode label on the right face.
        const [lx, ly] = P(x + w, y + d * 0.3, z + h * 0.3);
        return (
          <g transform={`translate(${lx} ${ly}) skewY(-30)`}>
            <rect x="0" y={-h * 0.45} width={d * 0.45} height={h * 0.32} className={A.label} />
            {[0.06, 0.12, 0.16, 0.23, 0.27, 0.33, 0.38].map((f) => (
              <rect key={f} x={d * f} y={-h * 0.42} width="1.6" height={h * 0.22} className={A.bars} />
            ))}
          </g>
        );
      })()}
    </g>
  );
}

function Pallet() {
  const ox = 170;
  const oy = 150;
  return (
    <svg className={A.art} viewBox="0 0 520 340" aria-hidden="true" focusable="false">
      {/* The pallet: deck slats on three runners */}
      {[0, 46, 92].map((y) => <IsoBox key={`r${y}`} ox={ox} oy={oy} x={0} y={y} w={140} d={14} h={10} tone="slat" />)}
      {[0, 22, 44, 66, 88, 110].map((y) => <IsoBox key={`s${y}`} ox={ox} oy={oy} x={-4} y={y - 2} z={10} w={148} d={16} h={5} tone="slat" />)}
      {/* What is still on it */}
      <IsoBox ox={ox} oy={oy} x={6} y={6} z={15} w={58} d={48} h={44} i={0} />
      <IsoBox ox={ox} oy={oy} x={70} y={4} z={15} w={64} d={52} h={34} i={1} />
      <IsoBox ox={ox} oy={oy} x={8} y={62} z={15} w={56} d={44} h={30} i={2} />
      <IsoBox ox={ox} oy={oy} x={12} y={14} z={59} w={44} d={34} h={28} i={3} />
      <IsoBox ox={ox} oy={oy} x={72} y={62} z={15} w={58} d={46} h={46} i={4} label />

      {/* From the scanned box to the stacks it is graded into */}
      <g className={A.scan}>
        <path d="M 240 196 C 268 172, 300 176, 318 206" className={A.route} />
        <path d="M 310 202 L 318 208 L 321 198" className={A.arrow} />
      </g>

      {/* Three graded stacks */}
      {[
        { x: 300, word: 'NEW', boxes: [[0, 0, 0], [0, 0, 26]] },
        { x: 372, word: 'OPEN BOX', boxes: [[0, 0, 0]] },
        { x: 444, word: 'PARTS', boxes: [[0, 0, 0]], parts: true },
      ].map((s, k) => (
        <g key={s.word}>
          {s.boxes.map(([bx, by, bz], j) => (
            <IsoBox key={j} ox={s.x} oy={272} x={bx} y={by} z={bz} w={30} d={30} h={24} tone={s.parts ? 'part' : 'box'} i={5 + k * 2 + j} />
          ))}
          <text x={s.x} y={318} textAnchor="middle" className={A.tag}>{s.word}</text>
        </g>
      ))}
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

const ART = { bulk: Bulk, drafts: Drafts, pallet: Pallet };

export function GuideArt({ art }) {
  const Art = ART[art] ?? Signature;
  return <Art />;
}
