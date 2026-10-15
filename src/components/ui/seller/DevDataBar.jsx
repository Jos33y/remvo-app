import { useState } from 'react';
import { MODES, devMode, setDevMode } from '@lib/devData';
import s from '@styles/ui/seller/dev-data-bar.module.css';

/* DevDataBar
 *
 * Development only (SellerApp.jsx loads it under `vite`, never in a
 * build). Switches the seller app between the real API and the
 * break-the-UI fixtures in lib/devData.js, and sets the balance.
 * Plain grey, no motion: it is a tool, not part of the product.
 */

const LABEL = { real: 'Real', worst: 'Worst case', empty: 'Empty', one: 'One', huge: '1,200 rows' };
const BALANCES = ['', '0', '1', '2', '100350'];

export default function DevDataBar() {
  const [{ mode, balance }] = useState(devMode);
  return (
    <div className={s.bar} role="group" aria-label="Development data">
      {MODES.map((m) => (
        <button key={m} type="button" className={s.option} aria-pressed={mode === m} onClick={() => setDevMode(m)}>
          {LABEL[m]}
        </button>
      ))}
      <label className={s.balance}>
        <span>Balance</span>
        <select value={balance ?? ''} onChange={(e) => setDevMode(mode, e.target.value || null)} disabled={mode === 'real'}>
          {BALANCES.map((b) => <option key={b} value={b}>{b === '' ? 'Fixture' : b}</option>)}
        </select>
      </label>
    </div>
  );
}
