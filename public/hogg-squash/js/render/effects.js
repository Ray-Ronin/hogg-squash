// @ts-check
// Placeholder hit feedback, fed by the world's events: a ring where the ball hits the front wall, a flash where the
// racket meets the ball, and a MISS label over a player whose swing finds nothing (shown at the moment the racket
// would have met the ball). Effects age by sim frames, so they slow down in ?slow and stop while the game is frozen.
import { FP } from '../squash-physics.js';
import { SWING } from '../sim/player.js';
import { project } from './projection.js';
import { heightAt } from './actors.js';

/** Lifetimes in sim frames. */
export const EFFECT_FRAMES = { RING: 20, FLASH: 8, MISS: 30 };

const COLOURS = { ring: '200, 16, 46', flash: '255, 236, 140', miss: '#f4f4f0', outline: '#000' };

/**
 * @typedef {(
 *   { kind: 'ring', x: number, y: number, start: number } |
 *   { kind: 'flash', x: number, y: number, z: number, start: number } |
 *   { kind: 'miss', side: number, start: number }
 * )} Effect
 */

/** @typedef {import('../sim/world.js').World} World */
/** @typedef {import('../sim/world.js').WorldEvent} WorldEvent */

export function createEffects() {
  /** @type {Effect[]} */
  let list = [];
  const life = (/** @type {Effect} */ e) => EFFECT_FRAMES[e.kind === 'ring' ? 'RING' : e.kind === 'flash' ? 'FLASH' : 'MISS'];

  return {
    /**
     * Turn one sim step's events into effects.
     * @param {WorldEvent[]} events
     * @param {World} w  the world after the step
     */
    add(events, w) {
      const now = w.frame - 1;                         // the frame the events happened on
      for (const e of events) {
        if (e.type === 'ball' && e.ev === 'frontWall') list.push({ kind: 'ring', x: e.x, y: e.y, start: now });
        else if (e.type === 'hit' && e.ball) {
          list.push({ kind: 'flash', x: e.ball.x / FP, y: e.ball.y / FP, z: e.ball.z / FP, start: now });
        } else if (e.type === 'swing' && !e.reach) list.push({ kind: 'miss', side: e.side, start: now + SWING.CONTACT });
        else if (e.type === 'newRally' || e.type === 'rematch') list = [];
      }
    },

    /**
     * @param {CanvasRenderingContext2D} ctx
     * @param {World} w
     * @param {'wall' | 'front'} layer  'wall' under the players and ball, 'front' over them
     * @param {number} [backHeight]  ?h=, so the MISS label sits on the box
     */
    draw(ctx, w, layer, backHeight) {
      list = list.filter(e => w.frame - e.start < life(e));
      for (const e of list) {
        const age = w.frame - e.start;
        if (age < 0) continue;
        const k = age / life(e);                       // 0 → 1 over the effect's life
        if (layer === 'wall' && e.kind === 'ring') {
          const p = project(e.x, e.y, 0);
          ctx.strokeStyle = `rgba(${COLOURS.ring}, ${1 - k})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.ellipse(p.sx, p.sy, 3 + 12 * k, 3 + 12 * k, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.lineWidth = 1;
        } else if (layer === 'front' && e.kind === 'flash') {
          const p = project(e.x, e.y, e.z);
          const r = 6 + 8 * k;
          ctx.strokeStyle = `rgba(${COLOURS.flash}, ${1 - k})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          for (let i = 0; i < 8; i++) {                // a little starburst
            const a = i * Math.PI / 4;
            ctx.moveTo(p.sx + Math.cos(a) * r * 0.4, p.sy + Math.sin(a) * r * 0.4);
            ctx.lineTo(p.sx + Math.cos(a) * r, p.sy + Math.sin(a) * r);
          }
          ctx.stroke();
          ctx.lineWidth = 1;
        } else if (layer === 'front' && e.kind === 'miss') {
          const pl = w.players[e.side];
          const z = pl.z / FP, p = project(pl.x / FP, 0, z);
          const y = Math.round(p.sy - heightAt(z, backHeight) - 6 - 6 * k);
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.globalAlpha = 1 - k * k;
          ctx.fillStyle = COLOURS.outline;
          ctx.fillText('MISS', Math.round(p.sx) + 1, y + 1);
          ctx.fillStyle = COLOURS.miss;
          ctx.fillText('MISS', Math.round(p.sx), y);
          ctx.globalAlpha = 1;
          ctx.textAlign = 'left';
        }
      }
    },
  };
}
