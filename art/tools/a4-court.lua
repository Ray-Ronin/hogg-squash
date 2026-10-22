-- Hogg Squash A4 (2026-10-22): the painted court, built over the frozen `wide` camera.
-- Run from anywhere: Aseprite.exe -b --script "C:/Hogg Squash/hogg-squash/art/tools/a4-court.lua"
-- Every pixel is classified by inverting the game's own projection (js/render/projection.js, CAMERA) at 6 x 6
-- samples per pixel, so the walls, floor and lines sit exactly where the code-drawn court puts them:
-- a surface wins a pixel by majority (the same 50% point as the canvas's antialiased edge), a line wins it at 35%
-- coverage (so the thinnest floor lines, under 1 px deep, never break up). The wood floor is SpriteCook asset
-- 216cea5b (art/spritecook/a4/wood.png), mapped onto the floor in perspective, averaged per pixel and locked to the
-- five wood colours. Writes art/court/court.aseprite (layers; the code-drawn court as a hidden reference layer),
-- public/hogg-squash/assets/court.png and art/mockups/a4-court-compare.png.

local R = "C:/Hogg Squash/hogg-squash/"
local L = dofile(R .. "art/tools/pixel-lib.lua")
local pal = L.loadPalette(R .. "art/palette/hogg-squash.gpl")
-- Palette index by name, or by the start of a name ("margin" for "margin (page and court margin)").
local function idx(name)
  for i, c in ipairs(pal) do if c[4] == name or c[4]:sub(1, #name + 1) == name .. " " then return i end end
  error("no palette colour " .. name)
end
local pc = app.pixelColor

local W, H = 640, 360

-- The frozen camera (projection.js CAMERA) and the court lines (sim/court-rules.js LINES), in game units.
local U = { x = 45, y = 35.2, z = 18.8 }
local CAM = { behindBack = 8.1, height = 4.0, focal = 557, cx = 320, cy = 70, widen = 1.1 }
local D0 = 183 / U.z + CAM.behindBack
local SIDE, BACK = 144, 183
local TIN, SERVICE, FRONT_OUT, BACK_OUT = 17, 63, 161, 75
local SHORT_Z, BOX_W, BOX_BACK_Z = 103, 72, 133
local WALL_TOP = 8
local LINE_M = 0.06
local HY, HZ, HX = LINE_M * U.y / 2, LINE_M * U.z / 2, LINE_M * U.x / 2
local GLASS_Z = BACK - 2 * HZ                 -- the glass edge: the code's glass line, inner half doubled

local function sideOut(z) return FRONT_OUT + (BACK_OUT - FRONT_OUT) * math.max(0, math.min(1, z / BACK)) end

-- Screen x of the side wall's foot at depth z (for the boards' lettering, spaced evenly on screen).
local function wallSx(sign, z)
  local d = D0 - z / U.z
  return CAM.cx + sign * SIDE / U.x * CAM.focal / d * CAM.widen
end

-- Boards on the side walls: "HOGG" on the left, "RAZORBACKS" on the right, between these depths and heights.
local BOARD = { z1 = 70, z2 = 178, y1 = 5, y2 = 27 }
local GLYPHS = {
  H = { "10001", "10001", "10001", "11111", "10001", "10001", "10001" },
  O = { "01110", "10001", "10001", "10001", "10001", "10001", "01110" },
  G = { "01110", "10001", "10000", "10111", "10001", "10001", "01111" },
  R = { "11110", "10001", "10001", "11110", "10100", "10010", "10001" },
  A = { "01110", "10001", "10001", "11111", "10001", "10001", "10001" },
  Z = { "11111", "00001", "00010", "00100", "01000", "10000", "11111" },
  B = { "11110", "10001", "10001", "11110", "10001", "10001", "11110" },
  C = { "01110", "10001", "10000", "10000", "10000", "10001", "01110" },
  K = { "10001", "10010", "10100", "11000", "10100", "10010", "10001" },
  S = { "01111", "10000", "10000", "01110", "00001", "00001", "11110" },
}
-- Board rows, top to bottom: outline, red, 7 glyph rows, red, Mission orange, Mission teal, outline.
local BOARD_ROWS = 13
local function boardBitmap(word)
  local cols = #word * 6 + 1                  -- 1 column of padding at each end, 1 between letters
  local function at(c, r)                     -- 0-based column and row → material
    if r == 0 or r == 12 then return "outline" end
    if r == 10 then return "orange" end
    if r == 11 then return "teal" end
    if r < 2 or r > 8 then return "board" end
    local i = c - 1
    if i < 0 or i >= #word * 6 - 1 then return "board" end
    local g, gc = word:sub(i // 6 + 1, i // 6 + 1), i % 6
    if gc == 5 then return "board" end
    return GLYPHS[g][r - 1]:sub(gc + 1, gc + 1) == "1" and "text" or "board"
  end
  return { cols = cols, at = at }
end
local BOARDS = { [-1] = boardBitmap("HOGG"), [1] = boardBitmap("RAZORBACKS") }
local BOARD_SX = {}
for _, s in ipairs({ -1, 1 }) do
  local a, b = wallSx(s, BOARD.z1), wallSx(s, BOARD.z2)
  BOARD_SX[s] = { math.min(a, b), math.max(a, b) }
end

-- Wood texture, sampled in metres on the floor.
local wood = Image { fromFile = R .. "art/spritecook/a4/wood.png" }
local TEX_PER_M = 75                          -- texture px per metre: boards about 0.25 m wide
local woodR, woodG, woodB = {}, {}, {}
for y = 0, wood.height - 1 do
  for x = 0, wood.width - 1 do
    local v = wood:getPixel(x, y)
    local k = y * wood.width + x
    woodR[k], woodG[k], woodB[k] = pc.rgbaR(v), pc.rgbaG(v), pc.rgbaB(v)
  end
end
local WOOD = { idx("wood 1"), idx("wood 2"), idx("wood 3"), idx("floor"), idx("wood highlight") }

-- One sample → surface ("front", "side", "floor" or nil), material, and for the floor its texel.
local function sample(sx, sy)
  local dx, dy = sx - CAM.cx, sy - CAM.cy
  -- front wall
  local s0 = CAM.focal / D0
  local x = dx / (s0 * CAM.widen) * U.x
  local y = (CAM.height - dy / s0) * U.y
  if math.abs(x) <= SIDE and y >= 0 and y <= FRONT_OUT + WALL_TOP then
    if math.abs(y - TIN) <= HY or math.abs(y - SERVICE) <= HY or math.abs(y - FRONT_OUT) <= HY then return "front", "line" end
    if y < TIN then return "front", "tin" end
    return "front", "front"
  end
  -- floor
  if dy > 0 then
    local sc = dy / CAM.height
    local z = (D0 - CAM.focal / sc) * U.z
    local fx = dx / (sc * CAM.widen) * U.x
    if z >= 0 and z <= BACK and math.abs(fx) <= SIDE then
      local ax = math.abs(fx)
      if z >= GLASS_Z then return "floor", "glass" end
      if math.abs(z - SHORT_Z) <= HZ
        or (ax <= HX and z >= SHORT_Z and z <= BACK)
        or (math.abs(ax - (SIDE - BOX_W)) <= HX and z >= SHORT_Z and z <= BOX_BACK_Z)
        or (math.abs(z - BOX_BACK_Z) <= HZ and ax >= SIDE - BOX_W) then
        return "floor", "line"
      end
      local tu = math.floor((fx / U.x + 3.2) * TEX_PER_M) % wood.width
      local tv = math.floor(z / U.z * TEX_PER_M) % wood.height
      return "floor", "wood", tv * wood.width + tu, z
    end
  end
  -- side walls
  if dx ~= 0 then
    local sign = dx < 0 and -1 or 1
    local sc = dx / (sign * SIDE / U.x * CAM.widen)
    local z = (D0 - CAM.focal / sc) * U.z
    local wy = (CAM.height - dy / sc) * U.y
    if z >= 0 and z <= BACK and wy >= 0 and wy <= sideOut(z) + WALL_TOP then
      if math.abs(wy - sideOut(z)) <= HY then return "side", "line" end
      if z >= BOARD.z1 and z <= BOARD.z2 and wy >= BOARD.y1 and wy <= BOARD.y2 then
        local b, bx = BOARDS[sign], BOARD_SX[sign]
        -- the column from the pixel's centre, so every letter column is whole pixels (1 or 2 on the right wall)
        local c = math.floor((math.floor(sx) + 0.5 - bx[1]) / (bx[2] - bx[1]) * b.cols)
        local r = math.floor((BOARD.y2 - wy) / (BOARD.y2 - BOARD.y1) * BOARD_ROWS)
        return "side", b.at(math.max(0, math.min(b.cols - 1, c)), math.max(0, math.min(BOARD_ROWS - 1, r)))
      end
      return "side", "side"
    end
  end
  return nil, "margin"
end

local MAT = {
  margin = idx("margin"), front = idx("front wall"), side = idx("side wall"), tin = idx("tin"),
  line = idx("Hogg red (court lines)"), glass = idx("glass"),
  board = idx("Hogg red (court lines)"), text = idx("white"), outline = idx("outline"),
  orange = idx("Mission orange"), teal = idx("Mission teal"),
}
local LAYER_OF = {
  margin = "margin", front = "walls", side = "walls", tin = "walls", line = "lines", glass = "lines",
  board = "boards", text = "boards", outline = "boards", orange = "boards", teal = "boards", wood = "floor",
}

local function nearestWood(r, g, b)
  local best, bd = WOOD[1], math.huge
  for _, i in ipairs(WOOD) do
    local c = pal[i]
    local d = (c[1] - r) ^ 2 + (c[2] - g) ^ 2 + (c[3] - b) ^ 2
    if d < bd then best, bd = i, d end
  end
  return best
end

-- Classify every pixel.
local N = 6
local grid, surf = {}, {}                     -- grid[y][x] = { material, palette index }
for py = 0, H - 1 do
  grid[py], surf[py] = {}, {}
  for px = 0, W - 1 do
    local count, surfCount = {}, {}
    local wr, wg, wb, wn, wz = 0, 0, 0, 0, 0
    for j = 0, N - 1 do
      for i = 0, N - 1 do
        local s, m, t, z = sample(px + (i + 0.5) / N, py + (j + 0.5) / N)
        count[m] = (count[m] or 0) + 1
        surfCount[s or "margin"] = (surfCount[s or "margin"] or 0) + 1
        if t then wr, wg, wb, wn, wz = wr + woodR[t], wg + woodG[t], wb + woodB[t], wn + 1, wz + z end
      end
    end
    local m
    for _, lm in ipairs({ "line", "glass" }) do
      if (count[lm] or 0) >= 0.35 * N * N and (not m or count[lm] > count[m]) then m = lm end
    end
    if not m then
      local best = -1
      for k, c in pairs(count) do
        if k ~= "line" and k ~= "glass" and c > best then m, best = k, c end
      end
    end
    local s, sb = "margin", -1
    for k, c in pairs(surfCount) do if c > sb then s, sb = k, c end end
    local i
    if m == "wood" then
      -- pulled towards the plain floor colour, so the grain stays quiet behind the players and the ball: halfway at
      -- the back, more towards the front wall, where the boards are too small on screen to read without noise
      local f, t = pal[idx("floor")], 0.5 + 0.35 * (1 - wz / wn / BACK)
      i = nearestWood(wr / wn * (1 - t) + f[1] * t, wg / wn * (1 - t) + f[2] * t, wb / wn * (1 - t) + f[3] * t)
    else
      i = MAT[m]
    end
    grid[py][px] = { m, i }
    surf[py][px] = s
  end
end

-- Hand touches: a seam where the side walls meet the front wall, and a skirting shadow along the foot of the walls.
local SEAM, SCUFF = idx("grey 3"), idx("white kit shade")
for py = 0, H - 1 do
  for px = 0, W - 1 do
    local g = grid[py][px]
    if g[1] == "side" then
      local l, r = surf[py][px - 1], surf[py][px + 1]
      local below = py < H - 1 and surf[py + 1][px] or nil
      if l == "front" or r == "front" or below == "floor" then g[2] = SEAM end
    end
  end
end
-- Faint ball marks on the front wall, mostly between the tin and the service line (fixed seed, so it rebuilds the same).
math.randomseed(4)
for _ = 1, 40 do
  local px, py = math.random(214, 426), math.random(140, 192)
  if py < 160 then py = math.random(60, 192) end
  local g = grid[py][px]
  if g[1] == "front" then g[2] = SCUFF end
end

-- Build the .aseprite file: one layer per group, the code-drawn court as a hidden reference.
local spr = Sprite(W, H, ColorMode.INDEXED)
spr:setPalette(L.asepritePalette(pal))
spr.transparentColor = 0
local order = { "margin", "floor", "walls", "boards", "lines" }
local images = {}
for _, name in ipairs(order) do images[name] = Image(W, H, ColorMode.INDEXED) end
for py = 0, H - 1 do
  for px = 0, W - 1 do
    local g = grid[py][px]
    images[LAYER_OF[g[1]]]:drawPixel(px, py, g[2])
  end
end
local first = true
for _, name in ipairs(order) do
  local layer = first and spr.layers[1] or spr:newLayer()
  first = false
  layer.name = name
  spr:newCel(layer, 1, images[name], Point(0, 0))
end

-- The reference layer: the code-drawn court exported from the game (art/court/court-code.png), as nearest palette
-- colours (it is only for comparing; hidden, so it is not in the export).
local code = Image { fromFile = R .. "art/court/court-code.png" }
local refImg = Image(W, H, ColorMode.INDEXED)
local CODE = { margin = MAT.margin, front = MAT.front, side = MAT.side, floor = idx("floor"), line = MAT.line, tin = MAT.tin, glass = MAT.glass }
local codeClass = {}
for py = 0, H - 1 do
  codeClass[py] = {}
  for px = 0, W - 1 do
    local v = code:getPixel(px, py)
    local r, g, b = pc.rgbaR(v), pc.rgbaG(v), pc.rgbaB(v)
    local best, bd
    for k, i in pairs(CODE) do
      local c = pal[i]
      local d = (c[1] - r) ^ 2 + (c[2] - g) ^ 2 + (c[3] - b) ^ 2
      if not bd or d < bd then best, bd = k, d end
    end
    codeClass[py][px] = best
    refImg:drawPixel(px, py, CODE[best])
  end
end
local ref = spr:newLayer()
ref.name = "code court (reference)"
spr:newCel(ref, 1, refImg, Point(0, 0))
ref.isVisible = false
ref.stackIndex = 1

spr:saveAs(R .. "art/court/court.aseprite")
spr:saveCopyAs(R .. "public/hogg-squash/assets/court.png")

-- Line agreement: every code pixel whose nearest colour is the line red, against the painted lines.
local codeLines, matched, painted, near = 0, 0, 0, 0
for py = 0, H - 1 do
  for px = 0, W - 1 do
    local isCode = codeClass[py][px] == "line"
    local isPaint = grid[py][px][1] == "line"
    if isCode then codeLines = codeLines + 1; if isPaint then matched = matched + 1 end end
    if isPaint then
      painted = painted + 1
      local ok = false
      for oy = -1, 1 do for ox = -1, 1 do
        local row = codeClass[py + oy]
        if row and row[px + ox] == "line" then ok = true end
      end end
      if ok then near = near + 1 end
    end
  end
end
print(string.format("code line px %d, painted as line %d (%.1f%%); painted line px %d, within 1 px of a code line %d (%.1f%%)",
  codeLines, matched, 100 * matched / codeLines, painted, near, 100 * near / painted))

-- Comparison mockup: painted | the code-drawn court's lines laid over the painted court (cyan where the code's line
-- pixels fall, so any line that doesn't match shows as cyan on a non-red pixel) | a 3x crop of the left service box.
local flat = Image(spr.spec)
flat:drawSprite(spr, 1)
local CROP = { x = 120, y = 230, w = 140, h = 60, k = 3 }
local cw = 640 * 2 + 4 + CROP.w * CROP.k
local cmp = Image(cw, 360, ColorMode.RGB)
cmp:clear(pc.rgba(22, 22, 26, 255))
local function rgbOf(i) local c = pal[i]; return pc.rgba(c[1], c[2], c[3], 255) end
local CYAN = pc.rgba(0, 255, 255, 255)
for py = 0, H - 1 do
  for px = 0, W - 1 do
    local c = rgbOf(flat:getPixel(px, py))
    cmp:drawPixel(px, py, c)
    if codeClass[py][px] == "line" and grid[py][px][1] ~= "line" then c = CYAN
    elseif codeClass[py][px] == "line" then c = pc.rgba(0, 120, 120, 255) end
    cmp:drawPixel(644 + px, py, c)
  end
end
for py = 0, CROP.h - 1 do
  for px = 0, CROP.w - 1 do
    local sx, sy = CROP.x + px, CROP.y + py
    local c = rgbOf(flat:getPixel(sx, sy))
    if codeClass[sy][sx] == "line" and grid[sy][sx][1] ~= "line" then c = CYAN
    elseif codeClass[sy][sx] == "line" then c = pc.rgba(0, 120, 120, 255) end
    for oy = 0, CROP.k - 1 do for ox = 0, CROP.k - 1 do
      cmp:drawPixel(1288 + px * CROP.k + ox, 100 + py * CROP.k + oy, c)
    end end
  end
end
cmp:saveAs(R .. "art/mockups/a4-court-compare.png")
spr:close()
