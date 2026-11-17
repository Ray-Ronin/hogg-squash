-- A19z previews: Coach Zain's `trophy` tag (art/character/zain.aseprite) in both kits (the white kit by his `kit` swap).
-- art/mockups/a19z-trophy.png: at the top, the champion screen's middle as S18 draws it (the red line, A12's trophy
-- standing at TROPHY_X, the figure's feet at FIG_X, both at the game's 1:1 scale), P1 then P2 / CPU; under it every
-- frame of the tag, P1 then P2, on the court floor colour with the feet pivot marked. The whole image is 2x.
-- art/mockups/a19z-trophy-p1.gif and -p2.gif: the loop, 3x.
-- Run: Aseprite -b --script "C:/Hogg Squash/hogg-squash/art/tools/a19z-preview.lua"

local L = dofile("C:/Hogg Squash/hogg-squash/art/tools/pixel-lib.lua")
local R = L.ROOT
local pal = L.loadPalette(R .. "art/palette/hogg-squash.gpl")
local I = function(n) return L.paletteIndex(pal, n) end
local pc = app.pixelColor
local KIT = {
  [I("shirt black (A7z)")] = I("white kit shade"),
  [I("shirt black light (A7z)")] = I("white"),
  [I("shirt print (A7z)")] = I("black kit"),
}
local FLOOR = pc.rgba(223, 189, 140, 255)
local PANEL = pc.rgba(22, 22, 26, 255)      -- margin, as panel dark's body
local GUIDE = pc.rgba(40, 90, 220, 255)
local function rgb(i) local p = pal[i]; return pc.rgba(p[1], p[2], p[3], 255) end

-- A12's trophy, from the game's own sheet
local tsp = app.open(R .. "public/hogg-squash/assets/tournament.png")
app.command.ChangePixelFormat { format = "rgb" }
local tsheet = Image(tsp.width, tsp.height, ColorMode.RGB)
tsheet:drawSprite(tsp, 1)
tsp:close()
local TROPHY = { x = 2, y = 2, w = 64, h = 84, px = 32, py = 83 }   -- tournament.json, slice `trophy`

local spr = app.open(R .. "art/character/zain.aseprite")
local W, H = spr.width, spr.height
local tag
for _, t in ipairs(spr.tags) do if t.name == "trophy" then tag = t end end
if not tag then error("no trophy tag in zain.aseprite") end
local function grid(frame)
  local cel = spr.layers[1]:cel(frame)
  local q = { w = W, h = H, px = {} }
  for y = 0, H - 1 do
    q.px[y] = {}
    for x = 0, W - 1 do q.px[y][x] = 0 end
  end
  for it in cel.image:pixels() do
    local c = it()
    if c ~= 0 then
      local x, y = it.x + cel.position.x, it.y + cel.position.y
      if x >= 0 and y >= 0 and x < W and y < H then q.px[y][x] = c end
    end
  end
  return q
end
local frames = {}
for k = 0, tag.frames - 1 do
  local n = tag.fromFrame.frameNumber + k
  frames[#frames + 1] = { q = grid(n), ms = spr.frames[n].duration }
end

---------------------------------------------------------------- the still
local SC = 2
local LINE_X, LINE_W, TROPHY_X, FIG_X = 56, 200, 112, 196    -- CHAMPION_LAYOUT in js/ui/tournament.js
local PW, PH, FLOOR_Y = 260, 170, 155                         -- a crop of the screen around them
local COLS = #frames
local SW = (W + 4) * COLS
local out = Image(math.max(2 * PW, SW) * SC, (PH + 2 * (H + 4)) * SC, ColorMode.RGB)
out:clear(FLOOR)
local function put(x, y, v)
  for dy = 0, SC - 1 do for dx = 0, SC - 1 do out:drawPixel(x * SC + dx, y * SC + dy, v) end end
end

for kit = 1, 2 do
  local ox = (kit - 1) * PW
  for y = 0, PH - 1 do for x = 0, PW - 1 do put(ox + x, y, PANEL) end end
  for x = 0, LINE_W - 1 do
    for y = 0, 2 do put(ox + LINE_X - 30 + x, FLOOR_Y + y, rgb(y == 0 and I("Hogg red (court lines)") or I("red 2"))) end
  end
  for y = 0, TROPHY.h - 1 do for x = 0, TROPHY.w - 1 do
    local v = tsheet:getPixel(TROPHY.x + x, TROPHY.y + y)
    if pc.rgbaA(v) > 0 then put(ox + TROPHY_X - 30 - TROPHY.px + x, FLOOR_Y - TROPHY.py + y, v) end
  end end
  local q = frames[1].q
  if kit == 2 then q = L.remap(q, KIT) end
  for y = 0, H - 1 do for x = 0, W - 1 do
    local c = q.px[y][x]
    if c ~= 0 then put(ox + FIG_X - 30 - 73 + x, FLOOR_Y - 148 + y, rgb(c)) end
  end end
end

for kit = 1, 2 do
  local oy = PH + (kit - 1) * (H + 4)
  for k, fr in ipairs(frames) do
    local q = fr.q
    if kit == 2 then q = L.remap(q, KIT) end
    local ox = (k - 1) * (W + 4)
    for y = 0, H - 1 do for x = 0, W - 1 do
      local c = q.px[y][x]
      if c ~= 0 then put(ox + x, oy + y, rgb(c))
      elseif y == 148 or x == 73 then put(ox + x, oy + y, GUIDE) end
    end end
  end
end
out:saveAs(R .. "art/mockups/a19z-trophy.png")

---------------------------------------------------------------- the GIFs
for kit = 1, 2 do
  local g = Sprite(W, H, ColorMode.RGB)
  for _ = 2, #frames do g:newEmptyFrame() end
  for k, fr in ipairs(frames) do
    local q = fr.q
    if kit == 2 then q = L.remap(q, KIT) end
    local img = Image(W, H, ColorMode.RGB)
    img:clear(FLOOR)
    L.blit(img, pal, q, 0, 0)
    g:newCel(g.layers[1], k, img, Point(0, 0))
    g.frames[k].duration = fr.ms
  end
  g:resize(W * 3, H * 3)
  g:saveAs(R .. string.format("art/mockups/a19z-trophy-p%d.gif", kit))
  g:close()
end

---------------------------------------------------------------- checks
-- The shirt's entries in the shirt only: none above y 50 (the raised arms and the trophy; his collar is lowest at
-- y 55, in frame 1) and none in the lowest 30 rows (the shorts and legs). A leak would show in the white kit.
local SHIRT = { [I("shirt black (A7z)")] = true, [I("shirt black light (A7z)")] = true, [I("shirt print (A7z)")] = true }
local leaks, counted = 0, 0
for k, fr in ipairs(frames) do
  local _, top, _, soles = L.bounds(fr.q)
  local n = 0
  for y = 0, H - 1 do for x = 0, W - 1 do
    if SHIRT[fr.q.px[y][x]] then
      counted = counted + 1
      if y < 50 or y > soles - 30 then n = n + 1 end
    end
  end end
  leaks = leaks + n
  print(string.format("trophy %d: top y %d, soles y %d, %d shirt pixels out of place", k - 1, top, soles, n))
end
print(string.format("shirt check: %d shirt pixels, %d out of place", counted, leaks))
spr:close()
print("A19z previews done")
