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
// The tournament (S17; docs/decisions.md, "Tournament"; its rules are js/sim/tournament.js):
//   title TOURNAMENT → (a tournament saved: Continue, or New, which asks first) → setup (players, humans, length,
//   bot level) → characters (every slot: each human picks theirs in turn, the bots start random and can be changed) →
//   the bracket → the next match: a human's goes to the controllers screen and is played; a bots' one is watched or
//   skipped → the result → back to the bracket → … → the champion → the title.
//   In a tournament match the pause menu quits to the title (the tournament stays saved; that match starts again) and,
//   in a bots' match, has Skip match; the result screen only goes back to the bracket.
// Each screen's drawing is in its own file in js/ui/; the menus' words are here, so the tests can check the font.
import { MATCH_LENGTHS } from '../sim/match.js';
import { LEVELS, DEFAULT_LEVEL } from '../sim/difficulty.js';
import { SIZES, TOURNAMENT_DEFAULTS, makeTournament, nextMatch, recordResult, skipMatch, champion }
  from '../sim/tournament.js';
import { ACTIONS, defaultLayouts, refusal, duplicateNote, keyLabel, resetLayouts, laptopPreset } from '../input/keymap.js';
import { defaultSound, SOUND_LEVELS } from '../audio/audio.js';

/**
 * @typedef {'title' | 'length' | 'level' | 'select' | 'assign' | 'match' | 'pause' | 'result' | 'options' | 'keytest' |
 *   'tmenu' | 'tconfirm' | 'tsetup' | 'tselect' | 'bracket' | 'champion'} ScreenName
 */
/**
 * The tournament setup screen's choices (kept between visits).
 * @typedef {{ size: number, humans: number, mode: import('../sim/tournament.js').LengthMode, same: number, start: number,
 *   level: number }} TourDraft
 */
/**
 * @typedef {object} TourUi
 * @property {TourDraft} draft
 * @property {string[]} chars    the characters screen's picks, one per entrant
 * @property {import('../sim/tournament.js').Tournament | null} t  the tournament under way (and saved), or null
 * @property {number} view       the round the bracket shows
 * @property {import('../sim/tournament.js').MatchInfo | null} match  the tournament match being played (null: a
 *   single match)
 * @property {boolean} skipping  the rest of the match is being played out (Skip match from the pause menu)
 * @property {{ info: import('../sim/tournament.js').MatchInfo, outcome: 'replay' | 'decided' } | null} last  the last
 *   tournament match's result (the result screen)
 */
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
 *  tsave: the tournament changed (save it); tclear: it's over (forget the save)
 *  skiprest: play the rest of the bots' match being watched out at once (sim/tournament.js, playOut)
 * @typedef {null | 'prepare' | 'start' | 'resume' | 'restart' | 'rematch' | 'quit' | 'keys' | 'site' | 'sound' |
 *   'tsave' | 'tclear' | 'skiprest'} Effect
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
 * @property {() => number} rand  random numbers in [0, 1) for the CPU's pick, the bots' characters and a new
 *   tournament's seed (Math.random; never the sim's)
 * @property {TourUi} tour  the tournament's screens
 */

/** The defaults: 1 player, first to 9, level 5 (the plan's suggestion; the owner decides at the end of S10), and no
 * characters picked yet (P1 starts on the roster's first, Ronin; P2 on its second). */
export const DEFAULT_SETTINGS = Object.freeze({ players: /** @type {1 | 2} */ (1), target: 9, level: DEFAULT_LEVEL,
  picks: /** @type {string[]} */ ([]) });

/** The tap target (hit selection) that rolls the CPU's character again on the characters screen. */
export const SELECT_REROLL = 100;

export const TITLE_ITEMS = ['1 PLAYER', '2 PLAYERS', 'TOURNAMENT', 'OPTIONS', 'GO TO HOME'];
/** The title's items' selections. */
const [, TWO_PLAYERS, TOURNAMENT, OPTIONS, HOME] = TITLE_ITEMS.map((_, i) => i);
/** Where the title's last item goes: the website's start page (the game, and how it was built). */
export const SITE_URL = 'https://roninray.com/';
export const PAUSE_ITEMS = ['RESUME', 'RESTART MATCH', 'SOUND ON', 'QUIT TO TITLE'];
/** The pause menu's Skip match item, in a watched bots' match of a tournament (before Quit to title). */
export const PAUSE_SKIP = 'SKIP MATCH';
export const RESULT_ITEMS = ['REMATCH', 'MENU'];
/** The result screen's one item in a tournament. */
export const RESULT_TOUR_ITEMS = ['BACK TO THE BRACKET'];

/** The tournament's screens' items (a tournament saved; starting a new one while one is saved; the setup's rows). */
export const TMENU_ITEMS = ['CONTINUE', 'NEW TOURNAMENT'];
export const TCONFIRM_ITEMS = ['KEEP IT', 'START A NEW ONE'];
export const TSETUP_ROWS = ['PLAYERS', 'HUMANS', 'LENGTH', 'FIRST TO', 'BOT LEVEL', 'START'];
const [T_SIZE, T_HUMANS, T_MODE, T_LENGTH, T_LEVEL, T_START] = TSETUP_ROWS.map((_, i) => i);
/** The setup's length modes as shown. */
export const MODE_LABELS = { same: 'SAME', rising: 'RISING' };
/** The bracket's items: a human's match is played; a bots' one watched or skipped; then the champion. */
export const BRACKET_ITEMS = { play: ['PLAY', 'QUIT TO TITLE'], bots: ['WATCH', 'SKIP', 'QUIT TO TITLE'],
  done: ['SEE THE CHAMPION', 'QUIT TO TITLE'] };
export const CHAMPION_ITEMS = ['MENU'];
/** Taps on the tournament's characters screen beyond the slots (0 … size − 1): START, and the big figure (another). */
export const TSELECT_START = 1000;
export const TSELECT_NEXT = 1001;
/** Taps on the bracket's round arrows (the earlier and the later round). */
export const BRACKET_PREV = 2000;
export const BRACKET_NEXT = 2001;
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
/**
 * The pause menu's items: PAUSE_ITEMS, with Skip match before Quit to title in a tournament's bots' match.
 * @param {Ui} ui
 */
export const pauseItems = ui => (ui.tour.match && !ui.tour.match.mustPlay
  ? [...PAUSE_ITEMS.slice(0, 3), PAUSE_SKIP, PAUSE_ITEMS[3]] : PAUSE_ITEMS);
/** The pause menu's items as drawn (SOUND ON or SOUND OFF). @param {Ui} ui */
export const pauseLabels = ui => pauseItems(ui).map(it => (it === PAUSE_ITEMS[2] ? `SOUND ${ui.sound.on ? 'ON' : 'OFF'}` : it));
/** The result screen's items: in a tournament, back to the bracket. @param {Ui} ui */
export const resultItems = ui => (ui.tour.match ? RESULT_TOUR_ITEMS : RESULT_ITEMS);
/** The bracket's items. @param {Ui} ui */
export function bracketItems(ui) {
  const t = ui.tour.t;
  if (!t) return [];
  const m = nextMatch(t);
  return !m ? BRACKET_ITEMS.done : m.mustPlay ? BRACKET_ITEMS.play : BRACKET_ITEMS.bots;
}
/** The most humans the setup allows: the bracket's size, or one with the touch controls (touch is 1P only). @param {Ui} ui */
export const maxHumans = ui => (ui.touch ? 1 : ui.tour.draft.size);

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
  if (on) ui.tour.draft.humans = 1;                  // touch is 1P only (the setup keeps it at one human)
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
    note: '', touch: false, sound, roster: [], pick: { at: [0, 0], locked: [false, false] }, rand: Math.random,
    tour: { draft: { ...TOURNAMENT_DEFAULTS }, chars: [], t: null, view: 0, match: null, skipping: false, last: null } };
}

/** A tournament was loaded from the browser (main.js, at the start): the title offers to continue it. @param {Ui} ui @param {import('../sim/tournament.js').Tournament | null} t */
export function setTournament(ui, t) {
  ui.tour.t = t;
}

/**
 * The characters of the match being set up, P1's then P2's (or the CPU's): a tournament match's two entrants', else
 * the settings' picks (empty: not picked yet). @param {Ui} ui @returns {string[]}
 */
export function matchPicks(ui) {
  const tm = ui.tour.match, t = ui.tour.t;
  return tm && t ? tm.sides.map(e => t.setup.chars[e]) : ui.settings.picks;
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
      if (isOk(nav) && ui.sel === HOME) return 'site';
      if (isOk(nav) && ui.sel === TOURNAMENT) {
        if (ui.tour.t) go(ui, 'tmenu');                    // one is saved: continue it, or start a new one
        else go(ui, 'tsetup');
      } else if (isOk(nav) && ui.sel === OPTIONS) {
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
      if (nav === 'back' && ui.tour.match) {              // a tournament match: back to the bracket
        ui.tour.match = null;
        toBracket(ui);
      } else if (nav === 'back') {
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
    case 'pause': {
      const items = pauseItems(ui);
      upDown(ui, nav, items.length);
      const item = items[ui.sel];
      if (nav === 'back' || nav === 'start' || (nav === 'ok' && item === PAUSE_ITEMS[0])) {
        go(ui, 'match');
        return 'resume';
      }
      if (nav === 'ok' && item === PAUSE_ITEMS[1]) {
        go(ui, 'match');
        return 'restart';
      }
      if ((nav === 'ok' || nav === 'left' || nav === 'right') && item === PAUSE_ITEMS[2]) return toggleSound(ui);
      if (nav === 'ok' && item === PAUSE_SKIP) {          // the rest is played out at once, then GAME and the result
        ui.tour.skipping = true;
        go(ui, 'match');
        return 'skiprest';
      }
      if (nav === 'ok') {
        if (ui.tour.match) {                              // the tournament stays saved; this match starts again
          ui.tour.match = null;
          go(ui, 'title', TOURNAMENT);
        } else go(ui, 'title', s.players - 1);
        return 'quit';
      }
      return null;
    }
    case 'result':
      if (ui.tour.match) {
        if (isOk(nav)) {
          ui.tour.match = null;
          toBracket(ui);
        }
        return null;
      }
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
    case 'tmenu':
      upDown(ui, nav, TMENU_ITEMS.length);
      if (isOk(nav) && ui.sel === 0) toBracket(ui);
      else if (isOk(nav)) go(ui, 'tconfirm');
      else if (nav === 'back') go(ui, 'title', TOURNAMENT);
      return null;
    case 'tconfirm':
      upDown(ui, nav, TCONFIRM_ITEMS.length);
      if (isOk(nav) && ui.sel === 1) go(ui, 'tsetup');   // the saved one is replaced when the new one starts
      else if (isOk(nav) || nav === 'back') go(ui, 'tmenu', 1);
      return null;
    case 'tsetup':
      return tourSetup(ui, nav);
    case 'tselect':
      return tourSelect(ui, nav);
    case 'bracket':
      return bracket(ui, nav);
    case 'champion':
      if (isOk(nav) || nav === 'back') {
        ui.tour.t = null;
        go(ui, 'title', TOURNAMENT);
        return 'tclear';
      }
      return null;
  }
}

/** Every value a setup row can take, as numbers or modes. @param {Ui} ui @param {number} row @returns {(number | string)[]} */
export function setupValues(ui, row) {
  const d = ui.tour.draft;
  if (row === T_SIZE) return SIZES;
  if (row === T_HUMANS) return Array.from({ length: maxHumans(ui) }, (_, i) => i + 1);
  if (row === T_MODE) return ['same', 'rising'];
  if (row === T_LENGTH) return MATCH_LENGTHS;
  if (row === T_LEVEL) return d.humans < d.size ? LEVELS : [];
  return [];
}

/** A setup row's value. @param {TourDraft} d @param {number} row @returns {number | string} */
export function setupValue(d, row) {
  return [d.size, d.humans, d.mode, d.mode === 'same' ? d.same : d.start, d.level][row] ?? '';
}

/**
 * Change a setup row's value by `step` (stopping at the ends, or wrapping for a tap). Fewer players can't have more
 * humans than players.
 * @param {Ui} ui @param {number} row @param {number} step @param {boolean} [wrap]
 */
export function changeSetup(ui, row, step, wrap = false) {
  const d = ui.tour.draft, values = setupValues(ui, row);
  if (!values.length) return;
  const at = values.indexOf(setupValue(d, row)), n = values.length;
  const i = wrap ? (at + step + n) % n : Math.min(n - 1, Math.max(0, at + step));
  const v = values[i];
  if (row === T_SIZE) d.size = Number(v);
  else if (row === T_HUMANS) d.humans = Number(v);
  else if (row === T_MODE) d.mode = v === 'rising' ? 'rising' : 'same';
  else if (row === T_LENGTH && d.mode === 'same') d.same = Number(v);
  else if (row === T_LENGTH) d.start = Number(v);
  else if (row === T_LEVEL) d.level = Number(v);
  d.humans = Math.min(d.humans, maxHumans(ui));
}

/** The setup screen: up / down through the rows, left / right change a value, OK goes down (on START: the characters). @param {Ui} ui @param {Nav} nav @returns {Effect} */
function tourSetup(ui, nav) {
  if (nav === 'up' || nav === 'down') upDown(ui, nav, TSETUP_ROWS.length);
  else if (nav === 'left' || nav === 'right') changeSetup(ui, ui.sel, nav === 'left' ? -1 : 1);
  else if (isOk(nav) && ui.sel === T_START) return toTourSelect(ui);
  else if (isOk(nav)) upDown(ui, 'down', TSETUP_ROWS.length);
  else if (nav === 'back') go(ui, 'title', TOURNAMENT);
  return null;
}

/**
 * On to the characters: each human starts on a character in the roster's order (P1 on their last single-match pick),
 * each bot on a random one. Without a roster there's nothing to choose, so the tournament starts at once.
 * @param {Ui} ui @returns {Effect}
 */
function toTourSelect(ui) {
  const d = ui.tour.draft, n = ui.roster.length;
  if (!n) {
    ui.tour.chars = Array(d.size).fill('player');
    return startTournament(ui);
  }
  const p1 = Math.max(0, ui.roster.indexOf(ui.settings.picks[0]));
  ui.tour.chars = Array.from({ length: d.size }, (_, e) =>
    ui.roster[e < d.humans ? (p1 + e) % n : Math.min(n - 1, Math.floor(ui.rand() * n))]);
  go(ui, 'tselect');
  return null;
}

/**
 * The characters screen: up / down move through the slots (and START), left / right change the selected slot's
 * character; OK on a human goes on to the next human (the last one to START), on a bot to START, on START begins.
 * Any player's controls work it (each human picks in turn). @param {Ui} ui @param {Nav} nav @returns {Effect}
 */
function tourSelect(ui, nav) {
  const d = ui.tour.draft, n = ui.roster.length, START = d.size;
  if (nav === 'up' || nav === 'down') upDown(ui, nav, d.size + 1);
  else if ((nav === 'left' || nav === 'right') && ui.sel < START) {
    const c = ui.tour.chars, i = Math.max(0, ui.roster.indexOf(c[ui.sel]));
    c[ui.sel] = ui.roster[(i + (nav === 'left' ? n - 1 : 1)) % n];
  } else if (isOk(nav) && ui.sel === START) return startTournament(ui);
  else if (isOk(nav)) ui.sel = ui.sel < d.humans - 1 ? ui.sel + 1 : START;
  else if (nav === 'back') go(ui, 'tsetup', T_START);
  return null;
}

/** The draw is made from a new seed and the bracket shown (the tournament is saved). @param {Ui} ui @returns {Effect} */
function startTournament(ui) {
  const d = ui.tour.draft;
  ui.tour.t = makeTournament({ size: d.size, humans: Math.min(d.humans, d.size), mode: d.mode,
    length: d.mode === 'same' ? d.same : d.start, level: d.level, chars: [...ui.tour.chars],
    seed: Math.floor(ui.rand() * 2 ** 32) | 0 });
  toBracket(ui);
  return 'tsave';
}

/** The bracket, showing the round of the next match (or the final). @param {Ui} ui */
function toBracket(ui) {
  const t = ui.tour.t;
  if (!t) {
    go(ui, 'title', TOURNAMENT);
    return;
  }
  ui.tour.view = nextMatch(t)?.round ?? t.rounds.length - 1;
  go(ui, 'bracket');
}

/**
 * The bracket: left / right show another round, up / down the items. PLAY: the controllers screen and the match;
 * WATCH: the match at once; SKIP: played instantly (and saved); SEE THE CHAMPION; QUIT TO TITLE (it stays saved).
 * @param {Ui} ui @param {Nav} nav @returns {Effect}
 */
function bracket(ui, nav) {
  const t = ui.tour.t;
  if (!t) return null;
  const items = bracketItems(ui), item = items[ui.sel];
  if (nav === 'left' || nav === 'right') {
    ui.tour.view = Math.min(t.rounds.length - 1, Math.max(0, ui.tour.view + (nav === 'left' ? -1 : 1)));
  } else if (nav === 'up' || nav === 'down') upDown(ui, nav, items.length);
  else if (nav === 'back' || (isOk(nav) && item === 'QUIT TO TITLE')) go(ui, 'title', TOURNAMENT);
  else if (isOk(nav) && item === 'SEE THE CHAMPION') go(ui, 'champion');
  else if (isOk(nav) && item === 'SKIP') {
    skipMatch(t);
    toBracket(ui);
    ui.sel = bracketItems(ui).indexOf('SKIP');            // stay on SKIP while bots' matches follow
    return 'tsave';
  } else if (isOk(nav)) {
    ui.tour.match = nextMatch(t);
    ui.tour.skipping = false;
    if (item === 'WATCH') {
      go(ui, 'match');
      return 'prepare';
    }
    return toAssign(ui);
  }
  return null;
}

/** The tournament has a champion. @param {Ui} ui */
export const tournamentWon = ui => ui.tour.t !== null && champion(ui.tour.t) !== null;

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
  else if (nav === 'back' || (isOk(nav) && ui.sel === OPTIONS_BACK)) go(ui, 'title', OPTIONS);
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
  if (ui.screen === 'tsetup') {                // a row: select it, and step its value on (wrapping); START: OK
    if (sel === null) return null;
    ui.sel = sel;
    if (sel === T_START) return navigate(ui, 'ok');
    changeSetup(ui, sel, 1, true);
    return null;
  }
  if (ui.screen === 'tselect') {               // a slot: select it; the big figure: another character; START
    if (sel === TSELECT_START) {
      ui.sel = ui.tour.draft.size;
      return navigate(ui, 'ok');
    }
    if (sel === TSELECT_NEXT) return navigate(ui, 'right');
    if (sel !== null && sel < ui.tour.draft.size) ui.sel = sel;
    return null;
  }
  if (ui.screen === 'bracket' && (sel === BRACKET_PREV || sel === BRACKET_NEXT)) {
    return navigate(ui, sel === BRACKET_PREV ? 'left' : 'right');
  }
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

/**
 * The match has been won: show the result. In a tournament the result is recorded too (a human's loss to a bot is
 * kept to replay), and the tournament is to be saved.
 * @param {Ui} ui
 * @param {{ winner: 0 | 1, scores: [number, number] }} [end]  the winning slot and the scores by slot
 * @returns {Effect}
 */
export function matchOver(ui, end) {
  if (ui.screen !== 'match') return null;
  go(ui, 'result');
  const tm = ui.tour.match, t = ui.tour.t;
  if (!tm || !t || !end) return null;
  ui.tour.last = { info: tm, outcome: recordResult(t, end.winner, end.scores, ui.tour.skipping) };
  ui.tour.skipping = false;
  return 'tsave';
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
