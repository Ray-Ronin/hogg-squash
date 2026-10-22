// @ts-check
// A4's effects sheet (assets/fx.png + fx.json; docs/art-style-guide.md §3): the ball in five sizes, its shadow, the
// landing marker, the front-wall ring and the contact sparkle. Every frame is 48×48 with the item centred on the
// `centre` slice pixel, so a frame is drawn with that pixel on the pixel holding the item's screen point, 1:1.
// Until useFx has the sheet (or if it fails to load) hasFx() is false and the callers draw the code shapes instead.

/**
 * @typedef {{ x: number, y: number, w: number, h: number }} Rect
 * @typedef {{ frames: Rect[], data: number[] }} FxTag  data: the tag's numbers (ball diameters, landing depths)
 * @typedef {{ tags: Record<string, FxTag>, centre: { x: number, y: number } }} FxSheet
 */

/** @type {(FxSheet & { image: CanvasImageSource }) | null} */
let loaded = null;

/**
 * Read fx.json: each tag's frames in order, the numbers in its data ("d=3,4,5,6,7" → [3, 4, 5, 6, 7]), and the centre.
 * @param {any} json
 * @returns {FxSheet}
 */
export function parseFx(json) {
  const frames = json?.frames, tags = json?.meta?.frameTags;
  if (!Array.isArray(frames) || !Array.isArray(tags)) throw new Error('fx.json: no frames or tags');
  /** @type {Record<string, FxTag>} */
  const out = {};
  for (const t of tags) {
    const data = typeof t.data === 'string' && t.data.includes('=') ? t.data.split('=')[1].split(',').map(Number) : [];
    out[t.name] = { frames: frames.slice(t.from, t.to + 1).map((/** @type {any} */ f) => f.frame), data };
  }
  const c = json.meta.slices?.find((/** @type {any} */ s) => s.name === 'centre');
  if (!c) throw new Error('fx.json: no centre slice');
  return { tags: out, centre: { x: c.keys[0].bounds.x, y: c.keys[0].bounds.y } };
}

/** Draw the effects from this sheet from now on. @param {CanvasImageSource} image @param {any} json  fx.json */
export function useFx(image, json) {
  loaded = { image, ...parseFx(json) };
}

/** Whether the sheet is loaded. */
export const hasFx = () => loaded !== null;

/**
 * The index of the value in a sorted list nearest to v (the first of a tie).
 * @param {number[]} list @param {number} v
 */
export function nearest(list, v) {
  let best = 0;
  list.forEach((x, i) => { if (Math.abs(x - v) < Math.abs(list[best] - v)) best = i; });
  return best;
}

/**
 * The ball frame for a drawn diameter (the code's 0.05 m ball at that depth): the nearest of the tag's sizes, so
 * 3 px below z 36, 4 to 103, 5 to 145, 6 to 174, 7 beyond. The shadow uses the same index.
 * @param {FxSheet} sheet @param {number} diameter  px, unrounded
 */
export function ballFrame(sheet, diameter) {
  return nearest(sheet.tags.ball.data, diameter);
}

/** The loaded sheet (null before loading), for the frame pickers. */
export const fxSheet = () => loaded;

/**
 * Draw frame n of a tag centred on a screen point.
 * @param {CanvasRenderingContext2D} ctx @param {string} tag @param {number} n @param {number} sx @param {number} sy
 */
export function drawFx(ctx, tag, n, sx, sy) {
  if (!loaded) return;
  const frames = loaded.tags[tag].frames, f = frames[Math.max(0, Math.min(frames.length - 1, n))];
  ctx.drawImage(loaded.image, f.x, f.y, f.w, f.h,
    Math.floor(sx) - loaded.centre.x, Math.floor(sy) - loaded.centre.y, f.w, f.h);   // the centre pixel holds the point
}
