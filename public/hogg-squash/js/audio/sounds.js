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

/** Every sound name: the placeholders in synth.js and the names sfx.json uses. */
export const SOUNDS = /** @type {const} */ ([
  'hit-hard', 'hit-soft', 'hit-dive', 'serve', 'swing-hard', 'swing-soft', 'dive',
  'wall-front', 'wall-side', 'floor', 'glass', 'tin', 'out',
  'point', 'game',
  'menu-move', 'menu-ok', 'menu-back', 'menu-key',
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
 * The sounds one sim step's events make, in order.
 * @param {WorldEvent[]} events
 * @returns {SoundName[]}
 */
export function soundsFor(events) {
  /** @type {SoundName[]} */
  const out = [];
  let ballAt = -1;                                     // where this step's ball sound is (a rally reason replaces it)
  for (const e of events) {
    if (e.type === 'rally') {
      const r = REASON_SOUNDS[e.reason];
      if (r && ballAt >= 0) out[ballAt] = r;
      else if (r) out.push(r);
    }
    const name = EVENT_SOUNDS[e.type](e);
    if (!name) continue;
    if (e.type === 'ball') ballAt = out.length;
    out.push(name);
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
