// @ts-check
// The title screen: A5's title art (assets/title.png: the front wall, the HOGG SQUASH lettering and the school's
// shield) with 1 PLAYER / 2 PLAYERS / OPTIONS in its menu area (MENU: the `menu` slice in art/ui/title.aseprite), and
// the keys on the red band under the wall. The setup, options and key test screens draw on the same background.
// Without the image the screen is the margin colour with the name in the large font.
import { WIDTH } from '../engine/screen.js';
import { drawText } from '../render/text.js';
import { drawList } from './menu.js';
import { TITLE_ITEMS } from './screens.js';

/** The title art's menu area (x 44–350, y 196–292). */
export const MENU = { x: 44, y: 196, w: 306, h: 96 };
/** The hint line's top, on the red band under the wall (y 296–322). */
const HINT_Y = 305;

export const TITLE_HINT = 'Up / down: choose     Enter or A: OK';

/** The title image, once loaded. @type {CanvasImageSource | null} */
let image = null;

/** Draw the title art from now on. @param {CanvasImageSource} img */
export function useTitle(img) {
  image = img;
}

/** The title art (or its stand-in). @param {CanvasRenderingContext2D} ctx */
export function drawTitleBack(ctx) {
  if (image) {
    ctx.drawImage(image, 0, 0);
    return;
  }
  ctx.fillStyle = '#16161a';
  ctx.fillRect(0, 0, WIDTH, 360);
  drawText(ctx, 'huge-red', 'HOGG SQUASH', MENU.x + MENU.w / 2, 90, 'center');
}

/** A line of keys on the red band. @param {CanvasRenderingContext2D} ctx @param {string} str */
export function drawHint(ctx, str) {
  drawText(ctx, 'small', str, WIDTH / 2, HINT_Y, 'center');
}

/** @param {CanvasRenderingContext2D} ctx @param {import('./screens.js').Ui} ui */
export function drawTitle(ctx, ui) {
  drawTitleBack(ctx);
  drawList(ctx, TITLE_ITEMS, ui.sel, MENU.x + 40, MENU.y + 12);
  drawHint(ctx, TITLE_HINT);
}
