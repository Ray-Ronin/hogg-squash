// Difficulty levels 1–9: the table, ball flights at every level's pace, the aimed serve at every level, and
// CPU-against-CPU rallies getting longer as the level rises (node:test, run by npm test).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FP, makeBall, applyShot, shotEntry, predict, difficultyParams, SHOT_TABLES, SERVE } from '../public/hogg-squash/js/squash-physics.js';
import { LEVELS, LEVEL_TABLE, DEFAULT_LEVEL, levelParams, paramsFor, toLevel } from '../public/hogg-squash/js/sim/difficulty.js';
import { makeWorld, stepWorld, defaultParams, serveTarget, serveAim, serveFlight, serveIsGood, SERVE_SPOT } from '../public/hogg-squash/js/sim/world.js';
import { makeCpu, cpuActions } from '../public/hogg-squash/js/sim/cpu.js';
import { LINES } from '../public/hogg-squash/js/sim/court-rules.js';

/** The pace columns of a params object. */
const pace = p => ({ speed: p.speed, gravity: p.gravity, powerMult: p.powerMult, latMult: p.latMult, bounceOffset: p.bounceOffset });
/** The arcade's row as params (latMult = powerMult, as the game passes it). */
const arcade = idx => { const d = difficultyParams(idx); return { ...d, latMult: d.powerMult }; };

test('the table: nine levels, every column monotonic, level 5 = the CP-B pace, level 9 = Hardest 4', () => {
  assert.deepEqual(LEVELS, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const rising = ['speed', 'gravity', 'powerMult', 'cpuSense'], falling = ['bounceOffset', 'cpuReaction', 'cpuErrorStep'];
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
  // the CPU columns as proposed in docs/plan.md (open question 1)
  assert.deepEqual(LEVEL_TABLE.cpuReaction, [24, 20, 16, 12, 8, 6, 4, 2, 1]);
  assert.deepEqual(LEVEL_TABLE.cpuErrorStep, [24, 20, 16, 16, 12, 10, 6, 4, 2]);
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

test('CPU against CPU, rallies get longer as the level rises', () => {
  const h = LEVELS.map(l => hitsPerRally(l, 400));
  const shown = h.map((v, i) => `${i + 1}: ${v.toFixed(1)}`).join(', ');
  for (let i = 1; i < 9; i++) assert.ok(h[i] > h[i - 1], `level ${i + 1} rallies longer than level ${i} (${shown})`);
  assert.ok(h[8] > 2 * h[0], `level 9 rallies over twice level 1's (${shown})`);
});
