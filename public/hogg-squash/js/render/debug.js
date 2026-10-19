// @ts-check
// Debug overlay (toggled with the backquote key): sim rate, ball and player state, last physics event, last contact.
import { FP } from '../squash-physics.js';
import { UNITS_PER_M } from './projection.js';
import { SIM_HZ } from '../engine/loop.js';

/**
 * @typedef {object} DebugInfo
 * @property {number} stepsPerSec
 * @property {number} frame
 * @property {{ x: number, y: number, z: number, vx: number, vy: number, vz: number, bounces: number, out: boolean }} ball
 * @property {{ x: number, z: number }} player
 * @property {{ speed: number }} params
 * @property {{ ev: string, frame: number } | null} lastEvent
 * @property {import('../sim/player.js').SwingEvent | null} lastContact
 */

const hex = (/** @type {number} */ n) => '0x' + n.toString(16).padStart(2, '0');
const f1 = (/** @type {number} */ n) => n.toFixed(1).padStart(6);

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {DebugInfo} d
 */
export function drawDebug(ctx, d) {
  const b = d.ball;
  // displacement per frame in units = v / 65536 × speed / 256 (as in integrate)
  const k = d.params.speed / 256 / FP;
  const mps = Math.hypot(b.vx * k / UNITS_PER_M.x, b.vy * k / UNITS_PER_M.y, b.vz * k / UNITS_PER_M.z) * SIM_HZ;
  const c = d.lastContact;
  const contact = !c ? '-'
    : `${c.button.toUpperCase()} flags ${hex(c.flags)} ${c.zone} idx ${c.index}` +
      (c.type === 'hit' ? ` aim ${c.aim} HIT` : c.reach ? ' (swinging)' : ' MISS: out of reach');
  const lines = [
    `sim ${d.stepsPerSec.toFixed(1)} steps/s   frame ${d.frame}`,
    `ball x${f1(b.x / FP)} y${f1(b.y / FP)} z${f1(b.z / FP)}`,
    `speed ${mps.toFixed(1)} m/s  bounces ${b.bounces}${b.out ? '  OUT' : ''}`,
    `player x${f1(d.player.x / FP)} z${f1(d.player.z / FP)}`,
    `event ${d.lastEvent ? `${d.lastEvent.ev} @${d.lastEvent.frame}` : '-'}`,
    `contact ${contact}`,
  ];
  ctx.font = '10px monospace';
  ctx.textBaseline = 'top';
  const w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 8;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(2, 2, Math.ceil(w), lines.length * 11 + 6);
  ctx.fillStyle = '#fff';
  lines.forEach((l, i) => ctx.fillText(l, 6, 5 + i * 11));
}
