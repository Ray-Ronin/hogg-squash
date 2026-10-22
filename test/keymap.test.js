// Key remapping (node:test, run by npm test): which keys are refused, duplicates, the presets, the keys' names on
// screen, and saving and loading the layouts with localStorage mocked (working, empty, damaged, blocked and full).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ACTIONS, LAPTOP_P2, STORE_KEY, refusal, defaultLayouts, resetLayouts, laptopPreset, duplicates, duplicateNote,
  keyLabel, moveLabel, loadLayouts, saveLayouts } from '../public/hogg-squash/js/input/keymap.js';
import { DEFAULT_LAYOUTS } from '../public/hogg-squash/js/input/actions.js';

/** A localStorage stand-in. */
function memoryStore(init = {}) {
  const data = new Map(Object.entries(init));
  return { data, getItem: k => data.get(k) ?? null, setItem: (k, v) => { data.set(k, String(v)); } };
}

test('Ctrl, Alt, Meta, Tab and Esc are refused, with a reason; ordinary keys are fine', () => {
  for (const code of ['ControlLeft', 'ControlRight', 'AltLeft', 'AltRight', 'MetaLeft', 'MetaRight', 'OSLeft', 'Tab',
    'Escape']) {
    assert.equal(typeof refusal(code), 'string', code);
  }
  assert.match(/** @type {string} */ (refusal('ControlLeft')), /Ctrl \+ W/);
  assert.ok(refusal('Backquote'), 'the debug keys are kept for testing');
  for (const code of ['KeyW', 'ArrowUp', 'Numpad0', 'NumpadDecimal', 'Period', 'Slash', 'Space', 'ShiftLeft', 'Enter',
    'Digit1', 'KeyK', 'KeyL']) {
    assert.equal(refusal(code), null, code);
  }
  for (const l of DEFAULT_LAYOUTS) for (const a of ACTIONS) assert.equal(refusal(l[a]), null, `default ${a} is allowed`);
});

test('duplicates: none in the defaults; a key used twice is found, within a player or across both', () => {
  const l = defaultLayouts();
  assert.deepEqual(duplicates(l), []);
  assert.equal(duplicateNote(l), '');
  l[1].soft = 'KeyF';
  assert.deepEqual(duplicates(l), [{ code: 'KeyF', uses: [[0, 'hard'], [1, 'soft']] }]);
  assert.equal(duplicateNote(l), 'F is used twice: P1 HARD and P2 SOFT');
  l[0].up = 'KeyS';
  assert.equal(duplicates(l).length, 2);
  assert.equal(duplicateNote(l), 'S is used twice: P1 UP and P1 DOWN (and more)');
});

test('presets: laptop keys for P2, and reset to defaults (in place)', () => {
  const l = defaultLayouts();
  assert.notEqual(l[0], DEFAULT_LAYOUTS[0], 'copies, so a remap never changes the defaults');
  const p2 = l[1];
  laptopPreset(l);
  assert.equal(l[1], p2, 'the same object, changed in place');
  assert.deepEqual(l[1], { ...DEFAULT_LAYOUTS[1], hard: 'Period', soft: 'Slash' });
  assert.deepEqual(LAPTOP_P2, { hard: 'Period', soft: 'Slash' });
  assert.deepEqual(l[0], DEFAULT_LAYOUTS[0], "P1's keys untouched");
  assert.deepEqual(duplicates(l), []);
  l[0].hard = 'KeyJ';
  resetLayouts(l);
  assert.equal(l[1], p2);
  assert.deepEqual(l, DEFAULT_LAYOUTS);
});

test("keys' names on screen", () => {
  const names = { KeyW: 'W', Digit1: '1', Numpad0: 'Num0', NumpadDecimal: 'Num.', NumpadEnter: 'NumEnt', ArrowUp: 'Up',
    Period: '.', Slash: '/', Space: 'Space', ShiftLeft: 'L Shift', Enter: 'Enter', F5: 'F5', Semicolon: 'Semi' };
  for (const [code, name] of Object.entries(names)) assert.equal(keyLabel(code), name, code);
  const [p1, p2] = defaultLayouts();
  assert.equal(moveLabel(p1), 'WASD');
  assert.equal(moveLabel(p2), 'arrows');
  assert.equal(moveLabel({ ...p1, up: 'KeyI', left: 'KeyJ', down: 'KeyK', right: 'KeyL' }), 'IJKL');
  assert.equal(moveLabel({ ...p2, up: 'Numpad8' }), 'Num8 Left Down Right');
});

test('saving and loading: round trip, nothing saved, damaged, refused keys, blocked or full storage', () => {
  const store = memoryStore();
  assert.deepEqual(loadLayouts(store), DEFAULT_LAYOUTS, 'nothing saved: the defaults');
  const l = defaultLayouts();
  laptopPreset(l);
  l[0].hard = 'KeyJ';
  assert.equal(saveLayouts(store, l), true);
  assert.ok(store.data.has(STORE_KEY));
  assert.deepEqual(loadLayouts(store), l, 'what was saved comes back');

  for (const raw of ['not json{', '{"version":99,"layouts":[]}', '{"version":1}', 'null', '[]']) {
    assert.deepEqual(loadLayouts(memoryStore({ [STORE_KEY]: raw })), DEFAULT_LAYOUTS, `damaged: ${raw}`);
  }
  // one player's layout damaged or using a refused key: that player gets the defaults, the other keeps theirs
  const bad = JSON.stringify({ version: 1, layouts: [{ ...l[0], soft: 'ControlLeft' }, l[1]] });
  assert.deepEqual(loadLayouts(memoryStore({ [STORE_KEY]: bad })), [DEFAULT_LAYOUTS[0], l[1]]);
  const partial = JSON.stringify({ version: 1, layouts: [l[0], { up: 'KeyI' }] });
  assert.deepEqual(loadLayouts(memoryStore({ [STORE_KEY]: partial })), [l[0], DEFAULT_LAYOUTS[1]]);

  const blocked = { getItem() { throw new Error('SecurityError'); }, setItem() { throw new Error('SecurityError'); } };
  assert.deepEqual(loadLayouts(blocked), DEFAULT_LAYOUTS, 'blocked storage: the defaults, no throw');
  assert.equal(saveLayouts(blocked, l), false, 'and saving says it failed, without throwing');
  assert.deepEqual(loadLayouts(null), DEFAULT_LAYOUTS, 'no storage at all');
  assert.equal(saveLayouts(null, l), false);
  const full = { ...memoryStore(), setItem() { throw new Error('QuotaExceededError'); } };
  assert.equal(saveLayouts(full, l), false);
});

test('loading gives fresh layouts each time (a remap never changes the defaults)', () => {
  const a = loadLayouts(null);
  a[0].up = 'KeyI';
  assert.equal(loadLayouts(null)[0].up, 'KeyW');
  assert.equal(DEFAULT_LAYOUTS[0].up, 'KeyW');
});
