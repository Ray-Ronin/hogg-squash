// @ts-check
// Debug overlay (toggled with the backquote key): sim rate, ball, players (height, swing phase), the rally and
// match state, the last rally result, the last physics event and the last contact, and a log of the last 5 shots
// (zone, contact index, button, aim, speed and front-wall height) to compare with squash-game-logic.md §9.
// The serve line shows where a serve from here would be aimed (HARD and SOFT), then where it was aimed.
// Each CPU gets a line with its state and plan; its planned contact (a cyan ring at the ball, joined to the floor) and
// where it means to stand (a cyan cross on the floor) are drawn on the court, and its serve spot while serving.
import { FP } from '../squash-physics.js';
import { swingPhase } from '../sim/player.js';
import { serveTarget } from '../sim/world.js';
import { UNITS_PER_M, project } from './projection.js';
import { SIM_HZ } from '../engine/loop.js';

/**
 * @typedef {object} Shot
 * @property {string} who      P1 / P2
 * @property {string} what     e.g. "HARD MID #3", "SERVE SOFT", "DIVE BACK #10"
 * @property {number | null} aim
 * @property {number} depth    depth speed off the racket, m/s (what §9's "speed" column gives)
 * @property {number} total    3D speed off the racket, m/s
 * @property {number | 'down' | null} wall  front-wall height in m; 'down' if it never got there; null while flying
 */

/**
 * @typedef {object} DebugInfo
 * @property {number} stepsPerSec
 * @property {import('../sim/world.js').World} world
 * @property {number[]} heights  each player's box height in px
 * @property {{ ev: string, frame: number } | null} lastEvent
 * @property {(import('../sim/player.js').SwingEvent & { side: number }) | null} lastContact
 * @property {Shot[]} shots     newest last
 * @property {(import('../sim/cpu.js').Cpu | null)[]} [cpus]  the CPU for each slot it plays
 * @property {number | null} [nextLevel]  a level waiting for the next rally
 */

/** Shots kept in the log. */
export const SHOT_LOG_SIZE = 5;

/**
 * Ball speeds in m/s from a 16.16 velocity, at the world's game speed.
 * @param {{ vx: number, vy: number, vz: number }} v
 * @param {number} gameSpeed  params.speed (/256 time scale)
 */
export function speedsMps(v, gameSpeed) {
  const k = gameSpeed / 256 / FP * SIM_HZ;        // displacement per frame = v / 65536 × speed / 256 (integrate)
  const x = v.vx * k / UNITS_PER_M.x, y = v.vy * k / UNITS_PER_M.y, z = v.vz * k / UNITS_PER_M.z;
  return { depth: Math.abs(z), total: Math.hypot(x, y, z) };
}

/** The last few shots, built from the world's events. */
export function createShotLog() {
  /** @type {Shot[]} */
  const shots = [];
  /** @param {Shot} s */
  const push = s => { shots.push(s); if (shots.length > SHOT_LOG_SIZE) shots.shift(); };
  const pending = () => shots.find(s => s.wall === null);
  return {
    shots,
    /**
     * @param {import('../sim/world.js').WorldEvent[]} events
     * @param {import('../sim/world.js').World} w  the world after the step
     */
    add(events, w) {
      for (const e of events) {
        if (e.type === 'serve') {
          push({ who: `P${e.side + 1}`, what: `SERVE ${e.button.toUpperCase()}`, aim: null,
                 ...speedsMps(w.ball, w.params.speed), wall: null });
        } else if (e.type === 'hit' && e.ball) {
          const what = `${e.kind === 'dive' ? 'DIVE' : e.button.toUpperCase()} ${e.zone} #${e.index}`;
          push({ who: `P${e.side + 1}`, what, aim: e.aim ?? null, ...speedsMps(e.ball, w.params.speed), wall: null });
        } else if (e.type === 'ball' && e.ev === 'frontWall') {
          const s = pending();
          if (s) s.wall = e.y / UNITS_PER_M.y;
        } else if (e.type === 'rally') {
          const s = pending();
          if (s) s.wall = 'down';
        }
      }
    },
  };
}

const hex = (/** @type {number} */ n) => '0x' + n.toString(16).padStart(2, '0');
const f1 = (/** @type {number} */ n) => n.toFixed(1).padStart(6);
const P = (/** @type {number | null} */ s) => (s === null ? '-' : `P${s + 1}`);

/** @param {Shot} s */
function shotLine(s) {
  const wall = s.wall === null ? '…' : s.wall === 'down' ? 'down' : `${s.wall.toFixed(2)} m`;
  return `${s.who} ${s.what.padEnd(14)} aim ${s.aim ?? '-'}  ${s.depth.toFixed(1).padStart(4)} m/s ` +
    `(3D ${s.total.toFixed(1).padStart(4)})  wall ${wall}`;
}

/**
 * The CPU's state and plan, for the overlay.
 * @param {import('../sim/cpu.js').Cpu} c
 * @param {import('../sim/world.js').World} w
 */
function cpuLines(c, w) {
  const p = c.plan, s = c.serve;
  const head = `CPU P${c.side + 1} ${c.state}${c.state === 'react' ? ` ${c.delay}` : ''}  home x${f1(c.home.x)} z${f1(c.home.z)}` +
    `  reaction ${c.reaction} error ${c.errorStep} sense ${c.sense}`;
  const plan = p
    ? `  plan ${p.button.toUpperCase()} press in ${p.press - w.frame} at x${f1(p.ball.x)} y${f1(p.ball.y)} z${f1(p.ball.z)}` +
      `  stand x${f1(p.stand.x)} z${f1(p.stand.z)}  ${p.late ? `${p.late} frames late` : 'in time'}`
    : s && w.phase === 'serve' && w.match.server === c.side
      ? `  serve ${s.button.toUpperCase()} from x${f1(s.x)} z${f1(s.z)} to x${f1(s.target.x)} z${f1(s.target.z)}  waited ${s.waited}`
      : '  plan -';
  return [head, plan];
}

/**
 * The CPU's planned contact and stand spot (or its serve spot) on the court.
 * @param {CanvasRenderingContext2D} ctx
 * @param {import('../sim/cpu.js').Cpu} c
 * @param {import('../sim/world.js').World} w
 */
function drawCpuPlan(ctx, c, w) {
  const at = c.plan ? c.plan.stand : c.serve && w.phase === 'serve' && w.match.server === c.side ? c.serve : null;
  ctx.strokeStyle = '#3ad6e0';
  ctx.lineWidth = 1;
  if (at) {
    const q = project(at.x, 0, at.z);
    ctx.beginPath();
    ctx.moveTo(q.sx - 4, q.sy - 2); ctx.lineTo(q.sx + 4, q.sy + 2);
    ctx.moveTo(q.sx - 4, q.sy + 2); ctx.lineTo(q.sx + 4, q.sy - 2);
    ctx.stroke();
  }
  if (c.plan) {
    const b = c.plan.ball, q = project(b.x, b.y, b.z), f = project(b.x, 0, b.z);
    ctx.beginPath();
    ctx.arc(q.sx, q.sy, 4, 0, Math.PI * 2);
    ctx.moveTo(q.sx, q.sy + 4); ctx.lineTo(f.sx, f.sy);
    ctx.stroke();
  }
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {DebugInfo} d
 */
export function drawDebug(ctx, d) {
  for (const c of d.cpus ?? []) if (c) drawCpuPlan(ctx, c, d.world);
  const w = d.world, b = w.ball, r = w.rally, m = w.match;
  const mps = speedsMps(b, w.params.speed).total;
  const c = d.lastContact;
  const contact = !c ? '-'
    : `P${c.side + 1} ${c.kind === 'dive' ? 'DIVE ' : ''}${c.button.toUpperCase()} flags ${hex(c.flags)} ${c.zone} idx ${c.index}` +
      (c.type === 'hit' ? ` aim ${c.aim} HIT` : c.reach ? ' (swinging)' : ' MISS');
  const res = w.result ? `${P(w.result.winner)} wins rally: ${w.result.reason}` : '-';
  const xz = (/** @type {{ x: number, z: number } | null} */ t) => (t ? `x${f1(t.x)} z${f1(t.z)}` : '-');
  const serve = w.phase === 'serve'
    ? `serve aim  HARD ${xz(serveTarget(m.box, b.x / FP, b.z / FP, 'hard'))}  SOFT ${xz(serveTarget(m.box, b.x / FP, b.z / FP, 'soft'))}`
    : `serve aimed ${xz(w.serveTarget)}   landing ${xz(w.landing)}`;
  const lines = [
    `sim ${d.stepsPerSec.toFixed(1)} steps/s   frame ${w.frame}   ${w.phase} ${w.timer}`,
    `ball x${f1(b.x / FP)} y${f1(b.y / FP)} z${f1(b.z / FP)}`,
    `level ${w.params.level}${d.nextLevel != null ? ` (next ${d.nextLevel})` : ''}  pace ${w.params.speed} gravity ${hex(w.params.gravity)}` +
      `  power ${w.params.powerMult} bounce ${w.params.bounceOffset}`,
    `speed ${mps.toFixed(1)} m/s  bounces ${b.bounces}${b.out ? '  OUT' : ''}`,
    ...w.players.map((pl, i) => `P${i + 1} x${f1(pl.x / FP)} z${f1(pl.z / FP)}  ${d.heights[i]}px  ` +
      `${swingPhase(pl)}${pl.swing ? ` ${pl.swing.t} ${pl.swing.hand}` : ''}`),
    `rally turn ${P(r.turn)} striker ${P(r.striker)} needFront ${r.needFront ? 'y' : 'n'} bounces ${r.bounces}`,
    `match ${m.scores[0]}-${m.scores[1]} to ${m.target}  server ${P(m.server)} ${m.box}  winner ${P(m.winner)}`,
    `result ${res}`,
    serve,
    `event ${d.lastEvent ? `${d.lastEvent.ev} @${d.lastEvent.frame}` : '-'}`,
    `contact ${contact}`,
    ...(d.cpus ?? []).flatMap(c => (c ? cpuLines(c, w) : [])),
    'shots (newest last)',
    ...d.shots.map(shotLine),
  ];
  ctx.font = '10px monospace';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  const width = Math.max(...lines.map(l => ctx.measureText(l).width)) + 8;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(2, 2, Math.ceil(width), lines.length * 11 + 6);
  ctx.fillStyle = '#fff';
  lines.forEach((l, i) => ctx.fillText(l, 6, 5 + i * 11));
}
