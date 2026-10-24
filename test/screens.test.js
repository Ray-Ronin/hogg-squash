// The screens' state machine (node:test, run by npm test): every path through title → 1P / 2P → match length →
// level (1P only) → controllers → match → result → rematch / menu, the pause menu, and the words the screens draw
// in the font they use. js/ui/ only touches a canvas when drawing.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { makeUi, navigate, matchOver, autoPause, assignInMatch, showsMatch, DEFAULT_SETTINGS, TITLE_ITEMS, PAUSE_ITEMS,
  RESULT_ITEMS, OPTION_ITEMS, KEY_CELLS, keyCell, captureKey } from '../public/hogg-squash/js/ui/screens.js';
import { OPTIONS_HINT, OPTIONS_LAYOUT, EFFECTS_NOTE } from '../public/hogg-squash/js/ui/options.js';
import { KEYTEST_TEXT, KEYS, keyBox } from '../public/hogg-squash/js/ui/keytest.js';
import { defaultLayouts, keyLabel, helpLines, seatLabel, ACTIONS } from '../public/hogg-squash/js/input/keymap.js';
import { TITLE_HINT, TITLE_TOP, SOUND_NOTE } from '../public/hogg-squash/js/ui/title.js';
import { SETUP_HINT, levelNote, lengthNote, modeLine } from '../public/hogg-squash/js/ui/setup.js';
import { ASSIGN_TEXT } from '../public/hogg-squash/js/ui/assign.js';
import { PAUSE_HINT } from '../public/hogg-squash/js/ui/pause.js';
import { RESULT_HINT, matchLine, resultLine } from '../public/hogg-squash/js/ui/result.js';
import { parseFonts, glyphFor, measureWith } from '../public/hogg-squash/js/render/text.js';
import { makeWorld } from '../public/hogg-squash/js/sim/world.js';

/** Make moves in turn, returning each one's effect. @param {any} ui @param {string[]} navs */
const run = (ui, navs) => navs.map(n => navigate(ui, /** @type {any} */ (n)));

test('the defaults: the title, 1 player, first to 9, level 5', () => {
  const ui = makeUi();
  assert.equal(ui.screen, 'title');
  assert.deepEqual(ui.settings, { players: 1, target: 9, level: 5 });
  assert.deepEqual(DEFAULT_SETTINGS, { players: 1, target: 9, level: 5 });
});

test('1P: title → length → level → controllers → match, with the choices kept', () => {
  const ui = makeUi();
  assert.deepEqual(run(ui, ['ok']), [null]);
  assert.equal(ui.screen, 'length');
  assert.equal(ui.sel, 2, 'starts on first to 9');
  run(ui, ['right', 'right', 'right']);                   // stops at 11
  assert.deepEqual(run(ui, ['ok']), [null]);
  assert.equal(ui.screen, 'level');
  assert.equal(ui.sel, 4, 'starts on level 5');
  run(ui, ['left', 'left', 'left', 'left', 'left', 'right']);   // stops at 1, then 2
  assert.deepEqual(run(ui, ['ok']), ['prepare'], 'the match is built for the controllers screen');
  assert.equal(ui.screen, 'assign');
  assert.deepEqual(ui.settings, { players: 1, target: 11, level: 2 });
  assert.deepEqual(run(ui, ['ok']), ['start']);
  assert.equal(ui.screen, 'match');
});

test('every match length and level can be picked', () => {
  for (const [i, target] of [5, 7, 9, 11].entries()) {
    for (const level of [1, 5, 9]) {
      const ui = makeUi();
      run(ui, ['ok', 'left', 'left', 'left', ...Array(i).fill('right'), 'ok',
        ...Array(8).fill('left'), ...Array(level - 1).fill('right'), 'ok']);
      assert.equal(ui.screen, 'assign');
      assert.deepEqual(ui.settings, { players: 1, target, level });
    }
  }
});

test('2P skips the level', () => {
  const ui = makeUi();
  run(ui, ['down', 'ok']);
  assert.equal(ui.settings.players, 2);
  assert.equal(ui.screen, 'length');
  assert.deepEqual(run(ui, ['ok']), ['prepare']);
  assert.equal(ui.screen, 'assign');
  run(ui, ['back']);
  assert.equal(ui.screen, 'length', 'back from the controllers goes to the length in 2P');
});

test('back steps through the setup to the title, keeping the selection', () => {
  const ui = makeUi();
  run(ui, ['ok', 'ok', 'ok']);
  assert.equal(ui.screen, 'assign');
  run(ui, ['back']);
  assert.equal(ui.screen, 'level');
  run(ui, ['back']);
  assert.equal(ui.screen, 'length');
  run(ui, ['back']);
  assert.equal(ui.screen, 'title');
  assert.equal(ui.sel, 0, '1 PLAYER still selected');
  run(ui, ['back']);
  assert.equal(ui.screen, 'title', 'back does nothing on the title');
});

test('menus wrap up and down; Start works as OK on the menus', () => {
  const ui = makeUi();
  run(ui, ['up']);
  assert.equal(ui.sel, 3, 'up from 1 PLAYER wraps to GO TO HOME');
  run(ui, ['down']);
  assert.equal(ui.sel, 0);
  run(ui, ['start', 'start', 'start']);
  assert.equal(ui.screen, 'assign');
});

test('options: from the title and back, moving round the keys and buttons', () => {
  const ui = makeUi();
  run(ui, ['down', 'down', 'ok']);
  assert.equal(ui.screen, 'options');
  assert.equal(ui.sel, 0, 'starts on P1 UP');
  run(ui, ['right']);
  assert.deepEqual(keyCell(ui.sel), { player: 1, action: 'up' });
  run(ui, ['down', 'down', 'down', 'down', 'down']);
  assert.deepEqual(keyCell(ui.sel), { player: 1, action: 'soft' });
  run(ui, ['left']);
  assert.deepEqual(keyCell(ui.sel), { player: 0, action: 'soft' });
  run(ui, ['down']);
  assert.equal(OPTION_ITEMS[ui.sel - KEY_CELLS], 'LAPTOP KEYS FOR P2');
  run(ui, ['down', 'down', 'down', 'down']);   // past EFFECTS
  assert.equal(OPTION_ITEMS[ui.sel - KEY_CELLS], 'BACK');
  run(ui, ['down']);
  assert.equal(ui.sel, 0, 'down from BACK wraps to the first key');
  run(ui, ['up']);
  assert.equal(OPTION_ITEMS[ui.sel - KEY_CELLS], 'BACK', 'and up wraps back');
  assert.deepEqual(run(ui, ['ok']), [null]);
  assert.equal(ui.screen, 'title');
  assert.equal(ui.sel, 2, 'back on OPTIONS');
  run(ui, ['ok', 'back']);
  assert.equal(ui.screen, 'title', 'Esc / B goes back too');
});

test('options: OK on a key waits for one; it is taken, refused, or Esc cancels', () => {
  const ui = makeUi();
  run(ui, ['down', 'down', 'ok', 'down', 'down', 'down', 'down', 'ok']);   // P1 HARD
  assert.ok(ui.listen);
  assert.match(ui.note, /P1 HARD/);
  assert.deepEqual(run(ui, ['down', 'ok']), [null, null], 'the menu keys do nothing while waiting');
  assert.equal(captureKey(ui, 'ControlLeft'), null);
  assert.ok(ui.listen, 'Ctrl is refused and it keeps waiting');
  assert.match(ui.note, /^Ctrl can't be used/);
  for (const code of ['AltLeft', 'MetaLeft', 'Tab']) assert.equal(captureKey(ui, code), null, code);
  assert.equal(ui.keys[0].hard, 'KeyF');
  assert.equal(captureKey(ui, 'KeyJ'), 'keys');
  assert.equal(ui.listen, false);
  assert.equal(ui.keys[0].hard, 'KeyJ');
  assert.equal(ui.note, 'P1 HARD: J');
  assert.equal(captureKey(ui, 'KeyK'), null, 'no key is taken when not waiting');

  run(ui, ['ok']);
  assert.equal(captureKey(ui, 'Escape'), null);
  assert.equal(ui.listen, false, 'Esc cancels');
  assert.equal(ui.keys[0].hard, 'KeyJ');
  run(ui, ['ok', 'back']);
  assert.equal(ui.listen, false, 'B on a pad cancels');
  assert.equal(ui.screen, 'options', 'and stays on the options');
});

test('options: a key used twice is taken with a warning; the presets', () => {
  const ui = makeUi();
  run(ui, ['down', 'down', 'ok', 'right', 'ok']);                         // P2 UP
  assert.equal(captureKey(ui, 'KeyW'), 'keys');
  assert.equal(ui.keys[1].up, 'KeyW');
  assert.equal(ui.note, 'W is used twice: P1 UP and P2 UP');
  run(ui, Array(6).fill('down'));                                           // LAPTOP KEYS FOR P2
  assert.equal(OPTION_ITEMS[ui.sel - KEY_CELLS], 'LAPTOP KEYS FOR P2');
  assert.deepEqual(run(ui, ['ok']), ['keys']);
  assert.equal(ui.keys[1].hard, 'Period');
  assert.equal(ui.keys[1].soft, 'Slash');
  run(ui, ['down']);
  assert.deepEqual(run(ui, ['ok']), ['keys']);                              // RESET TO DEFAULTS
  assert.deepEqual(ui.keys, defaultLayouts());
  assert.equal(ui.note, 'Every key is back to its default');
  run(ui, ['down', 'ok']);
  assert.equal(ui.screen, 'keytest');
  assert.deepEqual(run(ui, ['ok', 'up', 'left']), [null, null, null], 'only back leaves the key test');
  run(ui, ['back']);
  assert.equal(ui.screen, 'options');
  assert.equal(OPTION_ITEMS[ui.sel - KEY_CELLS], 'KEY TEST');
});

test('pause: Esc / Start / B resume, Restart match and Quit to title', () => {
  const ui = makeUi({}, 'match');
  for (const [open, close] of [['back', 'back'], ['start', 'start'], ['back', 'ok']]) {
    assert.deepEqual(run(ui, [open]), [null]);
    assert.equal(ui.screen, 'pause');
    assert.equal(ui.sel, 0);
    assert.deepEqual(run(ui, [close]), ['resume']);
    assert.equal(ui.screen, 'match');
  }
  run(ui, ['back', 'down']);
  assert.deepEqual(run(ui, ['ok']), ['restart']);
  assert.equal(ui.screen, 'match');
  run(ui, ['back', 'up']);
  assert.deepEqual(run(ui, ['ok']), ['quit']);
  assert.equal(ui.screen, 'title');
});

test('pausing without a key only pauses a match being played', () => {
  const ui = makeUi();
  assert.equal(autoPause(ui), false);
  assert.equal(ui.screen, 'title');
  ui.screen = 'match';
  assert.equal(autoPause(ui), true);
  assert.equal(ui.screen, 'pause');
  assert.equal(autoPause(ui), false, 'already paused');
});

test('the result: Rematch keeps the settings, Menu goes to the title', () => {
  const ui = makeUi();
  run(ui, ['down', 'ok', 'right', 'ok', 'ok']);           // 2P, first to 11
  matchOver(ui);
  assert.equal(ui.screen, 'result');
  assert.equal(ui.sel, 0);
  const before = { ...ui.settings };
  assert.deepEqual(run(ui, ['ok']), ['rematch']);
  assert.equal(ui.screen, 'match');
  assert.deepEqual(ui.settings, before);
  matchOver(ui);
  run(ui, ['back', 'down']);
  assert.equal(ui.screen, 'result', 'back does nothing on the result');
  assert.deepEqual(run(ui, ['ok']), ['quit']);
  assert.equal(ui.screen, 'title');
  assert.equal(ui.sel, 1, '2 PLAYERS still selected');
  run(ui, ['ok']);
  assert.equal(ui.sel, 3, 'the length screen remembers first to 11');
});

test('the controllers screen over a match: OK or back carries on', () => {
  const ui = makeUi({}, 'match');
  assignInMatch(ui);
  assert.equal(ui.screen, 'assign');
  assert.equal(ui.inMatch, true);
  assert.deepEqual(run(ui, ['left', 'ok']), [null, 'resume']);
  assert.equal(ui.screen, 'match');
  assert.equal(ui.inMatch, false);
  assignInMatch(ui);
  assert.deepEqual(run(ui, ['back']), ['resume']);
  ui.screen = 'title';
  assignInMatch(ui);
  assert.equal(ui.screen, 'title', 'only over a match');
});

test('which screens draw the match behind them', () => {
  assert.deepEqual(['title', 'length', 'level', 'assign', 'match', 'pause', 'result']
    .filter(s => showsMatch({ ...makeUi(), screen: /** @type {any} */ (s) })), ['assign', 'match', 'pause', 'result']);
});

test('the font has every character the screens draw, and the lines fit', () => {
  const fonts = parseFonts(JSON.parse(fs.readFileSync('public/hogg-squash/assets/font.json', 'utf8')));
  const w = makeWorld({ target: 11, cpu: [false, true] });
  w.match.scores = [9, 11];
  w.match.winner = 1;
  const levels = [1, 2, 5, 6, 9].map(l => `Level ${l}: ${levelNote(l)}`);
  /** [font, lines, the widest they may be] */
  const used = [
    ['large-red', [...TITLE_ITEMS, 'MATCH LENGTH', 'LEVEL', '5 7 9 11', '1 2 3 4 5 6 7 8 9', 'PAUSED'], 306],
    ['large-white', [...TITLE_ITEMS, ...PAUSE_ITEMS, 'SOUND OFF', ...RESULT_ITEMS, '11', resultLine(w), 'CONTROLLERS',
      'CONTROLLER DISCONNECTED'], 306],
    ['small', [TITLE_HINT, EFFECTS_NOTE, SETUP_HINT, ASSIGN_TEXT.play, ASSIGN_TEXT.carryOn, 'keys arrows Num0 Num.  +  (unplugged controller)'], 620],
    ['small-dark', [SOUND_NOTE.text, ...levels, lengthNote(11), modeLine({ players: 1, target: 9, level: 5 }) + ', FIRST TO 11',
      modeLine({ players: 2, target: 9, level: 5 })], 306],
    ['small-grey', [PAUSE_HINT, RESULT_HINT, ASSIGN_TEXT.join, ASSIGN_TEXT.swap, ...ASSIGN_TEXT.lost,
      matchLine({ players: 1, target: 11, level: 9 }), matchLine({ players: 2, target: 11, level: 5 })], 400],
    ['small-red', ['P1'], 50],
  ];
  assert.equal(resultLine(w), 'CPU WINS 11–9');
  for (const [font, lines, max] of used) {
    for (const line of lines) {
      for (const ch of line) if (ch !== ' ') assert.ok(glyphFor(fonts[font], ch), `${font} has ${ch} (${line})`);
      assert.ok(measureWith(fonts, font, line) <= max, `${font} "${line}" fits in ${max} px`);
    }
  }
});

test('options and key test: every word in the font, and it fits', () => {
  const fonts = parseFonts(JSON.parse(fs.readFileSync('public/hogg-squash/assets/font.json', 'utf8')));
  /** @param {string} font @param {string} line @param {number} max */
  const fits = (font, line, max) => {
    for (const ch of line) if (ch !== ' ') assert.ok(glyphFor(fonts[font], ch), `${font} has ${ch} (${line})`);
    assert.ok(measureWith(fonts, font, line) <= max, `${font} "${line}" fits in ${max} px`);
  };
  // the title's last row stays in its menu area (y 196–292, rows 24 px apart; the bar reaches 19 px below a row's top)
  assert.ok(TITLE_TOP + (TITLE_ITEMS.length - 1) * 24 + 19 <= 96);
  for (const item of [...OPTION_ITEMS, 'EFFECTS 10', 'EFFECTS OFF', 'OPTIONS', 'KEY TEST']) {
    fits('large-white', item, OPTIONS_LAYOUT.w - 60);
  }
  // every key a player is likely to pick, as a key cell (half the gap between P1's and P2's columns, each side)
  const codes = ['Space', 'Enter', 'NumpadEnter', 'ShiftLeft', 'ShiftRight', 'Backspace', 'CapsLock', 'Semicolon',
    'Quote', 'Comma', 'Period', 'Slash', 'Minus', 'Equal', 'IntlBackslash', 'NumpadAdd', 'NumpadMultiply', 'Home',
    'PageDown', 'Insert', 'Delete', 'ContextMenu', 'F12', 'KeyQ', 'Digit7', 'Numpad9', 'ArrowRight', 'NumpadDecimal'];
  const half = (OPTIONS_LAYOUT.COLS[1] - OPTIONS_LAYOUT.COLS[0]) / 2;
  for (const c of codes) fits('large-white', keyLabel(c), 2 * half - 24);
  fits('small', OPTIONS_HINT, OPTIONS_LAYOUT.w - 24);
  const ui = makeUi();
  run(ui, ['down', 'down', 'ok', 'right', 'down', 'down', 'down', 'down', 'ok']);   // P2 SOFT
  const notes = [ui.note];
  captureKey(ui, 'ControlLeft'); notes.push(ui.note);
  captureKey(ui, 'MetaLeft'); notes.push(ui.note);
  captureKey(ui, 'Backquote'); notes.push(ui.note);
  captureKey(ui, 'NumpadEnter'); notes.push(ui.note);
  run(ui, ['up', 'ok']);
  captureKey(ui, 'NumpadEnter'); notes.push(ui.note);
  for (const n of notes) fits('small', n, OPTIONS_LAYOUT.w - 24);
  for (const l of [...KEYTEST_TEXT.lines, KEYTEST_TEXT.hint]) fits('small', l, 600);
  // the key test's keyboard: every label in its key, every key on the panel (x 16–624, y 10–348)
  for (const k of KEYS) {
    const b = keyBox(k);
    fits('small', k[1], b.w - 4);                         // 2 px clear of each edge
    assert.ok(b.x >= 24 && b.x + b.w <= 616 && b.y >= 70 && b.y + b.h <= 200, `${k[0]} on the panel`);
  }
  assert.equal(new Set(KEYS.map(k => k[0])).size, KEYS.length, 'no key drawn twice');
  for (const [p, l] of defaultLayouts().entries()) {
    for (const a of ACTIONS) fits('small', `${a.toUpperCase()} ${keyLabel(l[a])}`, 84);
    // the match's margin (78 px wide with the frozen camera) and the controllers screen
    for (const line of helpLines(l, p)) fits('small-grey', line, 78);
    fits('small', `keys ${seatLabel(l)}  +  (unplugged controller)`, 380);
  }
  assert.deepEqual(defaultLayouts().map(helpLines),
    [['P1 keys', 'WASD move', 'F hard', 'G soft'], ['P2 keys', 'arrows move', 'Num0 hard', 'Num. soft']],
    'the defaults read as they did before S11');
  assert.deepEqual(defaultLayouts().map(seatLabel), ['WASD F G', 'arrows Num0 Num.']);
});

test('the version: 0.<session>.<fix> as in package.json, in the font, clear of the footer line', async () => {
  const { VERSION } = await import('../public/hogg-squash/js/version.js');
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  assert.equal(VERSION, pkg.version, 'js/version.js and package.json agree');
  assert.match(VERSION, /^\d+\.\d+\.\d+$/);
  const fonts = parseFonts(JSON.parse(fs.readFileSync('public/hogg-squash/assets/font.json', 'utf8')));
  const text = `v${VERSION}`;
  for (const font of ['small-grey', 'small-dark']) {
    for (const ch of text) assert.ok(glyphFor(fonts[font], ch), `${font} has ${ch}`);
  }
  // drawn right-aligned at x 636 on the footer's row; the footer is centred on x 320 (its longest form)
  const footer = measureWith(fonts, 'small-grey', 'Esc pause     Controllers: A hard  B/X soft  Start pause  (any button joins)');
  assert.ok(320 + footer / 2 + 8 <= 636 - measureWith(fonts, 'small-grey', 'v10.99.99'), 'a long version still clears the footer');
});

test('S12: the touch wording (hints, margins, controllers) and the How to play card: in the font, and they fit', async () => {
  const fonts = parseFonts(JSON.parse(fs.readFileSync('public/hogg-squash/assets/font.json', 'utf8')));
  const { SETUP_TOUCH_HINT } = await import('../public/hogg-squash/js/ui/setup.js');
  const { OPTIONS_TOUCH_HINT } = await import('../public/hogg-squash/js/ui/options.js');
  const { PAUSE_TOUCH_HINT } = await import('../public/hogg-squash/js/ui/pause.js');
  const { RESULT_TOUCH_HINT } = await import('../public/hogg-squash/js/ui/result.js');
  const { TOUCH_HELP } = await import('../public/hogg-squash/js/input/keymap.js');
  const { HOW_TO_PLAY, MENU } = await import('../public/hogg-squash/js/ui/title.js');
  const fits = (/** @type {any} */ font, /** @type {string} */ line, /** @type {number} */ max) => {
    for (const ch of line) if (ch !== ' ') assert.ok(glyphFor(fonts[font], ch), `${font} has ${ch} (${line})`);
    assert.ok(measureWith(fonts, font, line) <= max, `${font} "${line}" fits in ${max} px`);
  };
  fits('small', SETUP_TOUCH_HINT, 620);
  fits('small-grey', OPTIONS_TOUCH_HINT, OPTIONS_LAYOUT.w - 24);
  for (const h of [PAUSE_TOUCH_HINT, RESULT_TOUCH_HINT]) fits('small-grey', h, measureWith(fonts, 'large-white', 'RESTART MATCH'));
  fits('small-grey', KEYTEST_TEXT.touchHint, 600);
  fits('small', ASSIGN_TEXT.touchPlay, 400);
  fits('small', ASSIGN_TEXT.touchSeat, 380);
  for (const line of TOUCH_HELP) fits('small-grey', line, 78);
  fits('small-grey', 'II (top left): pause', 560);
  // the card: every line inside it, right of the menu's widest item (its bar), inside the menu area's height
  const c = HOW_TO_PLAY;
  for (const line of c.lines) fits(line === c.lines[0] ? 'small-red' : 'small', line, c.w - 8);
  const widest = Math.max(...TITLE_ITEMS.map(it => measureWith(fonts, 'large-white', it)));
  assert.ok(c.x > MENU.x + 40 + widest + 6 + 4, 'clear of the menu and its highlight bar');
  assert.ok(c.x + c.w <= 366, 'clear of the shield');
  assert.ok(c.y >= MENU.y && c.y + c.lines.length * c.ROW + 12 <= MENU.y + MENU.h, 'inside the menu area\'s height');
});
