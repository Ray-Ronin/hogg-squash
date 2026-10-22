// @ts-check
// Bitmap text from A5's font (assets/font.png + font.json; docs/art-style-guide.md §3). Each font is one size in fixed
// colours, so text is never tinted: pick the font by name ('small', 'small-grey', 'large-red', 'huge-white', …).
// A glyph is `height` px tall at sheet (x, y), w wide; the pen advances by w + spacing (a space by space + spacing).
// A character the font lacks is drawn upper-cased if that exists, else as a space (the game's own text avoids them).
// Until the font is loaded (or if it fails to load) text falls back to plain canvas text of about the same size.

/**
 * @typedef {{ height: number, baseline: number, spacing: number, space: number,
 *   glyphs: Record<string, [number, number, number]> }} Font
 * @typedef {'small' | 'small-grey' | 'small-dark' | 'small-red' | 'large-white' | 'large-red' | 'huge-white' | 'huge-red'}
 *   FontName
 * @typedef {'left' | 'center' | 'right'} Align
 */

/** The loaded fonts and their sheet (null until useFont). @type {{ image: CanvasImageSource, fonts: Record<string, Font> } | null} */
let loaded = null;

/** Line heights for the fallback before the font loads (the fonts' own heights). */
const FALLBACK = { small: 9, large: 21, huge: 40 };
const FALLBACK_COLOURS = { white: '#ffffff', grey: '#8a8a94', dark: '#1b1b1b', red: '#c8102e' };

/**
 * Check font.json's shape and give back its fonts.
 * @param {any} json
 * @returns {Record<string, Font>}
 */
export function parseFonts(json) {
  if (!json || typeof json.fonts !== 'object') throw new Error('font.json: no fonts');
  for (const [name, f] of Object.entries(json.fonts)) {
    for (const k of ['height', 'baseline', 'spacing', 'space']) {
      if (typeof f[k] !== 'number') throw new Error(`font.json: ${name} has no ${k}`);
    }
    if (!f.glyphs || typeof f.glyphs !== 'object') throw new Error(`font.json: ${name} has no glyphs`);
  }
  return json.fonts;
}

/** Draw text with this font sheet from now on. @param {CanvasImageSource} image @param {any} json  font.json */
export function useFont(image, json) {
  loaded = { image, fonts: parseFonts(json) };
}

/**
 * The glyph for a character: itself, else upper-cased, else null (drawn as a space).
 * @param {Font} font @param {string} ch
 * @returns {[number, number, number] | null}
 */
export function glyphFor(font, ch) {
  return font.glyphs[ch] ?? font.glyphs[ch.toUpperCase()] ?? null;
}

/**
 * Width of a line of text in pixels (no spacing after the last character).
 * @param {Record<string, Font>} fonts @param {FontName} name @param {string} str
 */
export function measureWith(fonts, name, str) {
  const f = fonts[name];
  let w = 0;
  for (const ch of str) {
    const g = ch === ' ' ? null : glyphFor(f, ch);
    w += (g ? g[2] : f.space) + f.spacing;
  }
  return str.length ? w - f.spacing : 0;
}

/** Line height of a font in pixels (capitals plus descenders and any outline and shadow). @param {FontName} name */
export function lineHeight(name) {
  return loaded ? loaded.fonts[name].height : FALLBACK[/** @type {'small' | 'large' | 'huge'} */ (name.split('-')[0])];
}

/** Rows below the capitals that still belong to them: the outline's bottom row and the drop shadow. */
const CAPS_EXTRA = { small: 0, large: 2, huge: 3 };

/**
 * Height of the capitals as drawn (with their outline and shadow, without descenders), for centring text in a box.
 * @param {FontName} name
 */
export function capsHeight(name) {
  const size = /** @type {keyof typeof CAPS_EXTRA} */ (name.split('-')[0]);
  return (loaded ? loaded.fonts[name].baseline : Math.round(FALLBACK[size] * 0.75)) + CAPS_EXTRA[size];
}

/** Width of a line of text in pixels. @param {FontName} name @param {string} str */
export function textWidth(name, str) {
  if (loaded) return measureWith(loaded.fonts, name, str);
  return str.length * lineHeight(name) * 0.6;
}

/**
 * Draw one line of text with its top-left (or top-centre, top-right) at x, y. Drawn at whole pixels.
 * @param {CanvasRenderingContext2D} ctx
 * @param {FontName} name
 * @param {string} str
 * @param {number} x
 * @param {number} y  top of the line (the capitals start at the top; `baseline` px down is the row under them)
 * @param {Align} [align]
 */
export function drawText(ctx, name, str, x, y, align = 'left') {
  const w = textWidth(name, str);
  let pen = Math.round(align === 'center' ? x - w / 2 : align === 'right' ? x - w : x);
  y = Math.round(y);
  if (!loaded) {
    const h = lineHeight(name);
    const tone = /** @type {keyof typeof FALLBACK_COLOURS} */ (name.split('-')[1] ?? 'white');
    ctx.font = `bold ${Math.round(h * 0.8)}px monospace`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = FALLBACK_COLOURS[tone];
    ctx.fillText(str, pen, y);
    return;
  }
  const { image, fonts } = loaded, f = fonts[name];
  for (const ch of str) {
    const g = ch === ' ' ? null : glyphFor(f, ch);
    if (g) ctx.drawImage(image, g[0], g[1], g[2], f.height, pen, y, g[2], f.height);
    pen += (g ? g[2] : f.space) + f.spacing;
  }
}
