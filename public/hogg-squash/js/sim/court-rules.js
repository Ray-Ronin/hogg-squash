// @ts-check
// Court lines and the verdicts for a ball touching a wall. Pure sim code: no DOM, so Node tests can import it.
// The tin and out-line checks weren't found in the ROM, so the heights come from a real court scaled into the
// arcade's units (≈45 per metre across, ≈35.2 high, ≈18.8 deep). See docs/plan.md, "Decisions made while
// writing this plan". The owner approved them after S2 (docs/decisions.md, "Match rules").
import { COURT } from '../squash-physics.js';

/** Court lines in game units. `render/court.js` draws the court from these. */
export const LINES = {
  SIDE: COURT.SIDE,         // 144: side walls at x = ±144
  BACK: COURT.BACK,         // 183: back wall (glass) at z = 183
  GLASS_H: COURT.GLASS_H,   // 75: top of the back glass, which is also the back-wall out-line
  TIN: 17,              // top of the tin on the front wall
  SERVICE: 63,              // front-wall service line (drawn only: serving is arcade-simple)
  FRONT_OUT: 161,           // front-wall out-line
  BACK_OUT: 75,             // side-wall out-line height where it meets the back wall
  SHORT_Z: 103,             // short line (front edge of the service boxes)
  BOX_W: 72,                // service box width
  BOX_BACK_Z: 133,          // back edge of the service boxes
};

/** @typedef {'tin' | 'out' | 'good'} FrontVerdict */
/** @typedef {'out' | 'good'} SideVerdict */
/** @typedef {'right' | 'left'} BoxSide */

/**
 * A ball touching the front wall at height y (game units, the ball's centre).
 * The lines count against the ball: on or below the tin is `tin`, on or above the out-line is `out`.
 * @param {number} y
 * @returns {FrontVerdict}
 */
export function frontWallVerdict(y) {
  if (y <= LINES.TIN) return 'tin';
  if (y >= LINES.FRONT_OUT) return 'out';
  return 'good';
}

/**
 * Height of the side-wall out-line at depth z: a straight slope from the front-wall out-line to the back.
 * @param {number} z  game units from the front wall
 * @returns {number}
 */
export function sideOutHeight(z) {
  const t = Math.max(0, Math.min(1, z / LINES.BACK));
  return LINES.FRONT_OUT + (LINES.BACK_OUT - LINES.FRONT_OUT) * t;
}

/**
 * A ball touching a side wall at height y and depth z (game units). On or above the sloping line is `out`.
 * @param {number} y
 * @param {number} z
 * @returns {SideVerdict}
 */
export function sideWallVerdict(y, z) {
  return y >= sideOutHeight(z) ? 'out' : 'good';
}

/**
 * The floor area of a service box, in game units. Seen from behind (the camera), right is +x.
 * @param {BoxSide} side
 * @returns {{ xMin: number, xMax: number, zMin: number, zMax: number }}
 */
export function serviceBox(side) {
  const L = LINES, inner = L.SIDE - L.BOX_W;
  return side === 'right'
    ? { xMin: inner, xMax: L.SIDE, zMin: L.SHORT_Z, zMax: L.BOX_BACK_Z }
    : { xMin: -L.SIDE, xMax: -inner, zMin: L.SHORT_Z, zMax: L.BOX_BACK_Z };
}
