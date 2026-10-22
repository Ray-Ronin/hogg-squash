// @ts-check
// The screens (docs/decisions.md, "Screens") as a small state machine, with no drawing and no devices, so Node can
// test it (test/screens.test.js). The flow:
//   title (1P / 2P) → match length → level (1P only) → controllers → match → result → rematch, or back to the title
// and the pause menu over the match (Resume / Restart match / Quit to title). main.js turns key presses and pad
// buttons into Navs, calls navigate, and does what the Effect it returns asks (build the match, start it, …).
// Each screen's drawing is in its own file in js/ui/; the menus' words are here, so the tests can check the font.
import { MATCH_LENGTHS } from '../sim/match.js';
import { LEVELS, DEFAULT_LEVEL } from '../sim/difficulty.js';

/** @typedef {'title' | 'length' | 'level' | 'assign' | 'match' | 'pause' | 'result'} ScreenName */
/** @typedef {{ players: 1 | 2, target: number, level: number }} Settings  target: points to win; level: 1P only */

/**
 * One menu move. ok: Enter / Space / a HARD key / A; back: Esc / a SOFT key / B or X; start: a pad's Start (pauses
 * and resumes a match, and is OK on the menus).
 * @typedef {'up' | 'down' | 'left' | 'right' | 'ok' | 'back' | 'start'} Nav
 */

/**
 * What main.js must do after a move (null: nothing beyond drawing the new screen).
 *  prepare: build a match from the settings (the controllers screen shows it behind its panel)
 *  start: play the prepared match; resume: carry on with the match
 *  restart: the same match again from 0–0; rematch: a new match with the same settings; quit: drop the match
 * @typedef {null | 'prepare' | 'start' | 'resume' | 'restart' | 'rematch' | 'quit'} Effect
 */

/**
 * @typedef {object} Ui
 * @property {ScreenName} screen
 * @property {Settings} settings  the choices so far (kept between matches)
 * @property {number} sel         the selected item on a menu screen
 * @property {boolean} inMatch    the controllers screen is over a match being played (a pad joined or was unplugged)
 */

/** The defaults: 1 player, first to 9, level 5 (the plan's suggestion; the owner decides at the end of S10). */
export const DEFAULT_SETTINGS = Object.freeze({ players: /** @type {1 | 2} */ (1), target: 9, level: DEFAULT_LEVEL });

export const TITLE_ITEMS = ['1 PLAYER', '2 PLAYERS'];
export const PAUSE_ITEMS = ['RESUME', 'RESTART MATCH', 'QUIT TO TITLE'];
export const RESULT_ITEMS = ['REMATCH', 'MENU'];

/**
 * @param {Partial<Settings>} [settings]
 * @param {ScreenName} [screen]  'title', or 'match' to go straight to a match (the URL shortcuts)
 * @returns {Ui}
 */
export function makeUi(settings = {}, screen = 'title') {
  return { screen, settings: { ...DEFAULT_SETTINGS, ...settings }, sel: 0, inMatch: false };
}

const isOk = (/** @type {Nav} */ nav) => nav === 'ok' || nav === 'start';

/** Move a vertical menu's selection (wrapping). @param {Ui} ui @param {Nav} nav @param {number} n */
function upDown(ui, nav, n) {
  if (nav === 'up') ui.sel = (ui.sel + n - 1) % n;
  else if (nav === 'down') ui.sel = (ui.sel + 1) % n;
}

/** Move a row of numbers' selection (stopping at the ends). @param {Ui} ui @param {Nav} nav @param {number} n */
function leftRight(ui, nav, n) {
  if (nav === 'left') ui.sel = Math.max(0, ui.sel - 1);
  else if (nav === 'right') ui.sel = Math.min(n - 1, ui.sel + 1);
}

/** @param {Ui} ui @param {ScreenName} screen @param {number} [sel] */
function go(ui, screen, sel = 0) {
  ui.screen = screen;
  ui.sel = Math.max(0, sel);
}

/**
 * Apply one move to the screens.
 * @param {Ui} ui
 * @param {Nav} nav
 * @returns {Effect}
 */
export function navigate(ui, nav) {
  const s = ui.settings;
  switch (ui.screen) {
    case 'title':
      upDown(ui, nav, TITLE_ITEMS.length);
      if (isOk(nav)) {
        s.players = ui.sel === 0 ? 1 : 2;
        go(ui, 'length', MATCH_LENGTHS.indexOf(s.target));
      }
      return null;
    case 'length':
      leftRight(ui, nav, MATCH_LENGTHS.length);
      if (isOk(nav)) {
        s.target = MATCH_LENGTHS[ui.sel];
        if (s.players === 1) go(ui, 'level', LEVELS.indexOf(s.level));
        else return toAssign(ui);                          // 2P has no CPU, so no level
      } else if (nav === 'back') go(ui, 'title', s.players - 1);
      return null;
    case 'level':
      leftRight(ui, nav, LEVELS.length);
      if (isOk(nav)) {
        s.level = LEVELS[ui.sel];
        return toAssign(ui);
      }
      if (nav === 'back') go(ui, 'length', MATCH_LENGTHS.indexOf(s.target));
      return null;
    case 'assign':
      if (ui.inMatch) {
        if (!isOk(nav) && nav !== 'back') return null;
        ui.inMatch = false;
        go(ui, 'match');
        return 'resume';
      }
      if (isOk(nav)) {
        go(ui, 'match');
        return 'start';
      }
      if (nav === 'back') {
        if (s.players === 1) go(ui, 'level', LEVELS.indexOf(s.level));
        else go(ui, 'length', MATCH_LENGTHS.indexOf(s.target));
      }
      return null;
    case 'match':
      if (nav === 'back' || nav === 'start') go(ui, 'pause');
      return null;
    case 'pause':
      upDown(ui, nav, PAUSE_ITEMS.length);
      if (nav === 'back' || nav === 'start' || (nav === 'ok' && ui.sel === 0)) {
        go(ui, 'match');
        return 'resume';
      }
      if (nav === 'ok' && ui.sel === 1) {
        go(ui, 'match');
        return 'restart';
      }
      if (nav === 'ok') {
        go(ui, 'title', s.players - 1);
        return 'quit';
      }
      return null;
    case 'result':
      upDown(ui, nav, RESULT_ITEMS.length);
      if (isOk(nav) && ui.sel === 0) {
        go(ui, 'match');
        return 'rematch';
      }
      if (isOk(nav)) {
        go(ui, 'title', s.players - 1);
        return 'quit';
      }
      return null;
  }
}

/** On to the controllers screen, with the match built behind it. @param {Ui} ui @returns {Effect} */
function toAssign(ui) {
  go(ui, 'assign');
  ui.inMatch = false;
  return 'prepare';
}

/** The match has been won: show the result. @param {Ui} ui */
export function matchOver(ui) {
  if (ui.screen === 'match') go(ui, 'result');
}

/**
 * Pause without a key (the window lost focus, the tab was hidden, or fullscreen was left). Only a match being played
 * pauses; the menus wait anyway. @param {Ui} ui @returns {boolean} it paused
 */
export function autoPause(ui) {
  if (ui.screen !== 'match') return false;
  go(ui, 'pause');
  return true;
}

/** A pad joined or was unplugged during the match: show the controllers screen over it. @param {Ui} ui */
export function assignInMatch(ui) {
  if (ui.screen !== 'match') return;
  go(ui, 'assign');
  ui.inMatch = true;
}

/** The screens that draw the match (with their own panel over it, apart from 'match'). @param {Ui} ui */
export function showsMatch(ui) {
  return ui.screen === 'assign' || ui.screen === 'match' || ui.screen === 'pause' || ui.screen === 'result';
}
