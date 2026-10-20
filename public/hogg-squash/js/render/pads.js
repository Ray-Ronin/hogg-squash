// @ts-check
// Temporary controller overlay (S7; S10's controller-assignment screen replaces it): who plays with what after a pad
// joins, and the "Controller disconnected" notice while an unplugged pad's player waits.
import { WIDTH, HEIGHT } from '../engine/screen.js';

/**
 * @typedef {object} PadOverlay
 * @property {'join' | 'lost'} kind
 * @property {(import('../input/actions.js').Seat | null)[]} seats
 * @property {string[]} keys          each slot's keyboard keys ("WASD F G")
 * @property {(index: number) => string} name  a pad's name on screen
 */

const COLOURS = { panel: 'rgba(0, 0, 0, 0.82)', edge: '#c8102e', title: '#f4f4f0', text: '#d0d0d8', dim: '#8a8a94',
  players: ['#ff5a6e', '#7aa2ff'] };

/** @param {CanvasRenderingContext2D} ctx @param {PadOverlay} o */
export function drawPadOverlay(ctx, o) {
  const twoPlayer = o.seats.every(Boolean);
  const w = 420, h = 150, x = (WIDTH - w) / 2, y = (HEIGHT - h) / 2 - 20;
  ctx.fillStyle = COLOURS.panel;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = COLOURS.edge;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

  ctx.textBaseline = 'top';
  ctx.textAlign = 'center';
  ctx.font = 'bold 16px monospace';
  ctx.fillStyle = COLOURS.title;
  ctx.fillText(o.kind === 'lost' ? 'CONTROLLER DISCONNECTED' : 'CONTROLLERS', WIDTH / 2, y + 12);

  // one line per player: P1  keys WASD F G + Xbox 360 Controller
  ctx.font = '10px monospace';
  o.seats.forEach((seat, side) => {
    const ly = y + 40 + side * 16;
    ctx.textAlign = 'left';
    ctx.fillStyle = COLOURS.players[side];
    ctx.fillText(`P${side + 1}`, x + 24, ly);
    ctx.fillStyle = COLOURS.text;
    const what = !seat ? 'CPU'
      : seat.lost ? `keys ${o.keys[side]}  +  (unplugged controller)`
      : seat.pad === null ? `keys ${o.keys[side]}`
      : `keys ${o.keys[side]}  +  ${o.name(seat.pad)}`;
    ctx.fillText(what, x + 52, ly);
  });

  const lines = o.kind === 'lost'
    ? ['Plug it back in and press any button on it to carry on,', 'or press Enter to carry on with the keyboard.']
    : [
      o.seats.some(s => s && s.pad === null) ? 'Another controller? Press any button on it to join.' : '',
      twoPlayer ? 'Left / right on a controller: change sides.' : '',
      'A or Start (Enter on the keyboard) to play',
    ].filter(Boolean);
  ctx.textAlign = 'center';
  lines.forEach((line, i) => {
    ctx.fillStyle = i === lines.length - 1 ? COLOURS.title : COLOURS.dim;
    ctx.fillText(line, WIDTH / 2, y + h - 18 - (lines.length - 1 - i) * 14);
  });
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}
