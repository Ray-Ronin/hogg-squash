// A12's tournament mockups, drawn with the game's own font, panels, title, court and character sheets, and A12's
// tournament sheet (assets/tournament.png: the trophies). Local tool only (never deployed). Serve with
// art/tools/a12-mock-server.mjs (launch config `a12-mock`), open http://localhost:8094/public/hogg-squash/?dev and run:
//   const m = await import('/art/tools/a12-mock.js'); await m.saveAll();
// Each mockup is 640×360 (the game's screen) and is saved to art/mockups/a12-<name>.png.
// The owner's calls (2026-11-14): brackets of 2–16 (no 32), no face crops yet (more characters come later),
// a SKIP BOT MATCHES choice before a bots' match; the owner's wording on the bracket; a gold trophy.
import { WIDTH, HEIGHT } from '/public/hogg-squash/js/engine/screen.js';
import { drawText, textWidth } from '/public/hogg-squash/js/render/text.js';
import { drawPanel } from '/public/hogg-squash/js/ui/../render/ui.js';
import { drawTitleBack } from '/public/hogg-squash/js/ui/title.js';
import { drawList } from '/public/hogg-squash/js/ui/menu.js';
import { drawCourt } from '/public/hogg-squash/js/render/court.js';
import { previewOf, previewTag } from '/public/hogg-squash/js/render/roster.js';
import * as T from '/public/hogg-squash/js/sim/tournament.js';

/** The palette entries the mockups use (art/palette/hogg-squash.gpl). */
export const C = {
  outline: '#0b0a0d', margin: '#16161a', black: '#252429', blackLight: '#3a3940', grey1: '#5a5962', grey2: '#8a8a94',
  grey3: '#b4b4bc', white: '#ffffff', red1: '#4a0610', red2: '#7a0a14', tin: '#a50d26', hogg: '#c8102e',
  kit: '#e8202a', hi: '#ff5a52', frontWall: '#f4f4f0',
};

// --- A12's sheet ---

/** @type {{ img: HTMLImageElement, slices: Record<string, { x: number, y: number, w: number, h: number, pivot?: { x: number, y: number } }> } | null} */
let sheet = null;
async function loadSheet() {
  const json = await (await fetch('/public/hogg-squash/assets/tournament.json?' + Date.now())).json();
  const img = new Image();
  img.src = '/public/hogg-squash/assets/tournament.png?' + Date.now();
  await img.decode();
  const slices = {};
  for (const s of json.meta.slices) slices[s.name] = { ...s.keys[0].bounds, pivot: s.keys[0].pivot };
  sheet = { img, slices };
}

/** Draw a slice of A12's sheet with its pivot (or top-left) at x, y. @param {CanvasRenderingContext2D} ctx */
function piece(ctx, name, x, y) {
  const s = sheet?.slices[name];
  if (!s || !sheet) return;
  const px = s.pivot?.x ?? 0, py = s.pivot?.y ?? 0;
  ctx.drawImage(sheet.img, s.x, s.y, s.w, s.h, Math.round(x - px), Math.round(y - py), s.w, s.h);
}

// --- the tournaments shown ---

/** Round-robin characters, the humans first. @param {number} size */
const charsFor = size => Array.from({ length: size }, (_, e) => ['ronin', 'adam', 'ben', 'zain'][e % 4]);

/**
 * A tournament played up to a point: every match is decided (a human always wins against a bot, the upper human
 * when two meet) until (round, index) `stopAt` is next.
 * @param {number} size @param {number} humans @param {[number, number]} stopAt @param {number} [seed]
 */
export function playedTo(size, humans, stopAt, seed = 12345) {
  const t = T.makeTournament({ size, humans, mode: 'rising', length: 5, level: 5, chars: charsFor(size), seed });
  for (;;) {
    const m = T.nextMatch(t);
    if (!m || (m.round === stopAt[0] && m.index === stopAt[1])) break;
    if (m.mustPlay) {
      const hs = T.isHuman(t.setup, m.sides[0]) ? 0 : 1, len = m.length;
      T.recordResult(t, /** @type {0 | 1} */ (hs), hs ? [len - 3, len] : [len, len - 4]);
    } else T.skipMatch(t);
  }
  return t;
}

// --- the pieces ---

/** A 1 px frame around a box, outside it. @param {CanvasRenderingContext2D} ctx */
function frame(ctx, x, y, w, h, colour, t = 1) {
  ctx.fillStyle = colour;
  ctx.fillRect(x - t, y - t, w + 2 * t, t);
  ctx.fillRect(x - t, y + h, w + 2 * t, t);
  ctx.fillRect(x - t, y, t, h);
  ctx.fillRect(x + w, y, t, h);
}

const NAMES = { ronin: 'Ronin', adam: 'Adam', ben: 'Ben', zain: 'Coach Zain' };
const nameOf = (/** @type {string} */ id) => NAMES[/** @type {keyof typeof NAMES} */ (id)] ?? id;

/** A slot's height by style: 'card' (label over the character's name), 'tag' (the label only). */
const SLOT_H = { card: 24, tag: 13 };

/**
 * One slot of the bracket, its top-left at x, y. State: 'open' (not decided: "?"), 'in' (still in, or the winner),
 * 'out' (lost: grey), with `next` framing it in red. Text is right-aligned on the right half (flip).
 * @param {CanvasRenderingContext2D} ctx @param {T.TournamentSetup} s @param {number | null} e
 * @param {{ style: 'card' | 'tag', state: 'open' | 'in' | 'out', next?: boolean, w: number, flip?: boolean }} o
 */
export function slot(ctx, s, e, x, y, o) {
  const h = SLOT_H[o.style], human = e !== null && T.isHuman(s, e), out = o.state === 'out';
  ctx.fillStyle = out ? C.margin : C.black;
  ctx.fillRect(x, y, o.w, h);
  if (human && !out) {                                   // a human's slot: a red bar on the bracket's outer side
    ctx.fillStyle = C.hogg;
    ctx.fillRect(o.flip ? x + o.w - 2 : x, y, 2, h);
  }
  frame(ctx, x, y, o.w, h, o.next ? C.kit : out ? C.blackLight : o.state === 'in' ? (human ? C.hogg : C.grey2) : C.blackLight,
    o.next ? 2 : 1);
  if (e === null) {
    drawText(ctx, 'small-grey', '?', x + o.w / 2, y + Math.floor((h - 7) / 2), 'center');
    return;
  }
  const label = T.entrantLabel(s, e), font = out ? 'small-grey' : human ? 'small-red' : 'small';
  const tx = o.flip ? x + o.w - 5 : x + 5, al = o.flip ? 'right' : 'left';
  if (o.style === 'tag') drawText(ctx, font, label, x + o.w / 2, y + 3, 'center');
  else {
    drawText(ctx, font, label, tx, y + 3, al);
    drawText(ctx, out ? 'small-grey' : 'small', nameOf(s.chars[e]), tx, y + 13, al);
  }
}

function hline(ctx, x1, x2, y, colour, t = 1) {
  ctx.fillStyle = colour;
  ctx.fillRect(Math.min(x1, x2), y, Math.abs(x2 - x1), t);
}
function vline(ctx, x, y1, y2, colour, t = 1) {
  ctx.fillStyle = colour;
  ctx.fillRect(x, Math.min(y1, y2), t, Math.abs(y2 - y1) + 1);
}

/** The colour of the line a winner walks on: white, kit red for a human; grey while not decided. */
const lineColour = (/** @type {T.TournamentSetup} */ s, /** @type {number | null} */ w) =>
  w === null ? C.grey1 : T.isHuman(s, w) ? C.kit : C.white;

/** A slot's points in its match, on its line just outside it (black behind, so the line doesn't run through them). */
function points(ctx, str, won, x, yc, flip) {
  const w = textWidth('small', str), x0 = flip ? x - w - 2 : x;
  ctx.fillStyle = C.black;
  ctx.fillRect(x0, yc - 4, w + 2, 9);
  drawText(ctx, won ? 'small' : 'small-grey', str, x0 + 1, yc - 3);
}

/** The choices before a match: PLAY for a human's, WATCH / SKIP / SKIP TO MY MATCH for a bots'. */
export const choices = (/** @type {T.MatchInfo | null} */ m) =>
  !m ? ['BACK TO THE TITLE'] : m.mustPlay ? ['PLAY', 'QUIT TO TITLE'] : ['WATCH', 'SKIP', 'SKIP BOT MATCHES', 'QUIT TO TITLE'];

// --- the bracket: the whole of it, the two halves facing, the final and the trophy in the middle ---

/**
 * The bracket for 2–16: the first round as cards (label over name), later rounds as tags (the label), the halves
 * facing, the trophy and the final in the middle; the next match framed in red with the cursor; each slot's points
 * on its line. Below: the next match and the choices.
 * @param {CanvasRenderingContext2D} ctx @param {T.Tournament} t @param {number} [sel]
 */
export function bracket(ctx, t, sel = 0) {
  const s = t.setup, R = t.rounds.length, next = T.nextMatch(t), cx = WIDTH / 2;
  drawTitleBack(ctx);
  drawPanel(ctx, 'panel dark', 16, 6, 608, 348);
  drawText(ctx, 'large-red', next ? next.name : 'THE CHAMPION', cx, 12, 'center');
  const bots = s.size - s.humans;
  drawText(ctx, 'small-grey', `${s.size} PEOPLE, ${bots ? `${bots} ${bots === 1 ? 'BOT' : 'BOTS'}, BOT LEVEL: ${s.level}` : 'NO BOTS'}`,
    cx, 32, 'center');
  const half = s.size / 2, TOP = 48, BOTTOM = s.size >= 16 ? 228 : 208, pitch0 = (BOTTOM - TOP) / half;
  const W0 = 76, WT = 44, CENTRE = 92;
  const sideRoom = (608 - 16 - CENTRE) / 2, cols = Math.max(R - 1, 0);
  const used = W0 + cols * WT, GAP = Math.min(30, Math.floor((sideRoom - used) / Math.max(R, 1)));
  const colX = [28];
  for (let r = 1; r < R; r++) colX.push(colX[r - 1] + (r === 1 ? W0 : WT) + GAP);
  const yOf = (/** @type {number} */ r, /** @type {number} */ j) => TOP + pitch0 * ((j + 0.5) * 2 ** r);
  const ymid = Math.round(yOf(R - 1, 0));
  for (const side of [0, 1]) {
    for (let r = 0; r < R; r++) {
      const n = (s.size >> r) / 2, style = r === 0 ? 'card' : 'tag', h = SLOT_H[style], w = r === 0 ? W0 : WT;
      for (let j = 0; j < n; j++) {
        const global = side * n + j, match = Math.floor(global / 2), m = t.rounds[r][match];
        const e = T.playersOf(t, r, match)[global % 2];
        const state = e === null ? 'open' : m.winner === null || m.winner === e ? 'in' : 'out';
        const isNext = next?.round === r && next.index === match;
        const x = side ? WIDTH - colX[r] - w : colX[r], yc = Math.round(yOf(r, j)), y = yc - Math.floor(h / 2);
        const won = m.winner !== null && m.winner === e, tk = won ? 2 : 1, col = won ? lineColour(s, e) : C.grey1;
        const lx0 = side ? x : x + w;
        if (r < R - 1) {
          const lx1 = side ? x - Math.floor(GAP / 2) : x + w + Math.floor(GAP / 2), ym = Math.round(yOf(r + 1, Math.floor(j / 2)));
          hline(ctx, lx0, lx1, yc, col, tk);
          vline(ctx, side ? lx1 - tk + 1 : lx1, yc, ym, col, tk);
          if (j % 2 === 0) {
            const lx2 = side ? x - GAP : x + w + GAP;
            hline(ctx, lx1, lx2, ym, m.winner === null ? C.grey1 : lineColour(s, m.winner), m.winner === null ? 1 : 2);
          }
        } else {                                       // a finalist: on into the champion's slot in the middle
          hline(ctx, lx0, side ? cx + 30 : cx - 30, yc, col, tk);
        }
        slot(ctx, s, e, x, y, { style, state, next: isNext, w, flip: !!side });
        if (m.scores && e !== null) points(ctx, String(m.scores[global % 2]), won, side ? x - 2 : x + w + 2, yc, !!side);
      }
    }
  }
  // the middle: the trophy, the champion's slot, FINAL under it
  const champ = T.champion(t);
  piece(ctx, 'trophy small', cx - 1, ymid - 12);
  slot(ctx, s, champ, cx - 30, ymid - 6, { style: 'tag', state: champ === null ? 'open' : 'in', w: 60 });
  drawText(ctx, 'small-red', 'FINAL', cx, ymid + 12, 'center');
  // the next match and the choices
  const items = choices(next);
  let y = BOTTOM + 14;
  if (next) {
    const [p, q] = next.sides;
    drawText(ctx, 'small-grey', `NEXT: FIRST TO ${next.length}${
      next.attempt > 1 ? `, TRY ${next.attempt}` : ''}`, cx, y, 'center');
    drawText(ctx, 'large-white', `${T.entrantLabel(s, p)} ${nameOf(s.chars[p])}  v  ${T.entrantLabel(s, q)} ${nameOf(s.chars[q])}`,
      cx, y + 11, 'center');
    y += 34;
  }
  drawList(ctx, items, sel, cx, y, { font: 'large-white', center: true, row: items.length > 2 ? 19 : 24 });
}

// --- round title cards, over the court before a match ---

/**
 * A round's title card on a dark band across the front wall: the round's name in the 28 px lettering, the match
 * length, the two players.
 * @param {CanvasRenderingContext2D} ctx @param {T.Tournament} t @param {number} r @param {number} i
 */
export function roundCard(ctx, t, r, i) {
  const s = t.setup, info = T.matchInfo(t, r, i), cx = WIDTH / 2;
  drawCourt(ctx);
  const BY = 96, BH = 84;
  drawPanel(ctx, 'panel dark', 120, BY, 400, BH);
  drawText(ctx, 'huge-red', info.name, cx, BY + 10, 'center');
  drawText(ctx, 'small-grey', `FIRST TO ${info.length}, WIN BY 2${info.cpu[0] || info.cpu[1] ? `, LEVEL ${info.level}` : ''}${
    info.attempt > 1 ? `, TRY ${info.attempt}` : ''}`, cx, BY + 46, 'center');
  const [a, b] = info.sides;
  const la = `${T.entrantLabel(s, a)} ${nameOf(s.chars[a])}`, lb = `${T.entrantLabel(s, b)} ${nameOf(s.chars[b])}`;
  drawText(ctx, 'large-white', 'v', cx, BY + 58, 'center');
  drawText(ctx, T.isHuman(s, a) ? 'large-red' : 'large-white', la, cx - 16, BY + 58, 'right');
  drawText(ctx, T.isHuman(s, b) ? 'large-red' : 'large-white', lb, cx + 16, BY + 58, 'left');
}

/** All five cards' lettering on their bands (the sheet's look). @param {CanvasRenderingContext2D} ctx */
export function roundCardSheet(ctx) {
  drawCourt(ctx);
  ['ROUND OF 16', 'QUARTER-FINAL', 'SEMI-FINAL', 'FINAL'].forEach((n, i) => {
    const y = 20 + i * 64;
    drawPanel(ctx, 'panel dark', 120, y, 400, 50);
    drawText(ctx, 'huge-red', n, WIDTH / 2, y + 11, 'center');
  });
}

// --- the champion ---

/**
 * The champion: the trophy, the winner beside it, their line, and each human's wins and tries.
 * @param {CanvasRenderingContext2D} ctx @param {T.Tournament} t
 */
export function championScreen(ctx, t) {
  const s = t.setup, champ = T.champion(t), cx = WIDTH / 2;
  drawTitleBack(ctx);
  drawPanel(ctx, 'panel dark', 16, 6, 608, 348);
  drawText(ctx, 'huge-red', 'CHAMPION', cx, 14, 'center');
  if (champ === null) return;
  const id = s.chars[champ], ch = hogg.roster.find(c => c.id === id);
  // a red plinth line, the trophy on it, the champion beside it (the select screen's preview, in P1's red kit)
  const FLOOR = 262;
  ctx.fillStyle = C.red2;
  ctx.fillRect(56, FLOOR, 200, 3);
  ctx.fillStyle = C.hogg;
  ctx.fillRect(56, FLOOR, 200, 1);
  piece(ctx, 'trophy', 112, FLOOR);
  if (ch) {
    const a = previewOf(ch, T.isHuman(s, champ) ? 0 : 1), tag = ch.sheetOf.tags[previewTag(ch.sheetOf)], cell = a.cells[tag.from];
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(a.canvas, cell.x, cell.y, 150, 150, 196 - 74, FLOOR - 149, 150, 150);
    ctx.restore();
  }
  drawText(ctx, T.isHuman(s, champ) ? 'large-red' : 'large-white', `${T.entrantLabel(s, champ)} ${nameOf(id)}`, 156, FLOOR + 12, 'center');
  drawText(ctx, 'small-grey', `WON THE ${s.size}-PLAYER TOURNAMENT`, 156, FLOOR + 32, 'center');
  // the humans' wins and tries
  const LX = 330;
  drawText(ctx, 'small-red', 'THE HUMANS', LX, 70);
  for (let h = 0; h < s.humans; h++) {
    const rec = T.humanRecord(t, h), y = 86 + h * 34;
    drawText(ctx, h === champ ? 'large-white' : 'large-red', `P${h + 1} ${nameOf(s.chars[h])}`, LX, y);
    drawText(ctx, 'small-grey', `${rec.wins} ${rec.wins === 1 ? 'win' : 'wins'} in ${rec.tries} ${rec.tries === 1 ? 'try' : 'tries'}${
      rec.out ? `, out in the ${rec.out}` : ''}`, LX, y + 18);
  }
  drawList(ctx, ['BACK TO THE TITLE'], 0, 470, 312, { font: 'large-white', center: true });
}

// --- saving ---

/** Draw one mockup on a fresh 640×360 canvas and post it to the server. @param {string} name @param {(ctx: CanvasRenderingContext2D) => void} draw */
export async function save(name, draw) {
  const c = document.createElement('canvas');
  c.width = WIDTH; c.height = HEIGHT;
  const ctx = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
  ctx.imageSmoothingEnabled = false;
  draw(ctx);
  const res = await fetch(`/save/a12-${name}.png`, { method: 'POST', body: c.toDataURL('image/png') });
  return res.text();
}

/** Every mockup. */
export async function saveAll() {
  await loadSheet();
  const t16 = playedTo(16, 2, [1, 2]);                  // 16, two humans: round of 16 done, a bots' QF next
  const t8 = playedTo(8, 1, [1, 0], 777);               // 8, one human: P1's semi-final next
  const t4 = playedTo(4, 1, [0, 1], 99);                // 4, one human: a bots' semi-final next
  const t2 = playedTo(2, 2, [0, 0], 5);                 // 2: just a final, two humans
  const done = playedTo(8, 2, [-1, -1], 4242);          // a finished 8 with two humans
  const out = [];
  out.push(await save('bracket-16', ctx => bracket(ctx, t16)));
  out.push(await save('bracket-8', ctx => bracket(ctx, t8)));
  out.push(await save('bracket-4', ctx => bracket(ctx, t4)));
  out.push(await save('bracket-2', ctx => bracket(ctx, t2)));
  const n8 = T.nextMatch(t8);
  if (n8) out.push(await save('round-card', ctx => roundCard(ctx, t8, n8.round, n8.index)));
  out.push(await save('round-cards', ctx => roundCardSheet(ctx)));
  out.push(await save('champion', ctx => championScreen(ctx, done)));
  return out;
}
