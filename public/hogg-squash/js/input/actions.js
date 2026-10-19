// @ts-check
// Per-player actions (left right up down hard soft) from a key layout. The game only ever sees actions,
// so a gamepad (S7) can stand in for the keyboard. Default layouts: docs/controls.md.

/** @typedef {import('../sim/player.js').Actions} Actions */
/** @typedef {Record<keyof Actions, string>} KeyLayout  action → KeyboardEvent.code */

/** @type {[KeyLayout, KeyLayout]} */
export const DEFAULT_LAYOUTS = [
  { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', hard: 'KeyF', soft: 'KeyG' },
  { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', hard: 'Numpad0', soft: 'NumpadDecimal' },
];

/** Every code used by the layouts (these get preventDefault). @param {KeyLayout[]} layouts */
export function layoutCodes(layouts) {
  return layouts.flatMap(l => Object.values(l));
}

/**
 * One player's actions for one sim step. Movement is held; hard and soft are true only on a press.
 * @param {import('./keyboard.js').Keyboard} kb
 * @param {KeyLayout} layout
 * @param {Set<string>} presses  this step's presses (from kb.takePresses(), shared by both players)
 * @returns {Actions}
 */
export function readActions(kb, layout, presses) {
  return {
    up: kb.isHeld(layout.up), down: kb.isHeld(layout.down),
    left: kb.isHeld(layout.left), right: kb.isHeld(layout.right),
    hard: presses.has(layout.hard), soft: presses.has(layout.soft),
  };
}
