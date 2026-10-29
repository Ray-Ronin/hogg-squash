// Builds listen.html: every raw A6 take in this folder, grouped by sound name, to play and pick from. Each take
// plays from a copy in preview/ raised to a -1 dB peak (so they're judged by sound, not loudness); its raw peak is
// shown when it's very quiet. listen.html and preview/ are made here and not committed.
// Run from the repo root: node audio/elevenlabs/a6/make-listen.mjs <path to ffmpeg.exe>
// Then serve this folder (e.g. npx http-server audio/elevenlabs/a6 -p 8090) and open /listen.html:
// opened as a file, the browser may not play the audio.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const FFMPEG = process.argv[2] ?? 'ffmpeg';
const dir = dirname(fileURLToPath(import.meta.url));
const ORDER = ['hit-r2', 'hit-hard', 'hit-soft', 'hit-dive', 'serve', 'swing-hard', 'swing-soft', 'dive', 'squeak',
  'wall-front', 'wall-side', 'floor', 'glass', 'tin', 'out', 'point', 'game',
  'menu-move', 'menu-ok', 'menu-back', 'menu-key'];

/** A file's peak in dB, from ffmpeg's volumedetect. @param {string} f */
function peakOf(f) {
  let log = '';
  try { execFileSync(FFMPEG, ['-hide_banner', '-i', f, '-af', 'volumedetect', '-f', 'null', '-'], { stdio: ['ignore', 'ignore', 'pipe'] }); }
  catch (e) { log = String(/** @type {any} */ (e).stderr); }
  return Number(/max_volume: (-?[\d.]+)/.exec(log)?.[1] ?? 0);
}

mkdirSync(join(dir, 'preview'), { recursive: true });
/** @type {Map<string, string[]>} */
const groups = new Map(ORDER.map(n => [n, []]));
/** @type {Record<string, number>} */
const peaks = {};
for (const f of readdirSync(dir).filter(f => /^[a-z0-9-]+_[A-Z]\d?_\w+\.mp3$/.test(f)).sort()) {
  const name = f.split('_')[0];
  if (!groups.has(name)) groups.set(name, []);
  groups.get(name)?.push(f);
  peaks[f] = peakOf(join(dir, f));
  execFileSync(FFMPEG, ['-v', 'error', '-y', '-i', join(dir, f), '-af', `volume=${(-1 - peaks[f]).toFixed(1)}dB`, '-ac', '1', '-b:a', '96k',
    join(dir, 'preview', f)]);
}

const rows = [...groups].map(([name, files]) => `
  <section><h2>${name}</h2>${files.length ? files.map(f => {
    const [, prompt, id] = f.replace('.mp3', '').split('_');
    const note = peaks[f] < -30 ? ` <b>very quiet raw (peak ${peaks[f]} dB): may be noisy once raised</b>` : '';
    return `<div class="take"><button data-src="preview/${f}">▶ ${prompt} · ${id.slice(0, 4)}</button><code>${f}</code>${note}</div>`;
  }).join('') : '<p>(none)</p>'}</section>`).join('');

writeFileSync(join(dir, 'listen.html'), `<!doctype html>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>A6 takes</title>
<style>
  :root { color-scheme: light dark; --bg: #fff; --fg: #111; --muted: #666; --accent: #b3122e; }
  @media (prefers-color-scheme: dark) { :root { --bg: #151515; --fg: #eee; --muted: #999; } }
  body { background: var(--bg); color: var(--fg); font: 15px/1.4 system-ui, sans-serif; margin: 0 auto; padding: 16px; max-width: 760px; }
  h1 { font-size: 20px; } h2 { font-size: 16px; margin: 18px 0 6px; color: var(--accent); }
  .take { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin: 4px 0; }
  button { font: inherit; padding: 6px 12px; min-width: 110px; text-align: left; cursor: pointer; }
  code { color: var(--muted); font-size: 12px; word-break: break-all; }
</style>
<h1>A6 sound takes</h1>
<p>Click to play (space or Enter replays the focused one). Letters are the prompts; the four characters tell takes apart. Every take plays raised to the same peak level, so judge the sound, not the loudness (the final mix is set later). Tell Claude which ones you like, and which sounds need another try.</p>
${rows}
<script>
  let a = null;
  document.addEventListener('click', e => {
    const b = e.target.closest('button[data-src]'); if (!b) return;
    if (a) a.pause(); a = new Audio(b.dataset.src); a.play();
  });
</script>
`);
console.log('wrote listen.html:', Object.keys(peaks).length, 'takes');
