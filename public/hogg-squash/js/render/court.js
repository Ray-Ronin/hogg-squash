// @ts-check
// The court in plain shapes, projected with the fixed camera. The camera never moves, so it is drawn once
// into its own canvas and copied in each frame.
import { project, UNITS_PER_M } from './projection.js';
import { WIDTH, HEIGHT } from '../engine/screen.js';

/** Court lines in game units (plan: "Decisions made while writing this plan"). */
export const LINES = {
  SIDE: 144, BACK: 183,
  TIN: 17, SERVICE: 63, FRONT_OUT: 161, BACK_OUT: 75,
  SHORT_Z: 103, BOX_W: 72, BOX_BACK_Z: 133,
};

const COLOURS = {
  margin: '#16161a',
  frontWall: '#f4f4f0',
  sideWall: '#d9d9d3',
  floor: '#dfbd8c',
  line: '#c8102e',
  tin: '#a50d26',
  glass: '#9fb4c0',
};

const LINE_M = 0.06;                  // painted line width in metres
const WALL_TOP = 8;                   // units of wall shown above the out-lines

/** @typedef {[number, number, number]} P3  x, y, z in game units */

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {P3[]} pts
 * @param {string} colour
 */
function poly(ctx, pts, colour) {
  ctx.beginPath();
  pts.forEach(([x, y, z], i) => {
    const p = project(x, y, z);
    if (i === 0) ctx.moveTo(p.sx, p.sy); else ctx.lineTo(p.sx, p.sy);
  });
  ctx.closePath();
  ctx.fillStyle = colour;
  ctx.fill();
}

/** Floor line along x at depth z. @param {CanvasRenderingContext2D} ctx */
function floorLineX(ctx, x1, x2, z, colour = COLOURS.line) {
  const h = LINE_M * UNITS_PER_M.z / 2;
  poly(ctx, [[x1, 0, z - h], [x2, 0, z - h], [x2, 0, z + h], [x1, 0, z + h]], colour);
}

/** Floor line along z at x. @param {CanvasRenderingContext2D} ctx */
function floorLineZ(ctx, x, z1, z2) {
  const h = LINE_M * UNITS_PER_M.x / 2;
  poly(ctx, [[x - h, 0, z1], [x + h, 0, z1], [x + h, 0, z2], [x - h, 0, z2]], COLOURS.line);
}

/** Front-wall line at height y. @param {CanvasRenderingContext2D} ctx */
function frontLine(ctx, y) {
  const h = LINE_M * UNITS_PER_M.y / 2, s = LINES.SIDE;
  poly(ctx, [[-s, y - h, 0], [s, y - h, 0], [s, y + h, 0], [-s, y + h, 0]], COLOURS.line);
}

/** Side-wall out-line sloping from the front to the back. @param {CanvasRenderingContext2D} ctx */
function sideOutLine(ctx, x) {
  const h = LINE_M * UNITS_PER_M.y / 2, L = LINES;
  poly(ctx, [[x, L.FRONT_OUT - h, 0], [x, L.BACK_OUT - h, L.BACK], [x, L.BACK_OUT + h, L.BACK], [x, L.FRONT_OUT + h, 0]], COLOURS.line);
}

/** @param {CanvasRenderingContext2D} ctx */
function paint(ctx) {
  const L = LINES, s = L.SIDE;
  ctx.fillStyle = COLOURS.margin;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  poly(ctx, [[-s, 0, 0], [s, 0, 0], [s, 0, L.BACK], [-s, 0, L.BACK]], COLOURS.floor);
  for (const x of [-s, s]) {
    poly(ctx, [[x, 0, 0], [x, 0, L.BACK], [x, L.BACK_OUT + WALL_TOP, L.BACK], [x, L.FRONT_OUT + WALL_TOP, 0]], COLOURS.sideWall);
  }
  poly(ctx, [[-s, 0, 0], [s, 0, 0], [s, L.FRONT_OUT + WALL_TOP, 0], [-s, L.FRONT_OUT + WALL_TOP, 0]], COLOURS.frontWall);

  // front wall: tin band, service line, out-line
  poly(ctx, [[-s, 0, 0], [s, 0, 0], [s, L.TIN, 0], [-s, L.TIN, 0]], COLOURS.tin);
  frontLine(ctx, L.TIN);
  frontLine(ctx, L.SERVICE);
  frontLine(ctx, L.FRONT_OUT);
  sideOutLine(ctx, -s);
  sideOutLine(ctx, s);

  // floor: short line, half-court line, service boxes, back glass
  floorLineX(ctx, -s, s, L.SHORT_Z);
  floorLineZ(ctx, 0, L.SHORT_Z, L.BACK);
  for (const sign of [-1, 1]) {
    floorLineZ(ctx, sign * (s - L.BOX_W), L.SHORT_Z, L.BOX_BACK_Z);
    floorLineX(ctx, sign * (s - L.BOX_W), sign * s, L.BOX_BACK_Z);
  }
  floorLineX(ctx, -s, s, L.BACK, COLOURS.glass);
}

/** @type {HTMLCanvasElement | null} */
let cache = null;

/** Draw the court (the whole back buffer, margins included). @param {CanvasRenderingContext2D} ctx */
export function drawCourt(ctx) {
  if (!cache) {
    cache = document.createElement('canvas');
    cache.width = WIDTH;
    cache.height = HEIGHT;
    paint(/** @type {CanvasRenderingContext2D} */ (cache.getContext('2d')));
  }
  ctx.drawImage(cache, 0, 0);
}
