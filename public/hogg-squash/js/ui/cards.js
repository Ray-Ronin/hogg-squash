// @ts-check
// The characters screen's layout (S19): where each card goes, in one row or two, and the moves between the rows.
// Kept apart from select.js's drawing so screens.js (no drawing) can use it for up / down.
import { WIDTH } from '../engine/screen.js';

/**
 * The panel, each side's big figure (centre x, feet y) and its "?" panel's size, and the cards (spacing, feet y, size;
 * one centred row up to ROW_MAX cards, the "?" card last). With more there are two rows, their tops at TOPS2 (S19):
 * the same card size, 3 px between a row's bottom and the next row's P1 / P2 labels.
 */
export const SELECT_LAYOUT = {
  x: 16, y: 6, w: 608, h: 348,
  SIDES: [104, 536], FEET: 196, RANDOM_W: 64, RANDOM_H: 96,
  CARD_STEP: 64, CARD_W: 60, CARD_TOP: 92, CARD_FEET: 176, CARD_H: 72,
  ROW_MAX: 5, TOPS2: [60, 178],
};

/**
 * Where card i of `count` goes: its centre x, its box (left, top, w, h), its figure's feet y and height, and its row
 * (0 or 1). Up to ROW_MAX cards: one row, as S18b drew it. More: two rows, the first full (ROW_MAX cards; past
 * 2 × ROW_MAX, half of them rounded up, narrower so the row stays as wide) and the second centred under it.
 * @param {number} i @param {number} count
 * @returns {{ x: number, left: number, top: number, w: number, h: number, feet: number, figure: number, row: number }}
 */
export function cardRect(i, count) {
  const L = SELECT_LAYOUT, h = L.CARD_FEET + 20 - L.CARD_TOP;
  const cols = count <= L.ROW_MAX ? count : Math.max(L.ROW_MAX, Math.ceil(count / 2));
  const step = Math.min(L.CARD_STEP, Math.floor(L.CARD_STEP * L.ROW_MAX / cols));
  const w = step - (L.CARD_STEP - L.CARD_W), row = i < cols ? 0 : 1;
  const inRow = row ? count - cols : Math.min(cols, count), j = row ? i - cols : i;
  const x = WIDTH / 2 + (j - (inRow - 1) / 2) * step;
  const top = count <= L.ROW_MAX ? L.CARD_TOP : L.TOPS2[row], feet = top + L.CARD_FEET - L.CARD_TOP;
  return { x, left: x - w / 2, top, w, h, feet, figure: Math.round(L.CARD_H * w / L.CARD_W), row };
}

/** Card i's centre x among `count` cards. @param {number} i @param {number} count */
export const cardX = (i, count) => cardRect(i, count).x;

/**
 * Up / down from card i of `count`: the nearest card in the other row (the left one of two as near), or null when
 * there's no row that way (one row; up from the top row, down from the bottom one).
 * @param {number} i @param {number} count @param {'up' | 'down'} dir @returns {number | null}
 */
export function cardBelow(i, count, dir) {
  const row = cardRect(i, count).row + (dir === 'down' ? 1 : -1), x = cardRect(i, count).x;
  let best = null, gap = Infinity;
  for (let k = 0; k < count; k++) {
    const c = cardRect(k, count);
    if (c.row === row && Math.abs(c.x - x) < gap) [best, gap] = [k, Math.abs(c.x - x)];
  }
  return best;
}

