import { loadFrames } from './load-frames.js';
const F = loadFrames(process.argv[2] || 'test/fixtures/run2_frames.bin.gz');
// at every frame where p1.f20 low bits change during a rally, print relation to ball
const rows=[];
for (let k=1;k<F.length;k++){
  const a=F[k-1], b=F[k];
  if (b.sub!==1) continue;
  for (const who of ['p1','p2']) {
    if ((a[who].f20 & 0x1f) !== (b[who].f20 & 0x1f)) rows.push({t:b.t, who, from:(a[who].f20&0x1f), to:(b[who].f20&0x1f), aim:b[who].f20&7, dx:(b.ball.x>>16)-(b[who].x>>16), dz:(b.ball.z>>16)-(b[who].z>>16), by:b.ball.y>>16, bvz:(b.ball.vz/65536).toFixed(2), mask:b.mask.toString(16), s1a:b[who].s1a});
  }
}
console.log(rows.length); console.table(rows.filter(r=>r.who==='p1').slice(0,60));
