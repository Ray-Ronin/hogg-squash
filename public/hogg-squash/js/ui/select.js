// @ts-check
// The characters screen (S15), on a dark panel over the title art: the roster in a row of cards in the middle, and each
// side's choice big beside it, P1 on the left in the Hogg red kit and P2 / the CPU on the right in white (the kits they
// will wear), playing the `ready` loop. A red frame marks P1's choice on the cards and a white one P2's; a pick shows
// as PICKED. In 1P the CPU's choice is random, and up / down (or a tap on it) rolls another. Characters are looks only.
// A character whose sheet has a front view plays it here (S15b, roster.js's previewTag); the others show `ready` from
// the back. The moves are screens.js's; this file only draws (and records the cards and the CPU's panel for taps).
import { WIDTH } from '../engine/screen.js';
import { drawText } from '../render/text.js';
import { drawPanel } from '../render/ui.js';
import { createAnimator, drawSprite, ART_HEIGHT } from '../render/sprites.js';
import { previewTag } from '../render/roster.js';
import { hits } from './menu.js';
import { drawTitleBack } from './title.js';
import { SELECT_REROLL } from './screens.js';
import { modeLine } from './setup.js';

/**
 * What the screen draws of each character: its name and its preview loop (previewTag) in a kit (0 red, 1 white).
 * @typedef {{ name: string, sheet: import('../render/sprites.js').Sheet,
 *   preview: (kit: number) => import('../render/sprites.js').Atlas }} SelectCharacter
 */

export const SELECT_TEXT = {
  title: ['CHOOSE YOUR PLAYER', 'CHOOSE YOUR PLAYERS'],
  same: 'Everyone plays the same: you only choose how you look',
  picked: 'PICKED',
  choose: '< choose >',
  cpu: ['random', 'Up / down: another'],
  cpuTouch: ['random', 'Tap for another'],
  hint1: 'Left / right: choose     Enter or A: pick     Esc or B: back',
  hint2: 'Each player: left / right to choose, HARD to pick, SOFT to undo     Esc: back',
  touchHint: 'Tap a player to pick them     SOFT: back',
};

/** The panel, each side's big figure (centre x, feet y), and the row of cards (first centre, spacing, feet y, size). */
export const SELECT_LAYOUT = {
  x: 16, y: 6, w: 608, h: 348,
  SIDES: [104, 536], FEET: 196,
  CARD_X: 224, CARD_STEP: 64, CARD_W: 60, CARD_TOP: 92, CARD_FEET: 176, CARD_H: 72,
};

/**
 * The frame round a card: 2 px in the side's colour, 3 once picked. When both choose the same, P2's is inset 3 px and
 * stops above the name, or it would cut through a long one ("Coach Zain" leaves 3 px each side of a 60 px card).
 */
const FRAME = ['#c8102e', '#f4f4f0'];

/**
 * @param {CanvasRenderingContext2D} ctx @param {number} x @param {number} y @param {number} w @param {number} h
 * @param {string} colour @param {number} width
 */
function frame(ctx, x, y, w, h, colour, width) {
  ctx.fillStyle = colour;
  ctx.fillRect(x, y, w, width);
  ctx.fillRect(x, y + h - width, w, width);
  ctx.fillRect(x, y, width, h);
  ctx.fillRect(x + w - width, y, width, h);
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {import('./screens.js').Ui} ui
 * @param {{ chars: SelectCharacter[], t: number }} view  t: steps so far (the preview loop's clock)
 */
export function drawSelect(ctx, ui, view) {
  const L = SELECT_LAYOUT, s = ui.settings, p = ui.pick, one = s.players === 1, cx = WIDTH / 2;
  const anim = (/** @type {SelectCharacter} */ ch) => ({ ...createAnimator(), tag: previewTag(ch.sheet), t: view.t });
  drawTitleBack(ctx);
  drawPanel(ctx, 'panel dark', L.x, L.y, L.w, L.h);
  drawText(ctx, 'large-red', SELECT_TEXT.title[one ? 0 : 1], cx, L.y + 8, 'center');
  drawText(ctx, 'small-grey', `${modeLine(s)}${one ? `, LEVEL ${s.level}` : ''}, FIRST TO ${s.target}`, cx, L.y + 30, 'center');

  // the cards
  view.chars.forEach((ch, i) => {
    const x = L.CARD_X + i * L.CARD_STEP, left = x - L.CARD_W / 2, h = L.CARD_FEET + 20 - L.CARD_TOP;
    ctx.fillStyle = '#25242966';
    ctx.fillRect(left, L.CARD_TOP, L.CARD_W, h);
    drawSprite(ctx, ch.sheet, ch.preview(0), anim(ch), x, L.CARD_FEET, L.CARD_H);
    drawText(ctx, 'small', ch.name, x, L.CARD_FEET + 6, 'center');
    [0, 1].forEach(side => {
      if (p.at[side] !== i) return;
      const inset = side === 1 && p.at[0] === i ? 3 : 0;
      frame(ctx, left + inset, L.CARD_TOP + inset, L.CARD_W - 2 * inset, inset ? L.CARD_FEET + 5 - L.CARD_TOP - inset : h,
        FRAME[side], p.locked[side] ? 3 : 2);
      drawText(ctx, side === 0 ? 'small-red' : 'small', side === 0 ? 'P1' : one ? 'CPU' : 'P2',
        side === 0 ? left : left + L.CARD_W, L.CARD_TOP - 11, side === 0 ? 'left' : 'right');
    });
    hits.push({ x: left, y: L.CARD_TOP, w: L.CARD_W, h, sel: i });
  });

  // each side's choice, big, in its kit
  [0, 1].forEach(side => {
    const ch = view.chars[p.at[side]], x = L.SIDES[side];
    if (!ch) return;
    const cpu = one && side === 1;
    drawText(ctx, side === 0 ? 'small-red' : 'small', side === 0 ? 'P1' : cpu ? 'CPU' : 'P2', x, L.y + 48, 'center');
    drawSprite(ctx, ch.sheet, ch.preview(side), anim(ch), x, L.FEET, ART_HEIGHT);
    drawText(ctx, 'large-white', ch.name, x, L.FEET + 6, 'center');
    const lines = cpu ? (ui.touch ? SELECT_TEXT.cpuTouch : SELECT_TEXT.cpu)
      : [p.locked[side] ? SELECT_TEXT.picked : SELECT_TEXT.choose];
    // with touch the SOFT button sits over the lines under the CPU, so they go above its figure, and only the figure
    // is tapped to roll another
    const top = cpu && ui.touch ? L.y + 58 : L.FEET + 30;
    lines.forEach((l, i) => drawText(ctx, p.locked[side] && !cpu ? 'small-red' : 'small-grey', l, x, top + i * 11, 'center'));
    if (cpu) hits.push({ x: x - 60, y: L.y + 44, w: 120, h: L.FEET + 4 - L.y - 44, sel: SELECT_REROLL });
  });

  drawText(ctx, 'small-grey', SELECT_TEXT.same, cx, L.y + L.h - 62, 'center');
  drawText(ctx, 'small', ui.touch ? SELECT_TEXT.touchHint : one ? SELECT_TEXT.hint1 : SELECT_TEXT.hint2, cx,
    L.y + L.h - 22, 'center');
}
