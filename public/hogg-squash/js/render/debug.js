// @ts-check
// Debug overlay (toggled with the backquote key): sim rate, ball, players and their heights, the rally and
// match state, the last rally result, the last physics event and the last contact.
import { FP } from '../squash-physics.js';
import { UNITS_PER_M } from './projection.js';
import { SIM_HZ } from '../engine/loop.js';

/**
 * @typedef {object} DebugInfo
 * @property {number} stepsPerSec
 * @property {import('../sim/world.js').World} world
 * @property {number[]} heights  each player's box height in px
 * @property {{ ev: string, frame: number } | null} lastEvent
 * @property {(import('../sim/player.js').SwingEvent & { side: number }) | null} lastContact
 */

const hex = (/** @type {number} */ n) => '0x' + n.toString(16).padStart(2, '0');
const f1 = (/** @type {number} */ n) => n.toFixed(1).padStart(6);
const P = (/** @type {number | null} */ s) => (s === null ? '-' : `P${s + 1}`);

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {DebugInfo} d
 */
export function drawDebug(ctx, d) {
  const w = d.world, b = w.ball, r = w.rally, m = w.match;
  // displacement per frame in units = v / 65536 × speed / 256 (as in integrate)
  const k = w.params.speed / 256 / FP;
  const mps = Math.hypot(b.vx * k / UNITS_PER_M.x, b.vy * k / UNITS_PER_M.y, b.vz * k / UNITS_PER_M.z) * SIM_HZ;
  const c = d.lastContact;
  const contact = !c ? '-'
    : `P${c.side + 1} ${c.button.toUpperCase()} flags ${hex(c.flags)} ${c.zone} idx ${c.index}` +
      (c.type === 'hit' ? ` aim ${c.aim} HIT` : c.reach ? ' (swinging)' : ' MISS');
  const res = w.result ? `${P(w.result.winner)} wins rally: ${w.result.reason}` : '-';
  const lines = [
    `sim ${d.stepsPerSec.toFixed(1)} steps/s   frame ${w.frame}   ${w.phase} ${w.timer}`,
    `ball x${f1(b.x / FP)} y${f1(b.y / FP)} z${f1(b.z / FP)}`,
    `speed ${mps.toFixed(1)} m/s  bounces ${b.bounces}${b.out ? '  OUT' : ''}`,
    ...w.players.map((pl, i) => `P${i + 1} x${f1(pl.x / FP)} z${f1(pl.z / FP)}  ${d.heights[i]}px`),
    `rally turn ${P(r.turn)} striker ${P(r.striker)} needFront ${r.needFront ? 'y' : 'n'} bounces ${r.bounces}`,
    `match ${m.scores[0]}-${m.scores[1]} to ${m.target}  server ${P(m.server)} ${m.box}  winner ${P(m.winner)}`,
    `result ${res}`,
    `event ${d.lastEvent ? `${d.lastEvent.ev} @${d.lastEvent.frame}` : '-'}`,
    `contact ${contact}`,
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
