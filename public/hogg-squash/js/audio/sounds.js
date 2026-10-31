// @ts-check
// Which sound each thing that happens makes (S13): the sim's events (stepWorld's, read beside effects.add in main.js,
// as render/effects.js reads them) and the menus' moves. One table of names: A6's files in assets/sfx/sfx.json
// replace the placeholders (synth.js) by these names, with no code change. Pure: no audio, so Node can test that
// every event and rally reason is covered (test/audio.test.js). Sound never changes the sim.
//
//  hit: by the button (HARD / SOFT) and the contact type (a dive's stretch hit has its own sound)
//  swing: a miss whooshes (by the button); a dive that reaches makes the lunge sound; a swing that reaches is silent
//    (its hit sounds on the contact frame)
//  serveSwing: silent (the serve sounds on the launch, 'serve', SERVE_WINDUP frames later)
//  ball: front wall, side wall, floor, back glass; on the step a rally ends, its reason's sound replaces the ball's
//    (the tin's clang instead of the front wall, a buzz for out)
//  rally: the callout's jingle ('point'); match: GAME's jingle ('game'). Nothing else happens in the point freeze.
//  newRally, rematch: silent
// cuesFor (S14) adds how each sound is shaped by what happened: a bounce's volume by the ball's speed and depth, a
// small pan by the ball's x; audio.js varies the pitch of VARIED and picks the variant (pickVariant).
// squeakCues (S14b) adds a shoe squeak to some hits that come off a sharp stop, from the players' recent positions
// (main.js keeps them, read only; no event in the sim).

/** Every sound name: the placeholders in synth.js and the names sfx.json uses. */
export const SOUNDS = /** @type {const} */ ([
  'hit-hard', 'hit-soft', 'hit-dive', 'serve', 'swing-hard', 'swing-soft', 'dive',
  'wall-front', 'wall-side', 'floor', 'glass', 'tin', 'out',
  'point', 'game',
  'menu-move', 'menu-ok', 'menu-back', 'menu-key',
  'squeak',
]);
/** @typedef {typeof SOUNDS[number]} SoundName */
/** @typedef {import('../sim/world.js').WorldEvent} WorldEvent */

/** The ball's collisions (squash-physics.js's BallEvent). @type {Record<import('../squash-physics.js').BallEvent, SoundName>} */
export const BALL_SOUNDS = { frontWall: 'wall-front', sideWall: 'wall-side', floor: 'floor', backGlass: 'glass' };

/** A rally reason's sound, in place of the ball's on that step (null: the ball's own sound stands). @type {Record<import('../sim/rally.js').RallyReason, SoundName | null>} */
export const REASON_SOUNDS = { tin: 'tin', out: 'out', down: null, notUp: null };

/** @typedef {import('../sim/player.js').SwingEvent} SwingEvent */
/** Each event type's sound (null: silent). @type {Record<WorldEvent['type'], (e: any) => SoundName | null>} */
export const EVENT_SOUNDS = {
  hit: (/** @type {SwingEvent} */ e) => (e.kind === 'dive' ? 'hit-dive' : e.button === 'hard' ? 'hit-hard' : 'hit-soft'),
  swing: (/** @type {SwingEvent} */ e) =>
    (!e.reach ? (e.button === 'hard' ? 'swing-hard' : 'swing-soft') : e.kind === 'dive' ? 'dive' : null),
  serveSwing: () => null,
  serve: () => 'serve',
  ball: (/** @type {{ ev: string }} */ e) => BALL_SOUNDS[/** @type {keyof typeof BALL_SOUNDS} */ (e.ev)] ?? null,
  rally: () => 'point',
  match: () => 'game',
  newRally: () => null,
  rematch: () => null,
};

/**
 * The sounds one sim step's events make, in order, each with the event that made it (for cuesFor).
 * @param {WorldEvent[]} events
 * @returns {{ name: SoundName, e: WorldEvent }[]}
 */
function picked(events) {
  /** @type {{ name: SoundName, e: WorldEvent }[]} */
  const out = [];
  let ballAt = -1;                                     // where this step's ball sound is (a rally reason replaces it)
  for (const e of events) {
    if (e.type === 'rally') {
      const r = REASON_SOUNDS[e.reason];
      if (r && ballAt >= 0) out[ballAt] = { name: r, e: out[ballAt].e };   // the tin or out, where the ball was
      else if (r) out.push({ name: r, e });
    }
    const name = EVENT_SOUNDS[e.type](e);
    if (!name) continue;
    if (e.type === 'ball') ballAt = out.length;
    out.push({ name, e });
  }
  return out;
}

/**
 * The sounds one sim step's events make, in order.
 * @param {WorldEvent[]} events
 * @returns {SoundName[]}
 */
export function soundsFor(events) {
  return picked(events).map(p => p.name);
}

/**
 * How a sound is shaped by what happened (S14):
 *  SPEED: a ball sound's volume follows the ball's speed (court units per frame, after the bounce): the square root
 *    of speed / FULL, down to MIN. Measured in CPU matches: front wall about 1.9–4.1 (median 2.6), floor 1.8–3.4,
 *    side walls up to 6.8, the back glass mostly about 1.4.
 *  BACK: a ball sound at the back wall (z = COURT.BACK) is this much quieter than one at the front wall (z = 0).
 *  PAN: left / right by the ball's x, ±PAN at the side walls. Hits and the serve pan by the ball too; the jingles
 *    (and a tin or out that came without a ball sound) sit in the middle at full level.
 *  PITCH: the VARIED names' pitch varies by up to ±PITCH each time (audio.js picks it, with Math.random).
 * HARD is louder than SOFT by their levels in sfx.json.
 */
export const SHAPE = { SPEED: { FULL: 4, MIN: 0.25 }, BACK: 0.25, PAN: 0.3, PITCH: 0.03 };

/** The sounds whose pitch varies: the racket and the ball. @type {ReadonlySet<SoundName>} */
export const VARIED = new Set(/** @type {SoundName[]} */ ([
  'hit-hard', 'hit-soft', 'hit-dive', 'serve', 'wall-front', 'wall-side', 'floor', 'glass', 'tin',
]));

/** One sound to play: its name, a volume (0–1, on top of its sfx.json level) and a pan (-1 left … 1 right).
 * @typedef {{ name: SoundName, gain: number, pan: number }} Cue */

/** The court's half-width and depth (COURT.SIDE, COURT.BACK in squash-physics.js). */
const SIDE = 144, BACK = 183;

/** @param {number} v @param {number} lo @param {number} hi */
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** A ball sound's volume for the ball's speed (units per frame). @param {number} speed */
export const speedGain = speed => Math.max(SHAPE.SPEED.MIN, Math.sqrt(clamp(speed / SHAPE.SPEED.FULL, 0, 1)));

/**
 * The sounds one sim step's events make, shaped by where and how fast the ball was.
 * @param {WorldEvent[]} events
 * @param {{ x: number, z: number, speed: number }} ball  the ball after the step (court units; speed per frame):
 *   the speed for the ball sounds, the place for the racket's (a ball event has its own place)
 * @returns {Cue[]}
 */
export function cuesFor(events, ball) {
  return picked(events).map(({ name, e }) => {
    if (e.type === 'rally' || e.type === 'match') return { name, gain: 1, pan: 0 };
    const at = e.type === 'ball' ? e : ball;
    const pan = SHAPE.PAN * clamp(at.x / SIDE, -1, 1);
    if (e.type !== 'ball') return { name, gain: 1, pan };
    return { name, gain: speedGain(ball.speed) * (1 - SHAPE.BACK * clamp(e.z / BACK, 0, 1)), pan };
  });
}

/**
 * Which variant to play: one at random, never the one played last time (when there are two or more).
 * @param {number} count  how many variants @param {number} last  the last one played (-1: none)
 * @param {() => number} random  0 ≤ r < 1 (Math.random: never the sim's random numbers)
 */
export function pickVariant(count, last, random) {
  if (count < 2) return 0;
  if (last < 0 || last >= count) return Math.floor(random() * count);
  const i = Math.floor(random() * (count - 1));       // one of the others
  return i >= last ? i + 1 : i;
}

/**
 * The shoe squeak (S14b; CP-G's call): when a player stops sharply or changes direction just before hitting, on about
 * one such hit in three. The swing plants the player from the press's own step (SWING.CONTACT = 7 frames before the
 * hit), so a hit always finds them still: a sharp stop is running (at least RUN court units a frame, at least FRAMES
 * frames) in the last RECENT frames up to the hit, which reaches 4 frames back before the press. A player who had already
 * stood still for that long (they got there early and waited) never squeaks; nor does a jump of more than JUMP a
 * frame (the players put back on their spots for a new rally). A turn before the press counts too: they were running.
 * The run is 2.5 a frame across and 1.25 deep (squash-physics.js's PLAYER), so RUN catches either.
 *  CHANCE: the share of sharp-stop hits that squeak (picked with Math.random in main.js, never the sim's numbers).
 * Panned by the player's x like the ball; its level in sfx.json keeps it under a SOFT hit.
 */
export const SQUEAK = { RECENT: 12, RUN: 1, FRAMES: 2, JUMP: 6, CHANCE: 1 / 3 };

/** A player's place after a sim step, in court units. @typedef {{ x: number, z: number }} Spot */

/**
 * Whether a hit comes off a sharp stop: the player ran in the last few frames and is still now.
 * @param {Spot[]} track  the player's places after each recent step, oldest first, the hit's step last
 */
export function sharpStop(track) {
  const n = track.length;
  if (n < 2) return false;
  const step = (/** @type {number} */ i) => Math.hypot(track[i].x - track[i - 1].x, track[i].z - track[i - 1].z);
  if (step(n - 1) >= SQUEAK.RUN) return false;              // still moving at the hit (never, while swinging)
  let ran = 0;
  for (let i = Math.max(1, n - SQUEAK.RECENT); i < n; i++) {
    const d = step(i);
    if (d >= SQUEAK.RUN && d <= SQUEAK.JUMP) ran++;
  }
  return ran >= SQUEAK.FRAMES;
}

/**
 * The squeaks one sim step's hits make.
 * @param {WorldEvent[]} events
 * @param {Spot[][]} tracks  each player's recent places (sharpStop's track), by side
 * @param {() => number} random  0 ≤ r < 1 (Math.random: never the sim's random numbers)
 * @returns {Cue[]}
 */
export function squeakCues(events, tracks, random) {
  /** @type {Cue[]} */
  const out = [];
  for (const e of events) {
    if (e.type !== 'hit') continue;
    const track = tracks[e.side];
    if (!track || !sharpStop(track) || random() >= SQUEAK.CHANCE) continue;
    out.push({ name: 'squeak', gain: 1, pan: SHAPE.PAN * clamp(track[track.length - 1].x / SIDE, -1, 1) });
  }
  return out;
}

/** The part of the screens' state a menu sound depends on. @typedef {{ screen: string, sel: number, listen: boolean }} MenuState */

/** @param {import('../ui/screens.js').Ui} ui @returns {MenuState} */
export const menuState = ui => ({ screen: ui.screen, sel: ui.sel, listen: ui.listen });

/**
 * The sound a menu move makes: back for a step back, OK for a step on (or anything done), a tick for a new
 * selection, nothing if nothing changed. Opening the pause menu is silent (the sound stops while paused).
 * @param {import('../ui/screens.js').Nav} nav
 * @param {MenuState} before
 * @param {MenuState} after
 * @param {import('../ui/screens.js').Effect} effect
 * @returns {SoundName | null}
 */
export function menuSound(nav, before, after, effect) {
  if (before.screen === 'match') return null;
  if (effect === 'sound' && (nav === 'left' || nav === 'right')) return 'menu-move';   // heard at the new level
  if (effect || before.screen !== after.screen || before.listen !== after.listen) {
    return nav === 'back' ? 'menu-back' : 'menu-ok';
  }
  return before.sel !== after.sel ? 'menu-move' : null;
}
