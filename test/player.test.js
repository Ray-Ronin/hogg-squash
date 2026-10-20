// The swing state machine: contact timing, misses, dives, overheads and the movement lock (node:test, run by npm test).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FP, makeBall, step, applyShot, shotEntry, SHOT_TABLES, aimFromTiming } from '../public/hogg-squash/js/squash-physics.js';
import { makePlayer, stepPlayer, swingPhase, swingLength, SWING, DIVE, PLAYER_LIMITS } from '../public/hogg-squash/js/sim/player.js';
import { defaultParams } from '../public/hogg-squash/js/sim/world.js';

const P = defaultParams();
const NO_KEYS = Object.freeze({ up: false, down: false, left: false, right: false, hard: false, soft: false });
const keys = (...names) => ({ ...NO_KEYS, ...Object.fromEntries(names.map(n => [n, true])) });
const MY_TURN = { isP1: true, turnIsP1: true, mayStrike: true };

/**
 * A ball drifting slowly back through mid-court at height y, dx units to the side of a player standing at x 0, z 130.
 * With vx 0 it stays dx to the side, so the press's 7-frame look-ahead sees it there.
 */
function setup(dx, y = 12) {
  const pl = makePlayer(0, 130);
  const ball = makeBall({ x: dx * FP, y: y * FP, z: 120 * FP, vz: 1.2 * FP });
  return { pl, ball };
}

/** Run frames: the player, then the ball, as the world does. Returns each frame's event (or null). */
function run(pl, ball, frames, act = () => NO_KEYS, turn = MY_TURN, frame0 = 0) {
  const out = [];
  for (let i = 0; i < frames; i++) {
    out.push(stepPlayer(pl, act(i), ball, P, frame0 + i, turn));
    step(ball, P);
  }
  return out;
}

test('a swing: contact exactly 7 frames after the press, with the table shot; ready again 18 frames after it', () => {
  assert.equal(SWING.CONTACT, 7);
  const { pl, ball } = setup(30);
  const [press] = run(pl, ball, 1, () => keys('hard'));
  assert.deepEqual([press.type, press.kind, press.reach, press.zone, press.index], ['swing', 'swing', true, 'MID', 0]);
  assert.equal(swingPhase(pl), 'windup');
  for (let t = 1; t < SWING.CONTACT; t++) {
    assert.equal(run(pl, ball, 1, () => keys('hard'), MY_TURN, t)[0], null, `nothing on frame ${t} (presses ignored)`);
  }
  // the contact frame: the shot is the table's, at the ball's position then
  const expect = applyShot(makeBall({ ...ball }), shotEntry(SHOT_TABLES.MID.hard[0]), aimFromTiming(ball.z, pl.z),
    { z: pl.z, flags1b: press.flags }, SWING.CONTACT, P);
  const [hit] = run(pl, ball, 1, () => NO_KEYS, MY_TURN, SWING.CONTACT);
  assert.equal(hit?.type, 'hit');
  assert.deepEqual([hit.ball.vx, hit.ball.vy, hit.ball.vz], [expect.vx, expect.vy, expect.vz]);
  assert.ok(hit.ball.vz < 0, 'toward the front wall');
  assert.equal(swingPhase(pl), 'recovery');
  // recovery, then ready on frame 18
  const rest = run(pl, ball, SWING.RECOVERY - 1, () => NO_KEYS, MY_TURN, SWING.CONTACT + 1);
  assert.ok(rest.every(e => e === null));
  assert.equal(swingLength('swing'), 18);
  assert.equal(pl.swing, null);
  assert.equal(swingPhase(pl), 'ready');
  // and the next press swings again
  assert.equal(run(pl, ball, 1, () => keys('soft'))[0]?.type, 'swing');
});

test('no movement while swinging: planted from the press until the swing ends, then full speed', () => {
  const { pl, ball } = setup(30);
  const x0 = pl.x, z0 = pl.z;
  run(pl, ball, swingLength('swing'), i => (i === 0 ? keys('hard', 'left', 'up') : keys('left', 'up')));
  assert.equal(pl.swing, null);
  assert.deepEqual([pl.x, pl.z], [x0, z0], 'not moved during the 18 frames');
  run(pl, ball, 1, () => keys('left', 'up'));
  assert.deepEqual([(x0 - pl.x) / FP, (z0 - pl.z) / FP], [2.5, 1.25], 'running again at full speed');
});

test('out of reach is a miss: the swing plays, the ball is untouched', () => {
  const { pl, ball } = setup(110);
  const [press] = run(pl, ball, 1, () => keys('hard'));
  assert.equal(press.reach, false);
  assert.ok(press.flags & 0x20, 'the classifier says out of reach');
  assert.equal(press.kind, 'swing', 'a miss is never a dive');
  const shadow = makeBall({ ...ball });
  const events = run(pl, ball, swingLength('swing') - 1, () => keys('hard'), MY_TURN, 1);
  assert.ok(events.every(e => e === null), 'no hit, and presses during the swing are ignored');
  for (let i = 0; i < swingLength('swing') - 1; i++) step(shadow, P);
  assert.deepEqual(ball, shadow, 'the ball flew on as if nobody swung');
  assert.equal(pl.swing, null, 'the miss takes as long as a swing');
});

test('not your ball is a miss, even in reach', () => {
  const { pl, ball } = setup(30);
  const [press] = run(pl, ball, 1, () => keys('hard'), { isP1: true, turnIsP1: true, mayStrike: false });
  assert.equal(press.reach, false);
  assert.ok(run(pl, ball, SWING.CONTACT, () => NO_KEYS, MY_TURN, 1).every(e => e === null));
});

test('a stretch (flag 2) is an ordinary swing, not a dive', () => {
  const { pl, ball } = setup(60);
  const [press] = run(pl, ball, 1, () => keys('hard'));
  assert.ok(press.flags & 2);
  assert.deepEqual([press.kind, press.index, press.reach], ['swing', 2, true]);
});

for (const [dx, index, hand] of [[-54, 11, 'back'], [86, 10, 'fore']]) {
  test(`a dive: the special band (ball ${dx} units to the side) dives, hits contact type ${index}, then lies still`, () => {
    const { pl, ball } = setup(dx);
    const x0 = pl.x, z0 = pl.z;
    const [press] = run(pl, ball, 1, () => keys('soft', 'left'));
    assert.ok(press.flags & 0x10, 'special flag');
    assert.deepEqual([press.kind, press.index, press.reach], ['dive', index, true]);
    assert.equal(pl.swing?.hand, hand);
    assert.equal(swingPhase(pl), 'dive');
    const events = run(pl, ball, swingLength('dive') - 1, () => keys('hard', 'left', 'down'), MY_TURN, 1);
    const hits = events.map((e, i) => (e ? [i + 1, e.type] : null)).filter(Boolean);
    assert.deepEqual(hits, [[DIVE.CONTACT, 'hit']], 'one hit, 7 frames after the press; presses ignored');
    assert.equal(events[DIVE.CONTACT - 1].index, index);
    assert.deepEqual([pl.x, pl.z], [x0, z0], `locked in place for all ${swingLength('dive')} frames`);
    assert.equal(swingLength('dive'), 115);
    assert.equal(pl.swing, null, 'up again');
    run(pl, ball, 1, () => keys('left'));
    assert.equal((x0 - pl.x) / FP, 2.5, 'and running');
  });
}

test('the dive band is only a dive on your turn', () => {
  const { pl, ball } = setup(-54);
  const [press] = run(pl, ball, 1, () => keys('hard'), { isP1: true, turnIsP1: false, mayStrike: false });
  assert.equal(press.flags & 0x10, 0, 'no special flag on the other player\'s turn');
  assert.deepEqual([press.kind, press.reach], ['swing', false]);
});

test('overheads: a ball above 48 units at contact uses contact types 8–9 and the overhead shot', () => {
  for (const [dx, index] of [[30, 8], [-10, 9]]) {
    const { pl, ball } = setup(dx, 60);
    const [press] = run(pl, ball, 1, () => keys('hard'));
    assert.ok(press.flags & 8, 'overhead flag');
    assert.deepEqual([press.kind, press.index, press.reach], ['swing', index, true]);
    const hit = run(pl, ball, SWING.CONTACT, () => NO_KEYS, MY_TURN, 1)[SWING.CONTACT - 1];
    assert.equal(hit?.index, index);
    const e = shotEntry(SHOT_TABLES[hit.zone].hard[index]);
    assert.equal(e.power, 0xc0 - (index - 8) * 0x10, 'the mid-court overhead: power 192 / 176');
  }
});

test('court limits: the feet stay inside PLAYER_LIMITS', () => {
  const pl = makePlayer(0, 100), ball = makeBall();
  run(pl, ball, 200, () => keys('left', 'up'));
  assert.deepEqual([pl.x / FP, pl.z / FP], [PLAYER_LIMITS.xMin, PLAYER_LIMITS.zMin]);
  run(pl, ball, 200, () => keys('right', 'down'));
  assert.deepEqual([pl.x / FP, pl.z / FP], [PLAYER_LIMITS.xMax, PLAYER_LIMITS.zMax]);
});
