// The world: determinism, serving, turns, scoring through a whole match (node:test, run by npm test).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FP, makeBall, step, classifyContact, difficultyParams, SERVE } from '../public/hogg-squash/js/squash-physics.js';
import {
  makeWorld, stepWorld, landingSpot, TIMING, SERVE_SPOT, SERVE_AIM, SERVE_WINDUP, serveTarget, serveAim, serveFlight,
  serveIsGood,
} from '../public/hogg-squash/js/sim/world.js';
import { serviceBox, LINES } from '../public/hogg-squash/js/sim/court-rules.js';
import { makePlayer, PLAYER_LIMITS } from '../public/hogg-squash/js/sim/player.js';

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
const serveNow = (w, button = 'hard') => (w.match.server === 0 ? [keys(button), NO_KEYS] : [NO_KEYS, keys(button)]);

/** The server presses, and the serve's wind-up plays out to the launch (SERVE_WINDUP frames). Returns every event. */
function serve(w, button = 'hard') {
  return [...stepWorld(w, ...serveNow(w, button)), ...run(w, SERVE_WINDUP)];
}

/** Depth error allowed for an aimed serve: the first bounce falls on a whole frame (SERVE_AIM). */
const DEPTH_TOLERANCE = 4;

/**
 * Follow a serve to its first bounce with the world's own stepping. Returns the front-wall height and the bounce.
 * Fails if the rally ends first.
 */
function followServe(w) {
  let wallY = null, first = null;
  for (let i = 0; i < 200 && !first; i++) {
    const e = stepWorld(w, NO_KEYS, NO_KEYS);
    const fw = e.find(e => e.type === 'ball' && e.ev === 'frontWall');
    if (fw && wallY === null) wallY = fw.y;
    const f = e.find(e => e.type === 'ball' && e.ev === 'floor');
    if (f && wallY !== null) first = f;
    assert.ok(!e.some(e => e.type === 'ball' && e.ev === 'sideWall'), 'no side wall before the bounce');
    assert.ok(!e.some(e => e.type === 'rally'), 'the serve is still live at its first bounce');
  }
  assert.ok(first, 'the serve bounced');
  return { wallY, x: first.x, z: first.z };
}

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
  assert.equal(ballX, (box.xMin + SERVE_SPOT.BALL_DX + box.xMax) / 2, 'the held ball is in the middle of its reach');
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
  const served = serve(w);
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

test('the serve wind-up: the ball leaves SERVE_WINDUP (7) frames after the press; server and ball held until then', () => {
  assert.equal(SERVE_WINDUP, 7, "a rally swing's wind-up (SWING.CONTACT)");
  for (const seed of [1, 2]) {
    const w = makeWorld({ seed });
    const s = w.match.server, rcv = s === 0 ? 1 : 0;
    assert.deepEqual(stepWorld(w, ...serveNow(w, 'soft')), [{ type: 'serveSwing', side: s, button: 'soft' }]);
    const feet = { x: w.players[s].x, z: w.players[s].z }, ball = { ...w.ball }, rz = w.players[rcv].z;
    for (let t = 1; t < SERVE_WINDUP; t++) {
      // the server tries to run off and press HARD; the receiver runs up the court
      const mash = keys('left', 'up', 'hard');
      const ev = stepWorld(w, ...(s === 0 ? [mash, keys('up')] : [keys('up'), mash]));
      assert.deepEqual(ev, [], `frame ${t} after the press: nothing yet`);
      assert.equal(w.phase, 'serve');
      assert.deepEqual({ x: w.players[s].x, z: w.players[s].z }, feet, 'the server is locked');
      assert.deepEqual(w.ball, ball, 'the ball stays held');
    }
    assert.ok(w.players[rcv].z < rz, 'the receiver moves during the wind-up');
    const ev = stepWorld(w, NO_KEYS, NO_KEYS);
    assert.deepEqual(ev, [{ type: 'serve', side: s, button: 'soft' }], 'launched with the pressed button, not the mashed one');
    assert.equal(w.phase, 'rally');
    assert.equal(w.windup, null);
    assert.deepEqual(w.serveTarget, serveTarget(w.match.box, ball.x / FP, ball.z / FP, 'soft'), 'aimed from the held ball');
    assert.ok(w.landing, 'the landing marker is up');
  }
});

test('the serve crosses the court: from the start spot it first bounces mid-way across the opposite back quarter', () => {
  const w = makeWorld({ seed: 3 });
  for (const [box, across] of [['right', 'left'], ['left', 'right']]) {
    assert.equal(w.match.box, box);
    const target = serviceBox(across);
    serve(w);
    const mark = w.landing;
    assert.ok(mark, 'a landing marker');
    const mid = (SERVE_AIM.X_NEAR + SERVE_AIM.X_FAR) / 2 * (across === 'left' ? -1 : 1);
    assert.deepEqual(w.serveTarget, { x: mid, z: SERVE_AIM.Z_HARD }, 'aimed at the middle of the range, HARD depth');
    assert.ok(Math.abs(mark.x - mid) <= SERVE_AIM.X_TOLERANCE, `lands mid-way across the ${across} quarter (x ${mark.x})`);
    assert.ok(mark.z > target.zMax, `behind the box (z ${mark.z})`);
    // the plain physics agrees, and the serve is good (no tin, no out)
    const first = followServe(w);
    assert.deepEqual([first.x, first.z], [mark.x, mark.z]);
    until(w, 'rally');
    run(w, FREEZE);                                      // the unreturned serve wins; the server serves from the other box
  }
});

test('the aimed serve: the spot in the box picks the place across, HARD lands deeper than SOFT, every serve is legal', () => {
  const w = makeWorld({ seed: 3 });
  for (const box of ['right', 'left']) {
    assert.equal(w.match.box, box);
    const s = w.match.server, area = serviceBox(box);
    const xs = [Math.max(area.xMin, PLAYER_LIMITS.xMin), area.xMax - SERVE_SPOT.BALL_DX];   // the feet's reach
    /** @type {Record<string, { x: number, z: number }>} */
    const landed = {};
    for (const px of xs) for (const pz of [area.zMin, area.zMax]) for (const button of ['hard', 'soft']) {
      const saved = structuredClone(w);
      w.players[s].x = px * FP;
      w.players[s].z = pz * FP;
      serve(w, button);
      const t = w.serveTarget, mark = w.landing;
      const where = `${box} box, feet ${px},${pz}, ${button}`;
      assert.deepEqual(t, serveTarget(box, px + SERVE_SPOT.BALL_DX, pz, button), where);
      assert.ok(Math.abs(mark.x - t.x) <= SERVE_AIM.X_TOLERANCE, `${where}: x ${mark.x} for ${t.x}`);
      assert.ok(Math.abs(mark.z - t.z) <= DEPTH_TOLERANCE, `${where}: z ${mark.z} for ${t.z}`);
      const f = followServe(w);
      assert.deepEqual([f.x, f.z], [mark.x, mark.z], `${where}: the marker is where it bounces`);
      assert.ok(f.wallY > LINES.SERVICE && f.wallY < LINES.FRONT_OUT, `${where}: front wall at ${f.wallY}`);
      assert.ok(f.z > LINES.SHORT_Z && Math.sign(f.x) === (box === 'right' ? -1 : 1), `${where}: opposite back quarter`);
      landed[`${px},${pz},${button}`] = f;
      Object.assign(w, saved);
    }
    const [inner, outer] = box === 'right' ? xs : [xs[1], xs[0]];
    for (const pz of [area.zMin, area.zMax]) {
      for (const button of ['hard', 'soft']) {
        const a = landed[`${inner},${pz},${button}`], b = landed[`${outer},${pz},${button}`];
        assert.ok(Math.abs(a.x) < 40 && Math.abs(b.x) > 115, `inner → near the centre line (${a.x}), outer → near the wall (${b.x})`);
      }
      for (const px of xs) {
        const h = landed[`${px},${pz},hard`], sf = landed[`${px},${pz},soft`];
        assert.ok(h.z > sf.z + 15, `HARD deeper than SOFT (${h.z} vs ${sf.z})`);
      }
    }
    for (const px of xs) for (const button of ['hard', 'soft']) {
      assert.ok(landed[`${px},${area.zMax},${button}`].z > landed[`${px},${area.zMin},${button}`].z,
        'the back of the box serves deeper than the front');
    }
    serve(w);
    until(w, 'rally');
    run(w, FREEZE);
  }
});

test('the aimed serve holds at every arcade pace: on target and legal from anywhere in either box', () => {
  for (let idx = 0; idx < 20; idx++) {
    const d = difficultyParams(idx), p = { ...d, latMult: d.powerMult };
    for (const side of ['right', 'left']) {
      const reach = side === 'right' ? [90, 117, 144] : [-116, -94, -72];
      for (const bx of reach) for (const bz of [103, 118, 133]) for (const button of ['hard', 'soft']) {
        const where = `pace ${idx}, ${side} box, ball ${bx},${bz}, ${button}`;
        const t = serveTarget(side, bx, bz, button);
        const ball = makeBall({ x: bx * FP, y: SERVE_SPOT.BALL_Y * FP, z: bz * FP, vy: SERVE.vy[button === 'hard' ? 1 : 0] });
        const aim = serveAim(ball, p, t);
        assert.ok(aim, `${where}: solved`);
        const f = serveFlight({ ...ball, ...aim }, p);
        assert.ok(serveIsGood(f, t), `${where}: legal and on target across`);
        assert.ok(Math.abs(f.z - t.z) <= DEPTH_TOLERANCE, `${where}: z ${f.z} for ${t.z}`);
      }
    }
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
  serve(w);
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
  serve(w);
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
  serve(w);
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
    serve(w);
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
