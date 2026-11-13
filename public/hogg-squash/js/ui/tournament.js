// @ts-check
// The tournament's plain screens (S17; the art comes in A12 and S18), each on a dark panel over the title art:
//  - the menu when a tournament is saved (Continue / New tournament) and the question before replacing it;
//  - the setup: players (2–32), humans, Same or Rising match length, first to …, the bots' level, START;
//  - the characters: every slot in a list (P1, P2 … in red, the bots numbered), the selected one big beside it;
//  - the bracket: one round at a time (left / right for the others), each match's two labels and its score, the next
//    match marked and named under it, with PLAY, or WATCH and SKIP;
//  - the champion, with each human's wins and tries.
// The moves are screens.js's; this file only draws (and records what can be tapped).
import { WIDTH } from '../engine/screen.js';
import { drawText, textWidth } from '../render/text.js';
import { drawPanel, slice } from '../render/ui.js';
import { createAnimator, drawSprite, ART_HEIGHT } from '../render/sprites.js';
import { previewTag } from '../render/roster.js';
import { drawList, drawHighlight, drawCursor, hits, BAR } from './menu.js';
import { drawTitleBack, MENU } from './title.js';
import { TMENU_ITEMS, TCONFIRM_ITEMS, TSETUP_ROWS, MODE_LABELS, CHAMPION_ITEMS, TSELECT_START, TSELECT_NEXT,
  BRACKET_PREV, BRACKET_NEXT, bracketItems, setupValue, setupValues } from './screens.js';
import { roundCount, roundNameOf, lengthsFor, entrantLabel, isHuman, playersOf, nextMatch, champion, humanRecord }
  from '../sim/tournament.js';

/**
 * What the screens draw of the characters: a name for each id, and (once the sprites have loaded) each one's preview.
 * @typedef {{ name: (id: string) => string, char?: (id: string) => import('./select.js').SelectCharacter | undefined,
 *   t: number }} TourView
 */

export const TOUR_TEXT = {
  heading: 'TOURNAMENT',
  saved: 'A tournament is saved: carry on, or start again',
  confirm: 'START A NEW ONE?',
  confirmNote: 'The saved tournament will be lost',
  chars: 'CHARACTERS',
  charsNote: 'Each human picks theirs in turn. The bots are random: change any you like.',
  change: '< change >',
  champion: 'CHAMPION',
  tries: 'HUMANS',
  touchOne: 'With touch, one human only (more need a keyboard or gamepads)',
  menuHint: 'Up / down: choose     Enter or A: OK     Esc or B: back',
  setupHint: 'Up / down: choose     Left / right: change     Enter or A: OK     Esc or B: back',
  setupTouch: 'Tap a row to change it     SOFT: back',
  selectHint: 'Up / down: choose a player     Left / right: change     Enter or A: OK     Esc or B: back',
  selectTouch: 'Tap a player, then their figure to change it     SOFT: back',
  bracketHint: 'Up / down: choose     Enter or A: OK     Left / right: other rounds',
  bracketTouch: 'Tap one to choose it     Tap the arrows for other rounds',
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
  FIG_X: 500, FIG_FEET: 214, START_Y: 284 };

/** An entrant as listed: "P1 Ronin", "BOT 3 Coach Zain". @param {import('../sim/tournament.js').TournamentSetup | { humans: number }} s @param {number} e @param {string} name */
export const entrantLine = (s, e, name) => `${entrantLabel(/** @type {any} */ (s), e)} ${name}`;

/** @param {CanvasRenderingContext2D} ctx @param {import('./screens.js').Ui} ui @param {TourView} view */
export function drawTourSelect(ctx, ui, view) {
  const L = TSELECT_LAYOUT, d = ui.tour.draft, s = { humans: d.humans }, chars = ui.tour.chars;
  panel(ctx, TOUR_TEXT.chars);
  drawText(ctx, 'small-grey', TOUR_TEXT.charsNote, WIDTH / 2, TOUR_PANEL.y + 30, 'center');
  chars.forEach((id, e) => {
    const x = L.COLS[Math.floor(e / L.PER_COL)], y = L.TOP + (e % L.PER_COL) * L.ROW, on = ui.sel === e;
    if (on) {
      ctx.fillStyle = '#c8102e';
      ctx.fillRect(x - 4, y - 2, L.COL_W, L.ROW);
    }
    drawText(ctx, on ? 'small' : e < d.humans ? 'small-red' : 'small-grey', entrantLabel(/** @type {any} */ (s), e), x, y);
    drawText(ctx, 'small', view.name(id), x + L.LABEL_W, y);
    hits.push({ x: x - 4, y: y - 2, w: L.COL_W, h: L.ROW, sel: e });
  });
  const e = ui.sel < chars.length ? ui.sel : -1, id = chars[e];
  if (e >= 0) {                                            // the selected slot, big, in the kit it will mostly wear
    const ch = view.char?.(id), human = e < d.humans;
    drawText(ctx, human ? 'small-red' : 'small', entrantLabel(/** @type {any} */ (s), e), L.FIG_X, TOUR_PANEL.y + 48, 'center');
    if (ch) {
      drawSprite(ctx, ch.sheet, ch.preview(human ? 0 : 1), { ...createAnimator(), tag: previewTag(ch.sheet), t: view.t },
        L.FIG_X, L.FIG_FEET, ART_HEIGHT);
    }
    drawText(ctx, 'large-white', view.name(id), L.FIG_X, L.FIG_FEET + 4, 'center');
    drawText(ctx, 'small-grey', TOUR_TEXT.change, L.FIG_X, L.FIG_FEET + 26, 'center');
    hits.push({ x: L.FIG_X - 60, y: TOUR_PANEL.y + 60, w: 120, h: L.FIG_FEET + 40 - TOUR_PANEL.y - 60, sel: TSELECT_NEXT });
  }
  drawList(ctx, ['START'], ui.sel === chars.length ? 0 : -1, L.FIG_X, L.START_Y, { font: 'large-white', center: true,
    base: TSELECT_START });
  hintLine(ctx, ui.touch ? TOUR_TEXT.selectTouch : TOUR_TEXT.selectHint);
}

/** The bracket's layout: the first match row's top and step, the two columns' centres (a round of 16 matches), the
 * gap each side of the score, the next match's lines and the items' top. */
export const BRACKET_LAYOUT = { TOP: 54, ROW: 12, PER_COL: 8, COLS: [168, 472], GAP: 20, NEXT_Y: 156, ITEMS_Y: 204 };

/**
 * One match as the bracket shows it: each side's line (or "?" while not decided), the score (upper's first) or "v".
 * @param {import('../sim/tournament.js').Tournament} t @param {number} r @param {number} i @param {TourView} view
 */
export function matchLines(t, r, i, view) {
  const [a, b] = playersOf(t, r, i), m = t.rounds[r][i];
  const line = (/** @type {number | null} */ e) => (e === null ? '?' : entrantLine(t.setup, e, view.name(t.setup.chars[e])));
  return { upper: line(a), lower: line(b), score: m.scores ? `${m.scores[0]}–${m.scores[1]}` : 'v', a, b, winner: m.winner };
}

/** The next match's heading: "NEXT: SEMI-FINAL, FIRST TO 9, LEVEL 5, TRY 2". @param {import('../sim/tournament.js').MatchInfo} m */
export function nextLine(m) {
  return `NEXT: ${m.name}, FIRST TO ${m.length}, LEVEL ${m.level}${m.mustPlay ? '' : ': BOTS, WATCH OR SKIP'}${
    m.attempt > 1 ? `, TRY ${m.attempt}` : ''}`;
}

/** @param {CanvasRenderingContext2D} ctx @param {import('./screens.js').Ui} ui @param {TourView} view */
export function drawBracket(ctx, ui, view) {
  const t = ui.tour.t;
  if (!t) return;
  const L = BRACKET_LAYOUT, s = t.setup, r = ui.tour.view, R = t.rounds.length, next = nextMatch(t), cx = WIDTH / 2;
  const title = roundNameOf(s.size, r);
  panel(ctx, title);
  // the arrows to the other rounds, 6 px clear of the heading (a left-pointing cursor is drawn from its x rightwards,
  // a right-pointing one up to its x)
  const tw = textWidth('large-white', title), cw = slice('cursor')?.w ?? 8;
  if (r > 0) {
    drawCursor(ctx, cx - tw / 2 - 6 - cw, TOUR_PANEL.y + 8, -1);
    hits.push({ x: cx - tw / 2 - 40, y: TOUR_PANEL.y + 2, w: 36, h: 28, sel: BRACKET_PREV });
  }
  if (r < R - 1) {
    drawCursor(ctx, cx + tw / 2 + 6 + cw, TOUR_PANEL.y + 8, 1);
    hits.push({ x: cx + tw / 2 + 4, y: TOUR_PANEL.y + 2, w: 36, h: 28, sel: BRACKET_NEXT });
  }
  drawText(ctx, 'small-grey', `ROUND ${r + 1} OF ${R}: ${s.size} PLAYERS, ${whoLine(s.size, s.humans, s.level).toUpperCase()}`,
    cx, TOUR_PANEL.y + 30, 'center');
  const n = t.rounds[r].length, two = n > L.PER_COL;
  t.rounds[r].forEach((_, i) => {
    const mx = two ? L.COLS[Math.floor(i / L.PER_COL)] : cx, y = L.TOP + (i % L.PER_COL) * L.ROW;
    const ml = matchLines(t, r, i, view), done = ml.winner !== null, isNext = next?.round === r && next.index === i;
    const font = (/** @type {number | null} */ e) => (done && ml.winner !== e ? 'small-grey' : e !== null && isHuman(s, e) ? 'small-red' : 'small');
    drawText(ctx, font(ml.a), ml.upper, mx - L.GAP, y, 'right');
    drawText(ctx, done ? 'small' : 'small-grey', ml.score, mx, y, 'center');
    drawText(ctx, font(ml.b), ml.lower, mx + L.GAP, y, 'left');
    if (isNext) {
      drawText(ctx, 'small-red', '>', mx - (two ? 140 : 170), y, 'left');
      drawText(ctx, 'small-red', '<', mx + (two ? 140 : 170), y, 'right');
    }
  });
  const champ = champion(t);
  if (next) {
    const [p, q] = next.sides.map(e => entrantLine(s, e, view.name(s.chars[e])));
    drawText(ctx, 'small-grey', nextLine(next), cx, L.NEXT_Y, 'center');
    drawText(ctx, 'large-white', `${p}  v  ${q}`, cx, L.NEXT_Y + 14, 'center');
  } else if (champ !== null) {
    drawText(ctx, 'small-grey', 'THE CHAMPION', cx, L.NEXT_Y, 'center');
    drawText(ctx, 'large-white', entrantLine(s, champ, view.name(s.chars[champ])), cx, L.NEXT_Y + 14, 'center');
  }
  drawList(ctx, bracketItems(ui), ui.sel, cx, L.ITEMS_Y, { font: 'large-white', center: true });
  hintLine(ctx, ui.touch ? TOUR_TEXT.bracketTouch : TOUR_TEXT.bracketHint);
}

/**
 * A human's line on the champion screen: "P1 Ronin: 3 wins in 4 tries", "P2 Adam: 1 win in 3 tries, out in the
 * SEMI-FINAL"; short (two columns, for many humans): "P2 Adam: 3 tries".
 * @param {import('../sim/tournament.js').Tournament} t @param {number} h @param {string} name @param {boolean} [short]
 */
export function triesLine(t, h, name, short = false) {
  const rec = humanRecord(t, h), tries = `${rec.tries} ${rec.tries === 1 ? 'try' : 'tries'}`;
  if (short) return `${entrantLine(t.setup, h, name)}: ${tries}`;
  return `${entrantLine(t.setup, h, name)}: ${rec.wins} ${rec.wins === 1 ? 'win' : 'wins'} in ${tries}${
    rec.out ? `, out in the ${rec.out}` : ''}`;
}

/** The champion screen's layout: the figure, the list's columns and top, MENU's top; more humans than ONE_COL: two short columns. */
export const CHAMPION_LAYOUT = { FIG_X: 120, FIG_FEET: 220, LIST_X: [236, 432], TOP: 76, ROW: 12, ONE_COL: 16, MENU_Y: 300 };

/** @param {CanvasRenderingContext2D} ctx @param {import('./screens.js').Ui} ui @param {TourView} view */
export function drawChampion(ctx, ui, view) {
  const t = ui.tour.t, L = CHAMPION_LAYOUT;
  if (!t) return;
  const s = t.setup, champ = champion(t);
  panel(ctx, TOUR_TEXT.champion);
  if (champ !== null) {
    const id = s.chars[champ], ch = view.char?.(id);
    drawText(ctx, 'large-white', entrantLine(s, champ, view.name(id)), WIDTH / 2, TOUR_PANEL.y + 30, 'center');
    if (ch) {
      drawSprite(ctx, ch.sheet, ch.preview(0), { ...createAnimator(), tag: previewTag(ch.sheet), t: view.t },
        L.FIG_X, L.FIG_FEET, ART_HEIGHT);
    }
  }
  drawText(ctx, 'small-red', TOUR_TEXT.tries, L.LIST_X[0], L.TOP - 14);
  const short = s.humans > L.ONE_COL;
  for (let h = 0; h < s.humans; h++) {
    const col = short ? Math.floor(h / L.ONE_COL) : 0, y = L.TOP + (h % L.ONE_COL) * L.ROW;
    drawText(ctx, h === champ ? 'small' : 'small-grey', triesLine(t, h, view.name(s.chars[h]), short), L.LIST_X[col], y);
  }
  drawList(ctx, CHAMPION_ITEMS, ui.sel, WIDTH / 2, L.MENU_Y, { font: 'large-white', center: true });
}
