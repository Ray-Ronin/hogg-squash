// @ts-check
// The result screen: the match as it ended (the HUD has GAME on the front wall, and the scores in the margins), with a
// dark panel over the floor saying who won by how much ("RONIN WINS 9–5": the winner's name as the HUD shows it, in
// capitals), and Rematch (the same settings and characters) or Menu.
import { WIDTH } from '../engine/screen.js';
import { drawText, textWidth } from '../render/text.js';
import { drawPanel } from '../render/ui.js';
import { drawList, BAR } from './menu.js';
import { RESULT_ITEMS } from './screens.js';

export const RESULT_HINT = 'Up / down: choose     Enter or A: OK';
/** …while the touch controls show. */
export const RESULT_TOUCH_HINT = 'Tap one to choose it';

/**
 * The panel's heading: who won and the final score, winner's first ("RONIN WINS 9–5", or "P1 WINS 9–5").
 * @param {import('../sim/world.js').World} w
 * @param {string[]} names  each side's name, as the HUD shows them (roster.js, sideNames)
 */
export function resultLine(w, names) {
  const m = w.match;
  if (m.winner === null) return '';
  return `${names[m.winner].toUpperCase()} WINS ${m.scores[m.winner]}–${m.scores[1 - m.winner]}`;
}

/** The small line under it: the match that was played. @param {import('./screens.js').Settings} s */
export const matchLine = s => (s.players === 1 ? `1 PLAYER, LEVEL ${s.level}, FIRST TO ${s.target}` : `2 PLAYERS, FIRST TO ${s.target}`);

/**
 * @param {CanvasRenderingContext2D} ctx @param {import('./screens.js').Ui} ui
 * @param {import('../sim/world.js').World} world
 * @param {string[]} names  each side's name
 */
export function drawResult(ctx, ui, world, names) {
  const cx = WIDTH / 2, y = 168, head = resultLine(world, names);
  const w = Math.max(textWidth('large-white', head), textWidth('small', RESULT_HINT)) + 48;
  const listY = y + 44, h = 44 + RESULT_ITEMS.length * BAR.ROW + 22;
  drawPanel(ctx, 'panel dark', Math.round(cx - w / 2), y, w, h);
  drawText(ctx, 'large-white', head, cx, y + 8, 'center');
  drawText(ctx, 'small-grey', matchLine(ui.settings), cx, y + 30, 'center');
  drawList(ctx, RESULT_ITEMS, ui.sel, cx, listY, { font: 'large-white', center: true });
  drawText(ctx, 'small-grey', ui.touch ? RESULT_TOUCH_HINT : RESULT_HINT, cx, y + h - 16, 'center');
}
