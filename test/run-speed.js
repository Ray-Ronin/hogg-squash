import { loadFrames } from './load-frames.js';
const F = loadFrames(process.argv[2] || 'test/fixtures/run2_frames.bin.gz');
const DIRN={1:'U',2:'D',4:'R',8:'L',5:'UR',9:'UL',6:'DR',10:'DL'};
const acc={};
for (let k=3;k<F.length;k++){
  const a=F[k-1], b=F[k];
  if (b.sub!==1 || b.t!==a.t+1) continue;
  const m=F[k-2].mask&15; if(!DIRN[m]) continue;
  if ((F[k-3].mask&15)!==m || (a.mask&15)!==m) continue;  // held steady
  if ((F[k-2].mask&0x30)) continue;
  const dx=(b.p1.x-a.p1.x)/65536, dz=(b.p1.z-a.p1.z)/65536;
  (acc[DIRN[m]] ??= []).push([dx,dz]);
}
for (const [d,v] of Object.entries(acc)) {
  const med = i => { const s=v.map(q=>q[i]).sort((x,y)=>x-y); return s[Math.floor(s.length/2)]; };
  const mx = i => Math.max(...v.map(q=>Math.abs(q[i])));
  console.log(d.padEnd(3), 'n', String(v.length).padStart(5), ' median dx', med(0).toFixed(3), ' dz', med(1).toFixed(3), ' max|dx|', mx(0).toFixed(3), ' max|dz|', mx(1).toFixed(3));
}
// player speed field
const sp={}; for (const f of F) if (f.sub===1) sp[(f.p1.vx>>>0).toString(16)]=(sp[(f.p1.vx>>>0).toString(16)]||0)+1;
console.log('p1 +0x0e values during rallies:', Object.entries(sp).sort((a,b)=>b[1]-a[1]).slice(0,6));
