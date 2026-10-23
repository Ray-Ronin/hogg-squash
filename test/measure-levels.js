// @ts-check
// Measures the beginner-like reference player's share of points against the CPU at each level (1000 rallies each,
// fixed seeds), as S6b did; run by hand with `node test/measure-levels.js` (not part of npm test). Prints one line.
import { makeWorld, stepWorld } from '../public/hogg-squash/js/sim/world.js';
import { makeCpu, cpuActions } from '../public/hogg-squash/js/sim/cpu.js';
import { levelParams, LEVELS } from '../public/hogg-squash/js/sim/difficulty.js';
import { makeRef, refActions } from './reference-player.js';

const RALLIES = 1000;
const out = LEVELS.map(level => {
  let rallies = 0, won = 0, hits = 0, cramped = 0;
  for (let seed = 0; rallies < RALLIES; seed++) {
    const w = makeWorld({ target: 11, seed, params: levelParams(level), cpu: [false, true] });
    const ref = makeRef(w, 0), cpu = makeCpu(w, 1);
    while (w.phase !== 'over' && rallies < RALLIES) {
      for (const e of stepWorld(w, refActions(ref, w), cpuActions(cpu, w))) {
        if (e.type === 'rally') { rallies++; if (e.winner === 0) won++; }
        if (e.type === 'hit') { hits++; if (e.cramped) cramped++; }
      }
    }
  }
  return `${level}: ${Math.round(100 * won / rallies)}% (cramped ${Math.round(100 * cramped / hits)}% of hits)`;
});
console.log(`reference player's points by level: ${out.join(', ')}`);
