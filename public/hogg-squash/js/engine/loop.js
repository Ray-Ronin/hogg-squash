// @ts-check
// Fixed-step loop: the sim runs at the arcade's 57.4 Hz whatever the display rate. Rendering draws the
// latest state once per animation frame (no interpolation).

export const SIM_HZ = 57.4;

/**
 * @param {{ step: () => void, render: () => void, hz?: number, maxSteps?: number }} opts
 *   maxSteps caps the catch-up after a stall (a hidden tab, a long GC); the rest of the backlog is dropped.
 * @returns {{ stop: () => void }}
 */
export function startLoop({ step, render, hz = SIM_HZ, maxSteps = 5 }) {
  const dt = 1000 / hz;
  let acc = 0;
  /** @type {number | null} */
  let last = null;
  let raf = 0;

  /** @param {number} now */
  function frame(now) {
    if (last !== null) acc += Math.max(0, now - last);
    last = now;
    let n = 0;
    while (acc >= dt && n < maxSteps) { step(); acc -= dt; n++; }
    if (acc >= dt) acc %= dt;
    render();
    raf = requestAnimationFrame(frame);
  }

  raf = requestAnimationFrame(frame);
  return { stop() { cancelAnimationFrame(raf); } };
}
