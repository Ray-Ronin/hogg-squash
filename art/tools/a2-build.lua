-- A2 + A3 build: every character animation at 100 px, one indexed sheet.
-- A2: ready, run_side, run_up, run_down, serve. A3: forehand, backhand, overhead, dive (dive and get-up in one tag).
-- Run in Aseprite (batch): Aseprite -b --script "C:/Hogg Squash/hogg-squash/art/tools/a2-build.lua"
-- Every SpriteCook frame goes through pixel-lib at the same scale (A1's concept: 123 px tall -> 100 px), so the
-- character keeps one height and one ground line. Hand fixes live in art/tools/a2-fixes.lua.
-- Writes art/character/player.aseprite; export the sheet with art/tools/a2-export.sh.

local L = dofile("C:/Hogg Squash/hogg-squash/art/tools/pixel-lib.lua")
local R = L.ROOT
local pal = L.loadPalette(R .. "art/palette/hogg-squash.gpl")
local I = function(n) return L.paletteIndex(pal, n) end
-- SpriteCook pixel-engine cells are square: 124 px source + the edge margin (A2: 6% -> 140 px; A3 used more
-- margin for the racket and the dive, so its cells are 164 and 188 px). Each file is read at its own height.

local okFixes, FIX = pcall(dofile, R .. "art/tools/a2-fixes.lua")
if not okFixes then FIX = {} end

-- Which SpriteCook frames (1-based) each tag uses, and how long each shows (ms).
-- serve follows the sim's swing (SWING in js/sim/player.js): contact 7 sim frames (122 ms) after the press,
-- ready again after 18 (314 ms). Its source frames 8-12 lose the racket, so it ends on frame 7.
-- A3 fields: `dir` (default a2), `contact` (the tag's contact frame, 1-based; exported as tag data
-- "contact=<0-based frame in the tag>"), `once` (plays once: repeat 1), `islands` (drop detached specks smaller
-- than this, e.g. the ball the generator draws near the racket), `ground` ("frame": each frame's soles on the
-- ground line, as in A2; "file": the whole tag moves with its source pose, so a dive keeps its own rise and fall).
-- A3 tags are lined up on the ready pose by their own frame 1 (the source pose), since their cells are bigger.
-- The swings are the sim's SWING like serve: 3 wind-up frames (122 ms), then contact and recovery to 314 ms.
-- The dive is the sim's DIVE: contact 7 sim frames (122 ms) in, back up after 115 (2003 ms).
local TAGS = {
  { name = "ready",    file = "ready.png",    frames = { 1, 2, 3, 4, 5, 6, 7, 8 }, ms = { 125 } },
  { name = "run_side", file = "run_side.png", frames = { 2, 3, 4, 5, 6, 7, 8 }, ms = { 75 } },
  { name = "run_up",   file = "run_up.png",   frames = { 2, 3, 4, 5, 6, 7, 8 }, ms = { 75 } },
  { name = "run_down", file = "run_down.png", frames = { 2, 3, 4, 5, 6, 7, 8 }, ms = { 75 } },
  { name = "serve",    file = "serve.png",    frames = { 2, 3, 4, 5, 6, 7 }, ms = { 40, 40, 42, 64, 64, 64 },
    contact = 4, once = true },
  { name = "forehand", dir = "a3", file = "forehand.png", frames = { 3, 5, 6, 7, 8, 9, 10, 11 },
    ms = { 40, 40, 42, 39, 38, 38, 38, 39 }, contact = 4, once = true, islands = 30, ground = "frame" },
  { name = "backhand", dir = "a3", file = "backhand.png", frames = { 4, 6, 7, 8, 9, 10, 11, 12 },
    ms = { 40, 40, 42, 39, 38, 38, 38, 39 }, contact = 4, once = true, islands = 30, ground = "frame" },
  { name = "overhead", dir = "a3", file = "overhead.png", frames = { 3, 5, 6, 7, 8, 9, 10, 11 },
    ms = { 40, 40, 42, 39, 38, 38, 38, 39 }, contact = 4, once = true, islands = 30, ground = "frame" },
  -- Dives to the right (the game mirrors it for left): lunge (122 ms), full stretch on contact, lying down for
  -- 1.4 s, get-up. The generator draws the lying body mid-cell, so every frame goes on the ground line.
  { name = "dive", dir = "a3", file = "dive.png", frames = { 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16 },
    ms = { 40, 40, 42, 100, 230, 230, 230, 230, 230, 231, 100, 100, 100, 100 }, contact = 4, once = true,
    islands = 30, ground = "frame" },
}

-- Scale from A1: the opaque height of the source pose (frame 1 of `ready`) becomes 100 px.
local readyImg = Image { fromFile = R .. "art/spritecook/a2/ready.png" }
local _, top, _, bottom = L.gridBounds(L.loadCell(readyImg, 0, readyImg.height, readyImg.height))
local SCALE = 100 / (bottom - top + 1)
print(string.format("source height %d px, scale %.4f", bottom - top + 1, SCALE))

-- The torso's centre (rows 60-80 px above the soles). A torso that wanders sideways in a loop reads as sliding.
-- nil for a frame with no torso there (the dive's lying frames).
local function torsoX(q)
  local _, _, _, y1 = L.bounds(q)
  local sum, n = 0, 0
  for y = math.max(0, y1 - 80), y1 - 60 do for x = 0, q.w - 1 do
    if q.px[y][x] ~= 0 then sum = sum + x; n = n + 1 end
  end end
  return n > 0 and sum / n or nil
end

-- Clean every frame (all cells of a file share one origin, so nothing moves between frames unless the art does).
local frames = {}
for _, t in ipairs(TAGS) do
  local img = Image { fromFile = R .. "art/spritecook/" .. (t.dir or "a2") .. "/" .. t.file }
  local cell = img.height
  local src0 = L.loadCell(img, 0, cell, cell)
  local h0 = select(4, L.gridBounds(src0)) - select(2, L.gridBounds(src0)) + 1
  if t.dir then
    -- The source pose, cleaned, to line this file up with the ready pose.
    local q1 = L.cleanScaled(pal, src0, SCALE)
    local _, _, _, y1 = L.bounds(q1)
    t.ref = { x = torsoX(q1), y = y1 }
  end
  t.first = #frames + 1
  for i, f in ipairs(t.frames) do
    local q = L.cleanScaled(pal, L.loadCell(img, f - 1, cell, cell), SCALE)
    local dropped = t.islands and L.dropIslands(q, t.islands) or 0
    for _, p in ipairs((FIX[t.name] or {})[i] or {}) do q.px[p[2]][p[1]] = p[3] == 0 and 0 or I(p[3]) end
    frames[#frames + 1] = { q = q, ms = t.ms[i] or t.ms[#t.ms], tag = t.name, n = i, src = f, t = t,
      dropped = dropped }
  end
  t.last = #frames
  print(string.format("%-8s %s: %d px cells, source pose %d px tall", t.name, t.file, cell, h0))
end

-- Soles on the ground: the generator lifts the whole body by 1-7 px in some frames, which reads as floating
-- and foot sliding, so every frame's lowest pixel goes on the ready pose's sole line. a2-fixes.lua's
-- `offset[tag][n] = { dx, dy }` nudges single frames after that. Frames are padded so nothing is cut off.
local PAD = 64
local function shift(q, dx, dy)
  local o = { w = q.w + 2 * PAD, h = q.h + 2 * PAD, px = {} }
  for y = 0, o.h - 1 do
    o.px[y] = {}
    for x = 0, o.w - 1 do o.px[y][x] = L.at(q, x - PAD - dx, y - PAD - dy) end
  end
  return o
end
-- In the run loops the generator sways the whole body 3-5 px to one side and back; the game already moves
-- the sprite, so run frames are centred on the ready pose's torso. ready, serve and the A3 tags keep their own
-- motion; A3 tags move as a whole so their source pose sits on the ready pose.
local RUNS = { run_side = true, run_up = true, run_down = true }
local _, _, _, ground = L.bounds(frames[1].q)
local torso0 = torsoX(frames[1].q)
for _, fr in ipairs(frames) do
  local _, _, _, y1 = L.bounds(fr.q)
  local off = ((FIX.offset or {})[fr.tag] or {})[fr.n] or { 0, 0 }
  local dx, dy = 0, ground - y1
  if RUNS[fr.tag] then dx = math.floor(torso0 - torsoX(fr.q) + 0.5) end
  if fr.t.ref then
    dx = math.floor(torso0 - fr.t.ref.x + 0.5)
    if fr.t.ground == "file" then dy = ground - fr.t.ref.y end
  end
  fr.q = shift(fr.q, dx + off[1], dy + off[2])
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

-- Report per frame: size, top, bottom against the ground line and the torso's centre against the ready pose.
torso0 = torsoX(frames[1].q)
for _, fr in ipairs(frames) do
  local x0, y0, x1, y1 = L.bounds(fr.q)
  local tx = torsoX(fr.q)
  print(string.format("%-8s %2d (src %2d): %dx%d  x %d-%d  top %d  soles %+d  torso x %s%s", fr.tag, fr.n, fr.src,
    x1 - x0 + 1, y1 - y0 + 1, x0 - ux0, x1 - ux0, y0 - uy0, y1 - uy0 - fy,
    tx and string.format("%+.1f", tx - torso0) or "-", fr.dropped > 0 and ("  dropped " .. fr.dropped) or ""))
end

-- a2-fixes.lua's `erase[tag][n] = { { x0, y0, x1, y1 }, ... }` clears rectangles given relative to the feet pivot
-- (so they stay put if the canvas grows), e.g. a ghost racket the generator leaves in a fast frame.
local function erased(fr, x, y)
  for _, r in ipairs(((FIX.erase or {})[fr.tag] or {})[fr.n] or {}) do
    local rx, ry = x - math.floor(fx), y - fy
    if rx >= r[1] and rx <= r[3] and ry >= r[2] and ry <= r[4] then return true end
  end
  return false
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
    if c ~= 0 and not erased(fr, x - ux0, y - uy0) then img:drawPixel(x - ux0, y - uy0, c) end
  end end
  spr:newCel(spr.layers[1], i, img, Point(0, 0))
  spr.frames[i].duration = fr.ms / 1000
end
for _, t in ipairs(TAGS) do
  local tag = spr:newTag(t.first, t.last)
  tag.name = t.name
  if t.once then tag.repeats = 1 end
  if t.contact then tag.data = "contact=" .. (t.contact - 1) end
  local total, before = 0, 0
  for i = t.first, t.last do
    if t.contact and i - t.first + 1 == t.contact then before = total end
    total = total + frames[i].ms
  end
  print(string.format("tag %-8s frames %d-%d, %d ms%s", t.name, t.first - 1, t.last - 1, total,
    t.contact and string.format(", contact on tag frame %d at %d ms", t.contact - 1, before) or ""))
end
local fxi = math.floor(fx)
local slice = spr:newSlice(Rectangle(fxi - 8, fy - 3, 16, 4))
slice.name = "feet"
slice.pivot = Point(fx - (fxi - 8), 3)
RACKET_SLICES_LIB = true                      -- S8b: the racket head's point on each contact frame
dofile(R .. "art/tools/racket-slices.lua").add(spr)
spr:saveAs(R .. "art/character/player.aseprite")
print(string.format("saved %dx%d, %d frames, feet at (%.1f, %d)", W, H, #frames, fx, fy))
spr:close()
