// @ts-check
// The key test (docs/controls.md, "Keyboard ghosting"): a keyboard drawn on a dark panel over the title art, every
// key held lit up red, the players' keys a lighter grey, and under it each player's six actions, lit while their key
// is held. Players hold their keys together: one that doesn't light is a key their keyboard drops in that combination.
// Every key is under test, so only Esc (or B on a pad) leaves; keys not on the drawing are listed by name.
import { WIDTH } from '../engine/screen.js';
import { drawText, textWidth } from '../render/text.js';
import { drawPanel } from '../render/ui.js';
import { ACTIONS, keyLabel } from '../input/keymap.js';
import { drawTitleBack } from './title.js';

export const KEYTEST_TEXT = {
  lines: ['Hold your keys down together: each one lights up while it is held.',
    "One that doesn't light up is a key your keyboard can't register with the others."],
  hint: 'Esc or B: back',
  touchHint: 'Tap to go back',
};

/** One key unit (px), the gap between keys, a row's height, and the drawing's top-left. */
const KB = { U: 25, GAP: 2, ROW: 20, X: 32, Y: 74 };

/**
 * The keyboard as [code, label, x, row, width, height] in key units (a full-size US layout: the main block, the
 * cursor keys and the numpad). Labels use only what the font has (no ` = [ ] \ ; or *).
 * @type {[string, string, number, number, number, number][]}
 */
export const KEYS = (() => {
  /** @type {[string, string, number, number, number, number][]} */
  const out = [];
  /** A row of keys from x: [code, label, width] (an empty code is a gap). @param {number} row @param {number} x @param {[string, string, number?][]} list */
  const row = (row, x, list) => {
    for (const [code, label, w = 1] of list) {
      if (code) out.push([code, label, x, row, w, 1]);
      x += w;
    }
  };
  const letters = (/** @type {string} */ s) => [...s].map(c => /** @type {[string, string]} */ ([`Key${c}`, c]));
  row(0, 0, [['Escape', 'Esc'], ['', '', 1], ...[1, 2, 3, 4].map(n => /** @type {[string, string]} */ ([`F${n}`, `F${n}`])),
    ['', '', 0.5], ...[5, 6, 7, 8].map(n => /** @type {[string, string]} */ ([`F${n}`, `F${n}`])), ['', '', 0.5],
    ...[9, 10, 11, 12].map(n => /** @type {[string, string]} */ ([`F${n}`, `F${n}`]))]);
  row(1, 0, [['Backquote', ''], ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(n => /** @type {[string, string]} */ ([`Digit${n}`, `${n}`])),
    ['Minus', '-'], ['Equal', ''], ['Backspace', 'Bksp', 2]]);
  row(2, 0, [['Tab', 'Tab', 1.5], ...letters('QWERTYUIOP'), ['BracketLeft', ''], ['BracketRight', ''], ['Backslash', '', 1.5]]);
  row(3, 0, [['CapsLock', 'Caps', 1.75], ...letters('ASDFGHJKL'), ['Semicolon', ''], ['Quote', "'"], ['Enter', 'Enter', 2.25]]);
  row(4, 0, [['ShiftLeft', 'Shift', 2.25], ...letters('ZXCVBNM'), ['Comma', ','], ['Period', '.'], ['Slash', '/'],
    ['ShiftRight', 'Shift', 2.75]]);
  row(5, 0, [['ControlLeft', 'Ctrl', 1.25], ['MetaLeft', 'Win', 1.25], ['AltLeft', 'Alt', 1.25], ['Space', 'Space', 6.25],
    ['AltRight', 'Alt', 1.25], ['MetaRight', 'Win', 1.25], ['ContextMenu', 'Menu', 1.25], ['ControlRight', 'Ctrl', 1.25]]);
  // the cursor keys
  row(0, 15.5, [['PrintScreen', 'Prt'], ['ScrollLock', 'Scr'], ['Pause', 'Pau']]);
  row(1, 15.5, [['Insert', 'Ins'], ['Home', 'Hm'], ['PageUp', 'PgU']]);
  row(2, 15.5, [['Delete', 'Del'], ['End', 'End'], ['PageDown', 'PgD']]);
  row(4, 16.5, [['ArrowUp', 'Up']]);
  row(5, 15.5, [['ArrowLeft', 'Lt'], ['ArrowDown', 'Dn'], ['ArrowRight', 'Rt']]);
  // the numpad (+ and Enter are two rows tall)
  row(1, 19, [['NumLock', 'Num'], ['NumpadDivide', '/'], ['NumpadMultiply', 'x'], ['NumpadSubtract', '-']]);
  row(2, 19, [['Numpad7', '7'], ['Numpad8', '8'], ['Numpad9', '9']]);
  row(3, 19, [['Numpad4', '4'], ['Numpad5', '5'], ['Numpad6', '6']]);
  row(4, 19, [['Numpad1', '1'], ['Numpad2', '2'], ['Numpad3', '3']]);
  row(5, 19, [['Numpad0', '0', 2], ['NumpadDecimal', '.']]);
  out.push(['NumpadAdd', '+', 22, 2, 1, 2], ['NumpadEnter', 'Ent', 22, 4, 1, 2]);
  return out;
})();

/** A key's box on screen. @param {[string, string, number, number, number, number]} k */
export function keyBox([, , x, row, w, h]) {
  const top = KB.Y + row * KB.ROW + (row > 0 ? 4 : 0);   // a little gap under the function keys
  return { x: Math.round(KB.X + x * KB.U), y: top, w: Math.round(w * KB.U) - KB.GAP, h: h * KB.ROW - KB.GAP };
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {string[]} held  every key held (KeyboardEvent.code)
 * @param {import('../input/keymap.js').KeyLayout[]} layouts
 * @param {boolean} [touch]  the touch controls are showing (the hint says to tap)
 */
export function drawKeyTest(ctx, held, layouts, touch = false) {
  const cx = WIDTH / 2, on = new Set(held), used = new Set(layouts.flatMap(l => Object.values(l)));
  drawTitleBack(ctx);
  drawPanel(ctx, 'panel dark', 16, 10, WIDTH - 32, 338);
  drawText(ctx, 'large-red', 'KEY TEST', cx, 18, 'center');
  KEYTEST_TEXT.lines.forEach((l, i) => drawText(ctx, 'small-grey', l, cx, 44 + i * 11, 'center'));

  for (const k of KEYS) {
    const b = keyBox(k), lit = on.has(k[0]);
    ctx.fillStyle = lit ? '#c8102e' : used.has(k[0]) ? '#5a5962' : '#2a2a30';
    ctx.fillRect(b.x, b.y, b.w, b.h);
    drawText(ctx, lit || used.has(k[0]) ? 'small' : 'small-grey', k[1], b.x + b.w / 2, b.y + Math.floor((b.h - 9) / 2) + 1,
      'center');
  }

  // each player's actions: "UP W", lit while held
  const top = KB.Y + 6 * KB.ROW + 14;
  layouts.forEach((l, p) => {
    const y = top + p * 16;
    drawText(ctx, p === 0 ? 'small-red' : 'small', `P${p + 1}`, 48, y);
    ACTIONS.forEach((a, i) => {
      const label = `${a.toUpperCase()} ${keyLabel(l[a])}`, x = 76 + i * 88, w = textWidth('small', label) + 8;
      if (on.has(l[a])) {
        ctx.fillStyle = '#c8102e';
        ctx.fillRect(x - 4, y - 3, w, 14);
      }
      drawText(ctx, on.has(l[a]) ? 'small' : 'small-grey', label, x, y);
    });
  });

  const drawn = new Set(KEYS.map(k => k[0])), others = held.filter(c => !drawn.has(c)).map(keyLabel);
  const count = `Keys held: ${held.length}${others.length ? `   (also ${others.join(', ')})` : ''}`;
  drawText(ctx, 'small', count, cx, top + 40, 'center');
  drawText(ctx, 'small-grey', touch ? KEYTEST_TEXT.touchHint : KEYTEST_TEXT.hint, cx, 330, 'center');
}
