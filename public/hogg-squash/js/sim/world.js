// @ts-check
// The game world for a 2-player match: the ball, both players, the frame counter, the rally and the match.
// Pure sim code: no DOM, canvas or input devices. One call to stepWorld is one 57.4 Hz sim step.
//
// Phases:  serve → rally → point (a freeze: callout, then POINT and the score) → serve … → over (HARD = rematch)
//  - serve: the server stands in the service box match.js names and holds the ball. HARD or SOFT launches it with
//    the arcade's SERVE height, aimed across the court (serveTarget, serveAim): where the server stands in the box
//    picks the first bounce's place across the opposite back quarter (a mirror image), and the button picks its
//    depth (HARD deep, SOFT shorter). Arcade-simple: no service faults. The receiver starts in the opposite back
//    quarter. Both may move; the server stays inside the box.
//  - rally: each step runs stepPlayer for P1 then P2 (a 'hit' calls rallyStrike), then stepBall. Only the player
//    whose turn it is (canStrike) can make contact; anyone else's swing misses.
import { FP, makeBall, difficultyParams, predict, SERVE } from '../squash-physics.js';
import { serviceBox, LINES } from './court-rules.js';
import { makeRally, canStrike, rallyStrike, stepBall } from './rally.js';
import { firstServer, makeMatch, scoreRally } from './match.js';
import { makePlayer, stepPlayer, PLAYER_LIMITS } from './player.js';

/** Freeze after a rally, in sim frames: the callout, then POINT and the score (about 1.5 s in all). */
export const TIMING = { CALLOUT: 43, POINT: 43 };

/** Where the serve starts, in game units. */
export const SERVE_SPOT = {
  BALL_DX: 18,       // the held ball is this far to the server's right (+x); the server starts mid-reach in the box
  BALL_Y: 30,        // height of the held ball (as the S1 feed and the S2 scripted serve)
  RECEIVER_X: 72,    // receiver: centre of the opposite back quarter…
  RECEIVER_Z: 150,   // …a little behind the service boxes
};

/**
 * The aimed serve (CP-B), in game units. Tunables for CP-C.
 *  - Across: the held ball's place across its reach in the box maps to the first bounce's |x| in the opposite back
 *    quarter, as a mirror image: the edge nearest the centre line → X_NEAR, the edge nearest the side wall → X_FAR.
 *  - Depth: HARD aims at Z_HARD, SOFT at Z_SOFT. The server's depth in the box moves it by up to ±Z_NUDGE (front
 *    of the box shorter, back deeper).
 *  - serveAim tries depth speeds from VZ_MIN to VZ_MAX (units/frame; the arcade serve's is 9) and keeps the arcade's
 *    height speed for the button. The first bounce happens on a whole frame, so the reachable depths come in small
 *    steps (a few units apart): the serve lands on the nearest one, within 4 units of the target depth.
 */
export const SERVE_AIM = {
  X_NEAR: 36,
  X_FAR: 120,
  Z_HARD: 168,
  Z_SOFT: 140,
  Z_NUDGE: 8,
  VZ_MIN: 4,
  VZ_MAX: 11,
  VZ_STEP: 1 / 64,
  X_TOLERANCE: 2,    // the solved first bounce must be this close to the target x
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
 * @property {{ x: number, z: number } | null} serveTarget  where this rally's serve was aimed (units; null before it)
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
    players: [makePlayer(0, 0), makePlayer(0, 0)], landing: null, serveTarget: null, result: null,
  };
  setupServe(w);
  return w;
}

/** Players to their serve positions and the ball into the server's hand. @param {World} w */
function setupServe(w) {
  const m = w.match, s = m.server;
  const a = serverArea(m.box);                    // mid-reach, so an untouched serve goes to the middle of its range
  w.players[s] = makePlayer((a.xMin + a.xMax) / 2, (a.zMin + a.zMax) / 2);
  w.players[other(s)] = makePlayer(m.box === 'right' ? -SERVE_SPOT.RECEIVER_X : SERVE_SPOT.RECEIVER_X, SERVE_SPOT.RECEIVER_Z);
  w.rally = makeRally(s);
  w.phase = 'serve';
  w.timer = 0;
  w.landing = null;
  w.serveTarget = null;
  w.result = null;
  holdBall(w);
}

/** @param {World} w */
function holdBall(w) {
  const pl = w.players[w.match.server];
  w.ball = makeBall({ x: pl.x + SERVE_SPOT.BALL_DX * FP, y: SERVE_SPOT.BALL_Y * FP, z: pl.z });
}

/**
 * Where the server's feet may go in a service box: inside it, with the held ball inside it too.
 * @param {import('./court-rules.js').BoxSide} side
 */
function serverArea(side) {
  const b = serviceBox(side);
  return { xMin: Math.max(b.xMin, PLAYER_LIMITS.xMin), xMax: b.xMax - SERVE_SPOT.BALL_DX, zMin: b.zMin, zMax: b.zMax };
}

/** Keep the server in the box. @param {Player} pl @param {import('./court-rules.js').BoxSide} side */
function clampToBox(pl, side) {
  const a = serverArea(side);
  pl.x = Math.max(a.xMin * FP, Math.min(a.xMax * FP, pl.x));
  pl.z = Math.max(a.zMin * FP, Math.min(a.zMax * FP, pl.z));
}

/**
 * Where a serve from this spot is aimed: its first bounce's place in the opposite back quarter (SERVE_AIM).
 * @param {import('./court-rules.js').BoxSide} side  the server's box
 * @param {number} ballX  the held ball's x, game units
 * @param {number} ballZ  the held ball's z (the server's depth), game units
 * @param {'hard' | 'soft'} button
 * @returns {{ x: number, z: number }}
 */
export function serveTarget(side, ballX, ballZ, button) {
  const A = SERVE_AIM, a = serverArea(side);
  const lo = a.xMin + SERVE_SPOT.BALL_DX, hi = a.xMax + SERVE_SPOT.BALL_DX;      // the held ball's reach across
  const clamp01 = (/** @type {number} */ t) => Math.max(0, Math.min(1, t));
  // 0 at the edge nearest the centre line, 1 at the edge nearest the side wall
  const out = clamp01(side === 'right' ? (ballX - lo) / (hi - lo) : (hi - ballX) / (hi - lo));
  const back = clamp01((ballZ - a.zMin) / (a.zMax - a.zMin));
  const x = (A.X_NEAR + (A.X_FAR - A.X_NEAR) * out) * (side === 'right' ? -1 : 1);
  const z = (button === 'hard' ? A.Z_HARD : A.Z_SOFT) + A.Z_NUDGE * (2 * back - 1);
  return { x, z };
}

/** @typedef {{ wallY: number, sideWall: boolean, x: number, z: number }} ServeFlight */

/**
 * A served ball's flight up to its first bounce after the front wall, or null if it doesn't get there.
 * @param {Ball} ball
 * @param {ReturnType<typeof defaultParams>} p
 * @returns {ServeFlight | null}  wallY = height at the front wall; sideWall = it touched one first
 */
export function serveFlight(ball, p) {
  const path = predict(ball, p);
  let wallY = -1, sideWall = false;
  for (let k = 0; k < path.length; k++) {
    const at = k > 0 ? path[k - 1] : ball, ev = path[k].ev;      // a collision happens at the position before the step
    if (ev === 'frontWall') { if (wallY < 0) wallY = at.y / FP; }
    else if (ev === 'sideWall') sideWall = true;
    else if (ev === 'floor') return wallY < 0 ? null : { wallY, sideWall, x: at.x / FP, z: at.z / FP };
  }
  return null;
}

/**
 * Is this serve legal and on target across? It hits the front wall between the service line and the out-line,
 * touches no side wall, and first bounces in the opposite back quarter (behind the short line, on the target's side
 * of the centre line), within X_TOLERANCE of the target x.
 * @param {ServeFlight | null} f
 * @param {{ x: number, z: number }} target
 * @returns {f is ServeFlight}
 */
export function serveIsGood(f, target) {
  return !!f && !f.sideWall && f.wallY > LINES.SERVICE && f.wallY < LINES.FRONT_OUT && f.z > LINES.SHORT_Z &&
    f.z < LINES.BACK && Math.sign(f.x) === Math.sign(target.x) && Math.abs(f.x - target.x) <= SERVE_AIM.X_TOLERANCE;
}

/**
 * The depth and sideways speeds that make a serve first bounce on the target, found with the real physics (so it
 * holds at any game pace). The height speed is kept. Depth speeds from SERVE_AIM.VZ_MIN to VZ_MAX are ranked by how
 * close their first bounce lands to the target depth (the slower first when they tie); the first one whose sideways
 * speed (serveVx) makes a good serve (serveIsGood) wins. Null if none does.
 * @param {Ball} ball  the served ball: position and vy (vx and vz are ignored)
 * @param {ReturnType<typeof defaultParams>} p
 * @param {{ x: number, z: number }} target
 * @returns {{ vx: number, vz: number } | null}  16.16
 */
export function serveAim(ball, p, target) {
  const A = SERVE_AIM;
  /** @type {{ vz: number, err: number }[]} */
  const tries = [];
  const step = Math.round(A.VZ_STEP * FP);
  for (let s = A.VZ_MIN * FP; s <= A.VZ_MAX * FP; s += step) {
    const f = serveFlight({ ...ball, vx: 0, vz: -s }, p);          // the sideways speed doesn't change the depth
    if (f) tries.push({ vz: -s, err: Math.abs(f.z - target.z) });
  }
  tries.sort((a, b) => a.err - b.err || b.vz - a.vz);
  for (const t of tries) {
    const b = { ...ball, vz: t.vz };
    const vx = serveVx(b, p, target.x);
    if (serveIsGood(serveFlight({ ...b, vx }, p), target)) return { vx, vz: t.vz };
  }
  return null;
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
 * The sideways speed that makes a serve (ball already given its depth and height speeds) first bounce at x = targetX
 * after the front wall. Found by bisection with the real physics, so it holds for any game pace.
 * @param {Ball} ball  the served ball (vx is ignored)
 * @param {ReturnType<typeof defaultParams>} p
 * @param {number} targetX  game units
 * @returns {number}  vx, 16.16
 */
export function serveVx(ball, p, targetX) {
  const dir = targetX < ball.x / FP ? -1 : 1;
  let lo = 0, hi = 12 * FP;                         // |vx|: lo lands short of the target, hi past it
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    const f = serveFlight({ ...ball, vx: dir * mid }, p);    // off a side wall first counts as past (it comes back)
    if (f && !f.sideWall && (f.x - targetX) * dir < 0) lo = mid; else hi = mid;
  }
  return dir * hi;
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
    w.ball.vy = SERVE.vy[button === 'hard' ? 1 : 0];
    const target = serveTarget(w.match.box, w.ball.x / FP, w.ball.z / FP, button);
    const aim = serveAim(w.ball, w.params, target);
    if (aim) Object.assign(w.ball, aim);
    else {                                       // not expected (the tests cover every pace): the arcade depth speed
      w.ball.vz = SERVE.vz;
      w.ball.vx = serveVx(w.ball, w.params, target.x);
    }
    w.serveTarget = target;
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
