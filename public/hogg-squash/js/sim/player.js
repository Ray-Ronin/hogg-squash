// @ts-check
// A player: movement and the swing state machine, with the arcade's contact classifier and shot tables.
// Pure sim code: no DOM, canvas or input devices, so Node tests can import it.
//
// Swing:  press ─(wind-up, CONTACT frames)→ contact ─(recovery)→ ready
//  - The press classifies the contact 7 frames ahead (the arcade's look-ahead), so the racket meets the ball exactly
//    CONTACT frames after the press. A press with the ball out of reach (or when it isn't your ball) still swings,
//    and misses.
//  - A contact in the classifier's "special" band (flag 0x10, contact types 10–11: the ball just beyond a stretch)
//    is a dive: the player lunges, plays the dive shot, and lies on the floor until the dive's recovery ends.
//  - Presses during a swing or dive are ignored. Movement uses MOVE_SPEED while swinging.
// Timings were measured in the MAME recordings (test/fixtures): every human swing kept the player planted for its
// whole animation (contact 7 frames after the press, moving again about 18 frames after it), and every dive was a
// special contact that left the player down for 143–153 frames. The art in A3 matches these constants.
import { FP, PLAYER, movePlayer, classifyContact, SHOT_TABLES, shotEntry, applyShot, aimFromTiming } from '../squash-physics.js';

export const SWING = {
  CONTACT: 7,          // frames from the press to the racket meeting the ball (the classifier's look-ahead)
  RECOVERY: 11,        // frames from contact (included) until ready: ready on frame 18 after the press (≈ 0.31 s)
  MOVE_SPEED: 0,       // run speed while swinging: planted, as in the arcade (0xC000 would allow a slow shuffle)
};

export const DIVE = {
  CONTACT: 7,          // same look-ahead as a swing
  RECOVERY: 136,       // frames from contact (included) until back up: 143 frames in all (≈ 2.5 s, as the arcade)
  MOVE_SPEED: 0,       // locked in place
};

/** Classifier flag for the dive band ("special": volley/lunge, contact types 10–11). */
export const DIVE_FLAG = 0x10;

/** Where a player's feet may go, in game units: about a body's half-width from the side walls, and up to the glass. */
export const PLAYER_LIMITS = { xMin: -134, xMax: 134, zMin: 12, zMax: 179 };

/**
 * Per-player actions for one sim step. hard/soft are true only on the step the button was pressed.
 * @typedef {{ up: boolean, down: boolean, left: boolean, right: boolean, hard: boolean, soft: boolean }} Actions
 */

/** @typedef {import('../squash-physics.js').Contact} Contact */

/**
 * @typedef {object} Swing
 * @property {'swing' | 'dive'} kind
 * @property {number} t                  frames since the press (0 on the press step)
 * @property {'hard' | 'soft'} button
 * @property {'fore' | 'back'} hand      which side of the body the ball is on (classifier flag 4 = backhand)
 * @property {Contact | null} contact    null when the swing can't make contact (out of reach, or not your ball)
 * @property {boolean} hit               contact has been made
 */

/**
 * x, z are 16.16 fixed point; flags1b holds the player's high flag bits (0x40 = CPU), as in the arcade.
 * @typedef {{ x: number, z: number, flags1b: number, swing: Swing | null }} Player
 */

/**
 * @typedef {object} SwingEvent
 * @property {'swing' | 'hit'} type
 * @property {'swing' | 'dive'} kind
 * @property {'hard' | 'soft'} button
 * @property {number} flags
 * @property {string} zone
 * @property {number} index
 * @property {boolean} reach           false = a miss (out of reach, or not this player's turn)
 * @property {number} [aim]             set on 'hit'
 * @property {{ x: number, y: number, z: number, vx: number, vy: number, vz: number }} [ball]  set on 'hit': the ball
 *   at contact, with its new velocity (16.16)
 */

/** @typedef {'ready' | 'windup' | 'recovery' | 'dive'} SwingPhase */

/**
 * @param {number} x  game units
 * @param {number} z  game units
 * @returns {Player}
 */
export function makePlayer(x, z) {
  return { x: x * FP, z: z * FP, flags1b: 0, swing: null };
}

/** @param {'swing' | 'dive'} kind */
const timing = kind => (kind === 'dive' ? DIVE : SWING);

/**
 * Frames a swing or dive lasts, from the press to ready.
 * @param {'swing' | 'dive'} kind
 */
export function swingLength(kind) {
  const T = timing(kind);
  return T.CONTACT + T.RECOVERY;
}

/**
 * What the player is doing, for drawing (and the art later).
 * @param {Player} pl
 * @returns {SwingPhase}
 */
export function swingPhase(pl) {
  const s = pl.swing;
  if (!s) return 'ready';
  if (s.kind === 'dive') return 'dive';
  return s.t < SWING.CONTACT ? 'windup' : 'recovery';
}

/**
 * One sim step for a player. Call it before the ball's physics step.
 * @param {Player} pl
 * @param {Actions} act
 * @param {ReturnType<typeof import('../squash-physics.js').makeBall>} ball
 * @param {any} p       physics params: difficultyParams(...) plus latMult
 * @param {number} frame  sim frame counter (the shot's random number)
 * @param {{ isP1: boolean, turnIsP1: boolean, mayStrike: boolean }} [turn]  whose turn it is (the classifier's
 *   special flag needs it). A press while mayStrike is false is a miss, like a press with the ball out of reach.
 * @returns {SwingEvent | null}
 */
export function stepPlayer(pl, act, ball, p, frame, turn = { isP1: true, turnIsP1: true, mayStrike: true }) {
  /** @type {SwingEvent | null} */
  let event = null;
  const s = pl.swing;
  if (s) {
    s.t++;
    const T = timing(s.kind);
    if (s.t === T.CONTACT && s.contact) {
      const c = s.contact;
      const aim = aimFromTiming(ball.z, pl.z);
      const entry = shotEntry(SHOT_TABLES[c.zone][s.button][c.index]);
      applyShot(ball, entry, aim, { z: pl.z, flags1b: c.flags, isCpu: !!(pl.flags1b & 0x40) }, frame, p);
      s.hit = true;
      event = { type: 'hit', kind: s.kind, button: s.button, flags: c.flags, zone: c.zone, index: c.index, reach: true,
                aim, ball: { x: ball.x, y: ball.y, z: ball.z, vx: ball.vx, vy: ball.vy, vz: ball.vz } };
    }
  } else if (act.hard || act.soft) {
    const button = act.hard ? 'hard' : 'soft';
    const c = classifyContact(ball, pl, p, { isP1: turn.isP1, turnIsP1: turn.turnIsP1 });
    const reach = turn.mayStrike && !(c.flags & 0x20);
    const kind = reach && (c.flags & DIVE_FLAG) ? 'dive' : 'swing';
    pl.swing = { kind, t: 0, button, hand: c.flags & 4 ? 'back' : 'fore', contact: reach ? c : null, hit: false };
    event = { type: 'swing', kind, button, flags: c.flags, zone: c.zone, index: c.index, reach };
  }

  const sw = pl.swing;
  movePlayer(pl, act, sw ? timing(sw.kind).MOVE_SPEED : PLAYER.RUN_SPEED);
  const L = PLAYER_LIMITS;
  pl.x = Math.max(L.xMin * FP, Math.min(L.xMax * FP, pl.x));
  pl.z = Math.max(L.zMin * FP, Math.min(L.zMax * FP, pl.z));
  if (sw && sw.t >= swingLength(sw.kind) - 1) pl.swing = null;   // that was the last locked frame
  return event;
}
