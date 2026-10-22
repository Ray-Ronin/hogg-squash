// @ts-check
// Key remapping (docs/controls.md): which keys may be used, the presets, warnings about a key used twice, short names
// for keys on screen, and saving the layouts in localStorage. No DOM beyond reaching for localStorage, so Node can
// test it (test/keymap.test.js). The layouts themselves are action → KeyboardEvent.code (input/actions.js).
import { DEFAULT_LAYOUTS } from './actions.js';

/** @typedef {import('./actions.js').KeyLayout} KeyLayout */
/** @typedef {keyof KeyLayout} Action */
/** @typedef {{ getItem(k: string): string | null, setItem(k: string, v: string): void }} Store */

/** The actions in the order the options screen lists them. @type {Action[]} */
export const ACTIONS = ['up', 'down', 'left', 'right', 'hard', 'soft'];

/** The laptop preset: P2's hit keys without a numpad ('.' HARD, '/' SOFT, beside the arrows). */
export const LAPTOP_P2 = Object.freeze({ hard: 'Period', soft: 'Slash' });

/** Where the layouts are kept, and the shape's version. */
export const STORE_KEY = 'hogg-squash.keys';
const STORE_VERSION = 1;

/** Keys that can't be used, and why (docs/controls.md, "Pitfalls"). Esc cancels a remap before it gets here. */
const REFUSED = /** @type {Record<string, string>} */ ({
  ControlLeft: "Ctrl can't be used: Ctrl + W would close the tab",
  ControlRight: "Ctrl can't be used: Ctrl + W would close the tab",
  AltLeft: "Alt can't be used: it opens the browser's menus",
  AltRight: "Alt can't be used: it opens the browser's menus",
  MetaLeft: "The Windows / Command key can't be used",
  MetaRight: "The Windows / Command key can't be used",
  OSLeft: "The Windows / Command key can't be used",
  OSRight: "The Windows / Command key can't be used",
  Tab: "Tab can't be used: it moves the browser's focus",
  Escape: "Esc can't be used: it pauses the game",
  // the debug keys (main.js): a player holding one would flip the debug views mid-match
  Backquote: "That key is kept for testing the game",
  Backslash: "That key is kept for testing the game",
  Quote: "That key is kept for testing the game",
  BracketLeft: "That key is kept for testing the game",
  BracketRight: "That key is kept for testing the game",
});

/** Why a key can't be used for an action, or null if it can. @param {string} code */
export function refusal(code) {
  return REFUSED[code] ?? (code ? null : 'No key');
}

/** Fresh copies of the default layouts (P1 WASD + F / G, P2 arrows + Numpad 0 / .). @returns {KeyLayout[]} */
export function defaultLayouts() {
  return DEFAULT_LAYOUTS.map(l => ({ ...l }));
}

/** Put the defaults back in place (the screens hold on to the same objects). @param {KeyLayout[]} layouts */
export function resetLayouts(layouts) {
  layouts.forEach((l, i) => Object.assign(l, DEFAULT_LAYOUTS[i]));
}

/** The laptop preset: P2's HARD and SOFT on '.' and '/'. @param {KeyLayout[]} layouts */
export function laptopPreset(layouts) {
  Object.assign(layouts[1], LAPTOP_P2);
}

/**
 * Every key used more than once, with where: [{ code, uses: [[player, action], …] }], in screen order.
 * @param {KeyLayout[]} layouts
 * @returns {{ code: string, uses: [number, Action][] }[]}
 */
export function duplicates(layouts) {
  /** @type {Map<string, [number, Action][]>} */
  const seen = new Map();
  layouts.forEach((l, p) => {
    for (const a of ACTIONS) seen.set(l[a], [...(seen.get(l[a]) ?? []), [p, a]]);
  });
  return [...seen].filter(([, uses]) => uses.length > 1).map(([code, uses]) => ({ code, uses }));
}

/** The warning line for keys used twice ('' if none). @param {KeyLayout[]} layouts */
export function duplicateNote(layouts) {
  const d = duplicates(layouts);
  if (!d.length) return '';
  const { code, uses } = d[0];
  const where = uses.map(([p, a]) => `P${p + 1} ${a.toUpperCase()}`).join(' and ');
  return `${keyLabel(code)} is used twice: ${where}${d.length > 1 ? ' (and more)' : ''}`;
}

/** Short names for codes the general rule below doesn't name well (the font has no [ ] ; = \ ` * keys). */
const LABELS = /** @type {Record<string, string>} */ ({
  ArrowUp: 'Up', ArrowDown: 'Down', ArrowLeft: 'Left', ArrowRight: 'Right',
  NumpadDecimal: 'Num.', NumpadEnter: 'NumEnt', NumpadAdd: 'Num+', NumpadSubtract: 'Num-', NumpadDivide: 'Num/',
  NumpadMultiply: 'NumX', NumpadComma: 'Num,', NumpadEqual: 'Num=',
  Period: '.', Comma: ',', Slash: '/', Minus: '-', Equal: 'Equals', Semicolon: 'Semi', Quote: "'",
  BracketLeft: 'L Brkt', BracketRight: 'R Brkt', Backslash: 'Bkslash', Backquote: 'Backtick', IntlBackslash: 'Intl',
  ShiftLeft: 'L Shift', ShiftRight: 'R Shift', ControlLeft: 'L Ctrl', ControlRight: 'R Ctrl',
  AltLeft: 'L Alt', AltRight: 'R Alt', MetaLeft: 'Win', MetaRight: 'Win', OSLeft: 'Win', OSRight: 'Win',
  Backspace: 'Bksp', CapsLock: 'Caps', Escape: 'Esc', Delete: 'Del', Insert: 'Ins', PageUp: 'PgUp', PageDown: 'PgDn',
  ContextMenu: 'Menu', PrintScreen: 'PrtSc', ScrollLock: 'ScrLk', NumLock: 'NumLk',
});

/**
 * A key's short name on screen: KeyW → W, Digit1 → 1, Numpad0 → Num0, ArrowUp → Up, Period → '.'. Codes nobody named
 * keep their own name (it's in the font: letters and digits only).
 * @param {string} code
 */
export function keyLabel(code) {
  if (code in LABELS) return LABELS[code];
  const m = /^(Key|Digit)(.)$/.exec(code);
  if (m) return m[2];
  if (code.startsWith('Numpad')) return `Num${code.slice(6)}`;
  return code.replace(/[^A-Za-z0-9]/g, '');
}

/** A layout's movement keys in one word: "WASD", "arrows", or the four names. @param {KeyLayout} l */
export function moveLabel(l) {
  if (l.up === 'ArrowUp' && l.down === 'ArrowDown' && l.left === 'ArrowLeft' && l.right === 'ArrowRight') return 'arrows';
  const names = [l.up, l.left, l.down, l.right].map(keyLabel);
  return names.every(n => n.length === 1) ? names.join('') : names.join(' ');
}

/** A player's controls at the foot of their margin in a match: ["P1 keys", "WASD move", "F hard", "G soft"]. @param {KeyLayout} l @param {number} p */
export function helpLines(l, p) {
  return [`P${p + 1} keys`, `${moveLabel(l)} move`, `${keyLabel(l.hard)} hard`, `${keyLabel(l.soft)} soft`];
}

/** A player's keys on one line for the controllers screen: "WASD F G". @param {KeyLayout} l */
export function seatLabel(l) {
  return `${moveLabel(l)} ${keyLabel(l.hard)} ${keyLabel(l.soft)}`;
}

/** The browser's localStorage, or null if it's blocked (some privacy settings throw on merely reading it). @returns {Store | null} */
export function browserStore() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/**
 * The saved layouts, or the defaults. A player whose saved layout is missing, damaged or uses a refused key gets the
 * defaults; storage that is blocked or throws gives the defaults for both.
 * @param {Store | null} store
 * @returns {KeyLayout[]}
 */
export function loadLayouts(store) {
  const out = defaultLayouts();
  try {
    const raw = store?.getItem(STORE_KEY);
    if (!raw) return out;
    const data = JSON.parse(raw);
    if (data?.version !== STORE_VERSION || !Array.isArray(data.layouts)) return out;
    out.forEach((l, p) => {
      const saved = data.layouts[p];
      if (ACTIONS.every(a => typeof saved?.[a] === 'string' && !refusal(saved[a]))) {
        for (const a of ACTIONS) l[a] = saved[a];
      }
    });
  } catch {
    return defaultLayouts();
  }
  return out;
}

/**
 * Keep the layouts for next time. Returns false if storage is blocked or full (they then last until the page closes).
 * @param {Store | null} store @param {KeyLayout[]} layouts
 */
export function saveLayouts(store, layouts) {
  if (!store) return false;
  try {
    store.setItem(STORE_KEY, JSON.stringify({ version: STORE_VERSION, layouts }));
    return true;
  } catch {
    return false;
  }
}
