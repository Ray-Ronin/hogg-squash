// @ts-check
// The title screen: A5's title art (assets/title.png: the front wall, the HOGG SQUASH lettering and the school's
// shield) with 1 PLAYER / 2 PLAYERS / OPTIONS / GO TO HOME (back to the website) in its menu area (MENU: the
// `menu` slice in art/ui/title.aseprite), and the keys on the red band under the wall (while the touch controls show,
// 2P is faded and the band says why). The setup, options and key test screens draw on the same background.
// A small "How to play" card sits beside the menu, between it and the shield (S12), and a gamepad-only player is told
// to press a key or tap for sound (S13).
// Without the image the screen is the margin colour with the name in the large font.
import { WIDTH } from '../engine/screen.js';
import { drawText, lineHeight } from '../render/text.js';
import { drawPanel } from '../render/ui.js';
import { drawList } from './menu.js';
import { TITLE_ITEMS, TOUCH_2P_NOTE, titleOff } from './screens.js';

/** The title art's menu area (x 44–350, y 196–292). */
export const MENU = { x: 44, y: 196, w: 306, h: 96 };
/** The menu's first row, from the top of the menu area (four rows 24 px apart fill it). */
export const TITLE_TOP = 2;
/** The hint line's top, on the red band under the wall (y 296–322). */
const HINT_Y = 305;

export const TITLE_HINT = 'Up / down: choose     Enter or A: OK';

/** The "How to play" card: its lines (the first is the heading) and its place, right of the menu's widest item
 * (GO TO HOME's bar ends at x 198) and clear of the shield. */
export const HOW_TO_PLAY = {
  lines: ['HOW TO PLAY', 'Run to the landing marker', 'HARD: a fast, deep shot', 'SOFT: a short drop',
    'Hit early or late to angle it'],
  x: 210, y: 214, w: 152, ROW: 11,
};

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

/** The note for someone who has only used a gamepad: the browser needs a key, click or tap before it allows sound
 * (S13). Its middle: under the red band, clear of the menu, the How to play card and the shield. */
export const SOUND_NOTE = { text: 'Press a key or tap for sound', x: WIDTH / 2, y: 330 };

/**
 * @param {CanvasRenderingContext2D} ctx @param {import('./screens.js').Ui} ui
 * @param {boolean} [soundNote]  show SOUND_NOTE (sound is still locked and a pad has been used)
 */
export function drawTitle(ctx, ui, soundNote = false) {
  drawTitleBack(ctx);
  drawList(ctx, TITLE_ITEMS, ui.sel, MENU.x + 40, MENU.y + TITLE_TOP, { off: titleOff(ui) });
  const c = HOW_TO_PLAY, h = c.lines.length * c.ROW + 12 - (c.ROW - lineHeight('small'));
  drawPanel(ctx, 'panel dark', c.x, c.y, c.w, h);
  c.lines.forEach((l, i) => drawText(ctx, i === 0 ? 'small-red' : 'small', l, c.x + c.w / 2, c.y + 6 + i * c.ROW, 'center'));
  drawHint(ctx, ui.touch ? TOUCH_2P_NOTE : TITLE_HINT);   // touch is 1P only (2P is faded)
  if (soundNote) drawText(ctx, 'small-dark', SOUND_NOTE.text, SOUND_NOTE.x, SOUND_NOTE.y, 'center');   // on the wood
}
