// Rally rules: scripted balls fired through the real physics (node:test, run by npm test).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FP, makeBall, difficultyParams, classifyContact, SERVE } from '../public/hogg-squash/js/squash-physics.js';
import { LINES, frontWallVerdict, sideWallVerdict, sideOutHeight, serviceBox } from '../public/hogg-squash/js/sim/court-rules.js';
import { makeRally, canStrike, rallyStrike, stepBall } from '../public/hogg-squash/js/sim/rally.js';
import { makePlayer, stepPlayer } from '../public/hogg-squash/js/sim/player.js';

const p = { ...difficultyParams(0), latMult: 17 };
const NO_KEYS = { up: false, down: false, left: false, right: false, hard: false, soft: false };

/** Fire a ball struck by `striker` and step until the rally ends. Returns the result and the physics events seen. */
function fire(b, striker = 0, maxFrames = 600) {
  const ball = makeBall(b), r = makeRally(striker);
  assert.ok(rallyStrike(r, striker, ball));
  const events = [];
  for (let i = 0; i < maxFrames && !r.result; i++) {
    const at = { y: ball.y / FP, z: ball.z / FP };
    const { ev } = stepBall(r, ball, p);
    if (ev) events.push({ ev, ...at });
  }
  return { r, ball, events };
}

/** The arcade serve from the right-hand box. */
const serve = () => ({ x: 108 * FP, y: 30 * FP, z: 118 * FP, vx: SERVE.vx, vy: SERVE.vy[0], vz: SERVE.vz });

test('front-wall verdicts at the lines', () => {
  assert.equal(frontWallVerdict(0), 'tin');
  assert.equal(frontWallVerdict(LINES.TIN), 'tin');
  assert.equal(frontWallVerdict(LINES.TIN + 0.01), 'good');
  assert.equal(frontWallVerdict(100), 'good');
  assert.equal(frontWallVerdict(LINES.FRONT_OUT - 0.01), 'good');
  assert.equal(frontWallVerdict(LINES.FRONT_OUT), 'out');
});

test('side-wall out-line slopes from the front-wall out-line to the back glass', () => {
  assert.equal(sideOutHeight(0), LINES.FRONT_OUT);
  assert.equal(sideOutHeight(LINES.BACK), LINES.BACK_OUT);
  assert.equal(sideWallVerdict(150, 10), 'good');
  assert.equal(sideWallVerdict(150, 100), 'out');
  assert.equal(sideWallVerdict(74, LINES.BACK), 'good');
  assert.equal(sideWallVerdict(75, LINES.BACK), 'out');
});

test('service boxes: right is +x, both between the short line and the box line', () => {
  assert.deepEqual(serviceBox('right'), { xMin: 72, xMax: 144, zMin: 103, zMax: 133 });
  assert.deepEqual(serviceBox('left'), { xMin: -144, xMax: -72, zMin: 103, zMax: 133 });
});

test('tin: a low ball hits the front wall below the tin and the striker loses', () => {
  const { r, events } = fire({ x: 0, y: 12 * FP, z: 60 * FP, vz: -6 * FP }, 0);
  assert.equal(events[0].ev, 'frontWall');
  assert.ok(events[0].y <= LINES.TIN, `hit the wall at ${events[0].y}`);
  assert.deepEqual(r.result, { winner: 1, reason: 'tin' });
});

test('out: a ball above the front-wall out-line loses for the striker', () => {
  const { r, events } = fire({ x: 0, y: 60 * FP, z: 100 * FP, vz: -8 * FP, vy: 9 * FP }, 1);
  assert.equal(events[0].ev, 'frontWall');
  assert.ok(events[0].y >= LINES.FRONT_OUT, `hit the wall at ${events[0].y}`);
  assert.deepEqual(r.result, { winner: 0, reason: 'out' });
});

test('out: a ball above the side-wall out-line loses for the striker', () => {
  const { r, events } = fire({ x: 100 * FP, y: 130 * FP, z: 60 * FP, vx: 8 * FP, vy: 4 * FP, vz: -2 * FP }, 0);
  assert.equal(events[0].ev, 'sideWall');
  assert.equal(events.length, 1);
  assert.deepEqual(r.result, { winner: 1, reason: 'out' });
});

test('a side wall below the line on the way to the front wall is allowed', () => {
  const { r, events } = fire({ x: 100 * FP, y: 30 * FP, z: 100 * FP, vx: 6 * FP, vy: 2 * FP, vz: -8 * FP }, 0);
  assert.deepEqual(events.slice(0, 2).map(e => e.ev), ['sideWall', 'frontWall']);
  assert.deepEqual(r.result, { winner: 0, reason: 'notUp' });
});

test('out: a ball over the back glass loses for the striker', () => {
  const { r, events } = fire({ x: 0, y: 70 * FP, z: 150 * FP, vz: 6 * FP, vy: 3 * FP }, 0);
  assert.equal(events.length, 0);
  assert.deepEqual(r.result, { winner: 1, reason: 'out' });
});

test('the back glass on the way is allowed, but the floor before the front wall is down', () => {
  const { r, events } = fire({ x: 0, y: 30 * FP, z: 150 * FP, vz: 6 * FP, vy: 1 * FP }, 0);
  assert.deepEqual(events.map(e => e.ev), ['backGlass', 'floor']);
  assert.deepEqual(r.result, { winner: 1, reason: 'down' });
});

test('down: the floor before the front wall loses for the striker', () => {
  const { r, events } = fire({ x: 0, y: 20 * FP, z: 100 * FP, vz: -1 * FP }, 1);
  assert.deepEqual(events.map(e => e.ev), ['floor']);
  assert.deepEqual(r.result, { winner: 0, reason: 'down' });
});

test('double bounce: an unreturned serve is not up for the receiver', () => {
  const { r, events } = fire(serve(), 0);
  const front = events.find(e => e.ev === 'frontWall');
  assert.ok(front && frontWallVerdict(front.y) === 'good', 'the serve reaches the front wall');
  assert.equal(events.filter(e => e.ev === 'floor').length, 2);
  assert.deepEqual(r.result, { winner: 0, reason: 'notUp' });
});

test('turns: nobody strikes before the front wall, then only the receiver', () => {
  const ball = makeBall(serve()), r = makeRally(0);
  assert.equal(canStrike(r, 1), false, 'the receiver cannot take the serve');
  assert.ok(rallyStrike(r, 0, ball));
  assert.equal(rallyStrike(r, 0, ball), false, 'the striker cannot strike twice');
  assert.equal(rallyStrike(r, 1, ball), false, 'the receiver must wait for the front wall');
  let ev = null;
  while (ev !== 'frontWall') ev = stepBall(r, ball, p).ev;
  assert.equal(canStrike(r, 0), false, 'still not the striker');
  assert.equal(canStrike(r, 1), true, "the receiver's turn after a good front-wall hit");
});

test('a strike resets the bounce count', () => {
  const ball = makeBall(serve()), r = makeRally(0);
  rallyStrike(r, 0, ball);
  let floors = 0;
  while (floors < 1) if (stepBall(r, ball, p).ev === 'floor') floors++;
  assert.equal(ball.bounces, 1);
  assert.equal(r.bounces, 1);
  assert.ok(rallyStrike(r, 1, ball));
  assert.equal(ball.bounces, 0);
  assert.equal(r.bounces, 0);
});

test('good return: the receiver hits the serve back after one bounce with the real swing', () => {
  const ball = makeBall(serve()), r = makeRally(0);
  rallyStrike(r, 0, ball);
  // let the serve bounce once and come back off the glass, then stand where the ball will be 7 frames on
  let floors = 0, glass = false;
  while (!(floors === 1 && glass)) {
    const { ev } = stepBall(r, ball, p);
    if (ev === 'floor') floors++;
    if (ev === 'backGlass') glass = true;
  }
  for (let i = 0; i < 4; i++) stepBall(r, ball, p);
  const ghost = classifyContact(ball, { x: 0, z: 0 }, p).ghost;
  const pl = makePlayer(Math.round(ghost.x / FP), Math.round(ghost.z / FP));
  let frame = 0, hit = null, front = null;
  for (let i = 0; i < 300 && !r.result; i++, frame++) {
    const e = stepPlayer(pl, { ...NO_KEYS, hard: i === 0 }, ball, p, frame);
    if (i === 0) assert.equal(e?.reach, true, 'the swing is in reach');
    if (e?.type === 'hit') { hit = e; assert.ok(rallyStrike(r, 1, ball)); }
    const at = ball.y / FP;
    const { ev } = stepBall(r, ball, p);
    if (hit && ev === 'frontWall' && !front) front = at;
  }
  assert.ok(hit, 'the swing made contact');
  assert.ok(front !== null && frontWallVerdict(front) === 'good', `the return hit the front wall at ${front}`);
  // nobody takes the return, so the server is not up
  assert.deepEqual(r.result, { winner: 1, reason: 'notUp' });
});
