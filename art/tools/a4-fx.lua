-- Hogg Squash A4 (2026-10-22): the small in-match sprites, hand-built pixel by pixel (no SpriteCook).
-- Run: Aseprite.exe -b --script "C:/Hogg Squash/hogg-squash/art/tools/a4-fx.lua", then art/tools/a4-export.sh.
-- Writes art/fx/fx.aseprite: 48 x 48 frames, indexed on the shared palette, every item centred on the `centre`
-- slice's pixel (x 24, y 24; odd sizes reach half a pixel further right and down). Tags:
--   ball     5 frames, diameter 3 4 5 6 7 px  (the game's 0.05 m ball at depth z: 3 below z 36, 4 to 103, 5 to 145,
--            6 to 174, 7 beyond; the size follows depth only, as in project())
--   shadow   5 frames, one per ball size, 4 5 6 7 8 px wide (the code's ellipse, 1.2 r by 0.5 r)
--   landing  5 frames, the 0.3 m floor ring at z 40 80 115 145 172 (pick the nearest)
--   ring     6 frames, the front-wall impact ring (the code's 20 sim frames, about 348 ms)
--   sparkle  4 frames, the contact starburst (the code's 8 sim frames, about 139 ms)

local R = "C:/Hogg Squash/hogg-squash/"
local L = dofile(R .. "art/tools/pixel-lib.lua")
local pal = L.loadPalette(R .. "art/palette/hogg-squash.gpl")
local function idx(name)
  for i, c in ipairs(pal) do if c[4] == name or c[4]:sub(1, #name + 1) == name .. " " then return i end end
  error("no palette colour " .. name)
end

local S, C = 48, 24
local OUTLINE, BODY = idx("outline"), idx("black kit")
local SHINE, SHINE2 = idx("grey 3"), idx("grey 2")
local SH1, SH2 = idx("wood 1"), idx("wood 2")
local RED, RED_HI, TIN = idx("Hogg red"), idx("red highlight"), idx("tin")
local GREY3, GREY2 = idx("grey 3"), idx("white kit shade")
local FLASH, FLASH_SH, WHITE = idx("flash"), idx("flash shade"), idx("white")

-- Camera (projection.js CAMERA) for the landing ring's shape.
local U = { x = 45, y = 35.2, z = 18.8 }
local CAM = { height = 4.0, focal = 557, widen = 1.1 }
local D0 = 183 / U.z + 8.1

local frames = {}   -- { tag, image, ms }
local function newImage() return Image(S, S, ColorMode.INDEXED) end
local function put(img, x, y, c) if x >= 0 and y >= 0 and x < S and y < S then img:drawPixel(x, y, c) end end

-- Ball: a dark disc with an outline from 5 px, and a shine at the top left so it reads on the dark tin and boards.
for d = 3, 7 do
  local img = newImage()
  local cc = C + (d % 2) * 0.5
  local r2 = (d / 2) ^ 2
  local function inside(x, y) return (x + 0.5 - cc) ^ 2 + (y + 0.5 - cc) ^ 2 <= r2 + 0.1 end
  for y = C - 4, C + 4 do
    for x = C - 4, C + 4 do
      if inside(x, y) then
        local edge = not (inside(x - 1, y) and inside(x + 1, y) and inside(x, y - 1) and inside(x, y + 1))
        -- the two smallest are all outline black, for the most contrast against the dark tin near the front wall
        put(img, x, y, (edge or d <= 4) and OUTLINE or BODY)
      end
    end
  end
  if d == 3 then                               -- a plus, not a square
    for _, p in ipairs({ { -1, -1 }, { 1, -1 }, { -1, 1 }, { 1, 1 } }) do img:drawPixel(C + p[1], C + p[2], 0) end
    put(img, C, C - 1, SHINE2)
  else
    local top = math.floor(cc - d / 2 + 0.5)
    local sx, sy = top + (d >= 5 and 1 or 0), top + (d >= 5 and 1 or 0)
    put(img, sx, sy, SHINE)
    if d >= 6 then put(img, sx + 1, sy, SHINE2); put(img, sx, sy + 1, SHINE2) end
  end
  frames[#frames + 1] = { "ball", img, 100 }
end

-- Shadow: a flat ellipse in dark wood, one per ball size.
for d = 3, 7 do
  local img = newImage()
  local w, h = math.floor(1.2 * d + 0.5), math.max(2, math.floor(0.5 * d + 0.5))
  local x0, y0 = C - w // 2, C - h // 2
  local a, b = w / 2, h / 2
  for y = 0, h - 1 do
    for x = 0, w - 1 do
      local u, v = (x + 0.5 - a) / a, (y + 0.5 - b) / b
      local q = u * u + v * v
      if q <= 1.15 then put(img, x0 + x, y0 + y, (q > 0.55 and w >= 6) and SH2 or SH1) end
    end
  end
  frames[#frames + 1] = { "shadow", img, 100 }
end

-- Landing marker: the 0.3 m ring on the floor, foreshortened as at depth z, 1 px wide, with the code's 2 x 2 dot.
for _, z in ipairs({ 40, 80, 115, 145, 172 }) do
  local img = newImage()
  local d = D0 - z / U.z
  local a = 0.3 * CAM.focal / d * CAM.widen
  local b = 0.3 * CAM.height * CAM.focal / (d * d)
  local function inside(x, y, aa, bb) return ((x + 0.5 - C) / aa) ^ 2 + ((y + 0.5 - C) / bb) ^ 2 <= 1 end
  for y = C - 20, C + 20 do
    for x = C - 24, C + 23 do
      if inside(x, y, a, b) and not inside(x, y, math.max(0.5, a - 1), math.max(0.5, b - 1)) then put(img, x, y, RED) end
    end
  end
  for y = C - 1, C do for x = C - 1, C do put(img, x, y, RED) end end
  frames[#frames + 1] = { "landing", img, 100 }
end

-- Front-wall impact ring: grows from 3 to about 15 px radius and fades out towards the white of the wall.
local RING = { { 3, 2, RED }, { 5, 2, RED }, { 7.5, 1, RED }, { 10, 1, RED_HI }, { 12.5, 1, GREY3 }, { 15, 1, GREY2 } }
for i, rg in ipairs(RING) do
  local img = newImage()
  local r, w, c = rg[1], rg[2], rg[3]
  for y = C - 17, C + 17 do
    for x = C - 17, C + 17 do
      local dd = math.sqrt((x + 0.5 - C) ^ 2 + (y + 0.5 - C) ^ 2)
      if dd <= r + w / 2 and dd > r - w / 2 then
        if i < #RING or (x + y) % 2 == 0 then put(img, x, y, c) end
      end
    end
  end
  frames[#frames + 1] = { "ring", img, 58 }
end

-- Contact sparkle: an 8-ray starburst in the flash yellows, a white core on the first frame.
local SPARK = { { 6, FLASH, FLASH_SH }, { 9, FLASH, FLASH_SH }, { 11.5, FLASH, nil }, { 14, FLASH_SH, nil } }
local DIRS = { { 1, 0 }, { -1, 0 }, { 0, 1 }, { 0, -1 }, { 1, 1 }, { -1, 1 }, { 1, -1 }, { -1, -1 } }
for i, sp in ipairs(SPARK) do
  local img = newImage()
  local r, c, edge = sp[1], sp[2], sp[3]
  for k, dir in ipairs(DIRS) do
    local diag = k > 4
    local rr = diag and r * 0.75 or r                -- shorter diagonals, so it reads as a star
    for t = math.floor(rr * 0.4), math.floor(rr) do
      local x, y = C + dir[1] * t, C + dir[2] * t
      if dir[1] < 0 then x = x - 1 end                -- keep the burst symmetric about the centre corner
      if dir[2] < 0 then y = y - 1 end
      if edge and not diag then
        if dir[1] ~= 0 then put(img, x, y - 1, edge); put(img, x, y + 1, edge)
        else put(img, x - 1, y, edge); put(img, x + 1, y, edge) end
      end
      put(img, x, y, c)
    end
  end
  if i == 1 then
    for y = C - 1, C do for x = C - 1, C do put(img, x, y, WHITE) end end
  end
  frames[#frames + 1] = { "sparkle", img, 35 }
end

-- The sprite: frames in order, a tag per group, the centre slice.
local spr = Sprite(S, S, ColorMode.INDEXED)
spr:setPalette(L.asepritePalette(pal))
spr.transparentColor = 0
spr.layers[1].name = "fx"
for i = 2, #frames do spr:newEmptyFrame() end
local tagStart, tagName = 1, frames[1][1]
for i, f in ipairs(frames) do
  spr:newCel(spr.layers[1], i, f[2], Point(0, 0))
  spr.frames[i].duration = f[3] / 1000
  local nextName = frames[i + 1] and frames[i + 1][1]
  if nextName ~= tagName then
    local tag = spr:newTag(tagStart, i)
    tag.name = tagName
    tagStart, tagName = i + 1, nextName
  end
end
local DATA = {
  ball = "d=3,4,5,6,7", shadow = "for=ball", landing = "z=40,80,115,145,172",
}
for _, tag in ipairs(spr.tags) do
  if DATA[tag.name] then tag.data = DATA[tag.name] end
  if tag.name == "ring" or tag.name == "sparkle" then tag.repeats = 1 end
end
local slice = spr:newSlice(Rectangle(C, C, 1, 1))
slice.name = "centre"
spr:saveAs(R .. "art/fx/fx.aseprite")
spr:close()
