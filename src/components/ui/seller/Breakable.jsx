import { Fragment } from 'react';

/* Breakable
 *
 * A link-like label ("amazon.co.uk/dp/B0CB5MZXW8") that can wrap after
 * each slash instead of mid-word, so a narrow row shows its end (the
 * product number) on the second line rather than cutting it off.
 * Copying the text gives the label unchanged: <wbr> adds no character.
 */
export function Breakable({ text }) {
  const parts = String(text).split('/');
  return parts.map((p, i) => (
    <Fragment key={i}>{p}{i < parts.length - 1 && <>/<wbr /></>}</Fragment>
  ));
}
