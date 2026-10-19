// @ts-check
// The game world for a 2-player match: the ball, both players, the frame counter, the rally and the match.
// Pure sim code: no DOM, canvas or input devices. One call to stepWorld is one 57.4 Hz sim step.
//
// Phases:  serve → rally → point (a freeze: callout, then POINT and the score) → serve … → over (HARD = rematch)
//  - serve: the server stands in the service box match.js names and holds the ball. HARD or SOFT launches the
//    arcade's fixed SERVE trajectory from there (arcade-simple: no service faults). The receiver starts in the
//    opposite back quarter. Both may move; the server stays inside the box.
//  - rally: each step runs stepPlayer for P1 then P2 (a 'hit' calls rallyStrike), then stepBall. Only the player
//    whose turn it is (canStrike) can make contact; anyone else's swing misses.
import { FP, makeBall, difficultyParams, predict, SERVE } from '../squash-physics.js';
import { serviceBox } from './court-rules.js';
import { makeRally, canStrike, rallyStrike, stepBall } from './rally.js';
import { firstServer, makeMatch, scoreRally } from './match.js';
import { makePlayer, stepPlayer, PLAYER_LIMITS } from './player.js';

/** Freeze after a rally, in sim frames: the callout, then POINT and the score (about 1.5 s in all). */
export const TIMING = { CALLOUT: 43, POINT: 43 };

/** Where the serve starts, in game units. */
export const SERVE_SPOT = {
  BALL_DX: 18,       // the held ball is this far to the server's right (+x); the server stands so it's mid-box
  BALL_Y: 30,        // height of the held ball (as the S1 feed and the S2 scripted serve)
  RECEIVER_X: 72,    // receiver: centre of the opposite back quarter…
  RECEIVER_Z: 150,   // …a little behind the service boxes
};

/** @typedef {import('./rally.js').Side} Side */
/** @typedef {import('./rally.js').Rally} Rally */
/** @typedef {import('./rally.js').RallyResult} RallyResult */
/** @typedef {import('./match.js').Match} Match */
/** @typedef {import('./player.js').Player} Player */
/** @typedef {import('./player.js').Actions} Actions */
/** @typedef {ReturnType<typeof makeBall>} Ball */
/** @typedef {'serve' | 'rally' | 'point' | 'over'} Phase */

/**
 * @typedef {object} World
 * @property {ReturnType<typeof defaultParams>} params  physics params
 * @property {number} seed       picks the first server (2P: random from the seed)
 * @property {number} matchNo    0 for the first match, +1 for each rematch
 * @property {number} frame      sim frame counter (also the shot RNG)
 * @property {Phase} phase
 * @property {number} timer      frames since the phase began (used by 'point')
 * @property {Match} match
 * @property {Rally} rally
 * @property {Ball} ball
 * @property {[Player, Player]} players
 * @property {{ x: number, z: number } | null} landing  where the ball will first bounce after the front wall (units)
 * @property {RallyResult | null} result  the last rally's result (kept through the freeze)
 */

/**
 * @typedef {(
 *   { type: 'swing' | 'hit', side: Side } & import('./player.js').SwingEvent |
 *   { type: 'serve', side: Side, button: 'hard' | 'soft' } |
 *   { type: 'ball', ev: string, x: number, y: number, z: number } |
 *   { type: 'rally', winner: Side, reason: import('./rally.js').RallyReason, scores: [number, number] } |
 *   { type: 'newRally', server: Side } |
 *   { type: 'match', winner: Side, scores: [number, number] } |
 *   { type: 'rematch', server: Side }
 * )} WorldEvent
 */

/** The game pace until difficulty levels exist (S6): the S1 params, with latMult = powerMult (S2). */
export function defaultParams() {
  const d = difficultyParams(0);
  return { ...d, latMult: d.powerMult };
}

/** @param {Side} s @returns {Side} */
const other = s => (s === 0 ? 1 : 0);

/**
 * @param {{ target?: number, seed?: number, params?: ReturnType<typeof defaultParams> }} [o]
 * @returns {World}
 */
export function makeWorld({ target = 9, seed = 0, params = defaultParams() } = {}) {
  const server = firstServer({ vsCpu: false, seed });
  /** @type {World} */
  const w = {
    params, seed, matchNo: 0, frame: 0, phase: 'serve', timer: 0,
    match: makeMatch({ target, server }), rally: makeRally(server), ball: makeBall(),
    players: [makePlayer(0, 0), makePlayer(0, 0)], landing: null, result: null,
  };
  setupServe(w);
  return w;
}

/** Players to their serve positions and the ball into the server's hand. @param {World} w */
function setupServe(w) {
  const m = w.match, s = m.server;
  const box = serviceBox(m.box);
  w.players[s] = makePlayer((box.xMin + box.xMax) / 2 - SERVE_SPOT.BALL_DX, (box.zMin + box.zMax) / 2);
  w.players[other(s)] = makePlayer(m.box === 'right' ? -SERVE_SPOT.RECEIVER_X : SERVE_SPOT.RECEIVER_X, SERVE_SPOT.RECEIVER_Z);
  w.rally = makeRally(s);
  w.phase = 'serve';
  w.timer = 0;
  w.landing = null;
  w.result = null;
  holdBall(w);
}

/** @param {World} w */
function holdBall(w) {
  const pl = w.players[w.match.server];
  w.ball = makeBall({ x: pl.x + SERVE_SPOT.BALL_DX * FP, y: SERVE_SPOT.BALL_Y * FP, z: pl.z });
}

/** Keep the server in the box, with the held ball inside it too. @param {Player} pl @param {import('./court-rules.js').BoxSide} side */
function clampToBox(pl, side) {
  const b = serviceBox(side);
  const xMin = Math.max(b.xMin, PLAYER_LIMITS.xMin), xMax = b.xMax - SERVE_SPOT.BALL_DX;
  pl.x = Math.max(xMin * FP, Math.min(xMax * FP, pl.x));
  pl.z = Math.max(b.zMin * FP, Math.min(b.zMax * FP, pl.z));
}

/** @param {World} w @param {Side} side */
function turnOf(w, side) {
  return { isP1: side === 0, turnIsP1: w.rally.turn === 0, mayStrike: canStrike(w.rally, side) };
}

/**
 * Where a ball just struck will first bounce after reaching the front wall, or null if it won't (it goes down,
 * out, or takes longer than the predictor looks). Positions are where the collision happened.
 * @param {Ball} ball
 * @param {ReturnType<typeof defaultParams>} p
 * @param {boolean} needFront  the ball hasn't reached the front wall yet
 * @returns {{ x: number, z: number } | null}
 */
export function landingSpot(ball, p, needFront) {
  const path = predict(ball, p);
  let front = !needFront;
  for (let k = 0; k < path.length; k++) {
    const ev = path[k].ev;
    if (ev === 'frontWall') front = true;
    else if (ev === 'floor') {
      if (!front) return null;
      const at = k > 0 ? path[k - 1] : ball;      // a collision happens at the position before the step
      return { x: at.x / FP, z: at.z / FP };
    }
  }
  return null;
}

/**
 * One sim step.
 * @param {World} w
 * @param {Actions} a1  P1's actions this step
 * @param {Actions} a2  P2's actions this step
 * @returns {WorldEvent[]}
 */
export function stepWorld(w, a1, a2) {
  /** @type {WorldEvent[]} */
  const events = [];
  /** @type {[Actions, Actions]} */
  const acts = [a1, a2];
  if (w.phase === 'serve') stepServe(w, acts, events);
  else if (w.phase === 'rally') stepRally(w, acts, events);
  else if (w.phase === 'point') stepPoint(w, events);
  else if (a1.hard || a2.hard) rematch(w, events);
  w.frame++;
  return events;
}

/** @param {World} w @param {[Actions, Actions]} acts @param {WorldEvent[]} events */
function stepServe(w, acts, events) {
  const s = w.match.server;
  for (const side of /** @type {Side[]} */ ([0, 1])) {
    const pl = w.players[side];
    if (side === s) {
      stepPlayer(pl, { ...acts[side], hard: false, soft: false }, w.ball, w.params, w.frame, turnOf(w, side));
      clampToBox(pl, w.match.box);
    } else {
      const e = stepPlayer(pl, acts[side], w.ball, w.params, w.frame, turnOf(w, side));
      if (e) events.push({ ...e, side });
    }
  }
  holdBall(w);
  const act = acts[s];
  if (act.hard || act.soft) {
    const button = act.hard ? 'hard' : 'soft';
    w.ball.vx = SERVE.vx;
    w.ball.vz = SERVE.vz;
    w.ball.vy = SERVE.vy[button === 'hard' ? 1 : 0];
    rallyStrike(w.rally, s, w.ball);
    w.phase = 'rally';
    w.landing = landingSpot(w.ball, w.params, true);
    events.push({ type: 'serve', side: s, button });
  }
}

/** @param {World} w @param {[Actions, Actions]} acts @param {WorldEvent[]} events */
function stepRally(w, acts, events) {
  for (const side of /** @type {Side[]} */ ([0, 1])) {
    const e = stepPlayer(w.players[side], acts[side], w.ball, w.params, w.frame, turnOf(w, side));
    if (!e) continue;
    events.push({ ...e, side });
    if (e.type === 'hit' && rallyStrike(w.rally, side, w.ball)) w.landing = landingSpot(w.ball, w.params, true);
  }
  const at = { x: w.ball.x / FP, y: w.ball.y / FP, z: w.ball.z / FP };   // a collision happens before the move
  const { ev, result } = stepBall(w.rally, w.ball, w.params);
  if (ev) events.push({ type: 'ball', ev, ...at });
  if (ev === 'floor') w.landing = null;
  if (result) {
    scoreRally(w.match, result.winner);
    w.result = result;
    w.phase = 'point';
    w.timer = 0;
    w.landing = null;
    events.push({ type: 'rally', ...result, scores: [...w.match.scores] });
  }
}

/** @param {World} w @param {WorldEvent[]} events */
function stepPoint(w, events) {
  if (++w.timer < TIMING.CALLOUT + TIMING.POINT) return;
  const m = w.match;
  if (m.winner !== null) {
    w.phase = 'over';
    events.push({ type: 'match', winner: m.winner, scores: [...m.scores] });
  } else {
    setupServe(w);
    events.push({ type: 'newRally', server: m.server });
  }
}

/** @param {World} w @param {WorldEvent[]} events */
function rematch(w, events) {
  w.matchNo++;
  const server = firstServer({ vsCpu: false, seed: w.seed + w.matchNo });
  w.match = makeMatch({ target: w.match.target, server });
  setupServe(w);
  events.push({ type: 'rematch', server });
}
