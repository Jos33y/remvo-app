import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { IconCheck, IconClose } from '@components/ui/seller/icons';
import { canonical, makeDetector, validGtin } from '@lib/scanner';
import theme from '@styles/layout/seller/app-theme.module.css';
import S from '@styles/ui/seller/scan-sheet.module.css';

/* ──────────────────────────────────────────────────────────────────
 * ScanSheet (scan1): scan a stack of boxes with the phone's camera
 *
 * The whole screen is the camera, with a frame to point at the
 * barcode. Each new barcode goes straight onto the bulk sheet, one a
 * line, with a short buzz and the number shown; one already scanned
 * on the sheet is said, not added twice. Done goes back to the sheet,
 * where Check reads them all as usual. The camera stops the moment it
 * closes. Nothing is sent anywhere: the picture is read on the phone.
 *
 * single (scan2): one barcode for one listing. The first good read
 * goes into the box and the camera closes by itself; nothing is spent
 * until the seller taps Make listing.
 * ────────────────────────────────────────────────────────────────── */

const EVERY_MS = 120;
const SAME_AGAIN_MS = 2500;

export function ScanSheet({ open, onClose, onCode, already, single = false }) {
  const videoRef = useRef(null);
  const doneRef = useRef(null);
  const streamRef = useRef(null);
  const seen = useRef(new Set());
  const last = useRef({ code: null, at: 0 });
  const [state, setState] = useState('starting');
  const [error, setError] = useState('');
  const [said, setSaid] = useState(null);
  const [count, setCount] = useState(0);
  const [torch, setTorch] = useState(null);
  const titleId = useId();

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    let live = true;
    let timer = null;
    seen.current = new Set((already ?? []).map(canonical));
    setCount(0); setSaid(null); setError(''); setState('starting'); setTorch(null);

    (async () => {
      let detector;
      try {
        const [stream, d] = await Promise.all([
          navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false }),
          makeDetector(),
        ]);
        if (!live) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        detector = d;
        const v = videoRef.current;
        v.srcObject = stream;
        await v.play();
        const track = stream.getVideoTracks()[0];
        const caps = track.getCapabilities?.() ?? {};
        if (caps.torch) setTorch(false);
        setState('scanning');
      } catch (err) {
        if (!live) return;
        setState('error');
        const typeIt = single ? 'type the barcode instead' : 'type the barcodes on the sheet';
        setError(err?.name === 'NotAllowedError' || err?.name === 'SecurityError'
          ? `The camera is blocked for Remvo. Allow it in your browser’s settings for this site, or ${typeIt}.`
          : err?.name === 'NotFoundError' || err?.name === 'OverconstrainedError'
            ? `No camera was found on this device. ${single ? 'Type the barcode instead' : 'Type the barcodes, or use a barcode scanner'}.`
            : `The camera did not start. Close this and try again, or ${typeIt}.`);
        return;
      }

      const tick = async () => {
        if (!live) return;
        const v = videoRef.current;
        if (v && v.readyState >= 2) {
          try {
            const found = await detector.detect(v);
            for (const f of found) {
              const raw = String(f.rawValue ?? '').trim();
              if (!validGtin(raw)) continue;
              const code = canonical(raw);
              if (single) {
                navigator.vibrate?.(40);
                live = false;
                stop();
                onCode(code);
                onClose();
                return;
              }
              const now = Date.now();
              if (code === last.current.code && now - last.current.at < SAME_AGAIN_MS) continue;
              last.current = { code, at: now };
              if (seen.current.has(code)) {
                setSaid({ code, kind: 'again' });
              } else if (!onCode(code)) {
                setSaid({ code, kind: 'full' });
              } else {
                seen.current.add(code);
                setCount((n) => n + 1);
                setSaid({ code, kind: 'added' });
                navigator.vibrate?.(40);
              }
              break;
            }
          } catch { /* a frame that could not be read: the next one will */ }
        }
        if (live) timer = setTimeout(tick, EVERY_MS);
      };
      tick();
    })();

    return () => { live = false; clearTimeout(timer); stop(); };
  }, [open]);

  // Escape closes; the camera stops with it.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const before = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => doneRef.current?.focus());
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = before; };
  }, [open, onClose]);

  async function flip() {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try { await track.applyConstraints({ advanced: [{ torch: !torch }] }); setTorch(!torch); } catch { setTorch(null); }
  }

  if (!open) return null;

  return (
    <div className={`${theme.theme} ${S.root}`} role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <video ref={videoRef} className={S.video} playsInline muted autoPlay aria-hidden="true" />
      <div className={S.shade} aria-hidden="true">
        <span className={S.frame}><span className={S.beam} /></span>
      </div>

      <header className={S.top}>
        <h2 id={titleId} className={S.title}>{single ? 'Scan a barcode' : 'Scan barcodes'}</h2>
        <button type="button" className={S.close} onClick={onClose} aria-label="Close the camera"><IconClose size={22} /></button>
      </header>

      <div className={S.bottom}>
        <p className={S.status} aria-live="polite">
          {state === 'starting' && 'Starting the camera…'}
          {state === 'error' && error}
          {state === 'scanning' && !said && (single ? 'Point at the barcode on the box.' : 'Point at a barcode on the box. Each one goes onto your sheet.')}
          {state === 'scanning' && said?.kind === 'added' && (
            <><span className={S.tick} aria-hidden="true"><IconCheck size={16} /></span>Added <span className={S.code}>{said.code}</span></>
          )}
          {state === 'scanning' && said?.kind === 'again' && <>Already on the sheet: <span className={S.code}>{said.code}</span></>}
          {state === 'scanning' && said?.kind === 'full' && 'The sheet is full: 500 at a time. Check these, then start another batch.'}
        </p>
        <div className={S.actions}>
          {torch !== null && (
            <button type="button" className={S.torch} aria-pressed={torch} onClick={flip}>{torch ? 'Light off' : 'Light on'}</button>
          )}
          <button ref={doneRef} type="button" className={S.done} onClick={onClose}>
            {single ? 'Type it instead' : count ? `Done, ${count} scanned` : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
}
