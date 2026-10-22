// The browser-tab icons (S12): a Hogg red tile with the blocky "H" of our own font (A5's 5×7 letters), outlined and
// with a drop shadow like the font's bigger sizes. Colours from the shared palette (docs/theme.md).
// Run from the repo root: node art/tools/favicon.mjs  →  public/hogg-squash/favicon.png (32 px) and
// apple-touch-icon.png (180 px, the same pixels at 5× on a red border).
import fs from 'node:fs';
import zlib from 'node:zlib';

const RED = [0xc8, 0x10, 0x2e], DARK = [0x4a, 0x06, 0x10], WHITE = [0xf4, 0xf4, 0xf0], BLACK = [0x16, 0x16, 0x1a];
const H = ['X...X', 'X...X', 'X...X', 'XXXXX', 'X...X', 'X...X', 'X...X'];

/** The 32 × 32 icon as rows of [r, g, b, a]. */
function icon() {
  const px = Array.from({ length: 32 }, () => Array.from({ length: 32 }, () => [...RED, 255]));
  // rounded corners
  for (const [x, y] of [[0, 0], [1, 0], [0, 1], [31, 0], [30, 0], [31, 1], [0, 31], [1, 31], [0, 30], [31, 31], [30, 31], [31, 30]]) {
    px[y][x] = [0, 0, 0, 0];
  }
  const S = 4, X0 = 6, Y0 = 2;                // the letter at 4×: 20 × 28 px
  const on = (/** @type {number} */ x, /** @type {number} */ y) => {
    const gx = Math.floor((x - X0) / S), gy = Math.floor((y - Y0) / S);
    return x >= X0 && y >= Y0 && gy < H.length && gx < 5 && H[gy][gx] === 'X';
  };
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      if (on(x, y)) px[y][x] = [...WHITE, 255];
      else if (on(x - 2, y - 2)) px[y][x] = [...DARK, 255];       // drop shadow
      else if ([[-1, 0], [1, 0], [0, -1], [0, 1]].some(([dx, dy]) => on(x + dx, y + dy))) px[y][x] = [...BLACK, 255];
    }
  }
  return px;
}

/** @param {number[][][]} px */
function png(px) {
  const h = px.length, w = px[0].length;
  const raw = Buffer.alloc(h * (1 + w * 4));
  px.forEach((row, y) => row.forEach((c, x) => raw.set(c, y * (1 + w * 4) + 1 + x * 4)));
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (/** @type {Buffer} */ b) => {
    let c = 0xffffffff;
    for (const v of b) c = crcTable[(c ^ v) & 255] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (/** @type {string} */ type, /** @type {Buffer} */ data) => {
    const len = Buffer.alloc(4), tc = Buffer.concat([Buffer.from(type), data]), c = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    c.writeUInt32BE(crc(tc));
    return Buffer.concat([len, tc, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr.set([8, 6, 0, 0, 0], 8);               // 8-bit RGBA
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

const small = icon();
fs.writeFileSync('public/hogg-squash/favicon.png', png(small));
// 180 px: 5× (160 px) on a 10 px red border, square corners (iOS rounds them itself)
const big = Array.from({ length: 180 }, (_, y) => Array.from({ length: 180 }, (_, x) => {
  const sx = Math.floor((x - 10) / 5), sy = Math.floor((y - 10) / 5);
  const c = sx >= 0 && sy >= 0 && sx < 32 && sy < 32 ? small[sy][sx] : [...RED, 255];
  return c[3] ? c : [...RED, 255];
}));
fs.writeFileSync('public/hogg-squash/apple-touch-icon.png', png(big));
console.log('wrote favicon.png and apple-touch-icon.png');
