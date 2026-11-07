// @ts-check
// The roster (S15; docs/decisions.md, "Characters"): assets/characters.json lists the characters players can pick, each
// a name, a sheet and optional skin and hair recolours (sprites.js, Colouring). Characters are looks only: the sim
// never sees them. A sheet must keep player-100's contract (docs/art-style-guide.md §3: the same tags, frame counts and
// contact frames, the feet slice and the racket slices), so any character's sheet can be swapped in; a character whose
// entry or sheet breaks it is left out with a console warning, and the rest still play.
// Node can import this file: only atlasOf and previewOf touch a canvas, and only when called.
import { parseSheet, buildAtlas, KIT_SWAP } from './sprites.js';

/**
 * The sheet contract: every tag the game plays, its frame count and, for the swings, the contact frame (0-based within
 * the tag, as in the sheet's `contact=<n>`: the swings meet the ball on their fourth frame) and that it plays once with a
 * `racket <tag>` slice. From player-100 (A2, A3, S8b).
 * @type {Record<string, { count: number, contact: number | null }>}
 */
export const SHEET_CONTRACT = {
  ready: { count: 8, contact: null },
  run_side: { count: 7, contact: null },
  run_up: { count: 7, contact: null },
  run_down: { count: 7, contact: null },
  serve: { count: 6, contact: 3 },
  forehand: { count: 8, contact: 3 },
  backhand: { count: 8, contact: 3 },
  overhead: { count: 8, contact: 3 },
  dive: { count: 14, contact: 3 },
};

/**
 * One roster entry, as characters.json gives it (the colours are checked by parseRoster).
 * @typedef {object} Character
 * @property {string} id      lower-case, unique (kept in the settings: P1's and P2's picks)
 * @property {string} name    shown on the select screen, the score panel and the result
 * @property {string} sheet   assets/<sheet>.png + .json
 * @property {[string, string][]} skin  [from, to] colours, everywhere
 * @property {[string, string][]} hair  [from, to] colours, on the head only
 */

const HEX = /^#[0-9a-f]{6}$/;
const ID = /^[a-z0-9][a-z0-9-]*$/;
/** The kit's reds: a recolour may neither take them (the kit swap owns them) nor make them (the white kit would turn
 * that skin or hair white). */
const KIT_REDS = new Set(KIT_SWAP.map(([from]) => from));

/**
 * What's wrong with a sheet against the contract (empty: it can be played).
 * @param {any} json  the sheet's Aseprite JSON
 * @returns {string[]}
 */
export function sheetProblems(json) {
  let sheet;
  try {
    sheet = parseSheet(json);
  } catch (e) {
    return [`it can't be read (${e instanceof Error ? e.message : e})`];
  }
  const out = [];
  for (const [name, want] of Object.entries(SHEET_CONTRACT)) {
    const t = sheet.tags[name];
    if (!t) { out.push(`no ${name} tag`); continue; }
    if (t.count !== want.count) out.push(`${name} has ${t.count} frames, not ${want.count}`);
    if (want.contact === null) {
      if (t.once) out.push(`${name} should loop`);
      continue;
    }
    if (!t.once) out.push(`${name} should play once`);
    if (t.contact !== want.contact) out.push(`${name}'s contact frame is ${t.contact}, not ${want.contact}`);
    if (!t.racket) out.push(`no "racket ${name}" slice`);
  }
  return out;
}

/** @param {any} list @param {string} what @param {string[]} out @returns {[string, string][]} */
function colourPairs(list, what, out) {
  if (list === undefined) return [];
  if (!Array.isArray(list)) { out.push(`${what} isn't a list`); return []; }
  /** @type {[string, string][]} */
  const pairs = [];
  for (const p of list) {
    if (!Array.isArray(p) || p.length !== 2 || !p.every(c => typeof c === 'string' && HEX.test(c))) {
      out.push(`${what} has ${JSON.stringify(p)}, not a pair of #rrggbb colours`);
    } else if (p.some(c => KIT_REDS.has(c))) {
      out.push(`${what} uses a kit red (${p.find(c => KIT_REDS.has(c))}), which the white kit would recolour`);
    } else pairs.push([p[0], p[1]]);
  }
  return pairs;
}

/**
 * Read characters.json: the characters that pass, and a line for each one left out.
 * @param {any} json
 * @returns {{ characters: Character[], problems: string[] }}
 */
export function parseRoster(json) {
  /** @type {Character[]} */
  const characters = [];
  const problems = [];
  const list = json?.characters;
  if (!Array.isArray(list)) return { characters, problems: ['characters.json has no "characters" list'] };
  list.forEach((c, i) => {
    const out = [];
    const id = c?.id;
    if (typeof id !== 'string' || !ID.test(id)) out.push('its id should be lower-case letters, digits or -');
    else if (characters.some(k => k.id === id)) out.push(`the id ${id} is used twice`);
    if (typeof c?.name !== 'string' || !c.name.trim()) out.push('it has no name');
    if (typeof c?.sheet !== 'string' || !ID.test(c.sheet)) out.push('its sheet should be a file name like player-100');
    const skin = colourPairs(c?.skin, 'skin', out), hair = colourPairs(c?.hair, 'hair', out);
    if (out.length) problems.push(`character ${i + 1} (${typeof id === 'string' ? id : '?'}): ${out.join('; ')}`);
    else characters.push({ id, name: c.name, sheet: c.sheet, skin, hair });
  });
  return { characters, problems };
}

/**
 * The name each side shows on the score panel, the wall and the result: the character's name, or P1 / P2 / CPU when
 * there's no roster, the name doesn't fit the panel's name slot, or both picked the same character (a mirror match:
 * the names alone wouldn't say who is who).
 * @param {(string | null)[]} names  each side's character name (null: none)
 * @param {boolean[]} cpu  which sides the CPU plays
 * @param {(name: string) => boolean} fits  the name fits the score panel's name slot
 * @returns {string[]}
 */
export function sideNames(names, cpu, fits) {
  const fallback = (/** @type {number} */ side) => (cpu[side] ? 'CPU' : `P${side + 1}`);
  const usable = names.every(n => n !== null && fits(n)) && names[0] !== names[1];
  return names.map((n, side) => (usable ? /** @type {string} */ (n) : fallback(side)));
}

/** The score panel's name slot (ui.json's `score panel p1 name`): the widest name, in large-white, px. */
export const NAME_SLOT = 62;

/**
 * A character ready to draw: its entry, its sheet and image, and its atlases (built when first needed: a full one per
 * kit for a match, a `ready`-only one per kit for the select screen). Kit 0 is P1's Hogg red, kit 1 P2 / the CPU's
 * white. A full atlas is about 7.6 MB of canvas (1232 × 1540 px), a `ready` one 0.76 MB, so only the match's two full
 * ones are kept (keepFor).
 * @typedef {Character & { sheetOf: import('./sprites.js').Sheet, image: HTMLImageElement,
 *   atlases: (import('./sprites.js').Atlas | undefined)[], previews: (import('./sprites.js').Atlas | undefined)[] }} Loaded
 */

/** @param {Character} ch @param {number} kit @returns {import('./sprites.js').Colouring} */
const colouring = (ch, kit) => ({ swap: kit ? KIT_SWAP : [], skin: ch.skin, hair: ch.hair });

/** A character's full atlas in a kit (built and kept on first use). @param {Loaded} ch @param {number} kit */
export function atlasOf(ch, kit) {
  return (ch.atlases[kit] ??= buildAtlas(ch.image, ch.sheetOf, colouring(ch, kit)));
}

/** A character's `ready` loop in a kit, for the select screen (built and kept on first use). @param {Loaded} ch @param {number} kit */
export function previewOf(ch, kit) {
  const t = ch.sheetOf.tags.ready;
  return (ch.previews[kit] ??= buildAtlas(ch.image, ch.sheetOf, colouring(ch, kit),
    Array.from({ length: t.count }, (_, i) => t.from + i)));
}

/**
 * Drop every full atlas but the match's: P1's character in kit 0 and P2's in kit 1.
 * @param {Loaded[]} roster @param {Loaded[]} match  P1's and P2's characters (the same one in a mirror match)
 */
export function keepFor(roster, match) {
  for (const ch of roster) {
    ch.atlases.forEach((_, kit) => { if (match[kit] !== ch) ch.atlases[kit] = undefined; });
  }
}
