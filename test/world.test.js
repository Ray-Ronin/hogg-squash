// The world: determinism, serving, turns, scoring through a whole match (node:test, run by npm test).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FP, makeBall, step, classifyContact } from '../public/hogg-squash/js/squash-physics.js';
import { makeWorld, stepWorld, landingSpot, TIMING, SERVE_SPOT } from '../public/hogg-squash/js/sim/world.js';
import { serviceBox } from '../public/hogg-squash/js/sim/court-rules.js';
import { makePlayer } from '../public/hogg-squash/js/sim/player.js';

const NO_KEYS = Object.freeze({ up: false, down: false, left: false, right: false, hard: false, soft: false });
const FREEZE = TIMING.CALLOUT + TIMING.POINT;

/** Actions for one player: e.g. keys('hard'), keys('left', 'up'). */
const keys = (...names) => ({ ...NO_KEYS, ...Object.fromEntries(names.map(n => [n, true])) });

/** Step with these actions; returns every event. */
function run(w, steps, script = () => [NO_KEYS, NO_KEYS]) {
  const events = [];
  for (let i = 0; i < steps; i++) events.push(...stepWorld(w, ...script(i, w)));
  return events;
}

/** Step until an event of this type (or give up). */
function until(w, type, script, max = 2000) {
  for (let i = 0; i < max; i++) {
    const e = stepWorld(w, ...(script ? script(i) : [NO_KEYS, NO_KEYS])).find(e => e.type === type);
    if (e) return e;
  }
  assert.fail(`no ${type} event in ${max} steps`);
}

/** The server presses HARD now. */
const serveNow = w => (w.match.server === 0 ? [keys('hard'), NO_KEYS] : [NO_KEYS, keys('hard')]);

test('determinism: the same scripted inputs give an identical world', () => {
  // both players chase the ball (keeping it on their right) and press at random from a small LCG
  const script = seed => {
    let s = seed;
    const rnd = () => (s = (Math.imul(s, 1103515245) + 12345) >>> 0) / 2 ** 32;
    const chase = (w, side) => {
      const pl = w.players[side], dx = (w.ball.x - pl.x) / FP - 24, dz = (w.ball.z - pl.z) / FP;
      return {
        left: dx < -3, right: dx > 3, up: dz < -3, down: dz > 3,
        hard: rnd() < 0.06, soft: rnd() < 0.04,
      };
    };
    return (_i, w) => [chase(w, 0), chase(w, 1)];
  };
  const play = () => {
    const w = makeWorld({ target: 11, seed: 42 });
    const events = run(w, 6000, script(7));
    return { w, events };
  };
  const a = play(), b = play();
  assert.deepEqual(a.w, b.w);
  assert.deepEqual(a.events, b.events);
  const rallies = a.events.filter(e => e.type === 'rally').length;
  assert.ok(rallies >= 10, `the script should play many rallies (played ${rallies})`);
  assert.ok(a.events.some(e => e.type === 'hit'), 'and make at least one hit');
});

test('serve setup: server in the box match.js names, receiver in the opposite back quarter', () => {
  const w = makeWorld({ seed: 1 });
  const s = w.match.server, rcv = s === 0 ? 1 : 0;
  const box = serviceBox(w.match.box);
  assert.equal(w.match.box, 'right');
  assert.equal(w.phase, 'serve');
  const ballX = w.ball.x / FP;
  assert.equal(ballX, (box.xMin + box.xMax) / 2, 'the held ball is mid-box');
  assert.equal(w.players[s].x / FP, ballX - SERVE_SPOT.BALL_DX);
  assert.ok(w.players[rcv].x < 0 && w.players[rcv].z / FP > box.zMax, 'receiver back left');
  // the server can't walk out of the box while holding the ball
  run(w, 200, () => (s === 0 ? [keys('left', 'up'), NO_KEYS] : [NO_KEYS, keys('left', 'up')]));
  assert.equal(w.phase, 'serve');
  assert.equal(w.players[s].x / FP, box.xMin);
  assert.equal(w.players[s].z / FP, box.zMin);
});

test('an unreturned serve: point to the server, who keeps serving from the other box', () => {
  const w = makeWorld({ seed: 3 });
  const s = w.match.server;
  const served = stepWorld(w, ...serveNow(w));
  assert.deepEqual(served.find(e => e.type === 'serve'), { type: 'serve', side: s, button: 'hard' });
  assert.equal(w.phase, 'rally');
  const r = until(w, 'rally');
  assert.equal(r.winner, s);
  assert.equal(r.reason, 'notUp');
  assert.equal(w.match.scores[s], 1);
  assert.equal(w.phase, 'point');
  // the freeze: nothing moves, then the next serve from the left box
  const ball = { ...w.ball };
  const freeze = run(w, FREEZE - 1);
  assert.deepEqual(w.ball, ball, 'the ball is frozen');
  assert.equal(freeze.length, 0);
  assert.equal(w.phase, 'point');
  assert.deepEqual(run(w, 1), [{ type: 'newRally', server: s }]);
  assert.equal(w.phase, 'serve');
  assert.equal(w.match.box, 'left');
  assert.ok(w.ball.x < 0, 'serving from the left box');
});

test('the serve crosses the court: it first bounces in line with the opposite box, behind it', () => {
  const w = makeWorld({ seed: 3 });
  for (const [box, across] of [['right', 'left'], ['left', 'right']]) {
    assert.equal(w.match.box, box);
    const target = serviceBox(across);
    stepWorld(w, ...serveNow(w));
    const mark = w.landing;
    assert.ok(mark, 'a landing marker');
    assert.ok(Math.abs(mark.x - (target.xMin + target.xMax) / 2) < 1, `lands in line with the ${across} box (x ${mark.x})`);
    assert.ok(mark.z > target.zMax, `behind the box (z ${mark.z})`);
    // the plain physics agrees, and the serve is good (no tin, no out)
    let front = false, first = null;
    for (let i = 0; i < 200 && !first; i++) {
      const e = stepWorld(w, NO_KEYS, NO_KEYS);
      if (e.some(e => e.type === 'ball' && e.ev === 'frontWall')) front = true;
      const f = e.find(e => e.type === 'ball' && e.ev === 'floor');
      if (f && front) first = f;
      assert.ok(!e.some(e => e.type === 'rally'), 'the serve is still live at its first bounce');
    }
    assert.deepEqual([first.x, first.z], [mark.x, mark.z]);
    until(w, 'rally');
    run(w, FREEZE);                                      // the unreturned serve wins; the server serves from the other box
  }
});

test('turns: the server cannot hit the ball back, and nobody can take the serve before the front wall', () => {
  const w = makeWorld({ seed: 5 });
  const s = w.match.server, rcv = s === 0 ? 1 : 0;
  // the receiver standing on the ball can't swing at it while it's held, nor on its way to the front wall
  w.players[rcv] = makePlayer(w.ball.x / FP, w.ball.z / FP);
  const press = side => (side === 0 ? [keys('hard'), NO_KEYS] : [NO_KEYS, keys('hard')]);
  let e = stepWorld(w, ...press(rcv)).find(e => e.type === 'swing');
  assert.equal(e?.reach, false, 'no swing at a held ball');
  run(w, 20);                                   // let that swing finish (18 frames)
  stepWorld(w, ...serveNow(w));
  e = stepWorld(w, ...press(rcv)).find(e => e.type === 'swing');
  assert.equal(e?.reach, false, 'the receiver waits for the front wall');
  // follow the ball with the server and swing: always a miss, it's the receiver's ball
  for (let i = 0; i < 300 && w.phase === 'rally'; i++) {
    w.players[s] = makePlayer(w.ball.x / FP, w.ball.z / FP);
    const ev = stepWorld(w, ...(i % 10 === 0 ? press(s) : [NO_KEYS, NO_KEYS]));
    assert.ok(!ev.some(e => e.type === 'hit'), 'the server never makes contact');
    const sw = ev.find(e => e.type === 'swing');
    if (sw) assert.equal(sw.reach, false);
  }
});

test('a good return: the receiver hits the serve back, the server misses it, the receiver wins the point and serves', () => {
  const w = makeWorld({ seed: 9 });
  const s = w.match.server, rcv = s === 0 ? 1 : 0;
  stepWorld(w, ...serveNow(w));
  // as in rules.test.js: one bounce, back off the glass, 4 more frames, then stand where the ball will be
  let floors = 0, glass = false;
  while (!(floors === 1 && glass)) {
    for (const e of stepWorld(w, NO_KEYS, NO_KEYS)) {
      if (e.type === 'ball' && e.ev === 'floor') floors++;
      if (e.type === 'ball' && e.ev === 'backGlass') glass = true;
    }
  }
  run(w, 4);
  const ghost = classifyContact(w.ball, { x: 0, z: 0 }, w.params).ghost;
  w.players[rcv] = makePlayer(Math.round(ghost.x / FP), Math.round(ghost.z / FP));
  const press = rcv === 0 ? [keys('hard'), NO_KEYS] : [NO_KEYS, keys('hard')];
  const swing = stepWorld(w, ...press).find(e => e.type === 'swing');
  assert.equal(swing?.reach, true);
  const hit = until(w, 'hit');
  assert.equal(hit.side, rcv);
  assert.equal(w.rally.turn, s, "now it's the server's ball");
  assert.ok(w.landing, 'a landing marker for the return');
  const r = until(w, 'rally');
  assert.deepEqual([r.winner, r.reason], [rcv, 'notUp']);
  run(w, FREEZE);
  assert.equal(w.match.server, rcv, 'the rally winner serves');
  assert.equal(w.match.box, 'right', 'a new server starts in the right box');
});

test('the landing marker is where the ball first bounces after the front wall', () => {
  const w = makeWorld({ seed: 2 });
  stepWorld(w, ...serveNow(w));
  const mark = w.landing;
  assert.ok(mark);
  // replay the same ball with the plain physics
  const b = makeBall({ ...w.ball });
  let front = false, at = null;
  for (let i = 0; i < 300 && !at; i++) {
    const before = { x: b.x / FP, z: b.z / FP };
    const ev = step(b, w.params);
    if (ev === 'frontWall') front = true;
    if (ev === 'floor' && front) at = before;
  }
  assert.deepEqual(mark, at);
  assert.equal(landingSpot(makeBall({ y: 20 * FP, z: 100 * FP, vz: -1 * FP }), w.params, true), null, 'down: no marker');
  // it goes away once the ball has landed
  until(w, 'ball', () => [NO_KEYS, NO_KEYS]);
  for (let i = 0; i < 300 && w.landing; i++) stepWorld(w, NO_KEYS, NO_KEYS);
  assert.equal(w.landing, null);
});

test('a whole match to 5: the result, then HARD starts a rematch at 0-0', () => {
  const w = makeWorld({ target: 5, seed: 11 });
  const s = w.match.server;
  for (let point = 0; point < 5; point++) {
    assert.equal(w.phase, 'serve');
    stepWorld(w, ...serveNow(w));
    until(w, 'rally');
    run(w, FREEZE - 1);
    const end = run(w, 1);
    if (point < 4) assert.deepEqual(end, [{ type: 'newRally', server: s }]);
    else assert.deepEqual(end, [{ type: 'match', winner: s, scores: s === 0 ? [5, 0] : [0, 5] }]);
  }
  assert.equal(w.phase, 'over');
  run(w, 100, () => [keys('soft'), keys('soft')]);
  assert.equal(w.phase, 'over', 'SOFT does nothing');
  const re = stepWorld(w, NO_KEYS, keys('hard'));
  assert.equal(re[0].type, 'rematch');
  assert.equal(w.phase, 'serve');
  assert.deepEqual(w.match.scores, [0, 0]);
  assert.equal(w.match.winner, null);
});
