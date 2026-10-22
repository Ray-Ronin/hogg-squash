// @ts-check
// The ball, its shadow, the landing marker and the two players, drawn in depth order (far first). The players are the
// animated sprites (sprites.js), P2 in the swapped kit; the S1–S7 placeholder boxes stay behind a debug toggle, and
// are drawn if the sprites failed to load.
// Character height follows one smooth perspective curve with the feet z, 57 px at the front wall (true to scale there:
// the head just under the 1.78 m service line) to 100 px at the back (docs/decisions.md, "Camera and character size");
// ?curve=true, ?curve=half and ?curve=old show the true-scale, CP-B and S3 curves for comparison.
// Boxes: while swinging, a racket stub on the box shows the side of the swing (right = forehand, left = backhand) and
// moves from raised (wind-up) through level (contact) to low (recovery). A diving box lies on the floor on the dive side.
import { FP } from '../squash-physics.js';
import { SWING, DIVE, swingPhase } from '../sim/player.js';
import { project, UNITS_PER_M } from './projection.js';
import { drawSprite } from './sprites.js';

const BALL_RADIUS_M = 0.05;           // drawn larger than a real ball (0.02 m) so it reads at 640×360
const COLOURS = {
  ball: '#1b1b1b', shadow: 'rgba(0, 0, 0, 0.35)', outline: '#000', landing: '#c8102e', racket: '#f4f4f0',
  players: [{ box: '#c8102e', swing: '#ff6a7f' }, { box: '#1f4fa8', swing: '#7aa2ff' }],
};

/**
 * Character height by feet depth (2026-10-21): height = BACK × (scale(z) ÷ scale(BACK_Z))^k, where scale is project()'s
 * pixels per metre at that depth and k (≈0.77) is set so the curve passes through FRONT at FRONT_Z: 57 px at the front
 * wall (z 12), 73 at mid-court and 100 at the back (z 179), so the 100 px art is never enlarged. FRONT is a 1.75 m
 * player there; behind it the player is drawn a little smaller than true scale, so the head stays under the service line.
 * It grows the whole way, with no flat ends and no bend, and is drawn rounded to a whole pixel (at most about 0.62 px
 * of change per frame when running).
 * METRES × scale(z) is true scale, kept for ?curve=true; BACK × √(…) is the CP-B half-strength curve, for ?curve=half.
 * OLD_POINTS is the S3 curve ([feet z, px], straight lines between, flat outside), kept for ?curve=old.
 */
export const CHARACTER_HEIGHT = {
  FRONT: 57,            // px at FRONT_Z
  FRONT_Z: 12,          // the nearest the feet go to the front wall (PLAYER_LIMITS.zMin)
  BACK: 100,            // px at BACK_Z (the art's height, drawn 1:1)
  BACK_Z: 179,          // the deepest the feet go (PLAYER_LIMITS.zMax)
  METRES: 1.75,         // an average adult man (US average 5 ft 9 in), just under the 1.78 m service line
  WIDTH_RATIO: 0.36,    // box width / height
  OLD_POINTS: /** @type {[number, number][]} */ ([[39, 68], [100, 84], [155, 100]]),
};

/**
 * How the boxes are sized: backHeight overrides the height at the back (?h=; the curve keeps its shape), and
 * curve 'true' picks true scale (?curve=true), 'half' the CP-B curve (?curve=half) and 'old' the S3 curve (?curve=old).
 * @typedef {{ backHeight?: number, curve?: 'fit' | 'true' | 'half' | 'old' }} SizeOpts
 */

/** The placeholder dive: the box lies on the floor, this much of its standing size, shifted to the dive side. */
const DIVE_BOX = { W: 0.8, H: 0.28, SHIFT: 0.35, LUNGE: 4 };   // LUNGE: frames after contact still in the swing colour

/**
 * Character height in pixels for feet depth z, before rounding.
 * @param {number} z  game units
 * @param {SizeOpts} [size]
 * @returns {number}
 */
export function exactHeightAt(z, size = {}) {
  const C = CHARACTER_HEIGHT;
  let h;
  if (size.curve === 'old') {
    const P = C.OLD_POINTS;
    h = P[0][1];
    if (z >= P[P.length - 1][0]) h = P[P.length - 1][1];
    else for (let i = 1; i < P.length; i++) {
      const [z0, h0] = P[i - 1], [z1, h1] = P[i];
      if (z < z1) { h = z <= z0 ? h0 : h0 + (h1 - h0) * (z - z0) / (z1 - z0); break; }
    }
  } else if (size.curve === 'true') {
    h = C.METRES * project(0, 0, z).scale;
  } else {
    const back = project(0, 0, C.BACK_Z).scale;
    const k = size.curve === 'half' ? 0.5 : Math.log(C.FRONT / C.BACK) / Math.log(project(0, 0, C.FRONT_Z).scale / back);
    h = C.BACK * (project(0, 0, z).scale / back) ** k;
  }
  return size.backHeight ? h * size.backHeight / exactHeightAt(C.BACK_Z, { curve: size.curve }) : h;
}

/**
 * Character height in whole pixels for feet depth z.
 * @param {number} z  game units
 * @param {SizeOpts} [size]
 * @returns {number}
 */
export function heightAt(z, size) {
  return Math.round(exactHeightAt(z, size));
}

/**
 * A standing box's left and right edges on screen. Each edge is rounded on its own from the unrounded size, so as the
 * player walks, both edges move smoothly: rounding the width first would let one edge step back and forth.
 * @param {number} sx  feet centre, screen x
 * @param {number} hExact  unrounded height (exactHeightAt)
 * @returns {{ x: number, w: number }}
 */
export function boxEdges(sx, hExact) {
  const half = hExact * CHARACTER_HEIGHT.WIDTH_RATIO / 2;
  const x = Math.round(sx - half);
  return { x, w: Math.round(sx + half) - x };
}

/** Each player's height at the last draw (for the debug overlay). @type {[number, number]} */
export const heights = [0, 0];

/** @typedef {import('../sim/player.js').Player} Player */

/**
 * The character sprites: the sheet, each player's kit atlas and animation (P1 first).
 * @typedef {{ sheet: import('./sprites.js').Sheet, atlases: import('./sprites.js').Atlas[],
 *   anims: import('./sprites.js').Animator[] }} Sprites
 */

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ x: number, y: number, z: number }} ball  16.16
 * @param {Player[]} players  P1 first
 * @param {{ landing: { x: number, z: number } | null, size?: SizeOpts, sprites?: Sprites | null }} opts
 *   sprites: null or missing draws the placeholder boxes
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
    const hExact = exactHeightAt(z, opts.size);
    heights[i] = Math.round(hExact);
    const sp = opts.sprites;
    items.push({ z, draw: sp ? () => {
      const p = project(pl.x / FP, 0, z);
      drawSprite(ctx, sp.sheet, sp.atlases[i], sp.anims[i], p.sx, p.sy, heights[i]);
    } : () => drawBox(ctx, pl, hExact, COLOURS.players[i]) });
  });
  items.sort((a, b) => a.z - b.z).forEach(it => it.draw());
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {Player} pl
 * @param {number} hExact  unrounded height in pixels (the box is drawn Math.round(hExact) tall)
 * @param {{ box: string, swing: string }} c
 */
function drawBox(ctx, pl, hExact, c) {
  const p = project(pl.x / FP, 0, pl.z / FP);
  const phase = swingPhase(pl);
  const s = pl.swing;
  const dir = s?.hand === 'back' ? -1 : 1;               // forehand on the right (+x), backhand on the left
  const h = Math.round(hExact);
  let { x, w } = boxEdges(p.sx, hExact), bh = h;
  if (phase === 'dive') {
    w = Math.round(h * DIVE_BOX.W);
    bh = Math.round(h * DIVE_BOX.H);
    x = Math.round(p.sx + dir * h * DIVE_BOX.SHIFT - w / 2);
  }
  const y = Math.round(p.sy) - bh;
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
