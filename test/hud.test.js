// The court, ball and HUD art the game draws (node:test, run by npm test): fx.json, font.json and ui.json read the way
// the game reads them, the ball size picked by depth, every callout and panel the HUD uses, and every character of the
// HUD's own text in the font it is drawn with. text.js, ui.js and fx.js only touch a canvas when drawing.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parseFx, ballFrame, nearest } from '../public/hogg-squash/js/render/fx.js';
import { parseFonts, measureWith, glyphFor } from '../public/hogg-squash/js/render/text.js';
import { parseSlices } from '../public/hogg-squash/js/render/ui.js';
import { CALLOUTS } from '../public/hogg-squash/js/render/hud.js';
import { project } from '../public/hogg-squash/js/render/projection.js';

const read = (/** @type {string} */ f) => JSON.parse(fs.readFileSync(`public/hogg-squash/assets/${f}`, 'utf8'));
const fx = parseFx(read('fx.json'));
const fonts = parseFonts(read('font.json'));
const slices = parseSlices(read('ui.json'));

test('fx.json: every tag the game draws, with its frames and numbers', () => {
  assert.deepEqual(Object.keys(fx.tags).sort(), ['ball', 'landing', 'ring', 'shadow', 'sparkle']);
  assert.deepEqual(fx.tags.ball.data, [3, 4, 5, 6, 7]);
  assert.deepEqual(fx.tags.landing.data, [40, 80, 115, 145, 172]);
  assert.equal(fx.tags.shadow.frames.length, fx.tags.ball.frames.length);
  assert.equal(fx.tags.ring.frames.length, 6);
  assert.equal(fx.tags.sparkle.frames.length, 4);
  assert.deepEqual(fx.centre, { x: 24, y: 24 });
});

test('the ball size by depth: 3 px below z 36, 4 to 103, 5 to 145, 6 to 174, 7 beyond (A4), growing with z', () => {
  const d = (/** @type {number} */ z) => fx.tags.ball.data[ballFrame(fx, 2 * Math.max(1, 0.05 * project(0, 0, z).scale))];
  const at = [[0, 3], [35, 3], [37, 4], [102, 4], [104, 5], [144, 5], [146, 6], [173, 6], [175, 7], [183, 7]];
  for (const [z, px] of at) assert.equal(d(z), px, `z ${z}`);
  for (let z = 1; z <= 183; z++) assert.ok(d(z) >= d(z - 1), `never shrinks going back (z ${z})`);
  assert.equal(nearest([40, 80, 115], 59), 0);
  assert.equal(nearest([40, 80, 115], 61), 1);
});

test('ui.json: the score panels with their parts, the serve tag, the panels and every callout', () => {
  for (const p of ['p1', 'p2']) {
    for (const part of ['', ' name', ' score', ' serve']) assert.ok(slices[`score panel ${p}${part}`], `${p}${part}`);
    assert.equal(slices[`score panel ${p}`].w, 66);
  }
  for (const name of ['serve', 'panel dark', 'callout POINT', 'callout GAME']) assert.ok(slices[name], name);
  assert.ok(slices['panel dark'].center, 'panel dark is a 9-slice');
  for (const key of Object.values(CALLOUTS)) assert.ok(slices[key], key);
  assert.equal(CALLOUTS.notUp, 'callout DOUBLE BOUNCE');
  assert.equal(slices['callout DOUBLE BOUNCE'].h, 52);
  // every callout fits on the 220 px front wall, above the service line (y 139) when centred at y 88
  for (const key of Object.keys(slices).filter(k => k.startsWith('callout '))) {
    assert.ok(slices[key].w <= 220 && 88 + slices[key].h / 2 <= 139, key);
  }
});

test('the font has every character of the HUD text, and measures it', () => {
  /** [font, text] the HUD draws (numbers stand for any score or level; the screens' own text: screens.test.js). */
  const used = [
    ['large-white', 'P1 P2 CPU'], ['large-red', 'P2 CPU 0 – 10'],
    ['huge-white', '0123456789'], ['small', "FIRST TO 11 P1 keys WASD move CPU MISS (any button joins)"],
    ['small-grey', 'WIN BY 2 F hard G soft arrows move Num0 hard Num. soft level 9 Esc pause Controllers: A hard B/X soft'],
    ['small-dark', "P1's point CPU to serve MISS"], ['small-red', 'P1 SLOW x4'],
  ];
  for (const [font, text] of used) {
    for (const ch of text) if (ch !== ' ') assert.ok(glyphFor(fonts[font], ch), `${font} has ${ch}`);
  }
  const small = fonts.small;
  assert.equal(measureWith(fonts, 'small', ''), 0);
  assert.equal(measureWith(fonts, 'small', 'I'), small.glyphs.I[2]);
  assert.equal(measureWith(fonts, 'small', 'I I'), 2 * small.glyphs.I[2] + small.space + 2 * small.spacing);
  assert.ok(measureWith(fonts, 'small', 'Esc pause     Controllers: A hard  B/X soft  Start pause  (any button joins)') <= 560,
    'the footer fits under the court');
});

test('S12: the point flash lights the scorer\'s side only, once, fading out over POINT_FLASH frames', async () => {
  const { pointFlash, POINT_FLASH } = await import('../public/hogg-squash/js/render/hud.js');
  const w = /** @type {any} */ ({ phase: 'point', result: { winner: 1 }, timer: 0 });
  assert.equal(pointFlash(w, 1), 1);
  assert.equal(pointFlash(w, 0), 0, 'not the loser');
  let prev = 1;
  for (let t = 1; t <= POINT_FLASH; t++) {
    const f = pointFlash({ ...w, timer: t }, 1);
    assert.ok(f < prev, `fades (t ${t})`);
    prev = f;
  }
  assert.equal(prev, 0, 'gone by POINT_FLASH');
  assert.equal(pointFlash({ ...w, phase: 'serve' }, 1), 0, 'only after a point');
});
