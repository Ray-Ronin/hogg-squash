// A6: builds the game's sound files from the picked ElevenLabs takes (audio/elevenlabs/a6/), into
// public/hogg-squash/assets/sfx/. Run from the repo root: node audio/make-sfx.mjs <path to ffmpeg.exe>
// Each output: decoded to mono 44.1 kHz (optionally pitched by resampling, which also shortens or lengthens it),
// cut to start on its attack (the first sample within ATTACK_DB of its peak, so a hit sounds on its frame),
// cut where it fades below TAIL_DB under its peak (or at maxLen), faded in over 1 ms and out over the last
// FADE_OUT s, raised or lowered to a -1 dBFS peak, and encoded as MP3 (mono, 96 kbit/s). How loud each sound
// plays against the others is set by its "level" in sfx.json, not here.
import { execFileSync } from 'node:child_process';
import { statSync } from 'node:fs';
import { join } from 'node:path';

const FFMPEG = process.argv[2] ?? 'ffmpeg';
const SRC = 'audio/elevenlabs/a6';
const OUT = 'public/hogg-squash/assets/sfx';
const RATE = 44100;
const ATTACK_DB = -24, TAIL_DB = -45, PEAK_DB = -1, FADE_IN = 0.001, FADE_OUT = 0.04;

/** @type {{ out: string, src: string, pitch?: number, maxLen: number }[]} */
const OUTPUTS = [
  { out: 'hit-1.mp3', src: 'hit-r2_H4_jSKxIh9SYiD4ROxbRwTe.mp3', maxLen: 0.25 },
  { out: 'hit-soft-1.mp3', src: 'hit-r2_H4_jSKxIh9SYiD4ROxbRwTe.mp3', pitch: 0.94, maxLen: 0.25 },
  { out: 'serve-1.mp3', src: 'hit-r2_H4_jSKxIh9SYiD4ROxbRwTe.mp3', pitch: 1.04, maxLen: 0.25 },
  { out: 'hit-dive-1.mp3', src: 'hit-r2_H4_jSKxIh9SYiD4ROxbRwTe.mp3', pitch: 0.97, maxLen: 0.25 },
  { out: 'swing-1.mp3', src: 'swing-soft_A_bBL7Z7vSC1WuVRBI58q9.mp3', maxLen: 0.4 },
  { out: 'bounce-1.mp3', src: 'floor_A_dUJyFKb75zlCoAUk7wM5.mp3', maxLen: 0.2 },
  { out: 'glass-1.mp3', src: 'glass_A_mofdFWbqJkFT6VTGRKxk.mp3', maxLen: 0.25 },
  { out: 'tin-1.mp3', src: 'tin_B_Wjn49hNHQLprprDstS4x.mp3', maxLen: 0.35 },
  { out: 'out-1.mp3', src: 'out_A_2EqXxAjOaLoe0E7wgGX6.mp3', maxLen: 0.42 },
  { out: 'point-1.mp3', src: 'point_B_vTdFYit140ISv3Halfbf.mp3', maxLen: 0.5 },
  { out: 'game-1.mp3', src: 'game_B_Ol33WoMRPVk3ebJKuXBB.mp3', maxLen: 1.48 },
];

const db = (/** @type {number} */ x) => 20 * Math.log10(x);
const amp = (/** @type {number} */ d) => 10 ** (d / 20);

for (const o of OUTPUTS) {
  const filter = o.pitch ? `asetrate=${Math.round(RATE * o.pitch)},aresample=${RATE}` : 'anull';
  const raw = execFileSync(FFMPEG, ['-v', 'error', '-i', join(SRC, o.src), '-af', filter, '-ac', '1', '-ar', String(RATE), '-f', 'f32le', '-'],
    { maxBuffer: 1 << 26 });
  const s = new Float32Array(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.length));
  let peak = 0;
  for (const v of s) peak = Math.max(peak, Math.abs(v));

  const start = s.findIndex(v => Math.abs(v) >= peak * amp(ATTACK_DB));
  let end = start;
  for (let i = start; i < s.length; i++) if (Math.abs(s[i]) >= peak * amp(TAIL_DB)) end = i + 1;
  end = Math.min(end, start + Math.round(o.maxLen * RATE));

  const cut = s.slice(start, end);
  const gain = amp(PEAK_DB) / peak, fin = Math.round(FADE_IN * RATE), fout = Math.min(Math.round(FADE_OUT * RATE), cut.length >> 2);
  let sq = 0;
  for (let i = 0; i < cut.length; i++) {
    let g = gain;
    if (i < fin) g *= i / fin;
    const left = cut.length - 1 - i;
    if (left < fout) g *= left / fout;
    cut[i] *= g;
    sq += cut[i] * cut[i];
  }

  execFileSync(FFMPEG, ['-v', 'error', '-y', '-f', 'f32le', '-ar', String(RATE), '-ac', '1', '-i', '-',
    '-c:a', 'libmp3lame', '-b:a', '96k', join(OUT, o.out)], { input: Buffer.from(cut.buffer) });
  console.log(`${o.out.padEnd(16)} from ${o.src.split('_')[0].padEnd(10)} start ${(start / RATE).toFixed(3)} s, length ${(cut.length / RATE).toFixed(3)} s,`
    + ` raw peak ${db(peak).toFixed(1)} dB, RMS ${db(Math.sqrt(sq / cut.length)).toFixed(1)} dB, ${statSync(join(OUT, o.out)).size} bytes`);
}
