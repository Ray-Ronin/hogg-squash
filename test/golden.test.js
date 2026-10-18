// Golden test: feed the logged ball state at frame t into our JS physics, compare with logged frame t+1.
import { loadFrames } from './load-frames.js';
import { step } from '../public/hogg-squash/js/squash-physics.js';
const path = process.argv[2] || 'test/fixtures/run2_frames.bin.gz';
const F = loadFrames(path);
const keys = ['x','y','z','vx','vy','vz'];
let tested = 0, exact = 0; const miss = {}; const samples = [];
for (let k = 0; k + 1 < F.length; k++) {
  const a = F[k], b = F[k+1];
  if (b.t !== a.t + 1 || a.sub !== 1 || a.speed < 200 || a.gravity <= 0 || a.gravity > 0x8000) continue;
  if (a.ball.w0 === 0 || !(a.ball.f20 & 0x80)) continue;   // ball not in play (held / reset)
  const ball = { ...a.ball, bounces: 0, out: false };
  const ev = step(ball, a);
  tested++;
  const bad = keys.filter(q => ball[q] !== b.ball[q]);
  if (bad.length === 0) exact++;
  else { const key = bad.join('+'); miss[key] = (miss[key]||0)+1; if (samples.length < 25) samples.push({ t: a.t, ev, bad, sim: keys.map(q=>ball[q]), real: keys.map(q=>b.ball[q]), prev: keys.map(q=>a.ball[q]) }); }
}
console.log(`frames tested ${tested}, exact match ${exact} (${(100*exact/tested).toFixed(2)}%)`);
console.log('mismatch kinds:', Object.entries(miss).sort((x,y)=>y[1]-x[1]).slice(0,12));
for (const s of samples.slice(0,12)) console.log(JSON.stringify(s));
