// @ts-check
// Boot: wires the loop, the keyboard, the CPU, the world (all game logic is in js/sim/) and the renderer.
// Default: 1 player (WASD + F HARD / G SOFT) against the CPU, the human serving first.
// ?mode=2p: 2 players on one keyboard, P1 as above, P2 arrows + Numpad 0 (HARD) / Numpad . (SOFT).
// Esc freezes (so does losing focus), ` toggles the debug overlay.
// URL options: ?mode=2p versus, ?to=5|7|9|11 match length (default 9), ?seed=<n> seed for the 2P first server and
// the CPU's choices (default random),
// ?h=<px> box height at the back, ?curve=old the S3 height curve (for comparing),
// ?scale=int whole-number scaling only (default: fill the window),
// ?slow=<n> slow motion (the sim runs n times slower), ?dev exposes the world as window.hogg for testing.
import { startLoop, SIM_HZ } from './engine/loop.js';
import { createScreen, WIDTH, HEIGHT } from './engine/screen.js';
import { createKeyboard } from './input/keyboard.js';
import { DEFAULT_LAYOUTS, layoutCodes, readActions } from './input/actions.js';
import { makeWorld, stepWorld } from './sim/world.js';
import { makeCpu, cpuActions } from './sim/cpu.js';
import { MATCH_LENGTHS } from './sim/match.js';
import { drawCourt } from './render/court.js';
import { drawActors, heights } from './render/actors.js';
import { createEffects } from './render/effects.js';
import { drawHud } from './render/hud.js';
import { drawDebug, createShotLog } from './render/debug.js';

const query = new URLSearchParams(location.search);
const to = Number(query.get('to'));
const target = MATCH_LENGTHS.includes(to) ? to : 9;
const seed = query.has('seed') ? Number(query.get('seed')) | 0 : crypto.getRandomValues(new Uint32Array(1))[0] | 0;
/** @type {import('./render/actors.js').SizeOpts} */
const SIZE = { backHeight: Number(query.get('h')) || undefined, curve: query.get('curve') === 'old' ? 'old' : 'smooth' };
const SLOW = Math.max(1, Number(query.get('slow')) || 1);
const TWO_PLAYER = query.get('mode') === '2p';

// --- state ---
const world = makeWorld({ target, seed, cpu: [false, !TWO_PLAYER] });
/** The CPU for each slot it plays (P2 in 1P), else null. */
const cpus = world.cpu.map((on, i) => (on ? makeCpu(world, /** @type {0 | 1} */ (i)) : null));
const effects = createEffects();
const shotLog = createShotLog();
/** @type {{ ev: string, frame: number } | null} */
let lastEvent = null;
/** @type {import('./render/debug.js').DebugInfo['lastContact']} */
let lastContact = null;
let showDebug = false;
let frozen = false;

// --- input ---
const layouts = DEFAULT_LAYOUTS;
const kb = createKeyboard(layoutCodes(layouts));
kb.onPress('Escape', () => { frozen = !frozen; });
kb.onPress('Backquote', () => { showDebug = !showDebug; });
window.addEventListener('blur', () => { frozen = true; });
document.addEventListener('visibilitychange', () => { if (document.hidden) frozen = true; });

// --- sim step (57.4 Hz, or slower with ?slow) ---
let stepCount = 0;
function simStep() {
  const presses = kb.takePresses();       // sampled once per step; presses made while frozen are dropped
  if (frozen) return;
  const [a1, a2] = [0, 1].map(i => { const c = cpus[i]; return c ? cpuActions(c, world) : readActions(kb, layouts[i], presses); });
  const events = stepWorld(world, a1, a2);
  for (const e of events) {
    if (e.type === 'ball') lastEvent = { ev: e.ev, frame: world.frame - 1 };
    else if (e.type === 'swing' || e.type === 'hit') lastContact = e;
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
  drawActors(ctx, world.ball, world.players, { landing: world.landing, size: SIZE });
  effects.draw(ctx, world, 'front', SIZE);
  drawHud(ctx, world, { paused: frozen });
  ctx.font = '10px monospace';
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = '#777';
  ctx.textAlign = 'center';
  ctx.fillText(TWO_PLAYER ? 'P1 WASD  F hard  G soft     P2 arrows  Num0 hard  Num. soft     Esc pause  ` debug'
    : 'WASD move  F hard  G soft     vs CPU (?mode=2p for 2 players)     Esc pause  ` debug', WIDTH / 2, HEIGHT - 2);
  if (SLOW > 1) {
    ctx.textAlign = 'right';
    ctx.fillText(`SLOW ×${SLOW}`, WIDTH - 4, HEIGHT - 2);
  }
  ctx.textAlign = 'left';
  if (showDebug) drawDebug(ctx, { stepsPerSec, world, heights, lastEvent, lastContact, shots: shotLog.shots, cpus });
  screen.present();
}

// testing hook: run whole sim steps (keyboard → actions → world, as the loop does) and draw, without waiting for frames
if (query.has('dev')) {
  Object.assign(window, { hogg: {
    world, kb, render, shots: shotLog.shots, cpus,
    /** @param {number} n */ step(n = 1) { for (let i = 0; i < n; i++) simStep(); render(); },
    get frozen() { return frozen; },
    get heights() { return [...heights]; },
    get debug() { return showDebug; },
    set debug(v) { showDebug = v; },
  } });
}

startLoop({ step: simStep, render, hz: SIM_HZ / SLOW });
