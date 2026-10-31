// @ts-check
// Placeholder sounds made in code (S13): one for every sound name in sounds.js, so the game has sound before A6's
// files exist. Each is a short recipe of noise bursts and tones, rendered straight into samples (no Web Audio nodes,
// no files, no licence), so Node can test them (test/audio.test.js). A file listed in assets/sfx/sfx.json replaces
// the placeholder of the same name (audio.js).
// The noise uses its own little random generator with a fixed seed, so a placeholder sounds the same every time and
// nothing here touches the sim's random numbers.

/**
 * One layer of a sound. All times in seconds, frequencies in Hz; layers start together unless `at` delays one.
 *  tone: a wave sliding from f to f2 (exponentially), with an attack and an exponential decay
 *  noise: white noise through a one-pole low-pass at `lp` (and a high-pass at `hp`), with an attack and a decay
 * @typedef {(
 *   { kind: 'tone', wave: 'sine' | 'triangle' | 'square', f: number, f2?: number, dur: number, gain: number,
 *     attack?: number, decay?: number, at?: number } |
 *   { kind: 'noise', lp: number, hp?: number, dur: number, gain: number, attack?: number, decay?: number, at?: number }
 * )} Layer
 */

/** A run of notes for the jingles: [frequency, length] each, played one after another as triangle tones. @param {[number, number][]} notes @param {number} gain @returns {Layer[]} */
function notes(notes, gain) {
  let at = 0;
  return notes.map(([f, dur]) => {
    const l = /** @type {Layer} */ ({ kind: 'tone', wave: 'triangle', f, dur: dur * 1.6, gain, attack: 0.004, decay: dur * 0.6, at });
    at += dur;
    return l;
  });
}

// note frequencies for the jingles and menu blips
const C5 = 523.25, E5 = 659.25, G5 = 783.99, C6 = 1046.5, E6 = 1318.5, A4 = 440, A5 = 880;

/** Every placeholder, by sound name (sounds.js's SOUNDS lists the same names). @type {Record<string, Layer[]>} */
export const RECIPES = {
  // the racket: a bright crack (HARD) or a duller pock (SOFT); the dive's stretch hit sits between; the serve as HARD
  'hit-hard': [
    { kind: 'noise', lp: 6000, hp: 900, dur: 0.05, gain: 0.8, decay: 0.012 },
    { kind: 'tone', wave: 'triangle', f: 1100, f2: 600, dur: 0.05, gain: 0.5, decay: 0.015 },
  ],
  'hit-soft': [
    { kind: 'noise', lp: 2500, hp: 400, dur: 0.04, gain: 0.5, decay: 0.01 },
    { kind: 'tone', wave: 'sine', f: 700, f2: 420, dur: 0.05, gain: 0.45, decay: 0.015 },
  ],
  'hit-dive': [
    { kind: 'noise', lp: 3500, hp: 600, dur: 0.05, gain: 0.6, decay: 0.014 },
    { kind: 'tone', wave: 'triangle', f: 850, f2: 480, dur: 0.06, gain: 0.45, decay: 0.02 },
  ],
  serve: [
    { kind: 'noise', lp: 5000, hp: 800, dur: 0.05, gain: 0.7, decay: 0.012 },
    { kind: 'tone', wave: 'triangle', f: 950, f2: 560, dur: 0.05, gain: 0.5, decay: 0.016 },
  ],
  // a swing that finds nothing: a racket whoosh (noise swelling and fading)
  'swing-hard': [{ kind: 'noise', lp: 1800, hp: 500, dur: 0.18, gain: 0.35, attack: 0.07, decay: 0.04 }],
  'swing-soft': [{ kind: 'noise', lp: 1300, hp: 400, dur: 0.15, gain: 0.25, attack: 0.06, decay: 0.035 }],
  // the dive: a scuff and a thump as the player lunges
  dive: [
    { kind: 'noise', lp: 900, hp: 120, dur: 0.12, gain: 0.4, attack: 0.02, decay: 0.04 },
    { kind: 'tone', wave: 'sine', f: 110, f2: 60, dur: 0.12, gain: 0.5, decay: 0.04, at: 0.05 },
  ],
  // the ball: a hollow thock on the front wall, a lighter one on a side wall, a soft thud on the floor, a ring on
  // the back glass, a metallic clang on the tin and a low buzz for out
  'wall-front': [
    { kind: 'tone', wave: 'sine', f: 240, f2: 130, dur: 0.08, gain: 0.7, decay: 0.025 },
    { kind: 'noise', lp: 2000, hp: 200, dur: 0.025, gain: 0.35, decay: 0.006 },
  ],
  'wall-side': [
    { kind: 'tone', wave: 'sine', f: 320, f2: 190, dur: 0.06, gain: 0.5, decay: 0.02 },
    { kind: 'noise', lp: 2500, hp: 300, dur: 0.02, gain: 0.25, decay: 0.005 },
  ],
  floor: [
    { kind: 'tone', wave: 'sine', f: 160, f2: 85, dur: 0.06, gain: 0.55, decay: 0.02 },
    { kind: 'noise', lp: 1200, hp: 100, dur: 0.02, gain: 0.2, decay: 0.006 },
  ],
  glass: [
    { kind: 'tone', wave: 'sine', f: 1250, dur: 0.12, gain: 0.25, decay: 0.04 },
    { kind: 'tone', wave: 'sine', f: 1870, dur: 0.1, gain: 0.15, decay: 0.03 },
    { kind: 'noise', lp: 4000, hp: 1000, dur: 0.02, gain: 0.25, decay: 0.006 },
  ],
  tin: [
    { kind: 'tone', wave: 'square', f: 523, dur: 0.3, gain: 0.18, decay: 0.08 },
    { kind: 'tone', wave: 'square', f: 787, dur: 0.3, gain: 0.12, decay: 0.07 },
    { kind: 'noise', lp: 5000, hp: 1500, dur: 0.03, gain: 0.4, decay: 0.008 },
  ],
  out: [{ kind: 'tone', wave: 'square', f: 110, f2: 98, dur: 0.22, gain: 0.2, attack: 0.005, decay: 0.08 }],
  // the callout's jingle when a point is won, and a longer one for GAME
  point: notes([[C5, 0.07], [E5, 0.07], [G5, 0.12]], 0.35),
  game: notes([[C5, 0.09], [E5, 0.09], [G5, 0.09], [C6, 0.09], [G5, 0.07], [C6, 0.3]], 0.35),
  // the menus: a tick to move, up for OK, down for back, a double blip when a key is remapped
  'menu-move': [{ kind: 'tone', wave: 'sine', f: A5, dur: 0.035, gain: 0.3, attack: 0.002, decay: 0.01 }],
  'menu-ok': notes([[E5, 0.045], [A5, 0.07]], 0.3),
  'menu-back': notes([[E5, 0.045], [A4, 0.07]], 0.3),
  'menu-key': notes([[C6, 0.04], [E6, 0.06]], 0.28),
  // a shoe squeak (S14b): a high rubbery chirp, bending up, with a little scuff
  squeak: [
    { kind: 'tone', wave: 'triangle', f: 1900, f2: 2600, dur: 0.09, gain: 0.3, attack: 0.008, decay: 0.05 },
    { kind: 'noise', lp: 5000, hp: 1500, dur: 0.05, gain: 0.15, attack: 0.005, decay: 0.02 },
  ],
};

/** The seeded noise: a 32-bit xorshift, giving -1…1. @param {number} seed */
function noiseSource(seed) {
  let s = seed | 0 || 1;
  return () => {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
    return (s | 0) / 0x80000000;
  };
}

/** A one-pole filter's coefficient for a cut-off frequency. @param {number} f @param {number} rate */
const pole = (f, rate) => 1 - Math.exp(-2 * Math.PI * f / rate);

/**
 * Render one placeholder into samples (mono, -1…1).
 * @param {Layer[]} layers
 * @param {number} rate  samples per second (the audio context's)
 * @returns {Float32Array}
 */
export function render(layers, rate) {
  const length = Math.ceil(rate * Math.max(...layers.map(l => (l.at ?? 0) + l.dur)));
  const out = new Float32Array(length);
  layers.forEach((l, li) => {
    const start = Math.round((l.at ?? 0) * rate), n = Math.round(l.dur * rate);
    const attack = (l.attack ?? 0.001) * rate, decay = (l.decay ?? l.dur / 4) * rate;
    const fade = Math.min(n, Math.round(0.004 * rate));          // a short fade at the end, so nothing clicks
    const env = (/** @type {number} */ i) =>
      Math.min(1, i / attack) * Math.exp(-Math.max(0, i - attack) / decay) * Math.min(1, (n - i) / fade);
    if (l.kind === 'tone') {
      const f2 = l.f2 ?? l.f;
      let phase = 0;
      for (let i = 0; i < n && start + i < length; i++) {
        const f = l.f * Math.pow(f2 / l.f, i / n);
        phase = (phase + f / rate) % 1;
        const w = l.wave === 'sine' ? Math.sin(2 * Math.PI * phase)
          : l.wave === 'square' ? (phase < 0.5 ? 1 : -1)
            : 1 - 4 * Math.abs(phase - 0.5);
        out[start + i] += w * l.gain * env(i);
      }
    } else {
      const rnd = noiseSource(0x9e3779b1 + li * 7919);
      const a = pole(l.lp, rate), b = l.hp ? pole(l.hp, rate) : 0;
      let low = 0, high = 0;
      for (let i = 0; i < n && start + i < length; i++) {
        low += a * (rnd() - low);
        high += b * (low - high);
        out[start + i] += (low - high) * l.gain * 2 * env(i);
      }
    }
  });
  let peak = 0;                                                  // never clip: scale down a sound that peaks over 0.9
  for (const v of out) peak = Math.max(peak, Math.abs(v));
  if (peak > 0.9) for (let i = 0; i < length; i++) out[i] *= 0.9 / peak;
  return out;
}
