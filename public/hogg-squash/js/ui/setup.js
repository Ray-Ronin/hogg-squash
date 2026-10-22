// @ts-check
// The setup screens on the title art: the match length (first to 5 / 7 / 9 / 11) and, in 1P, the level (1–9). Each is
// a row of numbers in the title's menu area under a heading, with a line saying what the choice means.
import { drawText } from '../render/text.js';
import { MATCH_LENGTHS } from '../sim/match.js';
import { LEVELS, DEFAULT_LEVEL } from '../sim/difficulty.js';
import { drawRow } from './menu.js';
import { MENU, drawTitleBack, drawHint } from './title.js';

export const SETUP_HINT = 'Left / right: choose     Enter or A: OK     Esc or B: back';
/** …while the touch controls show. */
export const SETUP_TOUCH_HINT = 'Tap a number to choose it     SOFT: back';

/** What a level means, for the line under the row (the level sets the CPU's skill and, in 1P, the game's pace). @param {number} level */
export function levelNote(level) {
  if (level === LEVELS[0]) return 'the slowest game and the gentlest CPU';
  if (level === LEVELS[LEVELS.length - 1]) return 'the fastest game and the toughest CPU';
  if (level === DEFAULT_LEVEL) return 'the normal pace';
  return level < DEFAULT_LEVEL ? 'a slower game and an easier CPU' : 'a faster game and a sharper CPU';
}

/** @param {number} target */
export const lengthNote = target => `First to ${target} points, win by 2`;

/** @param {import('./screens.js').Settings} s */
export const modeLine = s => (s.players === 1 ? '1 PLAYER VS CPU' : '2 PLAYERS');

/**
 * The match length or level screen.
 * @param {CanvasRenderingContext2D} ctx @param {import('./screens.js').Ui} ui
 */
export function drawSetup(ctx, ui) {
  const cx = MENU.x + MENU.w / 2, s = ui.settings, length = ui.screen === 'length';
  drawTitleBack(ctx);
  drawText(ctx, 'small-dark', length ? modeLine(s) : `${modeLine(s)}, FIRST TO ${s.target}`, cx, MENU.y + 2, 'center');
  drawText(ctx, 'large-red', length ? 'MATCH LENGTH' : 'LEVEL', cx, MENU.y + 14, 'center');
  const items = (length ? MATCH_LENGTHS : LEVELS).map(String);
  drawRow(ctx, items, ui.sel, cx, MENU.y + 46, { gap: length ? 24 : 14 });
  const sel = Number(items[ui.sel]);
  drawText(ctx, 'small-dark', length ? lengthNote(sel) : `Level ${sel}: ${levelNote(sel)}`, cx, MENU.y + 78, 'center');
  drawHint(ctx, ui.touch ? SETUP_TOUCH_HINT : SETUP_HINT);
}
