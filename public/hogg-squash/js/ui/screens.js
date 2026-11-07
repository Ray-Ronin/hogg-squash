// @ts-check
// The screens (docs/decisions.md, "Screens") as a small state machine, with no drawing and no devices, so Node can
// test it (test/screens.test.js). The flow:
//   title (1P / 2P) → match length → level (1P only) → characters (S15) → controllers → match → result → rematch, or
//   back to the title
// and the pause menu over the match (Resume / Restart match / Sound on/off / Quit to title), and from the title the options (each
// player's six keys, remapped by pressing a key; presets; the key test; the Effects level), and GO TO HOME back to the
// website. The pause menu also turns Sound on and off (S13). main.js turns key presses, pad buttons and touch into Navs (a tap on a menu item is tap()), calls navigate, and does what the
// Effect it returns asks (build the match, start it, …). While the touch controls show, 2P can't be picked (touch is
// 1P vs CPU only; docs/decisions.md, "Mobile and touch").
// On the characters screen each player picks with their own controls (navigate's side): P1 on the left, P2 on the
// right; in 1P the CPU's pick is random and up / down rolls another. With no roster (the sprites didn't load) it's
// skipped. Characters are looks only: the picks go to the drawing and the names, never to the sim.
// Each screen's drawing is in its own file in js/ui/; the menus' words are here, so the tests can check the font.
import { MATCH_LENGTHS } from '../sim/match.js';
import { LEVELS, DEFAULT_LEVEL } from '../sim/difficulty.js';
import { ACTIONS, defaultLayouts, refusal, duplicateNote, keyLabel, resetLayouts, laptopPreset } from '../input/keymap.js';
import { defaultSound, SOUND_LEVELS } from '../audio/audio.js';

/** @typedef {'title' | 'length' | 'level' | 'select' | 'assign' | 'match' | 'pause' | 'result' | 'options' | 'keytest'} ScreenName */
/**
 * @typedef {{ players: 1 | 2, target: number, level: number, picks: string[] }} Settings  target: points to win; level:
 *   1P only; picks: P1's and P2's (or the CPU's) character ids, once picked (empty: the roster's first two)
 */

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
 *  keys: the key layouts changed (save them, and tell the keyboard); site: leave for roninray.com (SITE_URL)
 *  sound: the Effects level or Sound on/off changed (save them, and tell the sound engine)
 * @typedef {null | 'prepare' | 'start' | 'resume' | 'restart' | 'rematch' | 'quit' | 'keys' | 'site' | 'sound'} Effect
 */

/**
 * @typedef {object} Ui
 * @property {ScreenName} screen
 * @property {Settings} settings  the choices so far (kept between matches)
 * @property {number} sel         the selected item on a menu screen
 * @property {boolean} inMatch    the controllers screen is over a match being played (a pad joined or was unplugged)
 * @property {import('../input/keymap.js').KeyLayout[]} keys  P1's and P2's keys (the options change them in place)
 * @property {boolean} listen     the options screen is waiting for a key for the selected action
 * @property {string} note        the options screen's message line (a prompt, a refusal, a key used twice)
 * @property {boolean} touch       the touch controls are showing (then 2P can't be picked)
 * @property {import('../audio/audio.js').SoundSettings} sound  the Effects level (the options) and Sound on/off (the
 *   pause menu; the speaker button changes it too)
 * @property {string[]} roster   the characters' ids, in the roster's order (empty until loaded, or if it failed)
 * @property {{ at: number[], locked: boolean[] }} pick  the characters screen: each side's character (an index into
 *   roster) and whether it's picked (in 1P the CPU's side is always picked)
 * @property {() => number} rand  random numbers in [0, 1) for the CPU's pick (Math.random; never the sim's)
 */

/** The defaults: 1 player, first to 9, level 5 (the plan's suggestion; the owner decides at the end of S10), and no
 * characters picked yet (P1 starts on the roster's first, Ronin; P2 on its second). */
export const DEFAULT_SETTINGS = Object.freeze({ players: /** @type {1 | 2} */ (1), target: 9, level: DEFAULT_LEVEL,
  picks: /** @type {string[]} */ ([]) });

/** The tap target (hit selection) that rolls the CPU's character again on the characters screen. */
export const SELECT_REROLL = 100;

export const TITLE_ITEMS = ['1 PLAYER', '2 PLAYERS', 'OPTIONS', 'GO TO HOME'];
/** Where the title's last item goes: the website's start page (the game, and how it was built). */
export const SITE_URL = 'https://roninray.com/';
export const PAUSE_ITEMS = ['RESUME', 'RESTART MATCH', 'SOUND ON', 'QUIT TO TITLE'];
/** The pause menu's Sound on/off item. */
const PAUSE_SOUND = 2;
export const RESULT_ITEMS = ['REMATCH', 'MENU'];
/** The options screen's buttons, under its 6 rows × 2 players of keys (selections 0–11, P1 then P2 on each row). */
export const OPTION_ITEMS = ['LAPTOP KEYS FOR P2', 'RESET TO DEFAULTS', 'KEY TEST', 'EFFECTS', 'BACK'];
/** The first button's selection. */
export const KEY_CELLS = ACTIONS.length * 2;
const [LAPTOP, RESET, KEY_TEST, EFFECTS, OPTIONS_BACK] = OPTION_ITEMS.map((_, i) => KEY_CELLS + i);
/** The Effects item's selection: left / right change the level, OK steps it up (wrapping from 10 to Off, for taps). */
export const EFFECTS_SEL = EFFECTS;

/** The Effects level as the options show it: "EFFECTS 7", "EFFECTS OFF". @param {number} level */
export const effectsLabel = level => `EFFECTS ${level || 'OFF'}`;
/** The options' buttons as drawn (the Effects item with its level). @param {Ui} ui */
export const optionLabels = ui => OPTION_ITEMS.map((it, i) => (KEY_CELLS + i === EFFECTS ? effectsLabel(ui.sound.level) : it));
/** The pause menu's items as drawn (SOUND ON or SOUND OFF). @param {Ui} ui */
export const pauseLabels = ui => PAUSE_ITEMS.map((it, i) => (i === PAUSE_SOUND ? `SOUND ${ui.sound.on ? 'ON' : 'OFF'}` : it));
/** The title's 2P item. */
const TWO_PLAYERS = 1;

/** The title's line while the touch controls show (in place of the keys). */
export const TOUCH_2P_NOTE = '2 players needs a keyboard or gamepads';
/** The title items that can't be picked just now (2P while the touch controls show). @param {Ui} ui */
export function titleOff(ui) {
  return ui.touch ? [TWO_PLAYERS] : [];
}

/** The touch controls appeared or went (main.js, every step). The title's selection leaves 2P. @param {Ui} ui @param {boolean} on */
export function setTouch(ui, on) {
  ui.touch = on;
  if (on && ui.screen === 'title' && ui.sel === TWO_PLAYERS) ui.sel = 0;
}

/**
 * @param {Partial<Settings>} [settings]
 * @param {ScreenName} [screen]  'title', or 'match' to go straight to a match (the URL shortcuts)
 * @param {import('../input/keymap.js').KeyLayout[]} [keys]  the key layouts (the saved ones, else the defaults)
 * @param {import('../audio/audio.js').SoundSettings} [sound]  the sound settings (the saved ones, else the defaults)
 * @returns {Ui}
 */
export function makeUi(settings = {}, screen = 'title', keys = defaultLayouts(), sound = defaultSound()) {
  return { screen, settings: { ...DEFAULT_SETTINGS, picks: [], ...settings }, sel: 0, inMatch: false, keys, listen: false,
    note: '', touch: false, sound, roster: [], pick: { at: [0, 0], locked: [false, false] }, rand: Math.random };
}

/** The roster has loaded: its characters' ids, in order (main.js). @param {Ui} ui @param {string[]} ids */
export function setRoster(ui, ids) {
  ui.roster = ids;
}

/**
 * Each side's character as an index into the roster: the settings' picks, else P1 the first and P2 the second.
 * @param {Settings} s @param {string[]} roster  (not empty)
 * @returns {number[]}
 */
export function pickIndices(s, roster) {
  return [0, 1].map(side => {
    const i = roster.indexOf(s.picks[side]);
    return i >= 0 ? i : Math.min(side, roster.length - 1);
  });
}

/** Sound on or off (the pause menu, the speaker button). @param {Ui} ui @returns {Effect} */
export function toggleSound(ui) {
  ui.sound.on = !ui.sound.on;
  return 'sound';
}

/** The player and action of an options key cell (null for a button). @param {number} sel */
export function keyCell(sel) {
  return sel < KEY_CELLS ? { player: sel % 2, action: ACTIONS[Math.floor(sel / 2)] } : null;
}

/** A key cell's name: "P2 HARD". @param {{ player: number, action: string }} c */
const cellName = c => `P${c.player + 1} ${c.action.toUpperCase()}`;

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
 * @param {0 | 1 | null} [side]  whose controls made it (the characters screen: P1's keys or pad 0, P2's 1); null for
 *   the shared keys (Enter, Space, Esc), which work the first side still choosing
 * @returns {Effect}
 */
export function navigate(ui, nav, side = null) {
  const s = ui.settings;
  switch (ui.screen) {
    case 'title':
      upDown(ui, nav, TITLE_ITEMS.length);
      if (ui.touch && ui.sel === TWO_PLAYERS) upDown(ui, nav, TITLE_ITEMS.length);   // stepping over 2P
      if (isOk(nav) && ui.touch && ui.sel === TWO_PLAYERS) return null;
      if (isOk(nav) && ui.sel === 3) return 'site';
      if (isOk(nav) && ui.sel === 2) {
        go(ui, 'options');
        ui.listen = false;
        ui.note = duplicateNote(ui.keys);
      } else if (isOk(nav)) {
        s.players = ui.sel === 0 ? 1 : 2;
        go(ui, 'length', MATCH_LENGTHS.indexOf(s.target));
      }
      return null;
    case 'options':
      return options(ui, nav);
    case 'keytest':
      if (nav === 'back') go(ui, 'options', KEY_TEST);
      return null;
    case 'length':
      leftRight(ui, nav, MATCH_LENGTHS.length);
      if (isOk(nav)) {
        s.target = MATCH_LENGTHS[ui.sel];
        if (s.players === 1) go(ui, 'level', LEVELS.indexOf(s.level));
        else return toSelect(ui);                          // 2P has no CPU, so no level
      } else if (nav === 'back') go(ui, 'title', s.players - 1);
      return null;
    case 'level':
      leftRight(ui, nav, LEVELS.length);
      if (isOk(nav)) {
        s.level = LEVELS[ui.sel];
        return toSelect(ui);
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
        if (ui.roster.length) {                           // back to the characters, both choosing again
          ui.pick.locked = [false, s.players === 1];
          go(ui, 'select');
        } else backFromSelect(ui);
      }
      return null;
    case 'select':
      return select(ui, nav, side);
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
      if ((nav === 'ok' || nav === 'left' || nav === 'right') && ui.sel === PAUSE_SOUND) return toggleSound(ui);
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

/**
 * A move on the options screen: up / down through the rows of keys and the buttons (wrapping), left / right between
 * P1's and P2's key, OK on a key to wait for a new one (captureKey), back to the title.
 * @param {Ui} ui @param {Nav} nav @returns {Effect}
 */
function options(ui, nav) {
  if (ui.listen) {                       // only back does anything (the keys go to captureKey)
    if (nav === 'back') {
      ui.listen = false;
      ui.note = duplicateNote(ui.keys);
    }
    return null;
  }
  const cell = keyCell(ui.sel);
  if (nav === 'up') ui.sel = ui.sel === 0 ? OPTIONS_BACK : ui.sel === LAPTOP ? KEY_CELLS - 2 : ui.sel - (cell ? 2 : 1);
  else if (nav === 'down') ui.sel = ui.sel === OPTIONS_BACK ? 0 : cell ? Math.min(ui.sel + 2, LAPTOP) : ui.sel + 1;
  else if ((nav === 'left' || nav === 'right') && cell) ui.sel ^= 1;
  else if ((nav === 'left' || nav === 'right' || isOk(nav)) && ui.sel === EFFECTS) {
    const was = ui.sound.level, max = SOUND_LEVELS.MAX;
    ui.sound.level = isOk(nav) ? (was + 1) % (max + 1) : Math.min(max, Math.max(0, was + (nav === 'left' ? -1 : 1)));
    return ui.sound.level === was ? null : 'sound';
  }
  else if (nav === 'back' || (isOk(nav) && ui.sel === OPTIONS_BACK)) go(ui, 'title', 2);
  else if (isOk(nav) && cell) {
    ui.listen = true;
    ui.note = `Press a key for ${cellName(cell)}     Esc: cancel`;
  } else if (isOk(nav) && ui.sel === KEY_TEST) go(ui, 'keytest');
  else if (isOk(nav) && (ui.sel === LAPTOP || ui.sel === RESET)) {
    if (ui.sel === LAPTOP) laptopPreset(ui.keys); else resetLayouts(ui.keys);
    ui.note = duplicateNote(ui.keys)
      || (ui.sel === LAPTOP ? 'P2 now hits with . (HARD) and / (SOFT)' : 'Every key is back to its default');
    return 'keys';
  }
  return null;
}

/**
 * A key pressed while the options screen waits for one: it becomes the selected action's key, unless it can't be used
 * (the reason shows and the screen keeps waiting). Esc cancels. A key used twice is allowed, with a warning.
 * @param {Ui} ui @param {string} code  KeyboardEvent.code
 * @returns {Effect} 'keys' if a key changed
 */
export function captureKey(ui, code) {
  const cell = keyCell(ui.sel);
  if (ui.screen !== 'options' || !ui.listen || !cell) return null;
  if (code === 'Escape') return options(ui, 'back');
  const why = refusal(code);
  if (why) {
    ui.note = `${why}. Press another key.`;
    return null;
  }
  ui.keys[cell.player][cell.action] = code;
  ui.listen = false;
  ui.note = duplicateNote(ui.keys) || `${cellName(cell)}: ${keyLabel(code)}`;
  return 'keys';
}

/**
 * A tap on the screen (touch). On a menu item (sel: the selection it is, from the drawing): select it and OK. Off the
 * items: OK on the controllers screen, back on the key test, and cancel when the options wait for a key. On the
 * characters screen a character is P1's pick, and the CPU's panel (SELECT_REROLL) rolls another.
 * @param {Ui} ui @param {number | null} sel @returns {Effect}
 */
export function tap(ui, sel) {
  if (ui.listen) return navigate(ui, 'back');
  if (ui.screen === 'select') {                // touch is 1P: a character is P1's pick; the CPU's panel rolls again
    if (sel === SELECT_REROLL) return navigate(ui, 'down', 0);
    if (sel === null || sel >= ui.roster.length) return null;
    ui.pick.at[0] = sel;
    return navigate(ui, 'ok', 0);
  }
  if (sel === null) {
    if (ui.screen === 'assign') return navigate(ui, 'ok');
    if (ui.screen === 'keytest') return navigate(ui, 'back');
    return null;
  }
  if (ui.screen === 'title' && titleOff(ui).includes(sel)) return null;
  ui.sel = sel;
  return navigate(ui, 'ok');
}

/** The screen before the characters (and before the controllers when there are none). @param {Ui} ui */
function backFromSelect(ui) {
  const s = ui.settings;
  if (s.players === 1) go(ui, 'level', LEVELS.indexOf(s.level));
  else go(ui, 'length', MATCH_LENGTHS.indexOf(s.target));
}

/**
 * On to the characters screen: each side starts on its last pick (P1 the roster's first, P2 its second), and in 1P the
 * CPU's pick is random. Skipped when there's no roster. @param {Ui} ui @returns {Effect}
 */
function toSelect(ui) {
  const s = ui.settings, n = ui.roster.length;
  if (!n) return toAssign(ui);
  const at = pickIndices(s, ui.roster);
  if (s.players === 1) at[1] = Math.min(n - 1, Math.floor(ui.rand() * n));
  ui.pick = { at, locked: [false, s.players === 1] };
  go(ui, 'select');
  return null;
}

/** The CPU picks another character, never the one it had (1P). @param {Ui} ui */
export function reroll(ui) {
  const n = ui.roster.length;
  if (n > 1) ui.pick.at[1] = (ui.pick.at[1] + 1 + Math.min(n - 2, Math.floor(ui.rand() * (n - 1)))) % n;
}

/**
 * A move on the characters screen. Left / right move that side's choice (wrapping), OK picks it, back undoes the pick
 * (or, with nothing picked, goes back a screen); when every side has picked, the picks are kept and the controllers
 * screen comes up. In 1P every control is P1's, and up / down rolls the CPU's pick again. A mirror match is allowed.
 * @param {Ui} ui @param {Nav} nav @param {0 | 1 | null} side @returns {Effect}
 */
function select(ui, nav, side) {
  const s = ui.settings, p = ui.pick, n = ui.roster.length, one = s.players === 1;
  /** @type {0 | 1} */
  const who = one ? 0 : side ?? (nav === 'back' ? (p.locked[1] ? 1 : 0) : (p.locked[0] ? 1 : 0));
  if (nav === 'left' || nav === 'right') {
    if (!p.locked[who]) p.at[who] = (p.at[who] + (nav === 'left' ? n - 1 : 1)) % n;
  } else if (nav === 'up' || nav === 'down') {
    if (one) reroll(ui);
  } else if (isOk(nav)) {
    p.locked[who] = true;
    if (p.locked.every(Boolean)) {
      s.picks = p.at.map(i => ui.roster[i]);
      return toAssign(ui);
    }
  } else if (nav === 'back') {
    if (p.locked[who] && !(one && who === 1)) p.locked[who] = false;
    else backFromSelect(ui);
  }
  return null;
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
