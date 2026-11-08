-- A8z previews: every tag of art/character/zain.aseprite in both kits (the white kit by the planned `kit` swap).
-- art/mockups/a8z-strips.png: each tag as a row, P1 then P2 / CPU, 2x on the court floor colour, with the feet pivot
-- marked and a red bar under each contact frame. art/mockups/a8z-<tag>-p1.gif and -p2.gif: each tag playing, 3x.
-- Run: Aseprite -b --script "C:/Hogg Squash/hogg-squash/art/tools/a8z-preview.lua"

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
local GUIDE = pc.rgba(40, 90, 220, 255)
local CONTACT = pc.rgba(220, 20, 30, 255)

local spr = app.open(R .. "art/character/zain.aseprite")
local W, H = spr.width, spr.height
local function grid(frame)
  local cel = spr.layers[1]:cel(frame)
  local q = { w = W, h = H, px = {} }
  for y = 0, H - 1 do
    q.px[y] = {}
    for x = 0, W - 1 do q.px[y][x] = 0 end
  end
  if cel then
    for it in cel.image:pixels() do
      local c = it()
      if c ~= 0 then
        local x, y = it.x + cel.position.x, it.y + cel.position.y
        if x >= 0 and y >= 0 and x < W and y < H then q.px[y][x] = c end
      end
    end
  end
  return q
end
local tags = {}
for _, t in ipairs(spr.tags) do
  local ms = {}
  for i = 0, t.frames - 1 do ms[#ms + 1] = spr.frames[t.fromFrame.frameNumber + i].duration end
  tags[#tags + 1] = { name = t.name, from = t.fromFrame.frameNumber, n = t.frames, data = t.data, ms = ms }
end

local SC, GAP, COLS = 2, 4, 14
local cw, ch = (W + GAP) * SC, (H + GAP) * SC
local rows = #tags * 2
local out = Image(COLS * cw, rows * ch, ColorMode.RGB)
out:clear(FLOOR)
for row, t in ipairs(tags) do
  local contact = tonumber((t.data or ""):match("contact=(%d+)"))
  for kit = 1, 2 do
    local oy = ((row - 1) * 2 + kit - 1) * ch
    for k = 0, t.n - 1 do
      local q = grid(t.from + k)
      if kit == 2 then q = L.remap(q, KIT) end
      local ox = k * cw
      for y = 0, H - 1 do for x = 0, W - 1 do
        local c = q.px[y][x]
        local v
        if c ~= 0 then local p = pal[c]; v = pc.rgba(p[1], p[2], p[3], 255)
        elseif y == 148 or x == 73 then v = GUIDE end
        if v then
          for dy = 0, SC - 1 do for dx = 0, SC - 1 do out:drawPixel(ox + x * SC + dx, oy + y * SC + dy, v) end end
        end
      end end
      if k == contact then
        for y = H * SC + 1, H * SC + GAP * SC - 2 do for x = 0, W * SC - 1 do out:drawPixel(ox + x, oy + y, CONTACT) end end
      end
    end
  end
end
out:saveAs(R .. "art/mockups/a8z-strips.png")

for _, t in ipairs(tags) do
  for kit = 1, 2 do
    local g = Sprite(W, H, ColorMode.RGB)
    for i = 2, t.n do g:newEmptyFrame() end
    for k = 0, t.n - 1 do
      local q = grid(t.from + k)
      if kit == 2 then q = L.remap(q, KIT) end
      local img = Image(W, H, ColorMode.RGB)
      img:clear(FLOOR)
      L.blit(img, pal, q, 0, 0)
      g:newCel(g.layers[1], k + 1, img, Point(0, 0))
      g.frames[k + 1].duration = t.ms[k + 1]
    end
    g:resize(W * 3, H * 3)
    g:saveAs(R .. string.format("art/mockups/a8z-%s-p%d.gif", t.name, kit))
    g:close()
  end
end

-- The check the plan asks for: the shirt's entries appear in the shirt only. A shirt-coloured pixel on the shorts or
-- the legs (the lowest 30 rows of a standing frame, 12 of a lying one) or above his shoulders would mean the mask leaked.
local SHIRT = { [I("shirt black (A7z)")] = true, [I("shirt black light (A7z)")] = true, [I("shirt print (A7z)")] = true }
local leaks, counted = 0, 0
for _, t in ipairs(tags) do
  for k = 0, t.n - 1 do
    local q = grid(t.from + k)
    local _, top, _, soles = L.bounds(q)
    local isDive = t.name == "dive"
    local low = soles - (isDive and 12 or 30)
    local high = top + (isDive and 0 or 6)
    local inFrame = 0
    for y = 0, H - 1 do for x = 0, W - 1 do
      if SHIRT[q.px[y][x]] then
        counted = counted + 1
        if y > low or y < high then inFrame = inFrame + 1 end
      end
    end end
    if inFrame > 0 then
      leaks = leaks + inFrame
      print(string.format("  %s %d: %d shirt pixels outside the shirt's rows", t.name, k, inFrame))
    end
  end
end
print(string.format("shirt check: %d shirt pixels, %d outside the shirt's rows", counted, leaks))
spr:close()
print("A8z previews done")
