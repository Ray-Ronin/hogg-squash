// The CPU opponent: determinism, valid rallies, movement, reaction, the planned press, recovery, serving and the
// modes (node:test, run by npm test).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FP, makeBall, applyShot, shotEntry, SHOT_TABLES } from '../public/hogg-squash/js/squash-physics.js';
import { makeWorld, stepWorld, serveTarget, serverArea, SERVE_SPOT, SERVE_WINDUP, CPU_FLAG } from '../public/hogg-squash/js/sim/world.js';
import { makePlayer, PLAYER_LIMITS, SWING } from '../public/hogg-squash/js/sim/player.js';
import { makeRally } from '../public/hogg-squash/js/sim/rally.js';
import { LINES } from '../public/hogg-squash/js/sim/court-rules.js';
import { CPU, makeCpu, cpuActions, planContact, runFrames } from '../public/hogg-squash/js/sim/cpu.js';
import { levelParams } from '../public/hogg-squash/js/sim/difficulty.js';

const NO_KEYS = Object.freeze({ up: false, down: false, left: false, right: false, hard: false, soft: false });
const REASONS = ['tin', 'out', 'down', 'notUp'];
/** A rally longer than this (frames, 5 minutes) counts as one that never ends. */
const STUCK = 300 * 57.4;

/** A CPU-against-CPU world and its two CPUs. */
function cpuMatch(seed, target = 11) {
  const w = makeWorld({ target, seed, cpu: [true, true] });
  return { w, cpus: [makeCpu(w, 0), makeCpu(w, 1)] };
}

/** One step with both CPUs. Returns the actions and the events. */
function stepCpus(w, cpus) {
  const acts = [cpuActions(cpus[0], w), cpuActions(cpus[1], w)];
  return { acts, events: stepWorld(w, acts[0], acts[1]) };
}

/** Play CPU against CPU over as many seeds as it takes to finish `rallies` rallies, checking every step. */
function playRallies(rallies) {
  const log = [], checks = { badReason: 0, nan: 0, outside: 0, jitter: 0, rallies: 0, longest: 0, hits: 0 };
  let seed = 0, live = 0;
  while (checks.rallies < rallies && checks.longest < STUCK) {
    const { w, cpus } = cpuMatch(seed++);
    const moves = [[], []];
    while (w.phase !== 'over' && checks.rallies < rallies && live < STUCK) {
      const { acts, events } = stepCpus(w, cpus);
      log.push(...events);
      for (const i of [0, 1]) {
        // jitter: a step one way, back, and the same way again
        const m = moves[i], a = acts[i];
        m.push([a.left ? -1 : a.right ? 1 : 0, a.up ? -1 : a.down ? 1 : 0]);
        if (m.length > 3) m.shift();
        for (const k of [0, 1]) if (m.length === 3 && m[0][k] && m[1][k] === -m[0][k] && m[2][k] === m[0][k]) checks.jitter++;
        const pl = w.players[i], x = pl.x / FP, z = pl.z / FP;
        if (!Number.isFinite(x) || !Number.isFinite(z)) checks.nan++;
        if (x < PLAYER_LIMITS.xMin || x > PLAYER_LIMITS.xMax || z < PLAYER_LIMITS.zMin || z > PLAYER_LIMITS.zMax) checks.outside++;
      }
      if (![w.ball.x, w.ball.y, w.ball.z, w.ball.vx, w.ball.vy, w.ball.vz].every(Number.isFinite)) checks.nan++;
      live = w.phase === 'rally' ? live + 1 : 0;
      checks.longest = Math.max(checks.longest, live);
      for (const e of events) {
        if (e.type === 'hit') checks.hits++;
        if (e.type === 'rally') { checks.rallies++; if (!REASONS.includes(e.reason)) checks.badReason++; }
      }
    }
  }
  return { log, checks };
}

test('200 CPU-against-CPU rallies: deterministic, each ends with a valid reason, no NaN, nobody leaves the court or jitters', () => {
  const a = playRallies(200), b = playRallies(200);
  assert.deepEqual(a.log, b.log, 'the same seeds give the same rallies');
  const c = a.checks;
  assert.ok(c.longest < STUCK, `every rally ends (longest ${(c.longest / 57.4).toFixed(0)} s)`);
  assert.equal(c.rallies, 200);
  assert.equal(c.badReason, 0);
  assert.equal(c.nan, 0);
  assert.equal(c.outside, 0);
  assert.equal(c.jitter, 0, 'no step one way, back and the same way again');
  assert.ok(c.hits / c.rallies > 3, `the CPUs play real rallies (${(c.hits / c.rallies).toFixed(1)} hits each)`);
  const reasons = new Set(a.log.filter(e => e.type === 'rally').map(e => e.reason));
  for (const r of ['tin', 'notUp']) assert.ok(reasons.has(r), `rallies end by ${r} too`);
});

/**
 * A world in mid-rally: P1 (a still human) has just struck `ball`, and it's the CPU's (P2's) ball.
 * The CPU starts at (x, z) with no positioning error. Level 5 unless `params` says otherwise.
 */
function fedRally(ball, seed, x = CPU.T_X, z = CPU.T_Z, params = levelParams(5)) {
  const w = makeWorld({ seed, cpu: [false, true], params });
  w.ball = ball;
  w.phase = 'rally';
  w.rally = makeRally(0);
  Object.assign(w.rally, { turn: 1, striker: 0, needFront: true });
  w.players[0] = makePlayer(-120, 179);
  w.players[1] = makePlayer(x, z);
  w.players[1].flags1b = CPU_FLAG;
  const cpu = makeCpu(w, 1);
  cpu.rally = w.rally;                    // this rally's error is none: home is the T
  return { w, cpu };
}

/** A ball struck by a human at (x, y, z) with a table shot. */
function fedBall(x, y, z, button, index, aim, rng, w) {
  const zone = z <= 72 ? 'FRONT' : z <= 136 ? 'MID' : 'BACK';
  const ball = makeBall({ x: x * FP, y: y * FP, z: z * FP, vz: 3 * FP });
  return applyShot(ball, shotEntry(SHOT_TABLES[zone][button][index]), aim, { z: z * FP, flags1b: 0 }, rng, w.params);
}

test('fed balls: the CPU returns most of them, but not all', () => {
  let fed = 0, returned = 0;
  const params = makeWorld().params;
  for (const x of [-110, -50, 0, 50, 110]) for (const z of [40, 100, 160]) for (const button of ['hard', 'soft'])
    for (const index of [0, 1, 2, 3, 8]) for (const aim of [0, 2, 4, 6, 7]) {
      const n = fed + returned * 1000;
      const { w, cpu } = fedRally(fedBall(x, index === 8 ? 50 : 20, z, button, index, aim, n * 7, { params }), n);
      let good = false, back = false;
      for (let f = 0; f < 600 && !w.rally.result && !back; f++) {
        stepWorld(w, NO_KEYS, cpuActions(cpu, w));
        if (w.rally.striker === 0 && !w.rally.needFront) good = true;            // the feed reached the front wall
        if (w.rally.striker === 1 && !w.rally.needFront) back = true;            // the CPU's return did too
      }
      if (!good) continue;                                                       // the feed itself was down, tin or out
      fed++;
      if (back) returned++;
    }
  const share = returned / fed;
  assert.ok(fed > 500, `enough good feeds (${fed})`);
  assert.ok(share > 0.8 && share < 0.98, `returns most but not all (${returned}/${fed} = ${(share * 100).toFixed(1)}%)`);
});

// at level 9, which presses on the planned frame (no timing error) and volleys; the timing error is tested below
test('a planned return: waits the reaction delay, runs to the side of the contact, presses SWING.CONTACT frames ahead', () => {
  const { w, cpu } = fedRally(makeBall(), 5, CPU.T_X, CPU.T_Z, levelParams(9));
  w.ball = fedBall(-60, 20, 150, 'hard', 1, 4, 3, w);
  const start = w.frame;
  const states = [];
  let plan = null, swing = null, hit = null;
  for (let f = 0; f < 400 && !hit; f++) {
    const act = cpuActions(cpu, w);
    states.push(cpu.state);
    if (!plan && cpu.plan) plan = { ...cpu.plan, at: w.frame };
    const events = stepWorld(w, NO_KEYS, act);
    swing ??= events.find(e => e.type === 'swing' && e.side === 1) && { frame: w.frame - 1, act };
    hit = events.find(e => e.type === 'hit' && e.side === 1) && { frame: w.frame - 1, ...events.find(e => e.type === 'hit') };
  }
  assert.deepEqual(states.slice(0, cpu.reaction), Array(cpu.reaction).fill('react'), 'reacting for the delay');
  assert.equal(plan.at, start + cpu.reaction, 'plans when the delay is over');
  assert.equal(plan.late, 0, 'this one is reachable');
  assert.ok(swing, 'it swings');
  assert.equal(swing.frame, plan.press, 'on the planned frame');
  assert.equal(plan.timing, 0, 'on the planned frame at level 9');
  assert.ok(swing.act[plan.button], `with the planned button (${plan.button})`);
  assert.ok(hit, 'and hits');
  assert.equal(hit.frame, plan.press + SWING.CONTACT, 'contact on the planned frame');
  const ball = { x: hit.ball.x / FP, z: hit.ball.z / FP }, me = w.players[1];
  assert.ok(Math.abs(ball.x - plan.ball.x) < 1 && Math.abs(ball.z - plan.ball.z) < 1, 'the ball where the predictor said');
  assert.ok(Math.abs(me.x / FP - plan.stand.x) <= 1.25 && Math.abs(me.z / FP - plan.stand.z) <= 0.625, 'standing on the spot');
  assert.ok(Math.abs(ball.x - me.x / FP - CPU.SIDE_OFFSET) <= 1.25, `the ball ${CPU.SIDE_OFFSET} to its right`);
  assert.equal(hit.flags & 0x24, 0, 'a clean forehand, not stretching');
});

test('planContact: the earliest reachable contact, pressed after the front wall; the closest miss if none is reachable', () => {
  const { w } = fedRally(makeBall(), 9);
  w.ball = fedBall(80, 20, 140, 'hard', 0, 4, 1, w);
  const plan = planContact(w, 1);
  assert.ok(plan && plan.late === 0);
  // the press comes after the ball reaches the front wall: replaying to the press, needFront is clear
  const copy = structuredClone(w);
  for (let f = copy.frame; f < plan.press; f++) stepWorld(copy, NO_KEYS, NO_KEYS);
  assert.equal(copy.rally.needFront, false);
  // from further away it can only plan the same contact or a later one
  const far = structuredClone(w);
  far.players[1] = makePlayer(-130, 22);
  const later = planContact(far, 1);
  assert.ok(later.contact >= plan.contact);
  // stuck in the far corner, a quick ball is out of reach: it still plans the contact it misses by the least
  const stuck = structuredClone(w);
  stuck.players[1] = makePlayer(-134, 12);
  const best = planContact(stuck, 1);
  assert.ok(best.late > 0, `late by ${best.late}`);
  assert.equal(best.late, Math.max(0, runFrames(best.stand.x + 134, best.stand.z - 12) - (best.press - w.frame)));
});

test('recovery: after its shot it heads for the T plus this rally\'s error, which is fresh each rally and never grows', () => {
  const { w, cpus } = cpuMatch(21);
  const homes = new Set();
  let arrived = 0, checked = 0;
  while (w.phase !== 'over') {
    stepCpus(w, cpus);
    for (const c of cpus) {
      assert.ok(Math.abs(c.home.x - CPU.T_X) <= c.errorStep, 'error across within one error step');
      assert.ok(Math.abs(c.home.z - CPU.T_Z) <= c.errorStep * CPU.ERROR_Z, 'error in depth within half of it');
      homes.add(`${c.side}:${c.home.x}`);
      const me = w.players[c.side];
      if (c.state === 'recover') {
        checked++;
        if (Math.abs(me.x / FP - c.home.x) <= 1.25 && Math.abs(me.z / FP - c.home.z) <= 0.625) arrived++;
      }
    }
  }
  const rallies = w.match.scores[0] + w.match.scores[1];
  assert.ok(homes.size > rallies, `a different error each rally (${homes.size} homes over ${rallies} rallies, 2 CPUs)`);
  assert.ok(checked > 0 && arrived > 0, 'it gets back to its home spot');
});

test('the CPU serve: walks to a spot in its box, waits about 1 s, serves where serveTarget says; spots and buttons vary', () => {
  const seen = { hard: 0, soft: 0, inner: 0, outer: 0, right: 0, left: 0 };
  for (let seed = 0; seed < 12; seed++) {
    const w = makeWorld({ seed, cpu: [true, true] });
    const server = w.match.server, cpu = makeCpu(w, server);
    // two serves: from the right box, then (the still receiver loses the point) from the left
    for (let n = 0; n < 2; n++) {
      while (w.phase !== 'serve') stepWorld(w, NO_KEYS, NO_KEYS);
      const box = w.match.box, a = serverArea(box);
      let served = null, still = 0, frames = 0, pressed = -1;
      for (; frames < 300 && !served; frames++) {
        const act = cpuActions(cpu, w);
        const moving = act.left || act.right || act.up || act.down;
        if (act.hard || act.soft) {
          assert.ok(!moving && still >= CPU.SERVE_WAIT - 1, 'stands still about 1 s before serving');
          assert.equal(pressed, -1, 'presses once');
          pressed = frames;
        }
        still = moving ? 0 : still + 1;
        const acts = server === 0 ? [act, NO_KEYS] : [NO_KEYS, act];
        served = stepWorld(w, acts[0], acts[1]).find(e => e.type === 'serve');
      }
      assert.ok(served, 'it serves');
      assert.equal(frames - 1 - pressed, SERVE_WINDUP, 'the ball leaves SERVE_WINDUP frames after the press');
      assert.ok(frames >= CPU.SERVE_WAIT && frames < CPU.SERVE_WAIT + 40, `in about 1 s (${frames} frames)`);
      const s = cpu.serve, pl = w.players[server];
      assert.ok(Math.abs(pl.x / FP - s.x) <= 1.25 && Math.abs(pl.z / FP - s.z) <= 0.625, 'from its chosen spot');
      assert.equal(served.button, s.button, 'with its chosen button');
      assert.deepEqual(w.serveTarget, serveTarget(box, w.ball.x / FP, w.ball.z / FP, s.button), 'aimed by its spot and button');
      assert.ok(w.landing && w.landing.z > LINES.SHORT_Z, 'into the opposite back quarter');
      seen[s.button]++;
      seen[box]++;
      const mid = (a.xMin + a.xMax) / 2;
      seen[(box === 'right' ? s.x > mid : s.x < mid) ? 'outer' : 'inner']++;
      while (w.phase === 'rally') stepWorld(w, NO_KEYS, NO_KEYS);
      assert.equal(w.result.winner, server, 'nobody returned it');
    }
  }
  for (const k of Object.keys(seen)) assert.ok(seen[k] >= 4, `varied serves: ${JSON.stringify(seen)}`);
});

test('modes: vs CPU the human serves first (rematch too) and the CPU slot is flagged; 2P has no CPU', () => {
  for (const seed of [0, 1, 2, 3]) {
    const w = makeWorld({ seed, cpu: [false, true] });
    assert.equal(w.match.server, 0, 'the human serves first');
    assert.equal(w.players[1].flags1b & CPU_FLAG, CPU_FLAG);
    assert.equal(w.players[0].flags1b & CPU_FLAG, 0);
    const v = makeWorld({ seed });
    assert.deepEqual(v.cpu, [false, false]);
    assert.ok(v.players.every(pl => !(pl.flags1b & CPU_FLAG)));
  }
  // a whole 1P match where the human only serves (and never moves): the CPU serves too, and wins
  const w = makeWorld({ target: 5, seed: 4, cpu: [false, true] });
  const cpu = makeCpu(w, 1);
  for (let f = 0; f < 20000 && w.phase !== 'over'; f++) {
    const human = w.phase === 'serve' && w.match.server === 0 ? { ...NO_KEYS, hard: true } : NO_KEYS;
    stepWorld(w, human, cpuActions(cpu, w));
  }
  assert.equal(w.phase, 'over');
  assert.equal(w.match.winner, 1, 'the CPU wins against a still human');
  const cpus = [null, cpu];
  for (let f = 0; f < 100; f++) assert.equal(cpuActions(cpus[1], w).hard, false, 'the CPU never presses HARD for a rematch');
  const ev = stepWorld(w, { ...NO_KEYS, hard: true }, NO_KEYS);
  assert.deepEqual(ev, [{ type: 'rematch', server: 0 }], 'the human serves first again');
  assert.equal(w.players[1].flags1b & CPU_FLAG, CPU_FLAG, 'still flagged after the rematch');
});

test('the timing error: up to ±params.cpuTiming frames off the planned press, fresh each shot, never in the past', () => {
  for (const level of [1, 5, 9]) {
    const seen = new Set();
    for (let seed = 0; seed < 60; seed++) {
      const { w } = fedRally(makeBall(), seed, CPU.T_X, CPU.T_Z, levelParams(level));
      w.ball = fedBall(-60, 20, 150, 'hard', 1, 4, 3, w);
      w.frame = 1000 + seed;                                           // a different shot each time
      const plan = planContact(w, 1);
      assert.ok(Math.abs(plan.timing) <= w.params.cpuTiming, `level ${level}: ${plan.timing}`);
      assert.ok(plan.press >= w.frame);
      assert.equal(plan.contact - SWING.CONTACT + plan.timing, plan.press, 'the press is the planned one plus the error');
      seen.add(plan.timing);
    }
    assert.equal(seen.size, 2 * levelParams(level).cpuTiming + 1, `level ${level}: every error from −N to +N seen (${[...seen]})`);
  }
});

test('after the bounce, without volleys (below level 6) the CPU waits for a comfortable height; with them it takes the earliest', () => {
  // the planner looks past the bounce only once the ball has bounced (see planContact), so feed a deep drive and plan
  // just after its first bounce, with the CPU waiting deep enough to reach it either way. Level 5's params, square (no
  // aim jitter), with the volley column off (as at levels 1–5) and on (as at 6–9)
  let later = 0, n = 0;
  for (const x of [-60, 0, 60]) for (const index of [0, 1, 2]) for (const aim of [2, 4, 6]) {
    const plans = {};
    for (const level of [5, 6]) {
      const params = { ...levelParams(5), cpuAimJitter: 0, cpuVolley: level === 6 ? 1 : 0 };
      const { w } = fedRally(makeBall(), 7, 20, 150, params);
      w.ball = fedBall(x, 20, 150, 'hard', index, aim, 3, w);
      while (!w.rally.result && w.rally.bounces === 0) stepWorld(w, NO_KEYS, NO_KEYS);
      if (w.rally.result) break;
      plans[level] = planContact(w, 1);
    }
    const [p5, p6] = [plans[5], plans[6]];
    if (!p5 || !p6 || p5.late || p6.late) continue;
    n++;
    assert.ok(p5.contact >= p6.contact, 'without volleys never earlier');
    assert.ok(Math.abs(p5.ball.y - CPU.COMFORT_Y) <= Math.abs(p6.ball.y - CPU.COMFORT_Y), 'without volleys nearer waist height');
    if (p5.contact > p6.contact) later++;
  }
  assert.ok(n >= 10 && later >= n / 2, `without volleys it waits for the ball in ${later} of ${n}`);
});
