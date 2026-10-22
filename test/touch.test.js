// Touch controls (node:test, run by npm test): when they show (a touch shows them, a key or a pad hides them; no
// setting), the stick's directions, the actions and menu moves they give, 2P unavailable while they show, taps on
// menu items, and the title's RONINRAY.COM.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { makeTouchState, touchShowing, noteTouch, noteKeyOrPad, stickDirs, touchActions, touchNavs }
  from '../public/hogg-squash/js/input/touch.js';
import { makeUi, navigate, setTouch, tap, titleOff, TITLE_ITEMS, SITE_URL, OPTION_ITEMS, KEY_CELLS, TOUCH_2P_NOTE }
  from '../public/hogg-squash/js/ui/screens.js';
import { parseFonts, glyphFor, measureWith } from '../public/hogg-squash/js/render/text.js';

/** @param {any} ui @param {string[]} navs */
const run = (ui, navs) => navs.map(n => navigate(ui, /** @type {any} */ (n)));
const none = { up: false, down: false, left: false, right: false };

test('hidden at start, shown on a touch, hidden on a key or pad, shown again on the next touch', () => {
  const s = makeTouchState();
  assert.equal(touchShowing(s), false, 'a computer never sees them until it is touched');
  noteTouch(s);
  assert.equal(touchShowing(s), true);
  noteKeyOrPad(s);
  assert.equal(touchShowing(s), false);
  noteTouch(s);
  assert.equal(touchShowing(s), true);
  assert.equal(touchShowing(makeTouchState(true)), true, 'a phone-like screen shows them from the start');
  const phone = makeTouchState(true);
  noteKeyOrPad(phone);
  assert.equal(touchShowing(phone), false, 'a tablet with a keyboard: the key hides them');
});

test('the stick: a dead zone in the middle, then 8 directions', () => {
  const r = 80;
  assert.deepEqual(stickDirs(0, 0, r), none);
  assert.deepEqual(stickDirs(15, -10, r), none, 'inside the dead zone');
  assert.deepEqual(stickDirs(0, -60, r), { ...none, up: true });
  assert.deepEqual(stickDirs(60, 0, r), { ...none, right: true });
  assert.deepEqual(stickDirs(-50, 50, r), { ...none, down: true, left: true }, 'a diagonal');
  assert.deepEqual(stickDirs(60, -10, r), { ...none, right: true }, 'nearly straight right');
  assert.deepEqual(stickDirs(400, 0, r), { ...none, right: true }, 'a finger slid off the stick still counts');
});

test('touch gives the same actions as the keys, and the same menu moves as a pad', () => {
  const t = { held: { ...none, left: true }, pressed: { ...none, up: true, hard: true, soft: false, pause: false } };
  assert.deepEqual(touchActions(t), { up: false, down: false, left: true, right: false, hard: true, soft: false },
    'movement is held, HARD only on its press');
  assert.deepEqual(touchNavs(t), ['up', 'ok']);
  assert.deepEqual(touchNavs({ held: none, pressed: { ...none, hard: false, soft: true, pause: true } }), ['back', 'start']);
});

test('2P cannot be picked while the touch controls show; after a key it can', () => {
  const ui = makeUi();
  setTouch(ui, true);
  assert.deepEqual(titleOff(ui), [1]);
  run(ui, ['down']);
  assert.equal(ui.sel, 2, 'down steps over 2P');
  run(ui, ['up']);
  assert.equal(ui.sel, 0, 'and so does up');
  assert.equal(tap(ui, 1), null, 'tapping 2P does nothing');
  assert.equal(ui.screen, 'title');
  assert.equal(ui.sel, 0);
  ui.sel = 1;
  setTouch(ui, true);
  assert.equal(ui.sel, 0, 'the selection leaves 2P when touch appears');
  assert.deepEqual(run(ui, ['ok']), [null]);
  assert.equal(ui.settings.players, 1, '1P is still there');

  const back = makeUi();
  setTouch(back, true);
  setTouch(back, false);                                    // a key was pressed
  assert.deepEqual(titleOff(back), []);
  run(back, ['down', 'ok']);
  assert.equal(back.screen, 'length');
  assert.equal(back.settings.players, 2);
});

test('the options have no touch setting; RONINRAY.COM on the title goes to the website', () => {
  assert.deepEqual(OPTION_ITEMS, ['LAPTOP KEYS FOR P2', 'RESET TO DEFAULTS', 'KEY TEST', 'BACK']);
  assert.equal(TITLE_ITEMS[3], 'RONINRAY.COM');
  assert.equal(SITE_URL, 'https://roninray.com/');
  const ui = makeUi();
  assert.deepEqual(run(ui, ['up', 'ok']), [null, 'site'], 'up from 1 PLAYER wraps to it');
  assert.equal(ui.screen, 'title');
  const t = makeUi();
  setTouch(t, true);
  assert.equal(tap(t, 3), 'site', 'by tapping, too');
});

test('taps: a menu item is picked; off the items, the controllers screen plays and the key test goes back', () => {
  const ui = makeUi();
  assert.equal(tap(ui, null), null, 'a tap beside the title menu does nothing');
  tap(ui, 0);
  assert.equal(ui.screen, 'length');
  tap(ui, 3);                                               // first to 11
  assert.equal(ui.settings.target, 11);
  assert.equal(tap(ui, 0), 'prepare');                      // level 1
  assert.equal(ui.settings.level, 1);
  assert.equal(tap(ui, null), 'start', 'a tap on the controllers screen plays');
  assert.equal(tap(ui, null), null, 'a tap in the match does nothing');
  assert.equal(ui.screen, 'match');

  const o = makeUi();
  tap(o, 2);
  assert.equal(o.screen, 'options');
  tap(o, KEY_CELLS + 2);
  assert.equal(o.screen, 'keytest');
  tap(o, null);
  assert.equal(o.screen, 'options', 'a tap leaves the key test');
  run(o, ['up', 'up', 'up', 'up', 'ok']);                   // waiting for a key (P1 SOFT)
  assert.ok(o.listen);
  tap(o, null);
  assert.equal(o.listen, false, 'a tap cancels waiting for a key');
});

test('the touch words are in the font and fit', () => {
  const fonts = parseFonts(JSON.parse(fs.readFileSync('public/hogg-squash/assets/font.json', 'utf8')));
  /** @param {string} font @param {string} line @param {number} max */
  const fits = (font, line, max) => {
    for (const ch of line) if (ch !== ' ') assert.ok(glyphFor(fonts[font], ch), `${font} has ${ch} (${line})`);
    assert.ok(measureWith(fonts, font, line) <= max, `${font} "${line}" fits in ${max} px`);
  };
  fits('large-red', TITLE_ITEMS[3], 306);
  fits('small', TOUCH_2P_NOTE, 600);
});
