// @ts-check
// S1 Canvas test: the projected court, the real physics ball and a placeholder player box.
// Keys: WASD move, F = HARD, G = SOFT, Space = feed a ball, R = reset, ` = debug overlay.
// ?h=<px> sets the box height (default 100) for trying character sizes.
import { FP, makeBall, step, difficultyParams, SERVE } from './squash-physics.js';
import { startLoop } from './engine/loop.js';
import { createScreen, WIDTH, HEIGHT } from './engine/screen.js';
import { drawCourt } from './render/court.js';
import { drawActors } from './render/actors.js';
import { drawDebug } from './render/debug.js';
import { makePlayer, stepPlayer, PLAYER_LIMITS } from './sim/player.js';

const params = { ...difficultyParams(0), latMult: 17 };
const START = { x: 0, z: 140 };
const BOX_HEIGHT = Number(new URLSearchParams(location.search).get('h')) || 100;

// --- state ---
let player = makePlayer(START.x, START.z);
let ball = makeBall({ x: 0, z: 96 * FP });
let frame = 0;
/** @type {{ ev: string, frame: number } | null} */
let lastEvent = null;
/** @type {import('./sim/player.js').SwingEvent | null} */
let lastContact = null;
let showDebug = false;

// --- keyboard (KeyboardEvent.code) ---
const held = new Set();
const pressed = new Set();         // presses since the last sim step
const GAME_KEYS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'Space', 'KeyR', 'Backquote']);
window.addEventListener('keydown', e => {
  if (!GAME_KEYS.has(e.code)) return;
  e.preventDefault();
  if (e.repeat) return;
  held.add(e.code);
  pressed.add(e.code);
  if (e.code === 'Backquote') showDebug = !showDebug;
});
window.addEventListener('keyup', e => { held.delete(e.code); });
window.addEventListener('blur', () => held.clear());

// --- sim step (57.4 Hz) ---
function feed() {
  const x = Math.min(player.x + 36 * FP, PLAYER_LIMITS.xMax * FP);
  ball = makeBall({ x, y: 30 * FP, z: player.z, vx: SERVE.vx, vy: SERVE.vy[0], vz: SERVE.vz });
  lastEvent = null;
}

function reset() {
  player = makePlayer(START.x, START.z);
  ball = makeBall({ x: 0, z: 96 * FP });
  lastEvent = null;
  lastContact = null;
}

let stepCount = 0;
function simStep() {
  if (pressed.has('KeyR')) reset();
  if (pressed.has('Space')) feed();
  const act = {
    up: held.has('KeyW'), down: held.has('KeyS'), left: held.has('KeyA'), right: held.has('KeyD'),
    hard: pressed.has('KeyF'), soft: pressed.has('KeyG'),
  };
  pressed.clear();

  const contact = stepPlayer(player, act, ball, params, frame);
  if (contact) lastContact = contact;
  const ev = step(ball, params);
  if (ev) lastEvent = { ev, frame };
  frame++;
  stepCount++;
}

// --- render ---
const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById('game'));
const screen = createScreen(canvas);
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
  drawActors(ctx, ball, player, { boxHeight: BOX_HEIGHT });
  ctx.font = '10px monospace';
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = '#777';
  ctx.textAlign = 'center';
  ctx.fillText('WASD move  F hard  G soft  Space feed  R reset  ` debug', WIDTH / 2, HEIGHT - 2);
  ctx.textAlign = 'left';
  if (showDebug) drawDebug(ctx, { stepsPerSec, frame, ball, player, params, lastEvent, lastContact });
  screen.present();
}

startLoop({ step: simStep, render });
