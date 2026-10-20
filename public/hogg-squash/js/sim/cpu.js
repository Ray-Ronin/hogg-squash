// @ts-check
// The CPU opponent, ported from the arcade's (squash-game-logic.md §6). Each sim step it reads the world and returns
// the same six actions a human's keys would (left right up down hard soft), so it plugs into a player slot.
// Pure sim code: no DOM. Deterministic: its random choices come from a hash of the world's seed and frame, never
// from Math.random, so the same inputs always give the same game.
//
// In a rally:
//  1. react    when it becomes the CPU's turn (the opponent has just struck), wait the reaction delay (frames);
//  2. plan     run the predictor (the arcade's ghost ball) and pick the earliest contact it can reach in time: run time
//              at 2.5 units/frame across and 1.25 in depth, against the frames left before it must press. If none is
//              reachable, take the one it misses by the least;
//  3. chase    run to stand SIDE_OFFSET units to the ball's left at contact, so it meets the racket (forehand) side,
//              kept inside the arcade's CPU limits (x −147…104, z 22…178, and the player limits);
//  4. press    on the frame that puts the contact frame (SWING.CONTACT after the press) on the planned one;
//  5. recover  toward the T (T_X, T_Z), offset by its positioning error.
// Positioning error (plan, open question 3): a fresh random offset each rally, up to the error step across (half that
// in depth), that doesn't build up over a match as the arcade's does.
// Serving: it picks a spot in its box and a button (chooseServe), walks there, waits SERVE_WAIT frames and serves.
// Its skill comes from the world's params (difficulty.js): reaction delay, error step and shot sense. It reads them
// again at the start of each rally, so a level changed between rallies takes effect on the next one.
import { FP, PLAYER, predict } from '../squash-physics.js';
import { SWING, PLAYER_LIMITS } from './player.js';
import { SERVE_SPOT, serverArea, serveTarget } from './world.js';

/** Tunables (game units and frames). The arcade's are marked; the rest are ours, for CP-C. */
export const CPU = {
  SIDE_OFFSET: 32,       // arcade: stand this far to the side of the contact, so the ball is on the racket side
  X_MIN: -147,           // arcade: where it may plan to stand (also kept inside PLAYER_LIMITS)
  X_MAX: 104,
  Z_MIN: 22,
  Z_MAX: 178,
  T_X: 0,                // arcade: recover toward the T, about z 96
  T_Z: 96,
  ERROR_Z: 0.5,          // the positioning error's depth part, as a share of the error step (depth runs at half speed)
  CONTACT_Y_MAX: 56,     // it doesn't plan contacts above this height (1.6 m); overheads lower down are fine
  AIM_JITTER: 8,         // it stands up to this far in front of or behind the contact, so timing angles its shots
  SERVE_WAIT: 57,        // frames it waits on its serving spot before serving (≈ 1 s)
  SERVE_AVOID: 24,       // it serves to land at least this far across from the receiver (chooseServe)…
  SERVE_TRIES: 4,        // …trying up to this many random spots
  SERVE_HARD: 0.6,       // chance a serve is HARD (else SOFT)
  SOFT_FRONT: 0.6,       // chance of SOFT for a contact in the front court (z ≤ FRONT_Z): a drop
  SOFT_OPP_DEEP: 0.4,    // …when the opponent stands deep (z ≥ DEEP_Z)
  SOFT_OTHER: 0.15,      // …otherwise
  FRONT_Z: 72,
  DEEP_Z: 130,
  // Shot sense (params.cpuSense, 0 at level 1 → 1 at level 9) moves those chances toward these, which read where the
  // opponent stands and how low the ball is: drop when they're deep, drive past them when they're up the court, and
  // don't drop a ball at the floor (in play, about half of those SOFTs went into the tin).
  SENSE_LOW: 0.05,        // SOFT for a contact below LOW_Y, wherever the opponent is
  LOW_Y: 4,
  SENSE_FRONT_DEEP: 0.9,  // SOFT for a front-court contact with the opponent deep (z ≥ DEEP_Z)
  SENSE_FRONT: 0.3,       // …with the opponent further up
  SENSE_DEEP: 0.6,        // SOFT for any other contact with the opponent deep
  SENSE_UP: 0.05,         // …with the opponent in front of UP_Z
  UP_Z: 100,
};

/** Run speeds, units per frame. */
const RUN_X = PLAYER.RUN_SPEED * PLAYER.X_FACTOR / FP;     // 2.5
const RUN_Z = PLAYER.RUN_SPEED * PLAYER.Z_FACTOR / FP;     // 1.25

/** @typedef {import('./world.js').World} World */
/** @typedef {import('./player.js').Actions} Actions */
/** @typedef {import('./player.js').Player} Player */
/** @typedef {import('./rally.js').Side} Side */
/** @typedef {'wait' | 'serve' | 'react' | 'chase' | 'swing' | 'recover'} CpuState */

/**
 * A planned contact.
 * @typedef {object} Plan
 * @property {number} press     the world frame to press on
 * @property {number} contact   the world frame of contact (press + SWING.CONTACT)
 * @property {{ x: number, y: number, z: number }} ball  where the ball will be at contact (units)
 * @property {{ x: number, z: number }} stand  where to stand (units)
 * @property {number} late      frames it can't make up (0 = reachable)
 * @property {'hard' | 'soft'} button
 */

/**
 * The CPU's chosen serve: where its feet go, the button, and where that serve will land.
 * @typedef {{ x: number, z: number, button: 'hard' | 'soft', target: { x: number, z: number }, waited: number }} ServePlan
 */

/**
 * @typedef {object} Cpu
 * @property {Side} side
 * @property {number} reaction   frames of reaction delay (params.cpuReaction)
 * @property {number} errorStep  size of the positioning error (params.cpuErrorStep)
 * @property {number} sense      0…1, how much its HARD/SOFT choice reads the opponent (params.cpuSense)
 * @property {CpuState} state
 * @property {number} delay      reaction frames left
 * @property {boolean} mine      it was the CPU's turn last step
 * @property {import('./rally.js').Rally | null} rally  the rally its error and serve were chosen for
 * @property {{ x: number, z: number }} home  the T plus this rally's positioning error
 * @property {Plan | null} plan
 * @property {ServePlan | null} serve
 */

const NONE = Object.freeze({ up: false, down: false, left: false, right: false, hard: false, soft: false });

/** Random-number purposes, so each choice gets its own stream. */
const SALT = { ERROR_X: 1, ERROR_Z: 2, AIM: 3, BUTTON: 4, SERVE: 5 };

/**
 * A deterministic random number in [0, 1) from a few integers (a 32-bit integer hash, as match.js uses).
 * @param {...number} ints
 */
export function cpuRandom(...ints) {
  let h = 0x9e3779b9;
  for (const n of ints) {
    h = Math.imul(h ^ (n | 0), 0x85ebca6b);
    h ^= h >>> 13;
    h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
  }
  return (h >>> 0) / 2 ** 32;
}

/**
 * A CPU for one player slot, with the world's CPU params (reaction delay, error step and shot sense).
 * @param {World} w
 * @param {Side} side
 * @returns {Cpu}
 */
export function makeCpu(w, side) {
  return {
    side, reaction: w.params.cpuReaction, errorStep: w.params.cpuErrorStep, sense: w.params.cpuSense,
    state: 'wait', delay: 0, mine: false, rally: null, home: { x: CPU.T_X, z: CPU.T_Z }, plan: null, serve: null,
  };
}

/**
 * This step's actions for the CPU's player. Call it once per sim step, before stepWorld.
 * @param {Cpu} cpu
 * @param {World} w
 * @returns {Actions}
 */
export function cpuActions(cpu, w) {
  if (cpu.rally !== w.rally) newRally(cpu, w);
  const me = w.players[cpu.side];
  if (w.phase === 'serve') {
    if (w.match.server !== cpu.side) { cpu.state = 'wait'; return NONE; }
    cpu.state = 'serve';
    return serveActions(cpu, w, me);
  }
  if (w.phase !== 'rally') { cpu.state = 'wait'; return NONE; }     // the freeze, and 'over' (HARD would rematch)

  const r = w.rally, mine = r.turn === cpu.side && !r.result;
  if (mine && !cpu.mine) { cpu.state = 'react'; cpu.delay = cpu.reaction; cpu.plan = null; }
  cpu.mine = mine;
  if (!mine) {
    cpu.plan = null;
    cpu.state = me.swing ? 'swing' : 'recover';
    return moveToward(me, cpu.home.x, cpu.home.z);
  }
  if (cpu.state === 'react') {
    if (cpu.delay > 0) { cpu.delay--; return moveToward(me, cpu.home.x, cpu.home.z); }
    cpu.state = 'chase';
  }
  if (cpu.state === 'swing') {
    if (me.swing) return NONE;
    cpu.state = 'chase';                         // it missed and the ball is still its own: plan again
    cpu.plan = null;
  }
  if (!cpu.plan || cpu.plan.press < w.frame) cpu.plan = planContact(w, cpu.side);
  const plan = cpu.plan;
  if (!plan) return moveToward(me, cpu.home.x, cpu.home.z);    // nothing playable (it will be down or out)
  if (w.frame === plan.press) {
    cpu.state = 'swing';
    return { ...NONE, [plan.button]: true };
  }
  return moveToward(me, plan.stand.x, plan.stand.z);
}

/**
 * A new rally: the level's skill from the world's params, a fresh positioning error, and no plan or serve yet.
 * @param {Cpu} cpu
 * @param {World} w
 */
function newRally(cpu, w) {
  cpu.reaction = w.params.cpuReaction;
  cpu.errorStep = w.params.cpuErrorStep;
  cpu.sense = w.params.cpuSense;
  const n = w.matchNo * 1024 + w.match.scores[0] + w.match.scores[1];
  const e = cpu.errorStep;
  cpu.home = {
    x: CPU.T_X + (2 * cpuRandom(w.seed, cpu.side, SALT.ERROR_X, n) - 1) * e,
    z: CPU.T_Z + (2 * cpuRandom(w.seed, cpu.side, SALT.ERROR_Z, n) - 1) * e * CPU.ERROR_Z,
  };
  cpu.rally = w.rally;
  cpu.state = 'wait';
  cpu.mine = false;
  cpu.plan = null;
  cpu.serve = null;
}

/**
 * Run toward a spot. It stops within half a step of it on each axis, so it never steps back and forth.
 * @param {Player} me
 * @param {number} x  game units
 * @param {number} z
 * @returns {Actions}
 */
export function moveToward(me, x, z) {
  const dx = x - me.x / FP, dz = z - me.z / FP;
  return { ...NONE, left: dx < -RUN_X / 2, right: dx > RUN_X / 2, up: dz < -RUN_Z / 2, down: dz > RUN_Z / 2 };
}

/**
 * Frames to run from one spot to another (both axes at once, each at its own speed), to within half a step.
 * @param {number} dx  game units
 * @param {number} dz
 */
export function runFrames(dx, dz) {
  const fx = Math.max(0, Math.abs(dx) - RUN_X / 2) / RUN_X, fz = Math.max(0, Math.abs(dz) - RUN_Z / 2) / RUN_Z;
  return Math.ceil(Math.max(fx, fz));
}

/**
 * Where to stand for a contact with the ball at (x, z): SIDE_OFFSET to its left, `aimDz` behind it, in the limits.
 * @param {number} x
 * @param {number} z
 * @param {number} aimDz
 */
function standFor(x, z, aimDz) {
  const L = PLAYER_LIMITS;
  const clamp = (/** @type {number} */ v, /** @type {number} */ lo, /** @type {number} */ hi) => Math.max(lo, Math.min(hi, v));
  return {
    x: clamp(x - CPU.SIDE_OFFSET, Math.max(CPU.X_MIN, L.xMin), Math.min(CPU.X_MAX, L.xMax)),
    z: clamp(z + aimDz, Math.max(CPU.Z_MIN, L.zMin), Math.min(CPU.Z_MAX, L.zMax)),
  };
}

/**
 * Pick the contact: the earliest one the CPU can reach in time, from the predictor's path of the live ball.
 * A contact on path frame i needs the press on frame i − SWING.CONTACT, after the ball has reached the front wall (a
 * press before that is a miss), and before its second bounce. Null if the ball has no playable frame.
 * @param {World} w
 * @param {Side} side
 * @returns {Plan | null}
 */
export function planContact(w, side) {
  const r = w.rally, me = w.players[side];
  const path = predict(w.ball, w.params);
  const aimDz = (2 * cpuRandom(w.seed, side, SALT.AIM, w.frame) - 1) * CPU.AIM_JITTER;
  let front = !r.needFront, frontAt = front ? 0 : Infinity, floors = r.bounces;
  /** @type {Omit<Plan, 'button'> | null} */
  let best = null;
  for (let k = 0; k < path.length; k++) {
    const p = path[k], i = k + 1;                 // path[k] is the ball after i steps; its event happened on step i
    if (p.ev === 'frontWall' && !front) { front = true; frontAt = i; }
    else if (p.ev === 'floor') {
      if (!front || ++floors >= 2) break;         // down, or not up: the rally is over
    }
    const j = i - SWING.CONTACT;                  // frames until the press
    if (j < 0 || j < frontAt) continue;
    const ball = { x: p.x / FP, y: p.y / FP, z: p.z / FP };
    if (ball.y <= 0 && floors >= 1) break;        // rolling: the rally is over
    if (ball.y > CPU.CONTACT_Y_MAX) continue;
    const stand = standFor(ball.x, ball.z, aimDz);
    const late = Math.max(0, runFrames(stand.x - me.x / FP, stand.z - me.z / FP) - j);
    if (!best || late < best.late) best = { press: w.frame + j, contact: w.frame + i, ball, stand, late };
    if (late === 0) break;
  }
  if (!best) return null;
  return { ...best, button: chooseButton(w, side, best.ball, w.params.cpuSense, cpuRandom(w.seed, side, SALT.BUTTON, w.frame)) };
}

/**
 * HARD or SOFT for a rally shot. The arcade's rule isn't known, so this is a simple, tunable one: mostly HARD, with
 * drops (SOFT) more likely from the front court or when the opponent stands deep. With more shot sense (higher
 * levels) the chances lean further on where the opponent stands (drops when they're deep, drives when they're up),
 * and away from dropping a ball at the floor.
 * @param {World} w
 * @param {Side} side
 * @param {{ y: number, z: number }} contact  where the ball will be (units)
 * @param {number} sense  0…1 (params.cpuSense)
 * @param {number} r  a random number in [0, 1)
 * @returns {'hard' | 'soft'}
 */
export function chooseButton(w, side, contact, sense, r) {
  const oppZ = w.players[side === 0 ? 1 : 0].z / FP, deep = oppZ >= CPU.DEEP_Z, front = contact.z <= CPU.FRONT_Z;
  const plain = front ? CPU.SOFT_FRONT : deep ? CPU.SOFT_OPP_DEEP : CPU.SOFT_OTHER;
  const sensed = contact.y < CPU.LOW_Y ? CPU.SENSE_LOW : front ? (deep ? CPU.SENSE_FRONT_DEEP : CPU.SENSE_FRONT)
    : deep ? CPU.SENSE_DEEP : oppZ < CPU.UP_Z ? CPU.SENSE_UP : CPU.SOFT_OTHER;
  const soft = plain + (sensed - plain) * sense;
  return r < soft ? 'soft' : 'hard';
}

/**
 * Choose a serve: a random spot in the box and a random button, kept if its first bounce (serveTarget) lands at least
 * SERVE_AVOID across from where the receiver stands, so it isn't served straight at them. Up to SERVE_TRIES spots are
 * tried; if none clears, the one landing furthest across wins. Only the distance across counts, so the deeper HARD
 * serve isn't favoured over SOFT, and serves go both near the centre line and near the side wall.
 * @param {World} w
 * @param {Side} side
 * @returns {ServePlan}
 */
export function chooseServe(w, side) {
  const box = w.match.box, a = serverArea(box), rcv = w.players[side === 0 ? 1 : 0];
  /** @type {ServePlan | null} */
  let best = null;
  let bestDx = -1;
  for (let n = 0; n < CPU.SERVE_TRIES && bestDx < CPU.SERVE_AVOID; n++) {
    const rnd = (/** @type {number} */ k) => cpuRandom(w.seed, side, SALT.SERVE, w.frame, n, k);
    const x = a.xMin + rnd(0) * (a.xMax - a.xMin), z = a.zMin + rnd(1) * (a.zMax - a.zMin);
    const button = rnd(2) < CPU.SERVE_HARD ? 'hard' : 'soft';
    const target = serveTarget(box, x + SERVE_SPOT.BALL_DX, z, button);
    const dx = Math.abs(target.x - rcv.x / FP);
    if (dx > bestDx) { best = { x, z, button, target, waited: 0 }; bestDx = dx; }
  }
  return /** @type {ServePlan} */ (best);
}

/** Walk to the chosen spot, wait, serve. @param {Cpu} cpu @param {World} w @param {Player} me @returns {Actions} */
function serveActions(cpu, w, me) {
  const s = cpu.serve ??= chooseServe(w, cpu.side);
  const move = moveToward(me, s.x, s.z);
  if (move.left || move.right || move.up || move.down) return move;
  if (++s.waited < CPU.SERVE_WAIT) return NONE;
  return { ...NONE, [s.button]: true };
}
