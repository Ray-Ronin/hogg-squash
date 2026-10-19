// @ts-check
// Keyboard state by physical key (KeyboardEvent.code), so layouts stay put on AZERTY/QWERTZ keyboards.
// Game keys get preventDefault (arrows would scroll the page). Every held key is cleared when the window loses focus.
// Presses are collected between samples, so a quick tap between two sim steps still counts.

/**
 * @typedef {object} Keyboard
 * @property {(code: string) => boolean} isHeld
 * @property {() => Set<string>} takePresses  the keys pressed since the last call (then forgotten)
 * @property {(code: string, fn: () => void) => void} onPress  run fn on every press of code (for UI keys)
 * @property {() => void} clear  forget every held key and press
 */

/**
 * @param {Iterable<string>} gameCodes  codes the game uses: these get preventDefault
 * @param {Window} [target]
 * @returns {Keyboard}
 */
export function createKeyboard(gameCodes, target = window) {
  const codes = new Set(gameCodes);
  const held = new Set();
  /** @type {Set<string>} */
  let pressed = new Set();
  /** @type {Map<string, (() => void)[]>} */
  const handlers = new Map();

  const clear = () => { held.clear(); pressed.clear(); };

  target.addEventListener('keydown', e => {
    const handled = codes.has(e.code) || handlers.has(e.code);
    if (!handled) return;
    e.preventDefault();
    if (e.repeat) return;
    held.add(e.code);
    pressed.add(e.code);
    for (const fn of handlers.get(e.code) ?? []) fn();
  });
  target.addEventListener('keyup', e => { held.delete(e.code); });
  target.addEventListener('blur', clear);

  return {
    isHeld: code => held.has(code),
    takePresses() { const p = pressed; pressed = new Set(); return p; },
    onPress(code, fn) { handlers.set(code, [...(handlers.get(code) ?? []), fn]); },
    clear,
  };
}
