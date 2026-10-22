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
// special contact that left the player down for 143–153 frames (shortened to 115 at CP-B). The art in A3 matches these constants.
// SOFT from the front court is a short drop (CP-C): shotFor caps its power and lift (DROP). This departs from the
// arcade's tables on purpose; SHOT_TABLES and the physics file stay as they are.
import { FP, PLAYER, movePlayer, classifyContact, SHOT_TABLES, shotEntry, applyShot, aimFromTiming } from '../squash-physics.js';

export const SWING = {
  CONTACT: 7,          // frames from the press to the racket meeting the ball (the classifier's look-ahead)
  RECOVERY: 11,        // frames from contact (included) until ready: ready on frame 18 after the press (≈ 0.31 s)
  MOVE_SPEED: 0,       // run speed while swinging: planted, as in the arcade (0xC000 would allow a slow shuffle)
};

export const DIVE = {
  CONTACT: 7,          // same look-ahead as a swing
  RECOVERY: 108,       // frames from contact (included) until back up: 115 frames in all (≈ 2.0 s; the arcade is 2.5 s, CP-B)
  MOVE_SPEED: 0,       // locked in place
};

/**
 * A SOFT struck in the FRONT zone is a short drop (CP-C). Some of the arcade's front-court SOFT rows are hit at twice
 * the drop's power, so the ball ran on to its second bounce near the back wall. shotFor caps their depth power and
 * lift (SHOT_TABLES itself is untouched: the golden tests replay it). Lift ÷ power sets the launch angle: 1280 ÷ 32 is
 * about the arcade's row #0 (3072 ÷ 80), at 40% of its power. Measured in S6b: the second bounce lands in front of the
 * short line (nearly all off a fast ball), but more drops fall short of the front wall (docs/decisions.md, "Hitting").
 * Tunables.
 */
export const DROP = {
  POWER_MAX: 32,       // depth power (the arcade's front-court SOFT rows are 80–160)
  LIFT_MAX: 1280,      // lift (the rows are 3072–6144)
};

/**
 * Contact types 8–9 (overheads: the ball above y 48) keep the arcade's entry. They are hit downward (negative lift),
 * and at a drop's power the ball falls into the tin before it reaches the wall (measured in S6b: 40–56% of them, none
 * with the arcade's entry). The animator plays the `overhead` tag for them (S8b).
 */
export const OVERHEAD = [8, 9];

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

/**
 * The shot-table entry a contact plays: the arcade's, except that a SOFT in the FRONT zone is capped to a short drop
 * (DROP), overheads apart.
 * @param {'FRONT' | 'MID' | 'BACK'} zone
 * @param {'hard' | 'soft'} button
 * @param {number} index  contact type 0..11
 * @returns {import('../squash-physics.js').ShotEntry}
 */
export function shotFor(zone, button, index) {
  const e = shotEntry(SHOT_TABLES[zone][button][index]);
  if (zone !== 'FRONT' || button !== 'soft' || OVERHEAD.includes(index)) return e;
  return { lift: Math.min(e.lift, DROP.LIFT_MAX), side: e.side, power: Math.min(e.power, DROP.POWER_MAX) };
}

/**
 * A CPU's smaller reach (params.cpuReach, below 1). Its contact is classified as if the ball 7 frames ahead were
 * further from its feet by 1 ÷ reach, across and in depth, so every band of the arcade's classifier (clean, stretch,
 * dive, out of reach) shrinks around it by that share. The arcade's classifier does the work: it is run again on a
 * still ball at the scaled spot (game speed 0, so the 7 look-ahead frames don't move it). The shot table zone stays
 * the real one.
 * @param {Contact} c  the contact as classified for the real ball
 * @param {Player} pl
 * @param {any} p
 * @param {{ isP1: boolean, turnIsP1: boolean }} opts
 * @param {number} reach  0…1
 * @returns {Contact}
 */
function shrinkReach(c, pl, p, opts, reach) {
  const g = c.ghost;
  const at = { ...g, x: Math.round(pl.x + (g.x - pl.x) / reach), z: Math.round(pl.z + (g.z - pl.z) / reach), vx: 0, vy: 0, vz: 0 };
  const s = classifyContact(at, pl, { ...p, speed: 0 }, opts);
  return { ...s, zone: c.zone, ghost: g };
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
      const entry = shotFor(c.zone, s.button, c.index);
      applyShot(ball, entry, aim, { z: pl.z, flags1b: c.flags, isCpu: !!(pl.flags1b & 0x40) }, frame, p);
      s.hit = true;
      event = { type: 'hit', kind: s.kind, button: s.button, flags: c.flags, zone: c.zone, index: c.index, reach: true,
                aim, ball: { x: ball.x, y: ball.y, z: ball.z, vx: ball.vx, vy: ball.vy, vz: ball.vz } };
    }
  } else if (act.hard || act.soft) {
    const button = act.hard ? 'hard' : 'soft';
    const opts = { isP1: turn.isP1, turnIsP1: turn.turnIsP1 };
    const c0 = classifyContact(ball, pl, p, opts);
    const c = pl.flags1b & 0x40 && p.cpuReach < 1 ? shrinkReach(c0, pl, p, opts, p.cpuReach) : c0;
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
