-- Hogg Squash A5 (2026-10-22): the bitmap font, hand-built pixel by pixel (no SpriteCook).
-- Run: Aseprite.exe -b --script "C:/Hogg Squash/hogg-squash/art/tools/a5-font.lua"
-- Writes art/ui/font.aseprite (one layer per font), public/hogg-squash/assets/font.png + font.json, and the
-- preview art/mockups/a5-font.png. The glyphs and styles are in art/tools/a5-lib.lua.
--
-- Fonts (each a size and a colour; the game picks one, it never tints):
--   small, small-grey, small-dark, small-red   5x7 capitals, lowercase, 1 px apart; white, grey, black, Hogg red
--   large-white, large-red                     doubled (14 px capitals), outlined, a 1 px drop shadow
--   huge-white, huge-red                       doubled twice (28 px capitals), outlined, a 2 px drop shadow
-- The -white fonts are for the dark margins (a Hogg red shadow), the -red ones for the white walls.
--
-- font.json: { image, fonts: { <name>: { height, baseline, spacing, space, glyphs: { <char>: [x, y, w] } } } }.
-- Every glyph of a font is `height` px tall (the cell, descenders included) at its sheet x, y; draw it at the
-- pen position and advance by w + spacing (spacing can be negative: outlines touch). A space advances by `space`
-- + spacing. `baseline` is the cell row just under the capitals.

local R = "C:/Hogg Squash/hogg-squash/"
local P = dofile(R .. "art/tools/pixel-lib.lua")
local T = dofile(R .. "art/tools/a5-lib.lua")
local pal = P.loadPalette(R .. "art/palette/hogg-squash.gpl")
local function idx(name)
  for i, c in ipairs(pal) do if c[4] == name or c[4]:sub(1, #name + 1) == name .. " " then return i end end
  error("no palette colour " .. name)
end

local WHITE, SHADE, GREY, DARK = idx("white"), idx("white kit shade"), idx("grey 2"), idx("black kit")
local RED, TIN, RED_HI, GREY3, OUT = idx("Hogg red"), idx("tin"), idx("red highlight"), idx("grey 3"), idx("outline")

local function whiteStyle(s, drop)
  return { fill = WHITE, shade = SHADE, shadeRow = 4 * s, outline = OUT, shadow = RED, drop = drop }
end
local function redStyle(s, drop)
  return { fill = RED, shade = TIN, shadeRow = 4 * s, hi = s >= 4 and RED_HI or nil, outline = OUT, shadow = GREY3, drop = drop }
end
local FONTS = {
  { name = "small", s = 1, st = { fill = WHITE } },
  { name = "small-grey", s = 1, st = { fill = GREY } },
  { name = "small-dark", s = 1, st = { fill = DARK } },
  { name = "small-red", s = 1, st = { fill = RED } },
  { name = "large-white", s = 2, st = whiteStyle(2, 1) },
  { name = "large-red", s = 2, st = redStyle(2, 1) },
  { name = "huge-white", s = 4, st = whiteStyle(4, 2) },
  { name = "huge-red", s = 4, st = redStyle(4, 2) },
}

-- Lay every font out on one sheet, wrapping at SHEET_W.
local SHEET_W = 512
local placed, y = {}, 0
for _, f in ipairs(FONTS) do
  local x, rowH = 0, 0
  f.glyphs = {}
  for _, ch in ipairs(T.chars(T.CHARS)) do
    local g = T.styled(ch, f.s, f.st)
    if x + g.w > SHEET_W then x = 0; y = y + rowH + 1; rowH = 0 end
    placed[#placed + 1] = { f = f, g = g, x = x, y = y }
    f.glyphs[#f.glyphs + 1] = { ch = ch, x = x, y = y, w = g.w }
    f.height = g.h
    x = x + g.w + 1
    rowH = math.max(rowH, g.h)
  end
  f.baseline = T.CAP * f.s + (f.st.outline and 1 or 0)
  f.spacing = T.spacing(f.s, f.st)
  y = y + rowH + 3
end
local H = y

local spr = Sprite(SHEET_W, H, ColorMode.INDEXED)
spr:setPalette(P.asepritePalette(pal))
spr.transparentColor = 0
for i, f in ipairs(FONTS) do
  local layer = i == 1 and spr.layers[1] or spr:newLayer()
  layer.name = f.name
  local img = Image(SHEET_W, H, ColorMode.INDEXED)
  img:clear(0)
  for _, p in ipairs(placed) do if p.f == f then T.put(img, p.g, p.x, p.y) end end
  spr:newCel(layer, 1, img, Point(0, 0))
end
spr:saveAs(R .. "art/ui/font.aseprite")
spr:saveCopyAs(R .. "public/hogg-squash/assets/font.png")

-- font.json
local function q(s) return '"' .. s:gsub('\\', '\\\\'):gsub('"', '\\"') .. '"' end
local out = { "{", '  "image": "font.png",', '  "fonts": {' }
for i, f in ipairs(FONTS) do
  out[#out + 1] = string.format('    %s: { "height": %d, "baseline": %d, "spacing": %d, "space": %d, "glyphs": {',
    q(f.name), f.height, f.baseline, f.spacing, T.SPACE * f.s)
  local parts = {}
  for _, g in ipairs(f.glyphs) do parts[#parts + 1] = string.format('%s: [%d, %d, %d]', q(g.ch), g.x, g.y, g.w) end
  for k = 1, #parts, 8 do
    local line = table.concat(parts, ", ", k, math.min(k + 7, #parts))
    out[#out + 1] = "      " .. line .. (k + 8 <= #parts and "," or "")
  end
  out[#out + 1] = "    } }" .. (i < #FONTS and "," or "")
end
out[#out + 1] = "  }"
out[#out + 1] = "}"
local fh = io.open(R .. "public/hogg-squash/assets/font.json", "w")
fh:write(table.concat(out, "\n") .. "\n")
fh:close()

-- Preview: sample lines on the margin colour and on the front wall, drawn from the JSON's own numbers (so it
-- also checks the advance and spacing), shown at 2x.
local fonts = {}
for _, f in ipairs(FONTS) do
  local gl = {}
  for _, g in ipairs(f.glyphs) do gl[g.ch] = g end
  fonts[f.name] = { f = f, gl = gl }
end
local sheet = Image(spr)
local function width(name, str)
  local F, w = fonts[name], 0
  for _, ch in ipairs(T.chars(str)) do
    w = w + (ch == " " and F.f.s * T.SPACE or F.gl[ch].w) + F.f.spacing
  end
  return w - F.f.spacing
end
local function write(img, name, str, x, yy)
  local F = fonts[name]
  for _, ch in ipairs(T.chars(str)) do
    if ch == " " then x = x + T.SPACE * F.f.s + F.f.spacing
    else
      local g = F.gl[ch]
      for dy = 0, F.f.height - 1 do for dx = 0, g.w - 1 do
        local c = sheet:getPixel(g.x + dx, g.y + dy)
        if c ~= 0 then img:drawPixel(x + dx, yy + dy, c) end
      end end
      x = x + g.w + F.f.spacing
    end
  end
end

local PW, PH = 640, 300
local pv = Image(PW, PH, ColorMode.INDEXED)
pv:clear(idx("margin"))
for yy = 0, PH - 1 do for xx = 330, PW - 1 do pv:drawPixel(xx, yy, idx("front wall")) end end
local yy = 6
for _, line in ipairs({ "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz", "0123456789 - – : . ! ? ' , / ( ) < > +" }) do
  write(pv, "small", line, 6, yy); write(pv, "small-dark", line, 336, yy); yy = yy + 11
end
write(pv, "small-grey", "FIRST TO 11  WIN BY 2", 6, yy); write(pv, "small-red", "P1's point  HARD to play again", 336, yy)
yy = yy + 14
write(pv, "large-white", "ABCDEFGHIJKLM", 6, yy); write(pv, "large-red", "NOPQRSTUVWXYZ", 336, yy); yy = yy + 22
write(pv, "large-white", "0123456789 11–9", 6, yy); write(pv, "large-red", "P1 WINS 11–9", 336, yy); yy = yy + 22
write(pv, "large-white", "Press any button!", 6, yy); write(pv, "large-red", "CPU to serve?", 336, yy); yy = yy + 26
write(pv, "huge-white", "0123456789", 6, yy); write(pv, "huge-red", "NOT UP", 336, yy); yy = yy + 40
write(pv, "huge-white", "11–9 CPU", 6, yy); write(pv, "huge-red", "POINT", 336, yy); yy = yy + 40
write(pv, "huge-white", "SQUASH", 6, yy); write(pv, "huge-red", "GAME", 336, yy)

local big = Image(PW * 2, PH * 2, ColorMode.RGB)
for py = 0, PH - 1 do for px = 0, PW - 1 do
  local c = pal[pv:getPixel(px, py)]
  local v = app.pixelColor.rgba(c[1], c[2], c[3], 255)
  big:drawPixel(2 * px, 2 * py, v); big:drawPixel(2 * px + 1, 2 * py, v)
  big:drawPixel(2 * px, 2 * py + 1, v); big:drawPixel(2 * px + 1, 2 * py + 1, v)
end end
big:saveAs(R .. "art/mockups/a5-font.png")
print("font sheet " .. SHEET_W .. "x" .. H)
