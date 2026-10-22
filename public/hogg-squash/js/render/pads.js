// @ts-check
// Temporary controller overlay (S7; S10's controller-assignment screen replaces it): who plays with what after a pad
// joins, and the "Controller disconnected" notice while an unplugged pad's player waits. On A5's dark panel, in the
// bitmap font (a pad's name may hold characters the font lacks; they show as spaces).
import { WIDTH, HEIGHT } from '../engine/screen.js';
import { drawText } from './text.js';
import { drawPanel } from './ui.js';

/**
 * @typedef {object} PadOverlay
 * @property {'join' | 'lost'} kind
 * @property {(import('../input/actions.js').Seat | null)[]} seats
 * @property {string[]} keys          each slot's keyboard keys ("WASD F G")
 * @property {(index: number) => string} name  a pad's name on screen
 */

/** @param {CanvasRenderingContext2D} ctx @param {PadOverlay} o */
export function drawPadOverlay(ctx, o) {
  const twoPlayer = o.seats.every(Boolean);
  const w = 420, h = 150, x = (WIDTH - w) / 2, y = (HEIGHT - h) / 2 - 20;
  drawPanel(ctx, 'panel dark', x, y, w, h);
  drawText(ctx, 'large-white', o.kind === 'lost' ? 'CONTROLLER DISCONNECTED' : 'CONTROLLERS', WIDTH / 2, y + 10, 'center');

  // one line per player: P1  keys WASD F G + Xbox 360 Controller
  o.seats.forEach((seat, side) => {
    const ly = y + 42 + side * 16;
    drawText(ctx, side === 0 ? 'small-red' : 'small', `P${side + 1}`, x + 24, ly);
    const what = !seat ? 'CPU'
      : seat.lost ? `keys ${o.keys[side]}  +  (unplugged controller)`
      : seat.pad === null ? `keys ${o.keys[side]}`
      : `keys ${o.keys[side]}  +  ${o.name(seat.pad)}`;
    drawText(ctx, 'small', what, x + 52, ly);
  });

  const lines = o.kind === 'lost'
    ? ['Plug it back in and press any button on it to carry on,', 'or press Enter to carry on with the keyboard.']
    : [
      o.seats.some(s => s && s.pad === null) ? 'Another controller? Press any button on it to join.' : '',
      twoPlayer ? 'Left / right on a controller: change sides.' : '',
      'A or Start (Enter on the keyboard) to play',
    ].filter(Boolean);
  lines.forEach((line, i) => {
    drawText(ctx, i === lines.length - 1 ? 'small' : 'small-grey', line, WIDTH / 2,
      y + h - 22 - (lines.length - 1 - i) * 14, 'center');
  });
}
