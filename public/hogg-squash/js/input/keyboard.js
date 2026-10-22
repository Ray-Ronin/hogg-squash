// @ts-check
// Keyboard state by physical key (KeyboardEvent.code), so layouts stay put on AZERTY/QWERTZ keyboards.
// Game keys get preventDefault (arrows would scroll the page). Every held key is cleared when the window loses focus.
// Presses are collected between samples, so a quick tap between two sim steps still counts.
// Every key is tracked, not only the game's, so the options screen can take any key for remapping and the key test
// can light up whatever is held. While grabbing (those two screens) every key gets preventDefault, apart from the
// function keys and browser shortcuts (Ctrl, Alt or Meta held), so Space doesn't scroll and / doesn't open find.

/**
 * @typedef {object} Keyboard
 * @property {(code: string) => boolean} isHeld
 * @property {() => string[]} heldKeys  every key held now, in the order they went down
 * @property {() => Set<string>} takePresses  the keys pressed since the last call (then forgotten)
 * @property {(code: string, fn: () => void) => void} onPress  run fn on every press of code (for UI keys)
 * @property {(gameCodes: Iterable<string>) => void} setCodes  the game's keys changed (a remap)
 * @property {(on: boolean) => void} grab  stop the browser reacting to every key (see above)
 * @property {() => void} clear  forget every held key and press
 */

/**
 * @param {Iterable<string>} gameCodes  codes the game uses: these get preventDefault
 * @param {Window} [target]
 * @returns {Keyboard}
 */
export function createKeyboard(gameCodes, target = window) {
  let codes = new Set(gameCodes);
  let grabbing = false;
  /** @type {Set<string>} */
  const held = new Set();
  /** @type {Set<string>} */
  let pressed = new Set();
  /** @type {Map<string, (() => void)[]>} */
  const handlers = new Map();

  const clear = () => { held.clear(); pressed.clear(); };
  /** @param {KeyboardEvent} e */
  const grabbed = e => grabbing && !/^F\d+$/.test(e.code) && !e.ctrlKey && !e.altKey && !e.metaKey;

  target.addEventListener('keydown', e => {
    if (codes.has(e.code) || handlers.has(e.code) || grabbed(e)) e.preventDefault();
    if (e.repeat) return;
    held.add(e.code);
    pressed.add(e.code);
    for (const fn of handlers.get(e.code) ?? []) fn();
  });
  target.addEventListener('keyup', e => { held.delete(e.code); });
  target.addEventListener('blur', clear);

  return {
    isHeld: code => held.has(code),
    heldKeys: () => [...held],
    takePresses() { const p = pressed; pressed = new Set(); return p; },
    onPress(code, fn) { handlers.set(code, [...(handlers.get(code) ?? []), fn]); },
    setCodes(gameCodes) { codes = new Set(gameCodes); },
    grab(on) { grabbing = on; },
    clear,
  };
}
