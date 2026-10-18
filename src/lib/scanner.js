/* ──────────────────────────────────────────────────────────────────
 * lib/scanner.js (scan1)
 *
 * Reading product barcodes from the phone's camera, in the browser.
 * The browser's own reader where it has one (Chrome on Android); else
 * the same reader built from ZXing, with its WebAssembly file served
 * from remvo's own address, not a third party's, and only fetched when
 * someone opens the scanner. Nothing leaves the device: the camera's
 * pictures are read here, and only the numbers go into the box.
 * ────────────────────────────────────────────────────────────────── */

export const FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e'];

/** Whether this browser can open a camera at all. */
export const cameraPossible = () => typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia) && typeof window !== 'undefined' && window.isSecureContext !== false;

/** A product barcode's own check digit (GTIN-8, -12, -13, -14). */
export function validGtin(code) {
  if (!/^(\d{8}|\d{12,14})$/.test(code)) return false;
  const d = code.split('').map(Number);
  const check = d.pop();
  const sum = d.reverse().reduce((t, n, i) => t + n * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
}

/** One way of writing each product: a UPC read as EAN-13 (a leading 0) is the 12-digit UPC sellers know. */
export const canonical = (code) => (code.length === 13 && code.startsWith('0') ? code.slice(1) : code);

/** A detector for product barcodes: the browser's, or ZXing's. */
export async function makeDetector() {
  const Native = typeof window !== 'undefined' ? window.BarcodeDetector : undefined;
  if (Native) {
    try {
      const have = await Native.getSupportedFormats();
      if (FORMATS.every((f) => have.includes(f))) return new Native({ formats: FORMATS });
    } catch { /* fall through to ZXing */ }
  }
  const [{ BarcodeDetector, prepareZXingModule }, { default: wasmUrl }] = await Promise.all([
    import('barcode-detector/ponyfill'),
    import('zxing-wasm/reader/zxing_reader.wasm?url'),
  ]);
  prepareZXingModule({ overrides: { locateFile: (path, prefix) => (path.endsWith('.wasm') ? wasmUrl : prefix + path) } });
  return new BarcodeDetector({ formats: FORMATS });
}
