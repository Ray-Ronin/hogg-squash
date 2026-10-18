import { loadFrames } from './load-frames.js';
const tab={};
for (const file of ['test/fixtures/run2_frames.bin.gz','test/fixtures/run3_frames.bin.gz']) { const F=loadFrames(file);
  for (let k=1;k<F.length;k++){ const a=F[k-1], b=F[k]; if (b.sub!==1) continue;
    for (const who of ['p1','p2']) if ((a[who].f20&0x1f)!==(b[who].f20&0x1f)) {
      const dz=(b.ball.z>>16)-(b[who].z>>16); const aim=b[who].f20&7; const bucket=Math.round(dz/4)*4;
      (tab[bucket] ??= {})[aim]=((tab[bucket]??{})[aim]||0)+1; } } }
console.log('dz (ball depth - player depth) bucket → counts of aim value');
for (const k of Object.keys(tab).map(Number).sort((x,y)=>x-y)) console.log(String(k).padStart(4), JSON.stringify(tab[k]));
