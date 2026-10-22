// @ts-check
// Boot: wires the loop, the keyboard and gamepads, the screens (js/ui/), the CPU, the world (all game logic is in
// js/sim/) and the renderer.
// The screens (docs/decisions.md, "Screens"): title → 1P / 2P → match length → level (1P only) → controllers →
// match → result → rematch or menu. Menus take arrows / WASD (any player's movement keys), Enter / Space or a HARD key
// for OK, Esc or a SOFT key for back, and on a pad the D-pad or stick, A (OK), B / X (back) and Start.
// In a match Esc or Start opens the pause menu (Resume / Restart match / Quit to title); so do losing focus, hiding
// the tab and leaving fullscreen. 1P: WASD + F HARD / G SOFT against the CPU, the human serving first. 2P: P1 as
// above, P2 arrows + Numpad 0 (HARD) / Numpad . (SOFT).
// Gamepads: on the controllers screen any button on a pad joins it to the next player without one (P1 first); the
// keys keep working alongside. In a match a new pad's button brings that screen up over it, and unplugging a pad that
// plays shows "Controller disconnected" and waits.
// Debug keys: ` toggles the debug overlay, [ and ] change the level (1P; from the next rally), ' steps the court view:
// the painted court, the code court (with the code ball and effects), and the painted court with the code's lines
// over it in cyan, for checking that they match.
// URL options (debug shortcuts): ?mode=2p, ?level=1..9 or ?to=5|7|9|11 skips the menus and starts that match at once
// (the others at their defaults: 1P, level 5, first to 9; 2P always plays at level 5's pace), ?seed=<n> seed for the
// 2P first server and the CPU's choices (default random),
// ?h=<px> character height at the back, ?curve=true|half|old the true-scale, CP-B or S3 height curve (for comparing),
// ?cam=zoom|old the S8b camera candidates the owner didn't pick, for comparison (the frozen camera is wide; old is S1's),
// ?racket=off draws the swings without the racket shift (for comparing),
// ?scale=int whole-number scaling only (default: fill the window),
// ?slow=<n> slow motion (the sim runs n times slower), ?dev exposes the game as window.hogg for testing,
// ?court=code|lines starts on that court view, ?logo=on shows the logo slot (LOGO in render/hud.js) for testing.
// The players are the animated sprites (assets/player-100.png + .json, loaded before the game starts; P2 / the CPU in
// the swapped kit). \ or ?boxes shows the placeholder boxes instead (debug); they're also the fallback if loading fails.
// The court, ball, effects, font, HUD pieces and title (A4, A5) load alongside; without them the code court and
// shapes are drawn, with plain canvas text.
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
import { makeUi, navigate, matchOver, autoPause, assignInMatch, DEFAULT_SETTINGS } from './ui/screens.js';
import { drawTitle, useTitle } from './ui/title.js';
import { drawSetup } from './ui/setup.js';
import { drawAssign } from './ui/assign.js';
import { drawPause } from './ui/pause.js';
import { drawResult } from './ui/result.js';

const query = new URLSearchParams(location.search);
const to = Number(query.get('to'));
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
/** ?mode, ?level or ?to: straight into that match, skipping the menus. */
const SHORTCUT = query.has('mode') || query.has('level') || query.has('to');
/** Steps that GAME shows on the wall before the result screen comes up (0.7 s). */
const RESULT_DELAY = 40;

// --- state ---
const ui = makeUi({
  players: query.get('mode') === '2p' ? 2 : 1,
  target: MATCH_LENGTHS.includes(to) ? to : DEFAULT_SETTINGS.target,
  level: toLevel(query.get('level') ?? undefined),
}, SHORTCUT ? 'match' : 'title');
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
/** A level chosen with [ or ] during a rally, waiting for the next one (null: none). */
let nextLevel = /** @type {number | null} */ (null);
/** Steps since the match was won (the result screen comes up after RESULT_DELAY). */
let overSteps = 0;

// The match: built from the settings when the controllers screen comes up, and again for a restart or rematch.
/** The seed of the match being played (a restart replays it) and of the next new one. */
let matchSeed = seed, nextSeed = seed;
/** @type {import('./sim/world.js').World} */
let world;
/** The CPU for each slot it plays (P2 in 1P), else null. @type {(import('./sim/cpu.js').Cpu | null)[]} */
let cpus = [];
let effects = createEffects();
/** Which pad plays which human (null: the CPU's slot). @type {(import('./input/actions.js').Seat | null)[]} */
let seats = makeSeats([false, true]);

/** A match from 0–0 with the screens' settings. The pads that were playing keep playing (in the same order). @param {number} s  seed */
function newMatch(s) {
  const set = ui.settings, two = set.players === 2;
  matchSeed = s;
  world = makeWorld({ target: set.target, seed: s, params: paramsFor(set.level, two), cpu: [false, !two] });
  cpus = world.cpu.map((on, i) => (on ? makeCpu(world, /** @type {0 | 1} */ (i)) : null));
  effects = createEffects();
  if (sprites) sprites.anims = [createAnimator(), createAnimator()];
  nextLevel = null;
  overSteps = 0;
  lastEvent = null;
  lastContact = null;
  const kept = seats.flatMap(st => (st?.pad != null ? [st.pad] : []));
  seats = makeSeats(world.cpu);
  for (const p of kept) joinPad(seats, p);
}
newMatch(nextSeed++);

/** Play at this level from now: the world's pace and the CPUs' skill (they re-read it as a rally starts). @param {number} level */
function applyLevel(level) {
  world.params = paramsFor(level, !world.cpu[1]);
  for (const c of cpus) if (c) c.rally = null;
  nextLevel = null;
}

/** The debug key: step the level; it applies now if no serve has been struck yet, else at the next rally. @param {number} d */
function stepLevel(d) {
  if (!world.cpu[1]) return;               // 2P always plays at level 5's pace
  const from = nextLevel ?? world.params.level;
  const to = LEVELS[Math.max(0, Math.min(LEVELS.length - 1, LEVELS.indexOf(from) + d))];
  if (world.phase === 'serve') applyLevel(to); else nextLevel = to;
}

/**
 * One menu move, and what it asks of the match.
 * @param {import('./ui/screens.js').Nav} n
 */
function nav(n) {
  const from = ui.screen;
  const effect = navigate(ui, n);
  if (from === 'assign' && (effect === 'start' || effect === 'resume')) forgetLost(seats);  // carry on with the keys
  if (effect === 'prepare' || effect === 'rematch') newMatch(nextSeed++);
  else if (effect === 'restart') newMatch(matchSeed);
}

// --- input ---
const layouts = DEFAULT_LAYOUTS;
/** Keys that work the menus whatever the layouts (the layouts' own keys do too: ACTION_NAV). */
const MENU_KEYS = /** @type {Record<string, import('./ui/screens.js').Nav>} */ (
  { Enter: 'ok', NumpadEnter: 'ok', Space: 'ok', Escape: 'back' });
/** A player's action keys in the menus: movement moves, HARD is OK, SOFT is back. */
const ACTION_NAV = /** @type {Record<string, import('./ui/screens.js').Nav>} */ (
  { up: 'up', down: 'down', left: 'left', right: 'right', hard: 'ok', soft: 'back' });
const kb = createKeyboard([...layoutCodes(layouts), ...Object.keys(MENU_KEYS)]);
const pads = createPads();
/** The browser's name for each pad seen. @type {Map<number, string>} */
const padIds = new Map();
/** A playing pad was unplugged and nobody has carried on yet. */
const lost = () => seats.some(s => s?.lost);

/** The menu move a key makes, if any. @param {string} code @returns {import('./ui/screens.js').Nav | null} */
function keyNav(code) {
  if (code in MENU_KEYS) return MENU_KEYS[code];
  for (const l of layouts) {
    for (const [action, c] of Object.entries(l)) if (c === code) return ACTION_NAV[action];
  }
  return null;
}

/** The menu moves a pad made this poll. @param {import('./input/gamepad.js').PadInput} p */
function padNavs(p) {
  /** @type {import('./ui/screens.js').Nav[]} */
  const out = [];
  for (const d of /** @type {const} */ (['up', 'down', 'left', 'right'])) if (p.pressed[d]) out.push(d);
  if (p.pressed.hard) out.push('ok');
  if (p.pressed.soft) out.push('back');
  if (p.pressed.start) out.push('start');
  return out;
}

kb.onPress('Backquote', () => { showDebug = !showDebug; });
kb.onPress('Backslash', () => { showBoxes = !showBoxes; });
kb.onPress('Quote', () => {
  if (PAINTED_FITS) courtView = COURT_VIEWS[(COURT_VIEWS.indexOf(courtView) + 1) % COURT_VIEWS.length];
});
kb.onPress('BracketLeft', () => stepLevel(-1));
kb.onPress('BracketRight', () => stepLevel(1));

// pausing without a key: the window loses focus, the tab is hidden, or fullscreen is left (the browser may keep the
// Esc that leaves fullscreen to itself). F11's fullscreen isn't the Fullscreen API, so leaving it shows only as the
// window shrinking from the screen's size.
window.addEventListener('blur', () => autoPause(ui));
document.addEventListener('visibilitychange', () => { if (document.hidden) autoPause(ui); });
document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) autoPause(ui); });
const screenSized = () => window.innerWidth >= window.screen.width && window.innerHeight >= window.screen.height;
let wasScreenSized = screenSized();
window.addEventListener('resize', () => {
  const now = screenSized();
  if (wasScreenSized && !now) autoPause(ui);
  wasScreenSized = now;
});

// --- sim step (57.4 Hz, or slower with ?slow) ---
/**
 * Poll the pads (once per step, on every screen): unplugged pads, joins, and the screens' buttons.
 * @returns {(import('./input/gamepad.js').PadInput | null)[]} each slot's pad this step (for playing)
 */
function pollPads() {
  const { pads: list, gone } = pads.poll();
  for (const i of gone) { padIds.delete(i); dropPad(seats, i); }
  /** @type {(import('./input/gamepad.js').PadInput | null)[]} */
  const bySlot = [null, null];
  for (const p of list) {
    padIds.set(p.index, p.id);
    let slot = seatOf(seats, p.index);
    const seating = ui.screen === 'assign' || ui.screen === 'match';
    if (seating && slot < 0) {
      // the button that joins a pad does nothing else; a pad replacing an unplugged one carries straight on
      const wasLost = lost();
      if (!p.any || joinPad(seats, p.index) < 0) continue;
      if (ui.screen === 'match' && !wasLost) assignInMatch(ui);
      else if (ui.screen === 'assign' && ui.inMatch && wasLost && !lost()) nav('ok');
      continue;
    }
    if (ui.screen === 'assign') {
      if (p.pressed.hard || p.pressed.start) nav('ok');
      else if (p.pressed.soft) nav('back');
      else if ((slot === 0 && p.pressed.right) || (slot === 1 && p.pressed.left)) {
        if (swapSeats(seats, slot)) slot = 1 - slot;
      }
    } else if (ui.screen === 'match') {
      if (p.pressed.start) nav('start');
    } else {
      for (const n of padNavs(p)) nav(n);
    }
    if (slot >= 0) bySlot[slot] = p;
  }
  if (ui.screen === 'match' && lost()) assignInMatch(ui);
  return bySlot;
}

let stepCount = 0;
/** The match is being played (no screen over it). (A function, so a check after nav() isn't narrowed away.) */
const playing = () => ui.screen === 'match';
function simStep() {
  stepCount++;
  const wasMatch = ui.screen === 'match';
  const presses = kb.takePresses();       // sampled once per step; presses on the menus don't reach the match
  const padNow = pollPads();
  if (ui.screen === 'match') {
    if (presses.has('Escape')) nav('back');
  } else {
    for (const code of presses) {
      const n = keyNav(code);
      if (n) nav(n);
      if (playing()) break;               // the key that starts or resumes the match does nothing more
    }
  }
  if (!wasMatch || !playing()) return;  // a press that closes a menu or opens one doesn't also play

  if (world.phase === 'over') {           // GAME on the wall, then the result screen
    if (++overSteps >= RESULT_DELAY) matchOver(ui);
    return;
  }
  const [a1, a2] = [0, 1].map(i => {
    const c = cpus[i];
    if (c) return cpuActions(c, world);
    const keys = readActions(kb, layouts[i], presses), pad = padNow[i];
    return pad ? combineActions(keys, padActions(pad)) : keys;
  });
  const events = stepWorld(world, a1, a2);
  for (const e of events) {
    if (e.type === 'newRally' && nextLevel !== null) applyLevel(nextLevel);
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
}

// --- render ---
/** Each side's controls, at the foot of its margin (a CPU's side shows its level instead). */
const HELP_KEYS = [['P1 keys', 'WASD move', 'F hard', 'G soft'], ['P2 keys', 'arrows move', 'Num0 hard', 'Num. soft']];
/** Each slot's keyboard keys on the controllers screen. */
const SEAT_KEYS = ['WASD F G', 'arrows Num0 Num.'];
const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById('game'));
const screen = createScreen(canvas, { mode: query.get('scale') === 'int' ? 'int' : 'fill' });
const ctx = screen.ctx;

/** The match as it stands: the court, the players and ball, the effects and the HUD. */
function drawMatch() {
  const art = artOn();
  drawCourt(ctx, courtView);
  effects.draw(ctx, world, 'wall', SIZE, art);
  drawActors(ctx, world.ball, world.players,
    { landing: world.landing, size: SIZE, sprites: showBoxes ? null : sprites, racket: RACKET_SHIFT, art });
  effects.draw(ctx, world, 'front', SIZE, art);
  drawHud(ctx, world, {
    help: { keys: HELP_KEYS, level: nextLevel ?? world.params.level },
    footer: `Esc pause     Controllers: A hard  B/X soft  Start pause${
      seats.some(s => s?.pad === null) ? '  (any button joins)' : ''}`,
    slow: SLOW,
  });
}

let stepsPerSec = 0, rateStart = performance.now(), rateSteps = 0;
function render() {
  const now = performance.now();
  if (now - rateStart >= 1000) {
    stepsPerSec = (stepCount - rateSteps) * 1000 / (now - rateStart);
    rateStart = now;
    rateSteps = stepCount;
  }

  if (ui.screen === 'title') drawTitle(ctx, ui);
  else if (ui.screen === 'length' || ui.screen === 'level') drawSetup(ctx, ui);
  else {
    drawMatch();
    if (ui.screen === 'assign') {
      drawAssign(ctx, { seats, keys: SEAT_KEYS, name: i => padName(padIds.get(i) ?? ''), level: world.params.level,
        inMatch: ui.inMatch });
    } else if (ui.screen === 'pause') drawPause(ctx, ui);
    else if (ui.screen === 'result') drawResult(ctx, ui, world);
    if (showDebug) {
      drawDebug(ctx, { stepsPerSec, world, heights, lastEvent, lastContact, shots: shotLog.shots, cpus, nextLevel,
        anims: animNames() });
    }
  }
  screen.present();
}

// testing hook: run whole sim steps (keyboard → screens or actions → world, as the loop does) and draw, without
// waiting for frames
if (query.has('dev')) {
  Object.assign(window, { hogg: {
    kb, render, shots: shotLog.shots, ui, buffer: ctx.canvas,
    get world() { return world; },
    get cpus() { return cpus; },
    get seats() { return seats; },
    get sprites() { return sprites; },
    get anims() { return animNames(); },
    get boxes() { return showBoxes; },
    set boxes(v) { showBoxes = v; },
    get nextLevel() { return nextLevel; },
    /** @param {import('./ui/screens.js').Nav} n */ nav(n) { nav(n); render(); },
    /** @param {number} n */ step(n = 1) { for (let i = 0; i < n; i++) simStep(); render(); },
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
  title: { kind: 'image', url: 'assets/title.png' },
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
  useTitle(a.title);
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
