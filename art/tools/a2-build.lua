-- A2 build: the movement animations (ready, run_side, run_up, run_down, serve) at 100 px, one indexed sheet.
-- Run in Aseprite (batch): Aseprite -b --script "C:/Hogg Squash/hogg-squash/art/tools/a2-build.lua"
-- Every SpriteCook frame goes through pixel-lib at the same scale (A1's concept: 123 px tall -> 100 px), so the
-- character keeps one height and one ground line. Hand fixes live in art/tools/a2-fixes.lua.
-- Writes art/character/player.aseprite; export the sheet with art/tools/a2-export.sh.

local L = dofile("C:/Hogg Squash/hogg-squash/art/tools/pixel-lib.lua")
local R = L.ROOT
local pal = L.loadPalette(R .. "art/palette/hogg-squash.gpl")
local I = function(n) return L.paletteIndex(pal, n) end
local CELL = 140 -- SpriteCook pixel-engine cell (124 px source + 6% edge margin)

local okFixes, FIX = pcall(dofile, R .. "art/tools/a2-fixes.lua")
if not okFixes then FIX = {} end

-- Which SpriteCook frames (1-based) each tag uses, and how long each shows (ms).
-- serve follows the sim's swing (SWING in js/sim/player.js): contact 7 sim frames (122 ms) after the press,
-- ready again after 18 (314 ms). Its source frames 8-12 lose the racket, so it ends on frame 7.
local TAGS = {
  { name = "ready",    file = "ready.png",    frames = { 1, 2, 3, 4, 5, 6, 7, 8 }, ms = { 125 } },
  { name = "run_side", file = "run_side.png", frames = { 2, 3, 4, 5, 6, 7, 8 }, ms = { 75 } },
  { name = "run_up",   file = "run_up.png",   frames = { 2, 3, 4, 5, 6, 7, 8 }, ms = { 75 } },
  { name = "run_down", file = "run_down.png", frames = { 2, 3, 4, 5, 6, 7, 8 }, ms = { 75 } },
  { name = "serve",    file = "serve.png",    frames = { 2, 3, 4, 5, 6, 7 }, ms = { 40, 40, 42, 64, 64, 64 } },
}

-- Scale from A1: the opaque height of the source pose (frame 1 of `ready`) becomes 100 px.
local readyImg = Image { fromFile = R .. "art/spritecook/a2/ready.png" }
local _, top, _, bottom = L.gridBounds(L.loadCell(readyImg, 0, CELL, CELL))
local SCALE = 100 / (bottom - top + 1)
print(string.format("source height %d px, scale %.4f", bottom - top + 1, SCALE))

-- Clean every frame (all cells share one origin, so nothing moves between frames unless the art does).
local frames = {}
for _, t in ipairs(TAGS) do
  local img = Image { fromFile = R .. "art/spritecook/a2/" .. t.file }
  t.first = #frames + 1
  for i, f in ipairs(t.frames) do
    local q = L.cleanScaled(pal, L.loadCell(img, f - 1, CELL, CELL), SCALE)
    for _, p in ipairs((FIX[t.name] or {})[i] or {}) do q.px[p[2]][p[1]] = p[3] == 0 and 0 or I(p[3]) end
    frames[#frames + 1] = { q = q, ms = t.ms[i] or t.ms[1], tag = t.name, n = i, src = f }
  end
  t.last = #frames
end

-- Soles on the ground: the generator lifts the whole body by 1-7 px in some frames, which reads as floating
-- and foot sliding, so every frame's lowest pixel goes on the ready pose's sole line. a2-fixes.lua's
-- `offset[tag][n] = { dx, dy }` nudges single frames after that.
local function shift(q, dx, dy)
  local o = { w = q.w, h = q.h + 16, px = {} }
  for y = 0, o.h - 1 do
    o.px[y] = {}
    for x = 0, o.w - 1 do o.px[y][x] = L.at(q, x - dx, y - 8 - dy) end
  end
  return o
end
-- The torso's centre (rows 60-80 px above the soles). A torso that wanders sideways in a loop reads as sliding.
local function torsoX(q)
  local _, _, _, y1 = L.bounds(q)
  local sum, n = 0, 0
  for y = y1 - 80, y1 - 60 do for x = 0, q.w - 1 do
    if q.px[y][x] ~= 0 then sum = sum + x; n = n + 1 end
  end end
  return sum / n
end
-- In the run loops the generator sways the whole body 3-5 px to one side and back; the game already moves
-- the sprite, so run frames are centred on the ready pose's torso. ready and serve keep their own motion.
local RUNS = { run_side = true, run_up = true, run_down = true }
local _, _, _, ground = L.bounds(frames[1].q)
local torso0 = torsoX(frames[1].q)
for _, fr in ipairs(frames) do
  local _, _, _, y1 = L.bounds(fr.q)
  local off = ((FIX.offset or {})[fr.tag] or {})[fr.n] or { 0, 0 }
  local dx = RUNS[fr.tag] and math.floor(torso0 - torsoX(fr.q) + 0.5) or 0
  fr.q = shift(fr.q, dx + off[1], ground - y1 + off[2])
end

-- Canvas: the union of every frame's opaque bounds plus 1 px.
local ux0, uy0, ux1, uy1 = math.huge, math.huge, -1, -1
for _, fr in ipairs(frames) do
  local x0, y0, x1, y1 = L.bounds(fr.q)
  ux0 = math.min(ux0, x0); uy0 = math.min(uy0, y0); ux1 = math.max(ux1, x1); uy1 = math.max(uy1, y1)
end
ux0, uy0 = ux0 - 1, uy0 - 1
local W, H = ux1 - ux0 + 2, uy1 - uy0 + 2

-- Ground point from the first ready frame (the A1 pose): between the feet, on the soles.
local fx, fy = L.feetX(frames[1].q)
fx, fy = fx - ux0, fy - uy0

-- Report per frame: height, top and the torso's centre against the ready pose, for the cleanup notes.
torso0 = torsoX(frames[1].q)
for _, fr in ipairs(frames) do
  local x0, y0, x1, y1 = L.bounds(fr.q)
  print(string.format("%-8s %2d (src %2d): %dx%d  top %d  torso x %+.1f", fr.tag, fr.n, fr.src,
    x1 - x0 + 1, y1 - y0 + 1, y0 - uy0, torsoX(fr.q) - torso0))
end

local spr = Sprite(W, H, ColorMode.INDEXED)
spr:setPalette(L.asepritePalette(pal))
spr.transparentColor = 0
spr.layers[1].name = "player"
for i = 2, #frames do spr:newEmptyFrame() end
for i, fr in ipairs(frames) do
  local img = Image(W, H, ColorMode.INDEXED)
  for y = 0, fr.q.h - 1 do for x = 0, fr.q.w - 1 do
    local c = fr.q.px[y][x]
    if c ~= 0 then img:drawPixel(x - ux0, y - uy0, c) end
  end end
  spr:newCel(spr.layers[1], i, img, Point(0, 0))
  spr.frames[i].duration = fr.ms / 1000
end
for _, t in ipairs(TAGS) do
  local tag = spr:newTag(t.first, t.last)
  tag.name = t.name
end
local fxi = math.floor(fx)
local slice = spr:newSlice(Rectangle(fxi - 8, fy - 3, 16, 4))
slice.name = "feet"
slice.pivot = Point(fx - (fxi - 8), 3)
spr:saveAs(R .. "art/character/player.aseprite")
print(string.format("saved %dx%d, %d frames, feet at (%.1f, %d)", W, H, #frames, fx, fy))
spr:close()
