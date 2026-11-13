// @ts-check
// The result screen: the match as it ended (the HUD has GAME on the front wall, and the scores in the margins), with a
// dark panel over the floor saying who won by how much ("RONIN WINS 9–5": the winner's name as the HUD shows it, in
// capitals), and Rematch (the same settings and characters) or Menu; in a tournament, Back to the bracket.
import { WIDTH } from '../engine/screen.js';
import { drawText, textWidth } from '../render/text.js';
import { drawPanel } from '../render/ui.js';
import { drawList, BAR } from './menu.js';
import { resultItems } from './screens.js';

export const RESULT_HINT = 'Up / down: choose     Enter or A: OK';
/** …while the touch controls show. */
export const RESULT_TOUCH_HINT = 'Tap one to choose it';
/** …in a tournament (one item). */
export const RESULT_TOUR_HINT = 'Enter or A: OK';

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
 * …in a tournament: the round and length, and, after a human's loss to a bot, that it's to be played again.
 * @param {NonNullable<import('./screens.js').TourUi['last']>} last
 */
export const tourLine = last => `TOURNAMENT, ${last.info.name}, FIRST TO ${last.info.length}${
  last.outcome === 'replay' ? ': PLAY IT AGAIN FROM THE BRACKET' : ''}`;

/**
 * @param {CanvasRenderingContext2D} ctx @param {import('./screens.js').Ui} ui
 * @param {import('../sim/world.js').World} world
 * @param {string[]} names  each side's name
 */
export function drawResult(ctx, ui, world, names) {
  const cx = WIDTH / 2, y = 168, head = resultLine(world, names);
  const items = resultItems(ui), last = ui.tour.match ? ui.tour.last : null;
  const line = last ? tourLine(last) : matchLine(ui.settings);
  const w = Math.max(textWidth('large-white', head), textWidth('small', RESULT_HINT), textWidth('small-grey', line),
    ...items.map(it => textWidth('large-white', it) + 2 * BAR.PAD)) + 48;
  const listY = y + 44, h = 44 + items.length * BAR.ROW + 22;
  drawPanel(ctx, 'panel dark', Math.round(cx - w / 2), y, w, h);
  drawText(ctx, 'large-white', head, cx, y + 8, 'center');
  drawText(ctx, 'small-grey', line, cx, y + 30, 'center');
  drawList(ctx, items, ui.sel, cx, listY, { font: 'large-white', center: true });
  drawText(ctx, 'small-grey', ui.touch ? RESULT_TOUCH_HINT : last ? RESULT_TOUR_HINT : RESULT_HINT, cx, y + h - 16, 'center');
}
