// Prints a take's loudness over time (peak per 10 ms, in dB) so trims can be placed by eye without listening.
// Run: node audio/elevenlabs/a6/envelope.mjs <ffmpeg.exe> <file.mp3> [...]
import { execFileSync } from 'node:child_process';

const [ffmpeg, ...files] = process.argv.slice(2);
const RATE = 44100, STEP = RATE / 100;
for (const f of files) {
  const raw = execFileSync(ffmpeg, ['-v', 'error', '-i', f, '-ac', '1', '-ar', String(RATE), '-f', 'f32le', '-'], { maxBuffer: 1 << 26 });
  const s = new Float32Array(raw.buffer, raw.byteOffset, raw.length / 4);
  const rows = [];
  for (let i = 0; i < s.length; i += STEP) {
    let p = 0;
    for (let j = i; j < Math.min(i + STEP, s.length); j++) p = Math.max(p, Math.abs(s[j]));
    rows.push(p > 0 ? Math.round(20 * Math.log10(p)) : -99);
  }
  console.log(`${f} (${(s.length / RATE).toFixed(3)} s):`);
  console.log(rows.map((db, k) => `${String(k * 10).padStart(4)}ms ${String(db).padStart(4)} ${'#'.repeat(Math.max(0, 60 + db) >> 1)}`).join('\n'));
}
