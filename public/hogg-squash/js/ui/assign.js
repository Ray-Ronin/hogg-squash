// @ts-check
// The controllers screen (it replaces S7's overlay): who plays with what, on a dark panel over the court. Before a
// match each human has their keyboard keys, and a pad joins the next player without one when any of its buttons is
// pressed; in 2P left / right on a pad changes sides. It also comes up over a match being played when a pad joins,
// and as "Controller disconnected" when a playing pad is unplugged (the game waits). The joining and swapping are
// main.js's (with the seats in input/actions.js); this file only draws. A pad's name may hold characters the font
// lacks; they show as spaces.
import { WIDTH, HEIGHT } from '../engine/screen.js';
import { drawText } from '../render/text.js';
import { drawPanel } from '../render/ui.js';

/**
 * @typedef {object} AssignView
 * @property {(import('../input/actions.js').Seat | null)[]} seats
 * @property {string[]} keys          each slot's keyboard keys ("WASD F G")
 * @property {(index: number) => string} name  a pad's name on screen
 * @property {number} level           the CPU's level (1P)
 * @property {boolean} inMatch        over a match being played (else before it starts)
 * @property {boolean} [touch]        the touch controls are showing (they play P1; the lines say to tap)
 */

/** The panel's lines that aren't about one player, for the font test. */
export const ASSIGN_TEXT = {
  join: 'Another controller? Press any button on it to join.',
  swap: 'Left / right on a controller: change sides.',
  play: 'Enter or A: play     Esc or B: back',
  touchPlay: 'Tap to play     SOFT: back',
  touchSeat: 'the touch controls',
  carryOn: 'A or Start (Enter on the keyboard) to carry on',
  lost: ['Plug it back in and press any button on it to carry on,', 'or press Enter to carry on with the keyboard.'],
};

/** @param {CanvasRenderingContext2D} ctx @param {AssignView} o */
export function drawAssign(ctx, o) {
  const lost = o.seats.some(s => s?.lost);
  const twoPlayer = o.seats.every(Boolean);
  const w = 420, h = 150, x = (WIDTH - w) / 2, y = (HEIGHT - h) / 2 - 20;
  drawPanel(ctx, 'panel dark', x, y, w, h);
  drawText(ctx, 'large-white', lost ? 'CONTROLLER DISCONNECTED' : 'CONTROLLERS', WIDTH / 2, y + 10, 'center');

  // one line per player: P1  keys WASD F G  +  Xbox 360 Controller
  o.seats.forEach((seat, side) => {
    const ly = y + 42 + side * 16;
    drawText(ctx, side === 0 ? 'small-red' : 'small', side === 0 || seat ? `P${side + 1}` : 'CPU', x + 24, ly);
    const what = !seat ? `level ${o.level}`
      : seat.lost ? `keys ${o.keys[side]}  +  (unplugged controller)`
      : seat.pad === null ? (o.touch && side === 0 ? ASSIGN_TEXT.touchSeat : `keys ${o.keys[side]}`)
      : `keys ${o.keys[side]}  +  ${o.name(seat.pad)}`;
    drawText(ctx, 'small', what, x + 52, ly);
  });

  const lines = lost ? ASSIGN_TEXT.lost : [
    !o.touch && o.seats.some(s => s && s.pad === null) ? ASSIGN_TEXT.join : '',
    twoPlayer ? ASSIGN_TEXT.swap : '',
    o.inMatch ? ASSIGN_TEXT.carryOn : o.touch ? ASSIGN_TEXT.touchPlay : ASSIGN_TEXT.play,
  ].filter(Boolean);
  lines.forEach((line, i) => {
    drawText(ctx, i === lines.length - 1 ? 'small' : 'small-grey', line, WIDTH / 2,
      y + h - 22 - (lines.length - 1 - i) * 14, 'center');
  });
}
