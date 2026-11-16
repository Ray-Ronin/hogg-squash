// @ts-check
// The tournament's screens, each on a dark panel over the title art (S17's plain ones; the bracket, the round title
// card and the champion in A12's look since S18: docs/decisions.md, "Tournament", "The look (A12)"; copied from
// art/tools/a12-mock.js):
//  - the menu when a tournament is saved (Continue / New tournament) and the question before replacing it;
//  - the setup: players (2–16), humans, Same or Rising match length, first to …, the bots' level, START;
//  - the characters: every slot in a list (P1, P2 … in red, the bots numbered), the selected one big beside it; a
//    slot can be "?" (random, S18b); RANDOM BOTS (when there are bots) and START under the figure;
//  - the bracket: the whole of it on one screen, the halves facing, the trophy and the final in the middle; the next
//    match framed in red and named under it, with PLAY, or WATCH, SKIP and SKIP BOT MATCHES (and NEW DRAW until the
//    first result, S18b: five items go in two columns);
//  - the round title card over the court before a played or watched match;
//  - the champion: the gold trophy, the champion (a human or a bot) beside it, each human's wins and where they went out.
// The moves are screens.js's; this file only draws (and records what can be tapped).
import { WIDTH } from '../engine/screen.js';
import { drawText, textWidth } from '../render/text.js';
import { drawPanel } from '../render/ui.js';
import { createAnimator, drawSprite, ART_HEIGHT } from '../render/sprites.js';
import { previewTag } from '../render/roster.js';
import { drawList, drawHighlight, drawCursor, hits, BAR } from './menu.js';
import { drawTitleBack, MENU } from './title.js';
import { TMENU_ITEMS, TCONFIRM_ITEMS, TSETUP_ROWS, MODE_LABELS, CHAMPION_ITEMS, TSELECT_START, TSELECT_NEXT,
  TSELECT_BOTS, RANDOM_CHAR, BRACKET_COL, bracketItems, setupValue, setupValues, tselectItems } from './screens.js';
import { drawRandomPanel, SELECT_TEXT } from './select.js';
import { roundCount, roundNameOf, lengthsFor, entrantLabel, isHuman, playersOf, nextMatch, champion, humanRecord }
  from '../sim/tournament.js';

/**
 * What the screens draw of the characters: a name for each id (and a shorter one, if it has one, for tight places),
 * and (once the sprites have loaded) each one's preview.
 * @typedef {{ name: (id: string) => string, short?: (id: string) => string | null,
 *   char?: (id: string) => import('./select.js').SelectCharacter | undefined, t: number }} TourView
 */

/** The palette entries the tournament's drawing uses (art/palette/hogg-squash.gpl; as A12's mockups). */
export const TOUR_COLOURS = {
  margin: '#16161a', black: '#252429', blackLight: '#3a3940', grey1: '#5a5962', grey2: '#8a8a94', white: '#ffffff',
  red2: '#7a0a14', hogg: '#c8102e', kit: '#e8202a',
};
const C = TOUR_COLOURS;

// --- A12's sheet: the trophies (assets/tournament.png + .json, slices with pivots) ---

/** @type {{ image: CanvasImageSource, slices: Record<string, { x: number, y: number, w: number, h: number, pivot: { x: number, y: number } }> } | null} */
let tourArt = null;

/** Draw the trophies from this sheet from now on (main.js, once loaded). @param {CanvasImageSource} image @param {any} json */
export function useTournamentArt(image, json) {
  const list = json?.meta?.slices;
  if (!Array.isArray(list)) throw new Error('tournament.json: no slices');
  /** @type {NonNullable<typeof tourArt>['slices']} */
  const slices = {};
  for (const s of list) slices[s.name] = { ...s.keys[0].bounds, pivot: s.keys[0].pivot ?? { x: 0, y: 0 } };
  tourArt = { image, slices };
}

/** Draw a slice of A12's sheet with its pivot at x, y (nothing before it has loaded). @param {CanvasRenderingContext2D} ctx @param {string} name @param {number} x @param {number} y */
function piece(ctx, name, x, y) {
  const s = tourArt?.slices[name];
  if (!tourArt || !s) return;
  ctx.drawImage(tourArt.image, s.x, s.y, s.w, s.h, Math.round(x - s.pivot.x), Math.round(y - s.pivot.y), s.w, s.h);
}

export const TOUR_TEXT = {
  heading: 'TOURNAMENT',
  saved: 'A tournament is saved: carry on, or start again',
  confirm: 'START A NEW ONE?',
  confirmNote: 'The saved tournament will be lost',
  chars: 'CHARACTERS',
  charsNote: 'Each human picks theirs in turn. The bots are random: change any you like.',
  change: '< change >',
  champion: 'CHAMPION',
  humans: 'THE HUMANS',
  touchOne: 'With touch, one human only (more need a keyboard or gamepads)',
  menuHint: 'Up / down: choose     Enter or A: OK     Esc or B: back',
  setupHint: 'Up / down: choose     Left / right: change     Enter or A: OK     Esc or B: back',
  setupTouch: 'Tap a row to change it     SOFT: back',
  selectHint: 'Up / down: choose a player     Left / right: change     Enter or A: OK     Esc or B: back',
  selectTouch: 'Tap a player, then their figure to change it     SOFT: back',
  menuTouch: 'Tap one to choose it     SOFT: back',
};

/** The panel all of them draw on, and the hint line's place in it. */
export const TOUR_PANEL = { x: 16, y: 6, w: 608, h: 348, HINT_Y: 330 };

/** @param {CanvasRenderingContext2D} ctx @param {string} heading */
function panel(ctx, heading) {
  const P = TOUR_PANEL;
  drawTitleBack(ctx);
  drawPanel(ctx, 'panel dark', P.x, P.y, P.w, P.h);
  drawText(ctx, 'large-red', heading, WIDTH / 2, P.y + 8, 'center');
}

/** @param {CanvasRenderingContext2D} ctx @param {string} hint */
const hintLine = (ctx, hint) => drawText(ctx, 'small', hint, WIDTH / 2, TOUR_PANEL.HINT_Y, 'center');

/** "1 human and 7 bots at level 5". @param {number} size @param {number} humans @param {number} level */
export function whoLine(size, humans, level) {
  const h = `${humans} ${humans === 1 ? 'human' : 'humans'}`, bots = size - humans;
  return bots ? `${h} and ${bots} ${bots === 1 ? 'bot' : 'bots'} at level ${level}` : `${h}, no bots`;
}

/** "3 rounds: QUARTER-FINAL, SEMI-FINAL, FINAL". @param {number} size */
export function roundsLine(size) {
  const R = roundCount(size);
  return `${R} ${R === 1 ? 'round' : 'rounds'}: ${Array.from({ length: R }, (_, r) => roundNameOf(size, r)).join(', ')}`;
}

/** "Every match first to 11, win by 2", or the rising lengths round by round. @param {import('./screens.js').TourDraft} d */
export function lengthsLine(d) {
  if (d.mode === 'same') return `Every match first to ${d.same}, win by 2`;
  return `First to ${lengthsFor('rising', d.start, d.size).join(', ')}, round by round, win by 2`;
}

/** The menu when a tournament is saved, or the question before starting a new one. @param {CanvasRenderingContext2D} ctx @param {import('./screens.js').Ui} ui */
export function drawTourMenu(ctx, ui) {
  const cx = MENU.x + MENU.w / 2, confirm = ui.screen === 'tconfirm';
  drawTitleBack(ctx);
  drawText(ctx, 'large-red', confirm ? TOUR_TEXT.confirm : TOUR_TEXT.heading, cx, MENU.y + 2, 'center');
  drawText(ctx, 'small-dark', confirm ? TOUR_TEXT.confirmNote : TOUR_TEXT.saved, cx, MENU.y + 24, 'center');
  drawList(ctx, confirm ? TCONFIRM_ITEMS : TMENU_ITEMS, ui.sel, cx, MENU.y + 42, { center: true });
  drawText(ctx, 'small', ui.touch ? TOUR_TEXT.menuTouch : TOUR_TEXT.menuHint, WIDTH / 2, 305, 'center');
}

/** The setup rows' layout: the labels' x, the values' centre, the first row's top and the step; START's top. */
export const SETUP_LAYOUT = { LABEL_X: 120, VALUE_X: 440, TOP: 44, ROW: 24, START_Y: 172, NOTES_Y: 204 };

/** A setup row's value as shown. @param {import('./screens.js').Ui} ui @param {number} row */
export function setupLabel(ui, row) {
  const d = ui.tour.draft, v = setupValue(d, row);
  if (row === 4 && d.humans >= d.size) return '-';
  return typeof v === 'string' && v in MODE_LABELS ? MODE_LABELS[/** @type {'same' | 'rising'} */ (v)] : String(v);
}

/** @param {CanvasRenderingContext2D} ctx @param {import('./screens.js').Ui} ui */
export function drawTourSetup(ctx, ui) {
  const L = SETUP_LAYOUT, d = ui.tour.draft, cx = WIDTH / 2;
  panel(ctx, TOUR_TEXT.heading);
  TSETUP_ROWS.forEach((label, row) => {
    const start = row === TSETUP_ROWS.length - 1, y = start ? L.START_Y : L.TOP + row * L.ROW, on = ui.sel === row;
    if (start) {
      const w = textWidth('large-white', label);
      if (on) drawHighlight(ctx, cx - w / 2, y, w);
      drawText(ctx, 'large-white', label, cx, y, 'center');
      hits.push({ x: cx - w / 2 - BAR.PAD, y: y - 3, w: w + 2 * BAR.PAD, h: BAR.ROW, sel: row });
      return;
    }
    drawText(ctx, on ? 'large-white' : 'large-red', label, L.LABEL_X, y);
    const v = setupLabel(ui, row), w = textWidth('large-white', v), x = L.VALUE_X - w / 2;
    if (on && setupValues(ui, row).length > 1) {
      drawHighlight(ctx, x, y, w, false);
      drawCursor(ctx, x - BAR.PAD - 4, y, 1);
      drawCursor(ctx, x + w + BAR.PAD + 4, y, -1);
    }
    drawText(ctx, 'large-white', v, L.VALUE_X, y, 'center');
    hits.push({ x: L.LABEL_X - 20, y: y - 3, w: L.VALUE_X + 80 - L.LABEL_X, h: BAR.ROW, sel: row });
  });
  const notes = [roundsLine(d.size), lengthsLine(d), whoLine(d.size, d.humans, d.level)];
  if (ui.touch) notes.push(TOUR_TEXT.touchOne);
  notes.forEach((n, i) => drawText(ctx, 'small-grey', n, cx, L.NOTES_Y + i * 13, 'center'));
  hintLine(ctx, ui.touch ? TOUR_TEXT.setupTouch : TOUR_TEXT.setupHint);
}

/** The characters screen's list: the columns' x, the first row's top, the row step, rows per column; the figure. */
export const TSELECT_LAYOUT = { COLS: [40, 200], TOP: 54, ROW: 11, PER_COL: 16, LABEL_W: 40, COL_W: 152,
  FIG_X: 500, FIG_FEET: 214, START_Y: 290, ITEM_ROW: 22 };

/** An entrant as listed: "P1 Ronin", "BOT 3 Coach Zain". @param {import('../sim/tournament.js').TournamentSetup | { humans: number }} s @param {number} e @param {string} name */
export const entrantLine = (s, e, name) => `${entrantLabel(/** @type {any} */ (s), e)} ${name}`;

/** @param {CanvasRenderingContext2D} ctx @param {import('./screens.js').Ui} ui @param {TourView} view */
export function drawTourSelect(ctx, ui, view) {
  const L = TSELECT_LAYOUT, d = ui.tour.draft, s = { humans: d.humans }, chars = ui.tour.chars;
  panel(ctx, TOUR_TEXT.chars);
  drawText(ctx, 'small-grey', TOUR_TEXT.charsNote, WIDTH / 2, TOUR_PANEL.y + 30, 'center');
  const nameOf = (/** @type {string} */ id) => (id === RANDOM_CHAR ? SELECT_TEXT.random : view.name(id));
  chars.forEach((id, e) => {
    const x = L.COLS[Math.floor(e / L.PER_COL)], y = L.TOP + (e % L.PER_COL) * L.ROW, on = ui.sel === e;
    if (on) {
      ctx.fillStyle = '#c8102e';
      ctx.fillRect(x - 4, y - 2, L.COL_W, L.ROW);
    }
    drawText(ctx, on ? 'small' : e < d.humans ? 'small-red' : 'small-grey', entrantLabel(/** @type {any} */ (s), e), x, y);
    drawText(ctx, 'small', nameOf(id), x + L.LABEL_W, y);
    hits.push({ x: x - 4, y: y - 2, w: L.COL_W, h: L.ROW, sel: e });
  });
  const e = ui.sel < chars.length ? ui.sel : -1, id = chars[e];
  if (e >= 0) {                                            // the selected slot, big, in the kit it will mostly wear
    const ch = view.char?.(id), human = e < d.humans;
    drawText(ctx, human ? 'small-red' : 'small', entrantLabel(/** @type {any} */ (s), e), L.FIG_X, TOUR_PANEL.y + 48, 'center');
    if (id === RANDOM_CHAR) drawRandomPanel(ctx, L.FIG_X, L.FIG_FEET, 64, 96);
    else if (ch) {
      drawSprite(ctx, ch.sheet, ch.preview(human ? 0 : 1), { ...createAnimator(), tag: previewTag(ch.sheet), t: view.t },
        L.FIG_X, L.FIG_FEET, ART_HEIGHT);
    }
    drawText(ctx, 'large-white', nameOf(id), L.FIG_X, L.FIG_FEET + 4, 'center');
    drawText(ctx, 'small-grey', TOUR_TEXT.change, L.FIG_X, L.FIG_FEET + 26, 'center');
    hits.push({ x: L.FIG_X - 60, y: TOUR_PANEL.y + 60, w: 120, h: L.FIG_FEET + 40 - TOUR_PANEL.y - 60, sel: TSELECT_NEXT });
  }
  // RANDOM BOTS (when there are bots) over START
  const items = tselectItems(ui), first = chars.length;
  items.forEach((item, i) => drawList(ctx, [item], ui.sel === first + i ? 0 : -1, L.FIG_X,
    L.START_Y - (items.length - 1 - i) * L.ITEM_ROW, { font: i === items.length - 1 ? 'large-white' : 'large-red', center: true,
      base: i === items.length - 1 ? TSELECT_START : TSELECT_BOTS }));
  hintLine(ctx, ui.touch ? TOUR_TEXT.selectTouch : TOUR_TEXT.selectHint);
}

// --- the bracket (A12): the whole of it, the two halves facing, the final and the trophy in the middle ---

/**
 * The bracket's line of who is in it (the owner's words, A12; S18: people counted, not the bracket's size):
 * "1 PERSON, 7 BOTS, BOT LEVEL: 5", "2 PEOPLE, 14 BOTS, BOT LEVEL: 5", "4 PEOPLE, NO BOTS".
 * @param {{ size: number, humans: number, level: number }} s
 */
export function peopleLine(s) {
  const bots = s.size - s.humans, people = `${s.humans} ${s.humans === 1 ? 'PERSON' : 'PEOPLE'}`;
  return bots ? `${people}, ${bots} ${bots === 1 ? 'BOT' : 'BOTS'}, BOT LEVEL: ${s.level}` : `${people}, NO BOTS`;
}

/** The next match's line over its players: "NEXT: FIRST TO 9". @param {import('../sim/tournament.js').MatchInfo} m */
export const nextLine = m => `NEXT: FIRST TO ${m.length}`;

/** An entrant's name, or its short one where the name is wider than `max` in `font`. @param {TourView} view @param {string} id @param {import('../render/text.js').FontName} font @param {number} max */
function fitName(view, id, font, max) {
  const name = view.name(id), short = view.short?.(id);
  return textWidth(font, name) <= max || !short ? name : short;
}

/**
 * The bracket's layout: the panel's top rows; the first round's slots from TOP to BOTTOM (lower for 16 and up); slot
 * widths (the first round's cards, later rounds' tags) and the middle's width; the slot heights by style; the item rows.
 */
export const BRACKET_LAYOUT = { HEAD_Y: 12, WHO_Y: 32, TOP: 48, BOTTOM: 208, BOTTOM_BIG: 228, W0: 76, WT: 44, CENTRE: 92,
  SLOT_H: { card: 24, tag: 13, mini: 10 }, X0: 28, ITEM_ROW: 19, COL_DX: 120 };

/** A 1 px (or t px) frame around a box, outside it. @param {CanvasRenderingContext2D} ctx */
function frame(ctx, x, y, w, h, colour, t = 1) {
  ctx.fillStyle = colour;
  ctx.fillRect(x - t, y - t, w + 2 * t, t);
  ctx.fillRect(x - t, y + h, w + 2 * t, t);
  ctx.fillRect(x - t, y, t, h);
  ctx.fillRect(x + w, y, t, h);
}

/**
 * One slot of the bracket, its top-left at x, y. Style: 'card' (the label over the character's name), 'tag' (the
 * label), 'mini' (the label, short: only a 32-player bracket saved before S18). State: 'open' (not decided: "?"),
 * 'in' (still in, or the winner), 'out' (lost: grey); `next` frames it in red. Text is right-aligned on the right
 * half (flip). A human's slot has a red bar on the bracket's outer side.
 * @param {CanvasRenderingContext2D} ctx @param {import('../sim/tournament.js').TournamentSetup} s @param {number | null} e
 * @param {number} x @param {number} y @param {TourView} view
 * @param {{ style: 'card' | 'tag' | 'mini', state: 'open' | 'in' | 'out', next?: boolean, w: number, flip?: boolean }} o
 */
function slot(ctx, s, e, x, y, view, o) {
  const h = BRACKET_LAYOUT.SLOT_H[o.style], human = e !== null && isHuman(s, e), out = o.state === 'out';
  ctx.fillStyle = out ? C.margin : C.black;
  ctx.fillRect(x, y, o.w, h);
  if (human && !out) {
    ctx.fillStyle = C.hogg;
    ctx.fillRect(o.flip ? x + o.w - 2 : x, y, 2, h);
  }
  frame(ctx, x, y, o.w, h, o.next ? C.kit : out ? C.blackLight : o.state === 'in' ? (human ? C.hogg : C.grey2) : C.blackLight,
    o.next ? 2 : 1);
  const ty = y + Math.floor((h - 7) / 2);
  if (e === null) {
    drawText(ctx, 'small-grey', '?', x + o.w / 2, ty, 'center');
    return;
  }
  const label = entrantLabel(s, e), font = out ? 'small-grey' : human ? 'small-red' : 'small';
  const tx = o.flip ? x + o.w - 5 : x + 5, al = o.flip ? 'right' : 'left';
  if (o.style !== 'card') drawText(ctx, font, label, x + o.w / 2, ty, 'center');
  else {
    drawText(ctx, font, label, tx, y + 3, al);
    drawText(ctx, out ? 'small-grey' : 'small', fitName(view, s.chars[e], 'small', o.w - 8), tx, y + 13, al);
  }
}

/** @param {CanvasRenderingContext2D} ctx */
function hline(ctx, x1, x2, y, colour, t = 1) {
  ctx.fillStyle = colour;
  ctx.fillRect(Math.min(x1, x2), y, Math.abs(x2 - x1), t);
}
/** @param {CanvasRenderingContext2D} ctx */
function vline(ctx, x, y1, y2, colour, t = 1) {
  ctx.fillStyle = colour;
  ctx.fillRect(x, Math.min(y1, y2), t, Math.abs(y2 - y1) + 1);
}

/** The colour of the line a winner walks on: white, kit red for a human; grey while not decided. @param {import('../sim/tournament.js').TournamentSetup} s @param {number | null} w */
const lineColour = (s, w) => (w === null ? C.grey1 : isHuman(s, w) ? C.kit : C.white);

/** A slot's points in its match, on its line just outside it (black behind, so the line doesn't run through them). @param {CanvasRenderingContext2D} ctx */
function points(ctx, str, won, x, yc, flip) {
  const w = textWidth('small', str), x0 = flip ? x - w - 2 : x;
  ctx.fillStyle = C.black;
  ctx.fillRect(x0, yc - 4, w + 2, 9);
  drawText(ctx, won ? 'small' : 'small-grey', str, x0 + 1, yc - 3);
}

/**
 * The bracket's geometry for a size: each round's column x on the left half (the right half mirrors it), each slot's
 * width and style by round, the gap between columns, and a slot's centre y (round r, slot j of its half).
 * @param {number} size
 */
export function bracketGeometry(size) {
  const L = BRACKET_LAYOUT, R = roundCount(size), big = size > 16;
  const half = size / 2, bottom = size >= 16 ? L.BOTTOM_BIG : L.BOTTOM, pitch0 = (bottom - L.TOP) / half;
  const w0 = big ? L.WT : L.W0, sideRoom = (WIDTH - 2 * L.X0 - L.CENTRE) / 2;
  const used = w0 + Math.max(R - 1, 0) * L.WT, gap = Math.min(30, Math.floor((sideRoom - used) / Math.max(R, 1)));
  const colX = [L.X0];
  for (let r = 1; r < R; r++) colX.push(colX[r - 1] + (r === 1 ? w0 : L.WT) + gap);
  return {
    R, bottom, gap, colX,
    width: (/** @type {number} */ r) => (r === 0 ? w0 : L.WT),
    style: (/** @type {number} */ r) => /** @type {'card' | 'tag' | 'mini'} */ (r > 0 ? 'tag' : big ? 'mini' : 'card'),
    yOf: (/** @type {number} */ r, /** @type {number} */ j) => L.TOP + pitch0 * ((j + 0.5) * 2 ** r),
  };
}

/** @param {CanvasRenderingContext2D} ctx @param {import('./screens.js').Ui} ui @param {TourView} view */
export function drawBracket(ctx, ui, view) {
  const t = ui.tour.t;
  if (!t) return;
  const L = BRACKET_LAYOUT, P = TOUR_PANEL, s = t.setup, next = nextMatch(t), cx = WIDTH / 2;
  drawTitleBack(ctx);
  drawPanel(ctx, 'panel dark', P.x, P.y, P.w, P.h);
  drawText(ctx, 'large-red', next ? next.name : 'THE CHAMPION', cx, L.HEAD_Y, 'center');
  drawText(ctx, 'small-grey', peopleLine(s), cx, L.WHO_Y, 'center');
  const G = bracketGeometry(s.size), R = G.R, GAP = G.gap, ymid = Math.round(G.yOf(R - 1, 0));
  for (const side of [0, 1]) {
    for (let r = 0; r < R; r++) {
      const n = (s.size >> r) / 2, style = G.style(r), h = L.SLOT_H[style], w = G.width(r);
      for (let j = 0; j < n; j++) {
        const global = side * n + j, match = Math.floor(global / 2), m = t.rounds[r][match];
        const e = playersOf(t, r, match)[global % 2];
        const state = e === null ? 'open' : m.winner === null || m.winner === e ? 'in' : 'out';
        const isNext = next?.round === r && next.index === match;
        const x = side ? WIDTH - G.colX[r] - w : G.colX[r], yc = Math.round(G.yOf(r, j)), y = yc - Math.floor(h / 2);
        const won = m.winner !== null && m.winner === e, tk = won ? 2 : 1, col = won ? lineColour(s, e) : C.grey1;
        const lx0 = side ? x : x + w;
        if (r < R - 1) {                               // on to the next round's slot
          const lx1 = side ? x - Math.floor(GAP / 2) : x + w + Math.floor(GAP / 2), ym = Math.round(G.yOf(r + 1, Math.floor(j / 2)));
          hline(ctx, lx0, lx1, yc, col, tk);
          vline(ctx, side ? lx1 - tk + 1 : lx1, yc, ym, col, tk);
          if (j % 2 === 0) {
            const lx2 = side ? x - GAP : x + w + GAP;
            hline(ctx, lx1, lx2, ym, m.winner === null ? C.grey1 : lineColour(s, m.winner), m.winner === null ? 1 : 2);
          }
        } else {                                       // a finalist: on into the champion's slot in the middle
          hline(ctx, lx0, side ? cx + 30 : cx - 30, yc, col, tk);
        }
        slot(ctx, s, e, x, y, view, { style, state, next: isNext, w, flip: !!side });
        // each player's points on their line (not in a saved 32's first round: no room)
        if (m.scores && e !== null && style !== 'mini') points(ctx, String(m.scores[global % 2]), won, side ? x - 2 : x + w + 2, yc, !!side);
      }
    }
  }
  // the middle: the trophy, the champion's slot, FINAL under it
  const champ = champion(t);
  piece(ctx, 'trophy small', cx - 1, ymid - 12);
  slot(ctx, s, champ, cx - 30, ymid - 6, view, { style: 'tag', state: champ === null ? 'open' : 'in', w: 60 });
  drawText(ctx, 'small-red', 'FINAL', cx, ymid + 12, 'center');
  // the next match (or the champion) and the choices
  const items = bracketItems(ui);
  let y = G.bottom + 14;
  const who = (/** @type {number} */ e) => entrantLine(s, e, view.name(s.chars[e]));
  if (next) {
    drawText(ctx, 'small-grey', nextLine(next), cx, y, 'center');
    drawText(ctx, 'large-white', `${who(next.sides[0])}  v  ${who(next.sides[1])}`, cx, y + 11, 'center');
    y += 34;
  } else if (champ !== null) {
    drawText(ctx, 'small-grey', 'THE CHAMPION', cx, y, 'center');
    drawText(ctx, 'large-white', who(champ), cx, y + 11, 'center');
    y += 34;
  }
  if (items.length > 4) {                                  // NEW DRAW makes five (S18b): two columns, three and two
    drawList(ctx, items.slice(0, BRACKET_COL), ui.sel, cx - L.COL_DX, y, { font: 'large-white', center: true, row: L.ITEM_ROW });
    drawList(ctx, items.slice(BRACKET_COL), ui.sel - BRACKET_COL, cx + L.COL_DX, y, { font: 'large-white', center: true,
      row: L.ITEM_ROW, base: BRACKET_COL });
  } else drawList(ctx, items, ui.sel, cx, y, { font: 'large-white', center: true, row: items.length > 2 ? L.ITEM_ROW : BAR.ROW });
}

// --- the round title card (A12): over the court before a played or watched match ---

/** The card's band across the front wall, and its rows. */
export const CARD_LAYOUT = { X: 120, Y: 96, W: 400, H: 84, NAME_Y: 10, RULES_Y: 46, PLAYERS_Y: 58, V_GAP: 16 };

/** The card's rules line: "FIRST TO 9, WIN BY 2, LEVEL 5" (no level for two humans). @param {import('../sim/tournament.js').MatchInfo} m */
export const cardRules = m => `FIRST TO ${m.length}, WIN BY 2${m.cpu[0] || m.cpu[1] ? `, LEVEL ${m.level}` : ''}`;

/**
 * The round's title card on a dark band across the front wall (the court is drawn first, by main.js): the round's name
 * in the 28 px lettering, the rules, and the two players (humans in red), P1's side on the left.
 * @param {CanvasRenderingContext2D} ctx @param {import('./screens.js').Ui} ui @param {TourView} view
 */
export function drawRoundCard(ctx, ui, view) {
  const t = ui.tour.t, m = ui.tour.match;
  if (!t || !m) return;
  const L = CARD_LAYOUT, s = t.setup, cx = WIDTH / 2, [a, b] = m.sides;
  drawPanel(ctx, 'panel dark', L.X, L.Y, L.W, L.H);
  drawText(ctx, 'huge-red', m.name, cx, L.Y + L.NAME_Y, 'center');
  drawText(ctx, 'small-grey', cardRules(m), cx, L.Y + L.RULES_Y, 'center');
  drawText(ctx, 'large-white', 'v', cx, L.Y + L.PLAYERS_Y, 'center');
  drawText(ctx, isHuman(s, a) ? 'large-red' : 'large-white', cardPlayer(s, a, view), cx - L.V_GAP, L.Y + L.PLAYERS_Y, 'right');
  drawText(ctx, isHuman(s, b) ? 'large-red' : 'large-white', cardPlayer(s, b, view), cx + L.V_GAP, L.Y + L.PLAYERS_Y, 'left');
}

/**
 * A player's line on the round card, "BOT 5 Adam": with the short name if the full one doesn't fit its half of the
 * band ("BOT 14 Zain").
 * @param {import('../sim/tournament.js').TournamentSetup} s @param {number} e @param {TourView} view
 */
export function cardPlayer(s, e, view) {
  const L = CARD_LAYOUT, id = s.chars[e], full = entrantLine(s, e, view.name(id)), short = view.short?.(id);
  return textWidth('large-white', full) <= L.W / 2 - L.V_GAP - 8 || !short ? full : entrantLine(s, e, short);
}

// --- the champion (A12) ---

/** "3 wins", "1 win". @param {number} n */
const winsWord = n => `${n} ${n === 1 ? 'win' : 'wins'}`;

/**
 * A human's record (S18b, no tries): "3 wins, champion", "1 win, out in the SEMI-FINAL", "0 wins, out in the
 * QUARTER-FINAL".
 * @param {{ wins: number, out: string | null, champion: boolean }} rec
 */
export const recordLine = rec => `${winsWord(rec.wins)}${rec.champion ? ', champion' : rec.out ? `, out in the ${rec.out}` : ''}`;

/**
 * A human's line on the champion screen when there are too many humans for the big rows: "P1 Ronin: 1 win, out in
 * the SEMI-FINAL"; short (two columns, a saved 32 only): "P2 Adam: 3 wins".
 * @param {import('../sim/tournament.js').Tournament} t @param {number} h @param {string} name @param {boolean} [short]
 */
export function humanLine(t, h, name, short = false) {
  const rec = humanRecord(t, h);
  return `${entrantLine(t.setup, h, name)}: ${short ? winsWord(rec.wins) : recordLine(rec)}`;
}

/**
 * The champion screen's layout: the heading; the red line the trophy and the champion stand on (FLOOR, from LINE_X,
 * LINE_W long), the trophy's and the champion's x, their name under it; the humans' list (BIG rows for up to BIG_MAX
 * humans, else small rows, in two short columns past ONE_COL); BACK TO THE TITLE.
 */
export const CHAMPION_LAYOUT = { HEAD_Y: 14, FLOOR: 262, LINE_X: 56, LINE_W: 200, TROPHY_X: 112, FIG_X: 196, NAME_X: 156,
  LIST_X: 330, LIST_X2: 478, LIST_Y: 70, BIG_ROW: 34, BIG_MAX: 6, ROW: 12, ONE_COL: 16, MENU_X: 470, MENU_Y: 312 };

/** @param {CanvasRenderingContext2D} ctx @param {import('./screens.js').Ui} ui @param {TourView} view */
export function drawChampion(ctx, ui, view) {
  const t = ui.tour.t, L = CHAMPION_LAYOUT, P = TOUR_PANEL;
  if (!t) return;
  const s = t.setup, champ = champion(t), cx = WIDTH / 2;
  drawTitleBack(ctx);
  drawPanel(ctx, 'panel dark', P.x, P.y, P.w, P.h);
  drawText(ctx, 'huge-red', TOUR_TEXT.champion, cx, L.HEAD_Y, 'center');
  if (champ !== null) {
    // a red line, the trophy on it, the champion beside it (the select screen's figure, in their kit)
    ctx.fillStyle = C.red2;
    ctx.fillRect(L.LINE_X, L.FLOOR, L.LINE_W, 3);
    ctx.fillStyle = C.hogg;
    ctx.fillRect(L.LINE_X, L.FLOOR, L.LINE_W, 1);
    piece(ctx, 'trophy', L.TROPHY_X, L.FLOOR);
    const id = s.chars[champ], ch = view.char?.(id), human = isHuman(s, champ);
    if (ch) {
      drawSprite(ctx, ch.sheet, ch.preview(human ? 0 : 1), { ...createAnimator(), tag: previewTag(ch.sheet), t: view.t },
        L.FIG_X, L.FLOOR, ART_HEIGHT);
    }
    drawText(ctx, human ? 'large-red' : 'large-white', entrantLine(s, champ, view.name(id)), L.NAME_X, L.FLOOR + 12, 'center');
    drawText(ctx, 'small-grey', `WON THE ${s.size}-PLAYER TOURNAMENT`, L.NAME_X, L.FLOOR + 32, 'center');
  }
  // the humans' records
  drawText(ctx, 'small-red', TOUR_TEXT.humans, L.LIST_X, L.LIST_Y);
  const big = s.humans <= L.BIG_MAX, short = s.humans > L.ONE_COL;
  for (let h = 0; h < s.humans; h++) {
    const name = view.name(s.chars[h]);
    if (big) {
      const y = L.LIST_Y + 16 + h * L.BIG_ROW;
      drawText(ctx, h === champ ? 'large-white' : 'large-red', entrantLine(s, h, name), L.LIST_X, y);
      drawText(ctx, 'small-grey', recordLine(humanRecord(t, h)), L.LIST_X, y + 18);
    } else {
      const col = short ? Math.floor(h / L.ONE_COL) : 0, y = L.LIST_Y + 16 + (h % L.ONE_COL) * L.ROW;
      drawText(ctx, h === champ ? 'small' : 'small-grey', humanLine(t, h, name, short), col ? L.LIST_X2 : L.LIST_X, y);
    }
  }
  drawList(ctx, CHAMPION_ITEMS, ui.sel, L.MENU_X, L.MENU_Y, { font: 'large-white', center: true });
}
