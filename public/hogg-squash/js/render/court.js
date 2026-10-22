// @ts-check
// The court: A4's painted court (assets/court.png, painted to the frozen camera), or for checking alignment the code
// court, in plain shapes projected with the camera, or the painted court with the code's lines over it in cyan
// ('lines': they should sit on the painted lines). The code court is also the fallback until the painting loads.
// The camera never moves, so each is drawn once into its own canvas and copied in each frame.
import { project, UNITS_PER_M } from './projection.js';
import { WIDTH, HEIGHT } from '../engine/screen.js';
import { LINES } from '../sim/court-rules.js';

const COLOURS = {
  margin: '#16161a',
  frontWall: '#f4f4f0',
  sideWall: '#d9d9d3',
  floor: '#dfbd8c',
  line: '#c8102e',
  tin: '#a50d26',
  glass: '#9fb4c0',
};

const LINE_M = 0.06;
/** The code's lines drawn over the painted court (debug), half see-through so the painted line shows under them. */
const CHECK_LINE = 'rgba(0, 220, 255, 0.6)';                  // painted line width in metres
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
function floorLineX(ctx, x1, x2, z, colour = lineColour) {
  const h = LINE_M * UNITS_PER_M.z / 2;
  poly(ctx, [[x1, 0, z - h], [x2, 0, z - h], [x2, 0, z + h], [x1, 0, z + h]], colour);
}

/** Floor line along z at x. @param {CanvasRenderingContext2D} ctx */
function floorLineZ(ctx, x, z1, z2) {
  const h = LINE_M * UNITS_PER_M.x / 2;
  poly(ctx, [[x - h, 0, z1], [x + h, 0, z1], [x + h, 0, z2], [x - h, 0, z2]], lineColour);
}

/** Front-wall line at height y. @param {CanvasRenderingContext2D} ctx */
function frontLine(ctx, y) {
  const h = LINE_M * UNITS_PER_M.y / 2, s = LINES.SIDE;
  poly(ctx, [[-s, y - h, 0], [s, y - h, 0], [s, y + h, 0], [-s, y + h, 0]], lineColour);
}

/** Side-wall out-line sloping from the front to the back. @param {CanvasRenderingContext2D} ctx */
function sideOutLine(ctx, x) {
  const h = LINE_M * UNITS_PER_M.y / 2, L = LINES;
  poly(ctx, [[x, L.FRONT_OUT - h, 0], [x, L.BACK_OUT - h, L.BACK], [x, L.BACK_OUT + h, L.BACK], [x, L.FRONT_OUT + h, 0]], lineColour);
}

/** The colour the line helpers paint with (the court's red, or CHECK_LINE for the overlay). */
let lineColour = COLOURS.line;

/** Every line of the court (the glass edge too). @param {CanvasRenderingContext2D} ctx @param {boolean} [check] */
function paintLines(ctx, check = false) {
  const L = LINES, s = L.SIDE;
  lineColour = check ? CHECK_LINE : COLOURS.line;
  // front wall: tin, service line, out-line; side-wall out-lines
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
  floorLineX(ctx, -s, s, L.BACK, check ? CHECK_LINE : COLOURS.glass);
  lineColour = COLOURS.line;
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

  poly(ctx, [[-s, 0, 0], [s, 0, 0], [s, L.TIN, 0], [-s, L.TIN, 0]], COLOURS.tin);   // the tin band under its line
  paintLines(ctx);
}

/**
 * How the court is drawn: 'art' the painted court, 'code' the code court, 'lines' the painted court with the code's
 * lines over it.
 * @typedef {'art' | 'code' | 'lines'} CourtView
 */
export const COURT_VIEWS = /** @type {const} */ (['art', 'code', 'lines']);

/** The painted court, once loaded. @type {CanvasImageSource | null} */
let painted = null;

/** Draw the painted court from now on. @param {CanvasImageSource} image  court.png (640×360) */
export function useCourt(image) {
  painted = image;
}

/** Each view's cached canvas. @type {Partial<Record<CourtView, HTMLCanvasElement>>} */
const cache = {};

/** @param {(ctx: CanvasRenderingContext2D) => void} draw */
function cached(draw) {
  const c = document.createElement('canvas');
  c.width = WIDTH;
  c.height = HEIGHT;
  draw(/** @type {CanvasRenderingContext2D} */ (c.getContext('2d')));
  return c;
}

/**
 * Draw the court (the whole back buffer, margins included). Without the painting the code court is drawn.
 * @param {CanvasRenderingContext2D} ctx
 * @param {CourtView} [view]
 */
export function drawCourt(ctx, view = 'art') {
  const v = painted ? view : 'code';
  if (v === 'art' && painted) { ctx.drawImage(painted, 0, 0); return; }
  const img = cache[v] ??= cached(c => {
    if (v === 'code') paint(c);
    else if (painted) { c.drawImage(painted, 0, 0); paintLines(c, true); }
  });
  ctx.drawImage(img, 0, 0);
}
