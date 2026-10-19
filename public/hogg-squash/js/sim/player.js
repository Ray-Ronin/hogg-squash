// @ts-check
// A player: movement and swinging with the arcade's contact classifier and shot tables.
// Pure sim code: no DOM, canvas or input devices, so Node tests can import it.
import { FP, PLAYER, movePlayer, classifyContact, SHOT_TABLES, shotEntry, applyShot, aimFromTiming } from '../squash-physics.js';

export const SWING = {
  CONTACT_DELAY: 7,     // frames from the button press to the racket meeting the ball (the classifier's look-ahead)
  MOVE_SPEED: 0xc000,   // run speed while swinging
};

/** Where a player's feet may go, in game units. */
export const PLAYER_LIMITS = { xMin: -140, xMax: 140, zMin: 8, zMax: 180 };

/**
 * Per-player actions for one sim step. hard/soft are true only on the step the button was pressed.
 * @typedef {{ up: boolean, down: boolean, left: boolean, right: boolean, hard: boolean, soft: boolean }} Actions
 */

/** @typedef {ReturnType<typeof classifyContact>} Contact */

/**
 * @typedef {object} Swing
 * @property {number} timer             frames until contact
 * @property {'hard' | 'soft'} button
 * @property {Contact | null} contact    null when the ball was out of reach at the press (a miss)
 */

/**
 * x, z are 16.16 fixed point; flags1b holds the player's high flag bits (0x40 = CPU), as in the arcade.
 * @typedef {{ x: number, z: number, flags1b: number, swing: Swing | null }} Player
 */

/**
 * @typedef {object} SwingEvent
 * @property {'swing' | 'hit'} type
 * @property {'hard' | 'soft'} button
 * @property {number} flags
 * @property {string} zone
 * @property {number} index
 * @property {boolean} reach
 * @property {number} [aim]             set on 'hit'
 */

/**
 * @param {number} x  game units
 * @param {number} z  game units
 * @returns {Player}
 */
export function makePlayer(x, z) {
  return { x: x * FP, z: z * FP, flags1b: 0, swing: null };
}

/**
 * One sim step for a player. Call it before the ball's physics step.
 * A press classifies the contact 7 frames ahead. If the ball is in reach, the shot is applied
 * 7 steps later, with the timing aim and the frame counter as the random number.
 * @param {Player} pl
 * @param {Actions} act
 * @param {ReturnType<typeof import('../squash-physics.js').makeBall>} ball
 * @param {any} p       physics params: difficultyParams(...) plus latMult
 * @param {number} frame  sim frame counter
 * @returns {SwingEvent | null}
 */
export function stepPlayer(pl, act, ball, p, frame) {
  /** @type {SwingEvent | null} */
  let event = null;
  const s = pl.swing;
  if (s) {
    if (--s.timer === 0) {
      pl.swing = null;
      if (s.contact) {
        const c = s.contact;
        const aim = aimFromTiming(ball.z, pl.z);
        const entry = shotEntry(SHOT_TABLES[/** @type {'FRONT' | 'MID' | 'BACK'} */ (c.zone)][s.button][c.index]);
        applyShot(ball, entry, aim, { z: pl.z, flags1b: c.flags, isCpu: !!(pl.flags1b & 0x40) }, frame, p);
        event = { type: 'hit', button: s.button, flags: c.flags, zone: c.zone, index: c.index, reach: true, aim };
      }
    }
  } else if (act.hard || act.soft) {
    const button = act.hard ? 'hard' : 'soft';
    const c = classifyContact(ball, pl, p, { isP1: true, turnIsP1: true });
    const reach = !(c.flags & 0x20);
    pl.swing = { timer: SWING.CONTACT_DELAY, button, contact: reach ? c : null };
    event = { type: 'swing', button, flags: c.flags, zone: c.zone, index: c.index, reach };
  }

  movePlayer(pl, act, pl.swing ? SWING.MOVE_SPEED : PLAYER.RUN_SPEED);
  const L = PLAYER_LIMITS;
  pl.x = Math.max(L.xMin * FP, Math.min(L.xMax * FP, pl.x));
  pl.z = Math.max(L.zMin * FP, Math.min(L.zMax * FP, pl.z));
  return event;
}
