// @ts-check
// The ball, its shadow, the landing marker and the two placeholder player boxes, drawn in depth order (far first).
// Boxes are drawn at one of three pre-scaled heights picked from the feet z (docs/decisions.md, "Camera and
// character size"), as the sprites will be in S8.
import { FP } from '../squash-physics.js';
import { project } from './projection.js';

const BALL_RADIUS_M = 0.05;           // drawn larger than a real ball (0.02 m) so it reads at 640×360
const COLOURS = {
  ball: '#1b1b1b', shadow: 'rgba(0, 0, 0, 0.35)', outline: '#000', landing: '#c8102e',
  players: [{ box: '#c8102e', swing: '#ff6a7f' }, { box: '#1f4fa8', swing: '#7aa2ff' }],
};

/** Depth bands for the character's height (game units of feet z; pixels). S8 reuses these for the sprites. */
export const DEPTH_BANDS = {
  BACK_Z: 130,          // z ≥ 130: back
  FRONT_Z: 70,          // z < 70: front; in between: middle
  HYSTERESIS: 4,        // a player must pass an edge by this many units to change band (no flicker on the edge)
  HEIGHTS: { back: 100, middle: 84, front: 68 },
};

/** @typedef {'back' | 'middle' | 'front'} Band */

/**
 * The band for feet depth z, ignoring the previous band.
 * @param {number} z  game units
 * @returns {Band}
 */
function bandAt(z) {
  return z >= DEPTH_BANDS.BACK_Z ? 'back' : z >= DEPTH_BANDS.FRONT_Z ? 'middle' : 'front';
}

/**
 * The band for feet depth z, given the band the player is in now: it only changes once z is HYSTERESIS units
 * past the edge.
 * @param {Band | null} prev
 * @param {number} z  game units
 * @returns {Band}
 */
export function nextBand(prev, z) {
  const B = DEPTH_BANDS, h = B.HYSTERESIS;
  if (prev === null) return bandAt(z);
  const lo = prev === 'back' ? B.BACK_Z : prev === 'middle' ? B.FRONT_Z : -Infinity;
  const hi = prev === 'back' ? Infinity : prev === 'middle' ? B.BACK_Z : B.FRONT_Z;
  return z < lo - h || z >= hi + h ? bandAt(z) : prev;
}

/** Each player's current band (drawing state, not sim state). @type {[Band | null, Band | null]} */
export const bands = [null, null];

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ x: number, y: number, z: number }} ball  16.16
 * @param {{ x: number, z: number, swing: unknown }[]} players  16.16, P1 first
 * @param {{ landing: { x: number, z: number } | null, backHeight?: number }} opts
 *   backHeight overrides the back band's height (?h=); the other bands keep their ratio to it.
 */
export function drawActors(ctx, ball, players, opts) {
  const bx = ball.x / FP, by = Math.max(0, ball.y / FP), bz = ball.z / FP;

  if (opts.landing) drawLanding(ctx, opts.landing.x, opts.landing.z);

  const shadow = project(bx, 0, bz);
  const r = Math.max(1, BALL_RADIUS_M * shadow.scale);
  ctx.fillStyle = COLOURS.shadow;
  ctx.beginPath();
  ctx.ellipse(shadow.sx, shadow.sy, r * 1.2, r * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();

  /** @type {{ z: number, draw: () => void }[]} */
  const items = [{
    z: bz,
    draw() {
      const p = project(bx, by, bz);
      ctx.fillStyle = COLOURS.ball;
      ctx.beginPath();
      ctx.arc(p.sx, p.sy - r, r, 0, Math.PI * 2);
      ctx.fill();
    },
  }];
  players.forEach((pl, i) => {
    const z = pl.z / FP;
    const band = bands[i] = nextBand(bands[i], z);
    const H = DEPTH_BANDS.HEIGHTS;
    const h = opts.backHeight ? Math.round(opts.backHeight * H[band] / H.back) : H[band];
    items.push({ z, draw: () => drawBox(ctx, pl, h, COLOURS.players[i]) });
  });
  items.sort((a, b) => a.z - b.z).forEach(it => it.draw());
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ x: number, z: number, swing: unknown }} pl
 * @param {number} h  pixels
 * @param {{ box: string, swing: string }} c
 */
function drawBox(ctx, pl, h, c) {
  const p = project(pl.x / FP, 0, pl.z / FP);
  const w = Math.round(h * 0.36);
  const x = Math.round(p.sx - w / 2), y = Math.round(p.sy) - h;
  ctx.fillStyle = COLOURS.outline;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = pl.swing ? c.swing : c.box;
  ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
}

/** A cross on the floor where the ball will land. @param {CanvasRenderingContext2D} ctx @param {number} x @param {number} z */
function drawLanding(ctx, x, z) {
  const d = 5;                        // half-size in game units across; depth units are smaller, so double them
  const a = project(x - d, 0, z - d * 2), b = project(x + d, 0, z + d * 2);
  const c = project(x + d, 0, z - d * 2), e = project(x - d, 0, z + d * 2);
  ctx.strokeStyle = COLOURS.landing;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy);
  ctx.moveTo(c.sx, c.sy); ctx.lineTo(e.sx, e.sy);
  ctx.stroke();
  ctx.lineWidth = 1;
}
