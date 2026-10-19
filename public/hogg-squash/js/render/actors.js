// @ts-check
// The ball, its shadow, the landing marker and the two placeholder player boxes, drawn in depth order (far first).
// Box height changes smoothly with the feet z, through the CP-A sizes (docs/decisions.md, "Camera and character size").
import { FP } from '../squash-physics.js';
import { project } from './projection.js';

const BALL_RADIUS_M = 0.05;           // drawn larger than a real ball (0.02 m) so it reads at 640×360
const COLOURS = {
  ball: '#1b1b1b', shadow: 'rgba(0, 0, 0, 0.35)', outline: '#000', landing: '#c8102e',
  players: [{ box: '#c8102e', swing: '#ff6a7f' }, { box: '#1f4fa8', swing: '#7aa2ff' }],
};

/**
 * Character height by feet depth: [feet z in game units, height in px], front to back. The CP-A sizes (68 / 84 /
 * 100 px) sit at the middle of their old bands (front z 8–70, middle 70–130, back 130–180). In between, the height
 * is interpolated in a straight line and rounded to a whole pixel, so it changes 1 px at a time (about every 3
 * frames when running in depth). In front of the first point and behind the last it stays at that size.
 */
export const CHARACTER_HEIGHT = {
  POINTS: /** @type {[number, number][]} */ ([[39, 68], [100, 84], [155, 100]]),
  WIDTH_RATIO: 0.36,    // box width / height
};

/**
 * Character height in pixels for feet depth z.
 * @param {number} z  game units
 * @param {number} [backHeight]  overrides the back height (?h=); the curve is scaled to match
 * @returns {number}  whole pixels
 */
export function heightAt(z, backHeight) {
  const P = CHARACTER_HEIGHT.POINTS;
  let h = P[0][1];
  if (z >= P[P.length - 1][0]) h = P[P.length - 1][1];
  else for (let i = 1; i < P.length; i++) {
    const [z0, h0] = P[i - 1], [z1, h1] = P[i];
    if (z < z1) { h = z <= z0 ? h0 : h0 + (h1 - h0) * (z - z0) / (z1 - z0); break; }
  }
  if (backHeight) h *= backHeight / P[P.length - 1][1];
  return Math.round(h);
}

/** Each player's height at the last draw (for the debug overlay). @type {[number, number]} */
export const heights = [0, 0];

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ x: number, y: number, z: number }} ball  16.16
 * @param {{ x: number, z: number, swing: unknown }[]} players  16.16, P1 first
 * @param {{ landing: { x: number, z: number } | null, backHeight?: number }} opts
 *   backHeight overrides the height at the back (?h=); the other heights keep their ratio to it.
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
    const h = heights[i] = heightAt(z, opts.backHeight);
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
  const w = Math.round(h * CHARACTER_HEIGHT.WIDTH_RATIO);
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
