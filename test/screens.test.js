// The screens' state machine (node:test, run by npm test): every path through title → 1P / 2P → match length →
// level (1P only) → controllers → match → result → rematch / menu, the pause menu, and the words the screens draw
// in the font they use. js/ui/ only touches a canvas when drawing.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { makeUi, navigate, matchOver, autoPause, assignInMatch, showsMatch, DEFAULT_SETTINGS, TITLE_ITEMS, PAUSE_ITEMS,
  RESULT_ITEMS } from '../public/hogg-squash/js/ui/screens.js';
import { TITLE_HINT } from '../public/hogg-squash/js/ui/title.js';
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
  assert.equal(ui.sel, 1);
  run(ui, ['down']);
  assert.equal(ui.sel, 0);
  run(ui, ['start', 'start', 'start']);
  assert.equal(ui.screen, 'assign');
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
    ['large-white', [...TITLE_ITEMS, ...PAUSE_ITEMS, ...RESULT_ITEMS, '11', resultLine(w), 'CONTROLLERS',
      'CONTROLLER DISCONNECTED'], 306],
    ['small', [TITLE_HINT, SETUP_HINT, ASSIGN_TEXT.play, ASSIGN_TEXT.carryOn, 'keys arrows Num0 Num.  +  (unplugged controller)'], 620],
    ['small-dark', [...levels, lengthNote(11), modeLine({ players: 1, target: 9, level: 5 }) + ', FIRST TO 11',
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
