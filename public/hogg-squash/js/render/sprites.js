// @ts-check
// The character sprites: Aseprite's JSON (frames, durations, tags, the feet slice) read into a Sheet, one atlas per
// kit (P2 / CPU recoloured once at load), and a per-player animation player that is stepped once per sim step.
//
// Timing is in sim frames, never wall-clock time. Each tag's frame durations (ms) become sim-frame start times
// (rounded to the nearest of the sim's 57.4 Hz frames), so a slowed or frozen sim slows or freezes the animation too.
// A swing or dive doesn't keep its own clock: it shows the frame for the sim's swing.t (frames since the press), so
// the tag's contact frame is on screen on the very step the racket meets the ball. sprites.test.js checks that each
// tag's contact frame starts on SWING.CONTACT / DIVE.CONTACT and that its length is the sim's.
//
// What plays (stepAnimator): a swing or dive (forehand / backhand by the sim's hand; the dive mirrored for a backhand)
// > the serve (from its contact frame: the sim launches the ball on the press, with no wind-up) > running (run_side,
// mirrored for left; run_up toward the front wall; run_down) > ready. `overhead` is in the sheet but unused: the sim's
// hand is only fore or back.
//
// Drawing (drawSprite): the 100 px art scaled to the height heightAt gives, with smoothing on (docs/decisions.md,
// "Sprites: one 100 px sheet, scaled smoothly"), the feet pivot on the projected feet point. Mirrored tags flip about
// the pivot, not the frame centre. The size comes from the depth alone, so a change of size never restarts a tag.
// Node can import this file: only buildAtlas and drawSprite touch a canvas, and only when called.
import { SIM_HZ } from '../engine/loop.js';
import { FP } from '../squash-physics.js';

/** The art's character height in px (head to soles, the ready pose): drawn 1:1 when heightAt gives this. */
export const ART_HEIGHT = 100;

/** Sim-frame length in ms. */
export const MS_PER_FRAME = 1000 / SIM_HZ;

/**
 * P2 / CPU kit (docs/art-style-guide.md §2): these palette entries are recoloured, and nothing else.
 * Hogg red → white, the black stays.
 */
export const KIT_SWAP = /** @type {const} */ ([
  ['#4a0610', '#5a5962'],   // red 1 → grey 1
  ['#7a0a14', '#8a8a94'],   // red 2 → grey 2
  ['#a50d26', '#b4b4bc'],   // tin → grey 3
  ['#c8102e', '#e6e6ea'],   // Hogg red → white kit shade
  ['#e8202a', '#f4f4f0'],   // kit red → front wall
  ['#ff5a52', '#ffffff'],   // red highlight → white
]);

/** Movement in game units per step above this is a teleport (a new rally's setup), not running. */
const TELEPORT = 8;

/** Steps a runner may stand still before showing ready: the CPU can stop for a frame or two near its spot. */
const RUN_HOLD = 3;

/**
 * @typedef {object} Tag
 * @property {string} name
 * @property {number} from      first frame in the sheet
 * @property {number} count     frames in the tag
 * @property {boolean} once     plays once and holds its last frame (Aseprite "repeat": "1"), else loops
 * @property {number | null} contact  the contact frame within the tag (from "data": "contact=<n>"), 0-based
 * @property {number[]} starts  each frame's start in sim frames from the start of the tag
 * @property {number} length    the tag's length in sim frames
 */

/**
 * @typedef {object} Sheet
 * @property {number} frameW
 * @property {number} frameH
 * @property {{ x: number, y: number }} pivot  the ground point between the feet, in frame pixels (continuous: x is the
 *   pivot pixel's centre, y the bottom edge of the pivot pixel's row, i.e. the line the soles stand on)
 * @property {{ x: number, y: number, ms: number }[]} frames  each frame's place in the PNG and its duration
 * @property {Record<string, Tag>} tags
 */

/**
 * Read Aseprite's JSON (array format, with frameTags and the `feet` slice).
 * @param {any} json
 * @returns {Sheet}
 */
export function parseSheet(json) {
  const frames = json.frames.map((/** @type {any} */ f) => ({ x: f.frame.x, y: f.frame.y, ms: f.duration }));
  const { w: frameW, h: frameH } = json.frames[0].sourceSize;
  const feet = json.meta.slices.find((/** @type {any} */ s) => s.name === 'feet');
  if (!feet) throw new Error('sheet has no feet slice');
  const k = feet.keys[0];
  const pivot = { x: k.bounds.x + k.pivot.x + 0.5, y: k.bounds.y + k.pivot.y + 1 };
  /** @type {Record<string, Tag>} */
  const tags = {};
  for (const t of json.meta.frameTags) {
    const count = t.to - t.from + 1;
    const starts = [];
    let ms = 0;
    for (let i = 0; i < count; i++) {
      starts.push(Math.round(ms / MS_PER_FRAME));
      ms += frames[t.from + i].ms;
    }
    const m = /contact=(\d+)/.exec(t.data ?? '');
    tags[t.name] = {
      name: t.name, from: t.from, count, once: t.repeat === '1', contact: m ? Number(m[1]) : null,
      starts, length: Math.round(ms / MS_PER_FRAME),
    };
  }
  return { frameW, frameH, pivot, frames, tags };
}

/**
 * The frame within a tag at sim frame t from its start (looping tags wrap; play-once tags hold their last frame).
 * @param {Tag} tag
 * @param {number} t
 * @returns {number}
 */
export function frameAt(tag, t) {
  const at = tag.once ? Math.max(0, Math.min(tag.length - 1, t)) : ((t % tag.length) + tag.length) % tag.length;
  let i = 0;
  while (i + 1 < tag.count && tag.starts[i + 1] <= at) i++;
  return i;
}

/**
 * A player's animation: the tag, sim frames since it started, and whether it's mirrored.
 * @typedef {object} Animator
 * @property {string} tag
 * @property {number} t
 * @property {boolean} mirror
 * @property {{ x: number, z: number } | null} prev  the feet at the last step (game units)
 * @property {number} still   steps without moving
 */

/** @returns {Animator} */
export function createAnimator() {
  return { tag: 'ready', t: 0, mirror: false, prev: null, still: 0 };
}

/** @param {Animator} a @param {string} tag @param {number} t @param {boolean} mirror */
function show(a, tag, t, mirror) {
  a.tag = tag;
  a.t = t;
  a.mirror = mirror;
}

/**
 * One sim step of a player's animation. Call it after stepWorld, once per step (not per drawn frame).
 * @param {Animator} a
 * @param {Sheet} sheet
 * @param {import('../sim/player.js').Player} pl
 * @param {boolean} served  this player served on this step
 */
export function stepAnimator(a, sheet, pl, served) {
  const x = pl.x / FP, z = pl.z / FP;
  let dx = a.prev ? x - a.prev.x : 0, dz = a.prev ? z - a.prev.z : 0;
  if (Math.abs(dx) > TELEPORT || Math.abs(dz) > TELEPORT) dx = dz = 0;
  a.prev = { x, z };
  const moving = dx !== 0 || dz !== 0;
  a.still = moving ? 0 : a.still + 1;

  const s = pl.swing;
  const serve = sheet.tags.serve;
  if (s) {
    const back = s.hand === 'back';
    show(a, s.kind === 'dive' ? 'dive' : back ? 'backhand' : 'forehand', s.t, s.kind === 'dive' && back);
  } else if (served) {
    show(a, 'serve', serve.starts[serve.contact ?? 0], false);
  } else if (a.tag === 'serve' && a.t + 1 < serve.length &&
             !(moving && a.t + 1 >= serve.starts[(serve.contact ?? 0) + 1])) {
    a.t++;                                      // the follow-through plays out, unless the server runs off after contact
  } else if (moving || (a.tag.startsWith('run_') && a.still <= RUN_HOLD)) {
    const running = a.tag.startsWith('run_');
    let tag = a.tag, mirror = a.mirror;
    if (moving) {
      // any sideways movement shows the side run (left = mirrored); straight up or down the court the depth runs
      tag = dx !== 0 ? 'run_side' : dz < 0 ? 'run_up' : 'run_down';
      mirror = tag === 'run_side' && dx < 0;
    }
    show(a, tag, running ? a.t + 1 : 0, mirror);   // the run tags share one clock, so turning doesn't restart the stride
  } else {
    show(a, 'ready', a.tag === 'ready' ? a.t + 1 : 0, false);
  }
}

/**
 * A sheet repacked with a transparent gutter around each frame (so smoothing never samples a neighbour), optionally
 * recoloured.
 * @typedef {{ canvas: HTMLCanvasElement, cells: { x: number, y: number }[] }} Atlas
 */

/** Transparent pixels around each frame in an atlas. */
const GUTTER = 2;

/**
 * Build one kit's atlas from the sheet's PNG. The recolouring is done once, here.
 * @param {HTMLImageElement} img
 * @param {Sheet} sheet
 * @param {readonly (readonly [string, string])[]} [swap]  colour → colour (#rrggbb), e.g. KIT_SWAP
 * @returns {Atlas}
 */
export function buildAtlas(img, sheet, swap = []) {
  const { frameW: w, frameH: h } = sheet;
  const cols = Math.max(1, Math.floor(img.width / w));
  const stepX = w + 2 * GUTTER, stepY = h + 2 * GUTTER;
  const rows = Math.ceil(sheet.frames.length / cols);
  const canvas = document.createElement('canvas');
  canvas.width = cols * stepX;
  canvas.height = rows * stepY;
  const c = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d', { willReadFrequently: swap.length > 0 }));
  const cells = sheet.frames.map((f, i) => {
    const cell = { x: (i % cols) * stepX + GUTTER, y: Math.floor(i / cols) * stepY + GUTTER };
    c.drawImage(img, f.x, f.y, w, h, cell.x, cell.y, w, h);
    return cell;
  });
  if (swap.length) {
    const rgb = (/** @type {string} */ hex) => parseInt(hex.slice(1), 16);
    const map = new Map(swap.map(([from, to]) => [rgb(from), rgb(to)]));
    const data = c.getImageData(0, 0, canvas.width, canvas.height);
    const d = data.data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] === 0) continue;
      const to = map.get((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]);
      if (to === undefined) continue;
      d[i] = to >> 16;
      d[i + 1] = (to >> 8) & 255;
      d[i + 2] = to & 255;
    }
    c.putImageData(data, 0, 0);
  }
  return { canvas, cells };
}

/**
 * Draw a player's current frame with its feet pivot on (sx, sy), scaled to h px tall, smoothing on for this draw only.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Sheet} sheet
 * @param {Atlas} atlas
 * @param {Animator} a
 * @param {number} sx  projected feet point, screen x
 * @param {number} sy  projected feet point, screen y
 * @param {number} h   character height in whole px (heightAt)
 */
export function drawSprite(ctx, sheet, atlas, a, sx, sy, h) {
  const tag = sheet.tags[a.tag];
  const cell = atlas.cells[tag.from + frameAt(tag, a.t)];
  const k = h / ART_HEIGHT;
  const { frameW: w, frameH: fh, pivot } = sheet;
  const px = a.mirror ? w - pivot.x : pivot.x;          // mirrored about the pivot: x → 2 × pivot − x
  const dx = Math.round(sx - px * k), dy = Math.round(sy - pivot.y * k);   // whole pixels: exact at 1:1
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  if (a.mirror) {
    ctx.save();
    ctx.translate(dx + w * k, dy);
    ctx.scale(-1, 1);
    ctx.drawImage(atlas.canvas, cell.x, cell.y, w, fh, 0, 0, w * k, fh * k);
    ctx.restore();
  } else {
    ctx.drawImage(atlas.canvas, cell.x, cell.y, w, fh, dx, dy, w * k, fh * k);
  }
  ctx.imageSmoothingEnabled = false;
}
