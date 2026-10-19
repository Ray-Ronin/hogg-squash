// @ts-check
// 640×360 back buffer, shown on the page at the largest whole-number scale that fits the window.
// Scaling is worked out in device pixels, so pixels stay square at 125%/150% Windows display scaling too.
// Below 1× the buffer is shrunk to fit instead.

export const WIDTH = 640;
export const HEIGHT = 360;

/**
 * @param {HTMLCanvasElement} canvas  the visible canvas
 * @returns {{ ctx: CanvasRenderingContext2D, present: () => void }}
 *   ctx draws into the back buffer; present() copies it to the visible canvas.
 */
export function createScreen(canvas) {
  const back = document.createElement('canvas');
  back.width = WIDTH;
  back.height = HEIGHT;
  const ctx = /** @type {CanvasRenderingContext2D} */ (back.getContext('2d'));
  const out = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d', { alpha: false }));

  function fit() {
    const dpr = window.devicePixelRatio || 1;
    const fitScale = Math.min(window.innerWidth * dpr / WIDTH, window.innerHeight * dpr / HEIGHT);
    const scale = fitScale >= 1 ? Math.floor(fitScale) : fitScale;
    const w = Math.max(1, Math.round(WIDTH * scale));
    const h = Math.max(1, Math.round(HEIGHT * scale));
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = `${w / dpr}px`;
    canvas.style.height = `${h / dpr}px`;
    out.imageSmoothingEnabled = false;      // resizing a canvas resets this
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
    present() { out.drawImage(back, 0, 0, canvas.width, canvas.height); },
  };
}
