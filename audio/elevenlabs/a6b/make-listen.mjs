// Builds listen.html: every raw A6b take in this folder, plus A6's never-heard soft-UI menu takes (style A), to play
// and pick from. Like A6's page, each take plays from a copy in preview/ raised to a -1 dB peak, and very quiet raw
// takes are flagged. Menu takes are grouped by style (the prompt letter). listen.html and preview/ aren't committed.
// Run from the repo root: node audio/elevenlabs/a6b/make-listen.mjs <path to ffmpeg.exe>
// Then serve this folder (e.g. npx http-server audio/elevenlabs/a6b -p 8090) and open /listen.html.
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const FFMPEG = process.argv[2] ?? 'ffmpeg';
const dir = dirname(fileURLToPath(import.meta.url));
const A6 = join(dir, '..', 'a6');
const TAKE = /^[a-z0-9-]+_[A-Z]\d?_\w+\.mp3$/;
const STYLES = { A: 'style A: soft UI clicks (made in A6)', B: 'style B: retro bleeps', C: 'style C: sporty taps' };

/** A file's peak in dB, from ffmpeg's volumedetect. @param {string} f */
function peakOf(f) {
  // spawnSync, not execFileSync: ffmpeg prints volumedetect on stderr even when it succeeds.
  const log = spawnSync(FFMPEG, ['-hide_banner', '-i', f, '-af', 'volumedetect', '-f', 'null', '-'], { encoding: 'utf8' }).stderr;
  return Number(/max_volume: (-?[\d.]+)/.exec(log)?.[1] ?? 0);
}

const takes = [
  ...readdirSync(dir).filter(f => TAKE.test(f)).map(f => ({ f, path: join(dir, f) })),
  ...readdirSync(A6).filter(f => TAKE.test(f) && f.startsWith('menu-')).map(f => ({ f, path: join(A6, f) })),
].sort((a, b) => a.f.localeCompare(b.f));

mkdirSync(join(dir, 'preview'), { recursive: true });
/** @type {Map<string, string[]>} */
const groups = new Map([['dive', []], ['squeak', []], ...Object.values(STYLES).map(s => /** @type {[string, string[]]} */ ([s, []]))]);
/** @type {Record<string, number>} */
const peaks = {};
for (const { f, path } of takes) {
  const [name, prompt] = f.split('_');
  const group = name.startsWith('menu-') ? STYLES[/** @type {'A' | 'B' | 'C'} */ (prompt)] : name;
  if (!groups.has(group)) groups.set(group, []);
  groups.get(group)?.push(f);
  peaks[f] = peakOf(path);
  execFileSync(FFMPEG, ['-v', 'error', '-y', '-i', path, '-af', `volume=${(-1 - peaks[f]).toFixed(1)}dB`, '-ac', '1', '-b:a', '96k',
    join(dir, 'preview', f)]);
}

const rows = [...groups].map(([group, files]) => `
  <section><h2>${group}</h2>${files.length ? files.map(f => {
    const [name, prompt, id] = f.replace('.mp3', '').split('_');
    const label = name.startsWith('menu-') ? name.replace('menu-', '') : prompt;
    const note = peaks[f] < -30 ? ` <b>very quiet raw (peak ${peaks[f]} dB): may be noisy once raised</b>` : '';
    return `<div class="take"><button data-src="preview/${f}">▶ ${label} · ${id.slice(0, 4)}</button><code>${f}</code>${note}</div>`;
  }).join('') : '<p>(none)</p>'}</section>`).join('');

writeFileSync(join(dir, 'listen.html'), `<!doctype html>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>A6b takes</title>
<style>
  :root { color-scheme: light dark; --bg: #fff; --fg: #111; --muted: #666; --accent: #b3122e; }
  @media (prefers-color-scheme: dark) { :root { --bg: #151515; --fg: #eee; --muted: #999; } }
  body { background: var(--bg); color: var(--fg); font: 15px/1.4 system-ui, sans-serif; margin: 0 auto; padding: 16px; max-width: 760px; }
  h1 { font-size: 20px; } h2 { font-size: 16px; margin: 18px 0 6px; color: var(--accent); }
  .take { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin: 4px 0; }
  button { font: inherit; padding: 6px 12px; min-width: 110px; text-align: left; cursor: pointer; }
  code { color: var(--muted); font-size: 12px; word-break: break-all; }
</style>
<h1>A6b sound takes</h1>
<p>Click to play. Every take plays raised to the same peak level, so judge the sound, not the loudness (the mix is set later). Takes are untrimmed, so some have silence before the sound.
For the dive and the squeak, pick a prompt (or none). For the menus, pick a style (or keep the in-code bleeps you hear in the game now); style A has all four sounds already, B and C only move and OK.</p>
${rows}
<script>
  let a = null;
  document.addEventListener('click', e => {
    const b = e.target.closest('button[data-src]'); if (!b) return;
    if (a) a.pause(); a = new Audio(b.dataset.src); a.play();
  });
</script>
`);
console.log('wrote listen.html:', takes.length, 'takes;', Object.entries(peaks).map(([f, p]) => `${f.split('_').slice(0, 2).join('_')} ${p}`).join(', '));
