// @ts-check
// The sound engine (S13; docs/decisions.md, "Audio"): one Web Audio context, a master gain and an Effects gain.
//  - The first sound: browsers allow sound only after a key press, click or tap on the page, and a gamepad button
//    doesn't count. The context is made at load, so it starts suspended (and is suspended at once in a browser that
//    let it start), and is resumed inside the first keydown, pointerdown or touchend handler (the listeners stay, so
//    a later tap can resume it again where a browser needs that). Until then nothing plays.
//  - Pause: main.js says each step whether sound should be running (setActive): not on the pause menu, with the
//    window blurred, the tab hidden or the portrait warning up, nor with Sound off or the Effects level at Off. The
//    context is suspended then, and resumed with play. Sounds asked for while it isn't running are dropped, not
//    queued.
//  - Sounds: each name (sounds.js) plays from a file listed in assets/sfx/sfx.json (A6), else from its placeholder
//    made in code (synth.js), so the game works before the files exist. sfx.json:
//      { "version": 1, "sounds": { "<name>": { "files": ["<name>-1.mp3", …], "level": 0.8 }, … } }
//    files are relative to sfx.json, each fetched and decoded once however many names share it (S14); more than one
//    is variants (one picked at random each time, never the same twice running, with Math.random: never the sim's
//    random numbers); level (0–1, default 1) is that sound's share of the Effects level; rate (default 1, S14) its
//    pitch, so names sharing a file can differ. The racket's and the ball's pitch also varies ±3% each time, and
//    play takes a volume and a pan from sounds.js's cuesFor. A limiter on the master stops many sounds clipping.
//  - ?sound=log logs every sound by name as it plays (its volume, pan, rate, the audio clock, page time, the
//    context's latency and when it's heard, where the browser says), and the context's state changes, for checking
//    without hearing; ?sound=off starts with Sound off (main.js).
//  - iPhone: iOS mutes Web Audio while the silent switch is on. That's respected (nothing is changed); setting
//    navigator.audioSession.type = 'playback' would make the game sound through it (the owner's call).
// The settings (the Effects level and Sound on/off) are saved in localStorage beside the keys, with the same handling
// of blocked storage as input/keymap.js. Everything up to createAudio is plain functions, so Node can test it.
import { SOUNDS, SHAPE, VARIED, pickVariant } from './sounds.js';
import { RECIPES, render } from './synth.js';

/** @typedef {import('./sounds.js').SoundName} SoundName */
/** @typedef {import('../input/keymap.js').Store} Store */
/** The sound settings: the Effects level (0 = Off, 1–10) and Sound on/off (the pause menu, the speaker button). @typedef {{ level: number, on: boolean }} SoundSettings */

/** The Effects level's range and default (5 from S14b, the owner's call at CP-G; it was 7). A saved level is kept. */
export const SOUND_LEVELS = { MAX: 10, DEFAULT: 5 };
/** Where the settings are kept, and the shape's version. */
export const SOUND_KEY = 'hogg-squash.sound';
const SOUND_VERSION = 1;

/** A level as a whole number from 0 (Off) to 10; anything that isn't a number is the default. @param {unknown} v */
export function clampLevel(v) {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
  return Number.isFinite(n) ? Math.min(SOUND_LEVELS.MAX, Math.max(0, Math.round(n))) : SOUND_LEVELS.DEFAULT;
}

/** @returns {SoundSettings} */
export function defaultSound() {
  return { level: SOUND_LEVELS.DEFAULT, on: true };
}

/** The Effects gain for a level: a square curve, so the steps sound even (7 is about half the loudness of 10). @param {number} level */
export function levelGain(level) {
  return (clampLevel(level) / SOUND_LEVELS.MAX) ** 2;
}

/**
 * The saved sound settings, or the defaults (also if storage is blocked, throws or holds something damaged).
 * @param {Store | null} store @returns {SoundSettings}
 */
export function loadSound(store) {
  try {
    const raw = store?.getItem(SOUND_KEY);
    if (!raw) return defaultSound();
    const data = JSON.parse(raw);
    if (data?.version !== SOUND_VERSION) return defaultSound();
    return { level: clampLevel(data.level), on: data.on !== false };
  } catch {
    return defaultSound();
  }
}

/**
 * Keep the sound settings for next time. False if storage is blocked or full (they then last until the page closes).
 * @param {Store | null} store @param {SoundSettings} s
 */
export function saveSound(store, s) {
  if (!store) return false;
  try {
    store.setItem(SOUND_KEY, JSON.stringify({ version: SOUND_VERSION, level: clampLevel(s.level), on: s.on }));
    return true;
  } catch {
    return false;
  }
}

/** A sound's playback rate in sfx.json (its pitch: 1 as recorded) is kept within this. */
export const RATE_RANGE = { MIN: 0.5, MAX: 2 };

/** One sound in sfx.json, checked. @typedef {{ files: string[], level: number, rate: number }} SfxEntry */

/**
 * sfx.json's sounds, checked: known names only, each with at least one file name (strings), a level of 0–1 and a
 * rate (S14: its pitch, so one file can sound different for two names; default 1). Problems are returned as
 * warnings, not thrown.
 * @param {unknown} json
 * @returns {{ sounds: Map<SoundName, SfxEntry>, warnings: string[] }}
 */
export function parseSfx(json) {
  /** @type {Map<SoundName, SfxEntry>} */
  const sounds = new Map();
  const warnings = [];
  const list = /** @type {any} */ (json)?.sounds;
  if (!list || typeof list !== 'object') return { sounds, warnings: ['sfx.json has no "sounds"'] };
  for (const [name, entry] of Object.entries(list)) {
    if (!(/** @type {readonly string[]} */ (SOUNDS)).includes(name)) { warnings.push(`unknown sound "${name}"`); continue; }
    const files = Array.isArray(entry?.files) ? entry.files.filter((/** @type {unknown} */ f) => typeof f === 'string' && f) : [];
    if (!files.length) { warnings.push(`"${name}" lists no files`); continue; }
    const level = typeof entry.level === 'number' && Number.isFinite(entry.level) ? Math.min(1, Math.max(0, entry.level)) : 1;
    const rate = typeof entry.rate === 'number' && Number.isFinite(entry.rate)
      ? Math.min(RATE_RANGE.MAX, Math.max(RATE_RANGE.MIN, entry.rate)) : 1;
    sounds.set(/** @type {SoundName} */ (name), { files, level, rate });
  }
  return { sounds, warnings };
}

/**
 * @typedef {object} Audio
 * @property {() => AudioContextState | 'none'} state  the context's state ('none' where the browser has no Web Audio)
 * @property {() => boolean} unlocked  a key, click or tap has happened, so the browser allows sound
 * @property {(on: boolean) => void} setActive  whether sound should be running now (see above)
 * @property {(level: number) => void} setLevel  the Effects level, 0–10
 * @property {(name: SoundName, cue?: { gain?: number, pan?: number }) => void} play  a sound, with a volume (0–1, on
 *   top of its level) and a pan (-1 … 1) from sounds.js's cuesFor
 * @property {(url: string) => Promise<void>} load  read sfx.json and decode its files (placeholders stay for the rest)
 */

/**
 * The sound engine. Call once, at load.
 * @param {{ log?: boolean, target?: Window }} [opts]
 * @returns {Audio}
 */
export function createAudio({ log = false, target = window } = {}) {
  const AC = /** @type {any} */ (target).AudioContext ?? /** @type {any} */ (target).webkitAudioContext;
  /** @type {AudioContext | null} */
  const ctx = AC ? new AC({ latencyHint: 'interactive' }) : null;
  // resuming: a resume is under way (a sound started now plays as it starts, so the first key is heard)
  let unlocked = false, want = true, busy = false, resuming = false;
  /** The sounds by name: their buffers (variants), level, rate, whether from a file, and the variant played last.
   * @type {Map<SoundName, { buffers: AudioBuffer[], level: number, rate: number, file: boolean, last: number }>} */
  const bank = new Map();
  /** @type {GainNode | null} */
  let effects = null;

  if (ctx) {
    // a limiter after the master, so many sounds at once don't clip: it only acts near full scale
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -3;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.002;
    limiter.release.value = 0.1;
    limiter.connect(ctx.destination);
    const master = ctx.createGain();
    master.connect(limiter);
    effects = ctx.createGain();
    effects.connect(master);
    for (const name of SOUNDS) {
      const samples = render(RECIPES[name], ctx.sampleRate);
      const buf = ctx.createBuffer(1, samples.length, ctx.sampleRate);
      buf.getChannelData(0).set(samples);
      bank.set(name, { buffers: [buf], level: 1, rate: 1, file: false, last: -1 });
    }
    if (log) ctx.addEventListener('statechange', () => console.log(`[sound] context ${ctx.state}`));
    // the first key, click or tap (and any later one) may start it; a gamepad can't
    const gesture = () => { unlocked = true; sync(); };
    for (const type of ['keydown', 'pointerdown', 'touchend']) target.addEventListener(type, gesture, { capture: true });
  }

  /** Resume or suspend to match `want`, one change at a time. Before the first key, click or tap it's suspended, even
   * in a browser that would let it run (an app's web view may have no such rule). */
  function sync() {
    if (!ctx || busy) return;
    const on = want && unlocked, running = ctx.state === 'running';
    if (on === running || (!running && !unlocked)) return;
    busy = true;
    resuming = on;
    (on ? ctx.resume() : ctx.suspend()).catch(() => {}).finally(() => { busy = resuming = false; sync(); });
  }
  sync();

  return {
    state: () => ctx?.state ?? 'none',
    unlocked: () => unlocked,
    setActive(on) {
      want = on;
      sync();
    },
    setLevel(level) {
      if (effects) effects.gain.value = levelGain(level);
    },
    play(name, { gain = 1, pan = 0 } = {}) {
      const s = bank.get(name);
      if (!ctx || !effects || !s || !want || !unlocked || (ctx.state !== 'running' && !resuming)) return;
      const src = ctx.createBufferSource();
      s.last = pickVariant(s.buffers.length, s.last, Math.random);
      src.buffer = s.buffers[s.last];
      const vary = VARIED.has(name) ? 1 + SHAPE.PITCH * (2 * Math.random() - 1) : 1;
      src.playbackRate.value = s.rate * vary;
      let out = /** @type {AudioNode} */ (effects);
      if (pan && ctx.createStereoPanner) {
        const p = ctx.createStereoPanner();
        p.pan.value = Math.max(-1, Math.min(1, pan));
        p.connect(out);
        out = p;
      }
      if (s.level * gain !== 1) {
        const g = ctx.createGain();
        g.gain.value = s.level * gain;
        g.connect(out);
        out = g;
      }
      src.connect(out);
      src.start();
      if (log) {
        // when it's heard: the output timestamp maps the audio clock to page time (where the browser has it)
        const now = performance.now(), ts = ctx.getOutputTimestamp?.();
        const heard = ts?.contextTime !== undefined && ts.performanceTime
          ? `, heard in ${(ts.performanceTime + (ctx.currentTime - ts.contextTime) * 1000 - now).toFixed(0)} ms` : '';
        const lat = `latency ${((ctx.baseLatency ?? 0) * 1000).toFixed(0)}+${((/** @type {any} */ (ctx).outputLatency ?? 0) * 1000).toFixed(0)} ms`;
        console.log(`[sound] ${name}${s.file ? '' : ' (placeholder)'} x${(s.level * gain).toFixed(2)} pan ${pan.toFixed(2)} rate ${(s.rate * vary).toFixed(3)} at ${ctx.currentTime.toFixed(3)} s, ${now.toFixed(0)} ms (${lat}${heard})`);
      }
    },
    async load(url) {
      if (!ctx) return;
      let json;
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`${res.status}`);
        json = await res.json();
      } catch (e) {
        console.warn(`Hogg Squash: ${url} did not load, so every sound is its placeholder.`, e);
        return;
      }
      const { sounds, warnings } = parseSfx(json);
      for (const w of warnings) console.warn(`Hogg Squash: ${url}: ${w}`);
      // each file is fetched and decoded once, however many names share it (one bounce for the floor and both walls)
      /** @type {Map<string, Promise<AudioBuffer>>} */
      const decoded = new Map();
      const base = new URL(url, location.href);
      /** @param {string} f */
      const fileBuffer = f => {
        const href = new URL(f, base).href;
        let p = decoded.get(href);
        if (!p) {
          p = fetch(href).then(async res => {
            if (!res.ok) throw new Error(`${f}: ${res.status}`);
            return ctx.decodeAudioData(await res.arrayBuffer());
          });
          decoded.set(href, p);
        }
        return p;
      };
      await Promise.all([...sounds].map(async ([name, { files, level, rate }]) => {
        try {
          const buffers = await Promise.all(files.map(fileBuffer));
          bank.set(name, { buffers, level, rate, file: true, last: -1 });
        } catch (e) {
          console.warn(`Hogg Squash: the sound "${name}" did not load, so its placeholder plays.`, e);
        }
      }));
    },
  };
}
