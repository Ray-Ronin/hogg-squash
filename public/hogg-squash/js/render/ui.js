// @ts-check
// A5's HUD pieces (assets/ui.png + ui.json; docs/art-style-guide.md §3): named slices of one sheet, drawn 1:1, and the
// 9-slice panels stretched to any size (the corners and edges stay crisp, the middle repeats). Nothing is drawn until
// useUi has the sheet, so the HUD's text still shows if it fails to load.

/**
 * @typedef {{ x: number, y: number, w: number, h: number }} Rect
 * @typedef {Rect & { center: Rect | null }} Slice  center: the 9-slice middle, relative to the slice
 */

/** @type {{ image: CanvasImageSource, slices: Record<string, Slice> } | null} */
let loaded = null;

/**
 * The slices of an Aseprite JSON export (their first key), by name.
 * @param {any} json
 * @returns {Record<string, Slice>}
 */
export function parseSlices(json) {
  const list = json?.meta?.slices;
  if (!Array.isArray(list)) throw new Error('ui.json: no slices');
  /** @type {Record<string, Slice>} */
  const out = {};
  for (const s of list) out[s.name] = { ...s.keys[0].bounds, center: s.keys[0].center ?? null };
  return out;
}

/** Draw the HUD pieces from this sheet from now on. @param {CanvasImageSource} image @param {any} json  ui.json */
export function useUi(image, json) {
  loaded = { image, slices: parseSlices(json) };
}

/** A slice's rectangle on the sheet (null before loading or if missing). @param {string} name */
export function slice(name) {
  return loaded?.slices[name] ?? null;
}

/**
 * Draw a slice 1:1 with its top-left at x, y.
 * @param {CanvasRenderingContext2D} ctx @param {string} name @param {number} x @param {number} y
 */
export function drawSlice(ctx, name, x, y) {
  const s = slice(name);
  if (!loaded || !s) return;
  ctx.drawImage(loaded.image, s.x, s.y, s.w, s.h, Math.round(x), Math.round(y), s.w, s.h);
}

/**
 * Draw a 9-slice panel stretched to w × h: the corners as they are, the edges and middle tiled (not scaled, so the
 * pixels stay square).
 * @param {CanvasRenderingContext2D} ctx @param {string} name @param {number} x @param {number} y @param {number} w @param {number} h
 */
export function drawPanel(ctx, name, x, y, w, h) {
  const s = slice(name);
  if (!loaded || !s || !s.center) return;
  const img = loaded.image, c = s.center;
  x = Math.round(x); y = Math.round(y);
  const cols = [[0, c.x], [c.x, c.w], [c.x + c.w, s.w - c.x - c.w]];   // [offset in slice, size] left, middle, right
  const rows = [[0, c.y], [c.y, c.h], [c.y + c.h, s.h - c.y - c.h]];
  const midW = w - cols[0][1] - cols[2][1], midH = h - rows[0][1] - rows[2][1];
  /** The destination spans for each column / row: [start, length]. */
  const spans = (/** @type {number[][]} */ parts, /** @type {number} */ mid) =>
    [[0, parts[0][1]], [parts[0][1], mid], [parts[0][1] + mid, parts[2][1]]];
  const dc = spans(cols, midW), dr = spans(rows, midH);
  for (let r = 0; r < 3; r++) {
    for (let k = 0; k < 3; k++) {
      const [sx, sw] = cols[k], [sy, sh] = rows[r], [dx, dw] = dc[k], [dy, dh] = dr[r];
      for (let ty = 0; ty < dh; ty += sh) {
        for (let tx = 0; tx < dw; tx += sw) {
          const cw = Math.min(sw, dw - tx), ch = Math.min(sh, dh - ty);
          ctx.drawImage(img, s.x + sx, s.y + sy, cw, ch, x + dx + tx, y + dy + ty, cw, ch);
        }
      }
    }
  }
}
