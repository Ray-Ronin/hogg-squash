-- Hogg Squash A5 (2026-10-22): the UI pieces, hand-built pixel by pixel (no SpriteCook).
-- Run: Aseprite.exe -b --script "C:/Hogg Squash/hogg-squash/art/tools/a5-ui.lua", then art/tools/a5-export.sh.
-- Writes art/ui/ui.aseprite (one frame, indexed on the shared palette) with one slice per piece, and the preview
-- art/mockups/a5-ui.png (the pieces in the HUD margins over the A4 court, at 2x). Pieces (slice names):
--   score panel p1 / p2   66 x 84, for the 78 px side margins: a coloured header (Hogg red for P1, white for P2 /
--                         CPU, like the kits) over a black body. Its parts are slices of their own, for the
--                         game to centre text in: "... name" (the header), "... score", "... serve" (the slot
--                         for the serve tag)
--   serve                 the serve indicator, a red tag with a ball and SERVE (46 x 11)
--   serve ball            the ball on its own (7 x 7), e.g. as a menu bullet
--   panel dark            9-slice (its centre is the slice's `center`): black with a red frame, for the margins
--                         and menus
--   panel light           9-slice: front-wall white with a red frame, for menus on the wall
--   highlight             9-slice: the bar behind the selected menu row (Hogg red)
--   cursor                a red arrow pointing right (mirror it for left)
--   callout <word>        POINT, OUT, TIN, DOWN, GAME, WINS in the huge red lettering (28 px capitals), and DOUBLE
--                         BOUNCE on two lines a size smaller (21 px),
--                         for the front wall
-- Text that changes (names, scores, "P1 WINS 11–9") is drawn with font.png at run time.

local R = "C:/Hogg Squash/hogg-squash/"
local P = dofile(R .. "art/tools/pixel-lib.lua")
local T = dofile(R .. "art/tools/a5-lib.lua")
local pal = P.loadPalette(R .. "art/palette/hogg-squash.gpl")
local function idx(name)
  for i, c in ipairs(pal) do if c[4] == name or c[4]:sub(1, #name + 1) == name .. " " then return i end end
  error("no palette colour " .. name)
end

local OUT, BLACK, BLACK_HI = idx("outline"), idx("black kit"), idx("black kit light")
local RED, KIT_RED, RED_HI, TIN = idx("Hogg red"), idx("kit red"), idx("red highlight"), idx("tin")
local WHITE, SHADE, GREY3, GREY2 = idx("white"), idx("white kit shade"), idx("grey 3"), idx("grey 2")
local WALL, SIDE = idx("front wall"), idx("side wall")

local W, H = 256, 256
local img = Image(W, H, ColorMode.INDEXED)
img:clear(0)
local slices = {}   -- { name, x, y, w, h, center = { x, y, w, h } (9-slice) }
local function px(x, y, c) img:drawPixel(x, y, c) end
local function rect(x, y, w, h, c) for yy = y, y + h - 1 do for xx = x, x + w - 1 do px(xx, yy, c) end end end
local function slice(name, x, y, w, h, center) slices[#slices + 1] = { name = name, x = x, y = y, w = w, h = h, center = center } end

-- A framed box: outline (corners cut), a frame colour, then the fill. Returns nothing; draws at x, y.
local function box(x, y, w, h, frame, fill)
  rect(x + 1, y, w - 2, h, OUT); rect(x, y + 1, w, h - 2, OUT)
  rect(x + 1, y + 1, w - 2, h - 2, frame)
  rect(x + 2, y + 2, w - 4, h - 4, fill)
end

-- Score panels -------------------------------------------------------------------------------------------------
local function scorePanel(name, x, y, head, headHi, headLo, frame)
  local w, h = 66, 84
  box(x, y, w, h, frame, BLACK)
  rect(x + 2, y + 2, w - 4, 20, head)               -- header, rows 2-21
  rect(x + 2, y + 2, w - 4, 1, headHi)
  rect(x + 2, y + 21, w - 4, 1, headLo)
  rect(x + 1, y + 22, w - 2, 1, OUT)                 -- divider
  rect(x + 2, y + 23, w - 4, 1, BLACK_HI)            -- the body's top edge catches the light
  -- a faint rule above the serve slot
  for xx = x + 6, x + w - 7, 2 do px(xx, y + 67, BLACK_HI) end
  slice(name, x, y, w, h)
  slice(name .. " name", x + 2, y + 2, w - 4, 20)
  slice(name .. " score", x + 2, y + 24, w - 4, 42)
  slice(name .. " serve", x + 2, y + 68, w - 4, 14)
end
scorePanel("score panel p1", 0, 0, RED, KIT_RED, TIN, RED)
scorePanel("score panel p2", 68, 0, SHADE, WHITE, GREY3, GREY3)

-- Serve tag and ball -------------------------------------------------------------------------------------------
local function ball(x, y)                            -- 7 x 7, like the in-match ball (A4) with a white rim
  local B = { "0011100", "0111110", "1111111", "1111111", "1111111", "0111110", "0011100" }
  for r = 1, 7 do for c = 1, 7 do
    if B[r]:sub(c, c) == "1" then
      local edge = (r == 1 or r == 7 or c == 1 or c == 7 or B[r]:sub(c - 1, c - 1) == "0" or B[r]:sub(c + 1, c + 1) == "0"
        or (B[r - 1] and B[r - 1]:sub(c, c) == "0") or (B[r + 1] and B[r + 1]:sub(c, c) == "0"))
      px(x + c - 1, y + r - 1, edge and OUT or BLACK)
    end
  end end
  px(x + 2, y + 2, GREY3); px(x + 3, y + 2, GREY2); px(x + 2, y + 3, GREY2)
end
do
  local x, y, w, h = 136, 0, 46, 11
  box(x, y, w, h, RED, RED)
  rect(x + 2, y + 1, w - 4, 1, KIT_RED)
  rect(x + 2, y + h - 2, w - 4, 1, TIN)
  -- the ball, on a white disc so it reads on the red
  for _, p in ipairs({ { 1, 0 }, { 2, 0 }, { 3, 0 }, { 0, 1 }, { 4, 1 }, { 0, 2 }, { 4, 2 }, { 0, 3 }, { 4, 3 }, { 1, 4 }, { 2, 4 }, { 3, 4 } }) do
    px(x + 3 + p[1], y + 3 + p[2], WHITE)
  end
  for _, p in ipairs({ { 1, 1 }, { 2, 1 }, { 3, 1 }, { 1, 2 }, { 2, 2 }, { 3, 2 }, { 1, 3 }, { 2, 3 }, { 3, 3 } }) do
    px(x + 3 + p[1], y + 3 + p[2], BLACK)
  end
  px(x + 4, y + 4, GREY3)
  T.put(img, T.text("SERVE", 1, { fill = WHITE }), x + 11, y + 2)
  slice("serve", x, y, w, h)
end
ball(186, 2)
slice("serve ball", 186, 2, 7, 7)

-- 9-slice panels -----------------------------------------------------------------------------------------------
do   -- dark: outline, red frame, a lighter inner line, black
  local x, y = 136, 16
  box(x, y, 24, 24, RED, BLACK)
  rect(x + 2, y + 2, 20, 1, BLACK_HI); rect(x + 2, y + 2, 1, 20, BLACK_HI)
  slice("panel dark", x, y, 24, 24, { x = 4, y = 4, w = 16, h = 16 })
end
do   -- light: outline, red frame, a side-wall shade inside the frame's bottom and right
  local x, y = 164, 16
  box(x, y, 24, 24, RED, WALL)
  rect(x + 2, y + 21, 20, 1, SIDE); rect(x + 21, y + 2, 1, 20, SIDE)
  slice("panel light", x, y, 24, 24, { x = 4, y = 4, w = 16, h = 16 })
end
do   -- highlight bar
  local x, y = 192, 16
  box(x, y, 16, 14, RED, RED)
  rect(x + 2, y + 1, 12, 1, RED_HI); rect(x + 2, y + 2, 12, 1, KIT_RED)
  rect(x + 2, y + 12, 12, 1, TIN)
  slice("highlight", x, y, 16, 14, { x = 4, y = 4, w = 8, h = 6 })
end

-- Cursor: an arrow pointing right, 8 x 11 ------------------------------------------------------------------------
do
  local x, y = 212, 16
  local A = { "11000000", "12100000", "13321000", "13332100", "13333210", "13333321", "13333210", "13332100", "13321000",
              "12100000", "11000000" }
  local C = { ["1"] = OUT, ["2"] = TIN, ["3"] = RED }
  for r = 1, #A do for c = 1, 8 do
    local k = A[r]:sub(c, c)
    if C[k] then px(x + c - 1, y + r - 1, C[k]) end
  end end
  for c = 2, 4 do px(x + c - 1, y + c, RED_HI) end    -- a highlight along the top edge
  slice("cursor", x, y, 8, 11)
end

-- Callouts -----------------------------------------------------------------------------------------------------
local RED_HUGE = { fill = RED, shade = TIN, shadeRow = 16, hi = RED_HI, outline = OUT, shadow = GREY3, drop = 2 }
local cy, cx, rowH = 92, 0, 0
-- A callout of one or more lines (split at "/"), each centred, 2 px apart, trimmed to the capitals.
local function callout(text, s)
  local st = s == 4 and RED_HUGE or { fill = RED, shade = TIN, shadeRow = 4 * s, hi = RED_HI, outline = OUT, shadow = GREY3, drop = 2 }
  local lines, w, h = {}, 0, 0
  for line in text:gmatch("[^/]+") do
    local q = T.text(line, s, st)
    local hh = 0      -- trim the empty descender rows under the capitals
    for y = 0, q.h - 1 do for x = 0, q.w - 1 do if q.px[y][x] ~= 0 then hh = y + 1 end end end
    lines[#lines + 1] = { q = q, h = hh }
    w = math.max(w, q.w)
    h = h + hh + (#lines > 1 and 2 or 0)
  end
  return lines, w, h
end
-- DOUBLE BOUNCE (the owner's word for a ball that bounces twice; "NOT UP" before) is on two lines (on one it
-- would be about 300 px wide, and the front wall is 220), and a size smaller (tripled, 21 px capitals), at the
-- owner's request.
for _, c in ipairs({ { "POINT", 4 }, { "OUT", 4 }, { "TIN", 4 }, { "DOWN", 4 }, { "GAME", 4 }, { "WINS", 4 }, { "DOUBLE/BOUNCE", 3 } }) do
  local text = c[1]
  local lines, w, h = callout(text, c[2])
  if cx + w > W then cx = 0; cy = cy + rowH + 2; rowH = 0 end
  local y = cy
  for _, l in ipairs(lines) do
    T.put(img, l.q, cx + (w - l.q.w) // 2, y)
    y = y + l.h + 2
  end
  slice("callout " .. text:gsub("/", " "), cx, cy, w, h)
  cx = cx + w + 2
  rowH = math.max(rowH, h)
end
local usedH = cy + rowH

-- Sprite, slices, save -------------------------------------------------------------------------------------------
local spr = Sprite(W, usedH, ColorMode.INDEXED)
spr:setPalette(P.asepritePalette(pal))
spr.transparentColor = 0
local crop = Image(W, usedH, ColorMode.INDEXED)
crop:clear(0)
for y = 0, usedH - 1 do for x = 0, W - 1 do local c = img:getPixel(x, y); if c ~= 0 then crop:drawPixel(x, y, c) end end end
spr.layers[1].name = "ui"
spr:newCel(spr.layers[1], 1, crop, Point(0, 0))
for _, s in ipairs(slices) do
  local sl = spr:newSlice(Rectangle(s.x, s.y, s.w, s.h))
  sl.name = s.name
  if s.center then sl.center = Rectangle(s.center.x, s.center.y, s.center.w, s.center.h) end
end
spr:saveAs(R .. "art/ui/ui.aseprite")

-- Preview: the HUD margins over the A4 court, callouts on the front wall, a menu on a dark panel. 2x.
local court = Image { fromFile = R .. "public/hogg-squash/assets/court.png" }
local pv = Image(640, 360, ColorMode.RGB)
pv:drawImage(court, Point(0, 0))
local function blitSlice(name, dx, dy, w, h)
  for _, s in ipairs(slices) do
    if s.name == name then
      local function src(xx, yy)                    -- 9-slice lookup when stretched
        if not s.center or (w == nil) then return xx, yy end
        local c = s.center
        local function map(v, size, c0, cw, full)
          if v < c0 then return v end
          if v >= size - (full - c0 - cw) then return full - (size - v) end
          return c0 + (v - c0) % cw
        end
        return map(xx, w, c.x, c.w, s.w), map(yy, h, c.y, c.h, s.h)
      end
      for yy = 0, (h or s.h) - 1 do for xx = 0, (w or s.w) - 1 do
        local sx, sy = src(xx, yy)
        local c = crop:getPixel(s.x + sx, s.y + sy)
        if c ~= 0 then local p = pal[c]; pv:drawPixel(dx + xx, dy + yy, app.pixelColor.rgba(p[1], p[2], p[3], 255)) end
      end end
    end
  end
end
local function textRGB(str, s, st, x, y, centre)
  local q = T.text(str, s, st)
  if centre then x = x - q.w // 2 end
  for yy = 0, q.h - 1 do for xx = 0, q.w - 1 do
    local c = q.px[yy][xx]
    if c ~= 0 then local p = pal[c]; pv:drawPixel(x + xx, y + yy, app.pixelColor.rgba(p[1], p[2], p[3], 255)) end
  end end
end
local LW = { fill = WHITE, shade = SHADE, shadeRow = 8, outline = OUT, shadow = RED, drop = 1 }
local LR = { fill = RED, shade = TIN, shadeRow = 8, outline = OUT, shadow = GREY3, drop = 1 }
local HW = { fill = WHITE, shade = SHADE, shadeRow = 16, outline = OUT, shadow = RED, drop = 2 }
blitSlice("score panel p1", 6, 16)
textRGB("P1", 2, LW, 6 + 33, 16 + 3, true)
textRGB("9", 4, HW, 6 + 33, 16 + 27, true)
blitSlice("serve", 6 + 10, 16 + 70)
blitSlice("score panel p2", 640 - 6 - 66, 16)
textRGB("CPU", 2, LR, 640 - 6 - 33, 16 + 3, true)
textRGB("11", 4, HW, 640 - 6 - 33, 16 + 27, true)
blitSlice("panel dark", 6, 108, 66, 30)
textRGB("FIRST TO 11", 1, { fill = GREY3 }, 6 + 33, 108 + 7, true)
textRGB("WIN BY 2", 1, { fill = GREY2 }, 6 + 33, 108 + 17, true)
blitSlice("callout DOUBLE BOUNCE", 320 - 54, 62)
textRGB("P1's point", 1, { fill = BLACK }, 320, 120, true)
-- a small menu, as S10 might lay it out
blitSlice("panel dark", 236, 170, 168, 70)
textRGB("1 PLAYER", 2, LW, 320, 178, true)
blitSlice("highlight", 260, 198, 136, 18)
blitSlice("cursor", 247, 202)
textRGB("2 PLAYERS", 2, LW, 320, 198, true)
textRGB("OPTIONS", 2, LW, 320, 218, true)
local big = Image(1280, 720, ColorMode.RGB)
for y = 0, 359 do for x = 0, 639 do
  local v = pv:getPixel(x, y)
  big:drawPixel(2 * x, 2 * y, v); big:drawPixel(2 * x + 1, 2 * y, v); big:drawPixel(2 * x, 2 * y + 1, v); big:drawPixel(2 * x + 1, 2 * y + 1, v)
end end
big:saveAs(R .. "art/mockups/a5-ui.png")
print("ui sheet " .. W .. "x" .. usedH .. ", " .. #slices .. " slices")
