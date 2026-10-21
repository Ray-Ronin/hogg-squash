-- A1 build: the ready-stance test sprite at 100 / 84 / 68 px, the swapped kit, the smooth-height
-- strips and GIF. Run in Aseprite (batch): dofile("C:/Hogg Squash/hogg-squash/art/tools/a1-build.lua")
-- Hand fixes to the cleaned sizes live in art/tools/a1-fixes.lua and are applied before saving.

local L = dofile("C:/Hogg Squash/hogg-squash/art/tools/pixel-lib.lua")
local R = L.ROOT
local pal = L.loadPalette(R .. "art/palette/hogg-squash.gpl")
local src = L.loadSource(R .. "art/spritecook/a1/concept-4.png")
local I = function(n) return L.paletteIndex(pal, n) end

local okFixes, FIX = pcall(dofile, R .. "art/tools/a1-fixes.lua")
if not okFixes then FIX = {} end

-- P2 / CPU kit: Hogg red -> white, black stays black.
local SWAP = {
  [I("red 1 (deepest)")] = I("grey 1"),
  [I("red 2")] = I("grey 2"),
  [I("tin")] = I("grey 3"),
  [I("Hogg red (court lines)")] = I("white kit shade"),
  [I("kit red")] = I("front wall"),
  [I("red highlight")] = I("white"),
}

local function clean(h)
  local q = L.cleanAt(pal, src, h)
  for _, p in ipairs(FIX[h] or {}) do q.px[p[2]][p[1]] = p[3] == 0 and 0 or I(p[3]) end
  return q
end

-- Indexed .aseprite file: one frame, tag `ready`, a `feet` slice with its pivot on the ground point.
local function saveAseprite(q, path)
  local fx, fy = L.feetX(q)
  local spr = Sprite(q.w, q.h, ColorMode.INDEXED)
  spr:setPalette(L.asepritePalette(pal))
  spr.transparentColor = 0
  local img = Image(q.w, q.h, ColorMode.INDEXED)
  for y = 0, q.h - 1 do for x = 0, q.w - 1 do img:drawPixel(x, y, q.px[y][x]) end end
  spr.cels[1].image = img
  spr.layers[1].name = "player"
  spr.frames[1].duration = 0.1
  local tag = spr:newTag(1, 1); tag.name = "ready"
  local fxi = math.floor(fx)
  local slice = spr:newSlice(Rectangle(fxi - 8, fy - 3, 16, 4))
  slice.name = "feet"
  slice.pivot = Point(fx - (fxi - 8), 3)
  spr:saveAs(path)
  spr:close()
end

local sizes = {}
for _, h in ipairs({ 100, 84, 68 }) do
  sizes[h] = clean(h)
  saveAseprite(sizes[h], R .. (h == 100 and "art/character/player.aseprite" or ("art/character/player-" .. h .. ".aseprite")))
end

----------------------------------------------------------------- previews

local FLOOR = app.pixelColor.rgba(223, 189, 140, 255)
local WALL = app.pixelColor.rgba(244, 244, 240, 255)
local INK = app.pixelColor.rgba(22, 22, 26, 255)

-- 3x5 digits and a few letters for labels.
local GLYPH = {
  ["1"] = { "010", "110", "010", "010", "111" }, ["2"] = { "110", "001", "010", "100", "111" },
  ["3"] = { "110", "001", "010", "001", "110" }, ["S"] = { "011", "100", "010", "001", "110" },
  ["0"] = { "010", "101", "101", "101", "010" }, ["4"] = { "101", "101", "111", "001", "001" },
  ["5"] = { "111", "100", "110", "001", "110" }, ["6"] = { "011", "100", "110", "101", "010" },
  ["7"] = { "111", "001", "010", "010", "010" }, ["8"] = { "010", "101", "010", "101", "010" },
  ["9"] = { "010", "101", "011", "001", "110" }, ["a"] = { "000", "011", "101", "101", "011" },
  ["b"] = { "100", "110", "101", "101", "110" }, [" "] = { "000", "000", "000", "000", "000" },
}
local function text(img, s, x, y, col, scale)
  scale = scale or 1
  for i = 1, #s do
    local g = GLYPH[s:sub(i, i)]
    if g then for gy = 1, 5 do for gx = 1, 3 do
      if g[gy]:sub(gx, gx) == "1" then
        for sy = 0, scale - 1 do for sx = 0, scale - 1 do
          img:drawPixel(x + ((i - 1) * 4 + gx - 1) * scale + sx, y + (gy - 1) * scale + sy, col)
        end end
      end
    end end end
  end
end

-- Place a grid with its ground point at (gx, gy).
local function place(img, q, gx, gy)
  local fx, fy = L.feetX(q)
  L.blit(img, pal, q, math.floor(gx - fx + 0.5), gy - fy)
end

-- Smooth (draw-time smoothing) version of the 100 px art at height h, alpha-blended onto img.
local function placeSmooth(img, q, h, gx, gy)
  local g = { w = q.w, h = q.h, px = {} }
  for y = 0, q.h - 1 do
    g.px[y] = {}
    for x = 0, q.w - 1 do
      local c = q.px[y][x]
      g.px[y][x] = c == 0 and { 0, 0, 0, 0 } or { pal[c][1], pal[c][2], pal[c][3], 255 }
    end
  end
  local f = L.areaResize(g, h)
  local nq = L.nearestResize(q, h)
  local fx, fy = L.feetX(nq)
  local ox, oy = math.floor(gx - fx + 0.5), gy - fy
  local pc = app.pixelColor
  for y = 0, f.h - 1 do for x = 0, f.w - 1 do
    local p = f.px[y][x]
    if p[4] > 0 then
      local bg = img:getPixel(ox + x, oy + y)
      local a = p[4]
      img:drawPixel(ox + x, oy + y, pc.rgba(
        math.floor(p[1] * a + pc.rgbaR(bg) * (1 - a) + 0.5),
        math.floor(p[2] * a + pc.rgbaG(bg) * (1 - a) + 0.5),
        math.floor(p[3] * a + pc.rgbaB(bg) * (1 - a) + 0.5), 255))
    end
  end end
end

-- The sprite at height h for each method.
local autoCache = {}
local function auto(h) if not autoCache[h] then autoCache[h] = L.cleanAt(pal, src, h) end return autoCache[h] end
local METHODS = {
  { label = "1", draw = function(img, h, gx, gy) place(img, L.nearestResize(sizes[100], h), gx, gy) end },
  { label = "1b", draw = function(img, h, gx, gy) placeSmooth(img, sizes[100], h, gx, gy) end },
  { label = "2", draw = function(img, h, gx, gy)
      local e = h % 2 == 0 and h or h + 1
      place(img, e == h and auto(h) or L.nearestResize(auto(e), h), gx, gy)
    end },
  { label = "3", draw = function(img, h, gx, gy)
      local base = h > 84 and 100 or (h > 68 and 84 or 68)
      place(img, base == h and sizes[base] or L.nearestResize(sizes[base], h), gx, gy)
    end },
}

local function saveScaled(img, path, s)
  local spr = Sprite(img.width, img.height, ColorMode.RGB)
  spr.cels[1].image = img
  if s and s > 1 then spr:resize(img.width * s, img.height * s) end
  spr:saveAs(path)
  spr:close()
end

-- Sizes sheet: 100 / 84 / 68 in both kits, on floor and on wall.
do
  local img = Image(420, 130, ColorMode.RGB)
  img:clear(FLOOR)
  for y = 0, 59 do for x = 0, 419 do img:drawPixel(x, y, WALL) end end
  local x = 40
  for _, kit in ipairs({ false, true }) do
    for _, h in ipairs({ 100, 84, 68 }) do
      local q = kit and L.remap(sizes[h], SWAP) or sizes[h]
      place(img, q, x, 118)
      text(img, tostring(h), x - 6, 122, INK)
      x = x + 66
    end
    x = x + 12
  end
  saveScaled(img, R .. "art/mockups/a1-sizes.png", 3)
end

-- Strips: every 2 px from 100 to 70, one row per method.
do
  local heights = {}
  for h = 100, 70, -2 do heights[#heights + 1] = h end
  local cw, rh = 62, 116
  local img = Image(24 + cw * #heights, rh * #METHODS + 10, ColorMode.RGB)
  img:clear(FLOOR)
  for m, M in ipairs(METHODS) do
    local gy = m * rh - 6
    text(img, M.label, 3, gy - 60, INK, 2)
    for i, h in ipairs(heights) do
      M.draw(img, h, 24 + (i - 0.5) * cw, gy)
      if m == 1 then text(img, tostring(h), 24 + (i - 0.5) * cw - 4, 2, INK) end
    end
  end
  saveScaled(img, R .. "art/mockups/a1-smooth-height-strips.png", 2)
end

-- GIF: the four methods side by side, height going 100 -> 70 -> 100 one pixel at a time.
do
  local cw = 80
  local W, H = cw * #METHODS, 126
  local spr = Sprite(W, H, ColorMode.RGB)
  local seq = {}
  for h = 100, 70, -1 do seq[#seq + 1] = h end
  for h = 71, 99 do seq[#seq + 1] = h end
  for i, h in ipairs(seq) do
    if i > 1 then spr:newEmptyFrame(i) end
    local img = Image(W, H, ColorMode.RGB)
    img:clear(FLOOR)
    for m, M in ipairs(METHODS) do
      text(img, M.label, (m - 1) * cw + 4, 4, INK, 2)
      M.draw(img, h, (m - 0.5) * cw, 118)
    end
    text(img, tostring(h), W - 16, 4, INK)
    spr:newCel(spr.layers[1], i, img, Point(0, 0))
    spr.frames[i].duration = (h == 100 or h == 70) and 0.6 or 0.06
  end
  spr:resize(W * 3, H * 3)
  spr:saveAs(R .. "art/mockups/a1-smooth-height.gif")
  spr:close()
end

-- Court mockup on the game's own court render (art/mockups/a1-court-base.png, drawn by drawCourt at 640x360).
-- Feet points and heights come from the game's project() and heightAt(): back (x -60, z 170) 97 px,
-- middle (x 45, z 100) 82 px in the swapped kit, front (x -25, z 28) 71 px. Method 1 (nearest-neighbour).
do
  local base = Image { fromFile = R .. "art/mockups/a1-court-base.png" }
  local img = Image(base.width, base.height, ColorMode.RGB)
  img:drawImage(base, Point(0, 0))
  local spots = { { 236, 323, 97, false }, { 365, 248, 82, true }, { 301, 206, 71, false } }
  table.sort(spots, function(a, b) return a[2] < b[2] end)   -- far first
  for _, s in ipairs(spots) do
    local q = L.nearestResize(sizes[100], s[3])
    if s[4] then q = L.remap(q, SWAP) end
    place(img, q, s[1], s[2])
  end
  saveScaled(img, R .. "art/mockups/a1-court-mockup.png", 2)
end

print("A1 build done")
