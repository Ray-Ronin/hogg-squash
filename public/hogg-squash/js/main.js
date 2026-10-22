// @ts-check
// Boot: wires the loop, the keyboard and gamepads, the CPU, the world (all game logic is in js/sim/) and the renderer.
// Default: 1 player (WASD + F HARD / G SOFT) against the CPU, the human serving first.
// ?mode=2p: 2 players on one keyboard, P1 as above, P2 arrows + Numpad 0 (HARD) / Numpad . (SOFT).
// Gamepads: any button on a pad joins it to the next player without one (P1 first) and shows the controller overlay;
// the keys keep working alongside. Unplugging a pad that plays waits on "Controller disconnected".
// Esc or Start freezes (so does losing focus), ` toggles the debug overlay, [ and ] change the level (1P; from the next rally).
// URL options: ?mode=2p versus, ?level=1..9 difficulty (default 5: the CPU's skill and, in 1P, the game's pace; 2P
// always plays at level 5's pace), ?to=5|7|9|11 match length (default 9), ?seed=<n> seed for the 2P first server and
// the CPU's choices (default random),
// ?h=<px> character height at the back, ?curve=true|half|old the true-scale, CP-B or S3 height curve (for comparing),
// ?scale=int whole-number scaling only (default: fill the window),
// ?slow=<n> slow motion (the sim runs n times slower), ?dev exposes the world as window.hogg for testing.
// The players are the animated sprites (assets/player-100.png + .json, loaded before the game starts; P2 / the CPU in
// the swapped kit). \ or ?boxes shows the placeholder boxes instead (debug); they're also the fallback if loading fails.
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
import { drawCourt } from './render/court.js';
import { drawActors, heights } from './render/actors.js';
import { loadAssets } from './engine/assets.js';
import { parseSheet, buildAtlas, createAnimator, stepAnimator, frameAt, KIT_SWAP } from './render/sprites.js';
import { createEffects } from './render/effects.js';
import { drawHud } from './render/hud.js';
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
const SLOW = Math.max(1, Number(query.get('slow')) || 1);
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
      stepAnimator(a, sp.sheet, world.players[i], events.some(e => e.type === 'serve' && e.side === i)));
  }
  effects.add(events, world);
  shotLog.add(events, world);
  stepCount++;
}

// --- render ---
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

  drawCourt(ctx);
  effects.draw(ctx, world, 'wall', SIZE);
  drawActors(ctx, world.ball, world.players, { landing: world.landing, size: SIZE, sprites: showBoxes ? null : sprites });
  effects.draw(ctx, world, 'front', SIZE);
  drawHud(ctx, world, { paused: frozen && !joining && !lost() });
  ctx.font = '10px monospace';
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = '#777';
  ctx.textAlign = 'center';
  ctx.fillText(seats.some(s => s?.pad === null) ? 'Controller: press any button to join     A hard  B/X soft  Start pause'
    : 'Controllers: A hard  B/X soft  Start pause', WIDTH / 2, HEIGHT - 14);
  ctx.fillText(TWO_PLAYER ? 'P1 WASD  F hard  G soft     P2 arrows  Num0 hard  Num. soft     Esc pause  ` debug'
    : `WASD move  F hard  G soft     vs CPU level ${nextLevel ?? world.params.level} ([ ])     Esc pause  \` debug`,
    WIDTH / 2, HEIGHT - 2);
  if (SLOW > 1) {
    ctx.textAlign = 'right';
    ctx.fillText(`SLOW ×${SLOW}`, WIDTH - 4, HEIGHT - 2);
  }
  ctx.textAlign = 'left';
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
    world, kb, render, shots: shotLog.shots, cpus, seats,
    get sprites() { return sprites; },
    get anims() { return animNames(); },
    get boxes() { return showBoxes; },
    set boxes(v) { showBoxes = v; },
    get joining() { return joining; },
    get nextLevel() { return nextLevel; },
    /** @param {number} n */ step(n = 1) { for (let i = 0; i < n; i++) simStep(); render(); },
    get frozen() { return frozen; },
    get heights() { return [...heights]; },
    get debug() { return showDebug; },
    set debug(v) { showDebug = v; },
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

// --- loading: the sprites first (a "Loading" screen meanwhile), then the game; without them it plays with boxes ---
const assets = loadAssets({
  sheet: { kind: 'json', url: 'assets/player-100.json' },
  image: { kind: 'image', url: 'assets/player-100.png' },
});
let loading = true;
(function drawLoading() {
  if (!loading) return;
  ctx.fillStyle = '#16161a';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#bbb';
  ctx.fillText(`Loading… ${assets.state.done}/${assets.state.total}`, WIDTH / 2, HEIGHT / 2);
  ctx.textAlign = 'left';
  screen.present();
  requestAnimationFrame(drawLoading);
})();
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
