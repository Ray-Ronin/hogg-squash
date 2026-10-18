// Parse the per-frame MAME log written by squash_probe2.lua
import fs from 'node:fs';
import zlib from 'node:zlib';
export const REC = 4 + 0xc0 + 0xd0 + 0x30 + 0x10 + 0x20 + 1;
export function loadFrames(path) {
  let buf = fs.readFileSync(path);
  if (path.endsWith('.gz')) buf = zlib.gunzipSync(buf);
  const n = Math.floor(buf.length / REC), out = [];
  for (let k = 0; k < n; k++) {
    const o = k * REC;
    const L = a => buf.readInt32BE(o + a), W = a => buf.readInt16BE(o + a), B = a => buf.readUInt8(o + a);
    const A = 4;                                  // 0xff8600 block
    const G = A + 0xc0;                           // 0xffb930 block
    const ga = addr => G + (addr - 0xffb930);
    const PB = G + 0xd0;                          // 0xffbaa0 block
    const IN = PB + 0x30;                         // 0xffb810 block
    const SR = IN + 0x10;                         // 0x102400 block
    const actor = base => ({ x: L(base+2), y: L(base+6), z: L(base+0xa), vx: L(base+0xe), vy: L(base+0x12), vz: L(base+0x16),
                             s1a: B(base+0x1a), f1b: B(base+0x1b), f20: B(base+0x20), f21: B(base+0x21), w0: W(base) });
    out.push({
      t: buf.readUInt32BE(o),
      ball: actor(A), p1: actor(A + 0x30), p2: actor(A + 0x60),
      score: [B(ga(0xffb948)), B(ga(0xffb949))], sub: W(ga(0xffb93e)), flags940: B(ga(0xffb940)),
      speed: W(ga(0xffb9a0)), bounceOffset: W(ga(0xffb9ac)), powerMult: W(ga(0xffb9b0)), latMult: W(ga(0xffb9b4)),
      round: W(ga(0xffb9c0)), faults: W(ga(0xffb9c4)), skill: W(ga(0xffb9be)),
      gravity: L(SR + 8), shotA: L(SR + 0xc), shotB: L(SR + 0x10), rng: L(SR + 0x14),
      in1: B(IN + 5), in2: B(IN + 0xb), mask: B(SR + 0x20),
      pred: [0,1,2,3].map(i => ({ x: W(PB + 8 + i*6), z: W(PB + 10 + i*6), f: W(PB + 12 + i*6) })),
    });
  }
  return out;
}
