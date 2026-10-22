// @ts-check
// Hit feedback, fed by the world's events: a ring where the ball hits the front wall, a sparkle where the racket
// meets the ball (A4's `ring` and `sparkle`, their frames spread over each effect's life), and a MISS label over a
// player whose swing finds nothing (shown at the moment the racket would have met the ball), in the bitmap font.
// Effects age by sim frames, so they slow down in ?slow and stop while the game is frozen. With art off (the debug
// court) or no fx sheet, the ring and the flash are the S4 code shapes.
import { FP } from '../squash-physics.js';
import { SWING } from '../sim/player.js';
import { project } from './projection.js';
import { heightAt, ballCentre } from './actors.js';
import { fxSheet, drawFx } from './fx.js';
import { drawText } from './text.js';

/** Lifetimes in sim frames. */
export const EFFECT_FRAMES = { RING: 20, FLASH: 8, MISS: 30 };

const COLOURS = { ring: '200, 16, 46', flash: '255, 236, 140' };

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
     * @param {import('./actors.js').SizeOpts} [size]  ?h= and ?curve=, so the MISS label sits on the box
     * @param {boolean} [art]  false: the code shapes (the debug court)
     */
    draw(ctx, w, layer, size, art = true) {
      list = list.filter(e => w.frame - e.start < life(e));
      const fx = art ? fxSheet() : null;
      for (const e of list) {
        const age = w.frame - e.start;
        if (age < 0) continue;
        const k = age / life(e);                       // 0 → 1 over the effect's life
        if (layer === 'wall' && e.kind === 'ring') {
          const p = project(e.x, e.y, 0);
          if (fx) { drawFx(ctx, 'ring', Math.floor(k * fx.tags.ring.frames.length), p.sx, p.sy); continue; }
          ctx.strokeStyle = `rgba(${COLOURS.ring}, ${1 - k})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.ellipse(p.sx, p.sy, 3 + 12 * k, 3 + 12 * k, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.lineWidth = 1;
        } else if (layer === 'front' && e.kind === 'flash') {
          const p = project(e.x, e.y, e.z);
          if (fx) {                                      // on the ball as drawn
            const c = ballCentre(e.x, e.y, e.z);
            drawFx(ctx, 'sparkle', Math.floor(k * fx.tags.sparkle.frames.length), c.sx, c.sy);
            continue;
          }
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
          const y = Math.round(p.sy - heightAt(z, size) - 13 - 6 * k);   // the label's top; it rises as it fades
          ctx.globalAlpha = 1 - k * k;
          drawText(ctx, 'small-dark', 'MISS', p.sx + 1, y + 1, 'center');   // a drop shadow, for the wood and walls
          drawText(ctx, 'small', 'MISS', p.sx, y, 'center');
          ctx.globalAlpha = 1;
        }
      }
    },
  };
}
