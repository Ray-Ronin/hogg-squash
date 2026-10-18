import { loadFrames } from './load-frames.js';
import { step, integrate, applyShot, shotEntry } from '../public/hogg-squash/js/squash-physics.js';
const F = loadFrames(process.argv[2] || 'test/fixtures/run2_frames.bin.gz');
const byT = new Map(F.map((f,i)=>[f.t,i]));
const keys=['vx','vy','vz']; const rows=[];
const DIRN={0:'none',1:'U',2:'D',4:'R',8:'L',5:'UR',9:'UL',6:'DR',10:'DL'};
for (let k=1;k+1<F.length;k++){
  const a=F[k], b=F[k+1];
  if (b.t!==a.t+1||a.sub!==1||!(a.ball.f20&0x80)||a.speed<200) continue;
  const sim={...a.ball,bounces:0}; step(sim,a); if (keys.every(q=>sim[q]===b.ball[q])) continue;
  for (const bank of ['shotA','shotB']) for (const order of ['after','before']) {
    const P=a.p1; const aim=b.p1.f20&7; const ball={...a.ball,bounces:0};
    if(order==='after') step(ball,a);
    applyShot(ball,shotEntry(a[bank]|0),aim,{z:P.z,flags1b:b.p1.f1b,isCpu:false},b.rng,a,a.ball.f1b);
    if(order==='before') integrate(ball,a);
    if(keys.every(q=>ball[q]===b.ball[q])){
      // inputs pressed in the 20 frames before contact
      const hist=[]; for(let j=k-20;j<=k;j++){ hist.push(F[j].mask); }
      const btn = hist.some(m=>m&0x20)?'B1':''; const btn2 = hist.some(m=>m&0x10)?'B2':'';
      const dirs=[...new Set(hist.map(m=>DIRN[m&15]))];
      // first frame (within 20) where a button was pressed
      let first=-1; for(let j=0;j<hist.length;j++) if(hist[j]&0x30){first=hist.length-1-j;break;}
      rows.push({t:a.t,bank,btns:btn+btn2,dirs:dirs.join('/'),dirAtPress: first>=0?DIRN[hist[hist.length-1-first]&15]:'?',aim,f20:b.p1.f20.toString(16),f1b:b.p1.f1b.toString(16),framesSincePress:first, side: (b.p1.f1b&4)?'flip':'norm', zone: (a.p1.z>>16)<=0x48?'front':(a.p1.z>>16)<=0x88?'mid':'back', ballx:a.ball.x>>16});
      break;
    }
  }
}
console.table(rows);
