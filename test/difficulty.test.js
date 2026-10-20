// Difficulty levels 1–9: the table, ball flights at every level's pace, the aimed serve at every level, CPU-against-CPU
// rallies by level, a beginner-like reference player's share of points against each level, the CPU's shot quality by
// level, and the front-court SOFT drop (node:test, run by npm test).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FP, makeBall, applyShot, shotEntry, predict, difficultyParams, SHOT_TABLES, SERVE } from '../public/hogg-squash/js/squash-physics.js';
import { LEVELS, LEVEL_TABLE, DEFAULT_LEVEL, levelParams, paramsFor, toLevel } from '../public/hogg-squash/js/sim/difficulty.js';
import { makeWorld, stepWorld, defaultParams, serveTarget, serveAim, serveFlight, serveIsGood, SERVE_SPOT } from '../public/hogg-squash/js/sim/world.js';
import { makeCpu, cpuActions } from '../public/hogg-squash/js/sim/cpu.js';
import { shotFor } from '../public/hogg-squash/js/sim/player.js';
import { makeRef, refActions } from './reference-player.js';
import { LINES } from '../public/hogg-squash/js/sim/court-rules.js';

/** The pace columns of a params object. */
const pace = p => ({ speed: p.speed, gravity: p.gravity, powerMult: p.powerMult, latMult: p.latMult, bounceOffset: p.bounceOffset });
/** The arcade's row as params (latMult = powerMult, as the game passes it). */
const arcade = idx => { const d = difficultyParams(idx); return { ...d, latMult: d.powerMult }; };

test('the table: nine levels, every column monotonic, level 5 = the CP-B pace, level 9 = Hardest 4', () => {
  assert.deepEqual(LEVELS, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const rising = ['speed', 'gravity', 'powerMult', 'cpuSense', 'cpuAimJitter', 'cpuSoftScale', 'cpuVolley', 'cpuReach'];
  const falling = ['bounceOffset', 'cpuReaction', 'cpuErrorStep', 'cpuTiming'];
  for (const k of [...rising, ...falling]) {
    const col = LEVEL_TABLE[k];
    assert.equal(col.length, 9, k);
    for (let i = 1; i < 9; i++) {
      if (rising.includes(k)) assert.ok(col[i] >= col[i - 1], `${k} never drops (level ${i + 1})`);
      else assert.ok(col[i] <= col[i - 1], `${k} never rises (level ${i + 1})`);
    }
    assert.notEqual(col[0], col[8], `${k} changes from level 1 to 9`);
  }
  assert.deepEqual(pace(levelParams(5)), pace(arcade(0)), 'level 5 plays at arcade Normal/skill 0, the CP-B pace');
  assert.deepEqual(pace(levelParams(9)), pace(arcade(19)), 'level 9 plays at arcade Hardest/skill 4');
  assert.deepEqual([levelParams(9).cpuReaction, levelParams(9).cpuErrorStep], [1, 2], 'level 9 CPU = Hardest 4');
  // level 9's shot quality is the CPU as it was before S6b: on time, ±8 aim jitter, every SOFT chance, volleys
  const q9 = levelParams(9);
  assert.deepEqual([q9.cpuTiming, q9.cpuAimJitter, q9.cpuSoftScale, q9.cpuVolley], [0, 8, 1, 1]);
  // level 1: slow (0.63 s), mistimed by up to 4 frames, square, few drops, no volleys; volleys from level 6
  const q1 = levelParams(1);
  assert.deepEqual([q1.cpuReaction, q1.cpuTiming, q1.cpuAimJitter, q1.cpuSoftScale, q1.cpuVolley], [36, 4, 0, 0.3, 0]);
  assert.deepEqual(LEVEL_TABLE.cpuVolley.map(v => v > 0), LEVELS.map(l => l >= 6));
  assert.deepEqual(LEVEL_TABLE.cpuErrorStep, [24, 20, 16, 16, 12, 10, 6, 4, 2], 'the error step as proposed in docs/plan.md');
  // the speed steps evenly through all nine levels, and gravity too
  for (let i = 1; i < 9; i++) {
    assert.equal(LEVEL_TABLE.speed[i] - LEVEL_TABLE.speed[i - 1], 6);
    assert.equal(LEVEL_TABLE.gravity[i] - LEVEL_TABLE.gravity[i - 1], 0x70);
  }
  for (const l of LEVELS) assert.equal(levelParams(l).latMult, levelParams(l).powerMult, 'latMult = powerMult');
});

test('levels from the URL, the default, and 2P always at level 5\'s pace', () => {
  assert.equal(DEFAULT_LEVEL, 5);
  for (const v of [undefined, null, '', '0', '10', '2.5', 'x', -3]) assert.equal(toLevel(v), 5, `${v} → 5`);
  for (const l of LEVELS) assert.equal(toLevel(String(l)), l);
  assert.deepEqual(defaultParams(), levelParams(5), 'a world with no params plays level 5');
  for (const l of LEVELS) {
    assert.deepEqual(pace(paramsFor(l, true)), pace(levelParams(5)), `2P at ?level=${l} plays level 5's pace`);
    assert.deepEqual(paramsFor(l, false), levelParams(l), `1P at level ${l} plays level ${l}`);
  }
  assert.equal(makeWorld({ params: paramsFor(1, false) }).params.speed, 256);
});

/**
 * Every shot in the shot tables (both buttons, all 12 rows) at aims 1, 3 and 5, from the middle of each zone: frames
 * to the front wall, its height there, and frames on to the first bounce.
 */
function flights(p) {
  const Z = { FRONT: 50, MID: 100, BACK: 150 }, out = [];
  for (const zone of ['FRONT', 'MID', 'BACK']) for (const button of ['hard', 'soft']) for (const long of SHOT_TABLES[zone][button]) {
    for (const aim of [1, 3, 5]) {
      const ball = makeBall({ y: 20 * FP, z: Z[zone] * FP, vz: 3 * FP });
      applyShot(ball, shotEntry(long), aim, { z: Z[zone] * FP, flags1b: 0 }, 6, p);
      const path = predict(ball, p, 400);
      let wall = -1, wallY = NaN, bounce = -1;
      for (let k = 0; k < path.length; k++) {
        const at = k ? path[k - 1] : ball;
        if (path[k].ev === 'frontWall' && wall < 0) { wall = k + 1; wallY = at.y / FP; }
        else if (path[k].ev === 'floor' && wall >= 0) { bounce = k + 1; break; }
      }
      out.push({ wall, wallY, bounce });
    }
  }
  return out;
}

const mean = a => a.reduce((s, v) => s + v, 0) / a.length;

test('ball flights at every level are sane: near the arcade\'s timings, slower levels slower, no more tins or outs', () => {
  // the arcade's 20 paces give the reference ranges
  const ref = Array.from({ length: 20 }, (_, i) => flights(arcade(i)));
  const refWall = ref.map(f => mean(f.map(s => s.wall))), refBounce = ref.map(f => mean(f.map(s => s.bounce)));
  const worstTin = Math.max(...ref.map(f => f.filter(s => s.wallY <= LINES.TIN).length));
  let prev = null;
  for (const l of LEVELS) {
    const f = flights(levelParams(l));
    assert.ok(f.every(s => s.wall > 0 && s.bounce > s.wall), `level ${l}: every shot reaches the front wall, then bounces`);
    const wall = mean(f.map(s => s.wall)), bounce = mean(f.map(s => s.bounce));
    // level 1 is slower than any arcade row on purpose, so it may take up to 25% longer than the slowest
    assert.ok(wall >= Math.min(...refWall) * 0.9 && wall <= Math.max(...refWall) * 1.25,
      `level ${l}: ${wall.toFixed(1)} frames to the front wall (arcade ${Math.min(...refWall).toFixed(1)}–${Math.max(...refWall).toFixed(1)})`);
    assert.ok(bounce >= Math.min(...refBounce) * 0.9 && bounce <= Math.max(...refBounce) * 1.25,
      `level ${l}: ${bounce.toFixed(1)} frames to the bounce (arcade ${Math.min(...refBounce).toFixed(1)}–${Math.max(...refBounce).toFixed(1)})`);
    assert.ok(f.filter(s => s.wallY <= LINES.TIN).length <= worstTin, `level ${l}: no more tins than the arcade's worst`);
    assert.ok(f.every(s => s.wallY < LINES.FRONT_OUT), `level ${l}: nothing over the out-line`);
    if (prev) {
      assert.ok(wall <= prev.wall && bounce <= prev.bounce, `level ${l} is no slower than level ${l - 1}`);
    }
    prev = { wall, bounce };
  }
  const f1 = mean(flights(levelParams(1)).map(s => s.bounce)), f5 = mean(flights(levelParams(5)).map(s => s.bounce));
  assert.ok(f1 > f5 * 1.08, `level 1 is clearly slower than level 5 (${f1.toFixed(1)} vs ${f5.toFixed(1)} frames to the bounce)`);
});

test('the aimed serve works at every level: inner and outer edges, front and back of each box, HARD and SOFT', () => {
  for (const l of LEVELS) {
    const p = levelParams(l);
    for (const side of ['right', 'left']) {
      const reach = side === 'right' ? [90, 144] : [-116, -72];      // the held ball's x at each edge of its reach
      for (const bx of reach) for (const bz of [103, 133]) for (const button of ['hard', 'soft']) {
        const where = `level ${l}, ${side} box, ball ${bx},${bz}, ${button}`;
        const t = serveTarget(side, bx, bz, button);
        const ball = makeBall({ x: bx * FP, y: SERVE_SPOT.BALL_Y * FP, z: bz * FP, vy: SERVE.vy[button === 'hard' ? 1 : 0] });
        const aim = serveAim(ball, p, t);
        assert.ok(aim, `${where}: solved`);
        const f = serveFlight({ ...ball, ...aim }, p);
        assert.ok(serveIsGood(f, t), `${where}: legal, and on target across`);
        assert.ok(Math.abs(f.z - t.z) <= 4, `${where}: first bounce at z ${f.z} for ${t.z}`);
        assert.ok(f.z > LINES.SHORT_Z && Math.sign(f.x) === (side === 'right' ? -1 : 1), `${where}: in the opposite back quarter`);
      }
    }
  }
});

/** CPU against CPU at one level: average hits per rally over the first `rallies` rallies (fixed seeds). */
function hitsPerRally(level, rallies) {
  let n = 0, hits = 0, seed = 0;
  while (n < rallies) {
    const w = makeWorld({ target: 11, seed: seed++, params: levelParams(level), cpu: [true, true] });
    const cpus = [makeCpu(w, 0), makeCpu(w, 1)];
    while (w.phase !== 'over' && n < rallies) {
      for (const e of stepWorld(w, cpuActions(cpus[0], w), cpuActions(cpus[1], w))) {
        if (e.type === 'hit') hits++;
        else if (e.type === 'rally') n++;
      }
    }
  }
  return hits / n;
}

// S6b replaced "longer at every level": with the shot-quality columns, CPU-against-CPU rallies step with the pace
// columns (power and bounce change every second level), so a level can rally a little shorter than the one below.
// Levels in threes still get longer, and level 9 still rallies over twice as long as level 1.
test('CPU against CPU, rallies get longer as the levels rise (in threes)', () => {
  const h = LEVELS.map(l => hitsPerRally(l, 400));
  const shown = h.map((v, i) => `${i + 1}: ${v.toFixed(1)}`).join(', ');
  const three = [0, 3, 6].map(i => mean(h.slice(i, i + 3)));
  assert.ok(three[0] < three[1] && three[1] < three[2], `levels 1–3 < 4–6 < 7–9 (${shown})`);
  assert.ok(h[8] > 2 * h[0], `level 9 rallies over twice level 1's (${shown})`);
});

/**
 * The reference player (a beginner: test/reference-player.js) as P1 against the CPU at one level, over the first
 * `rallies` rallies of games to 11 (fixed seeds). Returns its points and the CPU's shot-quality counts.
 */
function againstRef(level, rallies) {
  const s = { rallies: 0, ref: 0, swings: 0, missed: 0, stretched: 0, hits: 0, soft: 0, volleys: 0, onTime: 0, offStraight: 0, angled: 0 };
  for (let seed = 0; s.rallies < rallies; seed++) {
    const w = makeWorld({ target: 11, seed, params: levelParams(level), cpu: [false, true] });
    const ref = makeRef(w, 0), cpu = makeCpu(w, 1);
    while (w.phase !== 'over' && s.rallies < rallies) {
      const bounced = w.rally.bounces > 0;
      for (const e of stepWorld(w, refActions(ref, w), cpuActions(cpu, w))) {
        if (e.type === 'rally') { s.rallies++; if (e.winner === 0) s.ref++; }
        if (e.type === 'swing' && e.side === 1) { s.swings++; if (!e.reach) s.missed++; else if (e.flags & 2) s.stretched++; }
        if (e.type !== 'hit' || e.side !== 1) continue;
        s.hits++;
        if (e.button === 'soft') s.soft++;
        if (!bounced) s.volleys++;
        if (e.aim <= 2 || e.aim >= 6) s.angled++;
        // placement: its well-timed shots (reached in time, pressed on the planned frame) off straight (aim 4)
        if (cpu.plan && cpu.plan.late === 0 && cpu.plan.timing === 0) { s.onTime++; if (e.aim !== 4) s.offStraight++; }
      }
    }
  }
  return s;
}

const pct = (a, b) => `${(100 * a / b).toFixed(1)}%`;

test('a beginner-like reference player wins most points at level 1, about half at level 5, few at level 9', () => {
  const [l1, l5, l9] = [1, 5, 9].map(l => againstRef(l, 600));
  const share = s => s.ref / s.rallies;
  const shown = `level 1 ${pct(l1.ref, l1.rallies)}, 5 ${pct(l5.ref, l5.rallies)}, 9 ${pct(l9.ref, l9.rallies)}`;
  assert.ok(share(l1) >= 0.6, `≥ 60% at level 1 (${shown})`);
  assert.ok(share(l5) >= 0.35 && share(l5) <= 0.55, `35–55% at level 5 (${shown})`);
  assert.ok(share(l9) <= 0.2, `≤ 20% at level 9 (${shown})`);
  assert.ok(share(l1) > share(l5) && share(l5) > share(l9), shown);
});

test('the CPU hits worse at level 1 than at level 9: more misses and stretches, fewer placed angles, drops and volleys', () => {
  const [a, b] = [1, 9].map(l => againstRef(l, 600));
  const show = s => `missed ${pct(s.missed, s.swings)} stretched ${pct(s.stretched, s.swings)}, off straight when well timed ` +
    `${pct(s.offStraight, s.onTime)} (all shots angled ${pct(s.angled, s.hits)}), SOFT ${pct(s.soft, s.hits)}, volleys ${pct(s.volleys, s.hits)}`;
  const shown = `level 1: ${show(a)}; level 9: ${show(b)}`;
  assert.ok((a.missed + a.stretched) / a.swings > 2 * (b.missed + b.stretched) / b.swings, `misses and stretches (${shown})`);
  assert.ok(a.offStraight / a.onTime < b.offStraight / b.onTime / 4, `placed angles (${shown})`);
  assert.ok(a.soft / a.hits < b.soft / b.hits / 2, `SOFTs (${shown})`);
  assert.ok(a.volleys / a.hits < b.volleys / b.hits / 2, `volleys (${shown})`);
});

/**
 * SOFT shots from the front court: every front-court contact type a drop is played from (not the overheads, 8–9) from
 * a spread of contacts up to y 30 (depth, height, across, aim, the shot's random factor, and the incoming ball's
 * speed toward the back), with `entry` giving the shot. Each good drop's second-bounce depth, and how many were lost
 * (into the tin, or down before the front wall).
 */
function drops(p, entry) {
  const out = { lost: 0, tin: 0, n: 0, second: /** @type {{ z: number, vz: number }[]} */ ([]) };
  for (const index of [0, 1, 2, 3, 4, 5, 6, 7, 10, 11]) for (const z of [20, 35, 50, 65, 72]) for (const y of [0, 8, 15, 22, 30])
    for (const x of [-100, 0, 100]) for (const aim of [0, 4, 7]) for (const rng of [0, 6, 14]) for (const vz of [1, 3, 5]) {
      const ball = makeBall({ x: x * FP, y: y * FP, z: z * FP, vz: vz * FP, vy: -FP });
      applyShot(ball, entry(index), aim, { z: (z + 4) * FP, flags1b: 0 }, rng, p);
      const path = predict(ball, p, 400);
      let wallY = null, floors = 0, second = null;
      for (let k = 0; k < path.length && second === null; k++) {
        const at = k ? path[k - 1] : ball;
        if (path[k].ev === 'frontWall' && wallY === null) wallY = at.y / FP;
        else if (path[k].ev === 'floor') { if (wallY === null) break; if (++floors === 2) second = at.z / FP; }
      }
      out.n++;
      if (wallY === null || wallY <= LINES.TIN) { out.lost++; if (wallY !== null) out.tin++; continue; }
      out.second.push({ z: second ?? path[path.length - 1].z / FP, vz });   // a ball that dies rolling: where it stops
    }
  return out;
}

// Measured in S6b (POWER_MAX 32, LIFT_MAX 1280): off a ball coming at up to 3 units/frame every drop's second bounce is
// in front of the short line; off a fast one (5 units/frame: a drive, played short) 94–100% are, the deepest at z 112.
// Tins fall from about 22% to 8%, but about 14% now fall short of the front wall instead (from the back of the front
// court, about a quarter), so all lost together stay about as the arcade's (21–25%; level 1 is 1.4 points over).
test('SOFT from the front court is a short drop at every level: second bounce before the short line, fewer tins', () => {
  for (const l of LEVELS) {
    const p = levelParams(l);
    const now = drops(p, i => shotFor('FRONT', 'soft', i)), arcade = drops(p, i => shotEntry(SHOT_TABLES.FRONT.soft[i]));
    const deep = list => list.filter(s => s.z >= LINES.SHORT_Z);
    const slow = now.second.filter(s => s.vz <= 3), fast = now.second.filter(s => s.vz > 3);
    const at = `level ${l}: past the short line ${deep(now.second).length}/${now.second.length} (the arcade's ` +
      `${deep(arcade.second).length}/${arcade.second.length}), deepest ${Math.max(...now.second.map(s => s.z)).toFixed(0)}, ` +
      `tin ${pct(now.tin, now.n)} (the arcade's ${pct(arcade.tin, arcade.n)}), all lost ${pct(now.lost, now.n)} (the arcade's ${pct(arcade.lost, arcade.n)})`;
    assert.equal(deep(slow).length, 0, `with the ball coming at up to 3 units/frame, every one (${at})`);
    assert.ok(deep(fast).length <= fast.length * 0.07, `off a fast ball (5 units/frame), 93% (${at})`);
    assert.ok(now.second.every(s => s.z < LINES.BOX_BACK_Z), `none past the service boxes (${at})`);
    assert.ok(now.tin <= arcade.tin / 2, `at most half the arcade's tins (${at})`);
    assert.ok(now.lost <= arcade.lost + now.n * 0.02, `all lost (tin, or down before the wall) within 2 points of the arcade's (${at})`);
  }
});
