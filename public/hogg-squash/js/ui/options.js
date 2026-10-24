// @ts-check
// The options screen, on a dark panel over the title art: each player's six keys (P1 and P2 side by side, a row per
// action), then Laptop keys for P2 / Reset to defaults / Key test / Effects / Back. OK on a key waits for a new one
// (it shows "?"); a key used twice shows red, with a warning on the message line. The moves and the key taken are
// screens.js's.
// The Effects item (S13) sits above Back: left / right change the sound level, Off or 1–10.
import { WIDTH } from '../engine/screen.js';
import { drawText, textWidth } from '../render/text.js';
import { drawPanel } from '../render/ui.js';
import { ACTIONS, keyLabel, duplicates } from '../input/keymap.js';
import { drawList, drawHighlight, BAR } from './menu.js';
import { drawTitleBack } from './title.js';
import { optionLabels, KEY_CELLS, EFFECTS_SEL, keyCell } from './screens.js';

export const OPTIONS_HINT = 'Arrows: choose     Enter or A: change     Esc or B: back';
/** …while the touch controls show (the keys can't be changed by tapping: there's no keyboard to press). */
export const OPTIONS_TOUCH_HINT = 'Keys are changed on a keyboard     SOFT: back';

/** The panel, the action names' column, and the centres of P1's and P2's key columns. */
export const OPTIONS_LAYOUT = { x: 60, y: 4, w: 520, h: 352, NAMES_X: 120, COLS: [280, 420] };
/** The note line while the Effects item is selected (unless there's a message). */
export const EFFECTS_NOTE = 'Sound effects volume: Off or 1 to 10     Left / right: change';

/** The note is a warning (a refusal or a key used twice), drawn red. @param {import('./screens.js').Ui} ui */
function warning(ui) {
  return ui.note.endsWith('Press another key.') || (!ui.listen && duplicates(ui.keys).length > 0);
}

/** @param {CanvasRenderingContext2D} ctx @param {import('./screens.js').Ui} ui */
export function drawOptions(ctx, ui) {
  const L = OPTIONS_LAYOUT, cx = WIDTH / 2;
  drawTitleBack(ctx);
  drawPanel(ctx, 'panel dark', L.x, L.y, L.w, L.h);
  drawText(ctx, 'large-red', 'OPTIONS', cx, L.y + 6, 'center');
  drawText(ctx, 'small-red', 'P1', L.COLS[0], L.y + 30, 'center');
  drawText(ctx, 'small', 'P2', L.COLS[1], L.y + 30, 'center');

  const twice = new Set(duplicates(ui.keys).map(d => d.code));
  ACTIONS.forEach((action, row) => {
    const y = L.y + 42 + row * BAR.ROW;
    drawText(ctx, 'small-grey', action.toUpperCase(), L.NAMES_X, y + 6);
    ui.keys.forEach((layout, p) => {
      const sel = keyCell(ui.sel)?.action === action && ui.sel % 2 === p;
      const label = sel && ui.listen ? '?' : keyLabel(layout[action]);
      const w = textWidth('large-white', label), x = Math.round(L.COLS[p] - w / 2);
      if (sel) drawHighlight(ctx, x, y, w);
      drawText(ctx, !sel && twice.has(layout[action]) ? 'large-red' : 'large-white', label, x, y);
    });
  });

  drawList(ctx, optionLabels(ui), ui.sel - KEY_CELLS, cx, L.y + 42 + ACTIONS.length * BAR.ROW + 4,
    { font: 'large-white', center: true, base: KEY_CELLS });
  const note = ui.note || (ui.sel === EFFECTS_SEL ? EFFECTS_NOTE : '');
  drawText(ctx, warning(ui) ? 'small-red' : 'small', note, cx, L.y + L.h - 32, 'center');
  drawText(ctx, 'small-grey', ui.touch ? OPTIONS_TOUCH_HINT : OPTIONS_HINT, cx, L.y + L.h - 17, 'center');
}
