// The swing state machine: contact timing, misses, dives, overheads, the movement lock and the front-court drop (node:test,
// run by npm test).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FP, makeBall, step, applyShot, shotEntry, SHOT_TABLES, aimFromTiming } from '../public/hogg-squash/js/squash-physics.js';
import { makePlayer, stepPlayer, swingPhase, swingLength, shotFor, SWING, DIVE, DROP, PLAYER_LIMITS, REACH_TOP, CRAMP, crampedAim, toReach } from '../public/hogg-squash/js/sim/player.js';
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

// the default reach is S12c's (HUMAN_REACH): forehand stretch 39–57 units, dive to 77; backhand dive 52–72
test('a stretch (flag 2) is an ordinary swing, not a dive', () => {
  const { pl, ball } = setup(50);
  const [press] = run(pl, ball, 1, () => keys('hard'));
  assert.ok(press.flags & 2);
  assert.deepEqual([press.kind, press.index, press.reach], ['swing', 2, true]);
});

for (const [dx, index, hand] of [[-58, 11, 'back'], [70, 10, 'fore']]) {
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

test('SOFT from the front court plays a capped drop (CP-C); HARD, other zones and overheads play the arcade\'s entry', () => {
  for (const zone of ['FRONT', 'MID', 'BACK']) for (const button of ['hard', 'soft']) for (let i = 0; i < 12; i++) {
    const arcade = shotEntry(SHOT_TABLES[zone][button][i]), e = shotFor(zone, button, i);
    if (zone === 'FRONT' && button === 'soft' && i !== 8 && i !== 9) {
      assert.deepEqual(e, { lift: Math.min(arcade.lift, DROP.LIFT_MAX), side: arcade.side, power: Math.min(arcade.power, DROP.POWER_MAX) });
      assert.ok(e.power < arcade.power, `FRONT soft #${i} is slower than the arcade's`);
    } else assert.deepEqual(e, arcade, `${zone} ${button} #${i} as the arcade`);
  }
  // in play: a swing at a ball in the front court plays shotFor's entry
  for (const button of ['hard', 'soft']) {
    const pl = makePlayer(0, 50), ball = makeBall({ x: 30 * FP, y: 12 * FP, z: 40 * FP, vz: 1.2 * FP });
    const [press] = run(pl, ball, 1, () => keys(button));
    assert.equal(press.zone, 'FRONT');
    run(pl, ball, SWING.CONTACT - 1, () => NO_KEYS, MY_TURN, 1);
    const expect = applyShot(makeBall({ ...ball }), shotFor('FRONT', button, press.index), aimFromTiming(ball.z, pl.z),
      { z: pl.z, flags1b: press.flags }, SWING.CONTACT, P);
    const [hit] = run(pl, ball, 1, () => NO_KEYS, MY_TURN, SWING.CONTACT);
    assert.deepEqual([hit.ball.vx, hit.ball.vy, hit.ball.vz], [expect.vx, expect.vy, expect.vz], button);
  }
});

test('a CPU\'s reach is smaller by params.cpuReach: a ball a human hits clean is a stretch for it, and so on outwards', () => {
  const press = (dx, cpu, reach) => {
    const { pl, ball } = setup(dx);
    if (cpu) pl.flags1b = 0x40;
    return stepPlayer(pl, keys('hard'), ball, { ...P, cpuReach: reach, humanReach: 1 }, 0, MY_TURN);   // the arcade's size
  };
  // the forehand bands for a human: clean below 52, stretch to 76, dive to 96, then out of reach
  const band = e => (!e.reach ? 'out' : e.kind === 'dive' ? 'dive' : e.flags & 2 ? 'stretch' : 'clean');
  for (const [dx, human, cpu95] of [[30, 'clean', 'clean'], [50, 'clean', 'stretch'], [74, 'stretch', 'dive'], [93, 'dive', 'out']]) {
    assert.equal(band(press(dx, false, 0.95)), human, `human at ${dx}`);
    assert.equal(band(press(dx, true, 1)), human, `CPU with full reach at ${dx}`);
    assert.equal(band(press(dx, true, 0.95)), cpu95, `CPU at 95% reach at ${dx}`);
  }
  // the shot table zone is the real one
  assert.equal(press(50, true, 0.95).zone, press(50, false, 1).zone);
});

test('S12b: a human\'s reach can be smaller too (params.humanReach), the same way; missing or 1 is the arcade\'s', () => {
  const press = (/** @type {number} */ dx, /** @type {number | undefined} */ reach) => {
    const { pl, ball } = setup(dx);
    return stepPlayer(pl, keys('hard'), ball, { ...P, humanReach: reach }, 0, MY_TURN);
  };
  const band = (/** @type {any} */ e) => (!e.reach ? 'out' : e.kind === 'dive' ? 'dive' : e.flags & 2 ? 'stretch' : 'clean');
  for (const [dx, full, at95] of [[30, 'clean', 'clean'], [50, 'clean', 'stretch'], [74, 'stretch', 'dive'], [93, 'dive', 'out']]) {
    assert.equal(band(press(dx, undefined)), full, `no humanReach at ${dx}`);
    assert.equal(band(press(dx, 1)), full, `humanReach 1 at ${dx}`);
    assert.equal(band(press(dx, 0.95)), at95, `humanReach 0.95 at ${dx}`);
  }
});

test('S12b: nobody reaches a ball above REACH_TOP (2.4 m); just under it is an overhead as before', () => {
  assert.equal(REACH_TOP, 84);
  const still = { ...P, speed: 0 };                                  // the ball stays where it is for the look-ahead
  const press = (/** @type {number} */ y, /** @type {boolean} */ cpu) => {
    const pl = makePlayer(0, 100);
    if (cpu) pl.flags1b = 0x40;
    return stepPlayer(pl, keys('hard'), makeBall({ x: 30 * FP, y: y * FP, z: 100 * FP }), still, 0, MY_TURN);
  };
  for (const cpu of [false, true]) {
    const under = press(REACH_TOP, cpu), over = press(REACH_TOP + 1, cpu);
    assert.ok(under?.type === 'swing' && under.reach && (under.flags & 8), `${cpu ? 'CPU' : 'human'}: an overhead at the top`);
    assert.ok(over?.type === 'swing' && !over.reach, `${cpu ? 'CPU' : 'human'}: a miss just above it`);
  }
});

test('S12b: a CPU\'s reach is its share of the human\'s, so it shrinks with a smaller humanReach', () => {
  const press = (/** @type {number} */ dx, /** @type {boolean} */ cpu, /** @type {number} */ human, /** @type {number} */ share) => {
    const { pl, ball } = setup(dx);
    if (cpu) pl.flags1b = 0x40;
    return stepPlayer(pl, keys('hard'), ball, { ...P, humanReach: human, cpuReach: share }, 0, MY_TURN);
  };
  const band = (/** @type {any} */ e) => (!e.reach ? 'out' : e.kind === 'dive' ? 'dive' : e.flags & 2 ? 'stretch' : 'clean');
  // 0.95 × 1 and 1 × 0.95 shrink the same; a CPU at 0.95 of a 0.95 human is at 0.9025
  for (const dx of [30, 50, 74, 93]) {
    assert.equal(band(press(dx, true, 0.95, 1)), band(press(dx, false, 0.95, 1)), `CPU with full share = human at ${dx}`);
    assert.equal(band(press(dx, true, 1, 0.95)), band(press(dx, false, 0.95, 1)), `CPU 0.95 = human 0.95 at ${dx}`);
  }
  assert.equal(band(press(88, false, 0.95, 1)), 'dive', 'a 0.95 human still dives at 88');
  assert.equal(band(press(88, true, 0.95, 0.95)), 'out', '…a CPU at 0.95 of that can\'t');
});

test('S12c: toReach: one share is every direction (S12b), nothing is the arcade\'s, a Reach is kept', () => {
  assert.deepEqual(toReach(0.9), { front: 0.9, behind: 0.9, fore: 0.9, back: 0.9 });
  assert.deepEqual(toReach(undefined), { front: 1, behind: 1, fore: 1, back: 1 });
  const r = { front: 0.9, behind: 0.75, fore: 0.8, back: 1 };
  assert.equal(toReach(r), r);
});

test('S12c: each direction\'s bands change by its own share', () => {
  const still = { ...P, speed: 0 };                                  // the ball stays where it is for the look-ahead
  const press = (/** @type {number} */ dx, /** @type {number} */ dz, /** @type {any} */ reach, cpu = false) => {
    const pl = makePlayer(0, 100);
    if (cpu) pl.flags1b = 0x40;
    const ball = makeBall({ x: dx * FP, y: 20 * FP, z: (100 + dz) * FP });
    return /** @type {any} */ (stepPlayer(pl, keys('hard'), ball, { ...still, humanReach: reach, cpuReach: 1 }, 0, MY_TURN));
  };
  const band = (/** @type {any} */ e) => (!e.reach ? 'out' : e.kind === 'dive' ? 'dive' : e.flags & 2 ? 'stretch' : 'clean');
  const all = (/** @type {any} */ o) => ({ front: 1, behind: 1, fore: 1, back: 1, ...o });
  // forehand (clean below 52, dive to 96 at the arcade's size): a shorter forehand
  assert.equal(band(press(45, 0, all({}))), 'clean');
  assert.equal(band(press(45, 0, all({ fore: 0.8 }))), 'stretch');
  assert.equal(band(press(80, 0, all({}))), 'dive');
  assert.equal(band(press(80, 0, all({ fore: 0.8 }))), 'out');
  assert.equal(band(press(80, 0, all({ back: 0.5, front: 0.5, behind: 0.5 }))), 'dive', 'the other shares leave the forehand alone');
  // backhand (out beyond 64): a wider one reaches further
  assert.equal(band(press(-68, 0, all({}))), 'out');
  assert.equal(band(press(-68, 0, all({ back: 1.1 }))), 'dive');
  assert.equal(band(press(-68, 0, all({ fore: 1.2 }))), 'out', 'the forehand share leaves the backhand alone');
  // a ball on the backhand side stays a backhand, however small the share
  assert.ok(press(19, 0, all({})).flags & 4, 'a backhand at the arcade\'s size');
  assert.ok(press(19, 0, all({ back: 0.5 })).flags & 4, 'still a backhand at 50%');
  assert.ok(!(press(20, 0, all({ fore: 1.25 })).flags & 4), 'and a forehand stays a forehand');
  // depth (out at 40 in front or behind): less reach behind only
  assert.equal(band(press(30, 35, all({}))), 'clean');
  assert.equal(band(press(30, 35, all({ behind: 0.8 }))), 'out');
  assert.equal(band(press(30, -35, all({ behind: 0.8 }))), 'clean', 'in front is the front share');
  assert.equal(band(press(30, -35, all({ front: 0.8 }))), 'out');
  // a CPU's is cpuReach of each
  const cpu = (/** @type {number} */ dx, /** @type {number} */ k) => {
    const pl = makePlayer(0, 100);
    pl.flags1b = 0x40;
    const ball = makeBall({ x: dx * FP, y: 20 * FP, z: 100 * FP });
    return stepPlayer(pl, keys('hard'), ball, { ...still, humanReach: all({ fore: 0.8 }), cpuReach: k }, 0, MY_TURN);
  };
  assert.equal(band(cpu(75, 1)), 'dive');
  assert.equal(band(cpu(75, 0.95)), 'out', '75 is beyond 0.95 × 0.8 of 96');
});

test('S12c: an even backhand has the forehand\'s stretch and dive widths, the same outer edge, and clean inside', () => {
  const still = { ...P, speed: 0 };
  const press = (/** @type {number} */ dx, /** @type {any} */ reach) => {
    const pl = makePlayer(0, 100);
    const ball = makeBall({ x: dx * FP, y: 20 * FP, z: 100 * FP });
    return /** @type {any} */ (stepPlayer(pl, keys('hard'), ball, { ...still, humanReach: reach }, 0, MY_TURN));
  };
  const band = (/** @type {any} */ e) => (!e.reach ? 'out' : e.kind === 'dive' ? 'dive' : e.flags & 2 ? 'stretch' : 'clean');
  const edges = (/** @type {any} */ reach, /** @type {number} */ sign) => {
    const out = /** @type {Record<string, number>} */ ({});
    for (let a = 1; a < 120; a++) out[band(press(sign * a, reach))] = a;
    return out;                                                      // the furthest distance of each band
  };
  const D = { front: 0.9, behind: 0.7, fore: 0.75, back: 1.05 };
  const fore = edges(D, 1), plain = edges(D, -1), even = edges({ ...D, even: true }, -1);
  const width = (/** @type {Record<string, number>} */ e) => [e.stretch - e.clean, e.dive - e.stretch];
  assert.equal(even.dive, plain.dive, 'the outer edge is the backhand share\'s');
  for (const [i, w] of width(even).entries()) assert.ok(Math.abs(w - width(fore)[i]) <= 1, `band ${i}: ${w} vs the forehand's ${width(fore)[i]}`);
  assert.ok(even.clean > plain.clean + 5, 'the rest is a clean hit');
  assert.ok(press(19, { ...D, even: true }).flags & 4, 'the split doesn\'t move');
});

test('S12c: an oval reach keeps the four outer edges but not the corners', () => {
  const still = { ...P, speed: 0 };
  const press = (/** @type {number} */ dx, /** @type {number} */ dz, /** @type {any} */ reach) => {
    const pl = makePlayer(0, 100);
    const ball = makeBall({ x: dx * FP, y: 20 * FP, z: (100 + dz) * FP });
    return /** @type {any} */ (stepPlayer(pl, keys('hard'), ball, { ...still, humanReach: reach }, 0, MY_TURN));
  };
  const R = { front: 0.9, behind: 0.7, fore: 0.75, back: 1.05, even: true };
  const O = { ...R, oval: true };
  // on the axes, as far as the rectangle reaches (forehand 72, backhand 67, in front 36, behind 28 units)
  for (const [dx, dz] of [[70, 0], [-66, 0], [5, -35], [5, 27], [-5, 27], [5, -37], [5, 29]]) {
    assert.equal(press(dx, dz, O).reach, press(dx, dz, R).reach, `the same at ${dx}, ${dz}`);
  }
  assert.ok(press(70, 0, O).reach && press(-66, 0, O).reach, 'the side edges are kept');
  // the corners: in the rectangle, out of the oval
  for (const [dx, dz] of [[65, -30], [65, 24], [-60, -30], [-60, 24]]) {
    assert.ok(press(dx, dz, R).reach, `the rectangle reaches ${dx}, ${dz}`);
    assert.ok(!press(dx, dz, O).reach, `the oval doesn't reach ${dx}, ${dz}`);
  }
  // halfway out on both axes is still in
  assert.ok(press(36, -18, O).reach && press(-33, 14, O).reach);
});

test('S12c: `dive` widens only the dive band, outwards on both sides, and the oval with it', () => {
  const still = { ...P, speed: 0 };
  const press = (/** @type {number} */ dx, /** @type {any} */ reach) => {
    const pl = makePlayer(0, 100);
    const ball = makeBall({ x: dx * FP, y: 20 * FP, z: 100 * FP });
    return /** @type {any} */ (stepPlayer(pl, keys('hard'), ball, { ...still, humanReach: reach }, 0, MY_TURN));
  };
  const band = (/** @type {any} */ e) => (!e.reach ? 'out' : e.kind === 'dive' ? 'dive' : e.flags & 2 ? 'stretch' : 'clean');
  const edges = (/** @type {any} */ reach, /** @type {number} */ sign) => {
    const out = /** @type {Record<string, number>} */ ({});
    for (let a = 1; a < 120; a++) out[band(press(sign * a, reach))] = a;
    return out;
  };
  const R = { front: 0.9, behind: 0.7, fore: 0.75, back: 1.05, even: true, oval: true };
  for (const sign of [1, -1]) {
    const before = edges(R, sign), after = edges({ ...R, dive: 0.1 }, sign);
    assert.equal(after.clean, before.clean, `${sign}: clean unchanged`);
    assert.equal(after.stretch, before.stretch, `${sign}: stretch unchanged`);
    assert.ok(Math.abs(after.dive - before.dive - 4.5) <= 1, `${sign}: the dive reaches 0.1 m (4.5 units) further: ${before.dive} → ${after.dive}`);
  }
});

test('S12b: a ball met within CRAMP.WIDTH of the body is still hit, but slower, with its aim moved by up to ±WOBBLE', () => {
  const hit = (/** @type {number} */ dx) => {
    const { pl, ball } = setup(dx);
    const evs = run(pl, ball, SWING.CONTACT + 1, i => (i === 0 ? keys('hard') : NO_KEYS));
    return { press: evs[0], hit: evs.find(e => e?.type === 'hit') };
  };
  const body = hit(4), side = hit(30);
  assert.equal(body.press?.cramped, true, 'through the body: cramped');
  assert.equal(side.press?.cramped, false, '0.7 m to the side: a full swing');
  assert.ok(body.hit && side.hit, 'both are hit');
  assert.equal(body.hit.cramped, true);
  // the same contact with the cramp off: the cramped one has CRAMP.POWER of its depth pace, the same height speed
  const width = CRAMP.WIDTH;
  CRAMP.WIDTH = -1;
  let full;
  try { full = hit(4); } finally { CRAMP.WIDTH = width; }
  const ratio = body.hit.ball.vz / full.hit.ball.vz;
  assert.ok(Math.abs(ratio - CRAMP.POWER) < 0.06, `depth pace × ${ratio.toFixed(2)}`);
  assert.ok(Math.abs(body.hit.ball.vy - full.hit.ball.vy) <= Math.abs(full.hit.ball.vy) * 0.05, 'about the same height speed');
  const seen = new Set();
  for (let f = 0; f < 200; f++) {
    const a = crampedAim(4, f);
    assert.ok(Math.abs(a - 4) <= CRAMP.WOBBLE, 'within the wobble');
    seen.add(a);
  }
  assert.equal(seen.size, 2 * CRAMP.WOBBLE + 1, 'every wobble step happens');
  assert.equal(crampedAim(0, 3) >= 0 && crampedAim(7, 3) <= 7, true, 'kept 0–7');
});

test('S12b: a ball near the body at CRAMP.ABOVE (1.5 m) or higher is a normal shot: the player reaches up', () => {
  assert.equal(CRAMP.ABOVE, 53);
  const still = { ...P, speed: 0 };
  const press = (/** @type {number} */ y) => stepPlayer(makePlayer(0, 100), keys('hard'),
    makeBall({ x: 4 * FP, y: y * FP, z: 100 * FP }), still, 0, MY_TURN);
  assert.equal(press(CRAMP.ABOVE - 1)?.cramped, true, 'just under 1.5 m: cramped');
  assert.equal(press(CRAMP.ABOVE)?.cramped, false, 'at 1.5 m: normal');
  assert.equal(press(70)?.cramped, false, 'an overhead at 2 m: normal');
  assert.equal(press(70)?.reach, true, '…and still in reach');
});
