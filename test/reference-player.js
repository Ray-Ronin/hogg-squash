// @ts-check
// A scripted opponent that plays like a beginner, for testing the difficulty levels (S6b). It returns the same six
// actions as keys, like the CPU, but it plays the way a person does, not like a second CPU:
//  - it reacts REACTION frames after the opponent strikes (≈ 0.26 s), then runs to the ball's landing marker (the ring
//    the game draws where the ball will first bounce), SIDE to the left of it and BEHIND it, plus a fresh positioning
//    error each shot (up to ERROR across, half that in depth). Once the ball has bounced and the marker is gone, it
//    follows the ball itself, level with it;
//  - it presses when the ball is about to come level with it (the predictor says when, as a person's eye would), or
//    when it is nearest if it won't come level, give or take TIMING frames (a fresh error each shot), so it can be
//    early, late, stretched or miss;
//  - mostly HARD, with an occasional SOFT (more often from the front court); it serves after SERVE_WAIT frames from
//    wherever it stands, with a random button.
// Deterministic (cpuRandom with the world's seed), so a test replays exactly. Not game code: it lives in test/.
import { FP, predict } from '../public/hogg-squash/js/squash-physics.js';
import { cpuRandom, moveToward } from '../public/hogg-squash/js/sim/cpu.js';
import { SWING } from '../public/hogg-squash/js/sim/player.js';

/** Tunables (game units and frames). */
export const REF = {
  REACTION: 15,      // frames before it moves to a ball (≈ 0.26 s)
  TIMING: 3,         // its press is up to this many frames early or late
  ERROR: 16,         // positioning error across (half of it in depth), fresh each shot
  SIDE: 32,          // it stands this far to the left of the marker (the ball on its forehand)…
  BEHIND: 12,        // …and this far behind it, so the ball can come up off the floor
  HOME_X: 0,         // where it goes back to after its shot
  HOME_Z: 100,
  CONTACT_Y_MAX: 48, // it doesn't swing at a ball higher than this
  SOFT_FRONT: 0.3,   // chance of SOFT with the ball in the front court (z ≤ 72)
  SOFT: 0.1,         // …elsewhere
  SERVE_WAIT: 40,    // frames it stands before serving
};

const SALT = { ERROR_X: 101, ERROR_Z: 102, TIMING: 103, BUTTON: 104, SERVE: 105 };
const NONE = Object.freeze({ up: false, down: false, left: false, right: false, hard: false, soft: false });

/**
 * @typedef {object} Ref
 * @property {0 | 1} side
 * @property {boolean} mine      it was its turn last step
 * @property {number} delay      reaction frames left
 * @property {{ x: number, z: number }} error  this shot's positioning error
 * @property {number} timing     this shot's timing error, frames (+ = late)
 * @property {{ base: number, path: ReturnType<typeof predict>, frontAt: number } | null} seen  the ball's path, from
 *   the frame its reaction ended (the ball flies the same way until someone strikes it)
 * @property {number | null} pressAt  the frame it has decided to press on
 * @property {number} waited     serve frames waited
 */

/**
 * @param {import('../public/hogg-squash/js/sim/world.js').World} w
 * @param {0 | 1} side
 * @returns {Ref}
 */
export function makeRef(w, side) {
  return { side, mine: false, delay: 0, error: { x: 0, z: 0 }, timing: 0, seen: null, pressAt: null, waited: 0 };
}

/**
 * This step's actions. Call once per sim step, before stepWorld.
 * @param {Ref} ref
 * @param {import('../public/hogg-squash/js/sim/world.js').World} w
 */
export function refActions(ref, w) {
  const me = w.players[ref.side];
  if (w.phase === 'serve') {
    ref.mine = false;
    if (w.match.server !== ref.side) { ref.waited = 0; return NONE; }
    if (++ref.waited < REF.SERVE_WAIT) return NONE;
    ref.waited = 0;
    return cpuRandom(w.seed, ref.side, SALT.SERVE, w.frame) < 0.5 ? { ...NONE, hard: true } : { ...NONE, soft: true };
  }
  if (w.phase !== 'rally') return NONE;
  const r = w.rally, mine = r.turn === ref.side && !r.result;
  if (mine && !ref.mine) {                       // the opponent has just struck
    const rnd = (/** @type {number} */ s) => 2 * cpuRandom(w.seed, ref.side, s, w.frame) - 1;
    ref.delay = REF.REACTION;
    ref.error = { x: rnd(SALT.ERROR_X) * REF.ERROR, z: rnd(SALT.ERROR_Z) * REF.ERROR / 2 };
    ref.timing = Math.floor(cpuRandom(w.seed, ref.side, SALT.TIMING, w.frame) * (2 * REF.TIMING + 1)) - REF.TIMING;
    ref.seen = null;
    ref.pressAt = null;
  }
  ref.mine = mine;
  if (!mine) return moveToward(me, REF.HOME_X, REF.HOME_Z);
  if (ref.delay > 0) { ref.delay--; return moveToward(me, REF.HOME_X, REF.HOME_Z); }
  if (!ref.seen) ref.seen = look(w);

  // where to stand: behind the landing marker while it shows, then level with the ball
  const move = w.landing
    ? moveToward(me, w.landing.x - REF.SIDE + ref.error.x, w.landing.z + REF.BEHIND + ref.error.z)
    : moveToward(me, w.ball.x / FP - REF.SIDE + ref.error.x, w.ball.z / FP + ref.error.z);
  if (me.swing) { ref.pressAt = null; return NONE; }   // planted; if it misses and the ball is still its own, it goes again

  if (ref.pressAt === null) {
    const k = framesToLevel(ref, w, me.z / FP);
    if (k !== null && k <= Math.max(0, -ref.timing)) ref.pressAt = w.frame + k + ref.timing;
  }
  if (ref.pressAt !== null && w.frame >= ref.pressAt) {
    ref.pressAt = null;
    const soft = cpuRandom(w.seed, ref.side, SALT.BUTTON, w.frame) < (w.ball.z / FP <= 72 ? REF.SOFT_FRONT : REF.SOFT);
    return { ...NONE, [soft ? 'soft' : 'hard']: true };
  }
  return move;
}

/**
 * The ball's path from now until its second bounce, and the step it reaches the front wall on.
 * @param {import('../public/hogg-squash/js/sim/world.js').World} w
 */
function look(w) {
  const path = predict(w.ball, w.params, 400);
  let frontAt = w.rally.needFront ? Infinity : 0;
  for (let k = 0; k < path.length && frontAt === Infinity; k++) if (path[k].ev === 'frontWall') frontAt = k + 1;
  return { base: w.frame, path, frontAt };
}

/**
 * Frames until the press that would meet the ball level with the player (standing at depth z): the first press,
 * after the ball has reached the front wall, whose contact SWING.CONTACT frames later has the ball's depth at or
 * past z (coming level from either side), at a height it would swing at. If the ball won't come level before its
 * second bounce (it dies in front, say), the press for its closest approach instead. Null if there's none on the path.
 * @param {Ref} ref
 * @param {import('../public/hogg-squash/js/sim/world.js').World} w
 * @param {number} z
 */
function framesToLevel(ref, w, z) {
  const s = /** @type {NonNullable<Ref['seen']>} */ (ref.seen), now = w.frame - s.base;
  let closest = null, gap = Infinity;
  for (let k = 0; ; k++) {
    const press = now + k, c = press + SWING.CONTACT;          // steps after the path began
    if (c > s.path.length) return closest;
    if (press < s.frontAt) continue;
    const before = s.path[c - 2] ?? s.path[0], at = s.path[c - 1];
    const y = at.y / FP, z0 = before.z / FP, z1 = at.z / FP;
    if (y > REF.CONTACT_Y_MAX) continue;
    if ((z0 - z) * (z1 - z) <= 0 || Math.abs(z1 - z) < 2) return k;
    if (Math.abs(z1 - z) < gap) { gap = Math.abs(z1 - z); closest = k; }
  }
}
