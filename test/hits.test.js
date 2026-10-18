// Check the racket-hit formula on every hit frame in the MAME log.
import { loadFrames } from './load-frames.js';
import { step, integrate, collide, applyShot, shotEntry } from '../public/hogg-squash/js/squash-physics.js';
const F = loadFrames(process.argv[2] || 'test/fixtures/run2_frames.bin.gz');
const keys = ['vx','vy','vz'];
let hits = 0, matched = 0; const fails = [];
for (let k = 1; k + 1 < F.length; k++) {
  const a = F[k], b = F[k+1], prev = F[k-1];
  if (b.t !== a.t + 1 || a.sub !== 1 || !(a.ball.f20 & 0x80) || a.speed < 200) continue;
  const sim = { ...a.ball, bounces: 0 }; step(sim, a);
  if (keys.every(q => sim[q] === b.ball[q])) continue;           // not a hit
  hits++;
  let ok = null;
  outer:
  for (const who of ['p1','p2']) for (const bank of ['shotA','shotB']) for (const order of ['before','after']) for (const rngSrc of [a.rng, b.rng, prev.rng]) {
    const P = a[who];
    const aim = (b[who].f20 & 0x1f) & 7;
    const ball = { ...a.ball, bounces: 0 };
    if (order === 'after') { step(ball, a); }
    applyShot(ball, shotEntry(a[bank] >>> 0 | 0), aim, { z: P.z, flags1b: b[who].f1b, isCpu: !!(b[who].f1b & 0x40) }, rngSrc, a, a.ball.f1b);
    if (order === 'before') integrate(ball, a);
    const okV = keys.every(q => ball[q] === b.ball[q]);
    if (okV) { ok = { who, bank, order, rng: rngSrc === a.rng ? 'a' : rngSrc === b.rng ? 'b' : 'prev' }; break outer; }
  }
  if (ok) { matched++; (globalThis.stats ??= {})[JSON.stringify(ok)] = ((globalThis.stats[JSON.stringify(ok)])||0)+1; }
  else if (fails.length < 8) fails.push({ t: a.t, real: keys.map(q=>b.ball[q]), shotA: (a.shotA>>>0).toString(16), shotB: (a.shotB>>>0).toString(16), p1f: [b.p1.f1b.toString(16), b.p1.f20.toString(16)], p2f: [b.p2.f1b.toString(16), b.p2.f20.toString(16)], in1: a.in1.toString(16), in2: a.in2.toString(16), ballf1b: a.ball.f1b });
}
console.log(`hits ${hits}, formula matched exactly ${matched}`);
console.log(globalThis.stats);
for (const f of fails) console.log(JSON.stringify(f));
