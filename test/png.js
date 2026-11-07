// A small PNG reader for the tests (S15: the roster test recolours the real sheet). 8-bit, not interlaced; indexed,
// RGB or RGBA in, RGBA out. Node only (zlib), no dependencies.
import fs from 'node:fs';
import zlib from 'node:zlib';

/**
 * @param {string} file
 * @returns {{ w: number, h: number, data: Uint8Array }}  RGBA, w × h
 */
export function readPng(file) {
  const b = fs.readFileSync(file);
  let p = 8, w = 0, h = 0, depth = 0, type = 0;
  /** @type {Buffer | null} */
  let plte = null, trns = null;
  const idat = [];
  while (p < b.length) {
    const len = b.readUInt32BE(p), t = b.toString('latin1', p + 4, p + 8), d = b.subarray(p + 8, p + 8 + len);
    if (t === 'IHDR') {
      w = d.readUInt32BE(0); h = d.readUInt32BE(4); depth = d[8]; type = d[9];
      if (d[12]) throw new Error(`${file}: interlaced`);
    } else if (t === 'PLTE') plte = d;
    else if (t === 'tRNS') trns = d;
    else if (t === 'IDAT') idat.push(d);
    p += 12 + len;
  }
  const channels = /** @type {Record<number, number>} */ ({ 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 })[type];
  if (depth !== 8 || ![2, 3, 6].includes(type)) throw new Error(`${file}: PNG type ${type} at ${depth} bits isn't read here`);
  const bpp = channels, stride = w * channels;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const out = new Uint8Array(w * h * 4), prev = new Uint8Array(stride), cur = new Uint8Array(stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)];
    for (let i = 0; i < stride; i++) {
      const x = raw[y * (stride + 1) + 1 + i], a = i >= bpp ? cur[i - bpp] : 0, u = prev[i], c = i >= bpp ? prev[i - bpp] : 0;
      let v = x;
      if (f === 1) v += a;
      else if (f === 2) v += u;
      else if (f === 3) v += (a + u) >> 1;
      else if (f === 4) {
        const q = a + u - c, pa = Math.abs(q - a), pb = Math.abs(q - u), pc = Math.abs(q - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? u : c;
      }
      cur[i] = v & 255;
    }
    for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 4;
      if (type === 3 && plte) {
        const idx = cur[x];
        out.set([plte[idx * 3], plte[idx * 3 + 1], plte[idx * 3 + 2], trns && idx < trns.length ? trns[idx] : 255], o);
      } else if (type === 6) out.set(cur.subarray(x * 4, x * 4 + 4), o);
      else out.set([cur[x * 3], cur[x * 3 + 1], cur[x * 3 + 2], 255], o);
    }
    prev.set(cur);
  }
  return { w, h, data: out };
}
