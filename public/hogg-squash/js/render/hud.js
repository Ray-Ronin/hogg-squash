// @ts-check
// The HUD, in the bitmap font (text.js) and A5's pieces (ui.js; docs/art-style-guide.md §3): a score panel in each
// side margin (P1 left in Hogg red, P2 / the CPU right in white) with the serve tag under the server's score, the
// match length on a dark panel under P1's, each side's controls at the foot of its margin, and on the front wall the
// rally callouts (the reason's word, the winner's point under it), the score, GAME at the end and the serve notice.
// The scorer's new score flashes white once when a point is won (pointFlash).
// The pause menu and the result are screens of their own (js/ui/). The optional logo slot (LOGO) is in the right margin.
import { project } from './projection.js';
import { WIDTH, HEIGHT } from '../engine/screen.js';
import { TIMING } from '../sim/world.js';
import { LINES } from '../sim/court-rules.js';
import { drawText, lineHeight, capsHeight } from './text.js';
import { drawSlice, drawPanel, slice } from './ui.js';

/** @typedef {import('../sim/world.js').World} World */
/** @typedef {import('./text.js').FontName} FontName */

/**
 * The school logo slot (open question 6): one image path and one switch, off by default, so a logo can be added to
 * the match later by dropping the file in and turning `on` to true (?logo=on shows it for testing). It is drawn in
 * the right margin under P2's panel, scaled down to fit SIZE if it's bigger. The title screen's shield is separate
 * (assets/title.png, A5). The image loads only when the slot is on, and a missing file just leaves the slot empty.
 */
export const LOGO = { url: 'assets/logo.png', on: false, SIZE: 66 };

/** Each rally reason's callout slice (ui.json): `notUp` is DOUBLE BOUNCE (the owner's wording; two lines, 52 px). */
export const CALLOUTS = { tin: 'callout TIN', out: 'callout OUT', down: 'callout DOWN', notUp: 'callout DOUBLE BOUNCE' };

/** Where things go, in screen px. The front wall is x 210–430, the out-line at y 52 and the service line at y 139. */
const LAYOUT = {
  PANEL_Y: 16,          // the score panels' top
  INFO_Y: 108,          // the "FIRST TO" panel (left) and the logo slot (right)
  INFO_H: 30,
  CALLOUT_Y: 88,        // the middle of a callout on the wall (DOUBLE BOUNCE 62–114, the others 72–104)
  NOTE_Y: 118,          // the line under a callout ("P1's point", "P1 to serve")
  KEYS_Y: 306,          // the first line of each margin's controls
};

/** Sim frames the point flash lasts (S12): the winner's new score lights up white and fades, about 0.4 s. */
export const POINT_FLASH = 24;

/**
 * How bright the point flash is over a side's score: 1 on the frame the point is scored, fading to 0. 0 otherwise.
 * @param {World} w @param {number} side
 */
export function pointFlash(w, side) {
  if (w.phase !== 'point' || w.result?.winner !== side || w.timer >= POINT_FLASH) return 0;
  return 1 - w.timer / POINT_FLASH;
}

/** Each side margin's width beside the floor at the glass (100 px with the S1 camera, 78 with wide or zoom). */
const marginW = () => Math.floor(project(-LINES.SIDE, 0, LINES.BACK).sx);

/** P1 / P2, or CPU for a slot the computer plays. @param {World} w @param {number} side */
const name = (w, side) => (w.cpu[side] ? 'CPU' : `P${side + 1}`);

/**
 * Text centred in a box, the capitals (with their outline and shadow) in its middle.
 * @param {CanvasRenderingContext2D} ctx @param {FontName} font @param {string} str
 * @param {{ x: number, y: number, w: number, h: number }} box
 */
function textIn(ctx, font, str, box) {
  drawText(ctx, font, str, box.x + box.w / 2, box.y + Math.floor((box.h - capsHeight(font)) / 2), 'center');
}

/**
 * A slice centred on a point.
 * @param {CanvasRenderingContext2D} ctx @param {string} name @param {number} cx @param {number} cy
 */
function sliceAt(ctx, name, cx, cy) {
  const s = slice(name);
  if (s) drawSlice(ctx, name, Math.round(cx - s.w / 2), Math.round(cy - s.h / 2));
}

/**
 * One side's score panel with its top-left at x, y: the name in the header, the score, and the serve tag if serving.
 * Without the UI sheet the text is still drawn, in the same places.
 * @param {CanvasRenderingContext2D} ctx @param {World} w @param {0 | 1} side @param {number} x @param {number} y
 */
function scorePanel(ctx, w, side, x, y) {
  const key = `score panel p${side + 1}`;
  const panel = slice(key) ?? { x: 0, y: 0, w: 66, h: 84 };
  /** A sub-slice moved to the panel's place on screen. @param {string} part @param {number} dy @param {number} h */
  const part = (part, dy, h) => {
    const s = slice(`${key} ${part}`) ?? { x: panel.x + 2, y: panel.y + dy, w: panel.w - 4, h };
    return { x: x + s.x - panel.x, y: y + s.y - panel.y, w: s.w, h: s.h };
  };
  drawSlice(ctx, key, x, y);
  textIn(ctx, side === 0 ? 'large-white' : 'large-red', name(w, side), part('name', 2, 20));
  const score = part('score', 24, 42);
  textIn(ctx, 'huge-white', String(w.match.scores[side]), score);
  const f = pointFlash(w, side);
  if (f > 0) {                                  // one white flash over the new score, fading out (not a blink)
    ctx.fillStyle = `rgba(255, 255, 255, ${(0.8 * f).toFixed(3)})`;
    ctx.fillRect(score.x, score.y, score.w, score.h);
  }
  if (w.match.server === side && w.match.winner === null) {
    const s = part('serve', 68, 14);
    sliceAt(ctx, 'serve', s.x + s.w / 2, s.y + s.h / 2);
  }
}

/**
 * A callout slice centred on the front wall (its word if the UI sheet is missing).
 * @param {CanvasRenderingContext2D} ctx @param {string} key  e.g. 'callout POINT'
 */
function callout(ctx, key) {
  const cx = WIDTH / 2;
  if (slice(key)) sliceAt(ctx, key, cx, LAYOUT.CALLOUT_Y);
  else drawText(ctx, 'huge-red', key.replace('callout ', ''), cx, LAYOUT.CALLOUT_Y - 14, 'center');
}

/** The image in the logo slot, once loaded (null: none, or not loaded). @type {HTMLImageElement | null} */
let logo = null;

/** Load the logo if the slot is on. @param {boolean} on  LOGO.on, or ?logo=on */
export function loadLogo(on) {
  if (!on) return;
  const img = new Image();
  img.onload = () => { logo = img; };
  img.onerror = () => console.warn(`Hogg Squash: the logo slot is on but ${LOGO.url} did not load.`);
  img.src = LOGO.url;
}

/**
 * Each margin's controls, at its foot: the keys for a human, the level for the CPU.
 * @typedef {{ keys: string[][], level: number }} HelpInfo  keys: each side's lines (P1 first)
 */

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {World} w
 * @param {{ help: HelpInfo, footer: string, slow: number }} opts
 *   footer: one line under the court (pause and controller hints); slow: the ?slow factor (1: normal speed)
 */
export function drawHud(ctx, w, opts) {
  const m = w.match;

  // side margins: P1 left, P2 right
  const margin = marginW(), px = Math.round(margin / 2 - 33);
  scorePanel(ctx, w, 0, px, LAYOUT.PANEL_Y);
  scorePanel(ctx, w, 1, WIDTH - px - 66, LAYOUT.PANEL_Y);
  drawPanel(ctx, 'panel dark', px, LAYOUT.INFO_Y, 66, LAYOUT.INFO_H);
  drawText(ctx, 'small', `FIRST TO ${m.target}`, margin / 2, LAYOUT.INFO_Y + 7, 'center');
  drawText(ctx, 'small-grey', 'WIN BY 2', margin / 2, LAYOUT.INFO_Y + 17, 'center');
  if (logo) {
    const k = Math.min(1, LOGO.SIZE / logo.width, LOGO.SIZE / logo.height);
    const lw = Math.round(logo.width * k), lh = Math.round(logo.height * k);
    ctx.imageSmoothingEnabled = k < 1;                  // a big file is shrunk smoothly; one made to size stays 1:1
    ctx.drawImage(logo, Math.round(WIDTH - margin / 2 - lw / 2), LAYOUT.INFO_Y, lw, lh);
    ctx.imageSmoothingEnabled = false;
  }
  for (const side of [0, 1]) {
    const cx = side === 0 ? margin / 2 : WIDTH - margin / 2;
    const lines = w.cpu[side] ? ['CPU', `level ${opts.help.level}`] : opts.help.keys[side];
    lines.forEach((l, i) => drawText(ctx, i === 0 ? 'small' : 'small-grey', l, cx, LAYOUT.KEYS_Y + i * 11, 'center'));
  }
  drawText(ctx, 'small-grey', opts.footer, WIDTH / 2, HEIGHT - lineHeight('small') - 1, 'center');
  // bottom-left: the bottom-right corner holds the version (main.js)
  if (opts.slow > 1) drawText(ctx, 'small-red', `SLOW x${opts.slow}`, 4, HEIGHT - lineHeight('small') - 1);

  // front wall
  const cx = WIDTH / 2;
  if (w.phase === 'point' && w.result) {
    if (w.timer < TIMING.CALLOUT) {
      callout(ctx, CALLOUTS[w.result.reason]);
      drawText(ctx, 'small-dark', `${name(w, w.result.winner)}'s point`, cx, LAYOUT.NOTE_Y, 'center');
    } else {
      callout(ctx, 'callout POINT');
      drawText(ctx, 'large-red', `${m.scores[0]} – ${m.scores[1]}`, cx, LAYOUT.NOTE_Y - 4, 'center');
    }
  } else if (w.phase === 'over' && m.winner !== null) {
    callout(ctx, 'callout GAME');               // the result screen (js/ui/result.js) says who won
  } else if (w.phase === 'serve') {
    drawText(ctx, 'small-dark', `${name(w, m.server)} to serve`, cx, LAYOUT.NOTE_Y, 'center');
  }

}
