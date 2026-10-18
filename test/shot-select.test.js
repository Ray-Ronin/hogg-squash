// When the game loads new shot parameters into screen RAM (0x10240C/0x102410), check our classifier picks the same table entries.
import { loadFrames } from './load-frames.js';
import { classifyContact, SHOT_TABLES } from '../public/hogg-squash/js/squash-physics.js';
const F = loadFrames(process.argv[2] || 'test/fixtures/run2_frames.bin.gz');
let n=0, ok=0; const fails=[];
for (let k=1;k<F.length;k++){
  const a=F[k-1], b=F[k];
  if (b.shotA===a.shotA && b.shotB===a.shotB) continue;
  if (b.sub!==1) continue;
  n++;
  let hit=null;
  for (const src of [a,b]) for (const who of ['p1','p2']) {
    const P=src[who];
    const c=classifyContact(src.ball, { x:P.x, z:P.z, flags1b:P.f1b }, src, { ballFlags1b: src.ball.f1b, isP1: who==='p1', turnIsP1: !!(src.flags940 & 0x40) });
    const T=SHOT_TABLES[c.zone];
    if ((T.hard[c.index]|0)===(b.shotA|0) && (T.soft[c.index]|0)===(b.shotB|0)) { hit={who, src: src===a?'prev':'same', idx:c.index, zone:c.zone}; break; }
  }
  if (hit) ok++; else if (fails.length<6) fails.push({t:b.t, shotA:(b.shotA>>>0).toString(16), shotB:(b.shotB>>>0).toString(16)});
}
console.log(`shot loads ${n}, classifier reproduced ${ok} (${(100*ok/n).toFixed(1)}%)`);
if (fails.length) console.log(fails);
