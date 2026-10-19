// @ts-check
// The ball, its shadow, the landing marker and the two placeholder player boxes, drawn in depth order (far first).
// Box height changes smoothly with the feet z, through the CP-A sizes (docs/decisions.md, "Camera and character size").
// While swinging, a racket stub on the box shows the side of the swing (right = forehand, left = backhand) and moves
// from raised (wind-up) through level (contact) to low (recovery). A diving box lies on the floor on the dive side.
import { FP } from '../squash-physics.js';
import { SWING, DIVE, swingPhase } from '../sim/player.js';
import { project, UNITS_PER_M } from './projection.js';

const BALL_RADIUS_M = 0.05;           // drawn larger than a real ball (0.02 m) so it reads at 640×360
const COLOURS = {
  ball: '#1b1b1b', shadow: 'rgba(0, 0, 0, 0.35)', outline: '#000', landing: '#c8102e', racket: '#f4f4f0',
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

/** The placeholder dive: the box lies on the floor, this much of its standing size, shifted to the dive side. */
const DIVE_BOX = { W: 0.8, H: 0.28, SHIFT: 0.35, LUNGE: 4 };   // LUNGE: frames after contact still in the swing colour

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

/** @typedef {import('../sim/player.js').Player} Player */

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ x: number, y: number, z: number }} ball  16.16
 * @param {Player[]} players  P1 first
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
 * @param {Player} pl
 * @param {number} h  pixels
 * @param {{ box: string, swing: string }} c
 */
function drawBox(ctx, pl, h, c) {
  const p = project(pl.x / FP, 0, pl.z / FP);
  const phase = swingPhase(pl);
  const s = pl.swing;
  const dir = s?.hand === 'back' ? -1 : 1;               // forehand on the right (+x), backhand on the left
  let w = Math.round(h * CHARACTER_HEIGHT.WIDTH_RATIO), bh = h;
  let cx = p.sx;
  if (phase === 'dive') {
    w = Math.round(h * DIVE_BOX.W);
    bh = Math.round(h * DIVE_BOX.H);
    cx += dir * h * DIVE_BOX.SHIFT;
  }
  const x = Math.round(cx - w / 2), y = Math.round(p.sy) - bh;
  ctx.fillStyle = COLOURS.outline;
  ctx.fillRect(x, y, w, bh);
  const lunging = phase === 'dive' && s && s.t < DIVE.CONTACT + DIVE_BOX.LUNGE;
  ctx.fillStyle = phase === 'windup' || phase === 'recovery' || lunging ? c.swing : c.box;
  ctx.fillRect(x + 1, y + 1, w - 2, bh - 2);
  if (s && phase !== 'dive') drawRacket(ctx, dir > 0 ? x + w : x, y + Math.round(h * 0.3), h, dir, s.t);
  else if (s && lunging) drawRacket(ctx, dir > 0 ? x + w : x, y + Math.round(bh / 2), h, dir, SWING.CONTACT);
}

/**
 * A racket stub from the box's shoulder: raised behind at the press, level at contact, low in the recovery.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} sx  shoulder x (the box edge)
 * @param {number} sy  shoulder y
 * @param {number} h   box height
 * @param {number} dir  +1 right, -1 left
 * @param {number} t   frames since the press
 */
function drawRacket(ctx, sx, sy, h, dir, t) {
  const RAISED = -1.2, LOW = 0.9;                        // angles below the horizontal, radians
  const a = t <= SWING.CONTACT ? RAISED * (1 - t / SWING.CONTACT)
    : LOW * Math.min(1, (t - SWING.CONTACT) / SWING.RECOVERY);
  const len = h * 0.3;
  const ex = sx + dir * Math.cos(a) * len, ey = sy + Math.sin(a) * len;
  ctx.strokeStyle = COLOURS.outline;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
  ctx.strokeStyle = COLOURS.racket;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
  ctx.fillStyle = COLOURS.outline;
  ctx.fillRect(Math.round(ex) - 2, Math.round(ey) - 2, 5, 5);
  ctx.fillStyle = COLOURS.racket;
  ctx.fillRect(Math.round(ex) - 1, Math.round(ey) - 1, 3, 3);
}

/**
 * A ring on the floor where the ball will land, with a dot in the middle.
 * @param {CanvasRenderingContext2D} ctx @param {number} x @param {number} z  game units
 */
function drawLanding(ctx, x, z) {
  const R_M = 0.3, STEPS = 16;        // a circle of this radius in metres on the floor
  ctx.strokeStyle = COLOURS.landing;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i <= STEPS; i++) {
    const a = i / STEPS * Math.PI * 2;
    const q = project(x + R_M * UNITS_PER_M.x * Math.cos(a), 0, z + R_M * UNITS_PER_M.z * Math.sin(a));
    if (i === 0) ctx.moveTo(q.sx, q.sy); else ctx.lineTo(q.sx, q.sy);
  }
  ctx.stroke();
  ctx.lineWidth = 1;
  const c = project(x, 0, z);
  ctx.fillStyle = COLOURS.landing;
  ctx.fillRect(Math.round(c.sx) - 1, Math.round(c.sy) - 1, 2, 2);
}
