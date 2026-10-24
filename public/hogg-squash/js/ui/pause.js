// @ts-check
// The pause menu, on a dark panel over the front wall: Resume / Restart match / Sound on/off / Quit to title. Esc, Start or B
// resumes as well. The match stays drawn (and still) behind it.
import { WIDTH } from '../engine/screen.js';
import { drawText, textWidth } from '../render/text.js';
import { drawPanel } from '../render/ui.js';
import { drawList, BAR } from './menu.js';
import { PAUSE_ITEMS, pauseLabels } from './screens.js';

export const PAUSE_HINT = 'Esc or Start: resume';
/** …while the touch controls show. */
export const PAUSE_TOUCH_HINT = 'Tap one to choose it';

/** @param {CanvasRenderingContext2D} ctx @param {import('./screens.js').Ui} ui */
export function drawPause(ctx, ui) {
  const cx = WIDTH / 2, y = 40;
  const items = pauseLabels(ui);
  const w = Math.max(...items.map(it => textWidth('large-white', it))) + 2 * BAR.PAD + 40;
  const listY = y + 36, h = 36 + PAUSE_ITEMS.length * BAR.ROW + 22;
  drawPanel(ctx, 'panel dark', Math.round(cx - w / 2), y, w, h);
  drawText(ctx, 'large-red', 'PAUSED', cx, y + 8, 'center');
  drawList(ctx, items, ui.sel, cx, listY, { font: 'large-white', center: true });
  drawText(ctx, 'small-grey', ui.touch ? PAUSE_TOUCH_HINT : PAUSE_HINT, cx, y + h - 16, 'center');
}
