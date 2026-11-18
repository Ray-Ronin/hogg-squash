// The screens' state machine (node:test, run by npm test): every path through title → 1P / 2P → match length →
// level (1P only) → characters (S15, with a roster) → controllers → match → result → rematch / menu, the pause menu,
// and the words the screens draw in the font they use. js/ui/ only touches a canvas when drawing.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { makeUi, navigate, matchOver, autoPause, assignInMatch, showsMatch, DEFAULT_SETTINGS, TITLE_ITEMS, PAUSE_ITEMS,
  RESULT_ITEMS, OPTION_ITEMS, KEY_CELLS, keyCell, captureKey, setRoster, tap, pickIndices, SELECT_REROLL }
  from '../public/hogg-squash/js/ui/screens.js';
import { SELECT_TEXT } from '../public/hogg-squash/js/ui/select.js';
import { OPTIONS_HINT, OPTIONS_LAYOUT, EFFECTS_NOTE } from '../public/hogg-squash/js/ui/options.js';
import { KEYTEST_TEXT, KEYS, keyBox } from '../public/hogg-squash/js/ui/keytest.js';
import { defaultLayouts, keyLabel, helpLines, seatLabel, ACTIONS } from '../public/hogg-squash/js/input/keymap.js';
import { TITLE_HINT, TITLE_TOP, TITLE_ROW, SOUND_NOTE } from '../public/hogg-squash/js/ui/title.js';
import { SETUP_HINT, levelNote, lengthNote, modeLine } from '../public/hogg-squash/js/ui/setup.js';
import { ASSIGN_TEXT } from '../public/hogg-squash/js/ui/assign.js';
import { PAUSE_HINT } from '../public/hogg-squash/js/ui/pause.js';
import { RESULT_HINT, matchLine, resultLine } from '../public/hogg-squash/js/ui/result.js';
import { parseFonts, glyphFor, measureWith } from '../public/hogg-squash/js/render/text.js';
import { makeWorld } from '../public/hogg-squash/js/sim/world.js';

/** Make moves in turn, returning each one's effect. @param {any} ui @param {string[]} navs */
const run = (ui, navs) => navs.map(n => navigate(ui, /** @type {any} */ (n)));

test('the defaults: the title, 1 player, first to 9, level 5, no characters picked yet', () => {
  const ui = makeUi();
  assert.equal(ui.screen, 'title');
  assert.deepEqual(ui.settings, { players: 1, target: 9, level: 5, picks: [] });
  assert.deepEqual(DEFAULT_SETTINGS, { players: 1, target: 9, level: 5, picks: [] });
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
  assert.deepEqual(ui.settings, { players: 1, target: 11, level: 2, picks: [] }, 'no roster: no characters screen');
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
      assert.deepEqual(ui.settings, { players: 1, target, level, picks: [] });
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
  assert.equal(ui.sel, 4, 'up from 1 PLAYER wraps to GO TO HOME');
  run(ui, ['down']);
  assert.equal(ui.sel, 0);
  run(ui, ['start', 'start', 'start']);
  assert.equal(ui.screen, 'assign');
});

test('options: from the title and back, moving round the keys and buttons', () => {
  const ui = makeUi();
  run(ui, ['down', 'down', 'down', 'ok']);
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
  assert.equal(ui.sel, 3, 'back on OPTIONS');
  run(ui, ['ok', 'back']);
  assert.equal(ui.screen, 'title', 'Esc / B goes back too');
});

test('options: OK on a key waits for one; it is taken, refused, or Esc cancels', () => {
  const ui = makeUi();
  run(ui, ['down', 'down', 'down', 'ok', 'down', 'down', 'down', 'down', 'ok']);   // P1 HARD
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
  run(ui, ['down', 'down', 'down', 'ok', 'right', 'ok']);                         // P2 UP
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
    ['large-white', [...TITLE_ITEMS, ...PAUSE_ITEMS, 'SOUND OFF', ...RESULT_ITEMS, '11', resultLine(w, ['P1', 'CPU']), 'CONTROLLERS',
      'CONTROLLER DISCONNECTED'], 306],
    ['small', [TITLE_HINT, EFFECTS_NOTE, SETUP_HINT, ASSIGN_TEXT.play, ASSIGN_TEXT.carryOn, 'keys arrows Num0 Num.  +  (unplugged controller)'], 620],
    ['small-dark', [SOUND_NOTE.text, ...levels, lengthNote(11), modeLine({ players: 1, target: 9, level: 5 }) + ', FIRST TO 11',
      modeLine({ players: 2, target: 9, level: 5 })], 306],
    ['small-grey', [PAUSE_HINT, RESULT_HINT, ASSIGN_TEXT.join, ASSIGN_TEXT.swap, ...ASSIGN_TEXT.lost,
      matchLine({ players: 1, target: 11, level: 9 }), matchLine({ players: 2, target: 11, level: 5 })], 400],
    ['small-red', ['P1'], 50],
  ];
  assert.equal(resultLine(w, ['P1', 'CPU']), 'CPU WINS 11–9');
  assert.equal(resultLine(w, ['Ronin', 'Will']), 'WILL WINS 11–9', 'the name, in capitals');
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
  assert.ok(TITLE_TOP + (TITLE_ITEMS.length - 1) * TITLE_ROW + 19 <= 96);
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
  run(ui, ['down', 'down', 'down', 'ok', 'right', 'down', 'down', 'down', 'down', 'ok']);   // P2 SOFT
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

/** A ui with the S15 roster, its random numbers from a list (the CPU's picks). @param {number[]} rolls */
function withRoster(rolls = [0]) {
  const ui = makeUi();
  setRoster(ui, ['ronin', 'adam', 'ben', 'will']);
  let i = 0;
  ui.rand = () => rolls[i++ % rolls.length];
  return ui;
}

test('S15, 1P: level → characters → controllers; P1 starts on Ronin, the CPU\'s pick is random and rolls again', () => {
  const ui = withRoster([0.6, 0.1, 0.9]);
  run(ui, ['ok', 'ok']);                                    // 1P, first to 9
  assert.deepEqual(run(ui, ['ok']), [null], 'no match built yet');
  assert.equal(ui.screen, 'select');
  assert.deepEqual(ui.pick, { at: [0, 2], locked: [false, true], rolled: [false, false] }, 'P1 on Ronin; the CPU on Ben (0.6 of 4)');
  run(ui, ['down']);                                        // another: never the same one
  assert.notEqual(ui.pick.at[1], 2);
  const cpu = ui.pick.at[1];
  run(ui, ['right', 'right', 'left']);
  assert.equal(ui.pick.at[0], 1, 'P1 on Adam');
  assert.equal(ui.pick.at[1], cpu, 'the CPU keeps its pick');
  run(ui, ['left', 'left']);
  assert.equal(ui.pick.at[0], 4, 'left from Ronin wraps to the "?" card (S18b)');
  run(ui, ['left']);
  assert.equal(ui.pick.at[0], 3, '…then Will');
  assert.deepEqual(navigate(ui, 'ok', 1), 'prepare', 'in 1P every control is P1\'s, and the CPU has picked');
  assert.equal(ui.screen, 'assign');
  assert.deepEqual(ui.settings.picks, ['will', ['ronin', 'adam', 'ben', 'will'][cpu]]);
});

test('S15, 2P: each player picks with their own controls; Enter picks for the first still choosing; back undoes', () => {
  const ui = withRoster();
  run(ui, ['down', 'ok', 'ok']);                            // 2P, first to 9 (no level)
  assert.equal(ui.screen, 'select');
  assert.deepEqual(ui.pick, { at: [0, 1], locked: [false, false], rolled: [false, false] }, 'P1 on Ronin, P2 on Adam');
  navigate(ui, 'right', 1);
  navigate(ui, 'right', 1);
  assert.deepEqual(ui.pick.at, [0, 3], 'P2 moved, P1 didn\'t');
  assert.equal(navigate(ui, 'ok', 1), null, 'P2 picked; P1 still choosing');
  navigate(ui, 'left', 1);
  assert.equal(ui.pick.at[1], 3, 'a pick stays put');
  navigate(ui, 'back', 1);
  assert.deepEqual(ui.pick.locked, [false, false], 'SOFT undoes P2\'s pick');
  navigate(ui, 'ok', 1);
  navigate(ui, 'down', 0);
  assert.deepEqual(ui.pick.at, [0, 3], 'up / down do nothing in 2P');
  assert.equal(navigate(ui, 'ok'), 'prepare', 'Enter picks for P1, the one still choosing');
  assert.deepEqual(ui.settings.picks, ['ronin', 'will']);
  run(ui, ['back']);
  assert.equal(ui.screen, 'select', 'back from the controllers goes to the characters');
  assert.deepEqual(ui.pick, { at: [0, 3], locked: [false, false], rolled: [false, false] }, 'both choosing again, from their picks');
  run(ui, ['back']);
  assert.equal(ui.screen, 'length', 'back with nothing picked: the match length (2P)');
});

test('S15: a mirror match is allowed; rematch and restart keep the picks; the next visit starts on them', () => {
  const ui = withRoster([0.3]);
  run(ui, ['ok', 'ok', 'ok']);                              // 1P: the CPU on Adam (0.3 of 4)
  run(ui, ['right']);
  assert.deepEqual(run(ui, ['ok']), ['prepare']);
  assert.deepEqual(ui.settings.picks, ['adam', 'adam'], 'both Adam');
  run(ui, ['ok']);
  matchOver(ui);
  assert.deepEqual(run(ui, ['ok']), ['rematch']);
  assert.deepEqual(ui.settings.picks, ['adam', 'adam'], 'the rematch keeps them');
  run(ui, ['back', 'down']);
  assert.deepEqual(run(ui, ['ok']), ['restart']);
  assert.deepEqual(ui.settings.picks, ['adam', 'adam']);
  run(ui, ['back', 'up', 'ok']);                            // quit to the title
  assert.equal(ui.screen, 'title');
  run(ui, ['ok', 'ok', 'ok']);
  assert.equal(ui.screen, 'select');
  assert.equal(ui.pick.at[0], 1, 'P1 starts on their last pick');
  assert.deepEqual(pickIndices({ ...ui.settings, picks: ['gone', 'will'] }, ui.roster), [0, 3],
    'a pick no longer in the roster falls back to the first');
});

test('S15: back steps out of the characters (1P) to the level; touch picks by tapping', () => {
  const ui = withRoster([0.99]);
  run(ui, ['ok', 'ok', 'ok']);
  assert.equal(ui.pick.at[1], 3, 'the CPU on Will (0.99 of 4)');
  run(ui, ['back']);
  assert.equal(ui.screen, 'level');
  run(ui, ['ok']);
  assert.equal(tap(ui, null), null, 'a tap off the cards does nothing');
  assert.equal(tap(ui, SELECT_REROLL), null);
  assert.notEqual(ui.pick.at[1], 3, 'a tap on the CPU rolls another');
  assert.equal(tap(ui, 2), 'prepare', 'a tap on a card is P1\'s pick');
  assert.equal(ui.settings.picks[0], 'ben');
});

test('S15: without a roster (the sprites didn\'t load) the characters screen is skipped', () => {
  const ui = makeUi();
  run(ui, ['down', 'ok']);
  assert.deepEqual(run(ui, ['ok']), ['prepare']);
  assert.equal(ui.screen, 'assign');
  run(ui, ['back']);
  assert.equal(ui.screen, 'length');
});

test('S15: the characters screen\'s words are in the font and fit its panel', () => {
  const fonts = parseFonts(JSON.parse(fs.readFileSync('public/hogg-squash/assets/font.json', 'utf8')));
  const fits = (/** @type {any} */ font, /** @type {string} */ line, /** @type {number} */ max) => {
    for (const ch of line) if (ch !== ' ') assert.ok(glyphFor(fonts[font], ch), `${font} has ${ch} (${line})`);
    assert.ok(measureWith(fonts, font, line) <= max, `${font} "${line}" fits in ${max} px`);
  };
  for (const t of SELECT_TEXT.title) fits('large-red', t, 580);
  for (const l of [SELECT_TEXT.hint1, SELECT_TEXT.hint2, SELECT_TEXT.touchHint]) fits('small', l, 580);
  fits('small-grey', SELECT_TEXT.same, 580);
  fits('small-grey', '1 PLAYER VS CPU, LEVEL 9, FIRST TO 11', 580);
  for (const l of [...SELECT_TEXT.cpu, ...SELECT_TEXT.cpuTouch, SELECT_TEXT.choose]) fits('small-grey', l, 140);
  fits('small-red', SELECT_TEXT.picked, 140);
});

// --- S17: the tournament's screens ---
import { TMENU_ITEMS, TCONFIRM_ITEMS, TSETUP_ROWS, BRACKET_ITEMS, RESULT_TOUR_ITEMS, CHAMPION_ITEMS, PAUSE_SKIP,
  TSELECT_START, TSELECT_NEXT, TSELECT_BOTS, SKIP_BOTS, NEW_DRAW, RANDOM_BOTS, RANDOM_CHAR, tselectStart, tselectItems, cardOver, pauseItems, pauseLabels, resultItems, bracketItems,
  matchPicks, setTouch, setTournament, setupValues } from '../public/hogg-squash/js/ui/screens.js';
import { TOUR_TEXT, whoLine, roundsLine, lengthsLine, nextLine, entrantLine, humanLine, recordLine, peopleLine, cardRules,
  bracketGeometry, cardPlayer, CARD_LAYOUT, setupLabel, SETUP_LAYOUT,
  TSELECT_LAYOUT, BRACKET_LAYOUT, CHAMPION_LAYOUT } from '../public/hogg-squash/js/ui/tournament.js';
import { tourLine } from '../public/hogg-squash/js/ui/result.js';
import { nextMatch, champion, makeTournament, roundName, drawFixed, drawOrder } from '../public/hogg-squash/js/sim/tournament.js';

/** The bracket's items with NEW DRAW before the last while the draw isn't fixed (S18b). @param {any} t @param {string[]} items */
const drawFixedItems = (t, items) => (drawFixed(t) ? items : [...items.slice(0, -1), NEW_DRAW, items[items.length - 1]]);

/** A ui on the tournament setup, with a roster and listed random numbers. @param {number[]} [rolls] */
function toSetup(rolls) {
  const ui = withRoster(rolls);
  run(ui, ['down', 'down', 'ok']);
  assert.equal(ui.screen, 'tsetup');
  return ui;
}

/** Set a setup row to a value by stepping it. @param {any} ui @param {number} row @param {number | string} v */
function setRow(ui, row, v) {
  const is = () => String(setupLabel(ui, row)).toLowerCase() === String(v).toLowerCase();
  ui.sel = row;
  for (let i = 0; i < 40 && !is(); i++) navigate(ui, 'right');
  for (let i = 0; i < 40 && !is(); i++) navigate(ui, 'left');
  assert.ok(is(), `${TSETUP_ROWS[row]} ${v}`);
}

/** From the setup to the bracket with the characters as they start. @param {any} ui */
function startIt(ui) {
  ui.sel = TSETUP_ROWS.length - 1;
  assert.deepEqual(run(ui, ['ok']), [null]);
  assert.equal(ui.screen, 'tselect');
  ui.sel = tselectStart(ui);
  assert.deepEqual(run(ui, ['ok']), ['tsave'], 'the new tournament is saved');
  assert.equal(ui.screen, 'bracket');
}

/** Play the human's matches (P1 wins 5–0) until a bots' match is next, or the end. @param {any} ui */
function toBotsMatch(ui) {
  const t = ui.tour.t;
  while (nextMatch(t)?.mustPlay) {
    ui.sel = 0;
    run(ui, ['ok', 'ok', 'ok']);                           // PLAY, the round card, the controllers
    matchOver(ui, { winner: 0, scores: [5, 0] });
    run(ui, ['ok']);
  }
}

test('S17: TOURNAMENT on the title; the setup\'s rows and their limits', () => {
  const ui = toSetup();
  assert.deepEqual(ui.tour.draft, { size: 8, humans: 1, mode: 'same', same: 11, start: 5, level: 5 }, 'the defaults');
  assert.deepEqual(TSETUP_ROWS.map((_, r) => setupLabel(ui, r)), ['8', '1', 'SAME', '11', '5', '']);
  setRow(ui, 1, 8);
  assert.equal(setupLabel(ui, 4), '-', 'no bots: no level');
  assert.deepEqual(setupValues(ui, 4), []);
  setRow(ui, 0, 4);
  assert.equal(ui.tour.draft.humans, 4, 'fewer players: no more humans than players');
  setRow(ui, 0, 16);
  assert.deepEqual(setupValues(ui, 0), [2, 4, 8, 16], 'S18: no 32');
  run(ui, ['right']);
  assert.equal(ui.tour.draft.size, 16, 'stops at 16');
  setRow(ui, 1, 16);
  run(ui, ['right']);
  assert.equal(ui.tour.draft.humans, 16, 'stops at the size');
  setRow(ui, 2, 'rising');
  assert.equal(setupLabel(ui, 3), '5', 'Rising starts from 5');
  setRow(ui, 3, 7);
  assert.equal(ui.tour.draft.same, 11, 'Same keeps its own length');
  assert.equal(lengthsLine(ui.tour.draft), 'First to 7, 9, 9, 11, round by round, win by 2');
  ui.sel = 0;
  assert.deepEqual(run(ui, ['ok']), [null]);
  assert.equal(ui.sel, 1, 'OK moves down a row');
  run(ui, ['back']);
  assert.equal(ui.screen, 'title');
  assert.equal(ui.sel, 2, 'back on TOURNAMENT');
});

test('S17: with touch the setup allows one human only', () => {
  const ui = toSetup();
  setRow(ui, 1, 3);
  setTouch(ui, true);
  assert.equal(ui.tour.draft.humans, 1);
  ui.sel = 1;
  run(ui, ['right', 'right']);
  assert.equal(ui.tour.draft.humans, 1);
  assert.deepEqual(setupValues(ui, 1), [1]);
  assert.equal(tap(ui, 1), null);
  assert.equal(ui.tour.draft.humans, 1, 'a tap can\'t add one either');
  assert.equal(tap(ui, 0), null);
  assert.equal(ui.tour.draft.size, 16, 'a tap on a row steps its value on');
  tap(ui, 0);
  assert.equal(ui.tour.draft.size, 2, '…wrapping');
});

test('S17: the characters: humans in turn, bots random and changeable; START draws the bracket', () => {
  const ui = toSetup([0.99, 0.3, 0.6, 0.0, 0.5]);
  setRow(ui, 1, 2);
  ui.sel = 5;
  run(ui, ['ok']);
  assert.equal(ui.screen, 'tselect');
  const c = ui.tour.chars;
  assert.equal(c.length, 8);
  assert.deepEqual(c.slice(0, 2), ['ronin', 'adam'], 'the humans in the roster\'s order');
  assert.deepEqual(c.slice(2, 4), ['will', 'adam'], 'the bots at random (0.99, 0.3 of 4)');
  assert.equal(ui.sel, 0, 'P1 picks first');
  run(ui, ['right', 'right', 'ok']);
  assert.equal(c[0], 'ben');
  assert.equal(ui.sel, 1, 'then P2');
  run(ui, ['left', 'ok']);
  assert.equal(c[1], 'ronin');
  assert.equal(ui.sel, 9, 'then START (RANDOM BOTS is 8)');
  run(ui, ['up', 'up', 'up', 'up']);
  assert.equal(ui.sel, 5);
  const bot = c[5];
  run(ui, ['right']);
  assert.equal(c[5], ui.roster[(ui.roster.indexOf(bot) + 1) % 4], 'a bot\'s character changed');
  assert.equal(tap(ui, 6), null);
  assert.equal(ui.sel, 6, 'a tap selects a slot');
  const was = c[6];
  tap(ui, TSELECT_NEXT);
  assert.notEqual(c[6], was, 'a tap on the figure changes it');
  run(ui, ['back']);
  assert.equal(ui.screen, 'tsetup');
  ui.sel = 5;
  run(ui, ['ok']);
  assert.equal(tap(ui, TSELECT_START), 'tsave', 'START by tapping');
  assert.equal(ui.screen, 'bracket');
  const t = /** @type {any} */ (ui.tour.t);
  assert.equal(t.setup.humans, 2);
  assert.equal(t.setup.size, 8);
  assert.equal(t.setup.chars.length, 8);
});

test('S18b: the bracket: PLAY a human\'s match and lose it to a bot: out, and on through the bots\' matches to a bot champion', () => {
  const ui = toSetup();
  setRow(ui, 0, 8);
  startIt(ui);
  const t = /** @type {any} */ (ui.tour.t);
  while (!nextMatch(t)?.mustPlay) { ui.sel = 1; run(ui, ['ok']); }     // SKIP until it's the human's turn
  const m = /** @type {any} */ (nextMatch(t));
  ui.sel = 0;
  run(ui, ['ok', 'ok', 'ok']);                                   // PLAY, the card, the controllers
  assert.equal(matchOver(ui, { winner: 1, scores: [2, 5] }), 'tsave');
  assert.doesNotMatch(tourLine(/** @type {any} */ (ui.tour.last)), /AGAIN/, 'no replay');
  run(ui, ['ok']);
  assert.equal(ui.screen, 'bracket');
  assert.equal(t.rounds[m.round][m.index].winner, m.sides[1], 'the bot went on');
  assert.deepEqual(bracketItems(ui), BRACKET_ITEMS.bots, 'every match left is the bots\'');
  // a watched one, then SKIP BOT MATCHES to the end
  ui.sel = 0;
  assert.deepEqual(run(ui, ['ok', 'ok']), [null, 'prepare'], 'WATCH: the card, the match');
  matchOver(ui, { winner: 0, scores: [5, 3] });
  run(ui, ['ok']);
  if (nextMatch(t)) {
    ui.sel = bracketItems(ui).indexOf(SKIP_BOTS);
    assert.deepEqual(run(ui, ['ok']), ['tsave']);
  }
  assert.equal(nextMatch(t), null, 'SKIP BOT MATCHES ran to the end');
  assert.ok(/** @type {number} */ (champion(t)) >= 1, 'a bot is champion');
  assert.deepEqual(bracketItems(ui), BRACKET_ITEMS.done);
  ui.sel = 0;
  run(ui, ['ok']);
  assert.equal(ui.screen, 'champion');
});

test('S17: the bracket: PLAY a human\'s match and win it; back to the bracket; back from the controllers and the card', () => {
  const ui = toSetup();
  setRow(ui, 0, 4);
  startIt(ui);
  const t = /** @type {any} */ (ui.tour.t);
  while (!nextMatch(t)?.mustPlay) { ui.sel = 1; run(ui, ['ok']); }     // SKIP until it's the human's turn
  assert.deepEqual(bracketItems(ui), drawFixedItems(t, BRACKET_ITEMS.play));
  ui.sel = 0;
  assert.deepEqual(run(ui, ['ok']), [null], 'PLAY: the round title card first');
  assert.equal(ui.screen, 'tcard');
  assert.equal(ui.tour.watch, false);
  assert.deepEqual(run(ui, ['ok']), ['prepare'], 'then the controllers screen, with the match built');
  assert.equal(ui.screen, 'assign');
  const m = /** @type {any} */ (ui.tour.match);
  assert.deepEqual(m.cpu, [false, true], 'the human is P1 against the bot');
  assert.deepEqual(matchPicks(ui), m.sides.map((/** @type {number} */ e) => t.setup.chars[e]));
  assert.deepEqual(run(ui, ['ok']), ['start']);
  assert.deepEqual(pauseItems(ui), PAUSE_ITEMS, 'no Skip match in a human\'s match');
  assert.equal(matchOver(ui, { winner: 0, scores: [5, 1] }), 'tsave');
  assert.equal(ui.screen, 'result');
  assert.deepEqual(resultItems(ui), RESULT_TOUR_ITEMS);
  assert.doesNotMatch(tourLine(/** @type {any} */ (ui.tour.last)), /AGAIN/);
  assert.doesNotMatch(cardRules(/** @type {any} */ (ui.tour.match)), /TRY/);
  run(ui, ['ok']);
  assert.equal(ui.screen, 'bracket');
  assert.equal(ui.tour.match, null);
  // back from the controllers screen goes to the bracket, not the characters
  while (nextMatch(t) && !nextMatch(t)?.mustPlay) { ui.sel = 1; run(ui, ['ok']); }
  assert.ok(nextMatch(t)?.mustPlay, 'the final has the human in it');
  ui.sel = 0;
  run(ui, ['ok', 'ok', 'back']);
  assert.equal(ui.screen, 'bracket');
  assert.equal(ui.tour.match, null);
  // back from the round card goes to the bracket too; a tap on it goes on; so does its time running out (main.js)
  run(ui, ['ok', 'back']);
  assert.equal(ui.screen, 'bracket');
  assert.equal(ui.tour.match, null);
  run(ui, ['ok']);
  assert.equal(tap(ui, null), 'prepare');
  assert.equal(ui.screen, 'assign');
  run(ui, ['back', 'ok']);
  assert.equal(ui.screen, 'tcard');
  assert.equal(cardOver(ui), 'prepare');
  assert.equal(ui.screen, 'assign');
  assert.equal(cardOver(ui), null, 'only on the card');
});

test('S17: a bots\' match watched, skipped from the bracket, or skipped partway from the pause menu', () => {
  const ui = toSetup();
  setRow(ui, 0, 16);
  startIt(ui);
  const t = /** @type {any} */ (ui.tour.t);
  toBotsMatch(ui);
  assert.deepEqual(bracketItems(ui), drawFixedItems(t, BRACKET_ITEMS.bots));
  // SKIP
  const before = /** @type {any} */ (nextMatch(t));
  ui.sel = 1;
  assert.deepEqual(run(ui, ['ok']), ['tsave']);
  assert.equal(t.rounds[before.round][before.index].skipped, true);
  // WATCH, then Skip match from the pause menu
  toBotsMatch(ui);
  ui.sel = 0;
  assert.deepEqual(run(ui, ['ok']), [null], 'WATCH: the round title card');
  assert.equal(ui.screen, 'tcard');
  assert.equal(ui.tour.watch, true);
  assert.deepEqual(run(ui, ['ok']), ['prepare'], 'then straight into the match');
  assert.equal(ui.screen, 'match');
  assert.deepEqual(ui.tour.match?.cpu, [true, true]);
  run(ui, ['back']);
  assert.equal(ui.screen, 'pause');
  assert.deepEqual(pauseItems(ui), ['RESUME', 'RESTART MATCH', 'SOUND ON', PAUSE_SKIP, 'QUIT TO TITLE']);
  assert.equal(pauseLabels(ui)[3], PAUSE_SKIP);
  ui.sel = 3;
  assert.deepEqual(run(ui, ['ok']), ['skiprest']);
  assert.equal(ui.screen, 'match');
  const w = /** @type {any} */ (nextMatch(t));
  assert.equal(matchOver(ui, { winner: 1, scores: [3, 5] }), 'tsave');
  assert.equal(t.rounds[w.round][w.index].skipped, true, 'skipped partway counts as skipped');
  assert.equal(ui.tour.skipping, false);
  run(ui, ['ok']);
  // a watched one played to the end isn't marked skipped
  toBotsMatch(ui);
  ui.sel = 0;
  run(ui, ['ok', 'ok']);
  const w2 = /** @type {any} */ (nextMatch(t));
  matchOver(ui, { winner: 0, scores: [5, 3] });
  assert.equal(t.rounds[w2.round][w2.index].skipped, false);
});

test('S17: quitting mid-match keeps the tournament; Continue, and New asks first', () => {
  const ui = toSetup();
  setRow(ui, 0, 2);
  startIt(ui);
  ui.sel = 0;
  run(ui, ['ok', 'ok', 'ok', 'back']);                            // PLAY, the card, play, pause
  ui.sel = pauseItems(ui).indexOf('QUIT TO TITLE');
  assert.deepEqual(run(ui, ['ok']), ['quit']);
  assert.equal(ui.screen, 'title');
  assert.equal(ui.sel, 2);
  assert.equal(ui.tour.match, null);
  assert.ok(ui.tour.t, 'still under way');
  run(ui, ['ok']);
  assert.equal(ui.screen, 'tmenu', 'a tournament is saved: Continue or New');
  run(ui, ['ok']);
  assert.equal(ui.screen, 'bracket');
  assert.equal(/** @type {any} */ (ui.tour.t).rounds[0][0].winner, null, 'the quit match starts again');
  run(ui, ['back', 'ok', 'down', 'ok']);
  assert.equal(ui.screen, 'tconfirm');
  assert.equal(ui.sel, 0, 'starts on KEEP IT');
  run(ui, ['ok']);
  assert.equal(ui.screen, 'tmenu');
  ui.sel = 0;
  run(ui, ['ok']);
  assert.equal(ui.screen, 'bracket');
  run(ui, ['back', 'ok', 'down', 'ok', 'down', 'ok']);
  assert.equal(ui.screen, 'tsetup');
  assert.ok(ui.tour.t, 'the saved one stays until the new one starts');
  // a loaded tournament (main.js at the start)
  const fresh = withRoster();
  setTournament(fresh, makeTournament({ size: 4, humans: 1, mode: 'same', length: 5, level: 5, chars: ['a', 'b', 'c', 'd'], seed: 3 }));
  run(fresh, ['down', 'down', 'ok']);
  assert.equal(fresh.screen, 'tmenu');
});

test('S17: to the champion, and then the save is forgotten', () => {
  const ui = toSetup();
  setRow(ui, 0, 4);
  setRow(ui, 1, 2);
  startIt(ui);
  const t = /** @type {any} */ (ui.tour.t);
  for (let n = 0; n < 10 && nextMatch(t); n++) {
    toBotsMatch(ui);
    if (nextMatch(t)) { ui.sel = 1; run(ui, ['ok']); }
  }
  assert.equal(nextMatch(t), null);
  assert.ok(/** @type {number} */ (champion(t)) < 2, 'a human');
  assert.deepEqual(bracketItems(ui), BRACKET_ITEMS.done);
  ui.sel = 0;
  run(ui, ['ok']);
  assert.equal(ui.screen, 'champion');
  assert.deepEqual(run(ui, ['ok']), ['tclear']);
  assert.equal(ui.tour.t, null);
  assert.equal(ui.screen, 'title');
  run(ui, ['ok']);
  assert.equal(ui.screen, 'tsetup', 'nothing saved now: straight to the setup');
});

test('S17: the tournament screens\' words are in the font and fit', () => {
  const fonts = parseFonts(JSON.parse(fs.readFileSync('public/hogg-squash/assets/font.json', 'utf8')));
  const fits = (/** @type {any} */ font, /** @type {string} */ line, /** @type {number} */ max) => {
    for (const ch of line) if (ch !== ' ') assert.ok(glyphFor(fonts[font], ch), `${font} has ${ch} (${line})`);
    assert.ok(measureWith(fonts, font, line) <= max, `${font} "${line}" fits in ${max} px`);
  };
  const W = (/** @type {any} */ f, /** @type {string} */ s) => measureWith(fonts, f, s);
  for (const l of [TOUR_TEXT.menuHint, TOUR_TEXT.setupHint, TOUR_TEXT.setupTouch, TOUR_TEXT.selectHint, TOUR_TEXT.selectTouch,
    TOUR_TEXT.menuTouch]) fits('small', l, 600);
  for (const l of [TOUR_TEXT.saved, TOUR_TEXT.confirmNote]) fits('small-dark', l, 320);
  for (const l of [TOUR_TEXT.heading, TOUR_TEXT.confirm, ...TMENU_ITEMS, ...TCONFIRM_ITEMS]) fits('large-red', l, 306);
  for (const l of [TOUR_TEXT.charsNote, TOUR_TEXT.touchOne, roundsLine(32),
    lengthsLine({ size: 32, humans: 1, mode: 'rising', same: 11, start: 5, level: 5 }), whoLine(32, 31, 9)]) fits('small-grey', l, 590);
  // the setup's rows: labels left of the values, values (with their bar and cursors) inside the panel
  for (const l of TSETUP_ROWS) fits('large-red', l, SETUP_LAYOUT.VALUE_X - 40 - SETUP_LAYOUT.LABEL_X);
  for (const v of ['RISING', 'SAME', '32']) fits('large-white', v, 2 * (600 - SETUP_LAYOUT.VALUE_X - 20));
  assert.ok(SETUP_LAYOUT.START_Y > SETUP_LAYOUT.TOP + 4 * SETUP_LAYOUT.ROW + 21, 'START below the rows');
  assert.ok(SETUP_LAYOUT.NOTES_Y + 4 * 13 < 330 - 4, 'the notes above the hint');
  // the characters list: the longest line in its column; 16 rows above the hint; the list clear of the figure
  const longest = entrantLine({ humans: 1 }, 31, 'Coach Zain');
  assert.equal(longest, 'BOT 31 Coach Zain');
  fits('small', 'BOT 31', TSELECT_LAYOUT.LABEL_W - 2);
  fits('small', 'Coach Zain', TSELECT_LAYOUT.COL_W - TSELECT_LAYOUT.LABEL_W - 6);
  assert.ok(TSELECT_LAYOUT.COLS[1] + TSELECT_LAYOUT.COL_W < TSELECT_LAYOUT.FIG_X - 60, 'the list clear of the figure');
  assert.ok(TSELECT_LAYOUT.TOP + 16 * TSELECT_LAYOUT.ROW <= 330 - 20);
  // the bracket (S18, A12's look): the wording; every size's slots clear of each other, the middle and the panel
  assert.equal(peopleLine({ size: 16, humans: 2, level: 5 }), '2 PEOPLE, 14 BOTS, BOT LEVEL: 5', 'the owner\'s call (S18)');
  assert.equal(peopleLine({ size: 8, humans: 1, level: 7 }), '1 PERSON, 7 BOTS, BOT LEVEL: 7');
  assert.equal(peopleLine({ size: 2, humans: 1, level: 5 }), '1 PERSON, 1 BOT, BOT LEVEL: 5');
  assert.equal(peopleLine({ size: 4, humans: 4, level: 5 }), '4 PEOPLE, NO BOTS');
  fits('small-grey', peopleLine({ size: 32, humans: 31, level: 9 }), 590);
  const B = BRACKET_LAYOUT;
  for (const size of [2, 4, 8, 16, 32]) {
    const G = bracketGeometry(size);
    for (let r = 0; r < G.R; r++) {
      const h = B.SLOT_H[G.style(r)], n = (size >> r) / 2;
      // A12's 16 (and a saved 32) stack the first round's slots edge to edge, as mocked; everything else stands apart
      if (n > 1) assert.ok(G.yOf(r, 1) - G.yOf(r, 0) >= (r === 0 && size >= 16 ? h - 2 : h + 3),
        `${size}: round ${r}'s slots clear of each other (or, stacked, no more than touching)`);
      assert.ok(G.yOf(r, 0) - h / 2 >= B.WHO_Y + 12, `${size}: below the heading`);
      assert.ok(G.yOf(r, n - 1) + h / 2 <= G.bottom + 2, `${size}: above the next match`);
    }
    const last = G.colX[G.R - 1] + G.width(G.R - 1);
    assert.ok(last + 8 <= 320 - 30, `${size}: the last column clear of the champion's slot (${last})`);
    assert.ok(G.gap >= 5, `${size}: room for the lines (${G.gap})`);
    if (size <= 16) assert.ok(G.gap >= 9, `${size}: room for the points on the lines (A12's 16: 9 px)`);
  }
  // the first round's cards: the longest name inside (else the short one)
  fits('small', 'Coach Zain', B.W0 - 8);
  fits('small', 'BOT 14', B.WT - 6);
  fits('small', 'BOT 31', B.WT - 6);
  // the next match, its players, the choices: above the panel's bottom, at 16 (the lowest)
  const big = bracketGeometry(16), itemsTop = big.bottom + 14 + 34;
  assert.ok(itemsTop + 3 * B.ITEM_ROW + 14 <= 354 - 2, 'four choices inside the panel');
  for (const r of [32, 16, 8, 4, 2]) fits('large-red', roundName(r), 300);
  fits('large-red', 'THE CHAMPION', 300);
  assert.equal(nextLine(/** @type {any} */ ({ length: 9 })), 'NEXT: FIRST TO 9');
  fits('small-grey', nextLine(/** @type {any} */ ({ length: 11 })), 590);
  fits('large-white', `${longest}  v  ${entrantLine({ humans: 30 }, 29, 'Coach Zain')}`, 590);
  for (const l of [...BRACKET_ITEMS.bots, ...BRACKET_ITEMS.done, ...RESULT_TOUR_ITEMS, ...CHAMPION_ITEMS, PAUSE_SKIP, 'START'])
    fits('large-white', l, 400);
  assert.ok(BRACKET_ITEMS.bots.includes(SKIP_BOTS));
  fits('small', '? 0123456789 FINAL', 200);
  // the round title card: every round's name in the 28 px lettering on its band; the rules and the players on it
  const K = CARD_LAYOUT;
  for (const r of [32, 16, 8, 4, 2]) fits('huge-red', roundName(r), K.W - 16);
  const rules = cardRules(/** @type {any} */ ({ length: 11, cpu: [false, true], level: 9 }));
  assert.equal(rules, 'FIRST TO 11, WIN BY 2, LEVEL 9', 'S18b: no TRY');
  assert.equal(cardRules(/** @type {any} */ ({ length: 9, cpu: [false, false], level: 5 })), 'FIRST TO 9, WIN BY 2',
    'no level for two humans');
  fits('small-grey', rules, K.W - 16);
  const zainView = { name: () => 'Coach Zain', short: () => 'Zain', t: 0 }, s16 = { humans: 2, chars: Array(16).fill('zain') };
  assert.equal(cardPlayer(/** @type {any} */ (s16), 15, zainView), 'BOT 14 Zain', 'too wide: the short name');
  assert.equal(cardPlayer(/** @type {any} */ (s16), 0, zainView), 'P1 Coach Zain');
  fits('large-white', cardPlayer(/** @type {any} */ (s16), 15, zainView), K.W / 2 - K.V_GAP - 8);
  fits('large-white', 'BOT 1 Coach Zain', K.W / 2 - K.V_GAP - 8);
  // the result line and the champion's list (big rows; small rows in one column; the short form in two columns)
  fits('small-grey', tourLine(/** @type {any} */ ({ info: { name: 'QUARTER-FINAL', length: 11 } })), 560);
  const L = CHAMPION_LAYOUT;
  assert.equal(recordLine({ wins: 3, out: null, champion: true }), '3 wins, champion', 'S18b: the records');
  assert.equal(recordLine({ wins: 1, out: 'SEMI-FINAL', champion: false }), '1 win, out in the SEMI-FINAL');
  assert.equal(recordLine({ wins: 0, out: 'QUARTER-FINAL', champion: false }), '0 wins, out in the QUARTER-FINAL');
  fits('small-grey', recordLine({ wins: 9, out: 'QUARTER-FINAL', champion: false }), 624 - L.LIST_X - 4);
  fits('small-grey', recordLine({ wins: 9, out: 'ROUND OF 16', champion: false }), 624 - L.LIST_X - 4);
  fits('large-white', 'P6 Coach Zain', 624 - L.LIST_X - 4);
  assert.ok(L.LIST_Y + 16 + (L.BIG_MAX - 1) * L.BIG_ROW + 18 + 9 <= L.MENU_Y - 4, 'the big rows above BACK TO THE TITLE');
  const t = makeTournament({ size: 32, humans: 32, mode: 'same', length: 5, level: 5, chars: Array(32).fill('zain'), seed: 1 });
  t.rounds[0].forEach((m, i) => { m.winner = t.order[2 * i]; m.scores = [5, 0]; });
  const loser = t.order[1];
  const long = humanLine(t, loser, 'Coach Zain').replace(/\d+ wins?/, '9 wins').replace('ROUND OF 32', 'QUARTER-FINAL');
  assert.match(long, /: 9 wins, out in the QUARTER-FINAL$/);
  assert.doesNotMatch(humanLine(t, loser, 'Coach Zain'), /tr(y|ies)/, 'S18b: no tries');
  fits('small', long.replace(/P\d+/, 'P16'), 624 - L.LIST_X - 4);
  fits('small', humanLine(t, loser, 'Coach Zain', true).replace(/\d+ wins?/, '9 wins'), L.LIST_X2 - L.LIST_X - 6);
  fits('small', humanLine(t, 31, 'Coach Zain', true).replace(/\d+ wins?/, '9 wins'), 624 - L.LIST_X2 - 4);
  assert.ok(L.LIST_Y + 16 + 16 * L.ROW <= L.MENU_Y - 4);
  fits('small-red', TOUR_TEXT.humans, 200);
  fits('huge-red', TOUR_TEXT.champion, 590);
  fits('small-grey', 'WON THE 16-PLAYER TOURNAMENT', 2 * (L.NAME_X - 16 - 4));
  fits('large-red', TOUR_TEXT.chars, 300);
  fits('small-grey', TOUR_TEXT.change, 120);
});

// --- S18b: random buttons ---
import { cardX, SELECT_LAYOUT } from '../public/hogg-squash/js/ui/select.js';

test('S18b, 1P: the "?" card picks a random character; undo goes back to "?"; a rematch keeps the rolled one', () => {
  const ui = withRoster([0.6, 0.3]);                       // the CPU on Ben (0.6), then P1's roll: Adam (0.3)
  run(ui, ['ok', 'ok', 'ok']);
  assert.equal(ui.screen, 'select');
  run(ui, ['left']);
  assert.equal(ui.pick.at[0], 4, 'left from Ronin: the "?" card, after the four');
  assert.equal(navigate(ui, 'ok'), 'prepare', 'picking "?" picks (the CPU has its pick)');
  assert.equal(ui.pick.at[0], 1, 'a random character: Adam (0.3 of 4)');
  assert.deepEqual(ui.pick.rolled, [true, false]);
  assert.deepEqual(ui.settings.picks, ['adam', 'ben']);
  run(ui, ['back']);                                         // back from the controllers: choosing again
  assert.equal(ui.screen, 'select');
  assert.equal(ui.pick.at[0], 4, 'a rolled pick goes back to "?"');
  ui.rand = () => 0.99;
  assert.equal(navigate(ui, 'ok'), 'prepare');
  assert.equal(ui.settings.picks[0], 'will', 'rolled again: Will (0.99 of 4)');
  run(ui, ['ok']);
  matchOver(ui);
  assert.deepEqual(run(ui, ['ok']), ['rematch']);
  assert.equal(ui.settings.picks[0], 'will', 'the rematch keeps the rolled character, not "random"');
  // touch: a tap on the "?" card
  const t = withRoster([0.6, 0.0]);
  run(t, ['ok', 'ok', 'ok']);
  assert.equal(tap(t, 5), null, 'past the "?" card: nothing');
  assert.equal(tap(t, 4), 'prepare', 'a tap on "?" picks a random one');
  assert.equal(t.settings.picks[0], 'ronin');
  // the CPU's own roll is unchanged: up / down never lands on "?"
  const c = withRoster([0.99, 0.99, 0.99]);
  run(c, ['ok', 'ok', 'ok', 'down', 'down', 'up']);
  assert.ok(c.pick.at[1] < 4);
});

test('S18b, 2P: each side has the "?" card; undo returns to it', () => {
  const ui = withRoster([0.5, 0.0]);
  run(ui, ['down', 'ok', 'ok']);
  navigate(ui, 'left', 1);
  navigate(ui, 'left', 1);
  assert.equal(ui.pick.at[1], 4, 'P2 on "?" (left from Adam, past Ronin)');
  navigate(ui, 'left', 0);
  assert.equal(ui.pick.at[0], 4, 'P1 on "?" too');
  assert.equal(navigate(ui, 'ok', 1), null);
  assert.equal(ui.pick.at[1], 2, 'P2 rolled Ben (0.5 of 4)');
  navigate(ui, 'back', 1);
  assert.deepEqual([ui.pick.at[1], ui.pick.locked[1]], [4, false], 'undo: back on "?"');
  navigate(ui, 'ok', 1);
  assert.equal(navigate(ui, 'ok', 0), 'prepare');
  assert.equal(ui.settings.picks.length, 2);
  assert.ok(ui.settings.picks.every(p => ui.roster.includes(p)), 'both roster characters (a mirror allowed)');
});

test('S18b: the "?" card fits the row beside both figures', () => {
  const L = SELECT_LAYOUT, n = 5;
  assert.equal(cardX(0, 4), 224, 'four cards stay where S15 put them');
  assert.ok(cardX(0, n) - L.CARD_W / 2 >= L.SIDES[0] + 50, 'clear of P1\'s figure');
  assert.ok(cardX(n - 1, n) + L.CARD_W / 2 <= L.SIDES[1] - 50, 'clear of P2\'s figure');
});

test('S18b: the tournament\'s "?" (rolled on OK or START) and RANDOM BOTS (the humans keep theirs)', () => {
  const ui = toSetup([0.0, 0.3, 0.6, 0.99, 0.0, 0.3, 0.6, 0.99]);
  setRow(ui, 1, 2);
  ui.sel = 5;
  run(ui, ['ok']);
  assert.equal(ui.screen, 'tselect');
  assert.deepEqual(tselectItems(ui), [RANDOM_BOTS, 'START']);
  const c = ui.tour.chars;
  run(ui, ['left']);
  assert.equal(c[0], RANDOM_CHAR, 'left from Ronin: "?" after the roster');
  run(ui, ['right']);
  assert.equal(c[0], 'ronin', 'right from "?" wraps to the first');
  ui.rand = () => 0.6;
  run(ui, ['left', 'ok']);
  assert.equal(c[0], 'ben', 'P1\'s "?" rolled on their OK (0.6 of 4)');
  assert.equal(ui.sel, 1);
  run(ui, ['left', 'left']);
  assert.equal(c[1], RANDOM_CHAR, 'P2 on "?" (left from Adam, past Ronin)');
  // RANDOM BOTS: every bot new, the humans kept (P2 still on "?")
  let k = 0;
  const rolls = [0.0, 0.3, 0.6, 0.99, 0.0, 0.3];
  ui.rand = () => rolls[k++ % rolls.length];
  ui.sel = 8;
  assert.equal(run(ui, ['ok'])[0], null);
  assert.deepEqual(c.slice(0, 2), ['ben', RANDOM_CHAR], 'the humans keep theirs');
  assert.deepEqual(c.slice(2), ['ronin', 'adam', 'ben', 'will', 'ronin', 'adam'], 'each bot rolled');
  assert.equal(ui.sel, 8, 'still on RANDOM BOTS');
  ui.sel = 3;
  run(ui, ['left']);
  assert.equal(c[3], 'ronin');
  run(ui, ['left']);
  assert.equal(c[3], RANDOM_CHAR, 'a bot on "?"');
  // a tap on RANDOM BOTS works too
  ui.rand = () => 0.99;
  assert.equal(tap(ui, TSELECT_BOTS), null);
  assert.deepEqual(c.slice(2), Array(6).fill('will'));
  c[4] = RANDOM_CHAR;
  ui.rand = () => 0.3;
  ui.sel = tselectStart(ui);
  assert.deepEqual(run(ui, ['ok']), ['tsave'], 'START');
  const t = /** @type {any} */ (ui.tour.t);
  assert.deepEqual(t.setup.chars, ['ben', 'adam', 'will', 'will', 'adam', 'will', 'will', 'will'],
    'the "?" left (P2\'s and a bot\'s) rolled at START');
  // no bots: no RANDOM BOTS
  const all = toSetup();
  setRow(all, 1, 8);
  all.sel = 5;
  run(all, ['ok']);
  assert.deepEqual(tselectItems(all), ['START']);
  assert.equal(tselectStart(all), 8);
});

test('S18b: NEW DRAW on the bracket until the first result: a new draw, the same setup and characters, saved', () => {
  const ui = toSetup([0.25, 0.5, 0.75, 0.1, 0.2, 0.3, 0.4, 0.6, 0.7, 0.8, 0.9]);
  setRow(ui, 0, 16);
  startIt(ui);
  const t = /** @type {any} */ (ui.tour.t), setup = structuredClone(t.setup), orders = [t.order.join()];
  const items = bracketItems(ui);
  assert.equal(items[items.length - 1], 'QUIT TO TITLE');
  assert.equal(items[items.length - 2], NEW_DRAW, 'offered before the first match, before QUIT TO TITLE');
  for (let n = 0; n < 2; n++) {
    ui.sel = bracketItems(ui).indexOf(NEW_DRAW);
    assert.deepEqual(run(ui, ['ok']), ['tsave'], 'saved');
    assert.equal(ui.screen, 'bracket');
    assert.equal(bracketItems(ui)[ui.sel], NEW_DRAW, 'still on NEW DRAW');
    assert.deepEqual(t.order, drawOrder(16, t.setup.seed));
    orders.push(t.order.join());
    assert.deepEqual({ ...t.setup, seed: 0 }, { ...setup, seed: 0 }, 'the setup and characters kept');
  }
  assert.equal(new Set(orders).size, 3, 'a different bracket each time');
  // five items in two columns: left / right move between them
  if (!nextMatch(t)?.mustPlay) {
    assert.equal(bracketItems(ui).length, 5);
    ui.sel = 1;
    run(ui, ['right']);
    assert.equal(ui.sel, 4);
    run(ui, ['left']);
    assert.equal(ui.sel, 1);
  }
  // after the first result it's gone
  if (nextMatch(t)?.mustPlay) {
    ui.sel = 0;
    run(ui, ['ok', 'ok', 'ok']);
    matchOver(ui, { winner: 0, scores: [5, 0] });
    run(ui, ['ok']);
  } else {
    ui.sel = 1;
    run(ui, ['ok']);
  }
  assert.ok(!bracketItems(ui).includes(NEW_DRAW), 'the draw is fixed');
});

test('S18b: the new words are in the font and fit', () => {
  const fonts = parseFonts(JSON.parse(fs.readFileSync('public/hogg-squash/assets/font.json', 'utf8')));
  const fits = (/** @type {any} */ font, /** @type {string} */ line, /** @type {number} */ max) => {
    for (const ch of line) if (ch !== ' ') assert.ok(glyphFor(fonts[font], ch), `${font} has ${ch} (${line})`);
    assert.ok(measureWith(fonts, font, line) <= max, `${font} "${line}" fits in ${max} px`);
  };
  fits('small', SELECT_TEXT.random, SELECT_LAYOUT.CARD_W - 4);
  fits('large-white', SELECT_TEXT.random, 180);
  fits('huge-red', '?', SELECT_LAYOUT.RANDOM_W - 8);
  fits('large-red', '?', 36);
  fits('small', SELECT_TEXT.random, TSELECT_LAYOUT.COL_W - TSELECT_LAYOUT.LABEL_W - 6);
  fits('large-red', RANDOM_BOTS, 2 * (608 + 16 - TSELECT_LAYOUT.FIG_X - 8));
  fits('large-white', NEW_DRAW, 400);
  // the bracket's two columns (WATCH, SKIP, SKIP BOT MATCHES | NEW DRAW, QUIT TO TITLE): apart, inside the panel
  const B = BRACKET_LAYOUT, W = (/** @type {string} */ s) => measureWith(fonts, 'large-white', s) + 12;
  const left = Math.max(...['WATCH', 'SKIP', SKIP_BOTS].map(W)), right = Math.max(...[NEW_DRAW, 'QUIT TO TITLE'].map(W));
  assert.ok(320 - B.COL_DX - left / 2 >= 16 + 8, 'the left column inside the panel');
  assert.ok(320 - B.COL_DX + left / 2 + 12 <= 320 + B.COL_DX - right / 2, 'the columns apart');
  assert.ok(320 + B.COL_DX + right / 2 <= 624 - 8, 'the right column inside the panel');
  // RANDOM BOTS over START, above the hint, below the figure's lines
  assert.ok(TSELECT_LAYOUT.START_Y + 21 <= 330 - 2, 'START above the hint');
  assert.ok(TSELECT_LAYOUT.START_Y - TSELECT_LAYOUT.ITEM_ROW >= TSELECT_LAYOUT.FIG_FEET + 26 + 9 + 4, 'RANDOM BOTS below "< change >"');
  // the champion screen with a bot champion: its line fits as a human's does
  fits('large-white', 'BOT 15 Coach Zain', 2 * (CHAMPION_LAYOUT.NAME_X - 16 - 4));
});

// --- S19: the characters screen ready for more characters ---
import { cardRect, cardBelow, drawSelect } from '../public/hogg-squash/js/ui/select.js';
import { hits, clearHits } from '../public/hogg-squash/js/ui/menu.js';
import { testRoster } from '../public/hogg-squash/js/render/roster.js';

/** A ui on the characters screen with a roster of n ids (c0, c1 …), its random numbers from a list. */
function onSelect(n, players = 2, rolls = [0]) {
  const ui = makeUi();
  setRoster(ui, Array.from({ length: n }, (_, i) => `c${i}`));
  let k = 0;
  ui.rand = () => rolls[k++ % rolls.length];
  run(ui, players === 2 ? ['down', 'ok', 'ok'] : ['ok', 'ok', 'ok']);
  assert.equal(ui.screen, 'select');
  return ui;
}

/** A canvas that draws nothing (the screen's tap areas are still recorded as it draws). */
const noCtx = /** @type {any} */ (new Proxy({}, {
  get: (_, k) => (k === 'canvas' ? { width: 640, height: 360 } : () => ({})), set: () => true }));

test('S19: up to five cards are one row exactly as S18b drew it; six or more are two rows, "?" last', () => {
  for (const count of [2, 3, 4, 5]) {
    for (let i = 0; i < count; i++) {
      const c = cardRect(i, count);
      assert.deepEqual([c.x, c.top, c.w, c.h, c.feet, c.figure, c.row], [320 + (i - (count - 1) / 2) * 64, 92, 60, 104, 176, 72, 0]);
    }
  }
  const L = SELECT_LAYOUT;
  const fonts = parseFonts(JSON.parse(fs.readFileSync('public/hogg-squash/assets/font.json', 'utf8')));
  // what's drawn under the big figures (the widest name, the CPU's lines), which the second row sits beside
  const under = [['large-white', 'Coach Zain', L.FEET + 6], ['small-grey', SELECT_TEXT.cpuRows[1], L.FEET + 41],
    ['small-grey', SELECT_TEXT.choose, L.FEET + 30], ['large-white', SELECT_TEXT.random, L.FEET + 6]]
    .map(([f, s, y]) => ({ half: measureWith(fonts, /** @type {any} */ (f), String(s)) / 2, y: Number(y) }));
  for (const chars of [4, 5, 6, 8, 9]) {
    const count = chars + 1, cards = Array.from({ length: count }, (_, i) => cardRect(i, count));
    assert.equal(new Set(cards.map(c => c.row)).size, count <= 5 ? 1 : 2, `${chars} characters: the rows`);
    if (count > 5) assert.equal(cards.filter(c => c.row === 0).length, 5, 'the first row full');
    const last = cards[count - 1];
    assert.ok(cards.every(c => c.row < last.row || (c.row === last.row && c.x <= last.x)), `${chars}: "?" last`);
    const second = cards.filter(c => c.row === 1);
    if (second.length) assert.equal(second[0].x + second[second.length - 1].x, 640, 'the second row centred');
    cards.forEach((a, i) => {
      assert.ok(a.left >= L.SIDES[0] + 50 && a.left + a.w <= L.SIDES[1] - 50, `${chars}: card ${i} clear of the big figures`);
      assert.ok(a.top - 11 >= L.y + 30 + 9 && a.top + a.h <= L.y + L.h - 62 - 2, `${chars}: card ${i} between the title lines and the note`);
      for (const u of under) {
        if (u.y + 9 > a.top - 11 && u.y < a.top + a.h)
          assert.ok(a.left + a.w < L.SIDES[1] - u.half && a.left > L.SIDES[0] + u.half, `${chars}: card ${i} clear of the lines under the figures`);
      }
      cards.slice(i + 1).forEach((b, j) => {
        const apart = a.left + a.w <= b.left || b.left + b.w <= a.left || a.top + a.h + 11 <= b.top || b.top + b.h + 11 <= a.top;
        assert.ok(apart, `${chars}: cards ${i} and ${i + 1 + j} don't overlap (with the P1 / P2 labels)`);
      });
    });
  }
  // past ten cards the rows get narrower but still fit
  const many = Array.from({ length: 17 }, (_, i) => cardRect(i, 17));
  assert.ok(many.every(c => c.left >= L.SIDES[0] + 50 && c.left + c.w <= L.SIDES[1] - 50));
});

test('S19: the tap areas are the cards, and the real four draw as before', () => {
  for (const n of [4, 5, 8, 9]) {
    const ui = onSelect(n);
    const ch = { name: 'Ronin', sheet: /** @type {any} */ ({ tags: { ready: { from: 0, to: 0, loop: true, ms: [100] } }, frameW: 150, frameH: 150, pivot: { x: 75, y: 140 } }),
      preview: () => /** @type {any} */ ({ cells: [{ x: 0, y: 0 }], canvas: null }) };
    clearHits();
    drawSelect(noCtx, ui, { chars: Array(n).fill(ch), t: 0 });
    const cards = hits.filter(h => typeof h.sel === 'number' && h.sel >= 0 && h.sel <= n);
    assert.deepEqual(cards.map(h => h.sel), Array.from({ length: n + 1 }, (_, i) => i));
    cards.forEach(h => {
      const c = cardRect(h.sel, n + 1);
      assert.deepEqual([h.x, h.y, h.w, h.h], [c.left, c.top, c.w, c.h], `${n}: card ${h.sel}'s tap area`);
    });
    if (n === 4) assert.deepEqual(cards.map(h => [h.x, h.y, h.w]), [162, 226, 290, 354, 418].map(x => [x, 92, 60]), 'where S18b drew them');
    // a tap on the last character picks them (touch is P1's)
    const t = onSelect(n, 1, [0.5]);
    assert.equal(tap(t, n + 1), null, 'past the "?" card: nothing');
    assert.equal(tap(t, n - 1), 'prepare');
    assert.equal(t.settings.picks[0], `c${n - 1}`, `${n}: a tap on the last character picks them`);
  }
  clearHits();
});

test('S19: left / right go through every card in order; up / down move to the nearest card in the other row', () => {
  for (const n of [4, 5, 8, 9]) {
    const count = n + 1, rowOf = (/** @type {number} */ i) => cardRect(i, count).row, xOf = (/** @type {number} */ i) => cardRect(i, count).x;
    for (const side of /** @type {const} */ ([0, 1])) {
      const ui = onSelect(n);
      const seen = [];
      for (let k = 0; k < count; k++) { seen.push(ui.pick.at[side]); navigate(ui, 'right', side); }
      assert.equal(new Set(seen).size, count, `${n}: right reaches every card`);
      assert.equal(ui.pick.at[side], seen[0], 'and wraps');
      for (let i = 0; i < count; i++) {
        ui.pick.at[side] = i;
        navigate(ui, 'down', side);
        const down = ui.pick.at[side];
        if (count <= 5 || rowOf(i) === 1) assert.equal(down, i, `${n}: no row below card ${i}`);
        else {
          assert.equal(rowOf(down), 1);
          const gaps = Array.from({ length: count }, (_, k) => k).filter(k => rowOf(k) === 1).map(k => Math.abs(xOf(k) - xOf(i)));
          assert.equal(Math.abs(xOf(down) - xOf(i)), Math.min(...gaps), `${n}: down from ${i} to the nearest`);
        }
        ui.pick.at[side] = i;
        navigate(ui, 'up', side);
        if (rowOf(i) === 0) assert.equal(ui.pick.at[side], i, `${n}: no row above card ${i} (2P: nothing happens)`);
        else assert.equal(rowOf(ui.pick.at[side]), 0);
      }
    }
    // every card can be reached from P1's start with left / right / up / down
    const reach = new Set([0]), todo = [0];
    while (todo.length) {
      const i = /** @type {number} */ (todo.pop());
      for (const nav of ['left', 'right', 'up', 'down']) {
        const ui = onSelect(n);
        ui.pick.at[0] = i;
        navigate(ui, /** @type {any} */ (nav), 0);
        if (!reach.has(ui.pick.at[0])) { reach.add(ui.pick.at[0]); todo.push(ui.pick.at[0]); }
      }
    }
    assert.equal(reach.size, count, `${n}: every card reachable`);
  }
  assert.equal(cardBelow(7, 10, 'up'), 2, '9 characters: up from the bottom row\'s third card to the top row\'s third');
  assert.equal(cardBelow(5, 7, 'up'), 1, '6 characters: the left one of two as near');
});

test('S19, 1P: with two rows up / down move P1 between them; with no row that way the CPU rolls (never "?")', () => {
  const ui = onSelect(8, 1, [0.3, 0.99, 0.5, 0.0]);
  const cpu = ui.pick.at[1];
  navigate(ui, 'down');
  assert.equal(ui.pick.at[0], 5, 'down: P1 to the bottom row');
  assert.equal(ui.pick.at[1], cpu, 'the CPU keeps its pick');
  navigate(ui, 'down');
  assert.notEqual(ui.pick.at[1], cpu, 'down from the bottom row: the CPU rolls another');
  assert.equal(ui.pick.at[0], 5);
  navigate(ui, 'up');
  assert.equal(ui.pick.at[0], 0, 'up: back to the top row');
  for (let k = 0; k < 20; k++) {
    navigate(ui, 'up');
    assert.ok(ui.pick.at[1] < 8, 'the CPU never lands on "?"');
  }
  assert.equal(ui.pick.at[0], 0);
  // one row: up / down roll, as before
  const four = onSelect(4, 1, [0.3, 0.9]);
  navigate(four, 'up');
  assert.deepEqual([four.pick.at[0], four.pick.at[1] !== 1], [0, true]);
});

test('S19: a saved pick of a character who has left falls back; so does a saved CPU pick', () => {
  const roster = ['ronin', 'adam', 'zain'];                 // Ben has left
  assert.deepEqual(pickIndices({ ...DEFAULT_SETTINGS, picks: ['ben', 'zain'] }, roster), [0, 2], 'P1\'s pick of Ben: the first');
  assert.deepEqual(pickIndices({ ...DEFAULT_SETTINGS, picks: ['zain', 'ben'] }, roster), [2, 1], 'P2\'s (or the CPU\'s): the second');
  const ui = makeUi({ picks: ['ben', 'ben'] });
  setRoster(ui, roster);
  run(ui, ['down', 'ok', 'ok']);
  assert.deepEqual(ui.pick.at, [0, 1], 'the characters screen starts on Ronin and Adam');
  assert.equal(navigate(ui, 'ok', 0), null);
  assert.equal(navigate(ui, 'ok', 1), 'prepare');
  assert.deepEqual(ui.settings.picks, ['ronin', 'adam']);
});

test('S19: a saved tournament naming Ben loads with a roster character in his place, the same every load', () => {
  const setup = { size: 4, humans: 1, mode: /** @type {const} */ ('same'), length: 5, level: 5, chars: ['ben', 'zain', 'ben', 'adam'], seed: 77 };
  const roster = ['ronin', 'adam', 'zain'];
  const first = makeUi();
  setRoster(first, roster);
  setTournament(first, makeTournament(setup));                 // the roster first, then the save
  const second = makeUi();
  setTournament(second, makeTournament(setup));                // the save first (as main.js does), then the roster
  assert.deepEqual(second.tour.t?.setup.chars, setup.chars, 'nothing changes before the roster is known');
  setRoster(second, roster);
  const chars = first.tour.t?.setup.chars ?? [];
  assert.ok(chars.every(c => roster.includes(c)), 'every entrant has a roster character');
  assert.deepEqual([chars[1], chars[3]], ['zain', 'adam'], 'the others keep theirs');
  assert.deepEqual(second.tour.t?.setup.chars, chars, 'the same replacement however it loads');
  const t = /** @type {any} */ (first.tour.t), m = nextMatch(t);
  assert.ok(m && m.sides.every((/** @type {number} */ e) => roster.includes(t.setup.chars[e])), 'its next match has two roster characters');
});

test('S19: the test roster (?roster, ?drop)', () => {
  const real = [{ id: 'ronin', name: 'Ronin', short: null }, { id: 'adam', name: 'Adam', short: null },
    { id: 'ben', name: 'Ben', short: null }, { id: 'zain', name: 'Coach Zain', short: 'Zain' }];
  assert.equal(testRoster(real, 0).length, 4);
  const nine = testRoster(real, 9);
  assert.deepEqual(nine.map(c => c.id), ['ronin', 'adam', 'ben', 'zain', 'ronin-2', 'adam-2', 'ben-2', 'zain-2', 'ronin-3']);
  assert.deepEqual(nine.slice(4, 8).map(c => c.name), ['Ronin 2', 'Adam 2', 'Ben 2', 'Zain 2']);
  assert.deepEqual(testRoster(real, 0, ['ben']).map(c => c.id), ['ronin', 'adam', 'zain']);
  assert.equal(testRoster(real, 99).length, 16);
  const fonts = parseFonts(JSON.parse(fs.readFileSync('public/hogg-squash/assets/font.json', 'utf8')));
  assert.ok(measureWith(fonts, 'small', 'Ronin 3') <= SELECT_LAYOUT.CARD_W - 4, 'a copy\'s name fits its card');
});
