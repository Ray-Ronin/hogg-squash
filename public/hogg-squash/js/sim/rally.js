// @ts-check
// The rules of one rally, as a state machine fed by the physics each step. Pure sim code: no DOM.
//
//  - A strike (serves included: serving is arcade-simple) must reach the front wall, above the tin and below the
//    out-line, before it touches the floor. Side walls and the back glass are allowed on the way.
//  - After a good front-wall hit it is the other player's ball: one floor bounce is allowed, the second loses.
//  - A player may strike only on their turn, and only once the ball has hit the front wall since the last strike.
//  - Out anywhere (front-wall or side-wall out-line, over the back glass, out of the court) loses the rally for the
//    player who struck last.
//
// Usage each sim step: players first (a hit calls rallyStrike), then stepBall instead of the physics step.
import { FP, COURT, step } from '../squash-physics.js';
import { frontWallVerdict, sideWallVerdict } from './court-rules.js';

/** @typedef {0 | 1} Side  player slot: 0 = P1, 1 = P2 */
/** @typedef {'tin' | 'out' | 'down' | 'notUp'} RallyReason  down = floor before the front wall, notUp = second bounce */
/** @typedef {{ winner: Side, reason: RallyReason }} RallyResult */
/** @typedef {ReturnType<typeof import('../squash-physics.js').makeBall>} Ball */

/**
 * @typedef {object} Rally
 * @property {Side} turn          who plays the ball next (the receiver once a strike is made)
 * @property {Side | null} striker  who struck last (null before the serve)
 * @property {boolean} needFront  the last strike hasn't reached the front wall yet
 * @property {number} bounces     floor bounces since the last good front-wall hit
 * @property {RallyResult | null} result  set once the rally is over
 */

/**
 * A new rally, with the server to strike first.
 * @param {Side} server
 * @returns {Rally}
 */
export function makeRally(server) {
  return { turn: server, striker: null, needFront: false, bounces: 0, result: null };
}

/**
 * May this player strike the ball now?
 * @param {Rally} r
 * @param {Side} player
 */
export function canStrike(r, player) {
  return !r.result && r.turn === player && !r.needFront;
}

/**
 * Record a strike (a racket hit or the serve), made after the shot has been applied to the ball.
 * Resets the ball's bounce count. Returns false and changes nothing if the player may not strike now.
 * @param {Rally} r
 * @param {Side} player
 * @param {Ball} ball
 * @returns {boolean}
 */
export function rallyStrike(r, player, ball) {
  if (!canStrike(r, player)) return false;
  r.striker = player;
  r.turn = player === 0 ? 1 : 0;
  r.needFront = true;
  r.bounces = 0;
  ball.bounces = 0;
  return true;
}

/**
 * @param {Rally} r
 * @param {Side} loser
 * @param {RallyReason} reason
 */
function lose(r, loser, reason) {
  r.result = { winner: loser === 0 ? 1 : 0, reason };
}

/**
 * Apply one physics step's outcome to the rally.
 * @param {Rally} r
 * @param {string | null} ev  the event returned by the physics step
 * @param {{ y: number, z: number, vz: number }} at  the ball before the step (16.16): where a collision happened
 * @param {Ball} ball  the ball after the step
 * @returns {RallyResult | null}  the result, on the step the rally ends
 */
export function rallyEvent(r, ev, at, ball) {
  if (r.result || r.striker === null) return null;
  const striker = r.striker;
  const y = at.y / FP, z = at.z / FP;

  if (ev === 'frontWall') {
    const v = frontWallVerdict(y);
    if (v === 'out') lose(r, striker, 'out');
    else if (r.needFront) {
      if (v === 'tin') lose(r, striker, 'tin');
      else { r.needFront = false; r.bounces = 0; }
    }
    // a second front-wall touch without a strike (e.g. back off the glass) leaves the rally as it is
  } else if (ev === 'sideWall') {
    if (sideWallVerdict(y, z) === 'out') lose(r, striker, 'out');
  } else if (ev === 'floor') {
    if (r.needFront) lose(r, striker, 'down');
    else if (++r.bounces >= 2) lose(r, r.turn, 'notUp');
  }
  if (r.result) return r.result;

  // over the back glass: crossing the back wall above the glass (where the physics won't bounce it back)
  if (ev !== 'backGlass' && (at.z >> 16) >= COURT.BACK && (at.y >> 16) > COURT.GLASS_H && at.vz > 0) {
    lose(r, striker, 'out');
  } else if (ball.out) {
    lose(r, striker, 'out');
  } else if (ball.y <= 0 && ball.vy === 0 && (r.needFront || r.bounces >= 1)) {
    // rolling on the floor: a ball whose bounce died (vy snapped to 0) won't raise another floor event
    if (r.needFront) lose(r, striker, 'down');
    else lose(r, r.turn, 'notUp');
  }
  return r.result;
}

/**
 * The physics step with the rally rules applied. Use it in place of `step` while a rally is live.
 * @param {Rally} r
 * @param {Ball} ball
 * @param {{ speed: number, gravity: number, bounceOffset: number }} p  physics params
 * @returns {{ ev: string | null, result: RallyResult | null }}
 */
export function stepBall(r, ball, p) {
  const at = { y: ball.y, z: ball.z, vz: ball.vz };
  const ev = step(ball, p);
  return { ev, result: rallyEvent(r, ev, at, ball) };
}
