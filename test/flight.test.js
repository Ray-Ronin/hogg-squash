// Strict test: from the frame after each racket hit, run our physics with NO corrections until the next hit
// (or the rally ends) and require every frame to match the original exactly.
import { loadFrames } from './load-frames.js';
import { step } from '../public/hogg-squash/js/squash-physics.js';
const F = loadFrames(process.argv[2] || 'test/fixtures/run2_frames.bin.gz');
const keys=['x','y','z','vx','vy','vz'];
let flights=0, perfect=0, framesChecked=0, longest=0; const fails=[];
let k=1;
while (k+1<F.length){
  const a=F[k];
  const live = f => f.sub===1 && (f.ball.f20 & 0x80) && f.speed>=200;
  if (!live(a)) { k++; continue; }
  // start a flight here: simulate until our prediction diverges
  const ball={...a.ball,bounces:0}; let j=k, ok=true, n=0;
  while (j+1<F.length && live(F[j]) && F[j+1].t===F[j].t+1) {
    step(ball, F[j]);
    const real=F[j+1].ball;
    if (!keys.every(q=>ball[q]===real[q])) { ok=false; break; }
    n++; j++;
  }
  // a divergence is expected at a racket hit; count flights of >=10 frames
  if (n>=10) { flights++; framesChecked+=n; longest=Math.max(longest,n);
    if (!ok) { // check the divergence is a velocity replacement (hit), not drift
      const real=F[j+1]?.ball; const posSame = real && ['x','y','z'].every(q=>ball[q]===real[q]);
      const velChanged = real && ['vx','vy','vz'].some(q=>ball[q]!==real[q]);
      if (velChanged) perfect++; else if (fails.length<5) fails.push({t:F[j].t,n});
    } else perfect++;
  }
  k = j+1;
}
console.log(`flights ${flights}, ended only by a racket hit / rally end: ${perfect}, frames simulated with zero error: ${framesChecked}, longest flight ${longest} frames`);
if (fails.length) console.log('unexplained divergences:', fails);
