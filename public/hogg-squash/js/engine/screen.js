// @ts-check
// 640×360 back buffer, shown on the page as large as the window allows (16:9, centred, bars in the margin colour).
// Scaling is worked out in device pixels, so pixels stay square at 125%/150% Windows display scaling too.
//
// Two modes:
//  - 'fill' (default): sharp-bilinear. The buffer is first scaled up by a whole number with no smoothing (the next
//    whole scale above the window's), then smoothly shrunk to fit exactly. Pixels stay sharp, with only a slight
//    softness on their edges, and the game fills the window. At an exact whole-number fit (e.g. 3× in 1920×1080
//    fullscreen) the smoothing pass is skipped and every pixel is exact.
//  - 'int': the largest whole-number scale that fits, every pixel exact, with a border (the S1 behaviour).
//    Below 1× both modes shrink the buffer to fit.

export const WIDTH = 640;
export const HEIGHT = 360;

/** @typedef {'fill' | 'int'} ScaleMode */

/**
 * @param {HTMLCanvasElement} canvas  the visible canvas
 * @param {{ mode?: ScaleMode }} [opts]
 * @returns {{ ctx: CanvasRenderingContext2D, present: () => void }}
 *   ctx draws into the back buffer; present() copies it to the visible canvas.
 */
export function createScreen(canvas, { mode = 'fill' } = {}) {
  const back = document.createElement('canvas');
  back.width = WIDTH;
  back.height = HEIGHT;
  const ctx = /** @type {CanvasRenderingContext2D} */ (back.getContext('2d'));
  const out = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d', { alpha: false }));

  // the whole-number upscale for 'fill' (null when no smoothing pass is needed)
  /** @type {HTMLCanvasElement | null} */
  let mid = null;
  /** @type {CanvasRenderingContext2D | null} */
  let midCtx = null;

  function fit() {
    const dpr = window.devicePixelRatio || 1;
    const fitScale = Math.min(window.innerWidth * dpr / WIDTH, window.innerHeight * dpr / HEIGHT);
    const scale = mode === 'int' && fitScale >= 1 ? Math.floor(fitScale) : fitScale;
    const w = Math.max(1, Math.round(WIDTH * scale));
    const h = Math.max(1, Math.round(HEIGHT * scale));
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = `${w / dpr}px`;
    canvas.style.height = `${h / dpr}px`;

    const k = Math.max(1, Math.ceil(scale - 1e-9));      // whole-number prescale
    const exact = w === WIDTH * k && h === HEIGHT * k;
    if (mode === 'fill' && !exact && k > 1) {
      mid = mid ?? document.createElement('canvas');
      mid.width = WIDTH * k;
      mid.height = HEIGHT * k;
      midCtx = /** @type {CanvasRenderingContext2D} */ (mid.getContext('2d'));
      midCtx.imageSmoothingEnabled = false;           // resizing a canvas resets this
      out.imageSmoothingEnabled = true;
      out.imageSmoothingQuality = 'low';               // bilinear: the "sharp" in sharp-bilinear
    } else {
      mid = midCtx = null;
      out.imageSmoothingEnabled = !exact && scale < 1;  // smooth only when shrinking below 1×
    }
  }

  /** Re-fit when the device pixel ratio changes (browser zoom, moving to another monitor). */
  function watchDpr() {
    const mq = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    mq.addEventListener('change', () => { fit(); watchDpr(); }, { once: true });
  }

  window.addEventListener('resize', fit);
  watchDpr();
  fit();

  return {
    ctx,
    present() {
      if (mid && midCtx) {
        midCtx.drawImage(back, 0, 0, mid.width, mid.height);
        out.drawImage(mid, 0, 0, canvas.width, canvas.height);
      } else {
        out.drawImage(back, 0, 0, canvas.width, canvas.height);
      }
    },
  };
}
