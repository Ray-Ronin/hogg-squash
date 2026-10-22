// @ts-check
// Drawing shared by the menu screens: a column of items or a row of numbers in the large font, the selected one on
// A5's highlight bar with the cursor beside it (docs/art-style-guide.md §3). Without the UI sheet the bar is a plain
// red box, so the selection still shows.
import { drawText, textWidth } from '../render/text.js';
import { drawSlice, drawPanel, slice } from '../render/ui.js';

/** @typedef {import('../render/text.js').FontName} FontName */

/** The bar reaches PAD px beyond the text each side and is H px tall from 2 px above the line (the large capitals with
 * their outline and shadow are 17 px, so they sit in its middle). Rows of large text are ROW px apart. */
export const BAR = { PAD: 6, H: 21, ROW: 24 };

/**
 * The cursor pointing at x from the left (dir 1) or, mirrored, from the right (dir -1), centred on a large line at y.
 * @param {CanvasRenderingContext2D} ctx @param {number} x @param {number} y @param {1 | -1} dir
 */
export function drawCursor(ctx, x, y, dir) {
  const c = slice('cursor');
  if (c) drawSlice(ctx, 'cursor', dir === 1 ? x - c.w : x, Math.round(y) - 2 + Math.floor((BAR.H - c.h) / 2), dir === -1);
}

/**
 * The highlight bar behind a large-font item whose text starts at x, y and is w wide, with the cursor to its left
 * unless `cursor` is false.
 * @param {CanvasRenderingContext2D} ctx @param {number} x @param {number} y @param {number} w @param {boolean} [cursor]
 */
export function drawHighlight(ctx, x, y, w, cursor = true) {
  const bx = Math.round(x) - BAR.PAD, by = Math.round(y) - 2, bw = Math.round(w) + 2 * BAR.PAD;
  if (slice('highlight')) drawPanel(ctx, 'highlight', bx, by, bw, BAR.H);
  else {
    ctx.fillStyle = '#c8102e';
    ctx.fillRect(bx, by, bw, BAR.H);
  }
  if (cursor) drawCursor(ctx, bx - 2, y, 1);
}

/**
 * A column of items, left-aligned at x (or centred on x), the first line's top at y; the selected one is white on
 * the bar, the others in `font` (large-red on the white wall, large-white on a dark panel).
 * @param {CanvasRenderingContext2D} ctx @param {string[]} items @param {number} sel @param {number} x @param {number} y
 * @param {{ font?: FontName, center?: boolean }} [o]
 */
export function drawList(ctx, items, sel, x, y, { font = 'large-red', center = false } = {}) {
  items.forEach((item, i) => {
    const w = textWidth('large-white', item), lx = center ? Math.round(x - w / 2) : x, ly = y + i * BAR.ROW;
    if (i === sel) drawHighlight(ctx, lx, ly, w);
    drawText(ctx, i === sel ? 'large-white' : font, item, lx, ly);
  });
}

/**
 * A row of short items (the match lengths, the levels) centred on cx, `gap` px apart; the selected one on the bar,
 * and a cursor at each end of the row pointing in (left / right moves along it).
 * @param {CanvasRenderingContext2D} ctx @param {string[]} items @param {number} sel @param {number} cx @param {number} y
 * @param {{ font?: FontName, gap?: number }} [o]
 */
export function drawRow(ctx, items, sel, cx, y, { font = 'large-red', gap = 18 } = {}) {
  const widths = items.map(it => textWidth('large-white', it));
  const total = widths.reduce((a, b) => a + b, 0) + gap * (items.length - 1);
  let x = Math.round(cx - total / 2);
  drawCursor(ctx, x - BAR.PAD - 4, y, 1);
  drawCursor(ctx, x + total + BAR.PAD + 4, y, -1);
  items.forEach((item, i) => {
    if (i === sel) drawHighlight(ctx, x, y, widths[i], false);
    drawText(ctx, i === sel ? 'large-white' : font, item, x, y);
    x += widths[i] + gap;
  });
}
