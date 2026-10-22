// @ts-check
// Boot: wires the loop, the keyboard and gamepads, the CPU, the world (all game logic is in js/sim/) and the renderer.
// Default: 1 player (WASD + F HARD / G SOFT) against the CPU, the human serving first.
// ?mode=2p: 2 players on one keyboard, P1 as above, P2 arrows + Numpad 0 (HARD) / Numpad . (SOFT).
// Gamepads: any button on a pad joins it to the next player without one (P1 first) and shows the controller overlay;
// the keys keep working alongside. Unplugging a pad that plays waits on "Controller disconnected".
// Esc or Start freezes (so does losing focus), ` toggles the debug overlay, [ and ] change the level (1P; from the next rally),
// ' steps the court view: the painted court, the code court (with the code ball and effects), and the painted court
// with the code's lines over it in cyan, for checking that they match.
// URL options: ?mode=2p versus, ?level=1..9 difficulty (default 5: the CPU's skill and, in 1P, the game's pace; 2P
// always plays at level 5's pace), ?to=5|7|9|11 match length (default 9), ?seed=<n> seed for the 2P first server and
// the CPU's choices (default random),
// ?h=<px> character height at the back, ?curve=true|half|old the true-scale, CP-B or S3 height curve (for comparing),
// ?cam=zoom|old the S8b camera candidates the owner didn't pick, for comparison (the frozen camera is wide; old is S1's),
// ?racket=off draws the swings without the racket shift (for comparing),
// ?scale=int whole-number scaling only (default: fill the window),
// ?slow=<n> slow motion (the sim runs n times slower), ?dev exposes the world as window.hogg for testing,
// ?court=code|lines starts on that court view, ?logo=on shows the logo slot (LOGO in render/hud.js) for testing.
// The players are the animated sprites (assets/player-100.png + .json, loaded before the game starts; P2 / the CPU in
// the swapped kit). \ or ?boxes shows the placeholder boxes instead (debug); they're also the fallback if loading fails.
// The court, ball, effects, font and HUD pieces (A4, A5) load alongside; without them the code court and shapes are
// drawn, with plain canvas text.
import { startLoop, SIM_HZ } from './engine/loop.js';
import { createScreen, WIDTH, HEIGHT } from './engine/screen.js';
import { createKeyboard } from './input/keyboard.js';
import { DEFAULT_LAYOUTS, layoutCodes, readActions, padActions, combineActions, makeSeats, seatOf, joinPad, dropPad,
  forgetLost, swapSeats } from './input/actions.js';
import { createPads, padName } from './input/gamepad.js';
import { makeWorld, stepWorld } from './sim/world.js';
import { makeCpu, cpuActions } from './sim/cpu.js';
import { paramsFor, toLevel, LEVELS } from './sim/difficulty.js';
import { MATCH_LENGTHS } from './sim/match.js';
import { useCamera } from './render/projection.js';
import { drawCourt, useCourt, COURT_VIEWS } from './render/court.js';
import { drawActors, heights, shifts } from './render/actors.js';
import { loadAssets } from './engine/assets.js';
import { parseSheet, buildAtlas, createAnimator, stepAnimator, frameAt, KIT_SWAP } from './render/sprites.js';
import { createEffects } from './render/effects.js';
import { drawHud, loadLogo, LOGO } from './render/hud.js';
import { useFont } from './render/text.js';
import { useUi } from './render/ui.js';
import { useFx } from './render/fx.js';
import { drawDebug, createShotLog } from './render/debug.js';
import { drawPadOverlay } from './render/pads.js';

const query = new URLSearchParams(location.search);
const to = Number(query.get('to'));
const target = MATCH_LENGTHS.includes(to) ? to : 9;
const seed = query.has('seed') ? Number(query.get('seed')) | 0 : crypto.getRandomValues(new Uint32Array(1))[0] | 0;
const curve = query.get('curve');
/** @type {import('./render/actors.js').SizeOpts} */
const SIZE = { backHeight: Number(query.get('h')) || undefined,
  curve: curve === 'true' || curve === 'half' || curve === 'old' ? curve : 'fit' };
const cam = query.get('cam');
if (cam === 'wide' || cam === 'zoom' || cam === 'old') useCamera(cam);
/** The painted court fits the frozen camera only; the comparison cameras get the code court. */
const PAINTED_FITS = cam !== 'zoom' && cam !== 'old';
const SLOW = Math.max(1, Number(query.get('slow')) || 1);
const RACKET_SHIFT = query.get('racket') !== 'off';
const TWO_PLAYER = query.get('mode') === '2p';
const LEVEL = toLevel(query.get('level') ?? undefined);

// --- state ---
const world = makeWorld({ target, seed, params: paramsFor(LEVEL, TWO_PLAYER), cpu: [false, !TWO_PLAYER] });
/** The CPU for each slot it plays (P2 in 1P), else null. */
const cpus = world.cpu.map((on, i) => (on ? makeCpu(world, /** @type {0 | 1} */ (i)) : null));
const effects = createEffects();
/** The character sprites, once loaded (null: boxes). @type {import('./render/actors.js').Sprites | null} */
let sprites = null;
let showBoxes = query.has('boxes');
const shotLog = createShotLog();
/** @type {{ ev: string, frame: number } | null} */
let lastEvent = null;
/** @type {import('./render/debug.js').DebugInfo['lastContact']} */
let lastContact = null;
let showDebug = false;
/** @type {import('./render/court.js').CourtView} */
let courtView = PAINTED_FITS ? (COURT_VIEWS.find(v => v === query.get('court')) ?? 'art') : 'code';
/** The ball and effects follow the court view: the art, except on the code court. */
const artOn = () => courtView !== 'code';
let frozen = false;
/** A level chosen with [ or ] during a rally, waiting for the next one (null: none). */
let nextLevel = /** @type {number | null} */ (null);

/** Play at this level from now: the world's pace and the CPUs' skill (they re-read it as a rally starts). @param {number} level */
function applyLevel(level) {
  world.params = paramsFor(level, TWO_PLAYER);
  for (const c of cpus) if (c) c.rally = null;
  nextLevel = null;
}

/** The debug key: step the level; it applies now if no serve has been struck yet, else at the next rally. @param {number} d */
function stepLevel(d) {
  if (TWO_PLAYER) return;                  // 2P always plays at level 5's pace
  const from = nextLevel ?? world.params.level;
  const to = LEVELS[Math.max(0, Math.min(LEVELS.length - 1, LEVELS.indexOf(from) + d))];
  if (world.phase === 'serve') applyLevel(to); else nextLevel = to;
}

// --- input ---
const layouts = DEFAULT_LAYOUTS;
const kb = createKeyboard(layoutCodes(layouts));
const pads = createPads();
/** Which pad plays which human (null: the CPU's slot). */
const seats = makeSeats(world.cpu);
/** The browser's name for each pad seen. @type {Map<number, string>} */
const padIds = new Map();
/** The controller overlay is up after a pad joins, until A / Start / Enter. */
let joining = false;
/** A playing pad was unplugged: wait until one replaces it (or Enter carries on with the keyboard). */
const lost = () => seats.some(s => s?.lost);
/** The game waits: frozen, or an overlay is up. */
const stopped = () => frozen || joining || lost();

/** Enter / Space, or A / Start on a pad that plays: close the overlay (or carry on without the unplugged pad). */
function confirmOverlay() {
  if (lost()) forgetLost(seats);
  else joining = false;
}
kb.onPress('Escape', () => { if (joining) joining = false; else if (!lost()) frozen = !frozen; });
kb.onPress('Enter', confirmOverlay);
kb.onPress('Space', confirmOverlay);
kb.onPress('Backquote', () => { showDebug = !showDebug; });
kb.onPress('Backslash', () => { showBoxes = !showBoxes; });
kb.onPress('Quote', () => {
  if (PAINTED_FITS) courtView = COURT_VIEWS[(COURT_VIEWS.indexOf(courtView) + 1) % COURT_VIEWS.length];
});
kb.onPress('BracketLeft', () => stepLevel(-1));
kb.onPress('BracketRight', () => stepLevel(1));
window.addEventListener('blur', () => { frozen = true; });
document.addEventListener('visibilitychange', () => { if (document.hidden) frozen = true; });

// --- sim step (57.4 Hz, or slower with ?slow) ---
/**
 * Poll the pads (once per step, frozen or not): unplugged pads, joins, Start, and the overlay's buttons.
 * @returns {(import('./input/gamepad.js').PadInput | null)[]} each slot's pad this step
 */
function pollPads() {
  const { pads: list, gone } = pads.poll();
  for (const i of gone) { padIds.delete(i); dropPad(seats, i); }
  /** @type {(import('./input/gamepad.js').PadInput | null)[]} */
  const bySlot = [null, null];
  for (const p of list) {
    padIds.set(p.index, p.id);
    let slot = seatOf(seats, p.index);
    if (slot < 0) {
      // the button that joins a pad does nothing else; a pad replacing an unplugged one carries straight on
      const wasLost = lost();
      if (p.any && joinPad(seats, p.index) >= 0 && !wasLost) joining = true;
      continue;
    }
    if (joining) {
      if (p.pressed.hard || p.pressed.start) joining = false;
      else if ((slot === 0 && p.pressed.right) || (slot === 1 && p.pressed.left)) {
        if (swapSeats(seats, slot)) slot = 1 - slot;
      }
    } else if (p.pressed.start && !lost()) frozen = !frozen;
    bySlot[slot] = p;
  }
  return bySlot;
}

let stepCount = 0;
function simStep() {
  const wasStopped = stopped();
  const presses = kb.takePresses();       // sampled once per step; presses made while frozen are dropped
  const padNow = pollPads();
  if (wasStopped || stopped()) return;    // a button that closes the overlay or unfreezes doesn't also play
  const [a1, a2] = [0, 1].map(i => {
    const c = cpus[i];
    if (c) return cpuActions(c, world);
    const keys = readActions(kb, layouts[i], presses), pad = padNow[i];
    return pad ? combineActions(keys, padActions(pad)) : keys;
  });
  const events = stepWorld(world, a1, a2);
  for (const e of events) {
    if ((e.type === 'newRally' || e.type === 'rematch') && nextLevel !== null) applyLevel(nextLevel);
    if (e.type === 'ball') lastEvent = { ev: e.ev, frame: world.frame - 1 };
    else if (e.type === 'swing' || e.type === 'hit') lastContact = e;
  }
  if (sprites) {
    const sp = sprites;
    sp.anims.forEach((a, i) =>
      stepAnimator(a, sp.sheet, world.players[i],
        events.some(e => e.type === 'serveSwing' && e.side === i) ? world.ball : null));
  }
  effects.add(events, world);
  shotLog.add(events, world);
  stepCount++;
}

// --- render ---
/** Each side's controls, at the foot of its margin (a CPU's side shows its level instead). */
const HELP_KEYS = [['P1 keys', 'WASD move', 'F hard', 'G soft'], ['P2 keys', 'arrows move', 'Num0 hard', 'Num. soft']];
const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById('game'));
const screen = createScreen(canvas, { mode: query.get('scale') === 'int' ? 'int' : 'fill' });
const ctx = screen.ctx;

let stepsPerSec = 0, rateStart = performance.now(), rateSteps = 0;
function render() {
  const now = performance.now();
  if (now - rateStart >= 1000) {
    stepsPerSec = (stepCount - rateSteps) * 1000 / (now - rateStart);
    rateStart = now;
    rateSteps = stepCount;
  }

  const art = artOn();
  drawCourt(ctx, courtView);
  effects.draw(ctx, world, 'wall', SIZE, art);
  drawActors(ctx, world.ball, world.players,
    { landing: world.landing, size: SIZE, sprites: showBoxes ? null : sprites, racket: RACKET_SHIFT, art });
  effects.draw(ctx, world, 'front', SIZE, art);
  drawHud(ctx, world, {
    paused: frozen && !joining && !lost(),
    help: { keys: HELP_KEYS, level: nextLevel ?? world.params.level },
    footer: `Esc pause     Controllers: A hard  B/X soft  Start pause${
      seats.some(s => s?.pad === null) ? '  (any button joins)' : ''}`,
    slow: SLOW,
  });
  if (joining || lost()) {
    drawPadOverlay(ctx, { kind: lost() ? 'lost' : 'join', seats, keys: ['WASD F G', 'arrows Num0 Num.'],
      name: i => padName(padIds.get(i) ?? '') });
  }
  if (showDebug) {
    drawDebug(ctx, { stepsPerSec, world, heights, lastEvent, lastContact, shots: shotLog.shots, cpus, nextLevel,
      anims: animNames() });
  }
  screen.present();
}

// testing hook: run whole sim steps (keyboard → actions → world, as the loop does) and draw, without waiting for frames
if (query.has('dev')) {
  Object.assign(window, { hogg: {
    world, kb, render, shots: shotLog.shots, cpus, seats, buffer: ctx.canvas,
    get sprites() { return sprites; },
    get anims() { return animNames(); },
    get boxes() { return showBoxes; },
    set boxes(v) { showBoxes = v; },
    get joining() { return joining; },
    get nextLevel() { return nextLevel; },
    /** @param {number} n */ step(n = 1) { for (let i = 0; i < n; i++) simStep(); render(); },
    get frozen() { return frozen; },
    get heights() { return [...heights]; },
    get shifts() { return [...shifts]; },
    get debug() { return showDebug; },
    set debug(v) { showDebug = v; },
    get court() { return courtView; },
    /** @param {import('./render/court.js').CourtView} v */ set court(v) { courtView = v; },
  } });
}

/** Each player's animation as "tag frame/frames" (mirrored: "<"), for the debug overlay. */
function animNames() {
  const sp = sprites;
  if (!sp) return ['boxes', 'boxes'];
  return sp.anims.map(a => {
    const tag = sp.sheet.tags[a.tag];
    return `${a.mirror ? '<' : ''}${a.tag} ${frameAt(tag, a.t)}/${tag.count}`;
  });
}

// --- loading: the sprites and the art (a loading bar meanwhile), then the game; without the sprites it plays with
// boxes, and without the art with the code court and shapes and plain text ---
const assets = loadAssets({
  sheet: { kind: 'json', url: 'assets/player-100.json' },
  image: { kind: 'image', url: 'assets/player-100.png' },
});
const art = loadAssets({
  court: { kind: 'image', url: 'assets/court.png' },
  fx: { kind: 'image', url: 'assets/fx.png' },
  fxJson: { kind: 'json', url: 'assets/fx.json' },
  font: { kind: 'image', url: 'assets/font.png' },
  fontJson: { kind: 'json', url: 'assets/font.json' },
  ui: { kind: 'image', url: 'assets/ui.png' },
  uiJson: { kind: 'json', url: 'assets/ui.json' },
});
let loading = true;
(function drawLoading() {
  if (!loading) return;
  const done = assets.state.done + art.state.done, total = assets.state.total + art.state.total;
  ctx.fillStyle = '#16161a';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = '#5a5962';                             // a bar, no text: the font is one of the things loading
  ctx.fillRect(WIDTH / 2 - 60, HEIGHT / 2 - 2, 120, 4);
  ctx.fillStyle = '#c8102e';
  ctx.fillRect(WIDTH / 2 - 60, HEIGHT / 2 - 2, Math.round(120 * done / total), 4);
  screen.present();
  requestAnimationFrame(drawLoading);
})();
loadLogo(LOGO.on || query.get('logo') === 'on');
try {
  const a = await art.ready;
  useCourt(a.court);
  useFx(a.fx, a.fxJson);
  useFont(a.font, a.fontJson);
  useUi(a.ui, a.uiJson);
} catch (e) {
  console.warn('Hogg Squash: the court and HUD art did not load, so the code court and plain text are drawn.', e);
}
try {
  const a = await assets.ready;
  const sheet = parseSheet(a.sheet);
  sprites = {
    sheet,
    atlases: [buildAtlas(a.image, sheet), buildAtlas(a.image, sheet, KIT_SWAP)],
    anims: [createAnimator(), createAnimator()],
  };
} catch (e) {
  console.warn('Hogg Squash: the character sprites did not load, so the players are drawn as boxes.', e);
}
loading = false;

startLoop({ step: simStep, render, hz: SIM_HZ / SLOW });
