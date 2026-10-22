// Touch controls (node:test, run by npm test): when they show (Auto / On / Off: a touch shows them, a key or a pad
// hides them), the stick's directions, the actions and menu moves they give, 2P unavailable while they show, the
// setting on the options screen, taps on menu items, and saving / loading the setting with localStorage mocked.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { TOUCH_MODES, TOUCH_KEY, makeTouchState, touchShowing, noteTouch, noteKeyOrPad, nextMode, loadTouchMode,
  saveTouchMode, stickDirs, touchActions, touchNavs } from '../public/hogg-squash/js/input/touch.js';
import { STORE_KEY, saveLayouts, loadLayouts, defaultLayouts } from '../public/hogg-squash/js/input/keymap.js';
import { makeUi, navigate, setTouch, tap, optionItems, titleOff, OPTION_ITEMS, KEY_CELLS, TOUCH_NOTES, TOUCH_2P_NOTE }
  from '../public/hogg-squash/js/ui/screens.js';
import { OPTIONS_LAYOUT } from '../public/hogg-squash/js/ui/options.js';
import { parseFonts, glyphFor, measureWith } from '../public/hogg-squash/js/render/text.js';

/** A localStorage stand-in. */
function memoryStore(init = {}) {
  const data = new Map(Object.entries(init));
  return { data, getItem: k => data.get(k) ?? null, setItem: (k, v) => { data.set(k, String(v)); } };
}
/** @param {any} ui @param {string[]} navs */
const run = (ui, navs) => navs.map(n => navigate(ui, /** @type {any} */ (n)));
const none = { up: false, down: false, left: false, right: false };

test('Auto: hidden at start, shown on a touch, hidden on a key or pad, shown again on the next touch', () => {
  const s = makeTouchState('auto');
  assert.equal(touchShowing(s), false, 'a computer never sees them until it is touched');
  noteTouch(s);
  assert.equal(touchShowing(s), true);
  noteKeyOrPad(s);
  assert.equal(touchShowing(s), false);
  noteTouch(s);
  assert.equal(touchShowing(s), true);
  assert.equal(touchShowing(makeTouchState('auto', true)), true, 'a phone-like screen shows them from the start');
});

test('On and Off override Auto whatever is used', () => {
  for (const [mode, want] of /** @type {const} */ ([['on', true], ['off', false]])) {
    for (const phone of [false, true]) {
      const s = makeTouchState(mode, phone);
      assert.equal(touchShowing(s), want, `${mode} at start`);
      noteTouch(s);
      assert.equal(touchShowing(s), want, `${mode} after a touch`);
      noteKeyOrPad(s);
      assert.equal(touchShowing(s), want, `${mode} after a key`);
    }
  }
  assert.deepEqual(TOUCH_MODES, ['auto', 'on', 'off']);
  assert.equal(nextMode('auto'), 'on');
  assert.equal(nextMode('off'), 'auto', 'wraps');
  assert.equal(nextMode('auto', -1), 'off');
});

test('the setting is saved beside the key layouts and loaded back; Auto if missing, damaged or blocked', () => {
  const store = memoryStore();
  assert.equal(loadTouchMode(store), 'auto', 'nothing saved');
  assert.equal(saveTouchMode(store, 'off'), true);
  assert.equal(store.data.get(TOUCH_KEY), 'off');
  saveLayouts(store, defaultLayouts());
  assert.ok(store.data.has(STORE_KEY) && TOUCH_KEY !== STORE_KEY, 'its own entry, next to the keys');
  assert.equal(loadTouchMode(store), 'off', 'after a reload');
  assert.deepEqual(loadLayouts(store), defaultLayouts(), 'the keys are untouched');
  saveTouchMode(store, 'on');
  assert.equal(loadTouchMode(store), 'on');
  assert.equal(loadTouchMode(memoryStore({ [TOUCH_KEY]: 'sideways' })), 'auto', 'damaged');
  assert.equal(loadTouchMode(null), 'auto', 'storage blocked');
  assert.equal(saveTouchMode(null, 'on'), false);
  const throws = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('full'); } };
  assert.equal(loadTouchMode(throws), 'auto');
  assert.equal(saveTouchMode(throws, 'on'), false, 'full storage');
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

test('the options: Touch controls steps Auto → On → Off (OK or right; left goes back), with a note', () => {
  const ui = makeUi();
  run(ui, ['down', 'down', 'ok', 'up', 'up']);
  assert.equal(OPTION_ITEMS[ui.sel - KEY_CELLS], 'TOUCH CONTROLS');
  assert.equal(optionItems(ui)[ui.sel - KEY_CELLS], 'TOUCH CONTROLS: AUTO');
  assert.deepEqual(run(ui, ['ok']), ['touch']);
  assert.equal(ui.touchMode, 'on');
  assert.equal(ui.note, TOUCH_NOTES.on);
  assert.deepEqual(run(ui, ['right']), ['touch']);
  assert.equal(optionItems(ui)[ui.sel - KEY_CELLS], 'TOUCH CONTROLS: OFF');
  assert.deepEqual(run(ui, ['left', 'left']), ['touch', 'touch']);
  assert.equal(ui.touchMode, 'auto');
  assert.equal(ui.screen, 'options');
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
  assert.equal(tap(o, KEY_CELLS + 3), 'touch', 'TOUCH CONTROLS by tapping');
  tap(o, KEY_CELLS + 2);
  assert.equal(o.screen, 'keytest');
  tap(o, null);
  assert.equal(o.screen, 'options', 'a tap leaves the key test');
  run(o, ['up', 'up', 'up', 'up', 'up', 'ok']);             // waiting for a key (P1 SOFT)
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
  const ui = makeUi();
  for (const mode of TOUCH_MODES) {
    ui.touchMode = mode;
    for (const item of optionItems(ui)) fits('large-white', item, OPTIONS_LAYOUT.w - 60);
    fits('small', TOUCH_NOTES[mode], OPTIONS_LAYOUT.w - 24);
  }
  fits('small', TOUCH_2P_NOTE, 600);
  // the options' five buttons stay above the message line
  assert.ok(46 + 6 * 24 + 4 + 5 * 24 <= OPTIONS_LAYOUT.h - 34);
});
