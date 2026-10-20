// @ts-check
// Per-player actions (left right up down hard soft). The game only ever sees actions, never the device: each player's
// actions are their keyboard layout's combined with their gamepad's (once one has joined), and touch (S11b) adds a
// third source the same way. Also the seats: which pad plays which player. Default layouts: docs/controls.md.

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

/** One pad's actions for one sim step: movement held, HARD and SOFT only on a press. @param {import('./gamepad.js').PadInput} pad @returns {Actions} */
export function padActions(pad) {
  const { held, pressed } = pad;
  return { up: held.up, down: held.down, left: held.left, right: held.right, hard: pressed.hard, soft: pressed.soft };
}

/** A player's actions from several sources (keyboard, pad, …): held if any holds it, pressed if any pressed it. @param {...Actions} list @returns {Actions} */
export function combineActions(...list) {
  return {
    up: list.some(a => a.up), down: list.some(a => a.down), left: list.some(a => a.left), right: list.some(a => a.right),
    hard: list.some(a => a.hard), soft: list.some(a => a.soft),
  };
}

/**
 * A human player's seat. Their keyboard layout always works; a pad can join as well.
 * lost: the seat's pad was unplugged and nobody has carried on yet (the game waits).
 * @typedef {{ pad: number | null, lost: boolean }} Seat
 */

/** Seats for P1 and P2: null for a slot the CPU plays. @param {boolean[]} cpu @returns {(Seat | null)[]} */
export function makeSeats(cpu) {
  return cpu.map(on => (on ? null : { pad: null, lost: false }));
}

/** The slot a pad plays, or -1. @param {(Seat | null)[]} seats @param {number} index */
export function seatOf(seats, index) {
  return seats.findIndex(s => s?.pad === index);
}

/**
 * A pad that isn't playing pressed a button: it takes a seat whose pad was unplugged, else the first seat without a pad.
 * @param {(Seat | null)[]} seats @param {number} index  the pad's Gamepad.index
 * @returns {number} the slot it plays, or -1 (every seat already has a pad)
 */
export function joinPad(seats, index) {
  const already = seatOf(seats, index);
  if (already >= 0) return already;
  let slot = seats.findIndex(s => s?.lost);
  if (slot < 0) slot = seats.findIndex(s => s?.pad === null);
  if (slot < 0) return -1;
  const seat = /** @type {Seat} */ (seats[slot]);
  seat.pad = index;
  seat.lost = false;
  return slot;
}

/** A pad was unplugged: its seat waits for a pad (or for the players to carry on without). @param {(Seat | null)[]} seats @param {number} index @returns {number} its slot, or -1 */
export function dropPad(seats, index) {
  const slot = seatOf(seats, index);
  if (slot >= 0) Object.assign(/** @type {Seat} */ (seats[slot]), { pad: null, lost: true });
  return slot;
}

/** Carry on without the unplugged pads (those players use the keyboard). @param {(Seat | null)[]} seats */
export function forgetLost(seats) {
  for (const s of seats) if (s) s.lost = false;
}

/** Move a seat's pad to the other player (2P), swapping with whatever is there. @param {(Seat | null)[]} seats @param {number} slot @returns {boolean} moved */
export function swapSeats(seats, slot) {
  const a = seats[slot], b = seats[1 - slot];
  if (!a || !b) return false;
  [a.pad, b.pad] = [b.pad, a.pad];
  [a.lost, b.lost] = [b.lost, a.lost];
  return true;
}
