// @ts-check
// Placeholder HUD in plain canvas text: scores and the server in the side margins, rally callouts and the
// score painted on the front wall, the match result, and the freeze notice. The bitmap font arrives in S9.
import { project } from './projection.js';
import { WIDTH } from '../engine/screen.js';
import { TIMING } from '../sim/world.js';

/** @typedef {import('../sim/world.js').World} World */

const COLOURS = { text: '#f4f4f0', dim: '#8a8a94', wall: '#c8102e', wallDim: '#555', players: ['#ff5a6e', '#7aa2ff'] };
const CALLOUTS = { tin: 'TIN', out: 'OUT', down: 'DOWN', notUp: 'NOT UP' };
const MARGIN_W = 100;                 // each side margin is 100 px with the S1 camera

/**
 * Text centred on the front wall at height y (game units).
 * @param {CanvasRenderingContext2D} ctx @param {string} text @param {number} y @param {string} font @param {string} colour
 */
function wallText(ctx, text, y, font, colour) {
  const p = project(0, y, 0);
  ctx.font = font;
  ctx.fillStyle = colour;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, Math.round(p.sx), Math.round(p.sy));
}

/** @param {number} side */
const name = side => `P${side + 1}`;

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {World} w
 * @param {{ paused: boolean }} opts
 */
export function drawHud(ctx, w, opts) {
  const m = w.match;

  // side margins: P1 left, P2 right
  for (const side of [0, 1]) {
    const cx = side === 0 ? MARGIN_W / 2 : WIDTH - MARGIN_W / 2;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = COLOURS.players[side];
    ctx.font = 'bold 12px monospace';
    ctx.fillText(name(side), cx, 24);
    ctx.fillStyle = COLOURS.text;
    ctx.font = 'bold 32px monospace';
    ctx.fillText(String(m.scores[side]), cx, 40);
    if (m.server === side && m.winner === null) {
      ctx.fillStyle = COLOURS.text;
      ctx.font = '10px monospace';
      ctx.fillText('SERVING', cx, 78);
      ctx.fillStyle = COLOURS.dim;
      ctx.fillText(`${m.box} box`, cx, 90);
    }
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.font = '10px monospace';
  ctx.fillStyle = COLOURS.dim;
  ctx.fillText(`FIRST TO ${m.target}`, MARGIN_W / 2, 120);
  ctx.fillText('WIN BY 2', MARGIN_W / 2, 132);

  // front wall
  if (w.phase === 'point' && w.result) {
    if (w.timer < TIMING.CALLOUT) {
      wallText(ctx, CALLOUTS[w.result.reason], 115, 'bold 28px monospace', COLOURS.wall);
      wallText(ctx, `${name(w.result.winner)}'s point`, 88, '10px monospace', COLOURS.wallDim);
    } else {
      wallText(ctx, 'POINT', 118, 'bold 24px monospace', COLOURS.wall);
      wallText(ctx, `${m.scores[0]} – ${m.scores[1]}`, 90, 'bold 20px monospace', COLOURS.wallDim);
    }
  } else if (w.phase === 'over' && m.winner !== null) {
    const win = m.scores[m.winner], lose = m.scores[m.winner === 0 ? 1 : 0];
    wallText(ctx, `${name(m.winner)} WINS ${win}–${lose}`, 118, 'bold 22px monospace', COLOURS.wall);
    wallText(ctx, 'HARD to play again', 90, '10px monospace', COLOURS.wallDim);
  } else if (w.phase === 'serve') {
    wallText(ctx, `${name(m.server)} to serve`, 90, '10px monospace', COLOURS.wallDim);
  }

  if (opts.paused) {
    wallText(ctx, 'FROZEN', 130, 'bold 22px monospace', '#000');
    wallText(ctx, 'Esc to carry on', 106, '10px monospace', '#000');
  }
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}
